
# 当前任务控制面板 (CURRENT TASK CONTROL)

## 🛑 状态：系统级修复中 (SYSTEM REPAIR)
**当前不做任何业务代码修改。先修 AI，再修代码。**

---

## 🛠️ 阶段 0: AI 行为矫正 (The Lobotomy)
**目标**: 通过更新 System Instructions，强制 AI 停止“吃代码”的行为。

**操作步骤**:
1.  **AI 输出指令**: AI 提供一段防降智的 System Prompt。
2.  **用户操作**: 用户将此 Prompt 填入 Google AI Studio 左侧的 `System Instructions` 框中。
3.  **验证**: 用户确认指令已应用。

---

## 📅 阶段 1: 业务代码修复 (原定目标)
*只有在阶段 0 完成后，才继续执行以下内容*

**目标**: 修复 `TasksView.tsx` 的 UI 丢失和 `App.tsx` 的崩溃。

**资产核对清单 (再次强调)**:
*   [ ] **Duration Slider** (Input Range)
*   [ ] **Pomodoro Stepper** (+/- Buttons)
*   [ ] **Note Textarea** (Multi-line Input)
*   [ ] **Translation Keys** (tasks.duration, etc.)

**执行动作**:
1.  解耦 `getLocalDateString` 到 `utils/date.ts`。
2.  全量重写 `TasksView.tsx` (必须包含上述资产)。
3.  补全 `translations.ts`。

---

## 📝 变更日志 (CHANGE LOG)
- [x] 停止一切业务代码写入。
- [x] 制定 System Instructions 修正方案。
- [ ] 等待用户应用新的 System Prompt。
