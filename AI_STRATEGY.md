# FocusFlow AI 姿态检测技术方案 (Technical Specification)

## 1. 核心目标
在 iOS (via Capacitor) 和 Web 端实现一套**实时、低延迟、可离线**的专注度检测系统。该系统利用前置摄像头分析用户头部姿态，判断用户是否分心（低头、转头、趴桌子）。

---

## 2. 技术选型与限制
*   **核心引擎**: Google MediaPipe Tasks Vision (JavaScript/WASM 版本)。
*   **为什么不用 Python?**: iOS 应用本质是 WebView 运行 JS，无法原生高效运行 Python 脚本。
*   **为什么不用原生 Swift/Kotlin?**: 为了保持代码库统一 (React)，我们选择 WASM 方案，它可以在浏览器和 WebView 中利用 GPU 加速，性能接近原生。

---

## 3. 部署策略 (最终确定的离线架构)

经过对 iOS 沙盒机制和 Capacitor 资源加载的研究，我们放弃“压缩包解压”或“动态下载”方案，采用 **“静态资源打包 (Bundled Assets)”** 方案。

### 3.1 方案描述
将 AI 模型文件视为普通的静态资源（类似 `.png` 或 `.json`），直接放入项目的 `public` 目录。

*   **路径规划**:
    *   项目根目录: `/public/ai_resources/`
    *   文件 1: `vision_wasm_internal.wasm` (WASM 运行时，约 4MB)
    *   文件 2: `vision_wasm_internal.js` (加载器)
    *   文件 3: `face_landmarker.task` (模型权重文件，约 1.5MB)

### 3.2 为什么这样做？(可行性分析)
1.  **iOS 合规性 (App Store)**: Apple 严禁 App 下载“可执行代码”。但 `.task` 文件是**数据**，`.wasm` 在 WebKit 内部运行，被视为 Web 内容。将其作为 App Bundle 的一部分打包是完全合规的。
2.  **Capacitor 机制**: Capacitor 构建 iOS 应用时，会将 `dist/` (编译后的前端代码) 和 `public/` 目录下的所有文件完整拷贝到 iOS 的 App Bundle 中。
3.  **访问方式**: 在运行时，这些文件可以通过相对路径 `./ai_resources/...` 或绝对路径 `/ai_resources/...` 访问。MediaPipe 引擎会像请求网络图片一样请求这些本地文件，无需任何解压操作。

### 3.3 实施步骤
1.  **下载资源**: 从 Google CDN 下载上述 3 个文件。
2.  **存入项目**: 放入 `FocusFlow/public/ai_resources/`。
3.  **代码修改**:
    ```javascript
    // 指向本地（相对于 index.html 的路径）
    const filesetResolver = await FilesetResolver.forVisionTasks("./ai_resources/wasm");
    const modelAssetPath = "./ai_resources/face_landmarker.task";
    ```
4.  **构建**: 运行 `npm run build` -> `npx cap sync`。

---

## 4. 专注度判断算法 (Focus Algorithm)

我们不使用简单的 `if` 判断，而是采用 **"积分衰减模型 (Score Decay Model)"**。

### 核心指标 (欧拉角估算)
通过面部关键点 (鼻子、左耳、右耳) 计算头部角度：
1.  **Pitch (俯仰角)**: 
    *   *计算*: 鼻子 Y 坐标 vs 耳朵中心 Y 坐标。
    *   *阈值*: > 25度 (低头)。
    *   *判定*: 玩手机、打瞌睡。
2.  **Yaw (偏航角)**:
    *   *计算*: 鼻子 X 坐标 vs 耳朵中心 X 坐标。
    *   *阈值*: > 30度 (左右转头)。
    *   *判定*: 看旁边、与人交谈。
3.  **Roll (翻滚角)**:
    *   *计算*: 左耳 Y 坐标 vs 右耳 Y 坐标。
    *   *阈值*: > 20度 (歪头)。
    *   *判定*: 趴桌子、疲劳。

### 积分逻辑 (State Machine)
*   **初始分**: 100 分。
*   **状态**: `GOOD` (专注) / `DISTRACTED` (分心) / `BAD_POSTURE` (姿态差)。
*   **扣分 (Decay)**: 当检测到不良状态时，每帧扣 `0.5` 分 (约每秒扣 15 分)。
    *   *目的*: 允许用户短暂活动脖子，但惩罚长时间分心。
*   **回血 (Recovery)**: 当姿态恢复正常时，每帧回 `0.1` 分 (约每秒回 3 分)。
    *   *目的*: 鼓励用户纠正姿态。
*   **报警阈值**: 当分数低于 60 分时，UI 变红并提示。

---

## 5. 初始化流程与错误处理 (Robustness)

为了防止 App 卡死，我们设计了以下状态机：

1.  **INIT**: 界面加载。
2.  **LOADING_WASM**: 尝试从本地加载 AI 引擎。
3.  **LOADING_MODEL**: 尝试读取本地模型文件。
4.  **STARTING_CAMERA**: 请求摄像头权限。
5.  **READY**: 一切就绪，开始分析。
6.  **ERROR**: 任何一步失败 (断网、拒绝权限)。

**降级策略 (Fallback)**:
如果进入 **ERROR** 状态，用户可以选择 **"Continue without AI" (跳过 AI)**。
*   此时 App 变为普通番茄钟 + 纯摄像头预览（不进行分析）。
*   **原则**: AI 是增强功能，不是阻断功能。软件必须在没有 AI 的情况下也能运行。

---

## 6. 下一步计划
1.  在 Web 端调试现在的算法阈值，确保不会频繁误报。
2.  确认阈值满意后，**下载文件并进行静态打包** (Step 3.3)。
3.  配置 Capacitor 环境，进行真机测试。
