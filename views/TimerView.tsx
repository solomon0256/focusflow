import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Coffee, Zap, Armchair, ChevronLeft, ChevronRight, CheckCircle2, Circle, Clock, Brain, Calendar, X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { TimerMode, Task, Settings, Priority } from '../types';
import { IOSSegmentedControl } from '../components/IOSComponents';

interface TimerViewProps {
  tasks: Task[];
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  onRecordTime: (minutes: number, mode: TimerMode) => void;
  onStartSession: (duration: number, mode: TimerMode, taskId?: string) => void;
}

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
            <span className={`text-sm font-bold font-mono ${colorClass}`}>{value}{unit}</span>
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
  
  // Task selection state
  const [browsingTaskIndex, setBrowsingTaskIndex] = useState(0); 
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
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
            setCustomDuration(task.durationMinutes);
        }
    }
  }, [selectedTaskId, mode, tasks]);

  const timelineSegments = useMemo(() => {
    const segments = [];
    for (let i = 0; i < currentRounds; i++) {
      segments.push({ type: 'work', duration: settings.workTime * 60, label: 'Focus' });
      if (i < currentRounds - 1) {
        segments.push({ type: 'shortBreak', duration: settings.shortBreakTime * 60, label: 'Break' });
      } else {
        segments.push({ type: 'longBreak', duration: settings.longBreakTime * 60, label: 'Long Break' });
      }
    }
    return segments;
  }, [settings, currentRounds]);

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
          pomodorosPerRound: 4
      }));
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
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
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
                        options={['Pomodoro', 'Stopwatch', 'Custom']} 
                        selected={mode === TimerMode.POMODORO ? 'Pomodoro' : mode === TimerMode.STOPWATCH ? 'Stopwatch' : 'Custom'}
                        onChange={(val) => {
                            if(val === 'Pomodoro') setMode(TimerMode.POMODORO);
                            else if (val === 'Stopwatch') setMode(TimerMode.STOPWATCH);
                            else setMode(TimerMode.CUSTOM);
                            setIsQuickSettingsOpen(false); // Close settings on mode switch
                        }} 
                    />
                </div>
                {/* Quick Action Button (Settings Toggle) */}
                <button 
                    onClick={() => setIsQuickSettingsOpen(!isQuickSettingsOpen)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-md active:scale-95 transition-transform duration-200
                        ${isQuickSettingsOpen ? 'bg-gray-500' : 'bg-blue-500'}
                        ${mode !== TimerMode.POMODORO ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                    `}
                >
                    {isQuickSettingsOpen ? <X size={18} /> : <SlidersHorizontal size={18} />}
                </button>
            </div>

            <div className={`px-5 py-2 rounded-full text-xs font-bold tracking-wider uppercase mb-6 transition-all duration-300 shadow-sm z-10 bg-white/90 text-gray-500 flex items-center gap-2`}>
                <Brain size={12} className="text-blue-500"/>
                <span>Ready to Focus</span>
            </div>
            
            <div className="text-[18vw] font-thin font-mono tracking-tighter tabular-nums text-gray-900 leading-none drop-shadow-sm z-10">
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
                        {/* Timeline Area - Always Visible */}
                        <div className="w-full">
                            <div className="flex justify-between text-xs text-gray-500 mb-2 px-1 font-bold uppercase tracking-widest">
                                <span>Est. Cycle</span>
                                <span>{Math.floor(calculateTotalDuration(settings.workTime, settings.shortBreakTime, settings.longBreakTime, currentRounds) / 60)}m</span>
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
                                <span>Focus Time: {settings.workTime}m</span>
                                <span>Break: {settings.shortBreakTime}m</span>
                            </div>
                        </div>

                        {/* Collapsible Settings Panel (Expands Below) */}
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
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Adjustment</span>
                                            <button 
                                                onClick={handleReset}
                                                className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-md active:scale-95 transition-transform"
                                            >
                                                <RotateCcw size={10} />
                                                RESET
                                            </button>
                                         </div>
                                         <div className="space-y-5">
                                             <QuickSlider label="Focus" value={settings.workTime} onChange={v => setSettings({...settings, workTime: v})} max={90} colorClass="text-rose-500" />
                                             <QuickSlider label="Short Break" value={settings.shortBreakTime} onChange={v => setSettings({...settings, shortBreakTime: v})} max={30} colorClass="text-amber-500" />
                                             <QuickSlider label="Long Break" value={settings.longBreakTime} onChange={v => setSettings({...settings, longBreakTime: v})} max={45} colorClass="text-emerald-500" />
                                             <div className="border-t border-gray-100 my-2" />
                                             <QuickSlider label="Intervals" value={settings.pomodorosPerRound} onChange={v => setSettings({...settings, pomodorosPerRound: v})} max={10} colorClass="text-indigo-500" unit="" />
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
                                <span className="text-sm font-bold text-gray-500 uppercase">Set Duration</span>
                                <span className="text-xl font-mono font-bold text-blue-600">{customDuration}m</span>
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
                                }}
                                className="w-full h-4 bg-gray-100 rounded-full appearance-none cursor-pointer accent-blue-500"
                            />
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
                        <div className="bg-white/40 p-3 rounded-2xl border border-dashed border-gray-300 flex items-center justify-center gap-2">
                            <Clock size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-500">Stopwatch Mode Active</span>
                        </div>
                     </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* 3. Task Slider (Naturally pushed down by flow layout) */}
        <div className="flex-none flex flex-col justify-center relative z-20">
            <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Select Task</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-center">
                    {sortedTasks.length > 0 ? `${browsingTaskIndex + 1} / ${sortedTasks.length}` : '0 / 0'}
                </span>
            </div>

            {sortedTasks.length > 0 ? (
                <div className="relative group w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentTask.id}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className={`bg-white rounded-3xl shadow-md border-2 relative overflow-hidden transition-all duration-300
                            ${selectedTaskId === currentTask.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent'}
                            `}
                        >
                           {/* Priority Indicator Strip */}
                           <div className={`absolute left-0 top-0 bottom-0 w-2 ${getPriorityColor(currentTask.priority)}`} />

                           <div className="pl-5 p-4">
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
                                       <span className="text-[10px] font-bold text-gray-400 uppercase">Start</span>
                                       <div className="flex items-center gap-1 text-gray-700 font-semibold text-sm">
                                           <Clock size={14} className="text-blue-500"/>
                                           {currentTask.time || '--:--'}
                                       </div>
                                   </div>
                                   <div className="flex flex-col items-start">
                                       <span className="text-[10px] font-bold text-gray-400 uppercase">Duration</span>
                                       <div className="flex items-center gap-1 text-gray-700 font-semibold text-sm">
                                            <Calendar size={14} className="text-purple-500"/>
                                           {currentTask.durationMinutes}m
                                       </div>
                                   </div>
                                   <div className="flex flex-col items-start">
                                       <span className="text-[10px] font-bold text-gray-400 uppercase">Promos</span>
                                       <div className="flex items-center gap-1 text-gray-700 font-semibold text-sm">
                                            <Zap size={14} className="text-yellow-500"/>
                                            {currentTask.pomodoroCount}
                                       </div>
                                   </div>
                               </div>
                           </div>
                        </motion.div>
                    </AnimatePresence>
                     <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between pointer-events-none px-0 z-20">
                        <button onClick={handlePrevTask} disabled={browsingTaskIndex === 0} className="pointer-events-auto w-10 h-10 -ml-4 bg-white shadow-lg rounded-full flex items-center justify-center disabled:opacity-0 transition-opacity text-gray-600 hover:text-blue-500"><ChevronLeft size={24} /></button>
                        <button onClick={handleNextTask} disabled={browsingTaskIndex === sortedTasks.length - 1} className="pointer-events-auto w-10 h-10 -mr-4 bg-white shadow-lg rounded-full flex items-center justify-center disabled:opacity-0 transition-opacity text-gray-600 hover:text-blue-500"><ChevronRight size={24} /></button>
                    </div>
                </div>
            ) : (
                <div className="bg-white/50 border-2 border-dashed border-gray-300 rounded-3xl p-6 flex flex-col items-center justify-center text-gray-400 min-h-[140px]">
                    <p>No active tasks</p>
                    <p className="text-xs mt-1">Add one in the Tasks tab</p>
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
    </div>
  );
};

export default TimerView;