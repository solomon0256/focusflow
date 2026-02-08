
# Network Dependency & Asset Strategy

## 1. Context: The 10MB Limit
Google AI Studio and certain rapid prototyping environments enforce a strict **10MB limit** on the total project size.

## 2. The Heavy Asset: MediaPipe Models
The core AI capability of FocusFlow relies on Google's MediaPipe Pose Landmarker.
*   **File**: `pose_landmarker_lite.task`
*   **Size**: Approx. 8.5MB - 9MB.
*   **Impact**: Including this single file would consume nearly 90% of the allowed quota, leaving no room for code, UI assets, or Git history.

## 3. The Solution: CDN Loading (Runtime Injection)
Instead of bundling the model locally, we fetch it at runtime.

### Current Implementation
*   **WASM Engine**: Fetched from `jsdelivr` (fastest in China/Global).
    *   URL: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm`
*   **Model Weights**: Fetched from Google Storage (or a mirror).
    *   URL: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`

### Trade-offs
*   **Pros**: Keeps project size tiny (< 500KB).
*   **Cons**: Requires internet connection on first launch. May trigger `Failed to fetch` errors if the user is behind a strict firewall or VPN (Network Instability).

## 4. Future Roadmap (Native Migration)
When migrating to **Capacitor (iOS/Android Native App)**, we will remove this dependency.
1.  **Download** the `.task` file.
2.  **Bundle** it into the App's `public/assets/models/` directory.
3.  **Refactor** `FocusSessionView.tsx` to load from `./assets/models/...` instead of `https://...`.

This ensures the app works 100% offline in production.
