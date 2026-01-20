import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Square, Play, Pause, Brain, AlertTriangle, Activity, WifiOff, ScanFace, Eye, EyeOff, User as UserIcon, Zap, Crown, Coffee, Armchair, FastForward, CheckCircle2, TrendingUp, Sparkles, Move, Clock } from 'lucide-react';
import { TimerMode, Task, User, Settings } from '../types';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import { NativeService } from '../services/native';
import { AdBanner } from '../components/AdBanner';
import { translations } from '../utils/translations';

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
const DETECTION_INTERVAL_MS = 200; 

// --- ASSETS ---
const CDN_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm";
const CDN_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

type SessionState = 'INIT' | 'COUNTDOWN' | 'CALIBRATING' | 'ACTIVE' | 'SUMMARY' | 'ERROR';
type Phase = 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK';

// [TODO: AI_CONNECTION] Data structures for connecting real AI metrics later
interface TimelineSegment {
    score: number;      // 0-100
    duration: number;   // minutes (formatted, e.g. 5 or 2.5)
    isPartial: boolean; // true if < 5 mins
}

interface SessionSegmentLog {
    id: number;
    startTime: string;
    durationMinutes: number;
    avgFocusScore: number; 
    
    // The chart data breakdown
    timeline: TimelineSegment[];
    
    // [TODO: AI_CONNECTION] Real metrics placeholders
    postureQuality: 'Good' | 'Slouching' | 'Unknown'; 
    eyeFatigueLevel: 'Low' | 'Moderate' | 'High';
    
    // Raw counters
    postureAlerts: number; 
    distractionCount: number; 
}

// Helper to format minutes into "1h 30m" or "45m"
const formatMinutes = (m: number) => {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
};

