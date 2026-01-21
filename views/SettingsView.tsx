
import React, { useState } from 'react';
import { ChevronRight, User as UserIcon, Shield, LogOut, CreditCard, Crown, X, Apple, Check, Cloud, RotateCcw, Languages, Terminal, Loader2, Battery, Zap } from 'lucide-react';
import { IOSCard, IOSToggle, IOSButton } from '../components/IOSComponents';
import { Settings, User, LanguageCode } from '../types';
import { SAAS_CONFIG } from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { translations, LANGUAGE_NAMES } from '../utils/translations';

const formatMinutes = (m: number) => {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
};

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
        className="flex items-center justify-between py-3 cursor-pointer active:bg-gray-50 transition-colors"
        onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${color}`}>
            <Icon size={18} />
        </div>
        <span className={`font-medium ${type === 'danger' ? 'text-red-500' : 'text-gray-900'}`}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {type === 'toggle' ? (
             <IOSToggle checked={value as boolean} onChange={onChange || (() => {})} />
        ) : (
            <>
                <span className="text-gray-400 text-sm">{value as string}</span>
                {type !== 'danger' && <ChevronRight size={18} className="text-gray-300" />}
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
             <span className="font-medium text-gray-900">{label}</span>
             <span className="text-blue-600 font-bold w-12 text-right">
                {unit === 'm' ? formatMinutes(value) : `${value}${unit}`}
             </span>
          </div>
          <input 
            type="range" 
            min={min} 
            max={max} 
            value={value} 
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500"
          />
      </div>
));

interface SettingsViewProps {
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
    user: User | null;
    onLogin: (provider: 'apple' | 'google') => void;
    onLogout: () => void;
    onUpgrade: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, setSettings, user, onLogin, onLogout, onUpgrade }) => {
  const t = translations[settings.language].settings;
  const tPremium = translations[settings.language].premium;
  const tFooter = translations[settings.language].footer;
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(SAAS_CONFIG.plans[1].id); // 默认选择年度

  const handlePerformLogin = (provider: 'apple' | 'google') => {
      onLogin(provider);
      setShowLoginModal(false);
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

  return (
    <div className="pt-8 pb-32 px-6 h-full overflow-y-auto no-scrollbar">
       <h1 className="text-3xl font-bold text-gray-900 mb-6">{t.title}</h1>

       {/* Premium Banner */}
       {!user?.isPremium && (
           <div 
             onClick={() => setShowPremiumModal(true)}
             className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-6 shadow-lg shadow-indigo-200 cursor-pointer active:scale-[0.98] transition-transform relative overflow-hidden"
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
           </div>
       )}

       {/* Account Section */}
       <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-2">{t.cloudSync}</h2>
       <IOSCard className="px-4 py-1">
          {user ? (
            <>
                <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 overflow-hidden">
                             <UserIcon size={24} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-lg leading-tight">{user.name}</p>
                            <p className="text-gray-500 text-sm flex items-center gap-1"><Cloud size={12} /> Data Synced</p>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-100" />
                <SettingRow icon={LogOut} label={t.signOut} type="danger" color="bg-transparent text-red-500" onClick={onLogout} />
            </>
          ) : (
            <SettingRow icon={Cloud} label={t.enableCloud} value="Off" color="bg-gray-400" onClick={() => setShowLoginModal(true)} />
          )}
       </IOSCard>

       {/* Timer Section */}
       <div className="flex justify-between items-end mb-2 ml-2 mt-6 pr-2">
           <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t.timerConfig}</h2>
           <button onClick={handleReset} className="text-[10px] font-bold text-blue-500 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md active:scale-95 transition-transform">
               <RotateCcw size={10} /> {t.reset}
           </button>
       </div>
       <IOSCard className="px-4 py-1">
          <SliderRow label={t.focusDuration} value={settings.workTime} onChange={(v) => setSettings({...settings, workTime: v})} min={1} max={90} />
          <div className="border-t border-gray-100" />
          <SliderRow label={t.shortBreak} value={settings.shortBreakTime} onChange={(v) => setSettings({...settings, shortBreakTime: v})} min={1} max={30} />
          <div className="border-t border-gray-100" />
          <SliderRow label={t.longBreak} value={settings.longBreakTime} onChange={(v) => setSettings({...settings, longBreakTime: v})} min={5} max={45} />
       </IOSCard>

       {/* Performance Section */}
       <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-2 mt-6">{t.performance}</h2>
       <IOSCard className="px-4 py-1">
            <SettingRow icon={Battery} label={t.powerSaver} value={settings.batterySaverMode} type="toggle" color="bg-green-500" onChange={(v) => setSettings({...settings, batterySaverMode: v})} />
            {settings.batterySaverMode && (
                <div className="pb-3 px-1"><p className="text-[10px] text-gray-400 leading-tight">{t.powerSaverDesc}</p></div>
            )}
       </IOSCard>

       {/* Language Section */}
       <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-2 mt-6">{t.language}</h2>
       <IOSCard className="px-4 py-1">
            <SettingRow icon={Languages} label={t.language} value={LANGUAGE_NAMES[settings.language]} color="bg-purple-500" onClick={() => setShowLanguageModal(true)} />
       </IOSCard>

       {/* Support Section */}
       <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-2 mt-6">{t.support}</h2>
       <IOSCard className="px-4 py-1">
           <SettingRow icon={CreditCard} label={t.restore} color="bg-green-500" onClick={() => alert("Restored")} />
           <div className="border-t border-gray-100" />
           <SettingRow icon={Shield} label={t.privacy} color="bg-blue-500" />
       </IOSCard>

       <div className="text-center mt-12 mb-4">
           <p className="text-xs text-gray-400">{tFooter.version}</p>
           <p className="text-[10px] text-gray-300 mt-1">{tFooter.architecture}</p>
       </div>

       {/* Modals */}
       <AnimatePresence>
           {showLoginModal && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLoginModal(false)}>
                   <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                       <h2 className="text-2xl font-bold text-center mb-6">{t.cloudSync}</h2>
                       <IOSButton onClick={() => handlePerformLogin('apple')} className="bg-black mb-3">Sign in with Apple</IOSButton>
                       <IOSButton variant="secondary" onClick={() => handlePerformLogin('google')}>Sign in with Google</IOSButton>
                   </motion.div>
               </motion.div>
           )}
           {showPremiumModal && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center" onClick={() => setShowPremiumModal(false)}>
                   <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="bg-[#f2f2f7] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
                       <div className="flex justify-between items-center mb-6">
                           <h2 className="text-2xl font-bold text-gray-900">{t.choosePlan}</h2>
                           <button onClick={() => setShowPremiumModal(false)} className="bg-gray-200 p-1 rounded-full text-gray-500"><X size={20} /></button>
                       </div>
                       <div className="space-y-3 mb-6">
                           {SAAS_CONFIG.plans.map(plan => (
                               <div key={plan.id} onClick={() => setSelectedPlanId(plan.id)} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedPlanId === plan.id ? 'border-blue-500 bg-white shadow-md' : 'border-transparent bg-white/50'}`}>
                                   <div className="flex justify-between items-center">
                                       <div>
                                           <div className="flex items-center gap-2">
                                               <span className="font-bold text-lg">{plan.name}</span>
                                               {plan.tag && <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{plan.tag}</span>}
                                           </div>
                                           <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                                       </div>
                                       <div className="text-xl font-bold text-blue-600">{plan.price}</div>
                                   </div>
                               </div>
                           ))}
                       </div>
                       <IOSButton onClick={() => { onUpgrade(); setShowPremiumModal(false); }} className="mb-4">Subscribe Now</IOSButton>
                       <p className="text-[10px] text-gray-400 text-center leading-relaxed">{t.recurring}</p>
                   </motion.div>
               </motion.div>
           )}
           {showLanguageModal && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLanguageModal(false)}>
                   <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-sm rounded-2xl p-4 overflow-y-auto max-h-[70vh]" onClick={e => e.stopPropagation()}>
                       {Object.keys(LANGUAGE_NAMES).map((code) => (
                           <button key={code} onClick={() => { setSettings({...settings, language: code as LanguageCode}); setShowLanguageModal(false); }} className={`w-full text-left px-4 py-3 rounded-xl ${settings.language === code ? 'bg-blue-50 text-blue-600' : ''}`}>
                               {LANGUAGE_NAMES[code as LanguageCode]}
                           </button>
                       ))}
                   </motion.div>
               </motion.div>
           )}
       </AnimatePresence>
    </div>
  );
};

export default SettingsView;
