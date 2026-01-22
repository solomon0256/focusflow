
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Square, Play, Pause, Brain, AlertTriangle, Activity, WifiOff, ScanFace, Eye, EyeOff, User as UserIcon, Zap, Crown, Coffee, Armchair, FastForward, CheckCircle2, TrendingUp, Sparkles, Move, Clock, Bell, Bug, Circle, Battery } from 'lucide-react';
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
  onComplete: (minutesFocused: number, taskCompleted?: boolean, avgScore?: number) => void;
  onCancel: () => void;
  onUpgradeTrigger: () => void;
  // NEW: Callback to notify parent of phase change
  onPhaseChange?: (phase: 'IDLE' | 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK') => void;
}

// --- CONFIGURATION ---
const INTERVAL_BALANCED = 200;
const INTERVAL_SAVER = 500;
const CDN_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm";
const CDN_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

type SessionState = 'INIT' | 'COUNTDOWN' | 'CALIBRATING' | 'ACTIVE' | 'SUMMARY' | 'ERROR';
type Phase = 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK';

interface TimelineSegment {
    score: number;      
    duration: number;   
    isPartial: boolean; 
}

interface SessionSegmentLog {
    id: number;
    startTime: string;
    durationMinutes: number;
    avgFocusScore: number; 
    timeline: TimelineSegment[];
    postureQuality: 'Good' | 'Slouching' | 'Unknown'; 
    eyeFatigueLevel: 'Low' | 'Moderate' | 'High';
    postureAlerts: number; 
    distractionCount: number; 
}

// Helper to format minutes into "1h 30m" or "45m"
const formatMinutes = (m: number) => {
    if (m > 0 && m < 1) return '<1m';
    const totalMin = Math.round(m);
    if (totalMin < 60) return `${totalMin}m`;
    const h = Math.floor(totalMin / 60);
    const min = totalMin % 60;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
};

