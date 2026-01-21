
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, Tooltip, Cell, YAxis, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { IOSCard } from '../components/IOSComponents';
import { Award, Zap, Clock, CheckCircle2, ChevronDown, ChevronUp, Brain, TrendingUp, Flame, Star, TestTube2, Trash2, FastForward } from 'lucide-react';
import { Task, FocusRecord, Settings, User, TimerMode } from '../types';
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
  
  useEffect(() => {
    NativeService.Storage.get<User>('focusflow_user').then(u => setUser(u));
  }, [focusHistory]); 

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartDims, setChartDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
        if (chartContainerRef.current) {
            const { offsetWidth, offsetHeight } = chartContainerRef.current;
            if (offsetWidth > 0 && offsetHeight > 0) {
                setChartDims(prev => {
                    if (prev.width === offsetWidth && prev.height === offsetHeight) return prev;
                    return { width: offsetWidth, height: offsetHeight };
                });
            }
        }
    };
    const initialTimer = setTimeout(updateDimensions, 100);
    const observer = new ResizeObserver(() => { window.requestAnimationFrame(updateDimensions); });
    if (chartContainerRef.current) observer.observe(chartContainerRef.current);
    return () => { observer.disconnect(); clearTimeout(initialTimer); };
  }, []);

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysRecords = focusHistory.filter(r => r.date === todayStr);
    const totalMinutes = todaysRecords.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    const hours = (totalMinutes / 60).toFixed(1);
    const todaysTasks = tasks.filter(t => t.date === todayStr);
    const completedToday = todaysTasks.filter(t => t.completed);

    return { focusHours: hours, completedCount: completedToday.length, totalTasksToday: todaysTasks.length };
  }, [tasks, focusHistory]);

  const data = useMemo(() => {
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

  const getTier = (days: number) => {
      if (days >= 6) return 4;
      if (days >= 4) return 3;
      if (days >= 2) return 2;
      return 1;
  };

  const getTierColor = (tier: number) => {
      switch(tier) {
          case 4: return 'bg-amber-400 text-amber-900 shadow-amber-200';
          case 3: return 'bg-indigo-500 text-white shadow-indigo-200';
          case 2: return 'bg-purple-500 text-white shadow-purple-200';
          default: return 'bg-blue-500 text-white shadow-blue-200';
      }
  };

  const getExpReward = (tier: number) => {
      if (tier === 4) return 15;
      if (tier === 3) return 12;
      if (tier === 2) return 10;
      return 5;
  };

  const PetCard = () => (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white overflow-hidden shadow-lg shadow-indigo-200 mb-4 relative z-0">
        <div className="p-5 sm:p-6 relative z-10 cursor-pointer" onClick={() => setIsPetExpanded(!isPetExpanded)}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-indigo-100 font-semibold mb-1 text-sm">{t.companion}</h3>
                    <h2 className="text-2xl font-bold">{t.petName}</h2>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    {isPetExpanded ? <ChevronUp className="text-white" size={20} /> : <ChevronDown className="text-white" size={20} />}
                </div>
            </div>
            <div className="flex items-center gap-5">
                <div className="text-6xl animate-bounce filter drop-shadow-lg">🦊</div>
                <div className="flex-1">
                    <div className="flex justify-between items-end mb-1.5">
                        <div className="text-xs text-indigo-100 font-bold tracking-wider">{t.happiness}</div>
                        <div className="text-xs text-indigo-100 font-mono opacity-80">{t.level} {user?.pet.level || 1}</div>
                    </div>
                    <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${((user?.pet.currentExp || 0) / (user?.pet.maxExp || 100)) * 100}%` }}
                            className="bg-yellow-400 h-full rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]" 
                        />
                    </div>
                </div>
            </div>

            {/* Precision Restoration: Pet Expanded Area */}
            <AnimatePresence>
                {isPetExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden border-t border-white/10 pt-5"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 rounded-2xl p-4">
                                <span className="text-[10px] text-indigo-100 uppercase font-bold tracking-widest">{t.happiness}</span>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                    <span className="text-xl font-bold">{user?.pet.happiness || 100}%</span>
                                </div>
                            </div>
                            <div className="bg-white/10 rounded-2xl p-4">
                                <span className="text-[10px] text-indigo-100 uppercase font-bold tracking-widest">EXP PROGRESS</span>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <Zap size={14} className="text-yellow-400 fill-yellow-400" />
                                    <span className="text-xl font-bold">{user?.pet.currentExp}/{user?.pet.maxExp}</span>
                                </div>
                            </div>
                        </div>
                        <p className="mt-5 text-[11px] text-indigo-100 text-center opacity-70 italic font-medium">
                            {user?.pet.happiness! > 50 ? t.tapCollapse : t.tapExpand}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );

  const StreakDashboard = () => {
      const streak = user?.pet.streakCount || 0;
      const todayTier = getTier(streak);
      const todayStr = new Date().toISOString().split('T')[0];
      const isLoggedToday = user?.pet.lastDailyActivityDate === todayStr;

      return (
          <IOSCard className="!mb-4 p-5 bg-white border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                      <Flame size={18} className={`${isLoggedToday ? 'text-orange-500 fill-orange-500' : 'text-gray-300'}`} />
                      <h3 className="font-bold text-gray-800">{t.streakTitle}</h3>
                  </div>
              </div>

              <div className="flex justify-between items-center mb-6 gap-1 px-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                      const tier = getTier(day);
                      const isCurrent = (day === streak) || (streak > 7 && day === 7);
                      const isPast = day < streak;
                      return (
                          <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
                              <div className={`relative w-full h-8 rounded-lg flex items-center justify-center transition-all duration-500
                                  ${isCurrent ? getTierColor(tier) + ' scale-105 z-10' : (isPast ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-200 border border-dashed border-gray-200')}
                              `}>
                                  {isCurrent && isLoggedToday && (
                                      <motion.div layoutId="streak-glow" className="absolute inset-0 rounded-lg border-2 border-white/50 opacity-50" animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} />
                                  )}
                                  <span className="text-xs font-bold">{day}</span>
                              </div>
                              <span className={`text-[8px] font-bold uppercase tracking-tighter ${isCurrent ? 'text-gray-900' : 'text-gray-300'}`}>Tier {tier}</span>
                          </div>
                      );
                  })}
              </div>

              <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center mb-4">
                  <div className="flex flex-col"><span className="text-[10px] text-gray-400 font-bold uppercase">{t.streakDays}</span><span className="text-lg font-bold text-gray-900">{streak} Days</span></div>
                  <div className="h-8 w-[1px] bg-gray-200" />
                  <div className="flex flex-col items-end"><span className="text-[10px] text-gray-400 font-bold uppercase">{t.expReward}</span><div className="flex items-center gap-1"><Zap size={14} className="text-yellow-500 fill-yellow-500" /><span className="text-lg font-bold text-gray-900">+{getExpReward(todayTier)} EXP</span></div></div>
              </div>

              {/* Enhanced Simulation Tools */}
              <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                      <TestTube2 size={12} className="text-purple-400" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Logic Simulation</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                      <button onClick={() => onSimulate?.(5)} className="py-2 bg-gray-100 rounded-lg text-[9px] font-bold text-gray-500 active:scale-95 transition-transform">5m (Mock)</button>
                      <button onClick={() => onSimulate?.(12, 0)} className="py-2 bg-blue-50 rounded-lg text-[9px] font-bold text-blue-600 active:scale-95 transition-transform">12m (Today)</button>
                      <button onClick={() => onSimulate?.(12, 1)} className="py-2 bg-indigo-50 rounded-lg text-[9px] font-bold text-indigo-600 active:scale-95 transition-transform">12m (+1 Day)</button>
                      <button onClick={onBreakStreak} className="py-2 bg-red-50 rounded-lg text-[9px] font-bold text-red-600 active:scale-95 transition-transform flex items-center justify-center gap-1"><Trash2 size={10} /> Break</button>
                  </div>
              </div>
          </IOSCard>
      );
  };

  return (
    <div className="h-full w-full bg-[#f2f2f7] overflow-y-auto no-scrollbar pt-safe-top pb-32 px-4">
      <div className="flex items-center justify-between mb-4 mt-2 px-1">
        <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
        <button className="bg-white p-2 rounded-full shadow-sm text-gray-400"><TrendingUp size={20} /></button>
      </div>
      <PetCard />
      <div className="grid grid-cols-2 gap-4 mb-4">
        <IOSCard className="!mb-0 p-4 flex flex-col items-center justify-center min-h-[120px]">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3"><Clock className="text-blue-500" size={20} /></div>
            <span className="text-3xl font-bold text-gray-900 leading-none mb-1">{stats.focusHours}<span className="text-lg text-gray-400 font-medium ml-0.5">{t.focusHours}</span></span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.today}</span>
        </IOSCard>
        <IOSCard className="!mb-0 p-4 flex flex-col items-center justify-center min-h-[120px]">
             <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3"><CheckCircle2 className="text-green-500" size={20} /></div>
             <div className="flex items-baseline gap-1 mb-1"><span className="text-3xl font-bold text-gray-900 leading-none">{stats.completedCount}</span><span className="text-sm text-gray-400 font-medium">/ {stats.totalTasksToday}</span></div>
             <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.tasksDone}</span>
        </IOSCard>
      </div>
      <StreakDashboard />
      <IOSCard className="!mb-4 p-5">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 text-lg">{t.weeklyActivity}</h3>
            <div className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{t.last7Days}</div>
        </div>
        <div ref={chartContainerRef} className="w-full h-64 relative">
            {chartDims.width > 0 && (
                <BarChart width={chartDims.width} height={chartDims.height} data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#9CA3AF', fontWeight: 500}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#9CA3AF'}} tickCount={5} />
                    <Tooltip cursor={{fill: '#f9fafb', radius: 4}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} />
                    <Bar dataKey="minutes" radius={[6, 6, 6, 6]} barSize={32}>
                        {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.minutes > 60 ? '#3B82F6' : '#E2E8F0'} />)}
                    </Bar>
                </BarChart>
            )}
        </div>
      </IOSCard>
      <div className="h-4 w-full" />
    </div>
  );
};

export default StatsView;
