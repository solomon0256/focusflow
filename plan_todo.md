# FocusFlow Development Plan

## Phase 1: Core Foundation (Completed) ✅
- [x] iOS-style UI Layout (Tailwind + Framer Motion)
- [x] Bottom Navigation (Timer, Tasks, Stats, Settings)
- [x] Task Management System (CRUD, Local Storage)
- [x] Basic Pomodoro Timer

## Phase 2: AI Vision Integration (Stable) ✅
- [x] Integrate MediaPipe Tasks Vision (WASM)
- [x] Real-time Face/Pose Detection
- [x] "Desk Mode" Logic (Tolerance for Yaw/Pitch)
- [x] Focus State Logic (Deep Flow vs Distracted)

## Phase 3: Commercial & Polish (Current) 🔄
- [x] **AdBanner Component**: Restored and functional.
- [x] **Freemium Logic**: 
    - Free: Distraction Detection (Yaw).
    - Paid: Posture/Fatigue Detection (Pitch).
- [x] **Battery Saver Mode**: 
    - Dynamic FPS throttling (200ms vs 500ms).
    - Resolution scaling (VGA vs nHD).
- [x] **Chart Fixes**: Timeline scrolling and float precision.
- [ ] **Pet System Visuals**: Animate the FOX!
- [ ] **Capacitor Integration**: Native wrapper for iOS.
- [ ] **Notifications**: Local push for timer end.

## Known Issues
- Safari on iOS might block camera if not requested correctly (HTTPS required).
- Native background timer requires Capacitor plugin (current web version pauses in background).