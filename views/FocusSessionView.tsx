import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Square, Play, Pause, Brain, AlertTriangle, Activity, WifiOff, ScanFace, Eye, EyeOff, User as UserIcon, Zap, Crown, Coffee, Armchair, FastForward } from 'lucide-react';
import { TimerMode, Task, User, Settings } from '../types';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import { NativeService } from '../services/native';
import { AdBanner } from '../components/AdBanner';

interface FocusSessionViewProps {
  mode: TimerMode;
  initialTimeInSeconds: number;
  settings: Settings;
  task?: Task;
  user: User | null;
  onComplete: (minutesFocused: number) => void;
  onCancel: () => void;
  onUpgradeTrigger: () => void;
}

// --- CONFIGURATION ---
// Battery Optimization: Only run AI every X ms
const DETECTION_INTERVAL_MS = 200; // 5 FPS is enough for posture. Saves battery.

// --- V2 STRATEGY CONFIGURATION (ARCHIVED) ---
const HISTORY_WINDOW_SIZE = 60; // Approx 4-5 seconds at 15fps
const DISTRACTION_THRESHOLD_PERCENT = 0.8; // Trigger alert if 80% of window is distracted

// Thresholds relative to CALIBRATED BASELINE (Normalized coordinates 0-1)
const THRESHOLD_YAW_DRIFT = 0.15; // How far nose can move left/right (FREE)
const THRESHOLD_PITCH_DROP = 0.20; // How far nose can drop (slouching) (PAID)
const THRESHOLD_MOVEMENT_VARIANCE = 0.005; // Stability threshold for Deep Focus

// --- Asset Configuration ---
const CDN_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm";
const CDN_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

type SessionState = 'INIT' | 'COUNTDOWN' | 'CALIBRATING' | 'ACTIVE' | 'ERROR';
type Phase = 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK';

// Helper for Variance Calculation
const calculateVariance = (arr: number[]) => {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
};

// Helper for Angle Calculation (in Degrees)
const calculateAngle = (p1: {x: number, y: number}, p2: {x: number, y: number}) => {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
};

// Helper for Distance Calculation
const calculateDistance = (p1: {x: number, y: number}, p2: {x: number, y: number}) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

