import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import TimerView from './views/TimerView';
import TasksView from './views/TasksView';
import StatsView from './views/StatsView';
import SettingsView from './views/SettingsView';
import FocusSessionView from './views/FocusSessionView';
import { Task, Settings, Priority, FocusRecord, TimerMode, User } from './types';
import { NativeService } from './services/native'; // Import the new bridge
import { Zap } from 'lucide-react';

// STORAGE KEYS
const STORAGE_KEYS = {
    TASKS: 'focusflow_tasks',
    HISTORY: 'focusflow_history',
    SETTINGS: 'focusflow_settings',
    USER: 'focusflow_user'
};

function App() {
  const [activeTab, setActiveTab] = useState('timer');
  const [isFocusSessionActive, setIsFocusSessionActive] = useState(false);
  
  // App Loading State (Crucial for Async Native Storage)
  const [isAppReady, setIsAppReady] = useState(false);

  const [currentSessionParams, setCurrentSessionParams] = useState<{
      mode: TimerMode;
      durationMinutes: number;
      taskId?: string;
  } | null>(null);
  
  // --- 1. State Definitions (Initially Empty) ---
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [focusHistory, setFocusHistory] = useState<FocusRecord[]>([]);
  
  // Initialize with detected language
  const [settings, setSettings] = useState<Settings>({
      workTime: 25, 
      shortBreakTime: 5, 
      longBreakTime: 15, 
      pomodorosPerRound: 4,
      notifications: [], // Pomodoro defaults
      customNotifications: [], // Custom defaults
      stopwatchNotifications: [], // Stopwatch defaults
      language: navigator.language.startsWith('zh') ? 'zh' : 'en' 
  });

  // --- 2. Async Initialization (The Circuit Init) ---
  useEffect(() => {
    const initApp = async () => {
        try {
            // Load User
            const savedUser = await NativeService.Storage.get<User>(STORAGE_KEYS.USER);
            if (savedUser) {
                // Migration: Add Pet State if missing
                if (!savedUser.pet) {
                    savedUser.pet = {
                        level: 1,
                        currentExp: 0,
                        maxExp: 100,
                        happiness: 100,
                        lastDailyActivityDate: ''
                    };
                }
                setUser(savedUser);
            } else {
                // Initialize default user with pet
                setUser({
                    id: 'guest_' + Date.now(),
                    name: 'Guest',
                    email: '',
                    isPremium: false,
                    pet: {
                        level: 1,
                        currentExp: 0,
                        maxExp: 100,
                        happiness: 100,
                        lastDailyActivityDate: ''
                    }
                });
            }

            // Load Settings
            const savedSettings = await NativeService.Storage.get<Settings>(STORAGE_KEYS.SETTINGS);
            if (savedSettings) {
                // Ensure language field exists if migrating from old version
                if (!savedSettings.language) {
                    savedSettings.language = navigator.language.startsWith('zh') ? 'zh' : 'en';
                }
                // Ensure notification fields exist (migration)
                if (!savedSettings.notifications) savedSettings.notifications = [];
                if (!savedSettings.customNotifications) savedSettings.customNotifications = [];
                if (!savedSettings.stopwatchNotifications) savedSettings.stopwatchNotifications = [];

                setSettings(savedSettings);
            }

            // Load Tasks
            const savedTasks = await NativeService.Storage.get<Task[]>(STORAGE_KEYS.TASKS);
            if (savedTasks) {
                setTasks(savedTasks);
            } else {
                 // First Time Launch Data
                 const today = new Date().toISOString().split('T')[0];
                 const initialTasks = [
                    { id: '1', title: 'Welcome to FocusFlow', date: today, time: '09:00', durationMinutes: 25, priority: Priority.HIGH, completed: false, pomodoroCount: 1, note: 'This is a local-first app.' },
                 ];
                 setTasks(initialTasks);
                 await NativeService.Storage.set(STORAGE_KEYS.TASKS, initialTasks);
            }

            // Load History
            const savedHistory = await NativeService.Storage.get<FocusRecord[]>(STORAGE_KEYS.HISTORY);
            if (savedHistory) setFocusHistory(savedHistory);

        } catch (e) {
            console.error("Failed to initialize app data", e);
        } finally {
            // Artificial delay to prevent flash (and simulate native splash screen fade out)
            setTimeout(() => setIsAppReady(true), 500);
        }
    };

    initApp();
  }, []);

  // --- 3. Persistence Observers (Auto-Save) ---
  useEffect(() => { if(isAppReady) NativeService.Storage.set(STORAGE_KEYS.TASKS, tasks); }, [tasks, isAppReady]);
  useEffect(() => { if(isAppReady) NativeService.Storage.set(STORAGE_KEYS.HISTORY, focusHistory); }, [focusHistory, isAppReady]);
  useEffect(() => { if(isAppReady) NativeService.Storage.set(STORAGE_KEYS.SETTINGS, settings); }, [settings, isAppReady]);
  useEffect(() => { 
      if(isAppReady) {
        if (user) NativeService.Storage.set(STORAGE_KEYS.USER, user);
        else NativeService.Storage.remove(STORAGE_KEYS.USER);
      }
  }, [user, isAppReady]);


  // --- Actions ---

  const addTask = (task: Task) => {
    setTasks([...tasks, task]);
    NativeService.Haptics.impactLight();
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    NativeService.Haptics.impactLight();
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    NativeService.Haptics.impactMedium();
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    NativeService.Haptics.impactLight();
  };

  const addFocusRecord = (minutes: number, mode: TimerMode) => {
      if (minutes <= 0) return;
      const newRecord: FocusRecord = {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          durationMinutes: minutes,
          mode: mode
      };
      setFocusHistory(prev => [...prev, newRecord]);
  };

  const handleLogin = (provider: 'apple' | 'google') => {
      NativeService.Haptics.impactMedium();
      setTimeout(() => {
        // Mock login
        const newUserState: User = {
            id: 'u_12345',
            name: provider === 'apple' ? 'Apple User' : 'Google User',
            email: provider === 'apple' ? 'user@icloud.com' : 'user@gmail.com',
            isPremium: false,
            // Preserve pet state if existed
            pet: user?.pet || {
                level: 1,
                currentExp: 0,
                maxExp: 100,
                happiness: 100,
                lastDailyActivityDate: ''
            }
        };
        setUser(newUserState);
        NativeService.Haptics.notificationSuccess();
      }, 800);
  };

  const handleLogout = () => {
      NativeService.Haptics.impactMedium();
      setUser(null);
  };

  const handleUpgrade = () => {
      NativeService.Haptics.impactMedium();
      if (user) {
          const updatedUser = { ...user, isPremium: true, planExpiry: 'Lifetime' };
          setUser(updatedUser);
          NativeService.Haptics.notificationSuccess();
      }
  };

  // Helper to open Settings tab and trigger upgrade flow
  const handleUpgradeTrigger = () => {
      setIsFocusSessionActive(false);
      setCurrentSessionParams(null);
      setActiveTab('settings');
      setTimeout(() => {
          alert("Please click 'View Offer' in Settings to upgrade!");
      }, 300);
  };

  // --- DEVELOPER: Inject Simulated Data ---
  const handleInjectData = (newTasks: Task[], newHistory: FocusRecord[], newUser: User) => {
      setTasks(newTasks);
      setFocusHistory(newHistory);
      setUser(newUser);
      NativeService.Haptics.notificationSuccess();
  };

  const handleStartSession = (duration: number, mode: TimerMode, taskId?: string) => {
      NativeService.Haptics.impactMedium();
      setCurrentSessionParams({ durationMinutes: duration, mode, taskId });
      setIsFocusSessionActive(true);
  };

  const handleSessionComplete = (minutes: number, taskCompleted: boolean = false) => {
      if (currentSessionParams) {
          addFocusRecord(minutes, currentSessionParams.mode);
          
          // --- TASK COMPLETION UPDATE ---
          if (currentSessionParams.taskId && taskCompleted) {
              const taskId = currentSessionParams.taskId;
              setTasks(prevTasks => prevTasks.map(t => 
                  t.id === taskId ? { ...t, completed: true } : t
              ));
          }

          // --- PET SYSTEM: ADD EXP ---
          // Rule: If focus duration > 0.1 hours (approx 5-6 mins) AND haven't claimed today, add +5 EXP.
          if (user && minutes >= 5) {
              const todayStr = new Date().toISOString().split('T')[0];
              const alreadyClaimedToday = user.pet.lastDailyActivityDate === todayStr;
              
              if (!alreadyClaimedToday) {
                  const gainedExp = 5;
                  let newExp = user.pet.currentExp + gainedExp;
                  let newLevel = user.pet.level;
                  let newMaxExp = user.pet.maxExp;

                  // Simple Level Up Logic
                  if (newExp >= user.pet.maxExp) {
                      newLevel += 1;
                      newExp = newExp - user.pet.maxExp;
                      newMaxExp = Math.floor(100 * Math.pow(1.5, newLevel - 1));
                      // Could trigger Level Up Modal here
                  }

                  const updatedUser = {
                      ...user,
                      pet: {
                          ...user.pet,
                          level: newLevel,
                          currentExp: newExp,
                          maxExp: newMaxExp,
                          lastDailyActivityDate: todayStr,
                          happiness: Math.min(100, user.pet.happiness + 10)
                      }
                  };
                  setUser(updatedUser);
              }
          }
      }
      setIsFocusSessionActive(false);
      setCurrentSessionParams(null);
      NativeService.Haptics.notificationSuccess();
  };

  const handleSessionCancel = () => {
      setIsFocusSessionActive(false);
      setCurrentSessionParams(null);
      NativeService.Haptics.impactLight();
  };


  // --- Render ---

  // Splash Screen State
  if (!isAppReady) {
      return (
          <div className="h-screen w-full bg-[#f2f2f7] flex items-center justify-center">
              <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-2xl shadow-xl shadow-blue-200 flex items-center justify-center mb-4 animate-bounce">
                      <Zap size={32} className="text-white" fill="currentColor"/>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">FocusFlow</h1>
              </div>
          </div>
      );
  }

  // Focus Session (Full Screen Modal)
  if (isFocusSessionActive && currentSessionParams) {
      const task = currentSessionParams.taskId ? tasks.find(t => t.id === currentSessionParams.taskId) : undefined;
      return (
          <FocusSessionView 
              mode={currentSessionParams.mode}
              initialTimeInSeconds={currentSessionParams.durationMinutes * 60}
              settings={settings} // <--- PASSING SETTINGS HERE
              task={task}
              user={user}
              onComplete={handleSessionComplete}
              onCancel={handleSessionCancel}
              onUpgradeTrigger={handleUpgradeTrigger}
          />
      );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'timer':
        return <TimerView 
            tasks={tasks.filter(t => !t.completed)} 
            settings={settings} 
            setSettings={setSettings} 
            onRecordTime={addFocusRecord} 
            onStartSession={handleStartSession} 
        />;
      case 'tasks':
        return <TasksView 
            tasks={tasks} 
            settings={settings}
            addTask={addTask} 
            updateTask={updateTask}
            deleteTask={deleteTask}
            toggleTask={toggleTask} 
        />;
      case 'stats':
        return <StatsView tasks={tasks} focusHistory={focusHistory} settings={settings} />;
      case 'settings':
        return <SettingsView 
            settings={settings} 
            setSettings={setSettings} 
            user={user}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onUpgrade={handleUpgrade}
            onInjectData={handleInjectData}
        />;
      default:
        return <TimerView tasks={tasks} settings={settings} setSettings={setSettings} onRecordTime={addFocusRecord} onStartSession={handleStartSession}/>;
    }
  };

  return (
    <div className="h-screen w-full bg-[#f2f2f7] text-gray-900 overflow-hidden font-sans">
      <main className="h-full w-full">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={(tab) => {
          setActiveTab(tab);
          NativeService.Haptics.impactLight();
      }} settings={settings} />
    </div>
  );
}

export default App;