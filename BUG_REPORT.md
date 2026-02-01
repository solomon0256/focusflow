
# 🚨 FOCUSFLOW 功能断层与逻辑缺失清单 (FUNCTIONAL DEFICITS)

> **状态**: 待确认 (Pending Approval)
> **优先级**: 核心逻辑 > UI 细节

## 1. 📉 数值与经济系统缺失 (Missing Economy System)
**现状**: `App.tsx` 和 `StatsView.tsx` 只有静态展示，没有任何动态计算逻辑。
**缺失的具体逻辑**:
*   **每日任务面板 (Daily Quests)**: 统计界面缺失“今日任务”列表。
    *   [ ] **每日签到 (Check-in)**: 启动即完成，**+15 EXP**。
    *   [ ] **完成一个任务 (Task Done)**: 只要有任务被勾选，**+10 EXP**。
    *   [ ] **专注时长奖励 (Focus Time)**: 每积累 1 小时专注，基础 **+25 EXP**。
*   **乘区算法 (Multiplier Logic)**:
    *   必须应用专注度倍率（例如心流状态 x1.5）。
    *   **强制整数规则 (Integer Only)**: 所有计算结果必须 `Math.floor` 或 `Math.round` 取整，严禁出现小数。
    *   *例子*: 心流专注 1 小时 = 25 * 1.5 = 37.5 -> **取整为 37 EXP**。

## 2. ⏱️ 计时器严格模式偏差 (Timer Strict Mode)
**现状**: 之前的报告建议“后台保活”，但这违背了产品设计初衷。
**正确逻辑**:
*   **App 切后台/锁屏**: 必须**立即中断**或**自动暂停**。
*   **原因**: 专注需要摄像头权限，锁屏/后台无法调用摄像头，且产品逻辑要求用户保持前台专注。
*   **当前Bug**: 代码中虽然监听了 `visibilitychange`，但逻辑可能不严密，导致切回来后时间计算混乱或未正确触发“中断惩罚”。

## 3. 💾 数据与原生兼容性隐患 (Native Compatibility)
**现状**: 目前使用 `localStorage`，这在 Web 端没问题，但在 Capacitor 转原生 iOS 时极其脆弱。
**问题**:
*   **持久化**: iOS 系统清理缓存时会删掉 `localStorage`，导致用户存档清零。
*   **迁移方案**: 必须确保 `NativeService` (services/native.ts) 的接口设计能无缝切换到 `@capacitor/preferences` 或 SQLite，而不需要重写业务逻辑。
*   **权限死循环**: 如果用户在 iOS 上拒绝了相机权限，目前没有弹窗引导用户去“设置”里重新开启，会导致 App 进入死胡同。

## 4. 📝 任务系统“伪功能” (Task System Dummy Logic)
**现状**: `TasksView` 看起来能跑，但很多字段是假的。
*   **属性缺失**: 
    *   时长设置 (Duration) 无法修改（UI缺失）。
    *   番茄数 (Pomodoros) 无法修改（UI缺失）。
    *   备注 (Notes) 无法修改（UI缺失）。
*   **后果**: 用户创建的所有任务都是默认的“25分钟”，无法进行深度规划。

## 5. 🌐 语言包崩溃风险 (i18n Crash)
**现状**: `utils/translations.ts` 文件残缺。
*   **问题**: 缺少 `zh` 等语言对象的完整定义。
*   **后果**: 一旦用户切换语言，App 立刻白屏。

---

## 🗑️ 已忽略的低优问题 (Ignored / Low Priority)
*   UI/UX 细节（如滑动删除、底部遮挡等）：暂时忽略，优先保证功能逻辑跑通。
