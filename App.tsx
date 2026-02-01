
import React, { useState, useEffect, useCallback } from 'react';
import BottomNav from './components/BottomNav';
import TimerView from './views/TimerView';
import TasksView from './views/TasksView';
import StatsView from './views/StatsView';
import SettingsView from './views/SettingsView';
import FocusSessionView from './views/FocusSessionView';
import { Task, Settings, Priority, FocusRecord, TimerMode, User, LanguageCode } from './types';
import { NativeService } from './services/native';
import { AudioService } from './services/audio';
import { Zap } from 'lucide-react';

const STORAGE_KEYS = {
    TASKS: 'focusflow_tasks',
    HISTORY: 'focusflow_history',
    SETTINGS: 'focusflow_settings',
    USER: 'focusflow_user'
};

export const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

function App() {
  const [activeTab, setActiveTab] = useState('timer');
  const [isFocusSessionActive, setIsFocusSessionActive] = useState(false);
  const [sessionPhase, setSessionPhase] = useState<'IDLE' | 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK'>('IDLE');
  const [isAppReady, setIsAppReady] = useState(false);
  const [currentSessionParams, setCurrentSessionParams] = useState<{
      mode: TimerMode;
      durationMinutes: number;
      taskId?: string;
  } | null>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [focusHistory, setFocusHistory] = useState<FocusRecord[]>([]);
  
  const [settings, setSettings] = useState<Settings>({
      workTime: 25, shortBreakTime: 5, longBreakTime: 15, pomodorosPerRound: 4,
      notifications: [], customNotifications: [], stopwatchNotifications: [],
      language: 'en', batterySaverMode: false, theme: 'system',
      soundEnabled: false, soundMode: 'timer', selectedSoundId: 'none', soundVolume: 0.5
  });

  // 全量初始化加载
  useEffect(() => {
    const initApp = async () => {
        try {
            const [u, s, t, h] = await Promise.all([
                NativeService.Storage.get<User>(STORAGE_KEYS.USER),
                NativeService.Storage.get<Settings>(STORAGE_KEYS.SETTINGS),
                NativeService.Storage.get<Task[]>(STORAGE_KEYS.TASKS),
                NativeService.Storage.get<FocusRecord[]>(STORAGE_KEYS.HISTORY)
            ]);
            if (u) setUser(u);
            else setUser({ id: 'guest_' + Date.now(), name: 'Guest', email: '', isPremium: false, pet: { level: 1, currentExp: 0, maxExp: 300, happiness: 100, streakCount: 0, lastDailyActivityDate: '' } });
            if (s) setSettings(prev => ({ ...prev, ...s }));
            if (t) setTasks(t);
            else setTasks([{ id: '1', title: 'Welcome to FocusFlow', date: getLocalDateString(), time: '09:00', durationMinutes: 25, priority: Priority.HIGH, completed: false, pomodoroCount: 1, note: 'This is a local-first app.' }]);
            if (h) setFocusHistory(h);
        } catch (e) { console.error('Init error:', e); } 
        finally { setIsAppReady(true); }
    };
    initApp();
  }, []);

  // 持久化同步
  useEffect(() => { if(isAppReady) NativeService.Storage.set(STORAGE_KEYS.TASKS, tasks); }, [tasks, isAppReady]);
  useEffect(() => { if(isAppReady) NativeService.Storage.set(STORAGE_KEYS.HISTORY, focusHistory); }, [focusHistory, isAppReady]);
  useEffect(() => { if(isAppReady) NativeService.Storage.set(STORAGE_KEYS.SETTINGS, settings); }, [settings, isAppReady]);
  useEffect(() => { if(isAppReady && user) NativeService.Storage.set(STORAGE_KEYS.USER, user); }, [user, isAppReady]);

  // 主题应用逻辑
  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = () => {
        const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
    };
    applyTheme();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', applyTheme);
    return () => mq.removeEventListener('change', applyTheme);
  }, [settings.theme]);

  // 音频编排
  useEffect(() => {
      if (!isAppReady) return;
      AudioService.setVolume(settings.soundVolume);
      if (settings.soundEnabled) {
          if (settings.soundMode === 'always') { AudioService.play(settings.selectedSoundId); AudioService.resume(); }
          else if (isFocusSessionActive && sessionPhase === 'WORK') AudioService.play(settings.selectedSoundId);
          else AudioService.pause();
      } else AudioService.stop();
  }, [settings.soundEnabled, settings.soundMode, settings.selectedSoundId, settings.soundVolume, isFocusSessionActive, sessionPhase, isAppReady]);

  // 辅助函数：通过用户点击激活 AudioContext
  const onUserInteraction = useCallback(() => {
    AudioService.play('none'); 
    window.removeEventListener('click', onUserInteraction);
  }, []);

  useEffect(() => {
    window.addEventListener('click', onUserInteraction);
    return () => window.removeEventListener('click', onUserInteraction);
  }, [onUserInteraction]);

  const handleSessionComplete = (minutes: number, taskCompleted: boolean = false, avgScore: number = 100) => {
      if (currentSessionParams) {
          const newRecord: FocusRecord = { id: Date.now().toString(), date: getLocalDateString(), durationMinutes: minutes, mode: currentSessionParams.mode, score: avgScore };
          setFocusHistory(prev => [...prev, newRecord]);
          if (currentSessionParams.taskId && taskCompleted) {
              setTasks(prev => prev.map(t => t.id === currentSessionParams.taskId ? { ...t, completed: true } : t));
          }
      }
      setIsFocusSessionActive(false); setSessionPhase('IDLE'); setCurrentSessionParams(null);
  };

  if (!isAppReady) return <div className="h-screen w-full bg-ios-bg dark:bg-ios-bg-dark flex items-center justify-center"><Zap size={32} className="text-blue-500 animate-bounce"/></div>;

  return (
    <div className="h-screen w-full bg-ios-bg dark:bg-ios-bg-dark text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
      <main className="h-full w-full">
        {isFocusSessionActive && currentSessionParams ? (
            <FocusSessionView 
                mode={currentSessionParams.mode} initialTimeInSeconds={currentSessionParams.durationMinutes * 60} 
                settings={settings} user={user} task={tasks.find(t => t.id === currentSessionParams.taskId)} 
                onComplete={handleSessionComplete} onCancel={() => setIsFocusSessionActive(false)} 
                onUpgradeTrigger={() => { setIsFocusSessionActive(false); setActiveTab('settings'); }} 
                onPhaseChange={setSessionPhase}
            />
        ) : (
            activeTab === 'timer' ? <TimerView tasks={tasks.filter(t => !t.completed)} settings={settings} setSettings={setSettings} onRecordTime={()=>{}} onStartSession={(d, m, tId) => { setCurrentSessionParams({ durationMinutes: d, mode: m, taskId: tId }); setIsFocusSessionActive(true); setSessionPhase('WORK'); }} /> :
            activeTab === 'tasks' ? <TasksView tasks={tasks} settings={settings} addTask={t => setTasks(prev => [...prev, t])} updateTask={t => setTasks(prev => prev.map(x => x.id === t.id ? t : x))} deleteTask={id => setTasks(prev => prev.filter(x => x.id !== id))} toggleTask={id => setTasks(prev => prev.map(x => x.id === id ? { ...x, completed: !x.completed } : x))} /> :
            activeTab === 'stats' ? <StatsView tasks={tasks} focusHistory={focusHistory} settings={settings} /> :
            <SettingsView settings={settings} setSettings={setSettings} user={user} onLogin={() => setUser(prev => prev ? {...prev, name: 'Apple User'} : null)} onLogout={() => setUser(null)} onUpgrade={() => setUser(prev => prev ? {...prev, isPremium: true} : null)} />
        )}
      </main>
      {!isFocusSessionActive && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} settings={settings} />}
    </div>
  );
}

export default App;
