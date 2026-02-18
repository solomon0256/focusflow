import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Square, Play, Pause, Brain, AlertTriangle, Move, Eye, EyeOff, User as UserIcon, Coffee, Armchair, FastForward, CheckCircle2, Sparkles, Bell, Bug, Battery, Monitor, RotateCcw, Headphones, BarChart2, Star, X } from 'lucide-react';
import { TimerMode, Task, User, Settings, FocusLevel, CycleRecord } from '../types';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import { NativeService } from '../services/native';
import { AdBanner } from '../components/AdBanner';
import { translations } from '../utils/translations';
import { AudioService } from '../services/audio'; 
import { SoundSelector } from '../components/SoundSelector'; 

// ==============================
// FOCUS DETECTION CORE CONFIG
// ==============================

// -------- HEAD ROTATION THRESHOLDS (degrees) --------
// 轻度偏转：开始认为注意力下降
const HEAD_YAW_MILD = 20;
// 明确分心：强惩罚区
const HEAD_YAW_DISTRACT = 40;
// 极端分心：几乎完全离开工作区域
const HEAD_YAW_SEVERE = 60;

// -------- HEAD ROTATION CHANGE THRESHOLD (degrees per frame) --------
// 每帧变化超过该值，认为是“频繁扭头”
const HEAD_YAW_DELTA_THRESHOLD = 12;

// -------- HEAD POSITION OFFSET THRESHOLD (normalized screen ratio) --------
// 鼻子相对校准中心偏移比例 (Static Position)
const HEAD_OFFSET_MILD = 0.08;
const HEAD_OFFSET_DISTRACT = 0.18;
const HEAD_OFFSET_SEVERE = 0.28;

// -------- HEAD MOVEMENT THRESHOLD (normalized distance delta) --------
// 头部每帧移动距离 (Dynamic Movement)
const HEAD_MOVE_MILD = 0.02;
const HEAD_MOVE_DISTRACT = 0.05;
const HEAD_MOVE_SEVERE = 0.08;

// -------- BODY MOTION THRESHOLD --------
// 肩部中心位移（normalized）
const BODY_MOTION_MILD = 0.015;
const BODY_MOTION_DISTRACT = 0.035;
const BODY_MOTION_SEVERE = 0.060;

// -------- ABSENT THRESHOLD --------
// 连续无检测帧比例
const ABSENT_RATIO_DISTRACT = 0.25;

// -------- WEIGHTS (USER DEFINED) --------
// 权重总和必须 = 1.0
// 1. 身体偏移 (Body Motion): 0.4
const WEIGHT_BODY_MOTION   = 0.40;
// 2. 位置偏移 (Head Static Offset): 0.3
const WEIGHT_HEAD_OFFSET   = 0.30;
// 3. 头部移动 (Head Dynamic Move): 0.2
const WEIGHT_HEAD_MOVE     = 0.20;
// 4. 头部转动 (Head Rotation Yaw): 0.1
const WEIGHT_HEAD_ROTATION = 0.10;

// Absent 权重设为 0，因为 Absent 会直接强制分心，不再参与加权计算
const WEIGHT_ABSENT        = 0.00;

