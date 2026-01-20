import React, { useMemo, useState } from 'react';
import { ChevronRight, User as UserIcon, Shield, LogOut, CreditCard, Crown, X, Apple, Check, Cloud, RotateCcw, Languages } from 'lucide-react';
import { IOSCard, IOSToggle, IOSButton } from '../components/IOSComponents';
import { Settings, User, Product } from '../types';
import { SAAS_CONFIG } from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { translations } from '../utils/translations';

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
             <span className="text-blue-600 font-bold w-12 text-right">{value}{unit}</span>
          </div>
          <input 
            type="range" 
            min={min} 
            max={max} 
            value={value} 
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
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
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, setSettings, user, onLogin, onLogout, onUpgrade }) => {
  const t = translations[settings.language].settings;
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Default to selecting the first plan (usually monthly or the recommended one)
  // We'll find the one tagged 'BEST VALUE' or default to index 0
  const defaultPlanId = SAAS_CONFIG.plans.find(p => p.tag === 'BEST VALUE')?.id || SAAS_CONFIG.plans[0].id;
  const [selectedPlanId, setSelectedPlanId] = useState<string>(defaultPlanId);

  const selectedPlan = SAAS_CONFIG.plans.find(p => p.id === selectedPlanId);

  const handlePerformLogin = (provider: 'apple' | 'google') => {
      onLogin(provider);
      setShowLoginModal(false);
  };

  const handlePerformUpgrade = () => {
      // In a real app: RevenueCat.purchasePackage(selectedPlan.id)
      console.log(`Simulating purchase for: ${selectedPlanId}`);
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
          pomodorosPerRound: 4
      }));
  };

  // --- Login Modal ---
  const LoginModal = () => (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowLoginModal(false)}
      >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
              <button onClick={() => setShowLoginModal(false)} className="absolute right-4 top-4 text-gray-400 p-1"><X size={20}/></button>
              
              <div className="flex flex-col items-center mb-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 mb-4">
                      <Cloud size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{t.cloudSync}</h2>
                  <p className="text-gray-500 text-sm text-center mt-2 px-2">
                      {t.proDesc}
                  </p>
              </div>

              <div className="space-y-3">
                  <button onClick={() => handlePerformLogin('apple')} className="w-full py-3.5 bg-black text-white rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                      <Apple size={20} fill="white" /> Sign in with Apple
                  </button>
                  <button onClick={() => handlePerformLogin('google')} className="w-full py-3.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Sign in with Google
                  </button>
              </div>
          </motion.div>
      </motion.div>
  );

  // --- Premium Modal ---
  const PremiumModal = () => (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={() => setShowPremiumModal(false)}
    >
        <motion.div 
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-[#F2F2F7] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-0 shadow-2xl relative overflow-hidden h-[92vh] sm:h-[85vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
            {/* Header Art */}
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
                {/* Feature List */}
                <div className="space-y-3 mb-6">
                    {SAAS_CONFIG.features.map((feat, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                <Check size={12} className="text-indigo-600 font-bold" strokeWidth={3} />
                            </div>
                            <span className="text-gray-800 text-sm font-medium">{feat}</span>
                        </div>
                    ))}
                </div>

                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Choose a Plan</div>

                {/* Plan Selection */}
                <div className="space-y-3 mb-6">
                    {SAAS_CONFIG.plans.map((plan) => {
                        const isSelected = selectedPlanId === plan.id;
                        return (
                            <div 
                                key={plan.id}
                                onClick={() => setSelectedPlanId(plan.id)}
                                className={`relative border-2 p-4 rounded-xl cursor-pointer transition-all duration-200 flex justify-between items-center bg-white
                                    ${isSelected ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500 bg-indigo-50/10' : 'border-transparent shadow-sm hover:bg-gray-50'}
                                `}
                            >
                                {plan.tag && (
                                    <div className="absolute -top-2.5 right-4 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                        {plan.tag}
                                    </div>
                                )}
                                
                                <div>
                                     <div className="flex items-center gap-2">
                                         <h3 className={`font-bold ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>{plan.name}</h3>
                                     </div>
                                     <div className="text-sm text-gray-500 mt-0.5">{plan.description}</div>
                                </div>

                                <div className="text-right">
                                    <div className="text-xl font-bold text-gray-900">{plan.price}</div>
                                    <div className="flex justify-end mt-1">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                                            ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}
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

            {/* Bottom Actions */}
            <div className="p-6 bg-white border-t border-gray-100 shrink-0 pb-safe">
                <IOSButton onClick={handlePerformUpgrade} className="bg-black border-none shadow-gray-400 mb-3">
                    <div className="flex items-center justify-center gap-2">
                        <Apple size={20} fill="white" /> 
                        <span>
                            Subscribe for {selectedPlan?.price}
                            {selectedPlan?.interval !== 'lifetime' && <span className="text-sm opacity-80 font-normal ml-1">/{selectedPlan?.interval}</span>}
                        </span>
                    </div>
                </IOSButton>

                <p className="text-[10px] text-gray-400 text-center leading-tight">
                    Recurring billing, cancel anytime. By continuing you agree to our Terms of Service and Privacy Policy.
                </p>
                <button onClick={handleRestorePurchases} className="w-full mt-3 py-1 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                    {t.restore}
                </button>
            </div>
        </motion.div>
    </motion.div>
  );

  return (
    <div className="pt-8 pb-32 px-6 h-full overflow-y-auto no-scrollbar relative">
       <h1 className="text-3xl font-bold text-gray-900 mb-6">{t.title}</h1>

       {/* Premium Banner */}
       {!user?.isPremium ? (
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
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-y-1/2 translate-x-1/4" />
           </div>
       ) : (
            <div className="bg-gray-900 rounded-2xl p-6 text-white mb-6 shadow-lg flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-yellow-400">
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
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 overflow-hidden">
                             <UserIcon size={24} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-lg leading-tight">{user.name}</p>
                            <p className="text-gray-500 text-sm flex items-center gap-1">
                                <Cloud size={12} /> Data Synced
                            </p>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-100" />
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
               className="text-[10px] font-bold text-blue-500 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md active:scale-95 transition-transform"
           >
               <RotateCcw size={10} />
               {t.reset}
           </button>
       </div>
       <IOSCard className="px-4 py-1">
          <SliderRow 
            label={t.focusDuration} 
            value={settings.workTime} 
            onChange={(v) => setSettings({...settings, workTime: v})}
            min={1}
            max={90}
          />
          <div className="border-t border-gray-100" />
          <SliderRow 
            label={t.shortBreak} 
            value={settings.shortBreakTime} 
            onChange={(v) => setSettings({...settings, shortBreakTime: v})}
            min={1}
            max={30}
          />
          <div className="border-t border-gray-100" />
           <SliderRow 
            label={t.longBreak} 
            value={settings.longBreakTime} 
            onChange={(v) => setSettings({...settings, longBreakTime: v})}
            min={5}
            max={45}
          />
          <div className="border-t border-gray-100" />
           <SliderRow 
            label={t.intervals} 
            value={settings.pomodorosPerRound} 
            onChange={(v) => setSettings({...settings, pomodorosPerRound: v})}
            min={1}
            max={10}
            unit=""
          />
       </IOSCard>

       {/* LANGUAGE SETTINGS */}
       <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-2 mt-6">{t.language}</h2>
       <IOSCard className="px-4 py-1">
            <SettingRow 
                icon={Languages} 
                label="English / 中文" 
                value={settings.language === 'en' ? 'English' : '中文'} 
                color="bg-purple-500" 
                onClick={() => setSettings({...settings, language: settings.language === 'en' ? 'zh' : 'en'})}
            />
       </IOSCard>

       <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-2 mt-6">{t.support}</h2>
       <IOSCard className="px-4 py-1">
           <SettingRow icon={CreditCard} label={t.restore} color="bg-green-500" onClick={handleRestorePurchases} />
           <div className="border-t border-gray-100" />
           <SettingRow icon={Shield} label={t.privacy} color="bg-blue-500" />
       </IOSCard>

       <div className="text-center mt-8 mb-4">
           <p className="text-xs text-gray-400">FocusFlow v1.3.0</p>
           <p className="text-xs text-gray-300 mt-1">Local-First Architecture</p>
       </div>

       <AnimatePresence>
           {showLoginModal && <LoginModal />}
           {showPremiumModal && <PremiumModal />}
       </AnimatePresence>
    </div>
  );
};

export default SettingsView;