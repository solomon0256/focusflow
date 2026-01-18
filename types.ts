
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

export interface Settings {
  workTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  pomodorosPerRound: number;
}

export interface FocusRecord {
    id: string;
    date: string; // YYYY-MM-DD
    durationMinutes: number;
    mode: TimerMode;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    isPremium: boolean;
    planExpiry?: string;
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
