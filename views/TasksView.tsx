import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Calendar as CalendarIcon, CheckCircle2, Circle, MoreHorizontal, Clock, Zap, Trash2, X, CalendarDays, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Priority, Settings } from '../types';
import { IOSWheelPicker } from '../components/IOSWheelPicker';
import { translations } from '../utils/translations';
import { getLocalDateString } from '../App';

interface TasksViewProps {
  tasks: Task[];
  settings: Settings;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
}

const formatMinutes = (m: number) => {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
};

const isSameDay = (d1: Date, d2: Date) => getLocalDateString(d1) === getLocalDateString(d2);

const generateCalendarGrid = (cursorDate: Date): (Date | null)[] => {
    const year = cursorDate.getFullYear();
    const month = cursorDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
};

const TasksView: React.FC<TasksViewProps> = ({ tasks, settings, addTask, updateTask, deleteTask, toggleTask }) => {
  const t = translations[settings.language].tasks;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formPriority, setFormPriority] = useState<Priority>(Priority.MEDIUM);
  const [formDuration, setFormDuration] = useState(25);
  const [formPomodoros, setFormPomodoros] = useState(1);
  const [formNote, setFormNote] = useState("");

  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [formTime, setFormTime] = useState("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [modalCalendarCursor, setModalCalendarCursor] = useState(new Date());
  
  // 安全的类型定义，防止编译报错
  const calendarGrid: (Date | null)[] = useMemo(() => generateCalendarGrid(modalCalendarCursor), [modalCalendarCursor]);

  const [wHour12, setWHour12] = useState("12");
  const [wMinute, setWMinute] = useState("00");
  const [wAmPm, setWAmPm] = useState("AM");

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

  useEffect(() => {
    if (isModalOpen) {
        if (editingTask) {
            setFormTitle(editingTask.title);
            setSelectedDates(new Set([editingTask.date]));
            setFormTime(editingTask.time || "");
            setFormPriority(editingTask.priority);
            setFormDuration(editingTask.durationMinutes);
            setFormPomodoros(editingTask.pomodoroCount);
            setFormNote(editingTask.note || "");
            setModalCalendarCursor(new Date(editingTask.date + "T00:00:00"));
            const timeObj = to12h(editingTask.time || "09:00");
            setWHour12(timeObj.h); setWMinute(timeObj.m); setWAmPm(timeObj.p);
        } else {
            setFormTitle("");
            const todayStr = getLocalDateString();
            setSelectedDates(new Set([todayStr]));
            setModalCalendarCursor(new Date());
            const now = new Date();
            const timeStr = `${(now.getHours()+1).toString().padStart(2,'0')}:00`;
            setFormTime(timeStr);
            const timeObj = to12h(timeStr);
            setWHour12(timeObj.h); setWMinute(timeObj.m); setWAmPm(timeObj.p);
            setFormPriority(Priority.MEDIUM);
            setFormDuration(25);
            setFormPomodoros(1);
            setFormNote("");
        }
        setIsDatePickerOpen(false);
        setIsTimePickerOpen(false);
    }
  }, [isModalOpen, editingTask]);

  useEffect(() => {
      if (isModalOpen) setFormTime(to24h(wHour12, wMinute, wAmPm));
  }, [wHour12, wMinute, wAmPm, isModalOpen]);

  const handleDateClick = (dateStr: string) => {
      const newSet = new Set(selectedDates);
      if (newSet.has(dateStr)) { if (newSet.size > 1) newSet.delete(dateStr); }
      else newSet.add(dateStr);
      setSelectedDates(newSet);
  };

  const handleSave = () => {
    if (!formTitle.trim() || selectedDates.size === 0) return;
    const sortedDates = Array.from(selectedDates).sort();
    const commonData = { title: formTitle, time: formTime, durationMinutes: formDuration, priority: formPriority, pomodoroCount: formPomodoros, note: formNote };

    if (editingTask) {
        updateTask({ ...editingTask, ...commonData, date: sortedDates[0] });
        for (let i = 1; i < sortedDates.length; i++) {
            addTask({ id: Date.now().toString() + i, completed: false, date: sortedDates[i], ...commonData });
        }
    } else {
        sortedDates.forEach((dateStr, index) => {
            addTask({ id: Date.now().toString() + index, completed: false, date: dateStr, ...commonData });
        });
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleDelete = () => { if (editingTask) { deleteTask(editingTask.id); setIsModalOpen(false); setEditingTask(null); } };

  const weekDays: Date[] = useMemo(() => {
    const days: Date[] = [];
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - 3);
    for (let i = 0; i < 7; i++) {
        const d = new Date(start); d.setDate(start.getDate() + i); days.push(d);
    }
    return days;
  }, [selectedDate]);

  const hasTaskOnDay = (date: Date) => {
      const dateStr = getLocalDateString(date);
      return tasks.some(t => t.date === dateStr && !t.completed);
  };

  const groupedTasks: Record<string, Task[]> = useMemo(() => {
      const groups: Record<string, Task[]> = {};
      [...tasks].sort((a,b) => {
          const dateA = new Date(a.date + (a.time ? 'T'+a.time : ''));
          const dateB = new Date(b.date + (b.time ? 'T'+b.time : ''));
          return dateA.getTime() - dateB.getTime();
      }).forEach(task => {
          if (!groups[task.date]) groups[task.date] = [];
          groups[task.date].push(task);
      });
      return groups;
  }, [tasks]);

  const getGroupLabel = (dateStr: string) => {
      const todayStr = getLocalDateString();
      const tom = new Date(); tom.setDate(tom.getDate() + 1);
      const tomStr = getLocalDateString(tom);
      if (dateStr === todayStr) return t.today;
      if (dateStr === tomStr) return t.tomorrow;
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString(settings.language === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getPriorityColor = (p: Priority) => {
      switch(p) {
          case Priority.HIGH: return 'bg-red-100 text-red-600 border-red-200 dark:bg-red-900/40 dark:text-red-300';
          case Priority.MEDIUM: return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300';
          case Priority.LOW: return 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300';
          default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700';
      }
  };

  return (
    <div className="pt-safe-top pb-32 px-4 h-full relative flex flex-col transition-colors duration-300">
      <div className="flex justify-between items-center mb-4 mt-2 px-2">
         <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {selectedDate.toLocaleDateString(settings.language === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
         </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm mb-6 flex justify-between items-center relative overflow-hidden flex-shrink-0">
          {weekDays.map((d, i) => {
              const isSelected = isSameDay(d, selectedDate);
              const isToday = isSameDay(d, new Date());
              const hasTask = hasTaskOnDay(d);
              return (
                <button key={i} onClick={() => setSelectedDate(d)}
                    className={`flex flex-col items-center justify-center w-11 h-16 rounded-xl transition-all relative z-10 ${isSelected ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 dark:text-gray-500'}`}>
                    <span className="text-[10px] font-bold uppercase mb-0.5">{d.toLocaleDateString(settings.language === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'short' }).slice(0,3)}</span>
                    <span className={`text-xl font-semibold leading-none ${isSelected ? 'text-white' : isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>{d.getDate()}</span>
                    <div className="h-1.5 mt-1 flex items-center justify-center">{hasTask && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />}</div>
                </button>
              );
          })}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-32">
        {Object.keys(groupedTasks).length === 0 ? (
             <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-600">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4"><CalendarDays size={24} className="opacity-50" /></div>
                <p>{t.empty}</p>
                <button onClick={() => setIsModalOpen(true)} className="text-blue-500 font-medium text-sm mt-2">{t.createFirst}</button>
             </div>
        ) : (
            Object.entries(groupedTasks).map(([dateStr, dayTasks]) => (
                <div key={dateStr}>
                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-2 sticky top-0 bg-[#f2f2f7] dark:bg-black z-10 py-1">{getGroupLabel(dateStr)}</h3>
                    <div className="space-y-3">
                        {dayTasks.map((task) => (
                            <motion.div layout key={task.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm group" onClick={() => { setEditingTask(task); setIsModalOpen(true); }}>
                                <div className="flex items-start gap-3">
                                    <button onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }} className="mt-0.5 flex-shrink-0">
                                        {task.completed ? <CheckCircle2 className="text-green-500 fill-green-100 dark:fill-green-900/30" size={24} /> : <Circle className="text-gray-300 dark:text-gray-600" size={24} />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-semibold text-gray-900 dark:text-white truncate ${task.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>{task.title}</h3>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            {task.time && <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-1.5 py-0.5 rounded">{task.time}</span>}
                                            <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                                            <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded"><Zap size={10} /> {task.pomodoroCount}</span>
                                            <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded"><Clock size={10} /> {formatMinutes(task.durationMinutes)}</span>
                                        </div>
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

      <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setEditingTask(null); setIsModalOpen(true); }} className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-white z-40"><Plus size={28} /></motion.button>

      <AnimatePresence>
        {isModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60] flex items-end justify-center" onClick={() => setIsModalOpen(false)}>
                <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="bg-[#f2f2f7] dark:bg-[#1c1c1e] w-full max-w-md rounded-t-3xl p-6 shadow-2xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingTask ? t.editTask : t.newTask}</h2>
                        <button onClick={() => setIsModalOpen(false)} className="bg-gray-200 dark:bg-gray-700 p-1 rounded-full text-gray-500"><X size={20} /></button>
                    </div>
                    <div className="overflow-y-auto flex-1 space-y-5 pb-4 no-scrollbar">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm"><input autoFocus type="text" placeholder={t.whatToDo} className="w-full text-lg font-medium outline-none bg-transparent text-gray-900 dark:text-white" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} /></div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                            <div className="flex flex-col border-b dark:border-gray-700">
                                <div className="flex justify-between items-center p-4 cursor-pointer" onClick={() => { setIsDatePickerOpen(!isDatePickerOpen); setIsTimePickerOpen(false); }}>
                                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center"><CalendarIcon size={18} /></div><span className="font-medium dark:text-white">{t.date}</span></div>
                                    <span className="text-sm font-medium text-blue-500">{selectedDates.size} days</span>
                                </div>
                                <AnimatePresence>{isDatePickerOpen && <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-gray-50/50 dark:bg-gray-900/50 p-4">
                                    <div className="flex justify-between items-center mb-4"><button onClick={() => setModalCalendarCursor(new Date(modalCalendarCursor.setMonth(modalCalendarCursor.getMonth()-1)))}><ChevronLeft size={20}/></button><span className="font-bold dark:text-white">{modalCalendarCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span><button onClick={() => setModalCalendarCursor(new Date(modalCalendarCursor.setMonth(modalCalendarCursor.getMonth()+1)))}><ChevronRight size={20}/></button></div>
                                    <div className="grid grid-cols-7 gap-1 text-center mb-2">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="text-[10px] font-bold text-gray-400">{d}</div>)}</div>
                                    <div className="grid grid-cols-7 gap-1">{calendarGrid.map((date, i) => date ? <button key={i} onClick={() => handleDateClick(getLocalDateString(date))} className={`h-9 w-9 rounded-full text-sm font-medium ${selectedDates.has(getLocalDateString(date)) ? 'bg-blue-500 text-white' : 'dark:text-gray-300'}`}>{date.getDate()}</button> : <div key={i} />)}</div>
                                </motion.div>}</AnimatePresence>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex justify-between items-center p-4 cursor-pointer" onClick={() => { setIsTimePickerOpen(!isTimePickerOpen); setIsDatePickerOpen(false); }}>
                                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center"><Clock size={18} /></div><span className="font-medium dark:text-white">{t.time}</span></div>
                                    <span className="text-sm font-medium text-blue-500">{wHour12}:{wMinute} {wAmPm}</span>
                                </div>
                                <AnimatePresence>{isTimePickerOpen && <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-gray-50/50 dark:bg-gray-900/50 p-6 flex justify-center gap-1">
                                    <IOSWheelPicker items={Array.from({length:12}, (_,i)=>(i+1).toString())} selected={wHour12} onChange={setWHour12} width="w-16" />
                                    <div className="h-32 flex items-center font-bold text-gray-400 text-xl">:</div>
                                    <IOSWheelPicker items={Array.from({length:60}, (_,i)=>i.toString().padStart(2,'0'))} selected={wMinute} onChange={setWMinute} width="w-16" />
                                    <IOSWheelPicker items={["AM", "PM"]} selected={wAmPm} onChange={setWAmPm} width="w-16" />
                                </motion.div>}</AnimatePresence>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                            <span className="text-xs font-bold text-gray-400 uppercase mb-3 block">{t.priority}</span>
                            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                                {[Priority.LOW, Priority.MEDIUM, Priority.HIGH].map(p => <button key={p} onClick={() => setFormPriority(p)} className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${formPriority === p ? 'bg-blue-500 text-white' : 'text-gray-500'}`}>{p}</button>)}
                            </div>
                        </div>
                        {editingTask && <button onClick={handleDelete} className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl font-semibold flex items-center justify-center gap-2"><Trash2 size={18} /> {t.delete}</button>}
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 w-full"><button onClick={handleSave} disabled={!formTitle.trim()} className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50">{editingTask ? t.save : t.create}</button></div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TasksView;