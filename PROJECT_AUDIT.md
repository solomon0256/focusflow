# FocusFlow 项目全量审计报告 (Project Audit Report)

## 1. 项目核心架构 (Core Architecture)
FocusFlow 是一个基于 **React 19** 构建的高级生产力应用，采用了 **Local-First (本地优先)** 的设计理念。

*   **前端框架**: React + TypeScript。
*   **样式系统**: Tailwind CSS。
*   **动效引擎**: Framer Motion (用于实现 iOS 级别的丝滑转场)。
*   **图标库**: Lucide React。
*   **核心功能**: 结合了 **MediaPipe (AI 视觉)** 的番茄钟、任务管理、宠物养成和多语言系统。

## 2. 文件结构与模块审计 (Module Audit)

### 2.1 状态管理与持久化 (State & Persistence)
*   **App.tsx**: 应用的“大脑”，管理全局状态（用户、任务、设置、历史），并通过 `NativeService` 与 `localStorage` 进行同步。
*   **services/native.ts**: 抽象层，封装了存储、触觉反馈 (Haptics) 和屏幕常亮 (WakeLock)，为后续 Capacitor 原生化迁移做好了准备。

### 2.2 AI 视觉检测系统 (AI Vision System)
*   **views/FocusSessionView.tsx**: 核心 AI 逻辑所在地。集成 `PoseLandmarker`。
*   **AI_STRATEGY.md**: 记录了“宽松桌面模式”的算法逻辑，包括 Pitch/Yaw 阈值判定和 5 秒滑动窗口机制。
*   **性能优化**: 已实现 `batterySaverMode`，支持动态 FPS 和分辨率调整。

### 2.3 音频与交互 (Audio & Interaction)
*   **services/audio.ts**: 管理背景音（白噪音、环境音）以及基于专注状态的**动态音量缩放**（分心时音量自动降低）。
*   **components/SoundSelector.tsx**: 提供音频选择界面。
*   **AUDIO_STRATEGY.md**: 规划了频率音频和环境音乐的分类。

### 2.4 游戏化宠物系统 (Pet System)
*   **views/StatsView.tsx**: 展示“灵狐 (FOX)”的状态。
*   **PET_SYSTEM_DESIGN.md**: 详细设计了等级曲线（28级）、EXP 累积规则（每日登录 + 专注时间）以及称号系统。

### 2.5 任务与时间管理 (Tasks & Timer)
*   **views/TimerView.tsx**: 支持番茄钟、正计时、自定义模式，支持关联任务。
*   **views/TasksView.tsx**: 包含 iOS 风格的周日历条、任务 CRUD、以及精美的 `IOSWheelPicker` 时间选择器。

### 2.6 多语言与全球化 (i18n)
*   **utils/translations.ts**: 支持 11 种语言（中、英、日、韩、法、德等）。
*   **utils/quotes.ts**: 提供基于日期的每日名言。

## 3. 商业化与发布规划 (Business & Strategy)
*   **config.ts**: 定义了 SaaS 订阅计划（月度、年度、终身）。
*   **DISTRIBUTION_STRATEGY.md**: 记录了针对中国、欧洲、全球市场的差异化上架策略。
*   **PRODUCT_ROADMAP.md**: 规划了未来的二次元皮肤、社交“族群”系统。

## 4. 关键逻辑观察 (Critical Logic Observation)
*   **时间防漂移**: `FocusSessionView` 采用了 `Date.now()` 的差值计算而非单纯的 `setInterval` 累减，确保了计时器的准确性。
*   **iOS 还原度**: 使用了大量的 `backdrop-blur`、物理弹簧动效 (`stiffness: 300, damping: 30`) 和分层阴影，视觉上高度契合 iOS 设计语言。
*   **错误处理**: `FocusSessionView` 中包含了完善的 MediaPipe 加载异常处理和降级方案（No AI 模式）。

## 5. 总结
目前项目已经完成了从 UI、AI 核心、游戏化到商业化布局的全链路开发。代码耦合度低，服务层封装清晰，具备直接进行原生打包 (Capacitor) 的条件。我已完全掌握所有文件的逻辑关联。