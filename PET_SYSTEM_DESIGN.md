# FOX (Focus Pet) System Design

## 1. Philosophy
The pet system is designed to encourage **consistency** rather than just intensity. It rewards the act of showing up every day.

*   **Name**: FOX (福克斯)
*   **Visual Style**: Transitioning to Anime/2D (二次元).

---

## 2. Core Mechanics

### A. Experience (EXP) & Leveling
The pet grows by gaining **Focus EXP**.

**Leveling Curve (Draft):**
| Level | Required EXP | Title | Unlocks |
| :--- | :--- | :--- | :--- |
| 1 | 0 | Novice | Base Skin |
| 2 | 50 | Apprentice | Background Music 1 |
| 3 | 150 | Adept | Accessory: Glasses |
| 4 | 300 | Expert | Skin: Dark Mode Fox |
| 5 | 500 | Master | Background Music 2 |

### B. Daily Login Reward (每日登录)
*   **Definition**: Completing a focus session of **> 0.1 Hours** (approx 5-6 minutes).
*   **Reward**: **+5 EXP** (Once per day).
*   **Feedback**:
    *   Visual toast: "Daily Goal Met! +5 EXP"
    *   Pet animation: Happy/Jump.

### C. Sustained Focus Reward (Planned)
*   **Logic**: +1 EXP for every 10 minutes of focus.
*   **Bonus**: +20% EXP for "Deep Focus" state (AI verified).

---

## 3. Implementation Data Structure

```typescript
interface UserPet {
    level: number;
    currentExp: number;
    maxExp: number; // calculated as 50 * level^1.5 approx
    happiness: number; // 0-100, decays daily
    lastDailyActivityDate: string; // "YYYY-MM-DD" to track daily login
}
```

## 4. Future "Gacha" System
*   Users earn "Coins" alongside EXP.
*   Coins can be used to draw random accessories for FOX.
