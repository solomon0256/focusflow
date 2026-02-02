
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

// --- NEW LEVEL SYSTEM CONFIGURATION ---
// Levels 1-25. 'req' is the EXP needed to go from this level to the next.
const LEVEL_CONFIG = [
    { level: 1, req: 800 },   // Kindergarten
    { level: 2, req: 1000 },  // Grade 1
    { level: 3, req: 1200 },  // Grade 2
    { level: 4, req: 1400 },  // Grade 3
    { level: 5, req: 1600 },  // Grade 4
    { level: 6, req: 1800 },  // Grade 5
    { level: 7, req: 2000 },  // Grade 6
    { level: 8, req: 2200 },  // Grade 7
    { level: 9, req: 2400 },  // Grade 8
    { level: 10, req: 2600 }, // Grade 9
    { level: 11, req: 2900 }, // Grade 10
    { level: 12, req: 3200 }, // Grade 11
    { level: 13, req: 3500 }, // Grade 12
    { level: 14, req: 3800 }, // Freshman
    { level: 15, req: 4200 }, // Sophomore
    { level: 16, req: 4600 }, // Junior
    { level: 17, req: 5000 }, // Senior
    { level: 18, req: 5800 }, // Master I
    { level: 19, req: 6600 }, // Master II
    { level: 20, req: 7600 }, // PhD I
    { level: 21, req: 8800 }, // PhD II
    { level: 22, req: 10200 },// PhD III
    { level: 23, req: 11800 },// Postdoc
    { level: 24, req: 13500 },// Assistant Professor
    { level: 25, req: 999999 }// Professor (Max)
];

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
      timeFormat: '24h', // Default to 24h
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
            else setUser({ id: 'guest_' + Date.now(), name: 'Guest', email: '', isPremium: false, pet: { level: 1, currentExp: 0, maxExp: 800, happiness: 100, streakCount: 0, lastDailyActivityDate: '' } });
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
          // 1. Add History Record
          const newRecord: FocusRecord = { id: Date.now().toString(), date: getLocalDateString(), durationMinutes: minutes, mode: currentSessionParams.mode, score: avgScore };
          setFocusHistory(prev => [...prev, newRecord]);
          
          // 2. Mark Task as Complete
          if (currentSessionParams.taskId && taskCompleted) {
              setTasks(prev => prev.map(t => t.id === currentSessionParams.taskId ? { ...t, completed: true } : t));
          }

          // 3. Economy System: 25-Level Architecture
          if (user) {
              const todayStr = getLocalDateString();
              const lastActive = user.pet.lastDailyActivityDate;
              let newStreak = user.pet.streakCount;

              // Streak Logic
              let isFirstLoginToday = false;
              if (lastActive !== todayStr) {
                  isFirstLoginToday = true;
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  const yesterdayStr = getLocalDateString(yesterday);

                  if (lastActive === yesterdayStr) {
                      newStreak += 1; // Continued streak
                  } else {
                      newStreak = 1; // Streak broken or new user
                  }
              }

              // --- EXP CALCULATION RULES ---
              // Rule 1: 1 min = 1 EXP (25 min = 25 EXP)
              let earnedExp = Math.floor(minutes);
              
              // Rule 2: Task Completion Bonus = +25 EXP
              if (taskCompleted) {
                  earnedExp += 25;
              }
              
              // Rule 3: Daily Login Bonus = +20 EXP (First session of the day)
              if (isFirstLoginToday) {
                  earnedExp += 20;
              }

              // Apply Score Multiplier (Implicit in base minutes, but we can add flow bonus)
              // If High Quality Focus (avgScore >= 90), add 10% bonus
              if (avgScore >= 90) {
                  earnedExp += Math.floor(minutes * 0.1);
              }

              let currentExp = user.pet.currentExp + earnedExp;
              let currentLevel = user.pet.level;

              // --- LEVEL UP LOGIC (Lookup Table) ---
              // Find config for current level (Adjust for 0-based index: Level 1 is index 0)
              let levelConfig = LEVEL_CONFIG[currentLevel - 1]; 
              
              // While we have enough EXP to advance, and we are not at MAX level
              while (levelConfig && currentExp >= levelConfig.req && currentLevel < 25) {
                  currentExp -= levelConfig.req;
                  currentLevel += 1;
                  levelConfig = LEVEL_CONFIG[currentLevel - 1]; // Update config for next iteration
              }

              // Update MaxExp for display (Requirement for NEXT level)
              const nextLevelReq = LEVEL_CONFIG[currentLevel - 1] ? LEVEL_CONFIG[currentLevel - 1].req : 999999;

              setUser(prev => prev ? ({
                  ...prev,
                  pet: {
                      ...prev.pet,
                      level: currentLevel,
                      currentExp: currentExp,
                      maxExp: nextLevelReq,
                      streakCount: newStreak,
                      lastDailyActivityDate: todayStr,
                      happiness: Math.min(100, prev.pet.happiness + 5) // Increase happiness
                  }
              }) : null);
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
            <SettingsView settings={settings} setSettings={setSettings} user={user} onLogin={() => setUser(prev => prev ? {...prev, name: 'Apple User'} : null)} onLogout={() => setUser(null)} onUpgrade={() => setUser(prev => prev ? {...prev, isPremium: true} : null)} onInjectData={(t, h, u) => { setTasks(t); setFocusHistory(h); setUser(u); }} />
        )}
      </main>
      {!isFocusSessionActive && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} settings={settings} />}
    </div>
  );
}

export default App;
