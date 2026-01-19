
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Square, Play, Pause, Brain, AlertTriangle, Activity, WifiOff, ScanFace, Eye, EyeOff, User } from 'lucide-react';
import { TimerMode, Task } from '../types';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import { NativeService } from '../services/native';

interface FocusSessionViewProps {
  mode: TimerMode;
  initialTimeInSeconds: number;
  task?: Task;
  onComplete: (minutesFocused: number) => void;
  onCancel: () => void;
}

// --- V2 STRATEGY CONFIGURATION ---
const HISTORY_WINDOW_SIZE = 60; // Approx 4-5 seconds at 15fps
const DISTRACTION_THRESHOLD_PERCENT = 0.8; // Trigger alert if 80% of window is distracted

// Thresholds relative to CALIBRATED BASELINE (Normalized coordinates 0-1)
const THRESHOLD_YAW_DRIFT = 0.15; // How far nose can move left/right
const THRESHOLD_PITCH_DROP = 0.20; // How far nose can drop (slouching)
const THRESHOLD_MOVEMENT_VARIANCE = 0.005; // Stability threshold for Deep Focus

// --- Asset Configuration ---
const CDN_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm";
const CDN_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

type SessionState = 'INIT' | 'COUNTDOWN' | 'CALIBRATING' | 'ACTIVE' | 'ERROR';

// Helper for Variance Calculation
const calculateVariance = (arr: number[]) => {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
};

