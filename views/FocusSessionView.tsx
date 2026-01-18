import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Square, Play, Pause, Brain, AlertTriangle, Activity, WifiOff, ScanFace, Eye, EyeOff, User, BatteryWarning } from 'lucide-react';
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

// --- CONFIGURATION ---
const CDN_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm";
const CDN_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

const THRESHOLD_YAW_DRIFT = 0.15;   // Looking away (Left/Right)
const THRESHOLD_PITCH_DROP = 0.15;  // Slouching (Nose goes down)

type SessionState = 'INIT' | 'COUNTDOWN' | 'CALIBRATING' | 'ACTIVE' | 'ERROR';
type FocusStateType = 'DEEP_FLOW' | 'FOCUSED' | 'FATIGUE' | 'DISTRACTED';

// --- GLOBAL SINGLETON CACHE ---
// Prevents reloading the heavy WASM model between sessions
let cachedLandmarker: PoseLandmarker | null = null;
let isModelLoading = false;

const FocusSessionView: React.FC<FocusSessionViewProps> = ({ mode, initialTimeInSeconds, task, onComplete, onCancel }) => {
  // --- UI States ---
  const [sessionState, setSessionState] = useState<SessionState>('INIT');
  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
  const [isPaused, setIsPaused] = useState(false);
  
  // Countdown
  const [countdown, setCountdown] = useState(3);

  // AI & Feedback States
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing Engine...');
  const [showCameraPreview, setShowCameraPreview] = useState(false);

  // --- AI Logic Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);

  // Calibration Data (The "Zero Point")
  const calibrationRef = useRef<{
      noseBase: { x: number, y: number } | null;
  }>({ noseBase: null });

  // Sliding Window Buffers
  const stateBufferRef = useRef<FocusStateType[]>([]); 
  
  // Current Real-time State
  const [focusState, setFocusState] = useState<FocusStateType>('FOCUSED');

  // 1. Wake Lock
  useEffect(() => {
      NativeService.Screen.keepAwake();
      return () => { NativeService.Screen.allowSleep(); };
  }, []);

  // 2. Timer Logic
  useEffect(() => {
    let interval: any;
    if (sessionState === 'ACTIVE' && !isPaused && timeLeft > 0) {
        interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onComplete(Math.floor(initialTimeInSeconds / 60));
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionState, isPaused, timeLeft, onComplete, initialTimeInSeconds]);

  // 3. Initialization Pipeline
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    const setupPipeline = async () => {
        try {
            // A. Camera
            setLoadingStatus('Accessing Camera...');
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 15 }
                },
                audio: false
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            // B. AI Model
            if (cachedLandmarker) {
                console.log("Using Cached AI Model");
                poseLandmarkerRef.current = cachedLandmarker;
            } else {
                if (!isModelLoading) {
                    isModelLoading = true;
                    setLoadingStatus('Loading Neural Network...');
                    const vision = await FilesetResolver.forVisionTasks(CDN_WASM_URL);
                    cachedLandmarker = await PoseLandmarker.createFromOptions(vision, {
                        baseOptions: { 
                            modelAssetPath: CDN_MODEL_URL, 
                            delegate: "GPU"
                        },
                        runningMode: "VIDEO",
                        numPoses: 1,
                        minPoseDetectionConfidence: 0.5
                    });
                    isModelLoading = false;
                } else {
                    // Wait for other thread
                    while (!cachedLandmarker) {
                        await new Promise(r => setTimeout(r, 100));
                    }
                }
                poseLandmarkerRef.current = cachedLandmarker;
            }

            if (isMounted) setSessionState('COUNTDOWN');

        } catch (err: any) {
            console.error("Init Error:", err);
            isModelLoading = false;
            if (isMounted) {
                setErrorMessage('Camera access denied or AI failed.');
                setSessionState('ERROR');
            }
        }
    };

    setupPipeline();

    return () => {
        isMounted = false;
        if (stream) stream.getTracks().forEach(track => track.stop());
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // 4. Countdown & Calibration Trigger
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

  // Helper: Perform Calibration
  const performCalibration = () => {
      const landmarker = poseLandmarkerRef.current;
      const video = videoRef.current;
      
      if (landmarker && video && video.readyState >= 2) {
          // Take snapshot of current face position as "ideal"
          const result = landmarker.detectForVideo(video, performance.now());
          if (result.landmarks && result.landmarks.length > 0) {
              const nose = result.landmarks[0][0]; // Nose is index 0
              calibrationRef.current.noseBase = { x: nose.x, y: nose.y };
          }
      }
      setSessionState('ACTIVE');
      startDetectionLoop();
  };

  // 5. Main AI Loop
  const startDetectionLoop = () => {
      const loop = () => {
          if (sessionState === 'ERROR') return;
          
          const video = videoRef.current;
          const landmarker = poseLandmarkerRef.current;
          
          if (video && landmarker && !isPaused && video.readyState >= 2) {
             if (video.currentTime !== lastVideoTimeRef.current) {
                 lastVideoTimeRef.current = video.currentTime;
                 const result = landmarker.detectForVideo(video, performance.now());
                 
                 // Process Logic
                 if (result.landmarks && result.landmarks.length > 0) {
                    const landmarks = result.landmarks[0];
                    const nose = landmarks[0];
                    
                    // Check Distraction vs Baseline
                    if (calibrationRef.current.noseBase) {
                        const base = calibrationRef.current.noseBase;
                        const dx = Math.abs(nose.x - base.x);
                        const dy = nose.y - base.y; 
                        
                        let currentState: FocusStateType = 'FOCUSED';
                        
                        if (dx > THRESHOLD_YAW_DRIFT) currentState = 'DISTRACTED'; // Looking side
                        else if (dy > THRESHOLD_PITCH_DROP) currentState = 'FATIGUE'; // Slouching
                        
                        // Buffer state to prevent flickering
                        stateBufferRef.current.push(currentState);
                        if (stateBufferRef.current.length > 30) stateBufferRef.current.shift();
                        
                        // Determine dominant state
                        const counts = stateBufferRef.current.reduce((acc, val) => {
                            acc[val] = (acc[val] || 0) + 1;
                            return acc;
                        }, {} as Record<string, number>);
                        
                        const dominant = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) as FocusStateType;
                        setFocusState(dominant);
                    }
                 }
             }
          }
          requestRef.current = requestAnimationFrame(loop);
      };
      loop();
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- RENDER ---

  // 1. Loading / Error
  if (sessionState === 'INIT' || sessionState === 'ERROR') {
      return (
          <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center p-6 z-50">
               {sessionState === 'ERROR' ? (
                   <>
                     <AlertTriangle size={48} className="text-red-500 mb-4" />
                     <h2 className="text-xl font-bold text-center mb-2">Session Error</h2>
                     <p className="text-gray-400 text-center mb-6">{errorMessage}</p>
                     <button onClick={onCancel} className="px-6 py-3 bg-white text-black rounded-full font-bold">Go Back</button>
                   </>
               ) : (
                   <>
                     <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"/>
                     <p className="font-mono text-sm animate-pulse">{loadingStatus}</p>
                   </>
               )}
          </div>
      );
  }

  // 2. Countdown
  if (sessionState === 'COUNTDOWN') {
      return (
          <div className="fixed inset-0 bg-blue-600 text-white flex flex-col items-center justify-center z-50">
              <div className="text-[10rem] font-bold leading-none">{countdown > 0 ? countdown : 'GO'}</div>
              <p className="mt-4 text-blue-200 font-medium">Align your face with the camera</p>
              <video ref={videoRef} className="absolute opacity-0 pointer-events-none" autoPlay playsInline muted />
          </div>
      );
  }

  // 3. Active Session
  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col z-50 overflow-hidden">
        {/* Background Video Stream (Preview) */}
        <div className="absolute inset-0 z-0 opacity-30">
             <video 
                ref={videoRef} 
                className={`w-full h-full object-cover transform scale-x-[-1] ${!showCameraPreview && 'opacity-0'}`} 
                autoPlay 
                playsInline 
                muted 
             />
        </div>

        {/* Header */}
        <div className="relative z-10 p-6 flex justify-between items-start">
            <button onClick={onCancel} className="p-2 bg-white/10 backdrop-blur-md rounded-full">
                <X size={24} />
            </button>
            <div className="flex gap-2">
                 <button onClick={() => setShowCameraPreview(!showCameraPreview)} className="p-2 bg-white/10 backdrop-blur-md rounded-full">
                    {showCameraPreview ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
            </div>
        </div>

        {/* Main Display */}
        <div className="flex-1 relative z-10 flex flex-col items-center justify-center">
             <div className="mb-8 relative">
                 <div className={`w-64 h-64 rounded-full border-4 flex items-center justify-center relative
                    ${focusState === 'FOCUSED' ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 
                      focusState === 'DISTRACTED' ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 
                      'border-yellow-500'}
                    transition-all duration-500
                 `}>
                    <div className="text-center">
                        <div className="text-6xl font-mono font-bold tracking-tighter tabular-nums">
                            {formatTime(timeLeft)}
                        </div>
                        <div className="text-sm font-medium mt-2 text-gray-400 uppercase tracking-widest">
                            {isPaused ? 'PAUSED' : focusState}
                        </div>
                    </div>
                 </div>
             </div>
             
             {task && (
                 <div className="max-w-xs text-center">
                     <div className="text-xs font-bold text-gray-500 uppercase mb-1">Working on</div>
                     <h2 className="text-xl font-semibold line-clamp-2">{task.title}</h2>
                 </div>
             )}
        </div>

        {/* Controls */}
        <div className="relative z-10 p-8 pb-12 flex justify-center gap-6">
             {isPaused ? (
                 <button onClick={() => { setIsPaused(false); startDetectionLoop(); }} className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                     <Play size={32} fill="currentColor" />
                 </button>
             ) : (
                 <button onClick={() => setIsPaused(true)} className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                     <Pause size={32} fill="currentColor" />
                 </button>
             )}
             <button onClick={() => onComplete(Math.floor((initialTimeInSeconds - timeLeft) / 60))} className="w-20 h-20 bg-red-500/20 backdrop-blur-md border border-red-500/50 text-red-500 rounded-full flex items-center justify-center active:scale-95 transition-transform">
                 <Square size={28} fill="currentColor" />
             </button>
        </div>
    </div>
  );
};

export default FocusSessionView;