
# 核心对话记录与约束协议 (DISCUSSION LOG & PROTOCOL)

## 1. 历史教训 (HISTORY OF FAILURE)
*   **现象**: AI Studio 在修改代码时，倾向于关注最近的指令，而“灾难性遗忘”旧的 UI 组件和逻辑。
*   **原因**: 上下文窗口限制 + AI 的注意力机制缺陷。
*   **用户提供的解决方案**: 参考 ChatGPT 的建议，建立一个强制性的、分阶段的检查流程。

## 2. 新策略: AI_WORKFLOW_PROTOCOL (The Anti-Amnesia Protocol)
我们放弃了简单的“索引”模式，转而采用动态的 **Process Control (过程控制)**。

### 核心流程 (The 4 Stages)
1.  **ANALYZE (分析)**: 动手前，先列出文件里现有什么。
2.  **PROTECT (保护)**: 明确列出“绝对不能删”的功能清单。
3.  **GENERATE (生成)**: 在内存中做 Diff，然后输出全量文件。
4.  **VERIFY (验证)**: 自我反问，“我删掉了 WeekStrip 吗？”，如果是，重来。

## 3. 执行状态
*   [x] 建立 `AI_WORKFLOW_PROTOCOL.md` (定义流程)。
*   [x] 更新 `UI_MANIFEST.md` (定义保护对象)。
*   [ ] **NEXT STEP**: 应用此流程修复 `TasksView.tsx`。
