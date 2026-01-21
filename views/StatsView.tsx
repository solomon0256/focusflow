
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, Tooltip, Cell, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { IOSCard } from '../components/IOSComponents';
import { Award, Zap, Clock, CheckCircle2, ChevronDown, ChevronUp, Brain, TrendingUp, Flame, Star, TestTube2, LogIn, Trophy } from 'lucide-react';
import { Task, FocusRecord, Settings, User } from '../types';
import { translations } from '../utils/translations';
import { NativeService } from '../services/native';

interface StatsViewProps {
    tasks: Task[];
    focusHistory: FocusRecord[];
    settings: Settings;
    onSimulate?: (minutes: number, dateOffset?: number) => void;
    onBreakStreak?: () => void;
}

const StatsView: React.FC<StatsViewProps> = ({ tasks, focusHistory, settings, onSimulate, onBreakStreak }) => {
  const t = translations[settings.language].stats;
  const [isPetExpanded, setIsPetExpanded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    NativeService.Storage.get<User>('focusflow_user').then(u => setUser(u));
    setIsMounted(true);
  }, [focusHistory]); 

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysRecords = focusHistory.filter(r => r.date === todayStr);
    const totalMinutes = todaysRecords.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    const hours = (totalMinutes / 60).toFixed(1);
    const todaysTasks = tasks.filter(t => t.date === todayStr);
    const completedToday = todaysTasks.filter(t => t.completed);
    
    // Growth specific stats
    const studyExp = Math.floor(totalMinutes * (10 / 25)); // 10 EXP per 25 mins
    const isLogged = user?.pet.lastDailyActivityDate === todayStr;

    return { 
        focusHours: hours, 
        completedCount: completedToday.length, 
        totalTasksToday: todaysTasks.length,
        studyExp,
        isLogged
    };
  }, [tasks, focusHistory, user]);

  const chartData = useMemo(() => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const result = [];
      for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const dayName = days[d.getDay()];
          const minutes = focusHistory.filter(r => r.date === dateStr).reduce((acc, curr) => acc + curr.durationMinutes, 0);
          result.push({ name: dayName, minutes: Math.round(minutes) });
      }
      return result;
  }, [focusHistory]);

  const getRankTitle = (level: number) => {
      const ranks = t.academicRanks || [];
      const index = Math.max(0, Math.min(level - 1, ranks.length - 1));
      return ranks[index];
  };

  const PetCard = () => (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl text-white overflow-hidden shadow-xl shadow-indigo-100 mb-4 relative z-0">
        <div className="p-6 relative z-10 cursor-pointer" onClick={() => setIsPetExpanded(!isPetExpanded)}>
            
            {/* RANK BADGE - TOP CENTER (ALWAYS VISIBLE) */}
            <div className="flex justify-center mb-6">
                <motion.div 
                    initial={{ y: -5, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="bg-white/20 px-4 py-1.5 rounded-full text-[12px] font-black backdrop-blur-md border border-white/30 shadow-lg flex items-center gap-2 uppercase tracking-wide"
                >
                    <Trophy size={12} className="text-yellow-400 fill-yellow-400" />
                    {getRankTitle(user?.pet.level || 1)}
                </motion.div>
            </div>

            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-indigo-100 font-bold mb-1 text-[10px] uppercase tracking-widest opacity-80">{t.companion}</h3>
                    <h2 className="text-3xl font-black">{t.petName}</h2>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    {isPetExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="text-7xl animate-bounce filter drop-shadow-lg">🦊</div>
                <div className="flex-1">
                    <div className="flex justify-between items-end mb-2">
                        <div className="text-[10px] text-indigo-100 font-black tracking-widest uppercase">{t.happiness}</div>
                        <div className="text-[10px] text-indigo-100 font-mono opacity-60 font-bold">{t.level} {user?.pet.level || 1}</div>
                    </div>
                    <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${((user?.pet.currentExp || 0) / (user?.pet.maxExp || 100)) * 100}%` }}
                            className="bg-yellow-400 h-full rounded-full shadow-[0_0_12px_rgba(250,204,21,0.7)]" 
                        />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isPetExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 20 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        className="overflow-hidden border-t border-white/10 pt-4"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                                <span className="text-[10px] text-indigo-100 uppercase font-black tracking-widest">{t.happiness}</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <Star size={16} className="text-yellow-400 fill-yellow-400" />
                                    <span className="text-2xl font-black">{user?.pet.happiness || 100}%</span>
                                </div>
                            </div>
                            <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                                <span className="text-[10px] text-indigo-100 uppercase font-black tracking-widest">EXP</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <Zap size={16} className="text-yellow-400 fill-yellow-400" />
                                    <span className="text-2xl font-black">{Math.round(user?.pet.currentExp || 0)}/{user?.pet.maxExp}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );

  const GrowthChecklist = () => (
    <IOSCard className="!mb-4 p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-2">
            <TrendingUp size={18} className="text-blue-500" />
            <h3 className="font-black text-gray-800 uppercase tracking-tight">{t.growthTitle}</h3>
        </div>
        
        <div className="space-y-4">
            {/* ITEM 1: LOGIN */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${stats.isLogged ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                        <LogIn size={20} />
                    </div>
                    <div>
                        <p className={`text-sm font-bold ${stats.isLogged ? 'text-gray-900' : 'text-gray-400'}`}>{t.growthLogin}</p>
                        <p className="text-[10px] text-gray-400 font-bold opacity-60">Daily Habits</p>
                    </div>
                </div>
                <div className={`text-lg font-mono font-black ${stats.isLogged ? 'text-blue-600' : 'text-gray-300'}`}>
                    {stats.isLogged ? '1 / 1' : '0 / 1'}
                </div>
            </div>

            {/* ITEM 2: TASKS */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${stats.completedCount > 0 ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <p className={`text-sm font-bold ${stats.completedCount > 0 ? 'text-gray-900' : 'text-gray-400'}`}>{t.growthTask}</p>
                        <p className="text-[10px] text-gray-400 font-bold opacity-60">+10 EXP / Task</p>
                    </div>
                </div>
                <div className={`text-lg font-mono font-black ${stats.completedCount > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                    {stats.completedCount}
                </div>
            </div>

            {/* ITEM 3: STUDY EXP */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${stats.studyExp > 0 ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                        <Clock size={20} />
                    </div>
                    <div>
                        <p className={`text-sm font-bold ${stats.studyExp > 0 ? 'text-gray-900' : 'text-gray-400'}`}>{t.growthExp}</p>
                        <p className="text-[10px] text-gray-400 font-bold opacity-60">{t.growthExpRule}</p>
                    </div>
                </div>
                <div className={`text-lg font-mono font-black ${stats.studyExp > 0 ? 'text-orange-600' : 'text-gray-300'}`}>
                    +{stats.studyExp} <span className="text-[10px]">EXP</span>
                </div>
            </div>
        </div>
    </IOSCard>
  );

  return (
    <div className="h-full w-full bg-[#f2f2f7] overflow-y-auto no-scrollbar pt-safe-top pb-32 px-4">
      <div className="flex items-center justify-between mb-4 mt-2 px-1">
        <h1 className="text-3xl font-black text-gray-900 tracking-tighter">{t.title}</h1>
        <button className="bg-white p-2 rounded-full shadow-sm text-gray-400"><TrendingUp size={20} /></button>
      </div>

      <PetCard />
      
      <GrowthChecklist />

      {/* Week Activity Chart Container */}
      <IOSCard className="!mb-4 p-5 min-h-[350px]">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-gray-800 text-lg uppercase tracking-tight">{t.weeklyActivity}</h3>
            <div className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{t.last7Days}</div>
        </div>
        
        <div className="w-full h-[250px] relative">
            {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#9CA3AF', fontWeight: 900}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#9CA3AF', fontWeight: 900}} tickCount={5} />
                        <Tooltip 
                            cursor={{fill: '#f9fafb', radius: 8}} 
                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px'}}
                            labelStyle={{fontWeight: 900, marginBottom: '4px'}}
                        />
                        <Bar dataKey="minutes" radius={[6, 6, 6, 6]} barSize={28}>
                            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.minutes > 60 ? '#3B82F6' : '#E2E8F0'} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
      </IOSCard>

      {/* Simulator Tools */}
      <div className="bg-white p-5 rounded-3xl border border-dashed border-gray-200 mt-4 mb-8">
          <div className="flex items-center gap-2 mb-4">
              <TestTube2 size={12} className="text-purple-400" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logic Simulation</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
              <button onClick={() => onSimulate?.(25)} className="py-2 bg-gray-100 rounded-xl text-[10px] font-black text-gray-500">25m</button>
              <button onClick={() => onSimulate?.(60, 0)} className="py-2 bg-blue-50 rounded-xl text-[10px] font-black text-blue-600">1h</button>
              <button onClick={() => onSimulate?.(120, 1)} className="py-2 bg-indigo-50 rounded-xl text-[10px] font-black text-indigo-600">2h +1d</button>
              <button onClick={onBreakStreak} className="py-2 bg-red-50 rounded-xl text-[10px] font-black text-red-600">Break</button>
          </div>
      </div>
    </div>
  );
};

export default StatsView;
