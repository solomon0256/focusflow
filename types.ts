
export enum TimerMode {
  POMODORO = 'POMODORO',
  STOPWATCH = 'STOPWATCH',
  CUSTOM = 'CUSTOM'
}

export enum TimerStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  BREAK = 'BREAK'
}

export enum Priority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export interface Task {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  durationMinutes: number;
  priority: Priority;
  completed: boolean;
  pomodoroCount: number;
  note?: string;
}

export type LanguageCode = 'en' | 'zh' | 'zh-TW' | 'fr' | 'ja' | 'ko' | 'es' | 'ru' | 'ar' | 'de' | 'hi';

export type SoundMode = 'timer' | 'always';

export type ThemeMode = 'system' | 'light' | 'dark';

export type TimeFormat = '12h' | '24h';

export interface Settings {
  workTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  pomodorosPerRound: number;
  notifications: number[]; 
  customNotifications: number[]; 
  stopwatchNotifications: number[]; 
  language: LanguageCode;
  batterySaverMode: boolean; 
  theme: ThemeMode;
  timeFormat: TimeFormat;
  soundEnabled: boolean;
  soundMode: SoundMode;
  selectedSoundId: string;
  soundVolume: number; 
}

// --- NEW FOCUS METRICS ---

export enum FocusLevel {
  DISTRACTED = 'DISTRACTED', // 0
  LOW_FOCUS = 'LOW_FOCUS',   // 1
  FOCUSED = 'FOCUSED',       // 2
  FLOW = 'FLOW'              // 3
}

export interface CycleRecord {
  cycleIndex: number;         
  phaseType: 'WORK';          
  durationSec: number;        
  cameraLevel: FocusLevel | null; 
  selfLevel: FocusLevel | null;   
  finalLevel: FocusLevel | null;  
  createdAtMs: number;
}

export interface FocusRecord {
    id: string;
    date: string; // YYYY-MM-DD
    durationMinutes: number;
    mode: TimerMode;
    score?: number; 
    cycles?: CycleRecord[]; // Added for detailed tracking
}

// --- PET SYSTEM TYPES ---
export interface PetState {
    level: number;
    currentExp: number;
    maxExp: number;
    happiness: number;
    lastDailyActivityDate: string; 
    streakCount: number;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    isPremium: boolean;
    planExpiry?: string;
    pet: PetState; 
}

export type PlanInterval = 'month' | 'year' | 'lifetime';

export interface Product {
    id: string;        
    name: string;      
    price: string;     
    interval: PlanInterval; 
    description: string;
    tag?: string;      
}
