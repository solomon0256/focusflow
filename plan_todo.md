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

## Phase 3: Commercial & Polish (In Progress) 🔄
- [x] **AdBanner Component**: Monetization placeholder.
- [x] **Freemium Logic**: 
    - Free: Distraction Detection (Yaw).
    - Paid: Posture/Fatigue Detection (Pitch).
- [ ] **Capacitor Integration**: Native wrapper for iOS.
- [ ] **Notifications**: Local push for timer end.

## Known Issues
- Safari on iOS might block camera if not requested correctly (HTTPS required).
- Need to ensure `user` state is correctly passed to FocusSession for Premium check.
