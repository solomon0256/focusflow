
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
// Total EXP to max: approx 102,300 (~1400 hours)
const LEVEL_CONFIG = [
    { level: 1, req: 600 },    // Kindergarten
    { level: 2, req: 800 },    // Grade 1
    { level: 3, req: 1000 },   // Grade 2
    { level: 4, req: 1200 },   // Grade 3
    { level: 5, req: 1400 },   // Grade 4
    { level: 6, req: 1600 },   // Grade 5
    { level: 7, req: 1800 },   // Grade 6
    { level: 8, req: 2000 },   // Grade 7
    { level: 9, req: 2300 },   // Grade 8
    { level: 10, req: 2600 },  // Grade 9
    { level: 11, req: 3000 },  // Grade 10
    { level: 12, req: 3400 },  // Grade 11
    { level: 13, req: 3800 },  // Grade 12
    { level: 14, req: 4300 },  // Freshman
    { level: 15, req: 4800 },  // Sophomore
    { level: 16, req: 5400 },  // Junior
    { level: 17, req: 6000 },  // Senior
    { level: 18, req: 6500 },  // Master I
    { level: 19, req: 7000 },  // Master II
    { level: 20, req: 7600 },  // PhD I
    { level: 21, req: 8200 },  // PhD II
    { level: 22, req: 8500 },  // PhD III
    { level: 23, req: 9000 },  // PhD IV
    { level: 24, req: 9500 },  // Postdoc / Assistant Prof
    { level: 25, req: 0, max: true } // Professor (MAX)
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
            else setUser({ id: 'guest_' + Date.now(), name: 'Guest', email: '', isPremium: false, pet: { level: 1, currentExp: 0, maxExp: 600, happiness: 100, streakCount: 0, lastDailyActivityDate: '' } });
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

  const handleSessionComplete = (minutes: number, taskCompleted: boolean = false, focusState: string = 'FOCUSED') => {
      if (currentSessionParams) {
          // 1. Add History Record
          // Score is approximate based on state for backward compatibility. 
          // FUTURE: Remove this once StatsView uses real state enums.
          let approximateScore = 80;
          if (focusState === 'DEEP_FLOW') approximateScore = 100;
          else if (focusState === 'FOCUSED') approximateScore = 85;
          else if (focusState === 'DISTRACTED') approximateScore = 50;
          
          const newRecord: FocusRecord = { id: Date.now().toString(), date: getLocalDateString(), durationMinutes: minutes, mode: currentSessionParams.mode, score: approximateScore };
          setFocusHistory(prev => [...prev, newRecord]);
          
          // 2. Mark Task as Complete
          if (currentSessionParams.taskId && taskCompleted) {
              setTasks(prev => prev.map(t => t.id === currentSessionParams.taskId ? { ...t, completed: true } : t));
          }

          // 3. Economy System: STRICT 25-LEVEL LOGIC & STATE-BASED MULTIPLIERS
          if (user) {
              const todayStr = getLocalDateString();
              
              // Calculate yesterday safely using date math then formatting back to string
              const yDate = new Date();
              yDate.setDate(yDate.getDate() - 1);
              const yesterdayStr = getLocalDateString(yDate);

              const lastActive = user.pet.lastDailyActivityDate;
              let currentStreak = user.pet.streakCount;
              let newStreak = currentStreak;
              let streakBonus = 0;
              let updatedLastActive = lastActive;

              // --- STREAK LOGIC ---
              // Constraint: Only sessions >= 25 mins count for streak/sign-in
              const isQualifyingSession = minutes >= 25;

              if (isQualifyingSession) {
                  // Strict String Comparison for Today/Yesterday
                  if (lastActive === todayStr) {
                      // Already active today, maintain streak
                      newStreak = currentStreak;
                  } else if (lastActive === yesterdayStr) {
                      // Consecutive day: Increase streak (Cap at 7)
                      newStreak = Math.min(7, currentStreak + 1);
                  } else {
                      // Missed days (> 1 day gap)
                      // We need to calculate how many days were missed for the penalty
                      // Parse YYYY-MM-DD to local midnight to avoid timezone errors
                      const parseDate = (str: string) => {
                          if (!str) return new Date(0);
                          const [y, m, d] = str.split('-').map(Number);
                          return new Date(y, m - 1, d);
                      };

                      const dToday = parseDate(todayStr);
                      const dLast = parseDate(lastActive);
                      
                      const diffTime = dToday.getTime() - dLast.getTime();
                      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Days elapsed

                      // Missed days = diffDays - 1 (e.g., if diff is 2 days [Day 1 -> Day 3], missed Day 2, so 1 day missed)
                      // If diffDays is huge (new user or long absence), this math holds.
                      const missedDays = Math.max(0, diffDays - 1);
                      
                      if (missedDays > 0) {
                          const penalty = missedDays * 5;
                          newStreak = Math.max(1, currentStreak - penalty);
                      } else {
                          // Fallback for new users or fresh start
                          newStreak = 1;
                      }
                  }
                  
                  // Only apply streak bonus if this is the FIRST qualifying session of the day
                  if (lastActive !== todayStr) {
                      if (newStreak === 1) streakBonus = 10;
                      else if (newStreak <= 3) streakBonus = 15;
                      else if (newStreak <= 5) streakBonus = 20;
                      else if (newStreak === 6) streakBonus = 25;
                      else streakBonus = 30; // Lv7+
                  }

                  updatedLastActive = todayStr;
              }

              // --- BASE EXP & MULTIPLIER (Whitelist) ---
              let multiplier = 1.0;
              switch (focusState) {
                  case 'DEEP_FLOW': multiplier = 1.5; break;
                  case 'FOCUSED': multiplier = 1.2; break;
                  case 'DISTRACTED': multiplier = 0.8; break;
                  case 'ABSENT': multiplier = 1.0; break;
                  default: 
                      console.warn(`[App] Unknown focusState: ${focusState}. Defaulting to 1.0`);
                      multiplier = 1.0; 
                      break;
              }

              // Integer Math Rule: Math.floor at every step
              const baseExp = Math.floor(minutes * multiplier);
              
              // Task Bonus (Fixed integer)
              const taskBonus = taskCompleted ? 25 : 0;

              // Total Earned
              const totalEarned = baseExp + taskBonus + streakBonus;

              let currentExp = user.pet.currentExp + totalEarned;
              let currentLevel = user.pet.level;

              // --- LEVEL UP LOGIC ---
              // Find config for current level (0-based index)
              let levelConfig = LEVEL_CONFIG[currentLevel - 1]; 
              
              // While not at MAX level (req != 0) and have enough EXP
              while (levelConfig && !levelConfig.max && currentExp >= levelConfig.req) {
                  currentExp -= levelConfig.req;
                  currentLevel++;
                  // Safety cap at 25
                  if (currentLevel > 25) {
                      currentLevel = 25;
                      break;
                  }
                  levelConfig = LEVEL_CONFIG[currentLevel - 1];
              }

              // UI Safety: Calculate next req
              // If Max Level (req=0), set exp/req to 1/1 to show full bar and prevent DivisionByZero in UI
              let nextLevelReq = 0;
              if (levelConfig && levelConfig.max) {
                  currentLevel = 25;
                  currentExp = 1;
                  nextLevelReq = 1;
              } else if (levelConfig) {
                  nextLevelReq = levelConfig.req;
              }

              setUser(prev => prev ? ({
                  ...prev,
                  pet: {
                      ...prev.pet,
                      level: currentLevel,
                      currentExp: currentExp,
                      maxExp: nextLevelReq,
                      streakCount: newStreak,
                      lastDailyActivityDate: updatedLastActive,
                      happiness: Math.min(100, prev.pet.happiness + 5)
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
                settings={settings} setSettings={setSettings} user={user} task={tasks.find(t => t.id === currentSessionParams.taskId)} 
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