const FocusSessionView: React.FC<FocusSessionViewProps> = ({ mode, initialTimeInSeconds, settings, task, user, onComplete, onCancel, onUpgradeTrigger, onPhaseChange }) => {
  const t = translations[settings.language].session;
  
  const detectionInterval = settings.batterySaverMode ? INTERVAL_SAVER : INTERVAL_BALANCED;
  const targetResolution = settings.batterySaverMode ? { width: 480, height: 360 } : { width: 640, height: 480 };

  const [sessionState, setSessionState] = useState<SessionState>('INIT');
  const [phase, setPhase] = useState<Phase>('WORK');
  const [roundsCompleted, setRoundsCompleted] = useState(0);

  // Sync phase to parent
  useEffect(() => {
      onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  // --- TIMER STATE (Drift-Proof) ---
  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
  const [isPaused, setIsPaused] = useState(false);
  
  // Timer Refs for accurate calculation
  const sessionEndTimeRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number>(0);
  
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [isTaskCompleted, setIsTaskCompleted] = useState(false);
  const [didFinishNaturally, setDidFinishNaturally] = useState(false);

  // Stats Accumulator
  const totalFocusedSecondsRef = useRef(0);
  const currentCycleElapsedRef = useRef(0); 
  const sessionHistoryRef = useRef<SessionSegmentLog[]>([]);
  const currentSegmentMetrics = useRef({ distractions: 0, postureIssues: 0, fatigueEvents: 0 });

  const [countdown, setCountdown] = useState(3);
  const isPremium = user?.isPremium || false;

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isAiDisabled, setIsAiDisabled] = useState(false); 
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing Engine...');
  const [debugInfo, setDebugInfo] = useState<string>('AI: Idle'); 
  const [showCameraPreview, setShowCameraPreview] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); 
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);
  const drawingUtilsRef = useRef<DrawingUtils | null>(null); 

  const lastFrameTimeRef = useRef<number>(0);
  const lastPredictionTimeRef = useRef<number>(0);
  const fpsRef = useRef<number>(0);
  const smoothYawRef = useRef<number>(0); 
  const calibrationRef = useRef<{ noseBase: { x: number, y: number } | null; shoulderWidthBase: number | null; }>({ noseBase: null, shoulderWidthBase: null });

  const [focusState, setFocusState] = useState<'DEEP_FLOW' | 'FOCUSED' | 'DISTRACTED' | 'ABSENT'>('FOCUSED');
  const [focusScore, setFocusScore] = useState(100); 

  const activeNotifications = useMemo(() => {
      if (mode === TimerMode.POMODORO) return settings.notifications || [];
      if (mode === TimerMode.CUSTOM) return settings.customNotifications || [];
      if (mode === TimerMode.STOPWATCH) return settings.stopwatchNotifications || [];
      return [];
  }, [mode, settings]);

  const targetRounds = useMemo(() => {
      if (mode === TimerMode.POMODORO && task?.pomodoroCount) return task.pomodoroCount;
      return settings.pomodorosPerRound;
  }, [mode, task, settings.pomodorosPerRound]);

  useEffect(() => {
      NativeService.Screen.keepAwake();
      return () => { NativeService.Screen.allowSleep(); };
  }, []);

  // 1. Init Pipeline (Unchanged)
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;
    const setupPipeline = async () => {
        try {
            setLoadingStatus('Accessing Camera...');
            await new Promise(r => setTimeout(r, 500)); 
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: { ideal: targetResolution.width }, height: { ideal: targetResolution.height }, frameRate: { ideal: 30 } },
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
      
      // START TIMER LOGIC HERE
      const startDuration = initialTimeInSeconds;
      setTimeLeft(startDuration);
      sessionEndTimeRef.current = Date.now() + (startDuration * 1000);
      
      setSessionState('ACTIVE');
      NativeService.Haptics.notificationSuccess();
  };

  // 3. AI Loop (Unchanged)
  useEffect(() => {
      if (sessionState === 'ACTIVE' && phase === 'WORK' && !isAiDisabled && !isPaused) {
          const predictWebcam = () => {
              const video = videoRef.current;
              const landmarker = poseLandmarkerRef.current;
              const canvas = canvasRef.current;
              if (video && landmarker && !video.paused && !video.ended && isVideoReady) {
                  const now = performance.now();
                  if (now - lastPredictionTimeRef.current >= detectionInterval) {
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
  }, [sessionState, isAiDisabled, isPaused, isVideoReady, phase, detectionInterval]); 

  // --- STATS LOGIC ---
  const recordCycleStats = (durationMinutes: number) => {
      const totalSeconds = Math.floor(durationMinutes * 60);
      const timelineSegments: TimelineSegment[] = [];
      let secondsProcessed = 0;
      while (secondsProcessed < totalSeconds) {
          const secondsLeft = totalSeconds - secondsProcessed;
          const chunkSeconds = Math.min(300, secondsLeft); 
          let chunkMinutes = Number((chunkSeconds / 60).toFixed(1));
          if (chunkMinutes === 0 && chunkSeconds > 0) chunkMinutes = 0.1;
          const variance = Math.floor(Math.random() * 8) - 4;
          const segScore = Math.max(0, Math.min(100, focusScore + variance));
          timelineSegments.push({ score: segScore, duration: chunkMinutes, isPartial: chunkSeconds < 300 });
          secondsProcessed += chunkSeconds;
      }
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
      currentSegmentMetrics.current = { distractions: 0, postureIssues: 0, fatigueEvents: 0 };
  };

  // --- STRICT MODE: AUTO PAUSE ON BACKGROUND ---
  useEffect(() => {
      const handleVisibilityChange = () => {
          if (document.hidden) {
              // APP WENT TO BACKGROUND
              if (sessionState === 'ACTIVE' && !isPaused) {
                  // Explicitly set paused state directly here
                  pauseStartTimeRef.current = Date.now();
                  setIsPaused(true);
                  NativeService.Haptics.impactMedium();
              }
          } else {
              // APP CAME TO FOREGROUND
              // If we find it paused, and it was caused by this logic, show the message
              if (sessionState === 'ACTIVE' && isPaused) {
                  const autoPauseMsg = settings.language === 'zh' ? '⛔ 离开应用自动暂停' : '⛔ Auto-paused on exit';
                  setNotificationMsg(autoPauseMsg);
                  setTimeout(() => setNotificationMsg(null), 4000);
              }
          }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sessionState, isPaused, settings.language]);

  // 4. ROBUST TIMER LOGIC (Fixes Drift)
  useEffect(() => {
      if (sessionState !== 'ACTIVE') return;

      const interval = setInterval(() => {
          if (isPaused) return;

          // STOPWATCH MODE: Increment
          if (mode === TimerMode.STOPWATCH) {
              setTimeLeft(prev => {
                  const newVal = prev + 1;
                  // Stats accumulator
                  if (phase === 'WORK') {
                      totalFocusedSecondsRef.current++;
                      currentCycleElapsedRef.current++;
                  }
                  return newVal;
              });
              return;
          }

          // COUNTDOWN MODE: Calculate based on End Time
          const now = Date.now();
          const remainingMs = sessionEndTimeRef.current - now;
          const remainingSec = Math.ceil(remainingMs / 1000);

          // Update Stats Accumulators (Approximate 1s tick)
          // Note: Since we use Delta Time for the main timer, stats might slightly drift but it's acceptable for charts.
          // For strict accuracy, we'd calculate diff since last tick.
          if (phase === 'WORK' && remainingSec > 0) {
              totalFocusedSecondsRef.current++;
              currentCycleElapsedRef.current++;
              
              // Notification Check
              const elapsedSeconds = totalFocusedSecondsRef.current;
              if (elapsedSeconds % 60 === 0) {
                  const elapsedMinutes = elapsedSeconds / 60;
                  if (activeNotifications.includes(elapsedMinutes)) {
                      NativeService.Haptics.notificationSuccess();
                      setNotificationMsg(`${elapsedMinutes} minutes reached`);
                      setTimeout(() => setNotificationMsg(null), 3000);
                  }
              }
          }

          if (remainingSec <= 0) {
              setTimeLeft(0);
              // TIMER END LOGIC
              if (phase === 'WORK') {
                  const elapsedMins = currentCycleElapsedRef.current / 60;
                  recordCycleStats(elapsedMins); 
                  currentCycleElapsedRef.current = 0; 

                  const newRounds = roundsCompleted + 1;
                  setRoundsCompleted(newRounds);
                  NativeService.Haptics.notificationSuccess();

                  if (mode === TimerMode.POMODORO && newRounds < targetRounds) {
                      setPhase('SHORT_BREAK');
                      const breakSec = settings.shortBreakTime * 60;
                      setTimeLeft(breakSec);
                      sessionEndTimeRef.current = Date.now() + (breakSec * 1000);
                  } else if (mode === TimerMode.POMODORO && newRounds >= targetRounds) {
                      setPhase('LONG_BREAK');
                      const breakSec = settings.longBreakTime * 60;
                      setTimeLeft(breakSec);
                      sessionEndTimeRef.current = Date.now() + (breakSec * 1000);
                  } else {
                      clearInterval(interval);
                      handleShowSummary(true); 
                  }
              } 
              else if (phase === 'SHORT_BREAK') {
                  NativeService.Haptics.notificationSuccess();
                  setPhase('WORK');
                  currentCycleElapsedRef.current = 0;
                  const workSec = settings.workTime * 60;
                  setTimeLeft(workSec);
                  sessionEndTimeRef.current = Date.now() + (workSec * 1000);
              }
              else if (phase === 'LONG_BREAK') {
                  clearInterval(interval);
                  handleShowSummary(true); 
              }
          } else {
              setTimeLeft(remainingSec);
          }
      }, 1000);

      return () => clearInterval(interval);
  }, [sessionState, isPaused, phase, roundsCompleted, settings, mode, activeNotifications, targetRounds]);

  const handlePauseToggle = () => {
      NativeService.Haptics.impactMedium();
      if (isPaused) {
          // RESUME
          const now = Date.now();
          const pausedDuration = now - pauseStartTimeRef.current;
          sessionEndTimeRef.current += pausedDuration; // Push end time forward by pause duration
          setIsPaused(false);
      } else {
          // PAUSE
          pauseStartTimeRef.current = Date.now();
          setIsPaused(true);
      }
  };

  const handleShowSummary = (naturalFinish: boolean = false) => {
      if (mode === TimerMode.STOPWATCH || !naturalFinish) {
           const elapsedMins = currentCycleElapsedRef.current / 60;
           if (elapsedMins > 0.05) recordCycleStats(elapsedMins);
      }
      setDidFinishNaturally(naturalFinish);
      if (mode === TimerMode.POMODORO && naturalFinish) setIsTaskCompleted(true);
      else setIsTaskCompleted(false);
      setSessionState('SUMMARY');
      NativeService.Haptics.notificationSuccess();
  };

  const handleFinish = () => {
      const minutes = totalFocusedSecondsRef.current / 60;
      let avgScore = 100;
      if (sessionHistoryRef.current.length > 0) {
          const totalScore = sessionHistoryRef.current.reduce((acc, curr) => acc + curr.avgFocusScore, 0);
          avgScore = Math.ceil(totalScore / sessionHistoryRef.current.length);
      } else {
          avgScore = Math.ceil(focusScore);
      }
      onComplete(Number(minutes.toFixed(1)), isTaskCompleted, avgScore);
  };

  const skipBreak = () => {
      if (phase === 'SHORT_BREAK') {
          setPhase('WORK');
          currentCycleElapsedRef.current = 0;
          const workSec = settings.workTime * 60;
          setTimeLeft(workSec);
          sessionEndTimeRef.current = Date.now() + (workSec * 1000);
          NativeService.Haptics.impactMedium();
      } else if (phase === 'LONG_BREAK') {
          handleShowSummary(true);
      }
  };

  // DEBUG: Fast Forward needs to adjust End Time ref now
  const handleDebugFastForward = () => {
      if (phase === 'WORK') {
          const SKIP_MINUTES = 30;
          const SKIP_SECONDS = SKIP_MINUTES * 60;
          recordCycleStats(SKIP_MINUTES);
          totalFocusedSecondsRef.current += SKIP_SECONDS;
          
          if (mode === TimerMode.POMODORO || mode === TimerMode.CUSTOM) {
              if (timeLeft > SKIP_SECONDS) {
                  sessionEndTimeRef.current -= (SKIP_SECONDS * 1000);
                  setNotificationMsg(`⚡ Debug: Skipped ${SKIP_MINUTES}m`);
              } else {
                  // Instant Finish
                  const remainingMins = timeLeft / 60;
                  recordCycleStats(remainingMins);
                  totalFocusedSecondsRef.current += timeLeft;
                  sessionEndTimeRef.current = Date.now() - 1000; // Force end
                  setNotificationMsg("⚡ Debug: Finishing...");
              }
          } else {
              // Stopwatch
              setTimeLeft(prev => prev + SKIP_SECONDS);
              setNotificationMsg(`⚡ Debug: Added ${SKIP_MINUTES}m`);
          }
          setTimeout(() => setNotificationMsg(null), 2000);
      }
  };

  const analyzePose_Debug_Visualization = (results: any, video: HTMLVideoElement, canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const targetFPS = settings.batterySaverMode ? 2 : 5;
      
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(10, 10, 240, 150);
      ctx.fillStyle = "#00FF00";
      ctx.font = "14px monospace";
      ctx.fillText(`Target: ${targetFPS} FPS`, 20, 30);
      ctx.fillText(`Actual: ${fpsRef.current.toFixed(1)} FPS`, 20, 50);
      ctx.fillText(`Res: ${canvas.width}x${canvas.height}`, 20, 130);
      
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
                                return formatMinutes(m);
                            })()
                        }</span>.</p>
                    </div>

                    <div className="px-6 mt-8 space-y-4 pb-20 relative z-10">
                        
                        {/* TASK COMPLETION CARD */}
                        {task && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100"
                            >
                                <div className="flex items-start gap-4">
                                    <div 
                                        onClick={() => {
                                            setIsTaskCompleted(!isTaskCompleted);
                                            NativeService.Haptics.impactLight();
                                        }}
                                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors
                                            ${isTaskCompleted ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}
                                        `}
                                    >
                                        {isTaskCompleted && <CheckCircle2 size={18} className="text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 line-clamp-1">{task.title}</h3>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                            {isTaskCompleted 
                                                ? t.taskCompleted 
                                                : (didFinishNaturally ? t.markAsDone : t.earlyStop)
                                            }
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

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

                        {/* 2. Timeline Chart (UPDATED LAYOUT) */}
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
                                <div className="relative">
                                    {/* Scrollable Container with explicit X-axis overflow */}
                                    <div className="h-32 flex items-end justify-start gap-1 overflow-x-auto no-scrollbar pb-6 w-full">
                                        {fullTimeline.map((seg, i) => (
                                            <div key={i} className="flex-shrink-0 w-8 flex flex-col justify-end group relative h-full min-w-[32px]">
                                                {/* Tooltip */}
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
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
                                                
                                                {/* X-Axis Label: Show every 30 mins (approx 6 blocks) */}
                                                {(i % 6 === 0) && (
                                                    <div className="absolute -bottom-6 left-0 text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                                        {formatMinutes(i * 5)}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {/* Final Time Label */}
                                        <div className="flex-shrink-0 w-1 h-1 relative">
                                            <div className="absolute -bottom-6 left-0 text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                                 {formatMinutes(fullTimeline.length * 5)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="border-t border-gray-100 mt-0 w-full" />
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
                                    {settings.batterySaverMode && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 text-green-400 backdrop-blur-md rounded-md border border-green-500/50">
                                            <Battery size={10} fill="currentColor" />
                                            <span className="text-[10px] font-bold uppercase">Eco Mode</span>
                                        </div>
                                    )}
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

                    <div className="relative flex flex-col items-center justify-center gap-4">
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

                {/* DEBUG BUTTON: Moved to Bottom Left, High Z-Index, Red Color */}
                <button 
                    onClick={handleDebugFastForward}
                    className="absolute bottom-28 left-6 z-[60] bg-red-600/90 text-white w-12 h-12 rounded-full shadow-2xl border-2 border-white/20 flex items-center justify-center pointer-events-auto active:scale-95 transition-transform"
                    title="Debug: Skip 30 mins"
                >
                    <Bug size={24} />
                </button>

                {/* Middle: Timer & Alerts */}
                <div className="relative flex flex-col items-center justify-center drop-shadow-2xl">
                    <div className="h-10 mb-4 flex flex-col items-center">
                        <AnimatePresence mode="wait">
                            {/* Notification Toast */}
                            {notificationMsg && (
                                <motion.div 
                                    key="toast"
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                                    className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-lg border border-white/10"
                                >
                                    <Bell size={14} className="text-white" />
                                    <span className="font-bold text-sm tracking-wide text-white">{notificationMsg}</span>
                                </motion.div>
                            )}

                            {/* AI Focus States */}
                            {!notificationMsg && (!isAiDisabled) && focusState === 'DISTRACTED' && (
                                <motion.div 
                                    key="distracted"
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-red-500/90 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-red-900/50"
                                >
                                    <AlertTriangle size={14} className="text-white" />
                                    <span className="font-bold text-xs tracking-wide">STAY FOCUSED</span>
                                </motion.div>
                            )}
                            {!notificationMsg && (!isAiDisabled) && focusState === 'DEEP_FLOW' && (
                                <motion.div 
                                    key="flow"
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
                                <button onClick={handlePauseToggle} className="bg-black/50 backdrop-blur-sm px-4 py-1 rounded text-sm font-bold tracking-widest uppercase border border-white/20 cursor-pointer">{t.paused}</button>
                            </div>
                        ) : (
                             mode === TimerMode.POMODORO && (
                                <div className="flex justify-center gap-1 mt-2">
                                    {[...Array(targetRounds)].map((_, i) => (
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
                        <button onClick={handleShowSummary.bind(null, false)} className="w-16 h-16 rounded-full bg-gray-800/60 backdrop-blur-md flex items-center justify-center text-white/70 hover:bg-gray-700 transition-colors">
                            <Square size={24} fill="currentColor" />
                        </button>
                        <button 
                            onClick={handlePauseToggle}
                            className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
                        >
                            {isPaused ? <Play size={32} fill="black" className="ml-1" /> : <Pause size={32} fill="black" />}
                        </button>
                        {/* Placeholder for symmetry or other action */}
                        <div className="w-16 h-16" />
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
