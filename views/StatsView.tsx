import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, Cell, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { IOSCard } from '../components/IOSComponents';
import { Award, Zap, Clock, CheckCircle2, ChevronDown, ChevronUp, TrendingUp, Star, Trophy, Smile, Activity, Sparkles, Flame, Quote, Battery, Moon, Loader2, Image as ImageIcon } from 'lucide-react';
import { Task, FocusRecord, Settings, User } from '../types';
import { translations } from '../utils/translations';
import { getDailyQuote } from '../utils/quotes';
import { NativeService } from '../services/native';
import { getLocalDateString } from '../App';

// --- 远程资源配置 (建议将图片上传至 CDN) ---
const CDN_BASE_URL = "https://raw.githubusercontent.com/your-repo/focusflow-assets/main/pet"; // 示例地址

interface StatsViewProps {
    tasks: Task[];
    focusHistory: FocusRecord[];
    settings: Settings;
    onSimulate?: (minutes: number, dateOffset?: number) => void;
    onBreakStreak?: () => void;
}

// 宠物模型渲染组件：处理大图加载逻辑
const PetRenderer: React.FC<{ level: number, mood: string }> = ({ level, mood }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // 根据等级和状态计算图片地址
    // 假设命名规则为: fox_lv1.webp, fox_lv2.webp ...
    const imageUrl = `${CDN_BASE_URL}/fox_lv${level}.webp`;

    useEffect(() => {
        setIsLoading(true);
        setHasError(false);
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => setIsLoading(false);
        img.onerror = () => {
            setIsLoading(false);
            setHasError(true);
        };
    }, [imageUrl]);

    return (
        <div className="relative w-full h-32 flex justify-center items-center">
            {/* 加载中占位符 */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center text-white/40"
                    >
                        <Loader2 className="animate-spin mb-2" size={24} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Loading Fox...</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 加载失败回退 */}
            {hasError && (
                <div className="flex flex-col items-center text-indigo-200">
                    <ImageIcon size={32} className="opacity-50 mb-1" />
                    <span className="text-8xl select-none">🦊</span>
                </div>
            )}

            {/* 高清图片主体 */}
            {!hasError && (
                <motion.img
                    key={imageUrl}
                    src={imageUrl}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ 
                        opacity: isLoading ? 0 : 1, 
                        scale: isLoading ? 0.8 : 1,
                        y: mood === '心流' ? [0, -10, 0] : [0, -4, 0] 
                    }}
                    transition={{ 
                        opacity: { duration: 0.5 },
                        y: { duration: 3, repeat: Infinity, ease: "easeInOut" } 
                    }}
                    className="w-full h-full object-contain filter drop-shadow-2xl z-10"
                    alt={`Fox Level ${level}`}
                />
            )}

            {/* 底部光环 */}
            <div className="absolute bottom-0 w-24 h-4 bg-black/20 rounded-[100%] blur-md z-0" />
        </div>
    );
};

