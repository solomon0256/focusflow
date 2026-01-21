
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, Cell, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { IOSCard } from '../components/IOSComponents';
import { Award, Zap, Clock, CheckCircle2, ChevronDown, ChevronUp, TrendingUp, Star, TestTube2, LogIn, Trophy, Smile, Activity, Sparkles, Flame, Quote, Battery, Moon } from 'lucide-react';
import { Task, FocusRecord, Settings, User } from '../types';
import { translations } from '../utils/translations';
import { getDailyQuote } from '../utils/quotes';
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
  
  // IsMounted check to prevent hydration issues with Charts
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    NativeService.Storage.get<User>('focusflow_user').then(u => setUser(u));
    setIsMounted(true);
  }, [focusHistory]); 

  const dailyQuote = useMemo(() => getDailyQuote(settings.language), [settings.language]);

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

    // --- NEW: HAPPINESS / MOOD CALCULATION ---
    let totalScore = 0;
    let count = 0;
    todaysRecords.forEach(r => {
        // Fallback to 100 if score missing (legacy records)
        const s = r.score !== undefined ? r.score : 100;
        totalScore += s;
        count++;
    });

    const avgScore = count > 0 ? Math.ceil(totalScore / count) : 0; // Default 0 if no records
    
    // Determine Tier (1-4)
    let tier = 0;
    let moodLabel = t.mood_sleeping;
    let multiplier = 1.0;

    if (count === 0) {
        tier = 0; // Sleeping
        moodLabel = t.mood_sleeping;
        multiplier = 1.0;
    } else if (avgScore > 90) {
        tier = 4;
        moodLabel = t.mood_flow; // "心流"
        multiplier = 1.5;
    } else if (avgScore > 75) {
        tier = 3;
        moodLabel = t.mood_focused; // "集中"
        multiplier = 1.3;
    } else if (avgScore > 60) {
        tier = 2;
        moodLabel = t.mood_low; // "不太集中"
        multiplier = 1.0;
    } else {
        tier = 1;
        moodLabel = t.mood_distracted; // "分神"
        multiplier = 0.8;
    }

    return { 
        focusHours: hours, 
        completedCount: completedToday.length, 
        totalTasksToday: todaysTasks.length,
        studyExp,
        isLogged,
        avgScore,
        mood: moodLabel,
        multiplier,
        tier,
        hasData: count > 0
    };
  }, [tasks, focusHistory, user, t]);

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

  // --- FOX AVATAR ASSETS & LOGIC (28 Levels) ---
  // PLACEHOLDER: Once you have the images, fill this array with the URLs.
  // Leave empty string '' to fallback to Emoji.
  const FOX_ASSETS = [
      '', // L1: Kindergarten
      '', // L2: Elem 1st
      '', // L3: Elem 2nd
      '', // L4: Elem 3rd
      '', // L5: Elem 4th
      '', // L6: Elem 5th
      '', // L7: Elem 6th
      '', // L8: Middle 7th
      '', // L9: Middle 8th
      '', // L10: Middle 9th
      '', // L11: High 10th
      '', // L12: High 11th
      '', // L13: High 12th
      '', // L14: High Senior
      '', // L15: College 1st
      '', // L16: College 2nd
      '', // L17: College 3rd
      '', // L18: College 4th
      '', // L19: Master 1st
      '', // L20: Master 2nd
      '', // L21: PhD Candidate
      '', // L22: PhD Researcher
      '', // L23: PhD Finalist
      '', // L24: Postdoc
      '', // L25: Asst Prof
      '', // L26: Assoc Prof
      '', // L27: Professor
      '', // L28: Dean
  ];

  const getFoxAvatar = (level: number) => {
      // Clamp level between 1 and 28
      const safeLevel = Math.max(1, Math.min(level, 28));
      const assetIndex = safeLevel - 1;
      
      const imageUrl = FOX_ASSETS[assetIndex];

      if (imageUrl) {
          return { type: 'img', val: imageUrl };
      }

      // FALLBACK: If no image provided yet, stick with Emoji but vary scale slightly
      // Just to show *something* changes
      return { type: 'emoji', val: '🦊', scale: 1.0 + (assetIndex * 0.02) }; 
  };

  // --- COMPONENT: THE PURPLE PET CARD (Fox Left, Streak Right) ---
  const PetCard = () => {
    const streakDay = user?.pet.streakCount || 0;
    // Calculate streak bonus EXP (mock logic matching App.tsx)
    const tier = streakDay >= 6 ? 4 : streakDay >= 4 ? 3 : streakDay >= 2 ? 2 : 1;
    const streakExp = tier === 4 ? 15 : tier === 3 ? 12 : tier === 2 ? 10 : 5;

    // Level Progress Calculation
    const currentExp = user?.pet.currentExp || 0;
    const maxExp = user?.pet.maxExp || 100;
    const expPercent = Math.min(100, Math.max(0, (currentExp / maxExp) * 100));
    
    // Get Avatar Data
    const avatar = getFoxAvatar(user?.pet.level || 1);

    return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl text-white overflow-hidden shadow-xl shadow-indigo-100 mb-4 relative z-0 group">
        
        {/* Shimmer Effect */}
        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none z-10" />

        <div className="p-5 relative z-10 cursor-pointer" onClick={() => setIsPetExpanded(!isPetExpanded)}>
            
            {/* 1. TOP HEADER: Name + Level + BIG PROGRESS BAR */}
            <div className="flex justify-between items-start mb-6 w-full">
                <div className="mt-1">
                    <h3 className="text-indigo-100 font-bold text-[10px] uppercase tracking-widest opacity-80">{t.companion}</h3>
                    <h2 className="text-3xl font-black tracking-tight">{t.petName}</h2>
                </div>
                
                <div className="flex-1 ml-6">
                     <div className="flex justify-end items-center gap-2 mb-1">
                        <Trophy size={18} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xl font-black text-white tracking-wide shadow-black drop-shadow-md text-right leading-none">
                            {getRankTitle(user?.pet.level || 1)}
                        </span>
                     </div>
                     
                     {/* EXP Text */}
                     <div className="flex justify-end text-[10px] font-bold text-indigo-200 mb-1 tracking-wide">
                        <span>{Math.round(currentExp)} / {maxExp} EXP</span>
                     </div>

                     {/* BIGGER PROGRESS BAR */}
                     <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden backdrop-blur-sm border border-white/10 shadow-inner relative">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${expPercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-500 h-full rounded-full shadow-[0_0_10px_rgba(250,204,21,0.6)] relative" 
                        >
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-30"></div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* 2. MAIN BODY: FOX (Left) - STREAK (Right) */}
            <div className="flex items-center justify-between mb-4">
                
                {/* LEFT: FOX AVATAR (Dynamic) */}
                <div className="relative z-10 w-1/3 flex justify-center h-32 items-center">
                     {/* Glow behind fox */}
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/20 rounded-full blur-3xl pointer-events-none z-0" />
                     
                     <motion.div 
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="relative z-10 filter drop-shadow-2xl"
                     >
                        {avatar.type === 'emoji' ? (
                            <div className="text-8xl transform origin-center" style={{ transform: `scale(${avatar.scale})` }}>
                                {avatar.val}
                            </div>
                        ) : (
                            <img 
                                src={avatar.val} 
                                alt="Fox Avatar" 
                                className="w-32 h-32 object-contain"
                            />
                        )}
                     </motion.div>
                </div>

                {/* RIGHT: STREAK INFO */}
                <div className="flex-1 pl-4 flex flex-col justify-center">
                    
                    {/* BIG STREAK TEXT (Moved Up) */}
                    <div className="text-right mb-3">
                        <div className="flex items-center justify-end gap-1.5 mb-0.5">
                            <Flame size={16} className="text-orange-300 fill-orange-300 animate-pulse" />
                            <span className="text-xs font-bold text-orange-200 uppercase tracking-wide">{t.streakTitle}</span>
                        </div>
                        
                        {/* Custom Formatting: Day X Streak, EXP+Y */}
                        <div className="text-right">
                            <div className="text-3xl font-black text-white leading-none mb-1">
                                {t.streakDetail.split(',')[0].replace('{n}', streakDay.toString())}
                            </div>
                            <div className="inline-block bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-xs font-bold text-yellow-300 border border-white/10">
                                {t.streakDetail.split(',')[1].replace('{e}', streakExp.toString())}
                            </div>
                        </div>
                    </div>

                    {/* 7-Segment Bar */}
                    <div className="flex gap-1.5 bg-black/20 p-2 rounded-xl backdrop-blur-sm">
                        {[...Array(7)].map((_, i) => {
                            const fillCount = streakDay % 7 === 0 && streakDay > 0 ? 7 : streakDay % 7;
                            const isActive = i < fillCount;
                            
                            return (
                                <div key={i} className={`h-2.5 flex-1 rounded-full transition-all duration-500 ${isActive ? 'bg-gradient-to-b from-orange-300 to-orange-500 shadow-[0_0_6px_rgba(251,146,60,0.8)]' : 'bg-white/10'}`} />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 3. FOOTER: DAILY QUOTE */}
            <div className="relative pt-3 border-t border-white/10 mt-2">
                <Quote size={14} className="absolute top-3 left-0 text-indigo-300 opacity-50" fill="currentColor" />
                <div className="pl-6 pr-2">
                    <p className="text-sm font-medium text-white italic leading-relaxed opacity-90 tracking-wide">"{dailyQuote.text}"</p>
                    <p className="text-[10px] font-bold text-indigo-200 mt-1 uppercase tracking-wider text-right opacity-70">— {dailyQuote.author}</p>
                </div>
            </div>
        </div>
    </div>
    );
  };

  // --- NEW COMPONENT: VIBE STATUS GRID (4 CELLS, EMOJIS, BIG TEXT) ---
  const VibeStatusCard = () => {
      // 4 States: Distracted, Low, Focused, Flow
      // Icons: Emojis as requested
      const tiers = [
          { level: 1, label: t.mood_distracted, mul: 'x0.8', color: 'bg-red-50',     activeColor: 'bg-red-500',    emoji: '😴', border: 'border-red-200' },
          { level: 2, label: t.mood_low,        mul: 'x1.0', color: 'bg-orange-50',  activeColor: 'bg-orange-500', emoji: '😐', border: 'border-orange-200' },
          { level: 3, label: t.mood_focused,    mul: 'x1.3', color: 'bg-blue-50',    activeColor: 'bg-blue-500',   emoji: '🙂', border: 'border-blue-200' },
          { level: 4, label: t.mood_flow,       mul: 'x1.5', color: 'bg-purple-50',  activeColor: 'bg-purple-500', emoji: '🔥', border: 'border-purple-200' },
      ];

      return (
        <IOSCard className="!mb-4 p-5 border border-gray-100 shadow-sm relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 rounded-lg">
                        <TrendingUp size={16} className="text-indigo-600" />
                    </div>
                    <h3 className="font-black text-gray-800 uppercase tracking-tight">{t.todaysVibe}</h3>
                </div>
                {stats.hasData ? (
                    <div className="text-right">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">{t.avgScore}</span>
                        <span className="text-xl font-black text-gray-900 tabular-nums">{stats.avgScore}</span>
                    </div>
                ) : (
                    <span className="text-xs font-bold text-gray-400 uppercase bg-gray-100 px-2 py-1 rounded">No Data</span>
                )}
            </div>

            {/* BIG STATUS TEXT */}
            <div className="text-center mb-6">
                 {stats.hasData ? (
                     <div className="animate-in zoom-in duration-300">
                         <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight leading-none mb-1">
                             {stats.mood}
                         </h2>
                         <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">CURRENT STATUS</div>
                     </div>
                 ) : (
                     <div className="py-2 text-gray-300 text-xl font-bold italic">{t.mood_sleeping}</div>
                 )}
            </div>

            {/* 4-Cell Grid (Emojis) */}
            <div className="grid grid-cols-4 gap-2">
                {!stats.hasData ? (
                    // Empty State
                    <div className="col-span-4 bg-gray-50 rounded-xl p-4 flex items-center justify-center gap-2 border border-dashed border-gray-200 text-gray-400">
                        <Moon size={16} />
                        <span className="text-xs font-bold">{t.mood_sleeping}</span>
                    </div>
                ) : (
                    // Active Grid
                    tiers.map((tier) => {
                        const isActive = stats.tier === tier.level;
                        
                        return (
                            <div 
                                key={tier.level}
                                className={`rounded-xl py-2 flex flex-col items-center justify-center transition-all duration-300 relative
                                    ${isActive 
                                        ? `${tier.activeColor} text-white shadow-lg scale-105 z-10 ring-2 ring-offset-1 ring-transparent` 
                                        : `${tier.color} text-gray-400 opacity-50 grayscale border ${tier.border}`
                                    }
                                `}
                            >
                                <span className="text-xl mb-1 filter drop-shadow-sm">{tier.emoji}</span>
                                <span className="text-[10px] font-black uppercase tracking-tighter">{tier.mul}</span>
                            </div>
                        );
                    })
                )}
            </div>
            
        </IOSCard>
      );
  };

  const GrowthChecklist = () => (
    <IOSCard className="!mb-4 p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-2">
            <CheckCircle2 size={18} className="text-blue-500" />
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
                        <div className="flex items-center gap-1">
                            <p className="text-[10px] text-gray-400 font-bold opacity-60">+10 EXP / Task</p>
                            {stats.multiplier > 1 && <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1 rounded font-bold">x{stats.multiplier}</span>}
                        </div>
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
                        <div className="flex items-center gap-1">
                            <p className="text-[10px] text-gray-400 font-bold opacity-60">{t.growthExpRule}</p>
                            {stats.multiplier > 1 && <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1 rounded font-bold">x{stats.multiplier}</span>}
                        </div>
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
      
      {/* Inserted New Card Here */}
      <VibeStatusCard />
      
      <GrowthChecklist />

      {/* Week Activity Chart Container */}
      <IOSCard className="!mb-4 p-5 min-h-[350px]">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-gray-800 text-lg uppercase tracking-tight">{t.weeklyActivity}</h3>
            <div className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{t.last7Days}</div>
        </div>
        
        {/* FIX: Explicit Pixel Height to prevent Recharts 'width(-1)' warning */}
        <div className="w-full relative" style={{ height: '250px' }}>
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
              <button onClick={() => onSimulate?.(25)} className="py-2 bg-gray-100 rounded-xl text-[10px] font-black text-gray-500">25m (100%)</button>
              <button onClick={() => onSimulate?.(60, 0)} className="py-2 bg-blue-50 rounded-xl text-[10px] font-black text-blue-600">1h (100%)</button>
              <button onClick={() => onSimulate?.(120, 1)} className="py-2 bg-indigo-50 rounded-xl text-[10px] font-black text-indigo-600">2h +1d</button>
              <button onClick={onBreakStreak} className="py-2 bg-red-50 rounded-xl text-[10px] font-black text-red-600">Break</button>
          </div>
      </div>
    </div>
  );
};

export default StatsView;
