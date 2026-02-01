
# CODEBASE DEEP INDEX (深度代码索引)

> **HISTORICAL WARNING**: This project has suffered from "Code Eating" (Lazy deletion of UI features). 
> **STRICT RULE**: When modifying a file, you must verify your output against the detailed structure below. If a node listed here is missing in your output, you have FAILED.

## 🔴 CRITICAL FILE: `views/TasksView.tsx`
**Status**: DAMAGED. Needs restoration of Duration Slider, Pomodoro Stepper, and Notes.

### 1. State Variables (Must Preserve)
*   `selectedDate` (Date): Current calendar cursor.
*   `isModalOpen` (boolean): Controls `TaskForm` visibility.
*   `editingTask` (Task | null): Mode switch (Create vs Edit).
*   **Form States**:
    *   `formTitle` (string)
    *   `formPriority` (Priority enum)
    *   `formDuration` (number): **Linked to Slider (Missing in current code)**.
    *   `formPomodoros` (number): **Linked to Stepper (Missing in current code)**.
    *   `formNote` (string): **Linked to Textarea (Missing in current code)**.
    *   `selectedDates` (Set<string>): Multi-date selection.
    *   `formTime` / `wHour12` / `wMinute` / `wAmPm`: Time picker logic.

### 2. Logic Functions
*   `generateCalendarGrid(cursorDate)`: Returns `(Date | null)[]`.
*   `handleSave()`: Handles both `addTask` (loop through dates) and `updateTask`.
*   `to12h` / `to24h`: Time conversion utilities.

### 3. UI Component Tree (The DOM Structure)
*   `Container` (pt-safe-top, pb-32)
    *   `Header`: Title + Date String.
    *   `WeekStrip`: Horizontal scroll list of 7 days.
    *   `TaskScrollArea`:
        *   `EmptyState`: (CalendarDays icon)
        *   `TaskGroups` (Mapped by date):
            *   `TaskCard`: Check circle, Title, Tag Row (Time, Priority, Pomos, Duration).
    *   `FloatingActionButton` (Plus icon): Opens modal.
    *   **`Modal` (AnimatePresence)**:
        *   `Header`: Title ("New Task" / "Edit") + Close Button.
        *   `FormBody`:
            *   `TitleInput`: Large text input.
            *   `DateSelector`: Row with expander -> Calendar Grid.
            *   `TimeSelector`: Row with expander -> IOSWheelPickers.
            *   `PrioritySelector`: Segmented Control (Low/Med/High).
            *   **[MISSING] `DurationRow`**: Label + Slider + Minutes Display.
            *   **[MISSING] `PomodoroRow`**: Label + Stepper (- 1 +) + Count Display.
            *   **[MISSING] `NoteRow`**: Textarea for `formNote`.
            *   `DeleteButton` (Only if editing).
        *   `Footer`: Save Button (Black/White).

---

## 🔴 CRITICAL FILE: `App.tsx`
**Status**: DAMAGED. Missing `onUpgradeTrigger` prop passing.

### 1. Global State
*   `user` (User | null): Sourced from NativeService.Storage.
*   `settings` (Settings): Includes `soundMode`, `theme`, etc.
*   `tasks` (Task[]): The master task list.
*   `isFocusSessionActive` (bool): Controls view switching.
*   `currentSessionParams`: { mode, duration, taskId }.

### 2. Critical Logic
*   `handleSessionComplete`: Updates `focusHistory` and marks task complete.
*   `useEffect(AudioService)`: Manages background music lifecycle.
*   `onUserInteraction`: Unlocks AudioContext.

### 3. Render Tree
*   `Root` (h-screen, bg-ios-bg)
    *   **Conditional Render**:
        *   IF `isFocusSessionActive`:
            *   `<FocusSessionView>`
                *   **[CRITICAL PROP]** `user={user}`
                *   **[CRITICAL PROP]** `onUpgradeTrigger={() => setActiveTab('settings')}`
        *   ELSE:
            *   `activeTab === 'timer'`: `<TimerView>`
            *   `activeTab === 'tasks'`: `<TasksView>`
            *   `activeTab === 'stats'`: `<StatsView>`
            *   `activeTab === 'settings'`: `<SettingsView>`
    *   `<BottomNav>` (Visible only when not in session).

---

## 🟢 CRITICAL FILE: `views/TimerView.tsx`
**Status**: STABLE. Complex UI logic that must not be simplified.

### 1. State Variables
*   `mode` (TimerMode): Controls Pomodoro vs Stopwatch vs Custom.
*   `isQuickSettingsOpen` (boolean): Controls the settings dropdown.
*   `isSoundSelectorOpen` (boolean): Controls the sound modal.
*   `customDuration` (number): State for Custom Mode slider.
*   `selectedTaskId` (string | null): The active task being focused on.

### 2. UI Component Tree
*   `Container` (Gradient background layer)
*   `Header`:
    *   `ControlStrip`: 
        *   `IOSSegmentedControl` (Mode switcher).
        *   `SoundButton` (Headphones icon).
        *   `QuickSettingsButton` (Sliders icon).
    *   `StatusBadge`: "Ready to Flow".
    *   **`TimeDisplay`**: Massive font (18vw).
