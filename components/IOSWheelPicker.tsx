import React, { useRef, useEffect, useState } from 'react';

interface WheelPickerProps {
  items: string[];
  selected: string;
  onChange: (value: string) => void;
  width?: string;
  label?: string; // Optional label above/below
}

const ITEM_HEIGHT = 40; // Height of each item in pixels

export const IOSWheelPicker: React.FC<WheelPickerProps> = ({ items, selected, onChange, width = "w-full", label }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize scroll position based on selected value
  useEffect(() => {
    if (scrollRef.current && !isScrolling) {
      const index = items.indexOf(selected);
      if (index !== -1) {
        // FIX: Use setTimeout (50ms) to ensure layout is fully rendered before scrolling.
        // This is critical when the component is inside a Framer Motion AnimatePresence
        // which might report height=0 initially, causing scrollTop to fail.
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = index * ITEM_HEIGHT;
            }
        }, 50);
      }
    }
  }, [selected, items, isScrolling]);

  const handleScroll = () => {
    if (scrollRef.current) {
      setIsScrolling(true);
      
      // Clear existing timer
      if (timerRef.current) clearTimeout(timerRef.current);

      // Debounce the snap/selection logic
      timerRef.current = setTimeout(() => {
        setIsScrolling(false);
        if (scrollRef.current) {
          const scrollTop = scrollRef.current.scrollTop;
          const index = Math.round(scrollTop / ITEM_HEIGHT);
          
          // Clamp index
          const safeIndex = Math.max(0, Math.min(index, items.length - 1));
          
          const newValue = items[safeIndex];
          if (newValue !== selected) {
            onChange(newValue);
          }
        }
      }, 100); // Wait for scroll to settle
    }
  };

  return (
    <div className={`flex flex-col items-center ${width}`}>
      {label && <span className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">{label}</span>}
      <div className="relative h-32 w-full overflow-hidden bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 group">
        
        {/* Selection Highlight Bar (Center) */}
        <div className="absolute top-[44px] left-0 right-0 h-[40px] bg-white dark:bg-gray-700 shadow-sm border-t border-b border-blue-100 dark:border-blue-900/30 z-0 pointer-events-none opacity-80" />
        
        {/* Gradients to fade top/bottom */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-gray-50 dark:from-gray-800 to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-gray-50 dark:from-gray-800 to-transparent z-10 pointer-events-none" />

        {/* Scroll Container */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar py-[44px] relative z-20"
          style={{ scrollBehavior: isScrolling ? 'auto' : 'smooth' }}
        >
          {items.map((item, i) => (
            <div 
              key={i} 
              className={`h-[40px] flex items-center justify-center snap-center transition-opacity duration-200 cursor-pointer
                ${item === selected ? 'text-gray-900 dark:text-white font-bold text-lg scale-105' : 'text-gray-400 dark:text-gray-500 font-medium text-sm'}
              `}
              onClick={() => {
                  // Allow clicking to select
                  onChange(item);
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};