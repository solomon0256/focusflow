import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, X, Upload, AudioWaveform, CloudRain, Trees, Coffee, Activity, Sparkles, User as UserIcon, Waves, Zap } from 'lucide-react';
import { Settings, SoundMode } from '../types';
import { SOUND_LIBRARY, AudioService, SoundOption, SoundCategory } from '../services/audio';
import { IOSSegmentedControl, IOSToggle } from './IOSComponents';
import { translations } from '../utils/translations';

interface SoundSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

export const SoundSelector: React.FC<SoundSelectorProps> = ({ isOpen, onClose, settings, setSettings }) => {
    const t = translations[settings.language].sound;
    const [activeTab, setActiveTab] = useState<SoundCategory>('frequency');
    const [localCustoms, setLocalCustoms] = useState<SoundOption[]>([]);

    const filteredSounds = useMemo(() => {
        const base = SOUND_LIBRARY.filter(s => s.category === activeTab || s.category === 'none');
        const customs = activeTab === 'custom' ? localCustoms : [];
        return [...base, ...customs];
    }, [activeTab, localCustoms]);

    const handleSoundSelect = (id: string) => {
        setSettings(prev => ({ ...prev, selectedSoundId: id, soundEnabled: id !== 'none' }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const id = 'custom_' + Date.now();
            AudioService.registerCustomSound(id, url);
            const newSound: SoundOption = { id, name: file.name.slice(0, 10), category: 'custom', url };
            setLocalCustoms(prev => [...prev, newSound]);
            handleSoundSelect(id);
        }
    };

    const getIcon = (id: string) => {
        const size = 24;
        switch (id) {
            case 'none': return <VolumeX size={size} />;
            case 'pink': return <AudioWaveform size={size} className="text-rose-400" />;
            case 'brown': return <Waves size={size} className="text-amber-600" />;
            case 'rain_proc': return <CloudRain size={size} className="text-blue-400" />;
            case 'gamma_40': return <Zap size={size} className="text-purple-500" />;
            case 'cafe_remote': return <Coffee size={size} />;
            default: return <UserIcon size={size} />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60]" onClick={onClose} />
                    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl z-[70] p-6 pb-safe shadow-2xl max-h-[85vh] flex flex-col border-t border-transparent dark:border-gray-800"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Volume2 className="text-indigo-600 dark:text-indigo-400" /> {t.title}
                            </h3>
                            <button onClick={onClose} className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><X size={20} /></button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Activity size={16} className="text-indigo-500" />
                                        <span className="font-bold text-gray-800 dark:text-white text-sm">{t.smartVolume}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{t.smartVolumeDesc}</p>
                                </div>
                                <IOSToggle 
                                    checked={settings.soundEnabled} 
                                    onChange={(v) => AudioService.setAutoVolumeEnabled(v)} 
                                />
                            </div>
                            
                            <IOSSegmentedControl 
                                options={[t.timerOnly, t.alwaysOn]} 
                                selected={settings.soundMode === 'timer' ? t.timerOnly : t.alwaysOn}
                                onChange={(val) => setSettings(prev => ({ ...prev, soundMode: val === t.timerOnly ? 'timer' : 'always' }))}
                            />
                        </div>

                        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar py-1">
                            {(['frequency', 'ambience', 'custom'] as SoundCategory[]).map(cat => (
                                <button key={cat} onClick={() => setActiveTab(cat)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap
                                        ${activeTab === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}
                                    `}
                                >
                                    {t[cat] ? t[cat].toUpperCase() : cat.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-3 overflow-y-auto no-scrollbar pb-6 flex-1">
                            {filteredSounds.map(sound => {
                                const isSelected = settings.selectedSoundId === sound.id;
                                // Localize sound names if possible, else fallback
                                const displayName = sound.id === 'none' ? t.off : sound.name;
                                
                                return (
                                    <button key={sound.id} onClick={() => handleSoundSelect(sound.id)}
                                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95 h-28
                                            ${isSelected 
                                                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/30 shadow-sm' 
                                                : 'border-transparent bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}
                                        `}
                                    >
                                        <div className={`mb-2 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-current'}`}>{getIcon(sound.id)}</div>
                                        <span className={`text-[10px] font-black text-center line-clamp-1 ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}`}>{displayName}</span>
                                    </button>
                                )
                            })}
                            {activeTab === 'custom' && (
                                <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 cursor-pointer h-28 active:scale-95 transition-all hover:bg-gray-100 dark:hover:bg-gray-800">
                                    <Upload size={24} className="mb-2" />
                                    <span className="text-[10px] font-black">{t.upload}</span>
                                    <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
                                </label>
                            )}
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl flex items-center gap-4 mt-auto border border-gray-100 dark:border-gray-700">
                            <Volume2 size={18} className="text-gray-400 dark:text-gray-500" />
                            <input type="range" min="0" max="100" value={settings.soundVolume * 100}
                                onChange={(e) => setSettings(prev => ({ ...prev, soundVolume: parseInt(e.target.value) / 100 }))}
                                className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                            <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 w-8">{Math.round(settings.soundVolume * 100)}%</span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};