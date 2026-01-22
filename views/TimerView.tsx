
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Coffee, Zap, Armchair, ChevronLeft, ChevronRight, CheckCircle2, Circle, Clock, Brain, Calendar, X, SlidersHorizontal, RotateCcw, Plus, Bell } from 'lucide-react';
import { TimerMode, Task, Settings, Priority } from '../types';
import { IOSSegmentedControl } from '../components/IOSComponents';
import { IOSWheelPicker } from '../components/IOSWheelPicker';
import { translations } from '../utils/translations';

interface TimerViewProps {
  tasks: Task[];
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  onRecordTime: (minutes: number, mode: TimerMode) => void;
  onStartSession: (duration: number, mode: TimerMode, taskId?: string) => void;
}

// Helper to format minutes into "1h 30m" or "45m"
const formatMinutes = (m: number) => {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
};

// Helper to calculate total cycle time
const calculateTotalDuration = (workTime: number, shortBreak: number, longBreak: number, rounds: number) => {
  const w = workTime * 60;
  const s = shortBreak * 60;
  const l = longBreak * 60;
  if (rounds <= 0) return 0;
  if (rounds === 1) return w + l;
  return ((w + s) * (rounds - 1)) + w + l;
};

// Non-linear slider helpers
const SLIDER_MAX = 96;

const sliderValueToMinutes = (val: number) => {
    if (val <= 60) return val;
    return 60 + (val - 60) * 5;
};

const minutesToSliderValue = (min: number) => {
    if (min <= 60) return min;
    return 60 + Math.floor((min - 60) / 5);
};

// Quick Settings Slider Component
const QuickSlider = ({ label, value, onChange, max, colorClass, unit = 'm' }: { label: string, value: number, onChange: (v: number) => void, max: number, colorClass: string, unit?: string }) => (
    <div>
        <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <span className={`text-sm font-bold font-mono ${colorClass}`}>
                {/* Use smart formatting if unit is 'm' (minutes), otherwise default behavior */}
                {unit === 'm' ? formatMinutes(value) : `${value}${unit}`}
            </span>
        </div>
        <input 
            type="range" 
            min="1" 
            max={max}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500"
        />
    </div>
);