const StatsView: React.FC<StatsViewProps> = ({ tasks, focusHistory, settings, onSimulate, onBreakStreak }) => {
  const t = translations[settings.language].stats;
  const [isPetExpanded, setIsPetExpanded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    NativeService.Storage.get<User>('focusflow_user').then(u => setUser(u));
    setIsMounted(true);
  }, [focusHistory]); 

  const dailyQuote = useMemo(() => getDailyQuote(settings.language), [settings.language]);

  const stats = useMemo(() => {
    const todayStr = getLocalDateString();
    const todaysRecords = focusHistory.filter(r => r.date === todayStr);
    const totalMinutes = todaysRecords.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    const hours = (totalMinutes / 60).toFixed(1);
    const todaysTasks = tasks.filter(t => t.date === todayStr);
    const completedToday = todaysTasks.filter(t => t.completed);
    
    let totalScore = 0;
    let count = 0;
    todaysRecords.forEach(r => {
        totalScore += r.score !== undefined ? r.score : 100;
        count++;
    });

    const avgScore = count > 0 ? Math.ceil(totalScore / count) : 0;
    let tier = 0;
    let moodLabel = t.mood_sleeping;

    if (count > 0) {
        if (avgScore > 90) { tier = 4; moodLabel = t.mood_flow; }
        else if (avgScore > 75) { tier = 3; moodLabel = t.mood_focused; }
        else if (avgScore > 60) { tier = 2; moodLabel = t.mood_low; }
        else { tier = 1; moodLabel = t.mood_distracted; }
    }

    return { focusHours: hours, completedCount: completedToday.length, studyExp: Math.floor(totalMinutes * 0.4), isLogged: user?.pet.lastDailyActivityDate === todayStr, avgScore, mood: moodLabel, tier, hasData: count > 0 };
  }, [tasks, focusHistory, user, t]);

  const chartData = useMemo(() => {
      const result = [];
      const locale = settings.language === 'zh' || settings.language === 'zh-TW' ? 'zh-CN' : settings.language;
      for (let i = 6; i >= 0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i);
          const dateStr = getLocalDateString(d);
          const dayName = d.toLocaleDateString(locale, { weekday: 'short' });
          const minutes = focusHistory.filter(r => r.date === dateStr).reduce((acc, curr) => acc + curr.durationMinutes, 0);
          result.push({ name: dayName, minutes: Math.round(minutes) });
      }
      return result;
  }, [focusHistory, settings.language]);

  const getRankTitle = (level: number) => {
      const ranks = t.academicRanks || [];
      return ranks[Math.max(0, Math.min(level - 1, ranks.length - 1))];
  };

  const PetCard = () => {
    const streakDay = user?.pet.streakCount || 0;
    const tier = streakDay >= 6 ? 4 : streakDay >= 4 ? 3 : streakDay >= 2 ? 2 : 1;
    const streakExp = tier === 4 ? 15 : tier === 3 ? 12 : tier === 2 ? 10 : 5;
    const expPercent = Math.min(100, Math.max(0, ((user?.pet.currentExp || 0) / (user?.pet.maxExp || 100)) * 100));

    // Fallback if translation key is missing to prevent crash
    const streakText = t.streakDetail || "Day {n}, +{e}";

    return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl text-white overflow-hidden shadow-xl shadow-indigo-100 dark:shadow-none mb-4 relative z-0 group">
        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none z-10" />
        <div className="p-5 relative z-10 cursor-pointer" onClick={() => setIsPetExpanded(!isPetExpanded)}>
            <div className="flex justify-between items-start mb-6 w-full">
                <div className="mt-1">
                    <h3 className="text-indigo-100 font-bold text-[10px] uppercase tracking-widest opacity-80">{t.companion}</h3>
                    <h2 className="text-3xl font-black tracking-tight">{t.petName}</h2>
                </div>
                <div className="flex-1 ml-6">
                     <div className="flex justify-end items-center gap-2 mb-1">
                        <Trophy size={18} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xl font-black text-white tracking-wide drop-shadow-md text-right leading-none">
                            {getRankTitle(user?.pet.level || 1)}
                        </span>
                     </div>
                     <div className="flex justify-end text-[10px] font-bold text-indigo-200 mb-1 tracking-wide">
                        <span>{Math.round(user?.pet.currentExp || 0)} / {user?.pet.maxExp || 300} EXP</span>
                     </div>
                     <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden backdrop-blur-sm border border-white/10 shadow-inner relative">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${expPercent}%` }} className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-500 h-full rounded-full shadow-[0_0_10px_rgba(250,204,21,0.6)]" />
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <div className="relative z-10 w-1/3 flex justify-center">
                    <PetRenderer level={user?.pet.level || 1} mood={stats.mood} />
                </div>
                <div className="flex-1 pl-4 flex flex-col justify-center">
                    <div className="text-right mb-3">
                        <div className="flex items-center justify-end gap-1.5 mb-0.5">
                            <Flame size={16} className="text-orange-300 fill-orange-300 animate-pulse" />
                            <span className="text-xs font-bold text-orange-200 uppercase tracking-wide">{t.streakTitle}</span>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-black text-white leading-none mb-1">
                                {streakText.split(',')[0].replace('{n}', streakDay.toString())}
                            </div>
                            <div className="inline-block bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-xs font-bold text-yellow-300 border border-white/10">
                                {streakText.split(',')[1] ? streakText.split(',')[1].replace('{e}', streakExp.toString()) : `+${streakExp} EXP`}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-1.5 bg-black/20 p-2 rounded-xl backdrop-blur-sm">
                        {[...Array(7)].map((_, i) => {
                            const fillCount = streakDay % 7 === 0 && streakDay > 0 ? 7 : streakDay % 7;
                            return (
                                <div key={i} className={`h-2.5 flex-1 rounded-full ${i < fillCount ? 'bg-gradient-to-b from-orange-300 to-orange-500 shadow-[0_0_6px_rgba(251,146,60,0.8)]' : 'bg-white/10'}`} />
                            );
                        })}
                    </div>
                </div>
            </div>
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

  const VibeStatusCard = () => {
      const tiers = [
          { level: 1, label: t.mood_distracted, mul: 'x0.8', color: 'bg-red-50 dark:bg-red-900/30',     activeColor: 'bg-red-500',    emoji: '😴', border: 'border-red-200 dark:border-red-800' },
          { level: 2, label: t.mood_low,        mul: 'x1.0', color: 'bg-orange-50 dark:bg-orange-900/30',  activeColor: 'bg-orange-500', emoji: '😐', border: 'border-orange-200 dark:border-orange-800' },
          { level: 3, label: t.mood_focused,    mul: 'x1.3', color: 'bg-blue-50 dark:bg-blue-900/30',    activeColor: 'bg-blue-500',   emoji: '🙂', border: 'border-blue-200 dark:border-blue-800' },
          { level: 4, label: t.mood_flow,       mul: 'x1.5', color: 'bg-purple-50 dark:bg-purple-900/30',  activeColor: 'bg-purple-500', emoji: '🔥', border: 'border-purple-200 dark:border-purple-800' },
      ];

      return (
        <IOSCard className="!mb-4 p-5 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/50 rounded-lg"><TrendingUp size={16} className="text-indigo-600 dark:text-indigo-400" /></div>
                    <h3 className="font-black text-gray-800 dark:text-white uppercase tracking-tight">{t.todaysVibe}</h3>
                </div>
                {stats.hasData ? (
                    <div className="text-right">
                        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mr-2">{t.avgScore}</span>
                        <span className="text-xl font-black text-gray-900 dark:text-white tabular-nums">{stats.avgScore}</span>
                    </div>
                ) : ( <span className="text-xs font-bold text-gray-400 uppercase bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">No Data</span> )}
            </div>
            <div className="text-center mb-6">
                 {stats.hasData ? (
                     <div className="animate-in zoom-in duration-300">
                         <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight leading-none mb-1">{stats.mood}</h2>
                         <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">CURRENT STATUS</div>
                     </div>
                 ) : ( <div className="py-2 text-gray-300 dark:text-gray-600 text-xl font-bold italic">{t.mood_sleeping}</div> )}
            </div>
            <div className="grid grid-cols-4 gap-2">
                {!stats.hasData ? ( <div className="col-span-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 flex items-center justify-center gap-2 border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500"><Moon size={16} /><span className="text-xs font-bold">{t.mood_sleeping}</span></div> ) : (
                    tiers.map((tier) => (
                        <div key={tier.level} className={`rounded-xl py-2 flex flex-col items-center justify-center transition-all duration-300 relative ${stats.tier === tier.level ? `${tier.activeColor} text-white shadow-lg scale-105 z-10` : `${tier.color} text-gray-400 opacity-50 grayscale border ${tier.border}`}`}>
                            <span className="text-xl mb-1 filter drop-shadow-sm">{tier.emoji}</span>
                            <span className="text-[10px] font-black uppercase tracking-tighter">{tier.mul}</span>
                        </div>
                    ))
                )}
            </div>
        </IOSCard>
      );
  };

  return (
    <div className="h-full w-full bg-[#f2f2f7] dark:bg-black overflow-y-auto no-scrollbar pt-safe-top pb-32 px-4 transition-colors duration-300">
      <div className="flex items-center justify-between mb-4 mt-2 px-1">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{t.title}</h1>
        <button className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm text-gray-400 dark:text-gray-500"><TrendingUp size={20} /></button>
      </div>
      <PetCard />
      <VibeStatusCard />
      <IOSCard className="!mb-4 p-5 min-h-[350px]">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-gray-800 dark:text-white text-lg uppercase tracking-tight">{t.weeklyActivity}</h3>
            <div className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{t.last7Days}</div>
        </div>
        <div className="w-full relative" style={{ height: '250px' }}>
            {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" className="dark:stroke-gray-800" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#9CA3AF', fontWeight: 900}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#9CA3AF', fontWeight: 900}} tickCount={5} />
                        <Tooltip 
                            cursor={{fill: 'rgba(200,200,200,0.1)', radius: 8}} 
                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', padding: '12px', backgroundColor: 'var(--tooltip-bg, #fff)'}} 
                            labelStyle={{fontWeight: 900, marginBottom: '4px', color: 'var(--tooltip-text, #333)'}} 
                        />
                        <Bar dataKey="minutes" radius={[6, 6, 6, 6]} barSize={28}>
                            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.minutes > 60 ? '#3B82F6' : (settings.theme === 'dark' ? '#334155' : '#E2E8F0')} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
      </IOSCard>
    </div>
  );
};

export default StatsView;