import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Calendar as CalendarIcon, CheckCircle2, Circle, MoreHorizontal, Clock, Zap, Trash2, X, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Priority } from '../types';

interface TasksViewProps {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
}

const TasksView: React.FC<TasksViewProps> = ({ tasks, addTask, updateTask, deleteTask, toggleTask }) => {
  // State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date()); // For navigating the custom calendar

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formPriority, setFormPriority] = useState<Priority>(Priority.MEDIUM);
  const [formDuration, setFormDuration] = useState(25);
  const [formPomodoros, setFormPomodoros] = useState(1);
  const [formNote, setFormNote] = useState("");

  // Initialize form when opening modal
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
        } else {
            // New Task Defaults
            setFormTitle("");
            setFormDate(selectedDate.toISOString().split('T')[0]);
            const now = new Date();
            const timeString = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
            setFormTime(timeString);
            setFormPriority(Priority.MEDIUM);
            setFormDuration(25);
            setFormPomodoros(1);
            setFormNote("");
        }
    }
  }, [isModalOpen, editingTask, selectedDate]);

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

  // --- Calendar Strip Logic (Weekly) ---
  const weekDays = useMemo(() => {
    const days = [];
    const start = new Date(selectedDate);
    // Center the selected date roughly in the week view
    start.setDate(selectedDate.getDate() - 3);
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push(d);
    }
    return days;
  }, [selectedDate]);

  const isSameDay = (d1: Date, d2: Date) => {
      return d1.toISOString().split('T')[0] === d2.toISOString().split('T')[0];
  };

  const hasTaskOnDay = (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      return tasks.some(t => t.date === dateStr && !t.completed);
  };

  // --- All Tasks Grouped Logic ---
  const groupedTasks = useMemo(() => {
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
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (dateStr === today.toISOString().split('T')[0]) return "Today";
      if (dateStr === tomorrow.toISOString().split('T')[0]) return "Tomorrow";
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // --- Priority Helpers ---
  const getPriorityColor = (p: Priority) => {
      switch(p) {
          case Priority.HIGH: return 'bg-red-100 text-red-600 border-red-200';
          case Priority.MEDIUM: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
          case Priority.LOW: return 'bg-blue-100 text-blue-600 border-blue-200';
          default: return 'bg-gray-100 text-gray-600';
      }
  };

  // --- Month Calendar Logic ---
  const getDaysInMonth = (year: number, month: number) => {
      return new Date(year, month + 1, 0).getDate();
  };
  const getFirstDayOfMonth = (year: number, month: number) => {
      return new Date(year, month, 1).getDay();
  };
  
  const generateMonthDays = () => {
      const year = pickerDate.getFullYear();
      const month = pickerDate.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month); // 0 = Sunday
      const days = [];
      
      // Empty slots for previous month
      for (let i = 0; i < firstDay; i++) {
          days.push(null);
      }
      // Days
      for (let i = 1; i <= daysInMonth; i++) {
          days.push(new Date(year, month, i));
      }
      return days;
  };

  return (
    <div className="pt-safe-top pb-32 px-4 h-full relative flex flex-col">
      
      {/* Month Picker Overlay */}
      <AnimatePresence>
        {showMonthPicker && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute top-16 right-4 z-50 bg-[#1c1c1e] text-white p-4 rounded-xl shadow-2xl w-72"
            >
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() - 1, 1))}>
                        <ChevronLeft size={20} className="text-gray-400" />
                    </button>
                    <span className="font-bold">
                        {pickerDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() + 1, 1))}>
                        <ChevronRight size={20} className="text-gray-400" />
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['S','M','T','W','T','F','S'].map(d => (
                        <span key={d} className="text-xs text-gray-500 font-bold">{d}</span>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {generateMonthDays().map((d, idx) => {
                        if (!d) return <div key={idx} />;
                        const isSelected = isSameDay(d, selectedDate);
                        const isToday = isSameDay(d, new Date());
                        return (
                            <button 
                                key={idx}
                                onClick={() => {
                                    setSelectedDate(d);
                                    setShowMonthPicker(false);
                                }}
                                className={`h-8 w-8 rounded-full text-sm flex items-center justify-center transition-colors
                                    ${isSelected ? 'bg-blue-600 font-bold' : isToday ? 'text-blue-400 font-bold' : 'hover:bg-gray-700'}
                                `}
                            >
                                {d.getDate()}
                            </button>
                        );
                    })}
                </div>
                <div className="mt-4 flex justify-between px-2">
                     <button onClick={() => setShowMonthPicker(false)} className="text-xs text-gray-400">Cancel</button>
                     <button onClick={() => { setSelectedDate(new Date()); setShowMonthPicker(false); }} className="text-xs text-blue-400 font-bold">Today</button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex justify-between items-center mb-4 mt-2 px-2">
         <div>
            <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-sm text-gray-500 font-medium">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
         </div>
         <button 
            onClick={() => setShowMonthPicker(!showMonthPicker)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-sm border
                 ${showMonthPicker ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-gray-100'}
            `}>
            <CalendarIcon size={20} />
         </button>
      </div>

      {/* Weekly Calendar Strip (Still useful for quick navigation) */}
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
                    <span className="text-[10px] font-bold uppercase tracking-wide mb-0.5">{d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0,3)}</span>
                    <span className={`text-xl font-semibold leading-none ${isSelected ? 'text-white' : isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                        {d.getDate()}
                    </span>
                    
                    {/* Task Indicator Dot */}
                    <div className="h-1.5 mt-1 flex items-center justify-center">
                         {hasTask && (
                             <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />
                         )}
                    </div>
                </button>
              );
          })}
      </div>

      {/* Task List - Grouped by Date */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-32">
        {Object.keys(groupedTasks).length === 0 ? (
             <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <CalendarDays size={24} className="opacity-50" />
                </div>
                <p>No tasks yet</p>
                <button onClick={openAdd} className="text-blue-500 font-medium text-sm mt-2">Create your first task</button>
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
                                    {/* Checkbox */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                                        className="mt-0.5 flex-shrink-0"
                                    >
                                        {task.completed ? 
                                            <CheckCircle2 className="text-green-500 fill-green-100" size={24} /> : 
                                            <Circle className={`text-gray-300 ${task.priority === Priority.HIGH ? 'text-rose-400' : ''}`} size={24} />
                                        }
                                    </button>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className={`font-semibold text-gray-900 truncate pr-2 ${task.completed ? 'line-through text-gray-400' : ''}`}>
                                                {task.title}
                                            </h3>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            {/* Time */}
                                            {task.time && (
                                                <span className="text-xs font-mono font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                                                    {task.time}
                                                </span>
                                            )}

                                            {/* Priority Badge */}
                                            <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                            
                                            {/* Pomodoro Count */}
                                            <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                <Zap size={10} className="fill-gray-400 text-gray-400" /> 
                                                {task.pomodoroCount}
                                            </span>

                                            {/* Duration */}
                                            <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                <Clock size={10} /> 
                                                {task.durationMinutes}m
                                            </span>
                                        </div>

                                        {/* Note Preview */}
                                        {task.note && (
                                            <p className="text-xs text-gray-400 mt-2 line-clamp-1">
                                                {task.note}
                                            </p>
                                        )}
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

      {/* Floating Add Button */}
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
                    className="bg-[#f2f2f7] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl h-[85vh] flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <h2 className="text-xl font-bold text-gray-900">{editingTask ? 'Edit Task' : 'New Task'}</h2>
                        <button onClick={() => setIsModalOpen(false)} className="bg-gray-200 p-1 rounded-full text-gray-500">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="overflow-y-auto flex-1 space-y-5 pb-4 px-1">
                        {/* Title Input */}
                        <div className="bg-white p-4 rounded-xl shadow-sm">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Task Name</label>
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="What needs to be done?" 
                                className="w-full text-lg font-medium outline-none placeholder:text-gray-300 bg-white"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                            />
                        </div>

                        {/* Priority Selector */}
                        <div className="bg-white p-4 rounded-xl shadow-sm">
                             <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Priority</label>
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

                        {/* Date & Time Row */}
                        <div className="flex gap-3">
                            <div className="flex-[1.5] bg-white p-3 rounded-xl shadow-sm">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date</label>
                                <input 
                                    type="date" 
                                    className="w-full text-sm font-semibold text-gray-800 outline-none bg-white"
                                    value={formDate}
                                    onChange={(e) => setFormDate(e.target.value)}
                                />
                            </div>
                            <div className="flex-1 bg-white p-3 rounded-xl shadow-sm">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Start Time</label>
                                <input 
                                    type="time" 
                                    className="w-full text-sm font-semibold text-gray-800 outline-none bg-white"
                                    value={formTime}
                                    onChange={(e) => setFormTime(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Est Time Slider (0-4h) */}
                        <div className="bg-white p-4 rounded-xl shadow-sm">
                             <div className="flex justify-between items-center mb-4">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Est. Duration</label>
                                <span className="text-blue-600 font-bold font-mono">{formDuration} min</span>
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
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Pomodoros</label>
                                <p className="text-xs text-gray-400 mt-0.5">Sessions per task</p>
                            </div>
                            <div className="flex items-center gap-3 bg-gray-50 px-2 py-1 rounded-lg">
                                <button onClick={() => setFormPomodoros(Math.max(1, formPomodoros - 1))} className="w-8 h-8 flex items-center justify-center bg-white shadow-sm rounded-md text-gray-600 font-bold active:scale-95 transition-transform">-</button>
                                <span className="font-bold text-gray-900 w-4 text-center">{formPomodoros}</span>
                                <button onClick={() => setFormPomodoros(Math.min(7, formPomodoros + 1))} className="w-8 h-8 flex items-center justify-center bg-white shadow-sm rounded-md text-blue-600 font-bold active:scale-95 transition-transform">+</button>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white p-4 rounded-xl shadow-sm">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Note</label>
                            <textarea 
                                rows={3}
                                className="w-full text-sm text-gray-800 outline-none resize-none placeholder:text-gray-300 bg-white"
                                placeholder="Add any details..."
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
                                <Trash2 size={18} /> Delete
                                </button>
                            )}
                            <button 
                            onClick={handleSave}
                            className="flex-[2] py-3.5 rounded-xl font-semibold text-white bg-blue-600 shadow-lg shadow-blue-200 active:scale-95 transition-all"
                            >
                            {editingTask ? 'Save Changes' : 'Create Task'}
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