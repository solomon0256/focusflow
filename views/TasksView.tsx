
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Calendar as CalendarIcon, CheckCircle2, Circle, MoreHorizontal, Clock, Zap, Trash2, X, CalendarDays, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Priority, Settings } from '../types';
import { IOSWheelPicker } from '../components/IOSWheelPicker';
import { translations } from '../utils/translations';
import { getLocalDateString } from '../App'; // Import Date Fix

interface TasksViewProps {
  tasks: Task[];
  settings: Settings; // Added settings prop
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
}

// Helper to format minutes
const formatMinutes = (m: number) => {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
};

// --- Calendar Logic Moved Outside Component for Better Type Inference ---
// FIXED: Use Local Date String comparison
const isSameDay = (d1: Date, d2: Date) => getLocalDateString(d1) === getLocalDateString(d2);

const generateCalendarGrid = (cursorDate: Date): (Date | null)[] => {
    const year = cursorDate.getFullYear();
    const month = cursorDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
    
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
};

const TasksView: React.FC<TasksViewProps> = ({ tasks, settings, addTask, updateTask, deleteTask, toggleTask }) => {
  const t = translations[settings.language].tasks;

  // --- Main View State ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  
  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // --- Form State ---
  const [formTitle, setFormTitle] = useState("");
  const [formPriority, setFormPriority] = useState<Priority>(Priority.MEDIUM);
  const [formDuration, setFormDuration] = useState(25);
  const [formPomodoros, setFormPomodoros] = useState(1);
  const [formNote, setFormNote] = useState("");

  // --- New Date/Time Picker State ---
  // We keep the raw values as the source of truth
  const [formDate, setFormDate] = useState(""); // YYYY-MM-DD
  const [formTime, setFormTime] = useState(""); // HH:mm (24h)
  
  // UI Toggles
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  
  // Calendar Navigation State (Inside Modal)
  const [modalCalendarCursor, setModalCalendarCursor] = useState(new Date());
  
  // FIX: Pre-calculate grid to avoid type inference issues
  // Using explicit type annotation instead of generic to avoid TSX parsing issues
  const calendarGrid: (Date | null)[] = useMemo(() => generateCalendarGrid(modalCalendarCursor), [modalCalendarCursor]);

  // Time Wheel State (12h format)
  const [wHour12, setWHour12] = useState("12");
  const [wMinute, setWMinute] = useState("00");
  const [wAmPm, setWAmPm] = useState("AM");

  // --- Helpers for Time Conversion ---
  const to12h = (time24: string) => {
      if (!time24) return { h: "12", m: "00", p: "AM" };
      const [h, m] = time24.split(':').map(Number);
      const p = h >= 12 ? "PM" : "AM";
      let h12 = h % 12;
      if (h12 === 0) h12 = 12;
      return { h: h12.toString(), m: m.toString().padStart(2,'0'), p };
  };

  const to24h = (h12: string, m: string, p: string) => {
      let h = parseInt(h12);
      if (p === "PM" && h !== 12) h += 12;
      if (p === "AM" && h === 12) h = 0;
      return `${h.toString().padStart(2,'0')}:${m}`;
  };

  // --- Initialization ---
  useEffect(() => {
    if (isModalOpen) {
        if (editingTask) {
            setFormTitle(editingTask.title);
            setFormDate(editingTask.date);
            setFormTime(editingTask.time || "");
            setFormPriority(editingTask.priority);
            setFormDuration(editingTask.durationMinutes);
            setFormPomodoros(editingTask.pomodoroCount);
            setFormNote(editingTask.note || "");
            
            // Init Calendar Cursor
            setModalCalendarCursor(new Date(editingTask.date + "T00:00:00"));

            // Init Wheels
            const t = to12h(editingTask.time || "09:00"); // Default 9AM if no time
            setWHour12(t.h.toString());
            setWMinute(t.m);
            setWAmPm(t.p);
        } else {
            // New Task
            setFormTitle("");
            
            // FIXED: Use Local Date for Default
            const todayStr = getLocalDateString();
            setFormDate(todayStr);
            setModalCalendarCursor(new Date());
            
            // Default time: Next hour
            const now = new Date();
            const nextHour = new Date();
            nextHour.setHours(now.getHours() + 1, 0, 0, 0);
            const timeStr = `${nextHour.getHours().toString().padStart(2,'0')}:${nextHour.getMinutes().toString().padStart(2,'0')}`;
            
            setFormTime(timeStr);
            
            const t = to12h(timeStr);
            setWHour12(t.h.toString());
            setWMinute(t.m);
            setWAmPm(t.p);

            setFormPriority(Priority.MEDIUM);
            setFormDuration(25);
            setFormPomodoros(1);
            setFormNote("");
        }
        // Collapse pickers by default
        setIsDatePickerOpen(false);
        setIsTimePickerOpen(false);
    }
  }, [isModalOpen, editingTask]);

  // Sync Wheel Changes to Form Time
  useEffect(() => {
      if (isModalOpen) {
          const newTime = to24h(wHour12, wMinute, wAmPm);
          setFormTime(newTime);
      }
  }, [wHour12, wMinute, wAmPm, isModalOpen]);

  // --- Action Handlers ---
  const handleSave = () => {
    if (!formTitle.trim()) return;

    const taskData = {
        title: formTitle,
        date: formDate,
        time: formTime,
        durationMinutes: formDuration,
        priority: formPriority,
        pomodoroCount: formPomodoros,
        note: formNote,
    };

    if (editingTask) {
        updateTask({ ...editingTask, ...taskData });
    } else {
        addTask({
            id: Date.now().toString(),
            completed: false,
            ...taskData
        });
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleDelete = () => {
      if (editingTask) {
          deleteTask(editingTask.id);
          setIsModalOpen(false);
          setEditingTask(null);
      }
  };

  const openEdit = (task: Task) => {
      setEditingTask(task);
      setIsModalOpen(true);
  };

  const openAdd = () => {
      setEditingTask(null);
      setIsModalOpen(true);
  };

  // --- Main View Data ---
  const weekDays = useMemo<Date[]>(() => {
    const days: Date[] = [];
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - 3);
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push(d);
    }
    return days;
  }, [selectedDate]);

  const hasTaskOnDay = (date: Date) => {
      const dateStr = getLocalDateString(date); // FIXED
      return tasks.some(t => t.date === dateStr && !t.completed);
  };

  const groupedTasks = useMemo<Record<string, Task[]>>(() => {
      const groups: Record<string, Task[]> = {};
      const sorted = [...tasks].sort((a,b) => {
          const dateA = new Date(a.date + (a.time ? 'T'+a.time : ''));
          const dateB = new Date(b.date + (b.time ? 'T'+b.time : ''));
          return dateA.getTime() - dateB.getTime();
      });

      sorted.forEach(task => {
          if (!groups[task.date]) groups[task.date] = [];
          groups[task.date].push(task);
      });
      return groups;
  }, [tasks]);

  const getGroupLabel = (dateStr: string) => {
      const d = new Date(dateStr);
      const todayStr = getLocalDateString();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = getLocalDateString(tomorrow);

      if (dateStr === todayStr) return t.today;
      if (dateStr === tomorrowStr) return t.tomorrow;
      
      // Fix Local Date Display
      // "2023-10-27" -> Date object defaults to UTC midnight, which is 5PM prev day in US.
      // We must construct it safely.
      const [y, m, day] = dateStr.split('-').map(Number);
      const safeDate = new Date(y, m - 1, day);
      return safeDate.toLocaleDateString(settings.language === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getPriorityColor = (p: Priority) => {
      switch(p) {
          case Priority.HIGH: return 'bg-red-100 text-red-600 border-red-200';
          case Priority.MEDIUM: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
          case Priority.LOW: return 'bg-blue-100 text-blue-600 border-blue-200';
          default: return 'bg-gray-100 text-gray-600';
      }
  };

  // --- Wheel Data ---
  const hours12 = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes60 = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  const ampms = ["AM", "PM"];

  return (
    <div className="pt-safe-top pb-32 px-4 h-full relative flex flex-col">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4 mt-2 px-2">
         <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-sm text-gray-500 font-medium">
                {selectedDate.toLocaleDateString(settings.language === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
         </div>
         <div className="w-10 h-10 flex items-center justify-center">
            {/* Placeholder for future filter button */}
         </div>
      </div>

      {/* Weekly Calendar Strip */}
      <div className="bg-white p-3 rounded-2xl shadow-sm mb-6 flex justify-between items-center relative overflow-hidden flex-shrink-0">
          {weekDays.map((d, i) => {
              const isSelected = isSameDay(d, selectedDate);
              const isToday = isSameDay(d, new Date());
              const hasTask = hasTaskOnDay(d);
              
              return (
                <button 
                    key={i} 
                    onClick={() => setSelectedDate(d)}
                    className={`flex flex-col items-center justify-center w-11 h-16 rounded-xl transition-all relative z-10
                        ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' : 'text-gray-400 hover:bg-gray-50'}
                    `}
                >
                    <span className="text-[10px] font-bold uppercase tracking-wide mb-0.5">{d.toLocaleDateString(settings.language === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'short' }).slice(0,3)}</span>
                    <span className={`text-xl font-semibold leading-none ${isSelected ? 'text-white' : isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                        {d.getDate()}
                    </span>
                    <div className="h-1.5 mt-1 flex items-center justify-center">
                         {hasTask && (
                             <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />
                         )}
                    </div>
                </button>
              );
          })}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-32">
        {Object.keys(groupedTasks).length === 0 ? (
             <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <CalendarDays size={24} className="opacity-50" />
                </div>
                <p>{t.empty}</p>
                <button onClick={openAdd} className="text-blue-500 font-medium text-sm mt-2">{t.createFirst}</button>
             </div>
        ) : (
            Object.entries(groupedTasks).map(([dateStr, dayTasks]) => (
                <div key={dateStr}>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 sticky top-0 bg-[#f2f2f7] z-10 py-1">
                        {getGroupLabel(dateStr)}
                    </h3>
                    <div className="space-y-3">
                        {dayTasks.map((task) => (
                            <motion.div 
                                layout
                                key={task.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-transparent hover:border-blue-100 transition-colors group"
                                onClick={() => openEdit(task)}
                            >
                                <div className="flex items-start gap-3">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                                        className="mt-0.5 flex-shrink-0"
                                    >
                                        {task.completed ? 
                                            <CheckCircle2 className="text-green-500 fill-green-100" size={24} /> : 
                                            <Circle className={`text-gray-300 ${task.priority === Priority.HIGH ? 'text-rose-400' : ''}`} size={24} />
                                        }
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className={`font-semibold text-gray-900 truncate pr-2 ${task.completed ? 'line-through text-gray-400' : ''}`}>
                                                {task.title}
                                            </h3>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            {task.time && <span className="text-xs font-mono font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">{task.time}</span>}
                                            <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                                            <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded"><Zap size={10} className="fill-gray-400 text-gray-400" /> {task.pomodoroCount}</span>
                                            <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                <Clock size={10} /> {formatMinutes(task.durationMinutes)}
                                            </span>
                                        </div>
                                        {task.note && <p className="text-xs text-gray-400 mt-2 line-clamp-1">{task.note}</p>}
                                    </div>
                                    <MoreHorizontal size={20} className="text-gray-300" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ))
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={openAdd}
        className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 rounded-full shadow-lg shadow-blue-300 flex items-center justify-center text-white z-40"
      >
        <Plus size={28} strokeWidth={2.5} />
      </motion.button>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60] flex items-end sm:items-center justify-center"
                onClick={() => setIsModalOpen(false)}
            >
                <motion.div 
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-[#f2f2f7] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl h-[90vh] sm:h-[85vh] flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <h2 className="text-xl font-bold text-gray-900">{editingTask ? t.editTask : t.newTask}</h2>
                        <button onClick={() => setIsModalOpen(false)} className="bg-gray-200 p-1 rounded-full text-gray-500">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="overflow-y-auto flex-1 space-y-5 pb-4 px-1 no-scrollbar">
                        {/* Title Input */}
                        <div className="bg-white p-4 rounded-xl shadow-sm">
                            <input 
                                autoFocus
                                type="text" 
                                placeholder={t.whatToDo} 
                                className="w-full text-lg font-medium outline-none placeholder:text-gray-300 bg-white"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                            />
                        </div>

                        {/* Date & Time Section (iOS Grouped Style) */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            {/* DATE ROW */}
                            <div className="flex flex-col border-b border-gray-100">
                                <div 
                                    className="flex justify-between items-center p-4 cursor-pointer active:bg-gray-50 transition-colors"
                                    onClick={() => {
                                        setIsDatePickerOpen(!isDatePickerOpen);
                                        setIsTimePickerOpen(false); // Close time if open
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-red-100 text-red-500 flex items-center justify-center">
                                            <CalendarIcon size={18} />
                                        </div>
                                        <span className="font-medium text-gray-900">{t.date}</span>
                                    </div>
                                    <span className={`text-sm font-medium transition-colors ${isDatePickerOpen ? 'text-blue-500' : 'text-gray-500'}`}>
                                        {/* FIXED: Use Local Date string logic for display */}
                                        {(() => {
                                            if (!formDate) return "";
                                            const [y, m, d] = formDate.split('-').map(Number);
                                            const dateObj = new Date(y, m - 1, d);
                                            return dateObj.toLocaleDateString(settings.language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                        })()}
                                    </span>
                                </div>
                                
                                {/* EXPANDABLE CALENDAR GRID */}
                                <AnimatePresence>
                                    {isDatePickerOpen && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden bg-gray-50/50"
                                        >
                                            <div className="p-4">
                                                <div className="flex justify-between items-center mb-4">
                                                    <button onClick={() => {
                                                        const next = new Date(modalCalendarCursor);
                                                        next.setMonth(next.getMonth() - 1);
                                                        setModalCalendarCursor(next);
                                                    }} className="p-1 hover:bg-gray-200 rounded-full"><ChevronLeft size={20} className="text-gray-500"/></button>
                                                    <span className="font-bold text-gray-900">{modalCalendarCursor.toLocaleDateString(settings.language === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', year: 'numeric' })}</span>
                                                    <button onClick={() => {
                                                        const next = new Date(modalCalendarCursor);
                                                        next.setMonth(next.getMonth() + 1);
                                                        setModalCalendarCursor(next);
                                                    }} className="p-1 hover:bg-gray-200 rounded-full"><ChevronRight size={20} className="text-gray-500"/></button>
                                                </div>
                                                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                                    {['S','M','T','W','T','F','S'].map((d, i) => <span key={i} className="text-[10px] text-gray-400 font-bold">{d}</span>)}
                                                </div>
                                                <div className="grid grid-cols-7 gap-1">
                                                    {calendarGrid.map((d, i) => {
                                                        if (!d) return <div key={i} />;
                                                        const isSelected = getLocalDateString(d) === formDate; // FIXED
                                                        const isToday = isSameDay(d, new Date());
                                                        return (
                                                            <button 
                                                                key={i}
                                                                onClick={() => setFormDate(getLocalDateString(d))} // FIXED
                                                                className={`h-9 w-9 rounded-full text-sm flex items-center justify-center transition-all
                                                                    ${isSelected ? 'bg-blue-600 text-white font-bold shadow-md' : isToday ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-700 hover:bg-white'}
                                                                `}
                                                            >
                                                                {d.getDate()}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* TIME ROW */}
                            <div className="flex flex-col">
                                <div 
                                    className="flex justify-between items-center p-4 cursor-pointer active:bg-gray-50 transition-colors"
                                    onClick={() => {
                                        setIsTimePickerOpen(!isTimePickerOpen);
                                        setIsDatePickerOpen(false); // Close date if open
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-500 flex items-center justify-center">
                                            <Clock size={18} />
                                        </div>
                                        <span className="font-medium text-gray-900">{t.time}</span>
                                    </div>
                                    <div className={`text-sm font-medium px-2 py-1 rounded-md transition-colors ${isTimePickerOpen ? 'bg-gray-100 text-blue-500' : 'text-gray-500'}`}>
                                        {to12h(formTime).h}:{to12h(formTime).m} <span className="text-[10px] uppercase ml-0.5">{to12h(formTime).p}</span>
                                    </div>
                                </div>

                                {/* EXPANDABLE WHEEL PICKER (AM/PM) */}
                                <AnimatePresence>
                                    {isTimePickerOpen && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden bg-gray-50/50"
                                        >
                                            <div className="flex gap-2 p-4 justify-center">
                                                <div className="w-16"><IOSWheelPicker items={hours12} selected={wHour12} onChange={setWHour12} label="Hour" /></div>
                                                <div className="text-xl font-bold text-gray-300 mt-10">:</div>
                                                <div className="w-16"><IOSWheelPicker items={minutes60} selected={wMinute} onChange={setWMinute} label="Min" /></div>
                                                <div className="w-16"><IOSWheelPicker items={ampms} selected={wAmPm} onChange={setWAmPm} label="Meridiem" /></div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Priority Selector */}
                        <div className="bg-white p-4 rounded-xl shadow-sm">
                             <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.priority}</label>
                             <div className="flex gap-2">
                                {[Priority.LOW, Priority.MEDIUM, Priority.HIGH].map(p => (
                                    <button 
                                        key={p}
                                        onClick={() => setFormPriority(p)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all border
                                            ${formPriority === p 
                                                ? (p === Priority.HIGH ? 'bg-red-500 text-white border-red-500' : p === Priority.MEDIUM ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-blue-500 text-white border-blue-500')
                                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        {p}
                                    </button>
                                ))}
                             </div>
                        </div>

                        {/* Est Time Slider (0-4h) */}
                        <div className="bg-white p-4 rounded-xl shadow-sm">
                             <div className="flex justify-between items-center mb-4">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{t.estDuration}</label>
                                <span className="text-blue-600 font-bold font-mono">
                                    {formatMinutes(formDuration)}
                                </span>
                             </div>
                             <input 
                                type="range" 
                                min="0" 
                                max="240" 
                                step="5"
                                value={formDuration}
                                onChange={(e) => setFormDuration(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                             />
                             <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium">
                                 <span>0m</span>
                                 <span>1h</span>
                                 <span>2h</span>
                                 <span>3h</span>
                                 <span>4h</span>
                             </div>
                        </div>

                        {/* Pomodoro Count (Max 7) */}
                        <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{t.pomodoros}</label>
                                <p className="text-xs text-gray-400 mt-0.5">{t.sessionsPerTask}</p>
                            </div>
                            <div className="flex items-center gap-3 bg-gray-50 px-2 py-1 rounded-lg">
                                <button onClick={() => setFormPomodoros(Math.max(1, formPomodoros - 1))} className="w-8 h-8 flex items-center justify-center bg-white shadow-sm rounded-md text-gray-600 font-bold active:scale-95 transition-transform">-</button>
                                <span className="font-bold text-gray-900 w-4 text-center">{formPomodoros}</span>
                                <button onClick={() => setFormPomodoros(Math.min(7, formPomodoros + 1))} className="w-8 h-8 flex items-center justify-center bg-white shadow-sm rounded-md text-blue-600 font-bold active:scale-95 transition-transform">+</button>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white p-4 rounded-xl shadow-sm">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t.note}</label>
                            <textarea 
                                rows={3}
                                className="w-full text-sm text-gray-800 outline-none resize-none placeholder:text-gray-300 bg-white"
                                placeholder={t.note}
                                value={formNote}
                                onChange={(e) => setFormNote(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-4 pb-8 border-t border-gray-200 mt-auto flex-shrink-0 bg-[#f2f2f7]">
                            {editingTask && (
                                <button 
                                onClick={handleDelete}
                                className="flex-1 py-3.5 rounded-xl font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                >
                                <Trash2 size={18} /> {t.delete}
                                </button>
                            )}
                            <button 
                            onClick={handleSave}
                            className="flex-[2] py-3.5 rounded-xl font-semibold text-white bg-blue-600 shadow-lg shadow-blue-200 active:scale-95 transition-all"
                            >
                            {editingTask ? t.save : t.create}
                            </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TasksView;
