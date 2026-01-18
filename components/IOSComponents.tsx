import React from 'react';
import { motion } from 'framer-motion';

// A styled card container resembling iOS grouped table views
export const IOSCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white rounded-2xl shadow-sm overflow-hidden mb-4 ${className}`}
  >
    {children}
  </motion.div>
);

// A standard iOS primary button
export const IOSButton: React.FC<{ 
  onClick?: () => void; 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  disabled?: boolean;
}> = ({ onClick, children, variant = 'primary', className = '', disabled }) => {
  const baseStyle = "w-full py-3.5 rounded-xl font-semibold text-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  const variants = {
    primary: "bg-blue-500 text-white shadow-blue-200 shadow-lg",
    secondary: "bg-gray-100 text-gray-900",
    danger: "bg-red-500 text-white shadow-red-200 shadow-lg"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

// Toggle Switch
export const IOSToggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => (
  <div 
    className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 cursor-pointer ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
    onClick={() => onChange(!checked)}
  >
    <motion.div 
      className="bg-white w-5 h-5 rounded-full shadow-sm"
      animate={{ x: checked ? 20 : 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    />
  </div>
);

// Segmented Control
export const IOSSegmentedControl: React.FC<{ 
  options: string[]; 
  selected: string; 
  onChange: (val: string) => void 
}> = ({ options, selected, onChange }) => {
  return (
    <div className="bg-gray-200/80 p-1 rounded-lg flex relative">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md relative z-10 transition-colors ${selected === opt ? 'text-black' : 'text-gray-500'}`}
        >
          {opt}
        </button>
      ))}
      <motion.div
        className="absolute top-1 bottom-1 bg-white rounded-md shadow-sm z-0"
        initial={false}
        animate={{
            left: `${(options.indexOf(selected) / options.length) * 100}%`,
            width: `${100 / options.length}%`
        }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
      />
    </div>
  );
};