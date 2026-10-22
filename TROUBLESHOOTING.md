# Mythos: Astra & The Seven Realms — Troubleshooting Guide
**Document Version:** 1.0.0-PROD  
**Classification:** Diagnostics & Operational Troubleshooting  
**Status:** Approved for Stage 0  

---

## 1. Common Issues & Solutions

### 1.1 Audio Not Playing on First Launch
- **Symptom:** No sound effects or chiptune synthesizer audio upon loading the title screen.
- **Root Cause:** Modern web browsers (Chrome, Edge, Safari) block WebAudio `AudioContext` until the user interacts with the document (click or keypress).
- **Resolution:** Click anywhere on the game canvas or press `Space` to enter the game. The `AudioEngine` will automatically resume its context. Additionally, ensure the sound is not muted in the quick bar or Settings (`P`).

### 1.2 Black Screen or Canvas Not Centered
- **Symptom:** Canvas is off-center or clipped.
- **Root Cause:** CSS viewport calculation delay during aggressive mobile browser address bar resizing.
- **Resolution:** Resize the browser window or rotate the device. The `PlatformBridge` resize listener recalculates the optimal scaling factor automatically.

### 1.3 Append-Only Violation Error in CI (`npm run verify:append-only`)
- **Symptom:** CI fails on `verify:append-only` step with message `VIOLATION DETECTED in TODO.md / CHANGELOG.md`.
- **Root Cause:** A commit removed or edited an existing line in `TODO.md` or `CHANGELOG.md`.
- **Resolution:** Both `TODO.md` and `CHANGELOG.md` are strictly append-only. Only append new lines at the end of sections. Never delete or edit historical records.

### 1.4 macOS Gatekeeper Blocks Application
- **Symptom:** macOS displays "Mythos cannot be opened because the developer cannot be verified".
- **Root Cause:** macOS build is an unsigned development build.
- **Resolution:** Open *System Settings > Privacy & Security*, scroll to the bottom, and click *Open Anyway*.

### 1.5 Vitest Tests Time Out
- **Symptom:** `npm run test` times out on slower machines.
- **Root Cause:** Concurrency contention during JSDOM environment initialization.
- **Resolution:** Run `npm run test -- --maxConcurrency=1` or run a single file: `npx vitest run tests/unit/Vector2D.test.ts`.

---

## 2. Diagnostics Hotkey & Telemetry Inspection

When troubleshooting gameplay or performance anomalies, press **`F3`** (or click 📊 **Diagnostics** on the quick bar):
1. **Low FPS ($< 45\text{ FPS}$):** Check if live particles or entity count exceeds normal limits ($> 800$ particles).
2. **Audio Voices $> 10$:** Indicates sound voices are not releasing properly upon note termination.
3. **Collision Checks $> 300$:** Indicates entities are clustering in a single spatial grid cell.
