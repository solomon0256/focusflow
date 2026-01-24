import React, { useState } from 'react';
import { ChevronRight, User as UserIcon, Shield, LogOut, CreditCard, Crown, X, Apple, Check, Cloud, RotateCcw, Languages, Beaker, Terminal, Loader2, Battery, Zap, Palette, Moon, HelpCircle, FileText } from 'lucide-react';
import { IOSCard, IOSToggle, IOSButton, IOSSegmentedControl } from '../components/IOSComponents';
import { Settings, User, Product, LanguageCode, Task, FocusRecord, TimerMode, Priority } from '../types';
import { SAAS_CONFIG } from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { translations, LANGUAGE_NAMES } from '../utils/translations';

// Helper to format minutes
const formatMinutes = (m: number) => {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
};

// --- Reusable Row Components ---
interface SettingRowProps {
    icon: React.ElementType;
    label: string;
    value?: string | boolean;
    type?: 'link' | 'toggle' | 'danger';
    color?: string;
    onChange?: (val: boolean) => void;
    onClick?: () => void;
}

const SettingRow = React.memo<SettingRowProps>(({ icon: Icon, label, value, type = 'link', color = 'bg-blue-500', onChange, onClick }) => (
    <div 
        className="flex items-center justify-between py-3 cursor-pointer active:bg-gray-50 dark:active:bg-white/10 transition-colors"
        onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${color}`}>
            <Icon size={18} />
        </div>
        <span className={`font-medium ${type === 'danger' ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {type === 'toggle' ? (
             <IOSToggle checked={value as boolean} onChange={onChange || (() => {})} />
        ) : (
            <>
                <span className="text-gray-400 dark:text-gray-500 text-sm">{value as string}</span>
                {type !== 'danger' && <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />}
            </>
        )}
      </div>
    </div>
));

interface SliderRowProps {
    label: string;
    value: number;
    onChange: (val: number) => void;
    min?: number;
    max?: number;
    unit?: string;
}

const SliderRow = React.memo<SliderRowProps>(({ label, value, onChange, min = 0, max = 100, unit = 'm' }) => (
      <div className="py-3">
          <div className="flex justify-between items-center mb-2">
             <span className="font-medium text-gray-900 dark:text-white">{label}</span>
             <span className="text-blue-600 dark:text-blue-400 font-bold w-12 text-right">
                {unit === 'm' ? formatMinutes(value) : `${value}${unit}`}
             </span>
          </div>
          <input 
            type="range" 
            min={min} 
            max={max} 
            value={value} 
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
      </div>
));

// --- Main Settings View ---

interface SettingsViewProps {
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
    user: User | null;
    onLogin: (provider: 'apple' | 'google') => void;
    onLogout: () => void;
    onUpgrade: () => void;
    onInjectData?: (tasks: Task[], history: FocusRecord[], user: User) => void; 
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, setSettings, user, onLogin, onLogout, onUpgrade, onInjectData }) => {
  const t = translations[settings.language].settings;
  const tPremium = translations[settings.language].premium;
  const tFooter = translations[settings.language].footer;
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);

  const [simStatus, setSimStatus] = useState<'idle' | 'running' | 'success'>('idle');
  const [simResult, setSimResult] = useState<string>('');
  const defaultPlanId = SAAS_CONFIG.plans.find(p => p.tag === 'BEST VALUE')?.id || SAAS_CONFIG.plans[0].id;
  const [selectedPlanId, setSelectedPlanId] = useState<string>(defaultPlanId);
  const selectedPlan = SAAS_CONFIG.plans.find(p => p.id === selectedPlanId);

  const getPlanDetails = (planId: string) => {
      if (planId.includes('monthly')) return { name: tPremium.monthly_name, desc: tPremium.monthly_desc, tag: null };
      if (planId.includes('yearly')) return { name: tPremium.yearly_name, desc: tPremium.yearly_desc, tag: tPremium.yearly_tag };
      if (planId.includes('lifetime')) return { name: tPremium.lifetime_name, desc: tPremium.lifetime_desc, tag: tPremium.lifetime_tag };
      return { name: 'Unknown', desc: '', tag: null };
  };

  const handlePerformLogin = (provider: 'apple' | 'google') => {
      onLogin(provider);
      setShowLoginModal(false);
  };

  const handlePerformUpgrade = () => {
      onUpgrade();
      setShowPremiumModal(false);
  };
  
  const handleRestorePurchases = () => {
      alert("Restoring purchases from Apple App Store...");
      setTimeout(() => {
           onUpgrade(); 
           alert("Premium restored!");
      }, 1000);
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
      setSettings(prev => ({
          ...prev, 
          workTime: v, 
          // Filter notifications to ensure they are within the new work time limit
          notifications: prev.notifications.filter(n => n < v)
      }));
  };

  const runStressTest = async () => {
      if (!onInjectData) return;
      setSimStatus('running');
      setSimResult('');
      await new Promise(resolve => setTimeout(resolve, 800));

      const SIMULATION_DAYS = 100;
      const SESSIONS_PER_DAY = 5;
      const SESSION_DURATION = 25;

      let simulatedHistory: FocusRecord[] = [];
      let simulatedTasks: Task[] = [];
      
      for(let i=0; i<50; i++) {
          simulatedTasks.push({
              id: `sim_task_${i}`,
              title: `Simulated Task ${i}`,
              date: new Date().toISOString().split('T')[0],
              durationMinutes: 25,
              priority: Priority.MEDIUM,
              completed: i < 40,
              pomodoroCount: Math.floor(Math.random() * 4) + 1,
              note: 'Generated by FocusFlow Lab'
          });
      }

      const today = new Date();
      for (let i = 0; i < SIMULATION_DAYS; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];

          for (let j = 0; j < SESSIONS_PER_DAY; j++) {
              simulatedHistory.push({
                  id: `sim_hist_${i}_${j}`,
                  date: dateStr,
                  durationMinutes: SESSION_DURATION,
                  mode: TimerMode.POMODORO
              });
          }
      }

      const simulatedUser: User = {
          id: 'sim_user_001',
          name: 'Test Subject 001',
          email: 'test@focusflow.ai',
          isPremium: true,
          pet: {
              level: 4, 
              currentExp: 50,
              maxExp: 500,
              happiness: 100,
              streakCount: 5,
              lastDailyActivityDate: new Date().toISOString().split('T')[0]
          }
      };

      onInjectData(simulatedTasks, simulatedHistory, simulatedUser);
      setSimResult(`✅ SUCCESS\n\n• ${simulatedHistory.length} Records Created\n• ${simulatedTasks.length} Tasks Created\n• 100 Days of History\n\nGo to Stats tab to verify.`);
      setSimStatus('success');
  };

  const LoginModal = () => (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowLoginModal(false)}
      >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
              <button onClick={() => setShowLoginModal(false)} className="absolute right-4 top-4 text-gray-400 p-1"><X size={20}/></button>
              
              <div className="flex flex-col items-center mb-6">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300 mb-4">
                      <Cloud size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.cloudSync}</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center mt-2 px-2">
                      {t.proDesc}
                  </p>
              </div>

              <div className="space-y-3">
                  <button onClick={() => handlePerformLogin('apple')} className="w-full py-3.5 bg-black text-white rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                      <Apple size={20} fill="white" /> Sign in with Apple
                  </button>
                  <button onClick={() => handlePerformLogin('google')} className="w-full py-3.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                        <div className="w-5 h-5 bg-contain bg-no-repeat bg-center" style={{backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg')"}}></div>
                        Sign in with Google
                  </button>
              </div>
          </motion.div>
      </motion.div>
  );

  const DevModal = () => (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono"
        onClick={() => setShowDevModal(false)}
      >
          <motion.div 
            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            className="bg-gray-900 border border-green-500/30 w-full max-w-sm rounded-xl p-6 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
              <div className="flex items-center gap-2 mb-4 text-green-400">
                  <Terminal size={24} />
                  <h2 className="text-xl font-bold">FocusFlow Lab</h2>
              </div>
              <p className="text-gray-400 text-xs mb-6">
                  Stress Test Suite for logic validation. High-load scenario simulator.
              </p>

              <div className="space-y-4">
                  {simStatus === 'idle' && (
                    <button onClick={runStressTest} className="w-full py-3 bg-green-900/30 border border-green-500/50 text-green-400 hover:bg-green-500 hover:text-black rounded-lg font-bold transition-all flex items-center justify-center gap-2">
                        <Beaker size={18} />
                        RUN 100-DAY SIMULATION
                    </button>
                  )}

                  {simStatus === 'running' && (
                      <div className="w-full py-4 bg-gray-800 rounded-lg flex items-center justify-center flex-col gap-2">
                          <Loader2 size={24} className="text-green-400 animate-spin" />
                          <span className="text-xs text-green-400">Generating 500 records...</span>
                      </div>
                  )}

                  {simStatus === 'success' && (
                      <div className="w-full p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                          <pre className="text-xs text-green-300 whitespace-pre-wrap font-mono">{simResult}</pre>
                      </div>
                  )}

                  <div className="text-[10px] text-gray-500 text-center">
                      WARNING: This overwrites current data.
                  </div>
              </div>
              <button onClick={() => setShowDevModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={18}/></button>
          </motion.div>
      </motion.div>
  );

  const LanguageModal = () => (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowLanguageModal(false)}
      >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 dark:text-white">{t.language}</h3>
                  <button onClick={() => setShowLanguageModal(false)} className="text-gray-400 p-1"><X size={20}/></button>
              </div>
              <div className="overflow-y-auto p-2">
                  {Object.keys(LANGUAGE_NAMES).map((code) => (
                      <button 
                        key={code}
                        onClick={() => {
                            setSettings(prev => ({...prev, language: code as LanguageCode}));
                            setShowLanguageModal(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-colors
                            ${settings.language === code ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200'}
                        `}
                      >
                          <span className="font-medium">{LANGUAGE_NAMES[code as LanguageCode]}</span>
                          {settings.language === code && <Check size={16} />}
                      </button>
                  ))}
              </div>
          </motion.div>
      </motion.div>
  );

  const PremiumModal = () => {
    const features = [
        tPremium.feat_sync,
        tPremium.feat_history,
        tPremium.feat_skins,
        tPremium.feat_noise,
        tPremium.feat_support
    ];

    return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={() => setShowPremiumModal(false)}
    >
        <motion.div 
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-[#F2F2F7] dark:bg-[#121212] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-0 shadow-2xl relative overflow-hidden h-[92vh] sm:h-[85vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
            <div className="h-40 bg-gradient-to-br from-indigo-500 to-purple-600 relative flex items-center justify-center overflow-hidden shrink-0">
                <div className="absolute top-4 right-4 z-10">
                     <button onClick={() => setShowPremiumModal(false)} className="bg-black/20 text-white p-1 rounded-full"><X size={20}/></button>
                </div>
                <div className="text-center text-white z-10 mt-4">
                    <Crown size={48} className="mx-auto mb-2 animate-bounce" />
                    <h2 className="text-2xl font-bold">{t.proTitle}</h2>
                </div>
                <div className="absolute top-[-20%] left-[-20%] w-64 h-64 bg-white/20 rounded-full blur-3xl"/>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-2">
                <div className="space-y-3 mb-6">
                    {features.map((feat, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center shrink-0">
                                <Check size={12} className="text-indigo-600 dark:text-indigo-400 font-bold" strokeWidth={3} />
                            </div>
                            <span className="text-gray-800 dark:text-gray-200 text-sm font-medium">{feat}</span>
                        </div>
                    ))}
                </div>

                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.choosePlan}</div>

                <div className="space-y-3 mb-6">
                    {SAAS_CONFIG.plans.map((plan) => {
                        const isSelected = selectedPlanId === plan.id;
                        const details = getPlanDetails(plan.id);
                        return (
                            <div 
                                key={plan.id}
                                onClick={() => setSelectedPlanId(plan.id)}
                                className={`relative border-2 p-4 rounded-xl cursor-pointer transition-all duration-200 flex justify-between items-center bg-white dark:bg-gray-800
                                    ${isSelected ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500 bg-indigo-50/10 dark:bg-indigo-900/30' : 'border-transparent shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                                `}
                            >
                                {details.tag && (
                                    <div className="absolute -top-2.5 right-4 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                        {details.tag}
                                    </div>
                                )}
                                
                                <div>
                                     <div className="flex items-center gap-2">
                                         <h3 className={`font-bold ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white'}`}>{details.name}</h3>
                                     </div>
                                     <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{details.desc}</div>
                                </div>

                                <div className="text-right">
                                    <div className="text-xl font-bold text-gray-900 dark:text-white">{plan.price}</div>
                                    <div className="flex justify-end mt-1">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                                            ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 dark:border-gray-600'}
                                        `}>
                                            {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0 pb-safe">
                <IOSButton onClick={handlePerformUpgrade} className="bg-black dark:bg-white dark:text-black border-none shadow-gray-400 mb-3">
                    <div className="flex items-center justify-center gap-2">
                        <Apple size={20} fill="currentColor" /> 
                        <span>
                            {t.subscribe} {selectedPlan?.price}
                        </span>
                    </div>
                </IOSButton>

                <p className="text-[10px] text-gray-400 text-center leading-tight">
                    {t.recurring}
                </p>
                <button onClick={handleRestorePurchases} className="w-full mt-3 py-1 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                    {t.restore}
                </button>
            </div>
        </motion.div>
    </motion.div>
    );
  };

  return (
    <div className="pt-8 pb-32 px-6 h-full overflow-y-auto no-scrollbar relative">
       <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{t.title}</h1>

       {/* Premium Banner */}
       {!user?.isPremium ? (
           <div 
             onClick={() => setShowPremiumModal(true)}
             className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-6 shadow-lg shadow-indigo-200 dark:shadow-none cursor-pointer active:scale-[0.98] transition-transform relative overflow-hidden"
           >
              <div className="flex items-start justify-between relative z-10 pointer-events-none">
                 <div>
                     <h2 className="text-xl font-bold mb-1">{t.proTitle}</h2>
                     <p className="text-sm opacity-90 mb-4">{t.proDesc}</p>
                     <div className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold shadow-md inline-block">
                         {t.viewOffer}
                     </div>
                 </div>
                 <div className="opacity-80">
                     <Crown size={32} />
                 </div>
              </div>
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-y-1/2 translate-x-1/4" />
           </div>
       ) : (
            <div className="bg-gray-900 dark:bg-gray-800 rounded-2xl p-6 text-white mb-6 shadow-lg flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-800 dark:bg-gray-700 rounded-full flex items-center justify-center text-yellow-400">
                    <Crown size={24} fill="currentColor" />
                </div>
                <div>
                    <h2 className="text-lg font-bold">{t.proMember}</h2>
                    <p className="text-sm text-gray-400">{t.thanks}</p>
                </div>
            </div>
       )}

       {/* Account Section */}
       <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-2">{t.cloudSync}</h2>
       <IOSCard className="px-4 py-1">
          {user ? (
            <>
                <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 overflow-hidden">
                             <UserIcon size={24} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{user.name}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
                                <Cloud size={12} /> Data Synced
                            </p>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-700" />
                <SettingRow 
                    icon={LogOut} 
                    label={t.signOut} 
                    type="danger" 
                    color="bg-transparent text-red-500"
                    onClick={onLogout}
                />
            </>
          ) : (
            <SettingRow 
                icon={Cloud} 
                label={t.enableCloud} 
                value="Off" 
                color="bg-gray-400" 
                onClick={() => setShowLoginModal(true)}
            />
          )}
       </IOSCard>

       <div className="flex justify-between items-end mb-2 ml-2 mt-6 pr-2">
           <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t.timerConfig}</h2>
           <button 
               onClick={handleReset}
               className="text-[10px] font-bold text-blue-500 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md active:scale-95 transition-transform"
           >
               <RotateCcw size={10} />
               {t.reset}
           </button>
       </div>
       <IOSCard className="px-4 py-1">
          <SliderRow 
            label={t.focusDuration} 
            value={settings.workTime} 
            onChange={handleWorkTimeChange}
            min={1}
            max={90}
          />
          
          <div className="border-t border-gray-100 dark:border-gray-700" />
          <SliderRow 
            label={t.shortBreak} 
            value={settings.shortBreakTime} 
            onChange={(v) => setSettings(prev => ({...prev, shortBreakTime: v}))}
            min={1}
            max={30}
          />
          <div className="border-t border-gray-100 dark:border-gray-700" />
           <SliderRow 
            label={t.longBreak} 
            value={settings.longBreakTime} 
            onChange={(v) => setSettings(prev => ({...prev, longBreakTime: v}))}
            min={5}
            max={45}
          />
          <div className="border-t border-gray-100 dark:border-gray-700" />
           <SliderRow 
            label={t.intervals} 
            value={settings.pomodorosPerRound} 
            onChange={(v) => setSettings(prev => ({...prev, pomodorosPerRound: v}))}
            min={1}
            max={10}
            unit=""
          />
       </IOSCard>

       {/* APPEARANCE */}
       <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-2 mt-6">{t.appearance}</h2>
       <IOSCard className="px-4 py-4">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-gray-900 dark:bg-gray-600">
                    <Moon size={18} />
                </div>
                <span className="font-medium text-gray-900 dark:text-white">{t.theme}</span>
            </div>
            <IOSSegmentedControl 
                options={[t.theme_system, t.theme_light, t.theme_dark]}
                selected={settings.theme === 'system' ? t.theme_system : settings.theme === 'light' ? t.theme_light : t.theme_dark}
                onChange={(val) => {
                    const newTheme = val === t.theme_light ? 'light' : val === t.theme_dark ? 'dark' : 'system';
                    setSettings(prev => ({...prev, theme: newTheme}));
                }}
            />
       </IOSCard>

       {/* POWER SAVING SETTINGS */}
       <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-2 mt-6">{t.performance}</h2>
       <IOSCard className="px-4 py-1">
            <SettingRow 
                icon={Battery} 
                label={t.powerSaver} 
                value={settings.batterySaverMode} 
                type="toggle"
                color="bg-green-500" 
                onChange={(v) => setSettings(prev => ({...prev, batterySaverMode: v}))}
            />
            {settings.batterySaverMode && (
                <div className="pb-3 px-1">
                     <p className="text-[10px] text-gray-400 leading-tight">
                         {t.powerSaverDesc}
                     </p>
                </div>
            )}
       </IOSCard>

       {/* LANGUAGE SETTINGS */}
       <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-2 mt-6">{t.language}</h2>
       <IOSCard className="px-4 py-1">
            <SettingRow 
                icon={Languages} 
                label={t.language} 
                value={LANGUAGE_NAMES[settings.language]} 
                color="bg-purple-500" 
                onClick={() => setShowLanguageModal(true)}
            />
       </IOSCard>

       <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-2 mt-6">{t.support}</h2>
       <IOSCard className="px-4 py-1">
          <SettingRow 
              icon={HelpCircle} 
              label={t.support} 
              color="bg-green-500"
              onClick={() => window.open('mailto:support@focusflow.app')}
          />
          <div className="border-t border-gray-100 dark:border-gray-700" />
          <SettingRow 
              icon={FileText} 
              label={t.privacy} 
              color="bg-gray-500"
              onClick={() => window.open('https://focusflow.app/privacy')}
          />
          <div className="border-t border-gray-100 dark:border-gray-700" />
          <SettingRow 
              icon={Terminal} 
              label="FocusFlow Lab" 
              color="bg-gray-800"
              onClick={() => setShowDevModal(true)}
          />
       </IOSCard>

       <div className="mt-8 mb-safe text-center">
           <p className="text-xs font-bold text-gray-400">{tFooter?.version || 'FocusFlow v1.5.0'}</p>
           <p className="text-[10px] text-gray-300 mt-1">{tFooter?.architecture || 'Local-First Architecture'}</p>
       </div>

       <AnimatePresence>
          {showLoginModal && <LoginModal />}
          {showPremiumModal && <PremiumModal />}
          {showLanguageModal && <LanguageModal />}
          {showDevModal && <DevModal />}
       </AnimatePresence>
    </div>
  );
};

export default SettingsView;