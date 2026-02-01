
# AI WORKFLOW PROTOCOL (AI 防遗忘工作流) v2.0

> **SOURCE**: Based on community best practices and deep audit logic.
> **AUTHORITY**: This document is the HIGHEST PRIORITY instruction. It overrides any default simplification behaviors.
> **GOAL**: Eliminate "Catastrophic Forgetting" and enforce "Zero Regression".

## ⚠️ MANDATORY EXECUTION FLOW
**Since the tool requires FULL FILE output, the risk of dropping code is maximum.**
You are NOT writing a patch; you are rewriting history.
**You must carry EVERY piece of the old history into the new file.**

---

## STAGE 1: CONTEXT ANALYSIS (上下文透视 & 资产核对)
*Before writing a single line of code, the AI must parse the existing file and cross-reference with the Manifest.*

**Internal Monologue Checklist:**
1.  **Identify the File**: e.g., `TasksView.tsx`.
2.  **Inventory Check (The Audit)**:
    *   List Imports, State Variables, Logic Functions.
    *   **CRITICAL STEP**: Open `UI_MANIFEST.md`.
    *   **CROSS-VALIDATION**: Check every item listed in `UI_MANIFEST.md` for this file.
        *   *Self-Correction*: "The Manifest says `DurationSlider` must exist. Do I see it in the code I am reading? Yes/No."
    *   **UI Structure Mapping**: List the DOM tree depth-first.

## STAGE 2: THE PROTECTION PLAN (保护计划)
*Explicitly state what MUST NOT change based on the Manifest.*

**The "Do Not Touch" List (Derived from UI_MANIFEST.md):**
*   "I explicitly verify the existence of `DurationSlider`."
*   "I explicitly verify the existence of `PomodoroStepper`."
*   "I explicitly verify the existence of `NoteTextarea`."
*   "I confirm I will retain the specific Tailwind classes (`pt-safe-top`, etc)."

**The Change Plan:**
*   "I will ONLY insert the new feature at line X."
*   "I will ONLY modify the `handleSave` function to include the new field."

## STAGE 3: FULL FILE GENERATION (全量生成)
*Execute the merge in memory before outputting.*

**Simulation:**
`New_File = (Old_File_Content - Target_Block) + (New_Block_Content)`

**Constraints:**
1.  **No Hallucinations**: Do not invent new imports unless requested.
2.  **No Simplifications**: Do not reduce a complex UI component to a `TODO` or a simple `div`.
3.  **Strict Diffing**: If a block of code is unrelated to the request, copy it **character-for-character**.

## STAGE 4: SELF-VERIFICATION & ENFORCEMENT (自我审计与强制执行)
*Before finalizing the XML output, verify the result against the Manifest.*

**Verification Protocol:**
1.  Iterate through `UI_MANIFEST.md` for the current file.
2.  Ask: "Is [Item Name] present in my generated code exactly as it was?"
3.  Ask: "Did I break any 'Enforcement Rules'?"

> **FAILURE CONDITION (CRITICAL)**: 
> If ANY item from `UI_MANIFEST.md` is missing or altered without instruction, **the output is INVALID**.
> **ACTION**: You MUST STOP. Do not output the XML. Regenerate the file using the original file as the SINGLE SOURCE OF TRUTH.

---

## EXAMPLE PROMPT TEMPLATE (For User Reference)
*When asking the AI to fix `TasksView.tsx`:*

```text
[TASK]
Fix the save logic in TasksView.tsx.

[PROTOCOL: AI_WORKFLOW_PROTOCOL.md]
1. ANALYZE: List the 5 key UI components in TasksView.tsx currently.
2. PROTECT: Confirm you will not delete the "Duration Slider" or "Week Strip".
3. EXECUTE: Output the full file.
```
