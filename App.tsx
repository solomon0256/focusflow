import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import TimerView from './views/TimerView';
import TasksView from './views/TasksView';
import StatsView from './views/StatsView';
import SettingsView from './views/SettingsView';
import FocusSessionView from './views/FocusSessionView';
import { Task, Settings, Priority, FocusRecord, TimerMode, User } from './types';

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
  const [currentSessionParams, setCurrentSessionParams] = useState<{
      mode: TimerMode;
      durationMinutes: number;
      taskId?: string;
  } | null>(null);
  
  // --- 1. Load Initial State from LocalStorage (Serverless Approach) ---
  
  const [user, setUser] = useState<User | null>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : null;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (saved) return JSON.parse(saved);

      // Default Initial Data if empty
      const today = new Date().toISOString().split('T')[0];
      return [
        { id: '1', title: 'Welcome to FocusFlow', date: today, time: '09:00', durationMinutes: 25, priority: Priority.HIGH, completed: false, pomodoroCount: 1, note: 'This is a local-first app.' },
        { id: '2', title: 'Try the Timer', date: today, time: '10:00', durationMinutes: 45, priority: Priority.MEDIUM, completed: false, pomodoroCount: 2, note: '' },
      ];
  });
  
  const [focusHistory, setFocusHistory] = useState<FocusRecord[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return saved ? JSON.parse(saved) : [
          { id: 'mock-1', date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0], durationMinutes: 45, mode: TimerMode.POMODORO }
      ];
  });

  const [settings, setSettings] = useState<Settings>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : {
        workTime: 25,
        shortBreakTime: 5,
        longBreakTime: 15,
        pomodorosPerRound: 4
      };
  });

  // --- 2. Persist Changes to LocalStorage Automatically ---

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(focusHistory)); }, [focusHistory]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)); }, [settings]);
  useEffect(() => { 
      if (user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEYS.USER);
  }, [user]);


  // --- Actions ---

  const addTask = (task: Task) => {
    setTasks([...tasks, task]);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
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

  // --- Simulated "Serverless" Auth Logic ---
  
  const handleLogin = (provider: 'apple' | 'google') => {
      setTimeout(() => {
        setUser({
            id: 'u_12345',
            name: provider === 'apple' ? 'Apple User' : 'Google User',
            email: provider === 'apple' ? 'user@icloud.com' : 'user@gmail.com',
            isPremium: false,
        });
      }, 800);
  };

  const handleLogout = () => {
      setUser(null);
  };

  const handleUpgrade = () => {
      if (user) {
          const updatedUser = { ...user, isPremium: true, planExpiry: 'Lifetime' };
          setUser(updatedUser);
      }
  };

  // --- Session Handlers ---
  
  const handleStartSession = (duration: number, mode: TimerMode, taskId?: string) => {
      setCurrentSessionParams({ durationMinutes: duration, mode, taskId });
      setIsFocusSessionActive(true);
  };

  const handleSessionComplete = (minutes: number) => {
      if (currentSessionParams) {
          addFocusRecord(minutes, currentSessionParams.mode);
          // If it was a specific task, we could increment its counter here if needed
          if (currentSessionParams.taskId) {
             // Logic to update task stats specifically could go here
          }
      }
      setIsFocusSessionActive(false);
      setCurrentSessionParams(null);
  };

  const handleSessionCancel = () => {
      setIsFocusSessionActive(false);
      setCurrentSessionParams(null);
  };


  // --- Render ---

  // 1. High Priority: Focus Session (Camera View)
  if (isFocusSessionActive && currentSessionParams) {
      const task = currentSessionParams.taskId ? tasks.find(t => t.id === currentSessionParams.taskId) : undefined;
      return (
          <FocusSessionView 
              mode={currentSessionParams.mode}
              initialTimeInSeconds={currentSessionParams.durationMinutes * 60}
              task={task}
              onComplete={handleSessionComplete}
              onCancel={handleSessionCancel}
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
            onRecordTime={addFocusRecord} // Fallback
            onStartSession={handleStartSession} // New: Handover to Camera View
        />;
      case 'tasks':
        return <TasksView 
            tasks={tasks} 
            addTask={addTask} 
            updateTask={updateTask}
            deleteTask={deleteTask}
            toggleTask={toggleTask} 
        />;
      case 'stats':
        return <StatsView tasks={tasks} focusHistory={focusHistory} />;
      case 'settings':
        return <SettingsView 
            settings={settings} 
            setSettings={setSettings} 
            user={user}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onUpgrade={handleUpgrade}
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
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;