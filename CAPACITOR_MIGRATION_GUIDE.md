# FocusFlow - Capacitor 移动端转化可行性规范

## 1. 核心原则 (Core Principles)
Capacitor 的本质是将 Web 应用运行在手机系统的 WebView (浏览器内核) 中。虽然它看起来像原生应用，但它仍然受制于浏览器的安全和性能限制。

**基本判定标准**：
*   ✅ **纯 JavaScript 逻辑**：允许。
*   ✅ **浏览器 API (Web APIs)**：大部分允许 (Fetch, WebSocket, Canvas)。
*   ❌ **Node.js 运行时**：**绝对禁止**。手机上没有 Node 环境，不能使用 `fs` (文件系统), `crypto` (Node版), `child_process` 等。
*   ⚠️ **大量内存占用**：需谨慎。手机 WebView 内存限制比 PC 浏览器严格，容易 Crash。

---

## 2. 外部模块白名单与黑名单 (Module Compatibility)

我们在引入第三方库时，必须遵循以下规则：

### ✅ 允许使用的模块 (Allowed)
这些库是纯 JS 实现，或者专为浏览器设计，可以在 Capacitor 中完美运行。
1.  **React / ReactDOM**: 核心框架。
2.  **Tailwind CSS**: 纯 CSS 生成，性能极佳。
3.  **Framer Motion**: 允许，但在低端 Android 机上过度复杂的布局动画可能掉帧。
4.  **Lucide React**: SVG 图标，无副作用。
5.  **Recharts**: 基于 SVG/Canvas，允许。
6.  **MediaPipe (WASM版)**: 允许。虽然计算量大，但它是基于 WebAssembly，WebView 支持良好（需注意散热和电量）。
7.  **Date-fns / Day.js**: 纯 JS 时间处理。

### ❌ 禁止使用的模块 (Forbidden)
任何依赖 Node.js 内置模块的库都无法通过编译或运行时报错。
1.  **fs (File System)**: 不能直接操作用户文件系统。
    *   *替代方案*: 使用 `@capacitor/filesystem` 插件。
2.  **Native Hardware Access via Web API**: 部分 Web API 在 iOS WebView 受限。
    *   *Web Bluetooth / Web NFC*: iOS Safari 支持极差。
    *   *替代方案*: 必须使用 Capacitor 官方插件 (`@capacitor-community/bluetooth-le` 等)。
3.  **Server-Side Libraries**: 如 `axios` (如果是 node 版本), `express` 等。

---

## 3. 关键架构挑战与解决方案

针对 FocusFlow (番茄钟) 的特殊业务场景，存在以下挑战：

### A. 后台计时问题 (The "Timer" Problem) 🔴 严重
*   **现象**: 当用户把 App 切到后台（或锁屏）时，iOS 会暂停 WebView 的 JavaScript 执行以省电。这意味着 `setInterval` **会停止**。你的倒计时会停滞。
*   **解决方案**:
    1.  **差值计算法 (前台恢复)**: 不依赖 `setInterval` 累计时间。记录 `startTime` 和 `expectedEndTime`。当 App 从后台恢复 (Resume) 时，重新计算 `Current Time - Start Time`，瞬间修正 UI。
    2.  **本地通知 (Local Notifications)**: App 切后台时，立即注册一个本地通知：“专注完成！”（设定在预计结束的时间点触发）。
    3.  **画中画/后台音频 (Hack)**: 如果需要持续运行（如播放白噪音），可以通过“后台音频播放”权限来通过苹果审核，但这需要增加音频模块。

### B. 数据持久化 (Data Persistence)
*   **现状**: 目前使用 `localStorage`。
*   **风险**: iOS 系统在存储空间不足时，可能会**静默清空** WebView 的 `localStorage`。这会导致用户数据丢失。
*   **修正方案**: 必须迁移到 **`@capacitor/preferences`** (原 Storage) 或 **`@capacitor-community/sqlite`**。这些是原生存储，不会被系统随意清理。

### C. 界面交互 (UI/UX)
*   **安全区域 (Safe Area)**: 必须严格使用 `env(safe-area-inset-top)` 等 CSS 变量（目前代码已包含）。
*   **点击延迟**: 移动端浏览器可能有 300ms 点击延迟。
    *   *解决*: 设置 `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">` (已完成)。
*   **触摸反馈**: CSS `:hover` 在手机上无效且怪异。必须使用 `:active` 或 Framer Motion 的 `whileTap`。
*   **长按/选择**: 必须在全局 CSS 中禁用文本选择 (`user-select: none`)，防止长按弹出复制菜单。

---

## 4. 必需的 Capacitor 插件列表

为了实现原生体验，我们后续需要安装以下插件：

| 功能 | 插件名称 | 用途 |
| :--- | :--- | :--- |
| **相机** | `@capacitor/camera` | 如果我们要拍照存证，或者作为 AI 降级方案。 |
| **文件** | `@capacitor/filesystem` | 存储 MediaPipe 模型文件，实现离线 AI。 |
| **存储** | `@capacitor/preferences` | 替代 LocalStorage，保存用户任务和设置。 |
| **通知** | `@capacitor/local-notifications` | 计时结束时提醒用户（即使用户锁屏）。 |
| **震动** | `@capacitor/haptics` | 按钮点击、计时结束时的物理反馈。 |
| **状态栏** | `@capacitor/status-bar` | 控制顶部状态栏颜色（沉浸式体验）。 |
| **屏幕** | `@capacitor/keep-awake` | 专注时防止屏幕自动熄灭。 |

---

## 5. 总结

我们可以继续使用 React 开发，但必须遵守：
1.  **数据层迁移**：把 `localStorage` 封装成异步接口，为以后换成 Capacitor Preferences 留接口。
2.  **计时器重构**：核心计时逻辑必须基于“时间戳差值”，而不是“秒数递减”。
3.  **离线优先**：所有资源（图片、模型、字体）必须打包在 App 本地，不能依赖 CDN。
