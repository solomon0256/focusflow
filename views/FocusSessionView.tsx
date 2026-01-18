
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Square, Play, Pause, Brain, AlertTriangle, Activity, WifiOff } from 'lucide-react';
import { TimerMode, Task } from '../types';
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { NativeService } from '../services/native';

interface FocusSessionViewProps {
  mode: TimerMode;
  initialTimeInSeconds: number;
  task?: Task;
  onComplete: (minutesFocused: number) => void;
  onCancel: () => void;
}

// --- Algorithm Constants ---
const PITCH_THRESHOLD = 25; 
const YAW_THRESHOLD = 30;   
const ROLL_THRESHOLD = 20;  
const SCORE_DECAY_RATE = 0.5; 
const SCORE_RECOVERY_RATE = 0.2; // Slightly faster recovery

type SessionState = 'INIT' | 'COUNTDOWN' | 'ACTIVE' | 'ERROR';

const FocusSessionView: React.FC<FocusSessionViewProps> = ({ mode, initialTimeInSeconds, task, onComplete, onCancel }) => {
  // --- States ---
  const [sessionState, setSessionState] = useState<SessionState>('INIT');
  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const totalDurationRef = useRef(initialTimeInSeconds);
  
  // Countdown State
  const [countdown, setCountdown] = useState(3);

  // AI State
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isAiDisabled, setIsAiDisabled] = useState(false); 
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);

  // Focus Logic State
  const [focusScore, setFocusScore] = useState(100);
  const [postureStatus, setPostureStatus] = useState<'GOOD' | 'DISTRACTED' | 'BAD_POSTURE'>('GOOD');
  const scoreRef = useRef(100);

  // 0. Screen Awake
  useEffect(() => {
      NativeService.Screen.keepAwake();
      return () => { NativeService.Screen.allowSleep(); };
  }, []);

  // 1. Initialization Pipeline (Runs immediately)
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    const setupPipeline = async () => {
        try {
            // Check for camera permission first
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            // Load AI (Parallel to countdown if we wanted, but sequential is safer for performance)
            const wasmUrl = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm";
            const filesetResolver = await FilesetResolver.forVisionTasks(wasmUrl);
            const modelAssetPath = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
            
            faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: { modelAssetPath, delegate: "GPU" },
                outputFaceBlendshapes: true,
                runningMode: "VIDEO",
                numFaces: 1
            });

            if (isMounted) {
                setSessionState('COUNTDOWN');
            }

        } catch (err: any) {
            console.error("Init Error:", err);
            if (isMounted) {
                setErrorMessage(err.name === 'NotAllowedError' ? 'Camera access needed for Focus AI.' : 'Failed to load AI engine.');
                setSessionState('ERROR');
            }
        }
    };

    setupPipeline();

    return () => {
        isMounted = false;
        if (stream) stream.getTracks().forEach(track => track.stop());
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (faceLandmarkerRef.current) faceLandmarkerRef.current.close();
    };
  }, []);

  // 2. Countdown Logic
  useEffect(() => {
    if (sessionState === 'COUNTDOWN') {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setSessionState('ACTIVE');
                    NativeService.Haptics.notificationSuccess();
                    return 0;
                }
                NativeService.Haptics.impactLight();
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }
  }, [sessionState]);

  // 3. AI Prediction Loop (Only when ACTIVE)
  useEffect(() => {
      if (sessionState === 'ACTIVE' && !isAiDisabled && !isPaused) {
          const predictWebcam = () => {
              const video = videoRef.current;
              const landmarker = faceLandmarkerRef.current;
              
              if (video && landmarker && !video.paused && !video.ended) {
                  let startTimeMs = performance.now();
                  if (video.currentTime !== lastVideoTimeRef.current) {
                      lastVideoTimeRef.current = video.currentTime;
                      try {
                          const results = landmarker.detectForVideo(video, startTimeMs);
                          if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                              analyzePose(results.faceLandmarks[0]);
                          } else {
                              // Face lost = Distracted (or looking away completely)
                              updateScore(false, 'DISTRACTED');
                          }
                      } catch (e) {
                          // Ignore dropped frames
                      }
                  }
              }
              requestRef.current = requestAnimationFrame(predictWebcam);
          };
          
          requestRef.current = requestAnimationFrame(predictWebcam);
      }
      return () => cancelAnimationFrame(requestRef.current);
  }, [sessionState, isAiDisabled, isPaused]);

  // 4. Timer Logic
  useEffect(() => {
      if (sessionState !== 'ACTIVE' || isPaused) return;
      
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
  }, [sessionState, isPaused]);

  // --- Algorithm ---
  const analyzePose = (landmarks: any[]) => {
      const nose = landmarks[1];
      const leftEar = landmarks[234];
      const rightEar = landmarks[454];

      if (!nose || !leftEar || !rightEar) return;

      const faceWidth = Math.abs(leftEar.x - rightEar.x) || 1;
      const pitchDeg = (nose.y - (leftEar.y + rightEar.y) / 2) / faceWidth * 180; 
      const yawDeg = (nose.x - (leftEar.x + rightEar.x) / 2) / faceWidth * 180; 
      const rollDeg = (leftEar.y - rightEar.y) / faceWidth * 180;

      let isGood = true;
      let status: 'GOOD' | 'DISTRACTED' | 'BAD_POSTURE' = 'GOOD';

      if (pitchDeg > PITCH_THRESHOLD) { isGood = false; status = 'BAD_POSTURE'; }
      else if (Math.abs(yawDeg) > YAW_THRESHOLD) { isGood = false; status = 'DISTRACTED'; }
      else if (Math.abs(rollDeg) > ROLL_THRESHOLD) { isGood = false; status = 'BAD_POSTURE'; }

      updateScore(isGood, status);
  };

  const updateScore = (isGood: boolean, status: 'GOOD' | 'DISTRACTED' | 'BAD_POSTURE') => {
      setPostureStatus(status);
      if (isGood) {
          scoreRef.current = Math.min(100, scoreRef.current + SCORE_RECOVERY_RATE);
      } else {
          scoreRef.current = Math.max(0, scoreRef.current - SCORE_DECAY_RATE);
      }
      setFocusScore(Math.round(scoreRef.current));
  };

  // --- Handlers ---
  const handleFinish = () => onComplete((totalDurationRef.current - timeLeft) / 60);
  const handleStop = () => onComplete((totalDurationRef.current - timeLeft) / 60);
  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
      if (isAiDisabled) return 'stroke-gray-500 text-gray-500';
      if (focusScore > 80) return 'stroke-green-400 text-green-400';
      if (focusScore > 50) return 'stroke-yellow-400 text-yellow-400';
      return 'stroke-red-500 text-red-500';
  };

  // --- Render ---

  // 1. Loading / Error Screen
  if (sessionState === 'INIT' || sessionState === 'ERROR') {
      return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center text-white px-8 text-center">
            {sessionState === 'ERROR' ? (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                    <WifiOff size={48} className="text-red-500 mb-4" />
                    <h2 className="text-xl font-bold mb-2">Setup Failed</h2>
                    <p className="text-gray-400 mb-6 text-sm">{errorMessage}</p>
                    <div className="flex gap-4">
                        <button onClick={onCancel} className="px-6 py-3 rounded-full bg-gray-800 font-semibold">Back</button>
                        <button onClick={() => { setIsAiDisabled(true); setSessionState('COUNTDOWN'); }} className="px-6 py-3 rounded-full bg-blue-600 font-semibold">No AI</button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center">
                     <div className="w-16 h-16 border-4 border-gray-800 border-t-blue-500 rounded-full animate-spin mb-6" />
                     <h2 className="text-lg font-bold">Initializing AI...</h2>
                     <p className="text-xs text-gray-500 mt-2">Connecting to neural engine</p>
                </div>
            )}
        </div>
      );
  }

  // 2. Countdown Screen
  if (sessionState === 'COUNTDOWN') {
      return (
          <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
              {/* Background Video Preview (Darkened) */}
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm scale-x-[-1]" />
              <motion.div 
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="text-[120px] font-bold text-white relative z-10 font-mono"
              >
                  {countdown}
              </motion.div>
          </div>
      );
  }

  // 3. Active Session
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-between text-white overflow-hidden">
        
        {/* Background Layer */}
        {isAiDisabled ? (
            <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center">
                <Brain size={64} className="text-gray-800" />
            </div>
        ) : (
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-60 scale-x-[-1]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/90 pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 w-full pt-safe-top px-6 mt-4 flex justify-between items-start">
             <div>
                <h2 className="text-xl font-bold mt-1 shadow-black drop-shadow-md">
                    {mode === TimerMode.POMODORO ? 'Deep Focus' : task?.title || 'Session'}
                </h2>
                {!isAiDisabled && (
                    <div className="flex items-center gap-1.5 mt-2">
                         <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                         <span className="text-[10px] text-green-400 font-bold tracking-wider uppercase">Live Tracking</span>
                    </div>
                )}
             </div>

             {/* Dynamic Focus Score Ring */}
             {!isAiDisabled && (
                <div className="relative flex flex-col items-center justify-center">
                    <svg className="w-14 h-14 transform -rotate-90">
                        <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-800" />
                        <circle 
                            cx="28" cy="28" r="24" 
                            stroke="currentColor" strokeWidth="4" fill="transparent" 
                            strokeDasharray={2 * Math.PI * 24}
                            strokeDashoffset={2 * Math.PI * 24 * (1 - focusScore / 100)}
                            className={`${getStatusColor()} transition-all duration-500`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-xs font-bold ${getStatusColor().split(' ')[1]}`}>{focusScore}</span>
                    </div>
                </div>
             )}
        </div>

        {/* Middle: Timer */}
        <div className="relative z-10 flex flex-col items-center justify-center drop-shadow-2xl">
            {/* Status Alert */}
            <div className="h-8 mb-4">
                <AnimatePresence>
                    {!isAiDisabled && postureStatus !== 'GOOD' && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-red-500/90 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-red-900/50"
                        >
                            <AlertTriangle size={14} className="text-white" />
                            <span className="font-bold text-xs tracking-wide">
                                {postureStatus === 'BAD_POSTURE' ? 'FIX POSTURE' : 'DISTRACTED'}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="relative">
                <span className="text-8xl font-mono font-light tracking-tighter tabular-nums text-white">
                    {formatTime(timeLeft)}
                </span>
                {isPaused && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/50 backdrop-blur-sm px-4 py-1 rounded text-sm font-bold tracking-widest uppercase border border-white/20">
                            Paused
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Footer Controls */}
        <div className="relative z-10 w-full pb-safe px-10 mb-12 flex items-center justify-around">
             <button onClick={onCancel} className="w-16 h-16 rounded-full bg-gray-800/60 backdrop-blur-md flex items-center justify-center text-white/70 hover:bg-gray-700 transition-colors">
                 <X size={28} />
             </button>

             <button 
                onClick={() => { setIsPaused(!isPaused); NativeService.Haptics.impactMedium(); }}
                className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
             >
                 {isPaused ? <Play size={32} fill="black" className="ml-1" /> : <Pause size={32} fill="black" />}
             </button>

             <button onClick={handleStop} className="w-16 h-16 rounded-full bg-red-500/80 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-600 transition-colors">
                 <Square size={24} fill="currentColor" />
             </button>
        </div>
    </div>
  );
};

export default FocusSessionView;
