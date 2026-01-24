
import React from 'react';
import { Clock, ListTodo, BarChart2, Settings as SettingsIcon } from 'lucide-react';
import { Settings } from '../types';
import { translations } from '../utils/translations';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  settings: Settings; // Added settings prop for language
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, settings }) => {
  const t = translations[settings.language].nav;
  
  const tabs = [
    { id: 'timer', label: t.timer, icon: Clock },
    { id: 'tasks', label: t.tasks, icon: ListTodo },
    { id: 'stats', label: t.stats, icon: BarChart2 },
    { id: 'settings', label: t.settings, icon: SettingsIcon },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 pb-safe pt-2 z-50 w-full transition-colors duration-300">
      {/* Changed justify-between + max-w-md to justify-evenly + w-full to prevent side gaps */}
      <div className="flex justify-evenly items-center w-full h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 active:scale-95 ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;