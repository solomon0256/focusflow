
# 🛠️ FocusFlow 还原与差异分析报告

## 1. 当前状态确认 (Status Quo)
*   **当前版本**: "稳定版" (Stable)。摄像头画面正常，AI 检测逻辑（MediaPipe）工作正常。
*   **丢失功能**: 之前添加的 UI 优化、商业化组件（广告 Banner）、以及部分交互按钮。
*   **目标**: 在**绝对不修改**当前 `FocusSessionView.tsx` 核心 AI 逻辑（`useEffect`, `PoseLandmarker` 初始化, `requestAnimationFrame` 循环）的前提下，把 UI 和业务逻辑加回来。

---

## 2. 代码差异深度分析 (Diff Analysis)

你截图中的差异是因为回滚导致的。以下是详细解释：

### A. `App.tsx` 的差异 (截图 5 & 6)
*   **差异内容**: 
    *   **缺失了 `handleUpgradeTrigger`**: 这是一个回调函数。
    *   **缺失了 `user={user}` 传参**: 没有把用户信息传给专注页面。
*   **这对应用有什么影响？**:
    *   在当前版本中，`FocusSessionView` **不知道** 用户是不是 VIP。
    *   如果没有 `handleUpgradeTrigger`，当用户点击（原本存在的）广告条或锁定的功能时，App 无法跳转到购买/设置页面。
*   **结论**: **必须加回来**。这是实现“免费/付费”逻辑的桥梁，不影响 AI 稳定性。

### B. `TasksView.tsx` 的差异 (截图 7)
*   **差异内容**: 
    *   **左边 (回滚前/丢失的)**: `useMemo<Date[]>(...)` 和 `useMemo<Record<string, Task[]>>(...)`。
    *   **右边 (当前)**: `useMemo(...)` (没有 `<...>` 泛型)。
*   **这对应用有什么影响？**:
    *   这是 **TypeScript 类型定义** 的区别。
    *   加上 `<Date[]>` (左边) 是更严谨的写法，能防止代码在编译时报错（比如防止 `.map` 报错说对象可能是 `unknown`）。
    *   逻辑上两者一模一样，但左边的写法更健壮。
*   **结论**: **建议加回来**。这纯粹是代码质量优化，完全不影响运行时逻辑。

### C. `TimerView.tsx` 的差异 (截图 3 & 4)
*   **差异内容**: 
    *   现在的版本只有 `SegmentedControl` (Pomodoro/Custom)。
    *   之前的版本在右侧有一个 **小按钮 (Icon)**，点击可能用于快速展开设置，或者 UI 布局上有蓝色边框区域（截图4）。
*   **结论**: **需要手动恢复 UI**。我们需要把那个丢失的按钮代码找回来，加到 Header 区域。

---

## 3. 丢失文件清单 (Missing Files)
由于 Git 回滚，这两个文件彻底消失了，需要重新创建：
1.  **`components/AdBanner.tsx`**: 
    *   作用：底部展示广告，引导用户去付费。
    *   状态：必须完全重写。
2.  **`plan_todo.md`**: 
    *   作用：项目规划文档。
    *   状态：必须重新创建（如果你需要保留之前的规划）。

---

## 4. 执行计划 (Execution Plan)

为了达成你的要求（保留好的 AI，找回好的 UI），我们需要分步执行：

### 第一步：恢复基础设施 (Safe)
1.  创建 `components/AdBanner.tsx`。
2.  恢复 `plan_todo.md`。

### 第二步：恢复 `App.tsx` 的连接线 (Safe)
1.  在 `App.tsx` 中重新定义 `handleUpgradeTrigger`。
2.  把它和 `user` 对象传给 `FocusSessionView` 组件。
    *   *注意：此时 `FocusSessionView` 可能会报错，因为它还没准备好接收这些参数。*

### 第三步：更新 `TimerView.tsx` 和 `TasksView.tsx` (Safe)
1.  修改 `TasksView.tsx` 加上类型定义。
2.  修改 `TimerView.tsx` 加上那个丢失的“设置/调整”按钮和 UI 布局。

### 第四步：手术级修改 `FocusSessionView.tsx` (Critical ⚠️)
这是最关键的一步。
*   **保留**: `useEffect` 里的摄像头启动代码、`analyzePoseV2` 算法、`updateStateBuffer` 逻辑。**完全不动**。
*   **修改**:
    1.  `props` 定义：接收 `user` 和 `onUpgradeTrigger`。
    2.  `return (...)` (JSX渲染部分)：
        *   在顶部加入“免费/付费”状态栏（那个绿色的 `Focus Guard On` 标签）。
        *   在底部加入 `<AdBanner />`（仅当 `!user.isPremium` 时）。
    3.  **微调逻辑**: 在 `analyzePoseV2` 函数的 **最后一步**，判断：
        ```javascript
        // 伪代码
        if (检测到体态差) {
            if (isPremium) { 报警; } 
            else { 忽略 (但界面保持绿色 FOCUSED); }
        }
        ```
    *   *之前出错原因猜测*: 之前可能不小心动了 `useEffect` 的依赖数组，导致摄像头组件重复渲染或卸载了。这次我们只改逻辑判断和 UI。

---

## 下一步指示
如果你同意这个分析，请告诉我 **"执行"**，我将按照上述步骤，精准地把丢失的代码补回来，同时严格保护现在的 AI 核心代码。
