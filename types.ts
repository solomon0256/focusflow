
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

export type ThemeMode = 'system' | 'light' | 'dark'; // New Theme Type

export interface Settings {
  workTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  pomodorosPerRound: number;
  notifications: number[]; // Used for POMODORO mode
  customNotifications: number[]; // Used for CUSTOM mode
  stopwatchNotifications: number[]; // Used for STOPWATCH mode
  language: LanguageCode;
  batterySaverMode: boolean; // New Power Saver Toggle
  
  // --- THEME SETTINGS ---
  theme: ThemeMode;

  // --- AUDIO SETTINGS ---
  soundEnabled: boolean;
  soundMode: SoundMode;
  selectedSoundId: string;
  soundVolume: number; // 0.0 to 1.0
}

export interface FocusRecord {
    id: string;
    date: string; // YYYY-MM-DD
    durationMinutes: number;
    mode: TimerMode;
    score?: number; // 0-100, Focus Quality Score
}

// --- PET SYSTEM TYPES ---
export interface PetState {
    level: number;
    currentExp: number;
    maxExp: number;
    happiness: number;
    lastDailyActivityDate: string; // YYYY-MM-DD
    streakCount: number;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    isPremium: boolean;
    planExpiry?: string;
    pet: PetState; // Added Pet State
}

// --- NEW SAAS TYPES ---
export type PlanInterval = 'month' | 'year' | 'lifetime';

export interface Product {
    id: string;        // The ID used in Apple/Google stores (e.g., 'com.focusflow.monthly')
    name: string;      // Display name (e.g., 'Monthly Pro')
    price: string;     // Display price (e.g., '$2.99')
    interval: PlanInterval; 
    description: string;
    tag?: string;      // Optional tag like "Best Value"
}