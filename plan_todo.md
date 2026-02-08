
# FocusFlow 全量路线图（工程真实版）

> **目标**: **一次正确打包 + 后续可持续迭代**
> **核心原则**: 避免“发包后发现底层设计错误 → 推倒重来”。
> **关键决策**: 检测 + Debug = 产品根基。支付、广告、UI 都是“外设”。

---

## ✅ Phase 0 — 基础架构与约束 (已完成/进行中)
**内容**:
- [x] **React 核心架构**: UI 组件库, 路由, 状态管理 (App.tsx).
- [x] **基础 MediaPipe 集成**: WASM 加载流程.
- [x] **模块边界划分**: 明确 Detection / Stats / Notification 的职责.
- [x] **网络策略**: 确认使用 CDN 加载模型 (详见 `docs/NETWORK_DEPENDENCY.md`).

---

## 🚀 Phase 1 — 检测核心 (Detection Core) [当前焦点]
**这就是“产品物理定律”，所有后续功能（EXP、通知、广告）都依赖于此。**

- [ ] **1.1 姿态关键点过滤**:
    - 仅保留 Head (nose/eyes), Shoulders, 少量 Hands.
    - 丢弃下半身及无关点位，减少计算噪音.
- [ ] **1.2 运动建模 (Motion Modeling)**:
    - 计算关键点的位移 (Displacement) 和角速度 (Angular Velocity).
    - 实现加权系统: Head (高) > Shoulder (中) > Hands (低).
- [ ] **1.3 专注状态机 (State Machine)**:
    - 实现 5-10秒 滑动窗口 (Sliding Window).
    - 输出离散状态: `DEEP_FLOW` | `FOCUSED` | `LOW` | `DISTRACTED`.
- [ ] **1.4 疲劳检测原型**: 基于闭眼时长或长时间僵硬.

---

## 🛠️ Phase 2 — 数据、统计、全局 Debug (必做)
**打包前必须完成，这是未来修 Bug 的唯一眼睛。**

- [ ] **2.1 数据结构定型**:
    - 冻结 `Session`, `FocusSegment`, `StateTimeline` 的 JSON 结构.
- [ ] **2.2 统计界面实装**:
    - 展示专注状态占比饼图.
    - 展示平均 Session 稳定度曲线.
- [ ] **2.3 全局 Debug 面板 (Telemetry)**:
    - [ ] 显示 MediaPipe 初始化耗时 & 失败原因.
    - [ ] 显示网络/VPN 错误状态.
    - [ ] 实时显示当前计算的 Motion Score.
    - [ ] 入口: 隐藏式 (如长按标题).

---

## 🔔 Phase 3 — 通知系统 (基础版)
**打包前做，为了通过审核权限检查及验证打扰度。**

- [ ] **3.1 本地通知逻辑**: Session 结束、Break 结束提醒.
- [ ] **3.2 权限管理**: 优雅地请求权限，允许用户关闭.
- [ ] **3.3 交互验证**: 确保“检测到分心”与“发送通知”之间有合理的防抖动机制.

---

## 📦 Phase 4 — 打包 (Release v1) [里程碑]
**在此阶段，产品必须自洽。**

- [ ] **4.1 功能验收**:
    - 检测稳定，数据不丢，通知可关，无支付/无广告.
- [ ] **4.2 工程验收**:
    - Debug 面板存在.
    - 网络失败不 Crash (有降级处理).
    - Feature Flag 可关闭检测模块.
- [ ] **4.3 原生环境构建 (Capacitor)**:
    - 配置 iOS/Android 工程.
    - 设置 App Icon 和 Splash Screen.
- [ ] **4.4 合规准备**:
    - 隐私政策 (基础版).
    - Camera 权限说明文案.

---

## ☁️ Phase 5 — 账户 & 云同步
- [ ] Guest 模式转登录模式.
- [ ] 多设备数据合并策略.

---

## 💰 Phase 6 — 支付 (IAP / Subscription)
**原则**: 不影响免费核心体验，不绑死检测逻辑.
- [ ] 接入 RevenueCat.
- [ ] 实现 Pro 权益解锁 (历史数据、高级统计).

---

## 📺 Phase 7 — 广告
**原则**: 仅在非专注状态展示，严格频控.
- [ ] 接入 AdMob / 穿山甲.
- [ ] 实现 "Watch Ad to Remove Limit" 或底部 Banner.

---

## ⚖️ Phase 8 — 法律补充 & 商店优化
- [ ] 完善 Terms of Service.
- [ ] 数据导出功能 (GDPR).
- [ ] App Store 截图与 ASO.

---

## 🔮 Phase 9 — 长期优化
- [ ] 本地模型替换 CDN (完全离线).
- [ ] 国际化 (i18n) 深度适配.
- [ ] A/B Test 实验系统.