const FocusSessionView: React.FC<FocusSessionViewProps> = ({ mode, initialTimeInSeconds, task, onComplete, onCancel }) => {
  // --- UI States ---
  const [sessionState, setSessionState] = useState<SessionState>('INIT');
  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const totalDurationRef = useRef(initialTimeInSeconds);
  
  // Countdown
  const [countdown, setCountdown] = useState(3);

  // AI & Feedback States
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isAiDisabled, setIsAiDisabled] = useState(false); 
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing Engine...');
  const [debugInfo, setDebugInfo] = useState<string>('AI: Idle'); 
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // --- V2 AI Logic Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);

  // 1. Calibration Data (The "Zero Point")
  const calibrationRef = useRef<{
      noseBase: { x: number, y: number } | null;
      shoulderWidthBase: number | null;
  }>({ noseBase: null, shoulderWidthBase: null });

  // 2. Sliding Window Buffers
  const movementHistoryRef = useRef<{ x: number[], y: number[] }>({ x: [], y: [] }); // For MMI (Stability)
  const stateBufferRef = useRef<boolean[]>([]); // true = Focused, false = Distracted

  // 3. Current Real-time State
  const [focusState, setFocusState] = useState<'DEEP_FLOW' | 'FOCUSED' | 'DISTRACTED' | 'ABSENT'>('FOCUSED');
  const [focusScore, setFocusScore] = useState(100); // Visual score 0-100

  // 0. Wake Lock
  useEffect(() => {
      NativeService.Screen.keepAwake();
      return () => { NativeService.Screen.allowSleep(); };
  }, []);

  // 1. Initialization Pipeline
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    const setupPipeline = async () => {
        try {
            // A. Camera
            setLoadingStatus('Accessing Camera...');
            await new Promise(r => setTimeout(r, 500)); 

            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 15 } // Low FPS is fine for desk mode
                },
                audio: false
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            // B. AI Model (PoseLandmarker)
            setLoadingStatus('Loading Neural Network...');
            const vision = await FilesetResolver.forVisionTasks(CDN_WASM_URL);
            
            poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: { 
                    modelAssetPath: CDN_MODEL_URL, 
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numPoses: 1,
                minPoseDetectionConfidence: 0.5,
                minPosePresenceConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            if (isMounted) setSessionState('COUNTDOWN');

        } catch (err: any) {
            console.error("Init Error:", err);
            if (isMounted) {
                if (err.name === 'NotAllowedError') setErrorMessage('Camera access denied.');
                else setErrorMessage('AI Engine Failed to Load.');
                setSessionState('ERROR');
            }
        }
    };

    setupPipeline();

    return () => {
        isMounted = false;
        if (stream) stream.getTracks().forEach(track => track.stop());
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (poseLandmarkerRef.current) poseLandmarkerRef.current.close();
    };
  }, []);

  // 2. Countdown & Calibration Trigger
  useEffect(() => {
    if (sessionState === 'COUNTDOWN') {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    performCalibration(); // <--- SNAPSHOT POSE HERE
                    return 0;
                }
                NativeService.Haptics.impactLight();
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }
  }, [sessionState]);

  // Helper: Perform Calibration
  const performCalibration = () => {
      const landmarker = poseLandmarkerRef.current;
      const video = videoRef.current;
      
      if (landmarker && video && video.readyState >= 2) {
          const result = landmarker.detectForVideo(video, performance.now());
          if (result.landmarks && result.landmarks.length > 0) {
              const pose = result.landmarks[0];
              const nose = pose[0];
              const leftShoulder = pose[11];
              const rightShoulder = pose[12];
              
              // Record Baseline
              calibrationRef.current = {
                  noseBase: { x: nose.x, y: nose.y },
                  shoulderWidthBase: Math.abs(leftShoulder.x - rightShoulder.x)
              };
              console.log("[Calibration] Baseline Set:", calibrationRef.current);
          }
      }
      
      setSessionState('ACTIVE');
      NativeService.Haptics.notificationSuccess();
  };

  // 3. AI Prediction Loop (The Brain)
  useEffect(() => {
      if (sessionState === 'ACTIVE' && !isAiDisabled && !isPaused) {
          const predictWebcam = () => {
              const video = videoRef.current;
              const landmarker = poseLandmarkerRef.current;
              
              if (video && landmarker && !video.paused && !video.ended && isVideoReady) {
                  let startTimeMs = performance.now();
                  if (video.currentTime !== lastVideoTimeRef.current) {
                      lastVideoTimeRef.current = video.currentTime;
                      try {
                          const results = landmarker.detectForVideo(video, startTimeMs);
                          analyzePoseV2(results);
                      } catch (e) {
                          // Frame drop ok
                      }
                  }
              }
              requestRef.current = requestAnimationFrame(predictWebcam);
          };
          requestRef.current = requestAnimationFrame(predictWebcam);
      }
      return () => cancelAnimationFrame(requestRef.current);
  }, [sessionState, isAiDisabled, isPaused, isVideoReady]);

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


  // --- V2 ALGORITHM: Relative + Stability + Buffer ---
  const analyzePoseV2 = (results: any) => {
      // 1. ABSENT DETECTION
      if (!results.landmarks || results.landmarks.length === 0) {
          updateStateBuffer(false); // Frame is "Distracted" (Absent)
          return;
      }

      const pose = results.landmarks[0];
      const nose = pose[0];
      // Note: Pose landmarks: 0=Nose, 11=LeftShoulder, 12=RightShoulder
      
      const calibration = calibrationRef.current;

      // If no calibration (rare edge case), snap it now
      if (!calibration.noseBase) {
          calibrationRef.current = {
              noseBase: { x: nose.x, y: nose.y },
              shoulderWidthBase: Math.abs(pose[11].x - pose[12].x)
          };
          return;
      }

      // 2. RELATIVE DRIFT CALCULATION
      // How far has nose moved from baseline?
      const dx = nose.x - calibration.noseBase.x; // + is Left(screen view), - is Right
      const dy = nose.y - calibration.noseBase.y; // + is Down(slouch), - is Up

      // Check against Lenient Thresholds
      const isPostureBad = 
        Math.abs(dx) > THRESHOLD_YAW_DRIFT || // Moved too far left/right
        dy > THRESHOLD_PITCH_DROP;            // Slouched too much (nose went down)

      // 3. STABILITY CALCULATION (MMI)
      // Push to history
      const history = movementHistoryRef.current;
      history.x.push(nose.x);
      history.y.push(nose.y);
      if (history.x.length > 30) { // Keep last ~2 seconds
          history.x.shift();
          history.y.shift();
      }

      // Calculate Variance (Jitter)
      const varX = calculateVariance(history.x);
      const varY = calculateVariance(history.y);
      const totalVariance = varX + varY;

      const isRestless = totalVariance > THRESHOLD_MOVEMENT_VARIANCE * 5; // Moving a lot
      const isDeepFocus = totalVariance < THRESHOLD_MOVEMENT_VARIANCE; // Statue-like stillness

      // 4. FRAME JUDGEMENT
      // A frame is "Good" if Posture is OK AND they aren't fidgeting like crazy
      const isFrameFocused = !isPostureBad && !isRestless;

      updateStateBuffer(isFrameFocused, isDeepFocus, totalVariance, dx, dy);
  };

  const updateStateBuffer = (isFrameFocused: boolean, isDeepFocusFrame: boolean = false, variance: number = 0, dx: number = 0, dy: number = 0) => {
      const buffer = stateBufferRef.current;
      buffer.push(isFrameFocused);
      if (buffer.length > HISTORY_WINDOW_SIZE) buffer.shift();

      // HYSTERESIS: Count how many "Distracted" frames in window
      const distractedFrames = buffer.filter(b => !b).length;
      const distractedRatio = distractedFrames / buffer.length;

      // Determine Final UI State
      let finalState: 'DEEP_FLOW' | 'FOCUSED' | 'DISTRACTED' = 'FOCUSED';
      
      if (distractedRatio > DISTRACTION_THRESHOLD_PERCENT) {
          finalState = 'DISTRACTED';
          // Visual Score Penalty
          setFocusScore(prev => Math.max(0, prev - 0.5));
      } else {
          // Recovery
          setFocusScore(prev => Math.min(100, prev + 0.2));
          if (isDeepFocusFrame) finalState = 'DEEP_FLOW';
      }

      setFocusState(finalState);

      // Throttled Debug Info
      if (Math.random() < 0.1) { // Update ~10% of frames to save react renders
          setDebugInfo(`D-Rate:${(distractedRatio*100).toFixed(0)}% Var:${(variance*1000).toFixed(2)} X:${dx.toFixed(2)}`);
      }
  };


  // --- Render Handlers ---
  const handleFinish = () => onComplete((totalDurationRef.current - timeLeft) / 60);
  const handleStop = () => onComplete((totalDurationRef.current - timeLeft) / 60);
  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
      if (isAiDisabled) return 'stroke-gray-500 text-gray-500';
      if (focusState === 'DISTRACTED') return 'stroke-red-500 text-red-500';
      if (focusState === 'DEEP_FLOW') return 'stroke-indigo-400 text-indigo-400'; // Deep Focus Color
      return 'stroke-green-400 text-green-400';
  };

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden font-sans">
        
        {/* --- 1. PERSISTENT VIDEO LAYER --- */}
        <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            onLoadedData={() => setIsVideoReady(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 scale-x-[-1] 
                ${sessionState === 'INIT' ? 'opacity-0' : (isAiDisabled ? 'opacity-0' : (showCameraPreview ? 'opacity-100 blur-0' : 'opacity-40'))}
            `}
        />

        {/* --- 2. OVERLAYS --- */}
        
        {/* A. LOADING / ERROR */}
        { (sessionState === 'INIT' || sessionState === 'ERROR') && (
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-white px-8 text-center z-20">
                {sessionState === 'ERROR' ? (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <WifiOff size={48} className="text-red-500 mb-4" />
                        <h2 className="text-xl font-bold mb-2">Init Failed</h2>
                        <p className="text-gray-400 mb-6 text-sm">{errorMessage}</p>
                        <div className="flex gap-4">
                            <button onClick={onCancel} className="px-6 py-3 rounded-full bg-gray-800 font-semibold">Back</button>
                            <button onClick={() => { setIsAiDisabled(true); setSessionState('COUNTDOWN'); }} className="px-6 py-3 rounded-full bg-blue-600 font-semibold">No AI</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-gray-800 border-t-blue-500 rounded-full animate-spin mb-6" />
                        <h2 className="text-lg font-bold">{loadingStatus}</h2>
                        <p className="text-xs text-gray-500 mt-2">Loading Body Pose Model...</p>
                    </div>
                )}
            </div>
        )}

        {/* B. COUNTDOWN */}
        { sessionState === 'COUNTDOWN' && (
             <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                <motion.div 
                    key={countdown}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    className="text-[120px] font-bold text-white font-mono drop-shadow-2xl"
                >
                    {countdown}
                </motion.div>
                <p className="text-white/80 mt-8 font-medium animate-pulse">Sit naturally for calibration...</p>
             </div>
        )}

        {/* C. ACTIVE HUD */}
        { (sessionState === 'ACTIVE') && (
            <div className={`absolute inset-0 z-10 flex flex-col items-center justify-between text-white pointer-events-none transition-opacity duration-300 ${showCameraPreview ? 'opacity-30' : 'opacity-100'}`}>
                 <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />

                 {/* Top Header */}
                 <div className="relative w-full pt-safe-top px-6 mt-4 flex justify-between items-start pointer-events-auto">
                    <div>
                        <h2 className="text-xl font-bold mt-1 shadow-black drop-shadow-md">
                            {mode === TimerMode.POMODORO ? 'Focus Session' : task?.title || 'Session'}
                        </h2>
                        {!isAiDisabled && (
                            <div className="flex flex-col gap-1 mt-2">
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)] ${isVideoReady ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                    <span className={`text-[10px] font-bold tracking-wider uppercase ${isVideoReady ? 'text-green-400' : 'text-yellow-400'}`}>
                                        Desk Mode V2
                                    </span>
                                </div>
                                {/* DEBUGGER */}
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1 opacity-60">
                                        <ScanFace size={10} className="text-white" />
                                        <span className="text-[10px] font-mono text-white">{debugInfo}</span>
                                    </div>
                                    <button onClick={() => setShowCameraPreview(!showCameraPreview)} className="bg-white/20 p-1 rounded hover:bg-white/40 pointer-events-auto">
                                        {showCameraPreview ? <EyeOff size={12} /> : <Eye size={12} />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* V2 Score Ring */}
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
                            {/* Icon inside ring based on state */}
                            <div className="absolute inset-0 flex items-center justify-center text-white">
                                {focusState === 'DEEP_FLOW' ? <Brain size={20} className="text-indigo-400" /> : 
                                 focusState === 'DISTRACTED' ? <AlertTriangle size={20} className="text-red-500" /> :
                                 <User size={20} className="text-green-400" />}
                            </div>
                        </div>
                    )}
                </div>

                {/* Middle: Timer & Alerts */}
                <div className="relative flex flex-col items-center justify-center drop-shadow-2xl">
                    <div className="h-8 mb-4">
                        <AnimatePresence>
                            {!isAiDisabled && focusState === 'DISTRACTED' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-red-500/90 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-red-900/50"
                                >
                                    <AlertTriangle size={14} className="text-white" />
                                    <span className="font-bold text-xs tracking-wide">
                                        STAY FOCUSED
                                    </span>
                                </motion.div>
                            )}
                            {!isAiDisabled && focusState === 'DEEP_FLOW' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-indigo-500/80 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-indigo-900/50"
                                >
                                    <Brain size={14} className="text-white" />
                                    <span className="font-bold text-xs tracking-wide">
                                        FLOW STATE
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
                <div className="relative w-full pb-safe px-10 mb-12 flex items-center justify-around pointer-events-auto">
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
        )}
    </div>
  );
};

export default FocusSessionView;
