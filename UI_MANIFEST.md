
# UI COMPONENT MANIFEST (资产保护清单) v2.0

> **PURPOSE**: This file acts as the "Master Inventory" for STAGE 1 of the `AI_WORKFLOW_PROTOCOL`.
> **AUTHORITY**: This is the Single Source of Truth for non-regressible features.

## 🔴 ENFORCEMENT RULE (强制执行规则)
For any code generation or modification task:
1.  **Mandatory Reference**: The AI **must explicitly reference** this manifest during STAGE 1 (Analysis).
2.  **Zero Tolerance**: Every item listed under the target file **MUST be accounted for** in STAGE 4 (Verification).
3.  **Invalidation**: Missing ANY item listed here **invalidates the output**, regardless of whether the new feature works. The AI must retry.

---

## 1. `views/TasksView.tsx` (High Risk Area)
*   **State Logic**:
    *   `generateCalendarGrid`: Date calculation logic.
    *   `groupedTasks`: Memoized task sorting.
*   **Main UI**:
    *   `WeekStrip`: Horizontal scrollable date picker (7 days).
    *   `TaskScrollArea`: The main list of tasks.
    *   `FloatingActionButton`: The "+" button at bottom right.
*   **The Modal (TaskForm)**:
    *   `AnimatePresence`: Wraps the modal for slide-up effect.
    *   `TitleInput`: Main text field.
    *   `DateSelector` & `TimeSelector`: Expandable rows using `IOSWheelPicker`.
    *   `PrioritySelector`: Segmented Control (Low/Med/High).
    *   **`DurationSlider`**: Range slider for minutes (CRITICAL: Often deleted by AI).
    *   **`PomodoroStepper`**: +/- buttons for round count (CRITICAL: Often deleted by AI).
    *   **`NoteTextarea`**: Text area for details (CRITICAL: Often deleted by AI).

## 2. `views/TimerView.tsx`
*   **Visuals**:
    *   `TimeDisplay`: Extra large font for countdown.
    *   `CircularProgress` / `Timeline`: Visual representation of time.
*   **Controls**:
    *   `ModeSelector`: Segmented control (Pomodoro/Stopwatch/Custom).
    *   `QuickSettings`: Collapsible panel for adjusting time settings.
    *   `SoundButton`: Toggles sound menu.

## 3. `views/FocusSessionView.tsx` (AI Core)
*   **Hardware**:
    *   `CameraPreview`: The `<video>` element (flipped).
*   **Overlays**:
    *   `HUD`: Displays "Focus Score" and "State".
    *   `StatusBadge`: Shows "Deep Flow", "Distracted", etc.
*   **Monetization**:
    *   `AdBanner`: Bottom component for free users.

## 4. `App.tsx` (Wiring)
*   **Routing**:
    *   `activeTab` conditional rendering.
    *   **Prop Passing**: Must pass `user` and `onUpgradeTrigger` to `FocusSessionView`.