*   `MiddleSection` (AnimatePresence Flow):
    *   **`PomodoroBlock`**:
        *   `Timeline`: Visual segments (Work/Break/LongBreak).
        *   `QuickSettingsPanel` (Collapsible):
            *   `QuickSlider` rows (Focus, Short Break, Long Break).
            *   `NotificationPanel`: Tag list + Add button.
    *   **`CustomBlock`**:
        *   `DurationSlider`: Large range input.
    *   **`StopwatchBlock`**:
        *   Simple active indicator.
*   `TaskSlider` (Bottom Area):
    *   `TaskCard` (Swipeable/Switchable).
    *   `NavigationArrows` (Left/Right).
*   `StartButton`: Large Floating Action Button with Play icon.

---

## 🟢 CRITICAL FILE: `views/FocusSessionView.tsx`
**Status**: STABLE. The AI core. HIGH RISK of regression.

### 1. Key Logic (AI & Timer)
*   `poseLandmarkerRef`: Holds the MediaPipe WASM instance. Do not remove initialization logic.
*   `analyzePose_Debug_Visualization`: Frame-by-frame analysis loop.
*   `useEffect` (Timer): Uses `Date.now()` delta calculation (Drift-proof), NOT simple `setInterval` decrement.
*   `handleShowSummary`: Triggered on completion or manual stop.

### 2. UI Component Tree
*   `Root` (Fixed inset-0, z-50)
    *   **`VideoLayer`**: 
        *   `<video>`: The camera feed (opacity controlled by logic).
        *   `<canvas>`: For debug drawing (face mesh lines).
    *   **`BreakLayer`** (Conditional):
        *   Blue/Black gradient overlay.
        *   `Icon` (Coffee/Armchair).
        *   `SkipButton`.
    *   **`SummaryLayer`** (Conditional):
        *   `Confetti`: Particle effects.
        *   `StatsGrid`: Avg Focus, Posture.
        *   **`TimelineChart`**: Bar chart showing focus quality over time.
        *   `HomeButton`.
    *   **`ActiveHUD`** (Visible during work):
        *   `TopBar`: 
            *   `FocusGuard` / `ProPosture` badges.
            *   `FocusGauge`: Circular SVG meter showing focus score.
        *   `Middle`:
            *   **`TimeDisplay`**: Large white font.
            *   `AlertPills`: "Flow State", "Distracted", "Too Close".
        *   `BottomControl`:
            *   `PauseButton` / `StopButton`.
            *   **`AdBanner`** (Conditional: `!isPremium`).

---

## 🟢 CRITICAL FILE: `views/StatsView.tsx`
**Status**: STABLE. Contains Gamification & Charts.

### 1. State Variables
*   `isPetExpanded` (boolean): Toggles pet card detail view.
*   `user` (User | null): Local state copy for rendering pet stats.
*   `stats` (Memoized): Calculates daily focus hours, mood, and score tier.

### 2. UI Component Tree
*   `Container` (pt-safe-top, pb-32)
    *   `Header`: Title + Trending Icon.
    *   **`PetCard`** (Gradient Background):
        *   `PetRenderer`:
            *   **Logic**: Loads images from CDN based on `user.pet.level`.
            *   **States**: Loading (Spinner), Error (Fallback Icon), Success (Motion Img).
        *   `RankTitle`: "Novice" -> "Master".
        *   `ExpBar`: Progress visual.
        *   `StreakGrid`: 7-day indicator.
    *   **`VibeStatusCard`**:
        *   `Grid`: 4 mood tiers (Distracted/Low/Focused/Flow).
        *   `ActiveState`: Scale-up animation for current mood.
    *   **`ChartCard`**:
        *   `Recharts.ResponsiveContainer`: Wraps the chart.
        *   `BarChart`: 7-day history visualization.

---

## 🟢 CRITICAL FILE: `views/SettingsView.tsx`
**Status**: STABLE. Contains Auth, IAP, and Configs.

### 1. State Variables
*   `showLoginModal` / `showPremiumModal` / `showLanguageModal` / `showDevModal`.
*   `simStatus`: For the "FocusFlow Lab" stress test.
*   `selectedPlanId`: For IAP selection.

### 2. Logic Functions
*   `handlePerformLogin`: Mock login flow.
*   `handlePerformUpgrade`: Mock IAP success flow.
*   `runStressTest`: Generates 100 days of fake history data (Dev Tool).

### 3. UI Component Tree
*   `Container` (pt-8, pb-32)
    *   `Header`: Title.
    *   **`PremiumBanner`** (Conditional):
        *   IF `!isPremium`: Gradient card triggering `PremiumModal`.
        *   ELSE: "Pro Member" badge.
    *   `AccountSection` (IOSCard):
        *   `UserRow`: Avatar + Name OR "Enable Cloud".
    *   `TimerConfig` (IOSCard):
        *   `SliderRow`s: Focus/Short/Long Break durations.
        *   `SliderRow`: Intervals.
    *   `Appearance` (IOSCard):
        *   `IOSSegmentedControl`: System/Light/Dark.
    *   **`Modals` (AnimatePresence)**:
        *   **`LoginModal`**: Apple/Google sign-in buttons.
        *   **`PremiumModal`**:
            *   `FeatureList`: Checkmarks.
            *   `PlanSelector`: Monthly/Yearly/Lifetime cards.
            *   `SubscribeButton`: "Subscribe $X.XX".
        *   **`DevModal`**: "FocusFlow Lab" terminal style UI.