const FocusSessionView: React.FC<FocusSessionViewProps> = ({ mode, initialTimeInSeconds, settings, task, user, onComplete, onCancel, onUpgradeTrigger }) => {
  // --- UI States ---
  const [sessionState, setSessionState] = useState<SessionState>('INIT');
  const [phase, setPhase] = useState<Phase>('WORK');
  const [roundsCompleted, setRoundsCompleted] = useState(0);

  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
  const [isPaused, setIsPaused] = useState(false);
  
  // Stats Accumulator (Since we don't exit between rounds)
  const totalFocusedSecondsRef = useRef(0);
  
  // Countdown
  const [countdown, setCountdown] = useState(3);
  
  const isPremium = user?.isPremium || false;

  // AI & Feedback States
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isAiDisabled, setIsAiDisabled] = useState(false); 
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing Engine...');
  const [debugInfo, setDebugInfo] = useState<string>('AI: Idle'); 
  const [showCameraPreview, setShowCameraPreview] = useState(true); // Default to true for debugging
  const [isVideoReady, setIsVideoReady] = useState(false);

  // --- V2 AI Logic Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // NEW: Canvas for visualization
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);
  const drawingUtilsRef = useRef<DrawingUtils | null>(null); // NEW: Drawing Utils

  // FPS & Throttling Refs
  const lastFrameTimeRef = useRef<number>(0);
  const lastPredictionTimeRef = useRef<number>(0); // For throttling
  const fpsRef = useRef<number>(0);

  // V4 Smoothing Refs
  const smoothYawRef = useRef<number>(0); // Stores the smoothed Yaw value

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
                    frameRate: { ideal: 30 } // Keep input smooth, we throttle AI later
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

            // C. Initialize Drawing Utils
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    drawingUtilsRef.current = new DrawingUtils(ctx);
                }
            }

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
      // CRITICAL LOGIC: ONLY RUN AI IF WE ARE IN 'ACTIVE' STATE AND 'WORK' PHASE
      // When in Break, we pause AI to save battery and relax user.
      if (sessionState === 'ACTIVE' && phase === 'WORK' && !isAiDisabled && !isPaused) {
          const predictWebcam = () => {
              const video = videoRef.current;
              const landmarker = poseLandmarkerRef.current;
              const canvas = canvasRef.current;
              
              if (video && landmarker && !video.paused && !video.ended && isVideoReady) {
                  const now = performance.now();
                  
                  // THROTTLE: Only predict every X ms
                  if (now - lastPredictionTimeRef.current >= DETECTION_INTERVAL_MS) {
                      
                      // Calculate Real FPS
                      const delta = now - lastFrameTimeRef.current;
                      if (delta > 0) fpsRef.current = 1000 / delta; 
                      lastFrameTimeRef.current = now;
                      lastPredictionTimeRef.current = now;

                      if (video.currentTime !== lastVideoTimeRef.current) {
                          lastVideoTimeRef.current = video.currentTime;
                          try {
                              const results = landmarker.detectForVideo(video, now);
                              
                              // V4 Logic
                              analyzePose_Debug_Visualization(results, video, canvas);

                          } catch (e) {
                              console.error(e);
                          }
                      }
                  }
              }
              requestRef.current = requestAnimationFrame(predictWebcam);
          };
          requestRef.current = requestAnimationFrame(predictWebcam);
      }
      return () => cancelAnimationFrame(requestRef.current);
  }, [sessionState, isAiDisabled, isPaused, isVideoReady, phase]); // Re-run when phase changes

  // 4. Timer & Cycle Logic
  useEffect(() => {
      if (sessionState !== 'ACTIVE' || isPaused) return;

      const interval = setInterval(() => {
          setTimeLeft((prev) => {
              // RECORD FOCUS TIME (Only if working)
              if (phase === 'WORK') {
                  totalFocusedSecondsRef.current += 1;
              }

              // --- TIMER FINISHED ---
              if (prev <= 1) {
                  
                  // A. IF WE WERE WORKING -> GO TO BREAK
                  if (phase === 'WORK') {
                      const newRounds = roundsCompleted + 1;
                      setRoundsCompleted(newRounds);
                      NativeService.Haptics.notificationSuccess();

                      // Cycle Check
                      if (mode === TimerMode.POMODORO && newRounds < settings.pomodorosPerRound) {
                          // Short Break
                          setPhase('SHORT_BREAK');
                          return settings.shortBreakTime * 60;
                      } else if (mode === TimerMode.POMODORO && newRounds >= settings.pomodorosPerRound) {
                          // Long Break
                          setPhase('LONG_BREAK');
                          return settings.longBreakTime * 60;
                      } else {
                          // Stopwatch / Custom / Single Mode -> Just finish
                          clearInterval(interval);
                          handleFinish();
                          return 0;
                      }
                  } 
                  
                  // B. IF WE WERE ON BREAK -> BACK TO WORK (or finish if long break ends?)
                  else if (phase === 'SHORT_BREAK') {
                      NativeService.Haptics.notificationSuccess();
                      setPhase('WORK');
                      return settings.workTime * 60;
                  }

                  else if (phase === 'LONG_BREAK') {
                      // After long break, usually we stop or restart. Let's stop for now.
                      clearInterval(interval);
                      handleFinish();
                      return 0;
                  }

                  return 0;
              }
              return prev - 1;
          });
      }, 1000);
      return () => clearInterval(interval);
  }, [sessionState, isPaused, phase, roundsCompleted, settings, mode]);

  // Handle manual skip of break
  const skipBreak = () => {
      if (phase === 'SHORT_BREAK') {
          setPhase('WORK');
          setTimeLeft(settings.workTime * 60);
          NativeService.Haptics.impactMedium();
      } else if (phase === 'LONG_BREAK') {
          handleFinish();
      }
  };


  // ==================================================================================
  // 🔬 V3/V4 DEBUG MODE - Visualization
  // ==================================================================================
  const analyzePose_Debug_Visualization = (results: any, video: HTMLVideoElement, canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Sync Canvas Size to Video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 2. Draw Performance Metrics (Top-Left)
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(10, 10, 240, 150);
      ctx.fillStyle = "#00FF00";
      ctx.font = "14px monospace";
      ctx.fillText(`Mode: Power Saver (5 FPS)`, 20, 30);
      ctx.fillText(`FPS: ${fpsRef.current.toFixed(1)}`, 20, 50);
      
      const landmarks = results.landmarks?.[0];

      if (landmarks) {
          const nose = landmarks[0];
          const leftEar = landmarks[7];
          const rightEar = landmarks[8];
          
          const earMidX = (leftEar.x + rightEar.x) / 2;
          const earMidY = (leftEar.y + rightEar.y) / 2;
          const headWidth = Math.abs(leftEar.x - rightEar.x);
          const rawYawRatio = (nose.x - earMidX) / headWidth;

          smoothYawRef.current = (smoothYawRef.current * 0.7) + (rawYawRatio * 0.3);
          const currentYaw = smoothYawRef.current;
          const approxDegrees = currentYaw * 90;

          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(`Points: ${landmarks.length}`, 20, 70);
          
          const isFacingFront = Math.abs(approxDegrees) < 25; 
          ctx.fillStyle = isFacingFront ? "#00FF00" : "#FF0000";
          ctx.fillText(`Head Yaw: ${approxDegrees.toFixed(1)}°`, 20, 90);
          ctx.fillText(isFacingFront ? "FACING: FRONT" : "FACING: SIDE", 20, 110);
          
          if (drawingUtilsRef.current) {
              const drawingUtils = drawingUtilsRef.current;
              
              const boxW = headWidth * 0.5 * canvas.width;
              const boxH = headWidth * 1.5 * canvas.height;
              const boxX = (earMidX * canvas.width) - (boxW / 2);
              const boxY = (earMidY * canvas.height) - (boxH / 2); // Approximation
              
              ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";
              ctx.lineWidth = 2;
              ctx.strokeRect(boxX, boxY, boxW, boxH);

              ctx.beginPath();
              ctx.moveTo(earMidX * canvas.width, (leftEar.y + rightEar.y)/2 * canvas.height);
              ctx.lineTo(nose.x * canvas.width, nose.y * canvas.height);
              ctx.strokeStyle = isFacingFront ? "#00FF00" : "#FF0000";
              ctx.lineWidth = 4;
              ctx.stroke();

              [nose, leftEar, rightEar].forEach(pt => {
                  ctx.beginPath();
                  ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 6, 0, 2 * Math.PI);
                  ctx.fillStyle = "white";
                  ctx.fill();
              });
              
              ctx.beginPath();
              ctx.moveTo(leftEar.x * canvas.width, leftEar.y * canvas.height);
              ctx.lineTo(rightEar.x * canvas.width, rightEar.y * canvas.height);
              ctx.strokeStyle = "yellow";
              ctx.lineWidth = 2;
              ctx.stroke();
          }
      } else {
          ctx.fillStyle = "red";
          ctx.fillText("NO POSE DETECTED", 20, 70);
      }
  };


  const handleFinish = () => {
      // Calculate total minutes from our accumulator
      const minutes = totalFocusedSecondsRef.current / 60;
      onComplete(minutes);
  };
  
  const handleStop = () => handleFinish();

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
      if (phase !== 'WORK') return 'stroke-blue-400 text-blue-400';
      if (isAiDisabled) return 'stroke-gray-500 text-gray-500';
      if (focusState === 'DISTRACTED') return 'stroke-red-500 text-red-500';
      if (focusState === 'DEEP_FLOW') return 'stroke-indigo-400 text-indigo-400';
      return 'stroke-green-400 text-green-400';
  };

  // UI HELPERS
  const isBreak = phase === 'SHORT_BREAK' || phase === 'LONG_BREAK';

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden font-sans">
        
        {/* --- 1. VIDEO LAYER (HIDDEN DURING BREAK) --- */}
        <div className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${isBreak ? 'opacity-0' : 'opacity-100'}`}>
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                onLoadedData={() => setIsVideoReady(true)}
                className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] 
                    ${sessionState === 'INIT' ? 'opacity-0' : (isAiDisabled ? 'opacity-0' : (showCameraPreview ? 'opacity-100 blur-0' : 'opacity-40'))}
                `}
            />
            <canvas 
                ref={canvasRef}
                className={`absolute inset-0 w-full h-full object-cover pointer-events-none scale-x-[-1]`}
            />
        </div>

        {/* --- 2. BREAK LAYER (VISIBLE DURING BREAK) --- */}
        {isBreak && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-black flex items-center justify-center z-0">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>
            </div>
        )}

        {/* --- 3. OVERLAYS --- */}
        
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
            <div className={`absolute inset-0 z-10 flex flex-col items-center justify-between text-white pointer-events-none transition-opacity duration-300 ${!isBreak && showCameraPreview ? 'opacity-30' : 'opacity-100'}`}>
                 <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />

                 {/* Top Header */}
                 <div className="relative w-full pt-safe-top px-6 mt-4 flex justify-between items-start pointer-events-auto">
                    <div>
                        <h2 className="text-xl font-bold mt-1 shadow-black drop-shadow-md flex items-center gap-2">
                            {isBreak ? (
                                <span className="flex items-center gap-2 text-blue-300">
                                    {phase === 'SHORT_BREAK' ? <Coffee size={20}/> : <Armchair size={20}/>}
                                    {phase === 'SHORT_BREAK' ? 'Short Break' : 'Long Break'}
                                </span>
                            ) : (
                                mode === TimerMode.POMODORO ? 'Focus Session' : task?.title || 'Session'
                            )}
                        </h2>
                        {(!isAiDisabled && !isBreak) && (
                            <div className="flex flex-col gap-1 mt-2">
                                {/* Only show AI status during WORK phase */}
                                <div className="flex items-center gap-2">
                                    {!isPremium ? (
                                        <div className="flex gap-2">
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 text-green-400 backdrop-blur-md rounded-md border border-green-500/50">
                                                <Zap size={10} fill="currentColor" />
                                                <span className="text-[10px] font-bold uppercase">Focus Guard</span>
                                            </div>
                                            <button onClick={onUpgradeTrigger} className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/20 text-yellow-400 backdrop-blur-md rounded-md border border-yellow-500/30">
                                                <Crown size={10} fill="currentColor"/>
                                                <span className="text-[10px] font-bold uppercase">Pro: Posture</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 px-2 py-1 bg-gradient-to-r from-green-500/30 to-blue-500/30 text-white backdrop-blur-md rounded-md border border-white/20">
                                            <ScanFace size={10} />
                                            <span className="text-[10px] font-bold uppercase">Full Body AI</span>
                                        </div>
                                    )}
                                </div>
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
                        {isBreak && (
                             <p className="text-sm text-gray-300 mt-1">Relax your eyes. AI paused.</p>
                        )}
                    </div>

                    {/* V2 Score Ring */}
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
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                            {isBreak ? <Coffee size={20} className="text-blue-400" /> : 
                             focusState === 'DEEP_FLOW' ? <Brain size={20} className="text-indigo-400" /> : 
                             focusState === 'DISTRACTED' ? <AlertTriangle size={20} className="text-red-500" /> :
                             <UserIcon size={20} className="text-green-400" />}
                        </div>
                    </div>
                </div>

                {/* Middle: Timer & Alerts */}
                <div className="relative flex flex-col items-center justify-center drop-shadow-2xl">
                    <div className="h-8 mb-4">
                        <AnimatePresence>
                            {(!isAiDisabled && !isBreak) && focusState === 'DISTRACTED' && (
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
                            {(!isAiDisabled && !isBreak) && focusState === 'DEEP_FLOW' && (
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

                    <div className="relative text-center">
                        <span className="text-8xl font-mono font-light tracking-tighter tabular-nums text-white">
                            {formatTime(timeLeft)}
                        </span>
                        {isPaused ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-black/50 backdrop-blur-sm px-4 py-1 rounded text-sm font-bold tracking-widest uppercase border border-white/20">
                                    Paused
                                </div>
                            </div>
                        ) : (
                             mode === TimerMode.POMODORO && (
                                <div className="flex justify-center gap-1 mt-2">
                                    {[...Array(settings.pomodorosPerRound)].map((_, i) => (
                                        <div key={i} className={`w-2 h-2 rounded-full ${i < roundsCompleted ? 'bg-green-500' : (i === roundsCompleted && !isBreak) ? 'bg-white animate-pulse' : 'bg-gray-600'}`} />
                                    ))}
                                </div>
                             )
                        )}
                    </div>
                </div>

                {/* Footer Controls + Ad Banner */}
                <div className="relative w-full pb-safe mb-8 flex flex-col justify-end pointer-events-auto">
                    
                    {/* Controls */}
                    <div className="flex items-center justify-around mb-8 px-10">
                        <button onClick={onCancel} className="w-16 h-16 rounded-full bg-gray-800/60 backdrop-blur-md flex items-center justify-center text-white/70 hover:bg-gray-700 transition-colors">
                            <X size={28} />
                        </button>

                        <button 
                            onClick={() => { setIsPaused(!isPaused); NativeService.Haptics.impactMedium(); }}
                            className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
                        >
                            {isPaused ? <Play size={32} fill="black" className="ml-1" /> : <Pause size={32} fill="black" />}
                        </button>

                        {isBreak ? (
                             <button onClick={skipBreak} className="w-16 h-16 rounded-full bg-blue-500/80 backdrop-blur-md flex items-center justify-center text-white hover:bg-blue-600 transition-colors">
                                <FastForward size={24} fill="currentColor" />
                            </button>
                        ) : (
                            <button onClick={handleStop} className="w-16 h-16 rounded-full bg-red-500/80 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-600 transition-colors">
                                <Square size={24} fill="currentColor" />
                            </button>
                        )}
                    </div>

                    {/* Ad Banner (Only for Free Users) */}
                    {!isPremium && !isBreak && (
                        <div className="relative z-20">
                            <AdBanner onRemoveAds={onUpgradeTrigger} />
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default FocusSessionView;
