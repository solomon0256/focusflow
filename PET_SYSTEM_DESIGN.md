# FOX (Focus Pet) System Design v2

## 1. Philosophy: "The Companion's Journey"
The pet system (FOX - 福克斯) is no longer a static counter. It is a living character inspired by **Anime/2D styles (二次元)** that reflects the user's focus consistency. It uses a **Streak Multiplier Tier** system to reward habit-forming behavior.

---

## 2. Core Mechanics: Streak Tiers (连胜阶梯)

The reward for the first focus session (> 5 mins) of the day depends on the user's current **Streak Tier**.

| Tier (等级) | Streak Days (持续天数) | Daily EXP Reward | Description |
| :--- | :--- | :--- | :--- |
| **Tier 1** | 1 Day | **+5 EXP** | Initial start. |
| **Tier 2** | 2 - 3 Days | **+10 EXP** | Finding the rhythm. |
| **Tier 3** | 4 - 5 Days | **+12 EXP** | Deepening habits. |
| **Tier 4** | 6+ Days | **+15 EXP** | Focus Mastery. |

---

## 3. The "Soft Landing" Degradation Logic (缓冲降级)

If a user misses a day (Zero focus sessions recorded), the streak breaks. Instead of a hard reset to zero, we apply a **Soft Landing** based on where they fell from:

*   **Fall from Tier 1**: Next login starts at **Tier 1** (Day 1).
*   **Fall from Tier 2**: Next login starts at **Tier 1** (Day 1).
*   **Fall from Tier 3**: Next login starts at **Tier 1** (Day 1).
*   **Fall from Tier 4**: Next login starts at **Tier 2** (Day 1).
    *   *Why?* High-tier users have proven long-term commitment. Dropping them to Tier 2 (Day 1, +10 EXP) acknowledges their past effort while still requiring a restart.

### EXP Distribution Rules:
1. **Missed Day**: No EXP gained for that calendar day.
2. **First Login After Break**: Today's tier is determined by the "Soft Landing" rule above.
3. **Example**: User has 7-day streak (Tier 4). Misses Monday. On Tuesday, they login: 
   * Today is Day 1 of a new streak.
   * But the multiplier used is **Tier 2 (+10 EXP)** because of the Tier 4 cushion.

---

## 4. Visual Evolution (Anime/2D Style)

The FOX mascot will evolve visually as the level increases:
*   **Lv 1-2**: Small, playful fox cub. Large eyes.
*   **Lv 3-4**: Growing fox, wearing focus glasses or a scarf.
*   **Lv 5+**: Majestic fox with mystical aura/cloak (Master level).

---

## 5. Technical Implementation Data

Updated `PetState` interface:
```typescript
interface PetState {
    level: number;
    currentExp: number;
    maxExp: number;
    happiness: number;
    streakCount: number; // Current continuous days
    lastDailyActivityDate: string; // "YYYY-MM-DD"
}
```