const TimerView: React.FC<TimerViewProps> = ({ tasks, settings, setSettings, onStartSession }) => {
  const t = translations[settings.language].timer;
  const tSettings = translations[settings.language].settings;

  // 1. Sort active tasks chronologically
  const sortedTasks = useMemo(() => {
    const active = tasks.filter(t => !t.completed);
    return active.sort((a, b) => {
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      const dateA = new Date(`${a.date}T${timeA}`);
      const dateB = new Date(`${b.date}T${timeB}`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [tasks]);
  
  const [mode, setMode] = useState<TimerMode>(TimerMode.POMODORO);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  
  // Notification Picker State
  const [isNotificationPickerOpen, setIsNotificationPickerOpen] = useState(false);
  const [pickerValue, setPickerValue] = useState("5m"); // Default with unit
  
  // Task selection state
  const [browsingTaskIndex, setBrowsingTaskIndex] = useState(0); 
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  // FIXED: Safety check for browsing index when task list changes (e.g. completion)
  useEffect(() => {
      if (sortedTasks.length === 0) {
          setBrowsingTaskIndex(0);
      } else if (browsingTaskIndex >= sortedTasks.length) {
          setBrowsingTaskIndex(sortedTasks.length - 1);
      }
  }, [sortedTasks.length, browsingTaskIndex]);

  // Translation Map for Segmented Control
  const modeLabels = useMemo(() => {
      return {
          [TimerMode.POMODORO]: t.mode_pomodoro,
          [TimerMode.STOPWATCH]: t.mode_stopwatch,
          [TimerMode.CUSTOM]: t.mode_custom,
      };
  }, [t]);

  const segmentedOptions = Object.values(modeLabels);

  // Helper to get TimerMode from label
  const getModeFromLabel = (label: string): TimerMode => {
      return Object.keys(modeLabels).find(key => modeLabels[key as TimerMode] === label) as TimerMode;
  };

  // Auto-select logic
  useEffect(() => {
      if (sortedTasks.length === 0) return;
      const now = new Date();
      const nextTaskIndex = sortedTasks.findIndex(t => {
          const time = t.time || '23:59';
          const taskDate = new Date(`${t.date}T${time}`);
          return taskDate > now;
      });
      if (nextTaskIndex !== -1) {
          setBrowsingTaskIndex(nextTaskIndex);
      } else {
          setBrowsingTaskIndex(sortedTasks.length - 1);
      }
  }, [sortedTasks.length]);

  // Timer configuration state
  const [customDuration, setCustomDuration] = useState(25); 

  // Derived Rounds
  const currentRounds = useMemo(() => {
      if (mode === TimerMode.POMODORO && selectedTaskId) {
          const task = tasks.find(t => t.id === selectedTaskId);
          if (task && task.pomodoroCount > 0) {
              return task.pomodoroCount;
          }
      }
      return settings.pomodorosPerRound;
  }, [mode, selectedTaskId, tasks, settings.pomodorosPerRound]);

  useEffect(() => {
    if (selectedTaskId) {
        const task = tasks.find(t => t.id === selectedTaskId);
        if (task && mode === TimerMode.CUSTOM) {
            const newDuration = task.durationMinutes;
            setCustomDuration(newDuration);
            
            // FIX: Auto-trim custom notifications when task selection updates duration
            setSettings(prev => {
                const validList = prev.customNotifications.filter(n => n < newDuration);
                // Only update if changes are needed
                if (validList.length !== prev.customNotifications.length) {
                    return {
                        ...prev,
                        customNotifications: validList
                    };
                }
                return prev;
            });
        }
    }
  }, [selectedTaskId, mode, tasks, setSettings]);

  const timelineSegments = useMemo(() => {
    const segments = [];
    for (let i = 0; i < currentRounds; i++) {
      segments.push({ type: 'work', duration: settings.workTime * 60, label: t.focusTime });
      if (i < currentRounds - 1) {
        segments.push({ type: 'shortBreak', duration: settings.shortBreakTime * 60, label: t.break });
      } else {
        segments.push({ type: 'longBreak', duration: settings.longBreakTime * 60, label: t.break });
      }
    }
    return segments;
  }, [settings, currentRounds, t]);

  const theme = useMemo(() => {
      return {
          gradient: 'from-rose-300/40 via-red-200/40 to-orange-100/40',
      };
  }, []);

  const handleStart = () => {
      let duration = 25;
      if (mode === TimerMode.POMODORO) duration = settings.workTime;
      else if (mode === TimerMode.CUSTOM) duration = customDuration;
      else duration = 0; // Stopwatch logic

      onStartSession(duration, mode, selectedTaskId || undefined);
  };

  const handleReset = () => {
      setSettings(prev => ({
          ...prev,
          workTime: 25,
          shortBreakTime: 5,
          longBreakTime: 15,
          pomodorosPerRound: 4,
          notifications: []
      }));
  };

  const handleWorkTimeChange = (v: number) => {
      // Filter out notifications that are longer than the new work time for Pomodoro
      const validNotifications = settings.notifications.filter(n => n < v);
      setSettings(prev => ({...prev, workTime: v, notifications: validNotifications}));
  };

  // --- DATA SEPARATION HELPERS ---
  const getCurrentNotifications = () => {
      if (mode === TimerMode.POMODORO) return settings.notifications || [];
      if (mode === TimerMode.CUSTOM) return settings.customNotifications || [];
      if (mode === TimerMode.STOPWATCH) return settings.stopwatchNotifications || [];
      return [];
  };

  const handleAddNotification = () => {
      // Parse logic: "1h 5m" -> 65
      let val = 0;
      if (pickerValue.includes('h')) {
          const parts = pickerValue.split('h');
          const h = parseInt(parts[0]);
          const m = parts[1] && parts[1].includes('m') ? parseInt(parts[1]) : 0;
          val = h * 60 + m;
      } else {
          val = parseInt(pickerValue);
      }

      const currentList = getCurrentNotifications();
      // Limits based on mode
      const maxTime = mode === TimerMode.STOPWATCH ? 240 : (mode === TimerMode.CUSTOM ? customDuration : settings.workTime);

      if (!isNaN(val) && val > 0 && val < maxTime && !currentList.includes(val)) {
          const newList = [...currentList, val].sort((a, b) => a - b);
          
          setSettings(prev => {
              const next = { ...prev };
              if (mode === TimerMode.POMODORO) next.notifications = newList;
              else if (mode === TimerMode.CUSTOM) next.customNotifications = newList;
              else if (mode === TimerMode.STOPWATCH) next.stopwatchNotifications = newList;
              return next;
          });
      }
      setIsNotificationPickerOpen(false);
  };

  const handleRemoveNotification = (val: number) => {
      const currentList = getCurrentNotifications();
      const newList = currentList.filter(n => n !== val);
      
      setSettings(prev => {
          const next = { ...prev };
          if (mode === TimerMode.POMODORO) next.notifications = newList;
          else if (mode === TimerMode.CUSTOM) next.customNotifications = newList;
          else if (mode === TimerMode.STOPWATCH) next.stopwatchNotifications = newList;
          return next;
      });
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
        case Priority.HIGH: return 'bg-red-500';
        case Priority.MEDIUM: return 'bg-yellow-500';
        case Priority.LOW: return 'bg-blue-500';
        default: return 'bg-gray-400';
    }
  };

  // Determine display time for large clock
  let displayTime = 0;
  if (mode === TimerMode.POMODORO) {
      displayTime = settings.workTime * 60;
  } else if (mode === TimerMode.CUSTOM) {
      displayTime = customDuration * 60;
  } else {
      displayTime = 0;
  }

  const formatTime = (totalSeconds: number) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    // Show Hours if > 0
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleNextTask = () => {
    if (browsingTaskIndex < sortedTasks.length - 1) setBrowsingTaskIndex(prev => prev + 1);
  };
  const handlePrevTask = () => {
    if (browsingTaskIndex > 0) setBrowsingTaskIndex(prev => prev - 1);
  };
  const handleSelectTask = () => {
      const task = sortedTasks[browsingTaskIndex];
      if (task) {
          if (selectedTaskId === task.id) setSelectedTaskId(null);
          else setSelectedTaskId(task.id);
      }
  };

  const currentTask = sortedTasks[browsingTaskIndex];

  // Generate picker items based on current work time or mode
  const notificationPickerItems = useMemo(() => {
      const items = [];
      const max = mode === TimerMode.STOPWATCH ? 240 : (mode === TimerMode.CUSTOM ? customDuration : settings.workTime);
      for (let i = 1; i < max; i++) {
          // Push formatted strings (e.g. "65m" -> "1h 5m")
          items.push(formatMinutes(i));
      }
      return items;
  }, [settings.workTime, mode, customDuration]);

  // Reusable Notification Panel Component
  const NotificationPanel = () => {
      const activeNotifications = getCurrentNotifications();
      
      return (
        <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 mt-4">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5">
                    <Bell size={12} className="text-gray-500" />
                    <span className="text-xs font-bold text-gray-500 uppercase">{tSettings.notifications}</span>
                </div>
                <span className="text-[10px] font-bold text-gray-400">{activeNotifications.length}/10</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
                {activeNotifications.sort((a,b) => a-b).map(n => (
                    <button 
                        key={n}
                        onClick={() => handleRemoveNotification(n)}
                        className="flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded-md text-xs font-semibold text-gray-600 shadow-sm active:scale-95 transition-transform"
                    >
                        {formatMinutes(n)}
                        <X size={10} className="text-gray-400" />
                    </button>
                ))}
                
                {activeNotifications.length < 10 && (
                    <button 
                        onClick={() => {
                            if (notificationPickerItems.length > 0) {
                                // Default pick the first one available
                                setPickerValue(notificationPickerItems[0]);
                                setIsNotificationPickerOpen(true);
                            }
                        }}
                        className="flex items-center gap-1 bg-blue-50 border border-blue-100 px-2 py-1 rounded-md text-xs font-bold text-blue-500 active:scale-95 transition-transform"
                    >
                        <Plus size={10} strokeWidth={3} />
                        {tSettings.addNotification}
                    </button>
                )}
            </div>
        </div>
      );
  };

  return (
    <div className="h-full pt-safe-top pb-24 px-6 bg-[#f2f2f7] relative overflow-y-auto no-scrollbar w-full">
      
      {/* Dynamic Gradient Marker */}
      <motion.div 
         initial={false}
         className={`fixed top-[18%] left-1/2 -translate-x-1/2 w-72 h-72 bg-gradient-to-tr ${theme.gradient} rounded-full blur-[60px] pointer-events-none z-0 transition-all duration-700`}
      />

      <div className="flex flex-col gap-6 min-h-full pb-8 w-full">
      
        {/* 1. Header & Status */}
        <div className="mt-2 flex flex-col items-center z-10 w-full mx-auto relative">
            {/* Control Strip */}
            <div className="flex items-center gap-3 w-full max-w-md mb-6">
                <div className="flex-1">
                    <IOSSegmentedControl 
                        options={segmentedOptions} 
                        selected={modeLabels[mode]}
                        onChange={(val) => {
                            const newMode = getModeFromLabel(val);
                            if (newMode) {
                                setMode(newMode);
                                setIsQuickSettingsOpen(false); 
                            }
                        }} 
                    />
                </div>
                {/* Quick Action Button (Settings Toggle) - ONLY for Pomodoro now */}
                <button 
                    onClick={() => setIsQuickSettingsOpen(!isQuickSettingsOpen)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-md active:scale-95 transition-transform duration-200
                        ${isQuickSettingsOpen ? 'bg-gray-500' : 'bg-blue-500'}
                        ${mode !== TimerMode.POMODORO ? 'hidden' : ''}
                    `}
                >
                    {isQuickSettingsOpen ? <X size={18} /> : <SlidersHorizontal size={18} />}
                </button>
            </div>

            {/* STATUS BADGE - BREATHING ANIMATION ADDED */}
            <motion.div 
                animate={{ boxShadow: ["0 0 0px rgba(59, 130, 246, 0)", "0 0 10px rgba(59, 130, 246, 0.3)", "0 0 0px rgba(59, 130, 246, 0)"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className={`px-5 py-2 rounded-full text-xs font-bold tracking-wider uppercase mb-6 transition-all duration-300 shadow-sm z-10 bg-white/90 text-gray-500 flex items-center gap-2`}
            >
                <Brain size={12} className="text-blue-500"/>
                <span>{t.ready}</span>
            </motion.div>
            
            <div className="text-[18vw] font-thin font-mono tracking-tighter tabular-nums text-gray-900 leading-none drop-shadow-sm z-10 select-none">
                {formatTime(displayTime)}
            </div>
        </div>

        {/* 2. Middle Section - Dynamic Flow Layout */}
        <div className="w-full relative z-10 min-h-[100px] flex flex-col justify-center mb-2">
            <AnimatePresence mode="wait">
                {mode === TimerMode.POMODORO && (
                    <motion.div
                        key="pomodoro-block"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full"
                    >
                        {/* Timeline Area */}
                        <div className="w-full">
                            <div className="flex justify-between text-xs text-gray-500 mb-2 px-1 font-bold uppercase tracking-widest">
                                <span>{t.estCycle}</span>
                                <span>{formatMinutes(Math.floor(calculateTotalDuration(settings.workTime, settings.shortBreakTime, settings.longBreakTime, currentRounds) / 60))}</span>
                            </div>
                            
                            <div className="h-12 w-full bg-white/90 backdrop-blur-md rounded-2xl p-2 shadow-sm flex gap-1.5 relative overflow-hidden border-2 border-blue-200 transition-all">
                                {timelineSegments.map((seg, idx) => {
                                    let activeBg = 'bg-gray-100';
                                    if (seg.type === 'work') activeBg = 'bg-rose-100';
                                    else if (seg.type === 'shortBreak') activeBg = 'bg-amber-100';
                                    else if (seg.type === 'longBreak') activeBg = 'bg-emerald-100';

                                    return (
                                    <div 
                                        key={idx}
                                        className={`h-full rounded-lg relative flex items-center justify-center ${activeBg}`}
                                        style={{ flex: seg.duration }}
                                    >
                                        {seg.type === 'work' && <Zap size={12} className="text-rose-400" />}
                                        {seg.type === 'shortBreak' && <Coffee size={12} className="text-amber-400" />}
                                        {seg.type === 'longBreak' && <Armchair size={12} className="text-emerald-400" />}
                                    </div>
                                    );
                                })}
                            </div>
                            
                            <div className="flex justify-between mt-1 text-[10px] text-blue-400 font-bold px-1">
                                <span>{t.focusTime}: {formatMinutes(settings.workTime)}</span>
                                <span>{t.break}: {formatMinutes(settings.shortBreakTime)}</span>
                            </div>
                        </div>

                        {/* Collapsible Settings Panel */}
                        <AnimatePresence>
                            {isQuickSettingsOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                    animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                    className="overflow-hidden"
                                >
                                     <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl shadow-sm border border-white/50 w-full">
                                         <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{tSettings.timerConfig}</span>
                                            <button onClick={handleReset} className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-md active:scale-95 transition-transform">
                                                <RotateCcw size={10} /> {tSettings.reset.toUpperCase()}
                                            </button>
                                         </div>
                                         <div className="space-y-5">
                                             <QuickSlider label={tSettings.focusDuration} value={settings.workTime} onChange={handleWorkTimeChange} max={90} colorClass="text-rose-500" />
                                             <QuickSlider label={tSettings.shortBreak} value={settings.shortBreakTime} onChange={v => setSettings({...settings, shortBreakTime: v})} max={30} colorClass="text-amber-500" />
                                             <QuickSlider label={tSettings.longBreak} value={settings.longBreakTime} onChange={v => setSettings({...settings, longBreakTime: v})} max={45} colorClass="text-emerald-500" />
                                             <div className="border-t border-gray-100 my-2" />
                                             <QuickSlider label={tSettings.intervals} value={settings.pomodorosPerRound} onChange={v => setSettings({...settings, pomodorosPerRound: v})} max={10} colorClass="text-indigo-500" unit="" />
                                             {/* Pomodoro also uses the notification panel in the dropdown */}
                                             <NotificationPanel />
                                         </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {mode === TimerMode.CUSTOM && (
                    <motion.div
                        key="custom-block"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full"
                    >
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm font-bold text-gray-500 uppercase">{t.duration}</span>
                                <span className="text-xl font-mono font-bold text-blue-600">
                                    {formatMinutes(customDuration)}
                                </span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max={SLIDER_MAX}
                                step="1"
                                value={minutesToSliderValue(customDuration)}
                                onChange={(e) => {
                                     const val = sliderValueToMinutes(parseInt(e.target.value));
                                     setCustomDuration(val);

                                     // FIX: Auto-trim notifications that are longer than the new duration
                                     const validList = settings.customNotifications.filter(n => n < val);
                                     if (validList.length !== settings.customNotifications.length) {
                                         setSettings(prev => ({
                                             ...prev,
                                             customNotifications: validList
                                         }));
                                     }
                                }}
                                className="w-full h-4 bg-gray-100 rounded-full appearance-none cursor-pointer accent-blue-500"
                            />
                            {/* Independent Custom Notification Panel */}
                            <NotificationPanel />
                        </div>
                    </motion.div>
                )}

                {mode === TimerMode.STOPWATCH && (
                     <motion.div
                        key="stopwatch-block"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full"
                     >
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col gap-2">
                            <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <Clock size={16} className="text-gray-400" />
                                <span className="text-sm text-gray-500">{t.stopwatchActive}</span>
                            </div>
                            {/* Independent Stopwatch Notification Panel */}
                            <NotificationPanel />
                        </div>
                     </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* 3. Task Slider (Naturally pushed down by flow layout) */}
        <div className="flex-none flex flex-col justify-center relative z-20">
            <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t.selectTask}</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-center">
                    {sortedTasks.length > 0 ? `${browsingTaskIndex + 1} / ${sortedTasks.length}` : '0 / 0'}
                </span>
            </div>

            {sortedTasks.length > 0 ? (
                <div className="relative group w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentTask?.id || 'empty'}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className={`bg-white rounded-3xl shadow-md border-2 relative overflow-hidden transition-all duration-300
                            ${selectedTaskId === currentTask?.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent'}
                            `}
                        >
                           {/* Priority Indicator Strip */}
                           {currentTask && <div className={`absolute left-0 top-0 bottom-0 w-2 ${getPriorityColor(currentTask.priority)}`} />}

                           <div className="pl-5 p-4">
                               {currentTask ? (
                                   <>
                                       <div className="flex justify-between items-start mb-3">
                                           <div className="pr-2">
                                                <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{currentTask.title}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white uppercase ${getPriorityColor(currentTask.priority)}`}>
                                                        {currentTask.priority}
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-medium">
                                                        {currentTask.date}
                                                    </span>
                                                </div>
                                           </div>
                                           <button 
                                                onClick={handleSelectTask}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95
                                                    ${selectedTaskId === currentTask.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-300'}
                                                `}
                                            >
                                                {selectedTaskId === currentTask.id ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                            </button>
                                       </div>

                                       {/* Metadata Grid */}
                                       <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                                           <div className="flex flex-col items-start">
                                               <span className="text-[10px] font-bold text-gray-400 uppercase">{t.startLabel}</span>
                                               <div className="flex items-center gap-1 text-gray-700 font-semibold text-sm">
                                                   <Clock size={14} className="text-blue-500"/>
                                                   {currentTask.time || '--:--'}
                                               </div>
                                           </div>
                                           <div className="flex flex-col items-start">
                                               <span className="text-[10px] font-bold text-gray-400 uppercase">{t.duration}</span>
                                               <div className="flex items-center gap-1 text-gray-700 font-semibold text-sm">
                                                    <Calendar size={14} className="text-purple-500"/>
                                                   {formatMinutes(currentTask.durationMinutes)}
                                               </div>
                                           </div>
                                           <div className="flex flex-col items-start">
                                               <span className="text-[10px] font-bold text-gray-400 uppercase">{t.pomos}</span>
                                               <div className="flex items-center gap-1 text-gray-700 font-semibold text-sm">
                                                    <Zap size={14} className="text-yellow-500"/>
                                                    {currentTask.pomodoroCount}
                                               </div>
                                           </div>
                                       </div>
                                   </>
                               ) : <div></div>}
                           </div>
                        </motion.div>
                    </AnimatePresence>
                     <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between pointer-events-none px-0 z-20">
                        <button onClick={handlePrevTask} disabled={browsingTaskIndex === 0} className="pointer-events-auto w-10 h-10 -ml-4 bg-white shadow-lg rounded-full flex items-center justify-center disabled:opacity-0 transition-opacity text-gray-600 hover:text-blue-500"><ChevronLeft size={24} /></button>
                        <button onClick={handleNextTask} disabled={browsingTaskIndex >= sortedTasks.length - 1} className="pointer-events-auto w-10 h-10 -mr-4 bg-white shadow-lg rounded-full flex items-center justify-center disabled:opacity-0 transition-opacity text-gray-600 hover:text-blue-500"><ChevronRight size={24} /></button>
                    </div>
                </div>
            ) : (
                <div className="bg-white/50 border-2 border-dashed border-gray-300 rounded-3xl p-6 flex flex-col items-center justify-center text-gray-400 min-h-[140px]">
                    <p>{t.noTasks}</p>
                    <p className="text-xs mt-1">{t.addOne}</p>
                </div>
            )}
        </div>

        {/* 4. Controls */}
        <div className="flex items-center justify-center gap-6 z-10">
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl shadow-blue-200 transition-colors bg-blue-600 text-white`}
            >
                <Play size={32} fill="currentColor" className="ml-1" />
            </motion.button>
        </div>
      </div>
      
      {/* Notification Picker Modal */}
      <AnimatePresence>
        {isNotificationPickerOpen && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4"
                onClick={() => setIsNotificationPickerOpen(false)}
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 10 }}
                    className="bg-white w-full max-w-[300px] rounded-2xl p-6 shadow-2xl relative"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">{tSettings.notifyAt}</h3>
                        <button onClick={() => setIsNotificationPickerOpen(false)} className="bg-gray-100 p-1 rounded-full text-gray-500">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="flex justify-center mb-6">
                        <div className="w-24">
                            <IOSWheelPicker 
                                items={notificationPickerItems} 
                                selected={pickerValue} 
                                onChange={setPickerValue} 
                                label="Time" 
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleAddNotification}
                        className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold active:scale-95 transition-transform"
                    >
                        {tSettings.addNotification}
                    </button>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimerView;
