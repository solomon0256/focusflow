# FocusFlow 官方门户网站建设规划

## 一、 核心功能模块 (Core Modules)

### 1. Hero 视觉区 (The "Hook")
*   **目标**: 3秒内抓住用户眼球。
*   **内容**: 3D 样机动态展示 App 运行状态，配合标语“若有心，自成流”。
*   **技术**: 使用 CSS 3D 变换或 Spline 进行样机渲染。

### 2. 学术/科研模块 (The "PhD Flex")
*   **目标**: 向教授展示你的工程落地能力和学术严谨性。
*   **内容**: 
    *   **AI 推理可视化**: 展示 WASM 在浏览器中运行 PoseLandmarker 的性能指标。
    *   **HCI 研究背景**: 简述实时反馈对长期专注力的提升逻辑。
    *   **白皮书下载**: 提供详细的技术文档下载。

### 3. 下载与分发区 (The "Conversion")
*   **目标**: 确保用户能顺利安装。
*   **iOS**: 指向 App Store。
*   **Android (中国)**: 
    *   托管于阿里云/腾讯云 OSS 的 APK 直链。
    *   **微信拦截处理**: 自动检测微信环境，并弹出 iOS 风格的引导层，提示“点击右上角，在浏览器中打开”。

---

## 二、 关键技术选型 (Tech Stack)

*   **框架**: React + Tailwind CSS (保持与 App 风格高度统一)。
*   **动效**: Framer Motion (用于进场动画) + GSAP (用于复杂的滚动视差)。
*   **部署**: Vercel (全球分发) + 阿里云 OSS (中国区加速)。
*   **分析**: 接入 Plausible 或 Google Analytics，监控下载转化率。

---

## 三、 必须考虑的细节 (Critical Details)

1.  **SEO 优化**: 针对关键词“FocusFlow”, “若心流”, “AI番茄钟”进行 TDK (Title, Description, Keywords) 配置。
2.  **加载速度**: 首屏加载必须控制在 1s 内。使用 WebP 图像格式和组件懒加载。
3.  **社交分享卡片 (OpenGraph)**: 当你的网站链接发到 Twitter, 微信或 Discord 时，会自动显示精美的预览图和标题。
4.  **暗黑模式适配**: 网站应与 App 一样，支持跟随系统的黑暗模式切换。
