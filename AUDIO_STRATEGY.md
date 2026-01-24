
# FocusFlow Audio Strategy (音频系统规划)

## 1. 核心理念 (Core Philosophy)
打造一个**生成式**与**采样式**结合的音频系统，不仅提供背景白噪音，更通过声学频率（脑波夹带）主动干预用户的专注状态。

---

## 2. 频率波系统 (Frequency Waves) - Future Roadmap
计划在后续版本中加入“脑波同频”功能，使用双耳节拍 (Binaural Beats) 或等时音 (Isochronic Tones)。

### 目标频率 (Target Frequencies)
| 模式 | 频率范围 | 作用 | 适用场景 |
| :--- | :--- | :--- | :--- |
| **Deep Focus** | **Beta 波 (14-30 Hz)** | 提高警觉性、逻辑分析能力 | 写代码、解数学题 |
| **Creative** | **Alpha 波 (8-14 Hz)** | 放松、发散思维 | 写作、设计、构思 |
| **Flow State** | **Gamma 波 (30-100 Hz)** | 高度认知处理、信息整合 | 深度阅读、记忆背诵 |
| **Rest** | **Theta 波 (4-8 Hz)** | 深度放松、冥想 | 休息时间、睡前 |

### 技术实现路径
1.  **Web Audio API 振荡器**: 使用 `OscillatorNode` 实时生成正弦波。
2.  **双通道合成**: 左耳 400Hz，右耳 415Hz -> 产生 15Hz (Beta) 差频。
3.  **UI 控制**: 允许用户在现有白噪音基础上“叠加”频率波（如：雨声 + Alpha波）。

---

## 3. 自适应音量 v2 (Adaptive Volume)
目前的 v1 版本已实现了简单的“分心即降低音量”。v2 版本将更加平滑和智能。

### 规划特性
*   **淡入淡出 (Cross-fading)**: 状态切换时，音量在 2秒内线性过渡，避免突兀。
*   **环境噪音补偿**: (需麦克风权限) 检测环境噪音分贝，自动提升白噪音音量以遮蔽环境杂音。
*   **心流保护**: 当检测到 `Deep Flow` 状态持续超过 10分钟，自动微调音量至用户最舒适的“沉浸点”（通常是设定值的 80%）。

---

## 4. 资源推荐 (Resources)
由于本项目是 Local-First 架构，音频文件需下载并放置在 `public/sounds/` 目录下。

### 推荐下载源 (免费商用许可)
1.  **Pixabay Sound Effects**: [https://pixabay.com/sound-effects/](https://pixabay.com/sound-effects/)
    *   搜索: *Rain, Forest nature, Cafe ambience, Library silence*.
2.  **Freesound.org**: [https://freesound.org/](https://freesound.org/)
    *   需要筛选 *Creative Commons 0 (CC0)* 许可。
3.  **Mixkit**: [https://mixkit.co/free-sound-effects/](https://mixkit.co/free-sound-effects/)

### 文件规范
*   格式: `.mp3` (兼容性最好) 或 `.aac`。
*   大小: 建议 < 2MB (裁剪为 30-60秒 循环)。
*   路径: `/public/sounds/filename.mp3`

---

## 5. UI 规范
*   **白噪音**: 使用正弦波形图标 (Sine Wave / AudioWaveform)。
*   **自然声**: 使用极简线性图标 (Linear Icons)。
*   **去装饰化**: 移除所有复杂的 Emoji 或拟物插图，保持 iOS 原生的高冷风格。
