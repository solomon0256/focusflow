import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, Tooltip, Cell, YAxis, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { IOSCard } from '../components/IOSComponents';
import { Award, Zap, Clock, CheckCircle2, ChevronDown, ChevronUp, Brain, Frown, Coffee, TrendingUp } from 'lucide-react';
import { Task, FocusRecord, Settings } from '../types';
import { translations } from '../utils/translations';

interface StatsViewProps {
    tasks: Task[];
    focusHistory: FocusRecord[];
    settings: Settings; // Added settings prop
}

const StatsView: React.FC<StatsViewProps> = ({ tasks, focusHistory, settings }) => {
  const t = translations[settings.language].stats;
  const [isPetExpanded, setIsPetExpanded] = useState(false);
  
  // Ref to measure the container
  const chartContainerRef = useRef<HTMLDivElement>(null);
  // Store exact pixel dimensions
  const [chartDims, setChartDims] = useState({ width: 0, height: 0 });

  // Use ResizeObserver to manually measure container. 
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
    const observer = new ResizeObserver(() => {
        window.requestAnimationFrame(updateDimensions);
    });
    if (chartContainerRef.current) {
        observer.observe(chartContainerRef.current);
    }
    return () => {
        observer.disconnect();
        clearTimeout(initialTimer);
    };
  }, []);

  // --- Real Data Calculation (Now using focusHistory) ---
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // 1. Calculate actual Focus Hours from history
    const todaysRecords = focusHistory.filter(r => r.date === todayStr);
    const totalMinutes = todaysRecords.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    const hours = (totalMinutes / 60).toFixed(1);

    // 2. Completed count comes from tasks
    const todaysTasks = tasks.filter(t => t.date === todayStr);
    const completedToday = todaysTasks.filter(t => t.completed);

    return {
        focusHours: hours,
        completedCount: completedToday.length,
        totalTasksToday: todaysTasks.length
    };
  }, [tasks, focusHistory]);

  // --- Chart Data Generation ---
  const data = useMemo(() => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const result = [];
      
      // Generate last 7 days
      for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const dayName = days[d.getDay()];
          
          // Sum up minutes for this day from history
          const minutes = focusHistory
            .filter(r => r.date === dateStr)
            .reduce((acc, curr) => acc + curr.durationMinutes, 0);

          result.push({
              name: dayName,
              minutes: Math.round(minutes)
          });
      }
      return result;
  }, [focusHistory]);

  const PetCard = () => (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white overflow-hidden shadow-lg shadow-indigo-200 mb-4 relative z-0">
        <div 
            className="p-5 sm:p-6 relative z-10 cursor-pointer"
            onClick={() => setIsPetExpanded(!isPetExpanded)}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-indigo-100 font-semibold mb-1 text-sm">Your Companion</h3>
                    <h2 className="text-2xl font-bold">Focus Fox</h2>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    {isPetExpanded ? <ChevronUp className="text-white" size={20} /> : <ChevronDown className="text-white" size={20} />}
                </div>
            </div>
            
            <div className="flex items-center gap-5">
                <div className="text-6xl animate-bounce filter drop-shadow-lg">🦊</div>
                <div className="flex-1">
                    <div className="flex justify-between items-end mb-1.5">
                        <div className="text-xs text-indigo-100 font-bold tracking-wider">HAPPINESS</div>
                        <div className="text-xs text-indigo-100 font-mono opacity-80">Lv. 3</div>
                    </div>
                    <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                        <div className="bg-yellow-400 w-[80%] h-full rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                    </div>
                    <p className="text-xs text-indigo-100 mt-2 opacity-90">
                        {isPetExpanded ? "Tap to collapse" : "Focus more to feed!"}
                    </p>
                </div>
            </div>

            {/* Expandable Stats Section */}
            <AnimatePresence>
                {isPetExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 gap-3">
                             <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center justify-center text-center">
                                <Brain size={20} className="text-pink-300 mb-1" />
                                <span className="text-lg font-bold">65%</span>
                                <span className="text-[10px] text-indigo-100">Deep Focus</span>
                             </div>
                             <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center justify-center text-center">
                                <Coffee size={20} className="text-yellow-300 mb-1" />
                                <span className="text-lg font-bold">20%</span>
                                <span className="text-[10px] text-indigo-100">Focused</span>
                             </div>
                             <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center justify-center text-center">
                                <Zap size={20} className="text-blue-300 mb-1" />
                                <span className="text-lg font-bold">10%</span>
                                <span className="text-[10px] text-indigo-100">Zoning Out</span>
                             </div>
                             <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center justify-center text-center">
                                <Frown size={20} className="text-red-300 mb-1" />
                                <span className="text-lg font-bold">5%</span>
                                <span className="text-[10px] text-indigo-100">Distracted</span>
                             </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        
        {/* Background Decorations */}
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-purple-400/30 rounded-full blur-2xl pointer-events-none" />
    </div>
  );

  return (
    // Main Container: standard block layout with scrolling enabled
    <div className="h-full w-full bg-[#f2f2f7] overflow-y-auto no-scrollbar pt-safe-top pb-32 px-4">
      
      <div className="flex items-center justify-between mb-4 mt-2 px-1">
        <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
        <button className="bg-white p-2 rounded-full shadow-sm text-gray-400">
             <TrendingUp size={20} />
        </button>
      </div>

      <PetCard />

      <div className="grid grid-cols-2 gap-4 mb-4">
        <IOSCard className="!mb-0 p-4 flex flex-col items-center justify-center min-h-[120px]">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                <Clock className="text-blue-500" size={20} />
            </div>
            <span className="text-3xl font-bold text-gray-900 leading-none mb-1">{stats.focusHours}<span className="text-lg text-gray-400 font-medium ml-0.5">{t.focusHours}</span></span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.today}</span>
        </IOSCard>
        <IOSCard className="!mb-0 p-4 flex flex-col items-center justify-center min-h-[120px]">
             <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
                <CheckCircle2 className="text-green-500" size={20} />
             </div>
             <div className="flex items-baseline gap-1 mb-1">
                 <span className="text-3xl font-bold text-gray-900 leading-none">{stats.completedCount}</span>
                 <span className="text-sm text-gray-400 font-medium">/ {stats.totalTasksToday}</span>
             </div>
             <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.tasksDone}</span>
        </IOSCard>
      </div>

      {/* Chart Section */}
      <IOSCard className="!mb-4 p-5">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 text-lg">{t.weeklyActivity}</h3>
            <div className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{t.last7Days}</div>
        </div>
        
        {/* Chart Container with Ref for measurement */}
        <div ref={chartContainerRef} className="w-full h-64 relative">
            {chartDims.width > 0 ? (
                // Manually passing dimensions removes Recharts need to calculate them, fixing the warning.
                <BarChart 
                    width={chartDims.width} 
                    height={chartDims.height} 
                    data={data} 
                    margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 11, fill: '#9CA3AF', fontWeight: 500}} 
                        dy={10}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 11, fill: '#9CA3AF'}} 
                        tickCount={5}
                    />
                    <Tooltip 
                        cursor={{fill: '#f9fafb', radius: 4}}
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                    />
                    <Bar dataKey="minutes" radius={[6, 6, 6, 6]} barSize={32}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.minutes > 60 ? '#3B82F6' : '#E2E8F0'} />
                        ))}
                    </Bar>
                </BarChart>
            ) : (
                // Loading / Placeholder State (Shown while waiting for dimensions)
                <div className="w-full h-full flex items-end justify-between px-2 pb-2">
                     {[...Array(7)].map((_, i) => (
                         <div key={i} className="w-8 bg-gray-100 rounded-lg animate-pulse" style={{ height: `${Math.random() * 60 + 20}%`}} />
                     ))}
                </div>
            )}
        </div>
      </IOSCard>

      <IOSCard className="!mb-4 p-4 flex items-center gap-4">
        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 shrink-0">
            <Award size={24} />
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900">{t.focusMaster}</h4>
            <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">72 / 100 hours</span>
                <span className="text-xs font-bold text-yellow-600">72%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full w-[72%]" />
            </div>
        </div>
      </IOSCard>
      
      {/* Bottom spacer to handle safe area if needed */}
      <div className="h-4 w-full" />
    </div>
  );
};

export default StatsView;