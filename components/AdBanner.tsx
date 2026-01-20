import React from 'react';
import { X } from 'lucide-react';

interface AdBannerProps {
    onRemoveAds: () => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({ onRemoveAds }) => {
    return (
        <div className="mx-4 mt-auto mb-safe bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 flex items-center justify-between relative overflow-hidden group cursor-pointer" onClick={onRemoveAds}>
            {/* Shimmer Effect */}
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
            
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
                    <span className="font-bold text-xs text-white">AD</span>
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white leading-tight">Focus Pro</h4>
                    <p className="text-[10px] text-white/70">Unlock Posture AI & Stats</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button 
                    className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-sm active:scale-95 transition-transform"
                >
                    Remove Ads
                </button>
                <button className="text-white/50 hover:text-white" onClick={(e) => { e.stopPropagation(); /* In real app, close ad */ }}>
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};