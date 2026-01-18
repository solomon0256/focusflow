
# FocusFlow 开发进度与计划 (Development Log)

## ✅ 今天完成的工作 (Today's Achievements)

### 1. 核心架构与性能优化
*   **AI 模型单例化 (Singleton AI)**: 修复了每次进入专注模式都重新下载/加载模型导致卡顿的问题。现在 `PoseLandmarker` 只初始化一次并常驻内存。
*   **Native Bridge 服务**: 创建了 `services/native.ts`，为后续迁移到 Capacitor (iOS/Android) 做好了准备，统一了存储、震动和屏幕常亮接口。
*   **类型修复**: 修复了 `NodeJS.Timeout` 在非 Node 环境下的类型报错。

### 2. UI/UX 交互升级
*   **主页 (TimerView)**:
    *   实现了 **"快速设置 (Quick Settings)"** 面板，允许直接在主页调整专注时长、休息时长。
    *   新增了 **"自定义轮数 (Custom Session)"** 选择器 (1-4+ 轮)。
    *   **交互逻辑优化**: 点击自定义轮数会自动取消当前选中的任务，实现了“任务模式”与“临时模式”的无缝切换。
    *   添加了动态的时间轴预览 (Timeline Preview)。
*   **专注页 (FocusSessionView)**:
    *   集成了 MediaPipe 视觉引擎。
    *   实现了校准流程 (Calibration): 倒计时结束瞬间记录用户面部基准点。
    *   实现了基础状态机: 专注 (Focused) vs 分心 (Distracted) vs 疲劳 (Fatigue)。

---

## 📅 明日待办计划 (To-Do List for Tomorrow)

### 🔴 优先级 1: AI 逻辑调优 (The "Brain")
*   **平滑处理 (Smoothing)**: 目前的状态判定可能过于灵敏（瞬间转头就红）。需要引入“滑动窗口”算法，只有持续 3-5 秒的不良姿态才触发警告。
*   **阈值配置**: 根据之前的 `AI_STRATEGY.md`，微调 Pitch/Yaw 的判定角度，确保“宽松桌面模式”体验。

### 🟡 优先级 2: 后台计时修正 (Background Timer)
*   **问题**: iOS 切后台后 `setInterval` 会停止。
*   **方案**: 修改 `FocusSessionView` 和 `TimerView`，加入 `document.visibilitychange` 监听。当 App 回到前台时，通过 `Date.now() - startTime` 瞬间校正剩余时间。

### 🟡 优先级 3: 宠物系统逻辑 (Gamification)
*   **当前状态**: 只有一个静态的 UI 卡片。
*   **目标**:
    *   基于 `focusHistory` 计算“宠物亲密度/等级”。
    *   根据今日专注时长，改变宠物的状态（开心、睡觉、饥饿）。
    *   添加简单的宠物互动动画。

### 🟢 优先级 4: 声音模块 (Audio Engine)
*   添加白噪音播放器 (雨声、咖啡馆等)。
*   实现 IOS 风格的音效 (开始、暂停、完成)。

---

## 📝 遗留问题 / 注意事项
1.  **Capacitor 迁移**: 目前代码是纯 Web React。迁移到 iOS 原生 App 时，需要运行 `npx cap init` 并安装我们在 `CAPACITOR_MIGRATION_GUIDE.md` 中列出的插件。
2.  **相机权限**: 在 iOS WebView 中，如果用户拒绝了一次相机权限，后续无法通过代码再次请求，需要引导用户去系统设置开启。