interface FocusSessionViewProps {
  mode: TimerMode;
  initialTimeInSeconds: number;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  task?: Task;
  user: User | null;
  onComplete: (minutesFocused: number, taskCompleted?: boolean, focusLevel?: FocusLevel | null) => void;
  onCancel: () => void;
  onUpgradeTrigger: () => void;
  onPhaseChange?: (phase: 'IDLE' | 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK') => void;
}

const INTERVAL_BALANCED = 200;
const INTERVAL_SAVER = 500;
const CDN_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm";
const CDN_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

type SessionState = 'INIT' | 'COUNTDOWN' | 'CALIBRATING' | 'ACTIVE' | 'SUMMARY' | 'ERROR';
type Phase = 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK';
type InternalMinuteState = FocusLevel | 'ABSENT';

// Helper to format minutes
const formatMinutes = (m: number) => {
    if (m > 0 && m < 1) return '<1m';
    const totalMin = Math.round(m);
    if (totalMin < 60) return `${totalMin}m`;
    const h = Math.floor(totalMin / 60);
    const min = totalMin % 60;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
};

// Cycle Aggregation Step A: Base Score
const getBaseScore = (state: InternalMinuteState): number => {
    if (state === FocusLevel.FLOW) return 3;
    if (state === FocusLevel.FOCUSED) return 2;
    if (state === FocusLevel.LOW_FOCUS) return 1;
    return 0; // DISTRACTED or ABSENT
};

// Cycle Aggregation Step B: Anomaly Weight
const getAnomalyWeight = (state: InternalMinuteState): number => {
    if (state === FocusLevel.DISTRACTED) return 1.0;
    if (state === FocusLevel.LOW_FOCUS) return 0.5;
    if (state === 'ABSENT') return 1.5; // Adjusted to 1.5 for stricter penalty
    return 0; // FLOW / FOCUSED
};

const getBaseLevelFromAvg = (avg: number): FocusLevel => {
    if (avg >= 2.6) return FocusLevel.FLOW;
    if (avg >= 1.8) return FocusLevel.FOCUSED;
    if (avg >= 1.0) return FocusLevel.LOW_FOCUS;
    return FocusLevel.DISTRACTED;
};

const downgradeOneLevel = (l: FocusLevel): FocusLevel => {
    if (l === FocusLevel.FLOW) return FocusLevel.FOCUSED;
    if (l === FocusLevel.FOCUSED) return FocusLevel.LOW_FOCUS;
    return FocusLevel.DISTRACTED;
};

const capLevel = (l: FocusLevel, cap: FocusLevel): FocusLevel => {
    const rank = { [FocusLevel.FLOW]: 3, [FocusLevel.FOCUSED]: 2, [FocusLevel.LOW_FOCUS]: 1, [FocusLevel.DISTRACTED]: 0 };
    return rank[l] <= rank[cap] ? l : cap;
};

// --- FUSION HELPER ---

const levelToNumber = (l: FocusLevel): number => {
    switch (l) {
        case FocusLevel.FLOW: return 3;
        case FocusLevel.FOCUSED: return 2;
        case FocusLevel.LOW_FOCUS: return 1;
        case FocusLevel.DISTRACTED: return 0;
        default: return 0;
    }
};

const numberToLevel = (n: number): FocusLevel => {
    if (n >= 3) return FocusLevel.FLOW;
    if (n === 2) return FocusLevel.FOCUSED;
    if (n === 1) return FocusLevel.LOW_FOCUS;
    return FocusLevel.DISTRACTED;
};

// Strict Rule Implementation for Fusion
const calculateFinalLevel = (camera: FocusLevel | null, self: FocusLevel | null): FocusLevel | null => {
    if (camera === null && self === null) return null;
    if (camera !== null && self === null) return camera;
    if (camera === null && self !== null) return self;

    const c = levelToNumber(camera!);
    const s = levelToNumber(self!);
    const gap = Math.abs(c - s);

    if (gap < 2) {
        if (c >= s) return camera;
        return numberToLevel(Math.max(c, s - 1));
    } else {
        if (s > c) return camera;
        return self;
    }
};

// --- HELPER INTERFACES FOR NEW ALGO ---
interface StructuredLandmark {
    x: number;
    y: number;
    z?: number;
}

interface PrevLandmarks {
    nose: StructuredLandmark;
    leftShoulder: StructuredLandmark;
    rightShoulder: StructuredLandmark;
    yaw: number;
    shoulderCenter: StructuredLandmark;
}

interface WindowFrameData {
    score: number;
    isAbsent: boolean;
    timestamp: number;
}

interface WindowScore {
    score: number;
    absentRatio: number;
}

const FocusSessionView: React.FC<FocusSessionViewProps> = ({ mode, initialTimeInSeconds, settings, setSettings, task, user, onComplete, onCancel, onUpgradeTrigger, onPhaseChange }) => {
  const t = translations[settings.language].session;
  
  const detectionInterval = settings.batterySaverMode ? INTERVAL_SAVER : INTERVAL_BALANCED;
  const targetResolution = settings.batterySaverMode ? { width: 480, height: 360 } : { width: 640, height: 480 };

  const [sessionState, setSessionState] = useState<SessionState>('INIT');
  const [phase, setPhase] = useState<Phase>('WORK');
  const [roundsCompleted, setRoundsCompleted] = useState(0);

  // --- NEW STATE FOR SELF ASSESSMENT ---
  const [isRatingPending, setIsRatingPending] = useState(false);
  const cycleRecordsRef = useRef<CycleRecord[]>([]);
  const pendingCycleRef = useRef<Partial<CycleRecord> | null>(null);

  // --- NEW ALGORITHM STATE REFS ---
  const prevLandmarksRef = useRef<PrevLandmarks | null>(null);
  
  // Window Aggregation Refs (10s)
  const windowFrameScoresRef = useRef<WindowFrameData[]>([]);
  const windowStartTimeRef = useRef<number>(0);
  
  // Minute Aggregation Refs (60s)
  const minuteWindowScoresRef = useRef<WindowScore[]>([]);
  const minuteStartTimeRef = useRef<number>(0);
  
  // Cycle History (Legacy Interface)
  const cycleMinuteHistory = useRef<InternalMinuteState[]>([]);

  // Sync phase to parent
  useEffect(() => {
      onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
  const [isPaused, setIsPaused] = useState(false);
  
  const sessionEndTimeRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number>(0);
  
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [isTaskCompleted, setIsTaskCompleted] = useState(false);
  const [didFinishNaturally, setDidFinishNaturally] = useState(false);

  const totalFocusedSecondsRef = useRef(0);
  const currentCycleElapsedRef = useRef(0); 
  
  const [countdown, setCountdown] = useState(3);
  const isPremium = user?.isPremium || false;

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isAiDisabled, setIsAiDisabled] = useState(false); 
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing Engine...');
  const [debugInfo, setDebugInfo] = useState<string>('AI: Idle'); 
  const [showCameraPreview, setShowCameraPreview] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isTooClose, setIsTooClose] = useState(false); 
  const [isSoundMenuOpen, setIsSoundMenuOpen] = useState(false);

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

  useEffect(() => {
      if (settings.soundEnabled) {
          if (focusState === 'DISTRACTED' || focusState === 'ABSENT') {
              AudioService.setDynamicVolumeScale(0.2);
          } else {
              AudioService.setDynamicVolumeScale(1.0);
          }
      }
  }, [focusState, settings.soundEnabled]);

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

  const initPipeline = async () => {
    let stream: MediaStream | null = null;
    try {
        setSessionState('INIT');
        setErrorMessage('');
        setLoadingStatus('Accessing Camera...');
        
        await new Promise(r => setTimeout(r, 500)); 
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: { ideal: targetResolution.width }, height: { ideal: targetResolution.height }, frameRate: { ideal: 30 } },
            audio: false
        });
        
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }

        setLoadingStatus('Downloading AI Engine...');
        const vision = await FilesetResolver.forVisionTasks(CDN_WASM_URL);
        
        setLoadingStatus('Loading Pose Model...');
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: CDN_MODEL_URL, delegate: "GPU" },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        poseLandmarkerRef.current = landmarker;

        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) drawingUtilsRef.current = new DrawingUtils(ctx);
        }
        
        setSessionState('COUNTDOWN');
        return stream;

    } catch (err: any) {
        console.error("Init Error Details:", err);
        let msg = 'AI Engine Failed to Load.';
        if (err.name === 'NotAllowedError') msg = 'Camera access denied. Please allow camera in settings.';
        else if (err.message && err.message.includes('fetch')) msg = 'Network Error: Failed to download AI files.\nPlease check your connection or Proxy.';
        
        setErrorMessage(msg);
        setSessionState('ERROR');
        if (stream) (stream as MediaStream).getTracks().forEach(track => track.stop());
        return null;
    }
  };

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isMounted = true;
    const runInit = async () => {
        const s = await initPipeline();
        if (isMounted && s) activeStream = s;
        else if (s) s.getTracks().forEach(track => track.stop());
    };
    runInit();
    return () => {
        isMounted = false;
        if (activeStream) activeStream.getTracks().forEach(track => track.stop());
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (poseLandmarkerRef.current) try { poseLandmarkerRef.current.close(); } catch(e) {}
    };
  }, []); 

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
          try {
             const result = landmarker.detectForVideo(video, performance.now());
             if (result.landmarks && result.landmarks.length > 0) {
                 const pose = result.landmarks[0];
                 calibrationRef.current = {
                     noseBase: { x: pose[0].x, y: pose[0].y },
                     shoulderWidthBase: Math.abs(pose[11].x - pose[12].x)
                 };
             }
          } catch(e) {}
      }
      
      // Reset Algorithm State
      cycleMinuteHistory.current = [];
      prevLandmarksRef.current = null;
      windowFrameScoresRef.current = [];
      minuteWindowScoresRef.current = [];
      windowStartTimeRef.current = Date.now();
      minuteStartTimeRef.current = Date.now();

      const startDuration = initialTimeInSeconds;
      setTimeLeft(startDuration);
      sessionEndTimeRef.current = Date.now() + (startDuration * 1000);
      setSessionState('ACTIVE');
      NativeService.Haptics.notificationSuccess();
  };

  // --- NEW ALGORITHM: MAP SCORE TO LEVEL ---
  const mapScoreToLevel = (score: number): FocusLevel => {
      if (score >= 85) return FocusLevel.FLOW;
      if (score >= 70) return FocusLevel.FOCUSED;
      if (score >= 50) return FocusLevel.LOW_FOCUS;
      return FocusLevel.DISTRACTED;
  };

  // --- NEW ALGORITHM: MINUTE FINALIZATION ---
  const finalizeMinute = (isFinal: boolean = false) => {
      const windows = minuteWindowScoresRef.current;
      
      // If final, flush pending window first? No, triggerPhaseSwitch calls flushWindow THEN finalizeMinute.
      // So here we assume windows are up to date.
      
      if (windows.length === 0) {
          if (isFinal) return; // Nothing to record
          // Else, implies minute just started? But finalize called?
          // If called by timer, it means 60s elapsed.
      }

      // Calculate Minute Stats
      let totalScore = 0;
      let totalAbsentRatio = 0;
      const count = windows.length;

      windows.forEach(w => {
          totalScore += w.score;
          totalAbsentRatio += w.absentRatio;
      });

      const avgScore = count > 0 ? totalScore / count : 0;
      const avgAbsent = count > 0 ? totalAbsentRatio / count : 1.0;

      let minuteState: InternalMinuteState;

      // Logic: If absent ratio is too high, mark entire minute as ABSENT
      if (avgAbsent > ABSENT_RATIO_DISTRACT) {
          minuteState = 'ABSENT';
      } else {
          minuteState = mapScoreToLevel(avgScore);
      }

      console.log(`[Algo] Minute Finalized: Score=${avgScore.toFixed(1)}, Absent=${avgAbsent.toFixed(2)}, State=${minuteState}`);
      cycleMinuteHistory.current.push(minuteState);

      // Reset Minute
      minuteWindowScoresRef.current = [];
      minuteStartTimeRef.current = Date.now();
  };

  // --- NEW ALGORITHM: WINDOW AGGREGATION ---
  const flushWindow = (isFinal: boolean = false) => {
      const frames = windowFrameScoresRef.current;
      if (frames.length === 0) {
          // Reset timer if empty (e.g. pause)
          windowStartTimeRef.current = Date.now();
          return;
      }

      // Calculate Stats
      const totalFrames = frames.length;
      let scoreSum = 0;
      let minScore = 100;
      let absentCount = 0;
      const scores: number[] = [];

      frames.forEach(f => {
          scoreSum += f.score;
          scores.push(f.score);
          if (f.score < minScore) minScore = f.score;
          if (f.isAbsent) absentCount++;
      });

      const avgScore = scoreSum / totalFrames;
      const absentRatio = absentCount / totalFrames;

      // Stability (Standard Deviation)
      let sumDiffSq = 0;
      scores.forEach(s => sumDiffSq += Math.pow(s - avgScore, 2));
      const variance = sumDiffSq / totalFrames;
      const stdDev = Math.sqrt(variance);
      // Stability score: 100 - stdDev (clamped)
      const stability = Math.max(0, Math.min(100, 100 - stdDev));

      // Window Score Formula
      // 0.6 * Avg + 0.3 * Min + 0.1 * Stability
      const windowScore = (0.6 * avgScore) + (0.3 * minScore) + (0.1 * stability);

      // Push to Minute
      minuteWindowScoresRef.current.push({
          score: windowScore,
          absentRatio: absentRatio
      });

      console.log(`[Algo] Window Flushed: Score=${windowScore.toFixed(1)}, Absent=${absentRatio.toFixed(2)}`);

      // Reset Window
      windowFrameScoresRef.current = [];
      windowStartTimeRef.current = Date.now(); // Sync start time to now
      
      // Trigger Minute Check? (Handled in loop)
  };

  // --- CYCLE AGGREGATION ---
  const calculateCycleCameraLevel = (): FocusLevel | null => {
      const history = cycleMinuteHistory.current;
      const N = history.length;
      
      if (N === 0) return null;

      // Step A: Base Score
      const totalBaseScore = history.reduce((acc, s) => acc + getBaseScore(s), 0);
      const avgBaseScore = totalBaseScore / N;
      const baseLevel = getBaseLevelFromAvg(avgBaseScore);

      // Step B: Anomaly Ratio
      const totalAnomalyWeight = history.reduce((acc, s) => acc + getAnomalyWeight(s), 0);
      const r = totalAnomalyWeight / N;

      // Step C: Thresholds
      const softThreshold = Math.max(0.10, 1 / N);
      const hardThreshold = Math.max(0.18, 2 / N);

      // Step D: Penalty Application
      let finalLevel = baseLevel;
      if (r >= hardThreshold) {
          finalLevel = capLevel(baseLevel, FocusLevel.LOW_FOCUS);
      } else if (r >= softThreshold) {
          finalLevel = downgradeOneLevel(baseLevel);
      }

      console.log(`[Algorithm] Cycle Result: N=${N}, Base=${baseLevel}, r=${r.toFixed(2)}, Final=${finalLevel}`);
      return finalLevel;
  };

  useEffect(() => {
      if (sessionState === 'ACTIVE' && phase === 'WORK' && !isAiDisabled) {
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
                          } catch (e) {}
                      }
                  }
              }
              requestRef.current = requestAnimationFrame(predictWebcam);
          };
          requestRef.current = requestAnimationFrame(predictWebcam);
      }
      return () => cancelAnimationFrame(requestRef.current);
  }, [sessionState, isAiDisabled, isPaused, isVideoReady, phase, detectionInterval]); 

  // --- TIMER LOGIC (MODIFIED FOR NEW ALGO) ---
  useEffect(() => {
      if (sessionState !== 'ACTIVE') return;

      const interval = setInterval(() => {
          if (isPaused) return;

          if (mode === TimerMode.STOPWATCH) {
              setTimeLeft(prev => prev + 1);
              if (phase === 'WORK') {
                  totalFocusedSecondsRef.current++;
                  currentCycleElapsedRef.current++;
                  // Stopwatch algo handling (optional, focusing on Pomodoro for strict cycle)
              }
              return;
          }

          const now = Date.now();
          const remainingMs = sessionEndTimeRef.current - now;
          const remainingSec = Math.ceil(remainingMs / 1000);

          if (phase === 'WORK' && remainingSec > 0) {
              totalFocusedSecondsRef.current++;
              currentCycleElapsedRef.current++;
              
              const elapsedSeconds = totalFocusedSecondsRef.current;
              
              // Notification Check
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
              
              if (phase === 'WORK') {
                  // === WORK ENDED ===
                  triggerPhaseSwitch();
              } 
              else if (phase === 'SHORT_BREAK' || phase === 'LONG_BREAK') {
                  // === BREAK ENDED ===
                  if (isRatingPending) {
                      commitCycleRecord(null);
                  }

                  if (phase === 'LONG_BREAK') {
                      clearInterval(interval);
                      handleShowSummary(true); 
                  } else {
                      startNextWorkSession();
                  }
              }
          } else {
              setTimeLeft(remainingSec);
          }
      }, 1000);

      return () => clearInterval(interval);
  }, [sessionState, isPaused, phase, roundsCompleted, settings, mode, activeNotifications, targetRounds, isRatingPending]);

  // Moves state to Break
  const triggerPhaseSwitch = () => {
      // --- CRITICAL BOUNDARY FLUSH ---
      // Force finalize partial window and partial minute
      flushWindow(true); 
      finalizeMinute(true); 

      // 2. Run Cycle Aggregation
      // Minimum Threshold Check (60s) for recording
      if (currentCycleElapsedRef.current >= 60) {
            let currentCamLevel: FocusLevel | null = null;
            if (isAiDisabled) {
                currentCamLevel = null;
            } else {
                currentCamLevel = calculateCycleCameraLevel();
            }

            pendingCycleRef.current = {
                durationSec: currentCycleElapsedRef.current,
                cameraLevel: currentCamLevel,
                phaseType: 'WORK',
                createdAtMs: Date.now()
            };
            
            // Enable rating UI in Break Layer
            setIsRatingPending(true);
      } else {
          setIsRatingPending(false);
      }

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
          handleShowSummary(true); 
      }
  };

  // Helper to commit the record (called by button or auto-timeout)
  const commitCycleRecord = (userLevel: FocusLevel | null) => {
      if (pendingCycleRef.current) {
          const data = pendingCycleRef.current;
          const final = calculateFinalLevel(data.cameraLevel ?? null, userLevel);
          
          const record: CycleRecord = {
              cycleIndex: cycleRecordsRef.current.length + 1,
              phaseType: 'WORK',
              durationSec: data.durationSec || 0,
              cameraLevel: data.cameraLevel ?? null,
              selfLevel: userLevel,
              finalLevel: final,
              createdAtMs: Date.now()
          };
          
          cycleRecordsRef.current.push(record);
      }
      
      pendingCycleRef.current = null;
      setIsRatingPending(false);
  };

  const startNextWorkSession = () => {
      NativeService.Haptics.notificationSuccess();
      setPhase('WORK');
      currentCycleElapsedRef.current = 0;
      
      // Reset Algorithm State
      cycleMinuteHistory.current = [];
      prevLandmarksRef.current = null;
      windowFrameScoresRef.current = [];
      minuteWindowScoresRef.current = [];
      windowStartTimeRef.current = Date.now();
      minuteStartTimeRef.current = Date.now();

      const workSec = settings.workTime * 60;
      setTimeLeft(workSec);
      sessionEndTimeRef.current = Date.now() + (workSec * 1000);
  };

  // User clicks a rating button
  const handleRatingClick = (level: FocusLevel) => {
      commitCycleRecord(level);
      NativeService.Haptics.impactMedium();
  };

  const handlePauseToggle = () => {
      NativeService.Haptics.impactMedium();
      if (isPaused) {
          const now = Date.now();
          const pausedDuration = now - pauseStartTimeRef.current;
          sessionEndTimeRef.current += pausedDuration; 
          // Adjust window timers too?
          // Ideally yes, but tumbling window based on date diff handles breaks naturally by simple reset or just adding time.
          // For simplicity in this implementation, we just reset window start time on resume to avoid giant window.
          windowStartTimeRef.current = Date.now();
          setIsPaused(false);
      } else {
          pauseStartTimeRef.current = Date.now();
          setIsPaused(true);
      }
  };

  const handleShowSummary = (naturalFinish: boolean = false) => {
      setDidFinishNaturally(naturalFinish);
      if (mode === TimerMode.POMODORO && naturalFinish) setIsTaskCompleted(true);
      else setIsTaskCompleted(false);
      setSessionState('SUMMARY');
      NativeService.Haptics.notificationSuccess();
  };

  const handleFinish = () => {
      const minutes = totalFocusedSecondsRef.current / 60;
      let finalLevel: FocusLevel | null = null;

      // Strict Logic for Session Final Level
      if (totalFocusedSecondsRef.current >= 60) {
          if (cycleRecordsRef.current.length > 0) {
              // Rule: Session Final Level = last(cycleRecordsRef).finalLevel
              finalLevel = cycleRecordsRef.current[cycleRecordsRef.current.length - 1].finalLevel;
          } else {
              // Rule: No records (even if duration > 60s, maybe cycle didn't finish or commit) -> null
              finalLevel = null;
          }
      } else {
          // Rule: Short session (< 60s) -> null
          finalLevel = null;
      }

      onComplete(Number(minutes.toFixed(1)), isTaskCompleted, finalLevel);
  };

  const skipBreak = () => {
      // If skipping break while rating is pending, auto-skip assessment
      if (isRatingPending) {
          commitCycleRecord(null);
      }

      if (phase === 'SHORT_BREAK') {
          startNextWorkSession();
      } else if (phase === 'LONG_BREAK') {
          handleShowSummary(true);
      }
  };

  const handleDebugFastForward = () => {
      if (phase === 'WORK') {
          const SKIP_SECONDS = 30 * 60; 
          totalFocusedSecondsRef.current += SKIP_SECONDS;
          currentCycleElapsedRef.current += SKIP_SECONDS; // Simulate time passing for the cycle
          
          sessionEndTimeRef.current = Date.now() - 1000; // Force End
          setNotificationMsg("⚡ Debug: Finishing Cycle...");
          setTimeout(() => setNotificationMsg(null), 2000);
      }
  };

  // --- MAIN DETECTION LOOP (UPDATED) ---
  const analyzePose_Debug_Visualization = (results: any, video: HTMLVideoElement, canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const targetFPS = settings.batterySaverMode ? 2 : 5;
      const landmarks = results.landmarks?.[0];
      
      let frameScore = 0;
      let isAbsent = false;
      let frameFocusState: 'DEEP_FLOW' | 'FOCUSED' | 'DISTRACTED' | 'ABSENT' = 'ABSENT';
      
      // Variables for debug scoring display
      let currentYaw = 0;
      let yawDelta = 0;
      let yawAbs = 0;
      let scoreHeadRot = 0;
      
      let dist = 0; // Head offset distance (static)
      let scoreHeadOffset = 0;
      
      let headMoveDelta = 0; // Head movement (dynamic)
      let scoreHeadMove = 0;

      let motion = 0; // Body motion distance
      let scoreBodyMotion = 0;
      
      if (landmarks) {
          // --- 1. EXTRACT DATA ---
          const nose = landmarks[0];
          const leftEar = landmarks[7];
          const rightEar = landmarks[8];
          const leftShoulder = landmarks[11];
          const rightShoulder = landmarks[12];
          // const leftWrist = landmarks[15];
          // const rightWrist = landmarks[16];

          // Calc Center Points
          const shoulderCenter = {
              x: (leftShoulder.x + rightShoulder.x) / 2,
              y: (leftShoulder.y + rightShoulder.y) / 2,
              z: ((leftShoulder.z || 0) + (rightShoulder.z || 0)) / 2
          };

          // --- 2. CALCULATE YAW ---
          const headWidth = Math.abs(leftEar.x - rightEar.x);
          const earMidX = (leftEar.x + rightEar.x) / 2;
          const rawYawRatio = (nose.x - earMidX) / headWidth;
          
          smoothYawRef.current = (smoothYawRef.current * 0.7) + (rawYawRatio * 0.3);
          currentYaw = smoothYawRef.current * 90; // Approx degrees

          // --- 3. CALCULATE SCORES ---
          
          // A. Head Rotation Score (Yaw)
          yawAbs = Math.abs(currentYaw);
          scoreHeadRot = 100;
          if (yawAbs < HEAD_YAW_MILD) scoreHeadRot = 100;
          else if (yawAbs < HEAD_YAW_DISTRACT) scoreHeadRot = 70;
          else if (yawAbs < HEAD_YAW_SEVERE) scoreHeadRot = 30;
          else scoreHeadRot = 0;

          // Yaw Delta (Frequent turning penalty)
          const prevYaw = prevLandmarksRef.current?.yaw || currentYaw;
          yawDelta = Math.abs(currentYaw - prevYaw);
          if (yawDelta > HEAD_YAW_DELTA_THRESHOLD) {
              scoreHeadRot -= 20;
          }
          scoreHeadRot = Math.max(0, Math.min(100, scoreHeadRot));

          // B. Head Offset Score (Static Position vs Calibration)
          scoreHeadOffset = 100;
          if (calibrationRef.current.noseBase) {
              // Simple Euclidean dist from calibrated nose base
              const dx = nose.x - calibrationRef.current.noseBase.x;
              const dy = nose.y - calibrationRef.current.noseBase.y;
              dist = Math.sqrt(dx*dx + dy*dy);
              
              if (dist < HEAD_OFFSET_MILD) scoreHeadOffset = 100;
              else if (dist < HEAD_OFFSET_DISTRACT) scoreHeadOffset = 70;
              else if (dist < HEAD_OFFSET_SEVERE) scoreHeadOffset = 30;
              else scoreHeadOffset = 0;
          }

          // C. Head Move Score (Dynamic Motion) - NEW
          scoreHeadMove = 100;
          if (prevLandmarksRef.current) {
              const prevNose = prevLandmarksRef.current.nose;
              const dx = nose.x - prevNose.x;
              const dy = nose.y - prevNose.y;
              headMoveDelta = Math.sqrt(dx*dx + dy*dy);

              if (headMoveDelta < HEAD_MOVE_MILD) scoreHeadMove = 100;
              else if (headMoveDelta < HEAD_MOVE_DISTRACT) scoreHeadMove = 80;
              else if (headMoveDelta < HEAD_MOVE_SEVERE) scoreHeadMove = 40;
              else scoreHeadMove = 10;
          }

          // D. Body Motion Score (Shoulder Delta)
          scoreBodyMotion = 100;
          if (prevLandmarksRef.current) {
              const prevCenter = prevLandmarksRef.current.shoulderCenter;
              const dx = shoulderCenter.x - prevCenter.x;
              const dy = shoulderCenter.y - prevCenter.y;
              motion = Math.sqrt(dx*dx + dy*dy);

              if (motion < BODY_MOTION_MILD) scoreBodyMotion = 100;
              else if (motion < BODY_MOTION_DISTRACT) scoreBodyMotion = 80;
              else if (motion < BODY_MOTION_SEVERE) scoreBodyMotion = 40;
              else scoreBodyMotion = 10;
          }

          // E. Combine (Weighted)
          const finalScore = 
              (WEIGHT_BODY_MOTION * scoreBodyMotion) +    // 0.4
              (WEIGHT_HEAD_OFFSET * scoreHeadOffset) +    // 0.3
              (WEIGHT_HEAD_MOVE * scoreHeadMove) +        // 0.2
              (WEIGHT_HEAD_ROTATION * scoreHeadRot) +     // 0.1
              (WEIGHT_ABSENT * 100);                      // 0.0
          
          frameScore = Math.max(0, Math.min(100, finalScore));
          isAbsent = false;

          // Determine State Label for UI (Display Only)
          if (frameScore >= 85) frameFocusState = 'DEEP_FLOW';
          else if (frameScore >= 70) frameFocusState = 'FOCUSED';
          else frameFocusState = 'DISTRACTED';

          // Check "Too Close"
          const currentShoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
          const baseShoulderWidth = calibrationRef.current.shoulderWidthBase || 0.4; 
          if (currentShoulderWidth > baseShoulderWidth * 1.4) {
             setIsTooClose(true);
          } else {
             setIsTooClose(false);
          }

          // --- UPDATE PREV REFS ---
          prevLandmarksRef.current = {
              nose: { x: nose.x, y: nose.y, z: nose.z },
              leftShoulder: { x: leftShoulder.x, y: leftShoulder.y, z: leftShoulder.z },
              rightShoulder: { x: rightShoulder.x, y: rightShoulder.y, z: rightShoulder.z },
              yaw: currentYaw,
              shoulderCenter: shoulderCenter
          };

          // --- DEBUG DRAWING (BOX) ---
          if (drawingUtilsRef.current) {
              const boxW = headWidth * 0.5 * canvas.width;
              const boxH = headWidth * 1.5 * canvas.height;
              const earMidY = (leftEar.y + rightEar.y) / 2;
              const boxX = (earMidX * canvas.width) - (boxW / 2);
              const boxY = (earMidY * canvas.height) - (boxH / 2);
              ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";
              ctx.lineWidth = 2;
              ctx.strokeRect(boxX, boxY, boxW, boxH);
          }

      } else {
          // NO LANDMARKS DETECTED
          frameScore = 0;
          isAbsent = true;
          frameFocusState = 'ABSENT';
          
          // Clear Prev Refs to avoid jump when returning
          prevLandmarksRef.current = null;

          // Flip context to make text readable (counteract CSS mirror)
          ctx.save();
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);

          ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
          ctx.fillRect(10, 10, 240, 150);
          ctx.fillStyle = "red";
          ctx.font = "14px monospace";
          ctx.fillText("NO POSE DETECTED (未检测到姿态)", 20, 70);

          ctx.restore();
      }

      // --- COMPREHENSIVE DEBUG PANEL ---
      // This section draws all internal numbers for validation
      
      // Flip context to make text readable (counteract CSS mirror)
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      const panelW = 320;
      const panelH = 450;
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(10, 10, panelW, panelH);
      
      ctx.fillStyle = "#00FF00";
      ctx.font = "12px monospace";
      let y = 25;
      const step = 15;

      ctx.fillText(`FPS (帧率): ${fpsRef.current.toFixed(1)}`, 20, y); y += step;
      y += 5;

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "14px monospace font-bold";
      ctx.fillText(`STATE (状态): ${frameFocusState}`, 20, y); y += step + 5;
      ctx.fillText(`SCORE (得分): ${frameScore.toFixed(1)} / 100`, 20, y); y += step + 10;

      ctx.font = "12px monospace";
      ctx.fillStyle = "#AAAAAA";
      ctx.fillText(`--- COMPONENTS (评分组件) ---`, 20, y); y += step;

      // BODY MOTION (0.4)
      ctx.fillStyle = scoreBodyMotion < 100 ? "#FF5555" : "#FFFFFF";
      ctx.fillText(`[Body Motion (身体动作)] W:${WEIGHT_BODY_MOTION}`, 20, y); y += step;
      ctx.fillText(`  Motion: ${motion.toFixed(4)} (Thresh: ${BODY_MOTION_MILD})`, 20, y); y += step;
      ctx.fillText(`  -> Raw Score: ${scoreBodyMotion}`, 20, y); y += step + 5;

      // HEAD OFFSET (0.3)
      ctx.fillStyle = scoreHeadOffset < 100 ? "#FF5555" : "#FFFFFF";
      ctx.fillText(`[Head Offset (位置偏移)] W:${WEIGHT_HEAD_OFFSET}`, 20, y); y += step;
      ctx.fillText(`  Dist: ${dist.toFixed(4)} (Thresh: ${HEAD_OFFSET_MILD})`, 20, y); y += step;
      ctx.fillText(`  -> Raw Score: ${scoreHeadOffset}`, 20, y); y += step + 5;

      // HEAD MOVE (0.2)
      ctx.fillStyle = scoreHeadMove < 100 ? "#FF5555" : "#FFFFFF";
      ctx.fillText(`[Head Move (头部移动)] W:${WEIGHT_HEAD_MOVE}`, 20, y); y += step;
      ctx.fillText(`  Delta: ${headMoveDelta.toFixed(4)} (Thresh: ${HEAD_MOVE_MILD})`, 20, y); y += step;
      ctx.fillText(`  -> Raw Score: ${scoreHeadMove}`, 20, y); y += step + 5;

      // HEAD ROTATION (0.1)
      ctx.fillStyle = scoreHeadRot < 100 ? "#FF5555" : "#FFFFFF";
      ctx.fillText(`[Head Rot (头部转动)] W:${WEIGHT_HEAD_ROTATION}`, 20, y); y += step;
      ctx.fillText(`  Yaw: ${currentYaw.toFixed(1)}° (Abs: ${yawAbs.toFixed(1)})`, 20, y); y += step;
      ctx.fillText(`  -> Raw Score: ${scoreHeadRot}`, 20, y); y += step + 5;

      // ABSENT
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(`[Absent (在场检测)] ${isAbsent ? 'ABSENT' : 'PRESENT'}`, 20, y); y += step + 10;

      ctx.fillStyle = "#FFFF00";
      ctx.fillText(`--- WINDOW (10s 窗口数据) ---`, 20, y); y += step;
      const wTime = (Date.now() - windowStartTimeRef.current) / 1000;
      ctx.fillText(`Elapsed (已过时间): ${wTime.toFixed(1)}s`, 20, y); y += step;
      ctx.fillText(`Frames Collected (采集帧数): ${windowFrameScoresRef.current.length}`, 20, y); y += step;

      ctx.restore();

      // Update UI State
      setFocusState(frameFocusState);
      setFocusScore(frameScore);

      // --- DATA ACCUMULATION (ACTIVE PHASE ONLY) ---
      if (!isPaused && sessionState === 'ACTIVE' && phase === 'WORK') {
          // Push Frame Data
          windowFrameScoresRef.current.push({
              score: frameScore,
              isAbsent: isAbsent,
              timestamp: Date.now()
          });

          // Check Window Flush (10s)
          if (Date.now() - windowStartTimeRef.current >= 10000) {
              flushWindow();
          }
          
          // Check Minute Flush (60s)
          // Note: Minute logic relies on Date.now() diff from minuteStartTimeRef
          if (Date.now() - minuteStartTimeRef.current >= 60000) {
              finalizeMinute();
          }
      }
  };

  const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

  const retryInit = () => {
      const runInit = async () => {
         const s = await initPipeline();
      };
      runInit();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden font-sans">
        
        {/* VIDEO LAYER */}
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

        {/* BREAK LAYER (With integrated Self Assessment) */}
        <AnimatePresence>
            {isBreak && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gradient-to-br from-blue-900 to-black flex flex-col items-center justify-center z-40"
                >
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="z-20 text-center px-6 w-full max-w-md">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-6 ring-4 ring-blue-500/10">
                            {phase === 'SHORT_BREAK' ? <Coffee size={32} className="text-blue-300"/> : <Armchair size={32} className="text-emerald-300"/>}
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">{phase === 'SHORT_BREAK' ? t.recharge : t.rest}</h2>
                        <p className="text-blue-200/80 mb-8">{t.breathe}</p>
                        
                        <div className="text-6xl font-mono font-light text-white mb-8">{formatTime(timeLeft)}</div>
                        
                        <button onClick={skipBreak} className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white font-semibold transition-colors flex items-center gap-2 mx-auto mb-8">
                            <FastForward size={18} /> {t.skipBreak}
                        </button>

                        {/* SELF ASSESSMENT INLINE */}
                        <AnimatePresence>
                            {isRatingPending && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="bg-black/30 backdrop-blur-md rounded-2xl p-4 border border-white/10"
                                >
                                    <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3">How was your focus?</p>
                                    <div className="grid grid-cols-4 gap-2">
                                        <button onClick={() => handleRatingClick(FocusLevel.FLOW)} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-purple-500/20 transition-colors group">
                                            <div className="text-purple-300 group-hover:text-purple-400 group-active:scale-90 transition-transform"><Sparkles size={20} /></div>
                                            <span className="text-[9px] font-bold text-white/80">FLOW</span>
                                        </button>
                                        <button onClick={() => handleRatingClick(FocusLevel.FOCUSED)} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-green-500/20 transition-colors group">
                                            <div className="text-green-300 group-hover:text-green-400 group-active:scale-90 transition-transform"><Brain size={20} /></div>
                                            <span className="text-[9px] font-bold text-white/80">GOOD</span>
                                        </button>
                                        <button onClick={() => handleRatingClick(FocusLevel.LOW_FOCUS)} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-yellow-500/20 transition-colors group">
                                            <div className="text-yellow-300 group-hover:text-yellow-400 group-active:scale-90 transition-transform"><Battery size={20} /></div>
                                            <span className="text-[9px] font-bold text-white/80">LOW</span>
                                        </button>
                                        <button onClick={() => handleRatingClick(FocusLevel.DISTRACTED)} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-red-500/20 transition-colors group">
                                            <div className="text-red-300 group-hover:text-red-400 group-active:scale-90 transition-transform"><AlertTriangle size={20} /></div>
                                            <span className="text-[9px] font-bold text-white/80">BAD</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* SUMMARY LAYER */}
        <AnimatePresence>
            {sessionState === 'SUMMARY' && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="absolute inset-0 bg-[#f2f2f7] dark:bg-black z-50 flex flex-col pt-safe-top pb-safe overflow-y-auto no-scrollbar"
                >
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
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-200">
                            <Sparkles size={48} className="text-green-600" />
                        </motion.div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t.complete}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{t.focusedFor} <span className="text-green-600 font-bold">{formatMinutes(totalFocusedSecondsRef.current / 60)}</span>.</p>
                    </div>

                    <div className="px-6 mt-8 space-y-4 pb-20 relative z-10">
                        {task && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-900/50">
                                <div className="flex items-start gap-4">
                                    <div onClick={() => { setIsTaskCompleted(!isTaskCompleted); NativeService.Haptics.impactLight(); }} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${isTaskCompleted ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent'}`}>
                                        {isTaskCompleted && <CheckCircle2 size={18} className="text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{task.title}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{isTaskCompleted ? t.taskCompleted : (didFinishNaturally ? t.markAsDone : t.earlyStop)}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-800 dark:text-gray-200">{t.cycleLog}</h3>
                            </div>
                            
                            {cycleRecordsRef.current.length === 0 ? (
                                <div className="h-32 flex items-center justify-center text-gray-400 text-sm italic">
                                    No cycle data recorded.
                                </div>
                            ) : (
                                <div className="relative h-40 flex items-end justify-start gap-2 overflow-x-auto no-scrollbar pb-6 w-full px-2">
                                    {cycleRecordsRef.current.map((record, i) => {
                                        const finalH = (levelToNumber(record.finalLevel || FocusLevel.DISTRACTED) + 1) * 25; // 25, 50, 75, 100%
                                        const color = record.finalLevel === FocusLevel.FLOW ? 'bg-purple-500' :
                                                      record.finalLevel === FocusLevel.FOCUSED ? 'bg-green-500' :
                                                      record.finalLevel === FocusLevel.LOW_FOCUS ? 'bg-yellow-500' : 'bg-red-500';
                                        
                                        return (
                                            <div key={i} className="flex-1 min-w-[32px] flex flex-col items-center justify-end h-full gap-1">
                                                <div className="text-[10px] font-bold text-gray-400">#{i+1}</div>
                                                <motion.div 
                                                    initial={{ height: 0 }} 
                                                    animate={{ height: `${finalH}%` }} 
                                                    className={`w-full rounded-md ${color} relative group`}
                                                >
                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] p-2 rounded w-max opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                                                        <div className="font-bold text-yellow-300">Final: {record.finalLevel || 'Skipped'}</div>
                                                    </div>
                                                </motion.div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm text-center">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{cycleRecordsRef.current.length}</div>
                                <div className="text-xs text-gray-400 uppercase tracking-wider">Valid Cycles</div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm text-center">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {cycleRecordsRef.current.filter(r => r.finalLevel === FocusLevel.FLOW).length}
                                </div>
                                <div className="text-xs text-gray-400 uppercase tracking-wider">Flow Cycles</div>
                            </div>
                        </div>
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#f2f2f7] dark:from-black via-[#f2f2f7] dark:via-black to-transparent z-20">
                        <button onClick={handleFinish} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform">
                            {t.backHome}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* ACTIVE HUD */}
        { (sessionState === 'ACTIVE' && !isBreak && !isRatingPending) && (
            <div className={`absolute inset-0 z-10 flex flex-col items-center justify-between text-white pointer-events-none transition-opacity duration-300 ${showCameraPreview ? 'opacity-30' : 'opacity-100'}`}>
                 <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />
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
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1 opacity-60">
                                        <Monitor size={10} className="text-white" />
                                        <span className="text-[10px] font-mono text-white">{debugInfo}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsSoundMenuOpen(true)} className="bg-white/20 p-1.5 rounded-lg hover:bg-white/40 pointer-events-auto backdrop-blur-md"><Headphones size={14} /></button>
                                        <button onClick={() => setShowCameraPreview(!showCameraPreview)} className="bg-white/20 p-1.5 rounded-lg hover:bg-white/40 pointer-events-auto backdrop-blur-md">
                                            {showCameraPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="relative flex flex-col items-center justify-center gap-4">
                        <svg className="w-14 h-14 transform -rotate-90">
                            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-800" />
                            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={2 * Math.PI * 24} strokeDashoffset={2 * Math.PI * 24 * (1 - focusScore / 100)} className={`${getStatusColor()} transition-all duration-500`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                             {focusState === 'DEEP_FLOW' ? <Brain size={20} className="text-indigo-400" /> : focusState === 'DISTRACTED' ? <AlertTriangle size={20} className="text-red-500" /> : <UserIcon size={20} className="text-green-400" />}
                        </div>
                    </div>
                </div>

                <button onClick={handleDebugFastForward} className="absolute bottom-28 left-6 z-[60] bg-red-600/90 text-white w-12 h-12 rounded-full shadow-2xl border-2 border-white/20 flex items-center justify-center pointer-events-auto active:scale-95 transition-transform" title="Debug: Skip 30 mins"><Bug size={24} /></button>

                <div className="relative flex flex-col items-center justify-center drop-shadow-2xl">
                    <div className="h-10 mb-4 flex flex-col items-center">
                        <AnimatePresence mode="wait">
                            {notificationMsg && (
                                <motion.div key="toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-lg border border-white/10">
                                    <Bell size={14} className="text-white" />
                                    <span className="font-bold text-sm tracking-wide text-white">{notificationMsg}</span>
                                </motion.div>
                            )}
                            {!notificationMsg && isTooClose && (
                                <motion.div key="too_close" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-orange-500/90 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-orange-900/50">
                                    <Monitor size={14} className="text-white" />
                                    <span className="font-bold text-xs tracking-wide">{t.tooClose}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="relative text-center">
                        <span className="text-8xl font-mono font-light tracking-tighter tabular-nums text-white">{formatTime(timeLeft)}</span>
                        {isPaused ? <div className="absolute inset-0 flex items-center justify-center"><button onClick={handlePauseToggle} className="bg-black/50 backdrop-blur-sm px-4 py-1 rounded text-sm font-bold tracking-widest uppercase border border-white/20 cursor-pointer">{t.paused}</button></div> : mode === TimerMode.POMODORO && <div className="flex justify-center gap-1 mt-2">{[...Array(targetRounds)].map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${i < roundsCompleted ? 'bg-green-500' : (i === roundsCompleted) ? 'bg-white animate-pulse' : 'bg-gray-600'}`} />)}</div>}
                    </div>
                </div>

                <div className="relative w-full pb-safe mb-8 flex flex-col justify-end pointer-events-auto">
                    <div className="flex items-center justify-around mb-8 px-10">
                        <button onClick={handleShowSummary.bind(null, false)} className="w-16 h-16 rounded-full bg-gray-800/60 backdrop-blur-md flex items-center justify-center text-white/70 hover:bg-gray-700 transition-colors"><Square size={24} fill="currentColor" /></button>
                        <button onClick={handlePauseToggle} className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-2xl active:scale-95 transition-transform">{isPaused ? <Play size={32} fill="black" className="ml-1" /> : <Pause size={32} fill="black" />}</button>
                        <div className="w-16 h-16" />
                    </div>
                    {!isPremium && <div className="relative z-20"><AdBanner onRemoveAds={onUpgradeTrigger} /></div>}
                </div>
            </div>
        )}

        <SoundSelector isOpen={isSoundMenuOpen} onClose={() => setIsSoundMenuOpen(false)} settings={settings} setSettings={setSettings} />

        {(sessionState === 'INIT' || sessionState === 'ERROR') && (
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-white px-8 text-center z-20">
                {sessionState === 'ERROR' ? (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <Bug size={48} className="text-red-500 mb-4" />
                        <h2 className="text-xl font-bold mb-2">Init Failed</h2>
                        <p className="text-gray-400 mb-6 text-sm whitespace-pre-line">{errorMessage}</p>
                        <button onClick={retryInit} className="w-full px-6 py-3 rounded-full bg-white text-black font-bold flex items-center justify-center gap-2"><RotateCcw size={16}/> Retry</button>
                        <button onClick={() => { setIsAiDisabled(true); setSessionState('COUNTDOWN'); }} className="w-full px-6 py-3 rounded-full bg-blue-900/30 text-blue-400 font-semibold text-xs mt-2">Start without AI</button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-gray-800 border-t-blue-500 rounded-full animate-spin mb-6" />
                        <h2 className="text-lg font-bold">{loadingStatus}</h2>
                    </div>
                )}
            </div>
        )}

        {sessionState === 'COUNTDOWN' && (
             <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                <motion.div key={countdown} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }} className="text-[120px] font-bold text-white font-mono drop-shadow-2xl">{countdown}</motion.div>
                <p className="text-white/80 mt-8 font-medium animate-pulse">Sit naturally for calibration...</p>
             </div>
        )}
    </div>
  );
};

export default FocusSessionView;