const FocusSessionView: React.FC<FocusSessionViewProps> = ({ mode, initialTimeInSeconds, settings, task, user, onComplete, onCancel, onUpgradeTrigger }) => {
  const t = translations[settings.language].session;

  // --- UI States ---
  const [sessionState, setSessionState] = useState<SessionState>('INIT');
  const [phase, setPhase] = useState<Phase>('WORK');
  const [roundsCompleted, setRoundsCompleted] = useState(0);

  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
  const [isPaused, setIsPaused] = useState(false);
  
  // Stats Accumulator
  const totalFocusedSecondsRef = useRef(0);
  const sessionHistoryRef = useRef<SessionSegmentLog[]>([]);
  
  // [TODO: AI_CONNECTION] Live accumulator for the current running session
  const currentSegmentMetrics = useRef({
      distractions: 0,
      postureIssues: 0,
      fatigueEvents: 0,
  });

  // Countdown
  const [countdown, setCountdown] = useState(3);
  
  const isPremium = user?.isPremium || false;

  // AI & Feedback States
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isAiDisabled, setIsAiDisabled] = useState(false); 
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing Engine...');
  const [debugInfo, setDebugInfo] = useState<string>('AI: Idle'); 
  const [showCameraPreview, setShowCameraPreview] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // AI Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); 
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);
  const drawingUtilsRef = useRef<DrawingUtils | null>(null); 

  // FPS & Smoothing
  const lastFrameTimeRef = useRef<number>(0);
  const lastPredictionTimeRef = useRef<number>(0);
  const fpsRef = useRef<number>(0);
  const smoothYawRef = useRef<number>(0); 
  const calibrationRef = useRef<{
      noseBase: { x: number, y: number } | null;
      shoulderWidthBase: number | null;
  }>({ noseBase: null, shoulderWidthBase: null });

  // Real-time State
  const [focusState, setFocusState] = useState<'DEEP_FLOW' | 'FOCUSED' | 'DISTRACTED' | 'ABSENT'>('FOCUSED');
  const [focusScore, setFocusScore] = useState(100); 

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
            setLoadingStatus('Accessing Camera...');
            await new Promise(r => setTimeout(r, 500)); 

            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
                audio: false
            });

            if (videoRef.current) videoRef.current.srcObject = stream;

            setLoadingStatus('Loading Neural Network...');
            const vision = await FilesetResolver.forVisionTasks(CDN_WASM_URL);
            
            poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: { modelAssetPath: CDN_MODEL_URL, delegate: "GPU" },
                runningMode: "VIDEO",
                numPoses: 1,
                minPoseDetectionConfidence: 0.5,
                minPosePresenceConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) drawingUtilsRef.current = new DrawingUtils(ctx);
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

  // 2. Countdown
  useEffect(() => {
    if (sessionState === 'COUNTDOWN') {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    performCalibration(); 
                    return 0;
                }
                NativeService.Haptics.impactLight();
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }
  }, [sessionState]);

  const performCalibration = () => {
      const landmarker = poseLandmarkerRef.current;
      const video = videoRef.current;
      
      if (landmarker && video && video.readyState >= 2) {
          const result = landmarker.detectForVideo(video, performance.now());
          if (result.landmarks && result.landmarks.length > 0) {
              const pose = result.landmarks[0];
              calibrationRef.current = {
                  noseBase: { x: pose[0].x, y: pose[0].y },
                  shoulderWidthBase: Math.abs(pose[11].x - pose[12].x)
              };
          }
      }
      setSessionState('ACTIVE');
      NativeService.Haptics.notificationSuccess();
  };

  // 3. AI Loop
  useEffect(() => {
      if (sessionState === 'ACTIVE' && phase === 'WORK' && !isAiDisabled && !isPaused) {
          const predictWebcam = () => {
              const video = videoRef.current;
              const landmarker = poseLandmarkerRef.current;
              const canvas = canvasRef.current;
              
              if (video && landmarker && !video.paused && !video.ended && isVideoReady) {
                  const now = performance.now();
                  if (now - lastPredictionTimeRef.current >= DETECTION_INTERVAL_MS) {
                      const delta = now - lastFrameTimeRef.current;
                      if (delta > 0) fpsRef.current = 1000 / delta; 
                      lastFrameTimeRef.current = now;
                      lastPredictionTimeRef.current = now;

                      if (video.currentTime !== lastVideoTimeRef.current) {
                          lastVideoTimeRef.current = video.currentTime;
                          try {
                              const results = landmarker.detectForVideo(video, now);
                              analyzePose_Debug_Visualization(results, video, canvas);
                          } catch (e) { console.error(e); }
                      }
                  }
              }
              requestRef.current = requestAnimationFrame(predictWebcam);
          };
          requestRef.current = requestAnimationFrame(predictWebcam);
      }
      return () => cancelAnimationFrame(requestRef.current);
  }, [sessionState, isAiDisabled, isPaused, isVideoReady, phase]);

  // --- LOGIC: Record Stats (SIMPLIFIED ALGORITHM) ---
  const recordCycleStats = (durationMinutes: number) => {
      // 1. Convert to total seconds (Integer) to avoid floating point drift
      const totalSeconds = Math.floor(durationMinutes * 60);
      
      const timelineSegments: TimelineSegment[] = [];
      let secondsProcessed = 0;
      
      // 2. Simplest Algorithm: Slice into 5-minute (300s) chunks
      while (secondsProcessed < totalSeconds) {
          const secondsLeft = totalSeconds - secondsProcessed;
          const chunkSeconds = Math.min(300, secondsLeft); // Max 5 mins
          
          // Calculate formatted minutes for this chunk
          // e.g. 300s -> 5, 56s -> 0.9
          let chunkMinutes = Number((chunkSeconds / 60).toFixed(1));
          if (chunkMinutes === 0 && chunkSeconds > 0) chunkMinutes = 0.1; // Min display
          
          // Mock score variation
          const variance = Math.floor(Math.random() * 8) - 4;
          const segScore = Math.max(0, Math.min(100, focusScore + variance));

          timelineSegments.push({
               score: segScore,
               duration: chunkMinutes,
               isPartial: chunkSeconds < 300
          });
          
          secondsProcessed += chunkSeconds;
      }

      // 3. Final total formatted for log
      const formattedTotalMinutes = Number((totalSeconds / 60).toFixed(1));

      const log: SessionSegmentLog = {
          id: Date.now(),
          startTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          durationMinutes: formattedTotalMinutes,
          avgFocusScore: focusScore, 
          timeline: timelineSegments,
          
          postureAlerts: currentSegmentMetrics.current.postureIssues,
          distractionCount: currentSegmentMetrics.current.distractions,
          
          postureQuality: currentSegmentMetrics.current.postureIssues > 2 ? 'Slouching' : 'Good',
          eyeFatigueLevel: 'Low'
      };

      sessionHistoryRef.current.push(log);
      
      // Reset metrics
      currentSegmentMetrics.current = {
          distractions: 0,
          postureIssues: 0,
          fatigueEvents: 0,
      };
  };

  // 4. Timer Logic
  useEffect(() => {
      if (sessionState !== 'ACTIVE' || isPaused) return;

      const interval = setInterval(() => {
          setTimeLeft((prev) => {
              if (phase === 'WORK') {
                  totalFocusedSecondsRef.current += 1;
              }

              // STOPWATCH: Count UP
              if (mode === TimerMode.STOPWATCH) {
                  return prev + 1;
              }

              // COUNTDOWN: Count DOWN
              if (prev <= 1) {
                  // Timer Finished
                  if (phase === 'WORK') {
                      recordCycleStats(settings.workTime); // Use config time for full sessions

                      const newRounds = roundsCompleted + 1;
                      setRoundsCompleted(newRounds);
                      NativeService.Haptics.notificationSuccess();

                      if (mode === TimerMode.POMODORO && newRounds < settings.pomodorosPerRound) {
                          setPhase('SHORT_BREAK');
                          return settings.shortBreakTime * 60;
                      } else if (mode === TimerMode.POMODORO && newRounds >= settings.pomodorosPerRound) {
                          setPhase('LONG_BREAK');
                          return settings.longBreakTime * 60;
                      } else {
                          clearInterval(interval);
                          handleShowSummary();
                          return 0;
                      }
                  } 
                  else if (phase === 'SHORT_BREAK') {
                      NativeService.Haptics.notificationSuccess();
                      setPhase('WORK');
                      return settings.workTime * 60;
                  }
                  else if (phase === 'LONG_BREAK') {
                      clearInterval(interval);
                      handleShowSummary(); 
                      return 0;
                  }
                  return 0;
              }
              return prev - 1;
          });
      }, 1000);
      return () => clearInterval(interval);
  }, [sessionState, isPaused, phase, roundsCompleted, settings, mode]);

  const handleShowSummary = () => {
      // If Stopwatch mode (manual stop), record actual elapsed time
      if (mode === TimerMode.STOPWATCH) {
          const elapsedMinutes = totalFocusedSecondsRef.current / 60;
          if (elapsedMinutes > 0.05) { // Only record if > 3 seconds
              recordCycleStats(elapsedMinutes);
          }
      }

      setSessionState('SUMMARY');
      NativeService.Haptics.notificationSuccess();
  };

  const handleFinish = () => {
      const minutes = totalFocusedSecondsRef.current / 60;
      onComplete(Number(minutes.toFixed(1)));
  };

  const skipBreak = () => {
      if (phase === 'SHORT_BREAK') {
          setPhase('WORK');
          setTimeLeft(settings.workTime * 60);
          NativeService.Haptics.impactMedium();
      } else if (phase === 'LONG_BREAK') {
          handleShowSummary();
      }
  };

  // --- Visualization Logic ---
  const analyzePose_Debug_Visualization = (results: any, video: HTMLVideoElement, canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw FPS
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

          // [TODO: AI_CONNECTION] Increment distraction counter if looking away
          // if (Math.abs(approxDegrees) > 40) currentSegmentMetrics.current.distractions++;

          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(`Points: ${landmarks.length}`, 20, 70);
          
          const isFacingFront = Math.abs(approxDegrees) < 25; 
          ctx.fillStyle = isFacingFront ? "#00FF00" : "#FF0000";
          ctx.fillText(`Head Yaw: ${approxDegrees.toFixed(1)}°`, 20, 90);
          ctx.fillText(isFacingFront ? "FACING: FRONT" : "FACING: SIDE", 20, 110);
          
          if (drawingUtilsRef.current) {
              const boxW = headWidth * 0.5 * canvas.width;
              const boxH = headWidth * 1.5 * canvas.height;
              const boxX = (earMidX * canvas.width) - (boxW / 2);
              const boxY = (earMidY * canvas.height) - (boxH / 2);
              
              ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";
              ctx.lineWidth = 2;
              ctx.strokeRect(boxX, boxY, boxW, boxH);

              ctx.beginPath();
              ctx.moveTo(earMidX * canvas.width, earMidY * canvas.height);
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

  const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      
      // Show Hours if > 0
      if (h > 0) {
          return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
      if (phase !== 'WORK') return 'stroke-blue-400 text-blue-400';
      if (isAiDisabled) return 'stroke-gray-500 text-gray-500';
      if (focusState === 'DISTRACTED') return 'stroke-red-500 text-red-500';
      if (focusState === 'DEEP_FLOW') return 'stroke-indigo-400 text-indigo-400';
      return 'stroke-green-400 text-green-400';
  };

  const isBreak = phase === 'SHORT_BREAK' || phase === 'LONG_BREAK';

  // Helper to get stats for the break screen
  const getLastSessionStats = () => {
      const history = sessionHistoryRef.current;
      if (history.length === 0) return null;
      if (phase === 'LONG_BREAK') {
           const totalDuration = history.reduce((acc, curr) => acc + curr.durationMinutes, 0);
           const avgScore = history.reduce((acc, curr) => acc + curr.avgFocusScore, 0) / history.length;
           return { label: t.focusTime, duration: totalDuration, score: Math.round(avgScore) };
      }
      const last = history[history.length - 1];
      return { label: t.cycleLog, duration: last.durationMinutes, score: Math.round(last.avgFocusScore) };
  };

  const breakStats = isBreak ? getLastSessionStats() : null;
  const fullTimeline = sessionHistoryRef.current.flatMap(s => s.timeline);

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden font-sans">
        
        {/* --- 1. VIDEO LAYER --- */}
        <div className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${isBreak || sessionState === 'SUMMARY' ? 'opacity-0' : 'opacity-100'}`}>
            <video 
                ref={videoRef} 
                autoPlay playsInline muted 
                onLoadedData={() => setIsVideoReady(true)}
                className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] 
                    ${sessionState === 'INIT' ? 'opacity-0' : (isAiDisabled ? 'opacity-0' : (showCameraPreview ? 'opacity-100 blur-0' : 'opacity-40'))}
                `}
            />
            <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full object-cover pointer-events-none scale-x-[-1]`} />
        </div>

        {/* --- 2. BREAK LAYER --- */}
        <AnimatePresence>
            {isBreak && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gradient-to-br from-blue-900 to-black flex flex-col items-center justify-center z-40"
                >
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    
                    <div className="z-20 text-center px-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-6 ring-4 ring-blue-500/10">
                            {phase === 'SHORT_BREAK' ? <Coffee size={32} className="text-blue-300"/> : <Armchair size={32} className="text-emerald-300"/>}
                        </div>
                        
                        <h2 className="text-3xl font-bold text-white mb-2">
                            {phase === 'SHORT_BREAK' ? t.recharge : t.rest}
                        </h2>
                        <p className="text-blue-200/80 mb-8">
                            {t.breathe}
                        </p>

                        {/* Session Stats Card */}
                        {breakStats && (
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 grid grid-cols-2 gap-8 mb-8 border border-white/5">
                                <div className="text-center border-r border-white/10">
                                    <div className="text-2xl font-bold text-white mb-1">
                                        {formatMinutes(breakStats.duration)}
                                    </div>
                                    <div className="text-xs text-blue-200 uppercase tracking-wider">{breakStats.label}</div>
                                </div>
                                <div className="text-center">
                                    <div className={`text-2xl font-bold mb-1 ${breakStats.score > 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                                        {breakStats.score}%
                                    </div>
                                    <div className="text-xs text-blue-200 uppercase tracking-wider">{t.avgFocus}</div>
                                </div>
                                <div className="col-span-2 pt-4 border-t border-white/10 flex justify-between text-xs text-gray-400">
                                    <span className="flex items-center gap-1"><Move size={12}/> {t.posture}: Good</span>
                                    <span className="flex items-center gap-1"><Eye size={12}/> Eyes: Rested</span>
                                </div>
                            </div>
                        )}
                        
                        <div className="text-6xl font-mono font-light text-white mb-8">
                            {formatTime(timeLeft)}
                        </div>

                        <button onClick={skipBreak} className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white font-semibold transition-colors flex items-center gap-2 mx-auto">
                            <FastForward size={18} />
                            {t.skipBreak}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- 3. SUMMARY / CELEBRATION LAYER --- */}
        <AnimatePresence>
            {sessionState === 'SUMMARY' && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="absolute inset-0 bg-[#f2f2f7] z-50 flex flex-col pt-safe-top pb-safe overflow-y-auto no-scrollbar"
                >
                    {/* Confetti */}
                    <div className="fixed inset-0 pointer-events-none overflow-hidden">
                        {[...Array(20)].map((_, i) => (
                             <motion.div 
                                key={i}
                                initial={{ y: -50, x: Math.random() * window.innerWidth, rotate: 0 }}
                                animate={{ y: window.innerHeight + 50, rotate: 360 }}
                                transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, ease: "linear", delay: Math.random() * 2 }}
                                className="absolute w-3 h-3 bg-red-500 rounded-sm"
                                style={{ backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9F43'][i % 4] }}
                             />
                        ))}
                    </div>

                    <div className="px-6 pt-12 text-center relative z-10">
                        <motion.div 
                            initial={{ scale: 0 }} animate={{ scale: 1 }} 
                            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-200"
                        >
                            <Sparkles size={48} className="text-green-600" />
                        </motion.div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.complete}</h1>
                        <p className="text-gray-500">{t.focusedFor} <span className="text-green-600 font-bold">{
                            (() => {
                                const m = totalFocusedSecondsRef.current / 60;
                                return formatMinutes(Number(m.toFixed(1)));
                            })()
                        }</span>.</p>
                    </div>

                    <div className="px-6 mt-8 space-y-4 pb-20 relative z-10">
                        {/* 1. Main Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-2 mb-2 text-gray-400">
                                    <Brain size={16} /> <span className="text-xs font-bold uppercase">{t.avgFocus}</span>
                                </div>
                                <div className="text-3xl font-bold text-gray-900">
                                    {Math.round(sessionHistoryRef.current.reduce((a, b) => a + b.avgFocusScore, 0) / (sessionHistoryRef.current.length || 1))}%
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-2 mb-2 text-gray-400">
                                    <Move size={16} /> <span className="text-xs font-bold uppercase">{t.posture}</span>
                                </div>
                                <div className="text-3xl font-bold text-gray-900">Good</div>
                                <div className="text-xs text-green-500 font-medium mt-1">Stable</div>
                            </div>
                        </div>

                        {/* 2. Timeline Chart */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-800">{t.timeline}</h3>
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">5 min intervals</span>
                            </div>
                            
                            {fullTimeline.length === 0 ? (
                                <div className="h-32 flex items-center justify-center text-gray-400 text-sm italic">
                                    No timeline data available.
                                </div>
                            ) : (
                                <div className="h-32 flex items-end justify-start gap-1 overflow-x-auto no-scrollbar pb-2">
                                    {fullTimeline.map((seg, i) => (
                                        <div key={i} className="flex-shrink-0 w-8 flex flex-col justify-end group relative h-full">
                                            {/* Tooltip */}
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                                {seg.score}% ({formatMinutes(seg.duration)})
                                            </div>
                                            
                                            {/* Bar */}
                                            <motion.div 
                                                initial={{ height: 0 }} animate={{ height: `${seg.score}%` }} transition={{ delay: i * 0.05 }}
                                                className={`w-full rounded-t-md relative overflow-hidden
                                                    ${seg.score > 80 ? 'bg-green-400' : seg.score > 60 ? 'bg-yellow-400' : 'bg-red-400'}
                                                    ${seg.isPartial ? 'opacity-50' : ''}
                                                `}
                                            >
                                                {/* Dashed overlay for partial blocks */}
                                                {seg.isPartial && (
                                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20" />
                                                )}
                                            </motion.div>
                                            
                                            {/* Partial Marker */}
                                            {seg.isPartial && (
                                                <div className="absolute -bottom-4 w-full text-center text-[8px] text-gray-400 font-bold">
                                                    {seg.duration}m
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="border-t border-gray-100 mt-0 w-full" />
                        </div>
                        
                        {/* 3. Session Log List */}
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                             <div className="px-5 py-4 border-b border-gray-50 flex justify-between">
                                 <h3 className="font-bold text-gray-800">{t.cycleLog}</h3>
                                 <span className="text-xs text-gray-400">{sessionHistoryRef.current.length} Cycles</span>
                             </div>
                             <div>
                                 {sessionHistoryRef.current.length === 0 ? (
                                     <div className="p-4 text-center text-sm text-gray-400">No data recorded.</div>
                                 ) : (
                                     sessionHistoryRef.current.map((log, idx) => (
                                         <div key={idx} className="px-5 py-4 border-b border-gray-50 last:border-none">
                                             <div className="flex items-center justify-between mb-2">
                                                 <div className="flex items-center gap-3">
                                                     <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-xs font-bold">
                                                         {idx + 1}
                                                     </div>
                                                     <div>
                                                         <div className="text-sm font-bold text-gray-900">{log.startTime}</div>
                                                         <div className="text-xs text-gray-400">{formatMinutes(log.durationMinutes)}</div>
                                                     </div>
                                                 </div>
                                                 <div className="text-right">
                                                     <div className="text-sm font-bold text-green-600">{Math.round(log.avgFocusScore)}%</div>
                                                 </div>
                                             </div>
                                             
                                             <div className="grid grid-cols-2 gap-2 mt-2">
                                                 <div className="bg-gray-50 rounded-lg p-2 flex items-center gap-2">
                                                     <Move size={12} className="text-gray-400"/>
                                                     <span className="text-[10px] text-gray-500">{t.posture}: <span className="font-bold text-gray-700">{log.postureQuality}</span></span>
                                                 </div>
                                                 <div className="bg-gray-50 rounded-lg p-2 flex items-center gap-2">
                                                     <Eye size={12} className="text-gray-400"/>
                                                     <span className="text-[10px] text-gray-500">Eye Fatigue: <span className="font-bold text-gray-700">{log.eyeFatigueLevel}</span></span>
                                                 </div>
                                             </div>
                                         </div>
                                     ))
                                 )}
                             </div>
                        </div>
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#f2f2f7] via-[#f2f2f7] to-transparent z-20">
                        <button 
                            onClick={handleFinish}
                            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform"
                        >
                            {t.backHome}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- 4. ACTIVE HUD --- */}
        { (sessionState === 'ACTIVE' && !isBreak) && (
            <div className={`absolute inset-0 z-10 flex flex-col items-center justify-between text-white pointer-events-none transition-opacity duration-300 ${showCameraPreview ? 'opacity-30' : 'opacity-100'}`}>
                 <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />

                 {/* Top Header */}
                 <div className="relative w-full pt-safe-top px-6 mt-4 flex justify-between items-start pointer-events-auto">
                    <div>
                        <h2 className="text-xl font-bold mt-1 shadow-black drop-shadow-md flex items-center gap-2">
                            {mode === TimerMode.POMODORO ? 'Focus Session' : task?.title || 'Session'}
                        </h2>
                        {(!isAiDisabled) && (
                            <div className="flex flex-col gap-1 mt-2">
                                <div className="flex items-center gap-2">
                                    {!isPremium ? (
                                        <div className="flex gap-2">
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 text-green-400 backdrop-blur-md rounded-md border border-green-500/50">
                                                <Zap size={10} fill="currentColor" />
                                                <span className="text-[10px] font-bold uppercase">{t.focusGuard}</span>
                                            </div>
                                            <button onClick={onUpgradeTrigger} className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/20 text-yellow-400 backdrop-blur-md rounded-md border border-yellow-500/30">
                                                <Crown size={10} fill="currentColor"/>
                                                <span className="text-[10px] font-bold uppercase">{t.proPosture}</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 px-2 py-1 bg-gradient-to-r from-green-500/30 to-blue-500/30 text-white backdrop-blur-md rounded-md border border-white/20">
                                            <ScanFace size={10} />
                                            <span className="text-[10px] font-bold uppercase">{t.fullBodyAi}</span>
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
                    </div>

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
                             {focusState === 'DEEP_FLOW' ? <Brain size={20} className="text-indigo-400" /> : 
                             focusState === 'DISTRACTED' ? <AlertTriangle size={20} className="text-red-500" /> :
                             <UserIcon size={20} className="text-green-400" />}
                        </div>
                    </div>
                </div>

                {/* Middle: Timer & Alerts */}
                <div className="relative flex flex-col items-center justify-center drop-shadow-2xl">
                    <div className="h-8 mb-4">
                        <AnimatePresence>
                            {(!isAiDisabled) && focusState === 'DISTRACTED' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-red-500/90 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-red-900/50"
                                >
                                    <AlertTriangle size={14} className="text-white" />
                                    <span className="font-bold text-xs tracking-wide">STAY FOCUSED</span>
                                </motion.div>
                            )}
                            {(!isAiDisabled) && focusState === 'DEEP_FLOW' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-indigo-500/80 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-indigo-900/50"
                                >
                                    <Brain size={14} className="text-white" />
                                    <span className="font-bold text-xs tracking-wide">FLOW STATE</span>
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
                                <div className="bg-black/50 backdrop-blur-sm px-4 py-1 rounded text-sm font-bold tracking-widest uppercase border border-white/20">{t.paused}</div>
                            </div>
                        ) : (
                             mode === TimerMode.POMODORO && (
                                <div className="flex justify-center gap-1 mt-2">
                                    {[...Array(settings.pomodorosPerRound)].map((_, i) => (
                                        <div key={i} className={`w-2 h-2 rounded-full ${i < roundsCompleted ? 'bg-green-500' : (i === roundsCompleted) ? 'bg-white animate-pulse' : 'bg-gray-600'}`} />
                                    ))}
                                </div>
                             )
                        )}
                    </div>
                </div>

                {/* Footer Controls + Ad Banner */}
                <div className="relative w-full pb-safe mb-8 flex flex-col justify-end pointer-events-auto">
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
                        <button onClick={handleShowSummary} className="w-16 h-16 rounded-full bg-red-500/80 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-600 transition-colors">
                            <Square size={24} fill="currentColor" />
                        </button>
                    </div>

                    {!isPremium && (
                        <div className="relative z-20">
                            <AdBanner onRemoveAds={onUpgradeTrigger} />
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- LOADING / ERROR --- */}
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

        {/* --- COUNTDOWN --- */}
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
    </div>
  );
};

export default FocusSessionView;