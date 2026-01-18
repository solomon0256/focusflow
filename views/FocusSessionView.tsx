import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Square, Play, Pause, VideoOff, Camera } from 'lucide-react';
import { TimerMode, Task } from '../types';

interface FocusSessionViewProps {
  mode: TimerMode;
  initialTimeInSeconds: number;
  task?: Task;
  onComplete: (minutesFocused: number) => void;
  onCancel: () => void;
}

const FocusSessionView: React.FC<FocusSessionViewProps> = ({ mode, initialTimeInSeconds, task, onComplete, onCancel }) => {
  // Timer State
  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const totalDurationRef = useRef(initialTimeInSeconds);
  const [cameraError, setCameraError] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // 1. Initialize Camera (Pure Video Feed, No AI)
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
        try {
            // Request camera with ideal settings for mobile/web
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: 720 },
                    height: { ideal: 1280 }
                },
                audio: false
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Important for iOS: ensure playsInline is true (handled in JSX)
            }
        } catch (err) {
            console.error("Camera Access Error:", err);
            setCameraError(true);
        }
    };

    startCamera();

    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, []);

  // 2. Timer Loop
  useEffect(() => {
      if (isPaused) return;

      const interval = setInterval(() => {
          setTimeLeft((prev) => {
              if (prev <= 1) {
                  clearInterval(interval);
                  handleFinish();
                  return 0;
              }
              return prev - 1;
          });
      }, 1000);

      return () => clearInterval(interval);
  }, [isPaused]);

  const handleFinish = () => {
      const minutes = (totalDurationRef.current - timeLeft) / 60;
      onComplete(minutes);
  };

  const handleStop = () => {
      const minutes = (totalDurationRef.current - timeLeft) / 60;
      onComplete(minutes);
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-between text-white overflow-hidden">
        
        {/* Background Camera Layer */}
        {cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-gray-500">
                <VideoOff size={64} className="mb-4" />
                <p>Camera access denied or unavailable.</p>
                <p className="text-xs mt-2">Check your browser settings.</p>
            </div>
        ) : (
            <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }} // Mirror the selfie camera
            />
        )}
        
        {/* Overlay Darkening Gradient for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

        {/* --- Header --- */}
        <div className="relative z-10 w-full pt-safe-top px-6 mt-4 flex justify-between items-start">
             <div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold text-red-500 uppercase tracking-widest">LIVE</span>
                </div>
                <h2 className="text-xl font-bold mt-1 shadow-black drop-shadow-md">
                    {mode === TimerMode.POMODORO ? 'Deep Focus' : task?.title || 'Custom Session'}
                </h2>
             </div>
             <div className="bg-white/20 backdrop-blur-md p-2 rounded-full">
                 <Camera size={20} className="text-white" />
             </div>
        </div>

        {/* --- Center Timer --- */}
        <div className="relative z-10 flex flex-col items-center justify-center drop-shadow-2xl">
            <span className="text-8xl font-mono font-thin tracking-tighter tabular-nums text-white">
                {formatTime(timeLeft)}
            </span>
            <span className="text-sm font-bold uppercase tracking-widest text-white/80 mt-2">Remaining</span>
        </div>

        {/* --- Footer Controls --- */}
        <div className="relative z-10 w-full pb-safe px-10 mb-12 flex items-center justify-around">
             {/* Cancel Button */}
             <button 
                onClick={onCancel}
                className="w-16 h-16 rounded-full bg-gray-800/60 backdrop-blur-md flex items-center justify-center text-white/70 hover:bg-gray-700 transition-colors"
             >
                 <X size={28} />
             </button>

             {/* Play/Pause */}
             <button 
                onClick={() => setIsPaused(!isPaused)}
                className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
             >
                 {isPaused ? <Play size={32} fill="black" className="ml-1" /> : <Pause size={32} fill="black" />}
             </button>

             {/* Stop/Finish Button */}
             <button 
                onClick={handleStop}
                className="w-16 h-16 rounded-full bg-red-500/80 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-600 transition-colors"
             >
                 <Square size={24} fill="currentColor" />
             </button>
        </div>
    </div>
  );
};

export default FocusSessionView;