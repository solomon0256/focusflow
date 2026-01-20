# FocusFlow (若心流) Product Roadmap & Strategy

## 1. Product Identity (产品定位)
*   **Name**: FocusFlow
*   **Chinese Name**: 若心流 (Ruò Xīn Liú) - Implies a state of effortless immersion.
*   **Mascot**: **FOX** (福克斯).
    *   *Current Style*: Minimalist/Flat.
    *   *Future Direction*: **Anime/2D Style (二次元)**. A personable, evolving companion.
*   **Core Value**: A "Local-First" productivity tool combining AI posture detection with gamified habits.

---

## 2. Commercial Strategy (商业规划)

### Phase 1: MVP & Verification (Current)
*   **Platform**: iOS (Primary), Web/Android (Secondary).
*   **Monetization**:
    *   **Freemium Model**:
        *   Free: Basic Pomodoro, Yaw Detection (Distraction), Basic Pet Interaction.
        *   Pro ($2.99/mo): Pitch Detection (Posture/Fatigue), Cloud Sync, Exclusive Fox Skins, Unlimited History.
    *   **Ad-Supported**: Bottom banner ads for free users (removable via IAP).

### Phase 2: Growth & Community
*   **Pet System Expansion**:
    *   Sell "Skins" or "Accessories" for FOX as micro-transactions.
    *   "Focus Garden": Use focus time to plant trees/build structures (visual rewards).
*   **Social**: "Pack" system (Guilds) where users focus together to raid bosses (reduce collective distraction time).

---

## 3. Technical Roadmap (技术路线)

### Q1: Foundation & AI
- [x] React Core & iOS UI System.
- [x] MediaPipe Integration (WASM) for Offline AI.
- [ ] **Pet System v1**: Leveling logic based on daily activity.
- [ ] **Debug Tools**: Fast-forward simulation for testing.

### Q2: Native & Sync
- [ ] **Capacitor Migration**: Convert React app to Native iOS IPA.
- [ ] **Cloud Database**: Firestore/Supabase for cross-device sync.
- [ ] **Notification System**: Local push notifications for timer completion.

---

## 4. Key Metrics (北极星指标)
1.  **Daily Active Users (DAU)**: Defined by users completing > 5 mins of focus.
2.  **Day-1 Retention**: Percentage of users returning the next day to feed FOX.
3.  **Conversion Rate**: Free -> Pro upgrade % triggered by "Posture Alert" limit.
