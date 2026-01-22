
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, X, Radio, Upload, Plus } from 'lucide-react';
import { Settings } from '../types';
import { SOUND_LIBRARY, AudioService, SoundOption } from '../services/audio';
import { IOSSegmentedControl } from './IOSComponents';

interface SoundSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

export const SoundSelector: React.FC<SoundSelectorProps> = ({ isOpen, onClose, settings, setSettings }) => {
    // Local state to combine default and custom sounds for display
    const [allSounds, setAllSounds] = useState<SoundOption[]>(SOUND_LIBRARY);

    const handleSoundSelect = (id: string) => {
        setSettings(prev => ({ ...prev, selectedSoundId: id, soundEnabled: id !== 'none' }));
    };

    const handleModeChange = (val: string) => {
        const mode = val === 'Timer Only' ? 'timer' : 'always';
        setSettings(prev => ({ ...prev, soundMode: mode }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const id = 'custom_' + Date.now();
            const name = file.name.slice(0, 8) + '...'; // Truncate name
            
            // Register with AudioService
            AudioService.registerCustomSound(id, url);
            
            // Update local UI list
            const newSound: SoundOption = { id, name, icon: '🎵', url };
            setAllSounds(prev => [...prev, newSound]);
            
            // Auto select
            handleSoundSelect(id);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60]"
                        onClick={onClose}
                    />
                    <motion.div 
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[70] p-6 pb-safe shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg"><Volume2 size={20} /></span>
                                Background Sound
                            </h3>
                            <button onClick={onClose} className="bg-gray-100 p-1.5 rounded-full text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Mode Switcher */}
                        <div className="mb-6">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Playback Mode</label>
                            <IOSSegmentedControl 
                                options={['Timer Only', 'Always On']} 
                                selected={settings.soundMode === 'timer' ? 'Timer Only' : 'Always On'}
                                onChange={handleModeChange}
                            />
                            <p className="text-[10px] text-gray-400 mt-2 px-1">
                                {settings.soundMode === 'timer' 
                                    ? "Plays only during focus sessions (silenced during breaks)." 
                                    : "Plays immediately. Stops when app goes to background."}
                            </p>
                        </div>

                        {/* Sound Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {allSounds.map(sound => {
                                const isSelected = settings.selectedSoundId === sound.id;
                                return (
                                    <button
                                        key={sound.id}
                                        onClick={() => handleSoundSelect(sound.id)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all active:scale-95
                                            ${isSelected 
                                                ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100' 
                                                : 'border-transparent bg-gray-50 text-gray-600'
                                            }
                                        `}
                                    >
                                        <div className="text-2xl mb-1">{sound.icon}</div>
                                        <span className={`text-xs font-bold ${isSelected ? 'text-indigo-700' : 'text-gray-500'}`}>{sound.name}</span>
                                        {isSelected && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 animate-pulse" />}
                                    </button>
                                )
                            })}
                            
                            {/* Upload Button */}
                            <label className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-500 transition-colors active:scale-95">
                                <Upload size={20} className="mb-1" />
                                <span className="text-xs font-bold">Custom</span>
                                <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>

                        {/* Volume Slider */}
                        <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                            <button onClick={() => setSettings(prev => ({ ...prev, soundVolume: 0 }))}>
                                {settings.soundVolume === 0 ? <VolumeX size={20} className="text-gray-400"/> : <Volume2 size={20} className="text-gray-600"/>}
                            </button>
                            <input 
                                type="range" 
                                min="0" max="100" 
                                value={settings.soundVolume * 100}
                                onChange={(e) => setSettings(prev => ({ ...prev, soundVolume: parseInt(e.target.value) / 100 }))}
                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <span className="text-xs font-bold text-gray-500 w-8 text-right">{Math.round(settings.soundVolume * 100)}%</span>
                        </div>

                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
