
import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import TimerView from './views/TimerView';
import TasksView from './views/TasksView';
import StatsView from './views/StatsView';
import SettingsView from './views/SettingsView';
import FocusSessionView from './views/FocusSessionView';
import { Task, Settings, Priority, FocusRecord, TimerMode, User, LanguageCode } from './types';
import { NativeService } from './services/native';
import { Zap } from 'lucide-react';

const STORAGE_KEYS = {
    TASKS: 'focusflow_tasks',
    HISTORY: 'focusflow_history',
    SETTINGS: 'focusflow_settings',
    USER: 'focusflow_user'
};

function App() {
  const [activeTab, setActiveTab] = useState('timer');
  const [isFocusSessionActive, setIsFocusSessionActive] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [currentSessionParams, setCurrentSessionParams] = useState<{
      mode: TimerMode;
      durationMinutes: number;
      taskId?: string;
  } | null>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [focusHistory, setFocusHistory] = useState<FocusRecord[]>([]);
  
  // Default language logic: ALWAYS default to 'en' unless a supported language is explicitly saved
  const [settings, setSettings] = useState<Settings>({
      workTime: 25, 
      shortBreakTime: 5, 
      longBreakTime: 15, 
      pomodorosPerRound: 4,
      notifications: [],
      customNotifications: [],
      stopwatchNotifications: [],
      language: 'en', // Strict default
      batterySaverMode: false
  });

  useEffect(() => {
    const initApp = async () => {
        try {
            const savedUser = await NativeService.Storage.get<User>(STORAGE_KEYS.USER);
            if (savedUser) {
                if (!savedUser.pet) {
                    savedUser.pet = { level: 1, currentExp: 0, maxExp: 300, happiness: 100, streakCount: 0, lastDailyActivityDate: '' };
                } else if (savedUser.pet.streakCount === undefined) {
                    // Runtime migration: Ensure streakCount exists for legacy users
                    savedUser.pet.streakCount = 0;
                }
                setUser(savedUser);
            } else {
                setUser({
                    id: 'guest_' + Date.now(),
                    name: 'Guest',
                    email: '',
                    isPremium: false,
                    pet: { level: 1, currentExp: 0, maxExp: 300, happiness: 100, streakCount: 0, lastDailyActivityDate: '' }
                });
            }
            
            const savedSettings = await NativeService.Storage.get<Settings>(STORAGE_KEYS.SETTINGS);
            if (savedSettings) {
                // Ensure language is one of the supported codes, else fallback to 'en'
                const supportedCodes: LanguageCode[] = ['en', 'zh', 'zh-TW', 'fr', 'ja', 'ko', 'es', 'ru', 'ar', 'de', 'hi'];
                if (!supportedCodes.includes(savedSettings.language)) {
                    savedSettings.language = 'en';
                }
                setSettings(savedSettings);
            }

            const savedTasks = await NativeService.Storage.get<Task[]>(STORAGE_KEYS.TASKS);
            if (savedTasks) setTasks(savedTasks);
            else {
                 const today = new Date().toISOString().split('T')[0];
                 setTasks([{ id: '1', title: 'Welcome to FocusFlow', date: today, time: '09:00', durationMinutes: 25, priority: Priority.HIGH, completed: false, pomodoroCount: 1, note: 'This is a local-first app.' }]);
            }
            const savedHistory = await NativeService.Storage.get<FocusRecord[]>(STORAGE_KEYS.HISTORY);
            if (savedHistory) setFocusHistory(savedHistory || []);
        } catch (e) { console.error('Initialization error:', e); } 
        finally { setTimeout(() => setIsAppReady(true), 500); }
    };
    initApp();
  }, []);

  useEffect(() => { if(isAppReady) NativeService.Storage.set(STORAGE_KEYS.TASKS, tasks); }, [tasks, isAppReady]);
  useEffect(() => { if(isAppReady) NativeService.Storage.set(STORAGE_KEYS.HISTORY, focusHistory); }, [focusHistory, isAppReady]);
  useEffect(() => { if(isAppReady) NativeService.Storage.set(STORAGE_KEYS.SETTINGS, settings); }, [settings, isAppReady]);
  useEffect(() => { if(isAppReady && user) NativeService.Storage.set(STORAGE_KEYS.USER, user); }, [user, isAppReady]);

  const addFocusRecord = (minutes: number, mode: TimerMode, date?: string) => {
      const newRecord: FocusRecord = {
          id: Date.now().toString() + Math.random(),
          date: date || new Date().toISOString().split('T')[0],
          durationMinutes: minutes,
          mode: mode
      };
      setFocusHistory(prev => [...prev, newRecord]);
      return newRecord;
  };

  const getTier = (days: number): number => {
      if (days >= 6) return 4;
      if (days >= 4) return 3;
      if (days >= 2) return 2;
      return 1;
  };

  const calculateMaxExp = (level: number) => {
      return 300 + Math.floor(Math.pow(level, 1.6) * 25);
  };

  const processStreakAndExp = (currentUser: User, minutes: number, dateStr: string, isTaskComplete: boolean = false) => {
      const pet = currentUser.pet;
      const lastActivityStr = pet.lastDailyActivityDate;
      
      let newStreak = pet.streakCount;
      let streakExp = 0;

      if (lastActivityStr !== dateStr) {
          if (lastActivityStr) {
              const lastDate = new Date(lastActivityStr);
              const currentDate = new Date(dateStr);
              const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
              
              if (diffDays === 1) newStreak += 1;
              else if (diffDays > 1) {
                  const oldTier = getTier(pet.streakCount);
                  newStreak = oldTier === 4 ? 2 : 1;
              } else {
                  newStreak = Math.max(1, newStreak);
              }
          } else {
              newStreak = 1;
          }
          const tier = getTier(newStreak);
          streakExp = tier === 4 ? 15 : tier === 3 ? 12 : tier === 2 ? 10 : 5;
      }

      const focusExp = minutes * 0.4;
      const taskExp = isTaskComplete ? 10 : 0;
      let newExp = pet.currentExp + streakExp + focusExp + taskExp;
      let newLevel = pet.level;
      let newMaxExp = pet.maxExp || calculateMaxExp(newLevel);

      while (newExp >= newMaxExp) {
          newLevel += 1;
          newExp -= newMaxExp;
          newMaxExp = calculateMaxExp(newLevel);
      }

      return {
          ...currentUser,
          pet: { 
              ...pet, 
              level: newLevel, 
              currentExp: newExp, 
              maxExp: newMaxExp, 
              streakCount: newStreak, 
              lastDailyActivityDate: dateStr, 
              happiness: Math.min(100, pet.happiness + (minutes > 12 ? 10 : 0)) 
          }
      };
  };

  const handleSimulate = (minutes: number, dateOffset: number = 0) => {
      const d = new Date();
      if (dateOffset !== 0) d.setDate(d.getDate() + dateOffset);
      const dateStr = d.toISOString().split('T')[0];
      
      addFocusRecord(minutes, TimerMode.POMODORO, dateStr);
      if (user) {
          setUser(processStreakAndExp(user, minutes, dateStr, false));
      }
      NativeService.Haptics.notificationSuccess();
  };

  const handleBreakStreak = () => {
      if (!user) return;
      const mockDate = new Date();
      mockDate.setDate(mockDate.getDate() - 2); 
      const mockDateStr = mockDate.toISOString().split('T')[0];
      setUser({ ...user, pet: { ...user.pet, lastDailyActivityDate: mockDateStr } });
      NativeService.Haptics.impactMedium();
  };

  const handleSessionComplete = (minutes: number, taskCompleted: boolean = false) => {
      if (currentSessionParams) {
          const dateStr = new Date().toISOString().split('T')[0];
          addFocusRecord(minutes, currentSessionParams.mode, dateStr);
          if (user) setUser(prev => prev ? processStreakAndExp(prev, minutes, dateStr, taskCompleted) : null);
          if (currentSessionParams.taskId && taskCompleted) {
              setTasks(prev => prev.map(t => t.id === currentSessionParams.taskId ? { ...t, completed: true } : t));
          }
      }
      setIsFocusSessionActive(false);
      setCurrentSessionParams(null);
  };

  if (!isAppReady) return <div className="h-screen w-full bg-[#f2f2f7] flex items-center justify-center"><Zap size={32} className="text-blue-500 animate-bounce"/></div>;

  return (
    <div className="h-screen w-full bg-[#f2f2f7] text-gray-900 overflow-hidden font-sans">
      <main className="h-full w-full">
        {isFocusSessionActive && currentSessionParams ? (
            <FocusSessionView mode={currentSessionParams.mode} initialTimeInSeconds={currentSessionParams.durationMinutes * 60} settings={settings} user={user} task={tasks.find(t => t.id === currentSessionParams.taskId)} onComplete={handleSessionComplete} onCancel={() => setIsFocusSessionActive(false)} onUpgradeTrigger={() => { setIsFocusSessionActive(false); setActiveTab('settings'); }} />
        ) : (
            activeTab === 'timer' ? <TimerView tasks={tasks.filter(t => !t.completed)} settings={settings} setSettings={setSettings} onRecordTime={addFocusRecord} onStartSession={(d, m, tId) => { setCurrentSessionParams({ durationMinutes: d, mode: m, taskId: tId }); setIsFocusSessionActive(true); }} /> :
            activeTab === 'tasks' ? <TasksView tasks={tasks} settings={settings} addTask={t => setTasks(prev => [...prev, t])} updateTask={t => setTasks(prev => prev.map(x => x.id === t.id ? t : x))} deleteTask={id => setTasks(prev => prev.filter(x => x.id !== id))} toggleTask={id => {
                const updatedTask = tasks.find(t => t.id === id);
                if (updatedTask && !updatedTask.completed && user) {
                    const dateStr = new Date().toISOString().split('T')[0];
                    setUser(processStreakAndExp(user, 0, dateStr, true));
                }
                setTasks(prev => prev.map(x => x.id === id ? { ...x, completed: !x.completed } : x))
            }} /> :
            activeTab === 'stats' ? <StatsView tasks={tasks} focusHistory={focusHistory} settings={settings} onSimulate={handleSimulate} onBreakStreak={handleBreakStreak} /> :
            <SettingsView settings={settings} setSettings={setSettings} user={user} onLogin={() => setUser(prev => prev ? {...prev, name: 'Apple User'} : null)} onLogout={() => setUser(null)} onUpgrade={() => setUser(prev => prev ? {...prev, isPremium: true} : null)} />
        )}
      </main>
      {!isFocusSessionActive && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} settings={settings} />}
    </div>
  );
}

export default App;