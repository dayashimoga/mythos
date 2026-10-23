# Mythos: Astra & The Seven Realms — Troubleshooting Guide
**Document Version:** 1.3.0-PROD  
**Classification:** Diagnostics & Operational Troubleshooting  
**Status:** Approved for Stage 1 Cross-Platform Delivery  

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
- **Root Cause:** macOS build is an unsigned development build without Apple Developer ID certificate notarization.
- **Resolution:** Open *System Settings > Privacy & Security*, scroll to the bottom, and click *Open Anyway*, or run:
  ```bash
  xattr -d com.apple.quarantine MythosAstra.app
  ```

### 1.5 Windows WebView2 Missing or Crash on Launch
- **Symptom:** Windows executable `mythos-astra.exe` exits immediately or prompts for WebView2.
- **Root Cause:** The system does not have Microsoft Edge WebView2 Evergreen runtime installed.
- **Resolution:** Windows 10/11 includes WebView2 by default. For legacy Windows systems, download the Evergreen Bootstrapper from Microsoft: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

### 1.6 Android Sideload Fails on ADB Install
- **Symptom:** `adb install` fails with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`.
- **Root Cause:** Previous version of the application installed with a different signature.
- **Resolution:** Uninstall the existing app before installing the new debug build:
  ```bash
  adb uninstall com.mythos.astra
  adb install mythos-astra-android-v0.1.0-debug.apk
  ```

### 1.7 Vitest Tests Time Out
- **Symptom:** `npm run test` times out on slower machines.
- **Root Cause:** Concurrency contention during JSDOM environment initialization.
- **Resolution:** Run `npm run test -- --maxConcurrency=1` or run a single file: `npx vitest run tests/unit/Vector2D.test.ts`.

---

## 2. Diagnostics Hotkey & Telemetry Inspection

When troubleshooting gameplay or performance anomalies, press **`F3`** (or click 📊 **Diagnostics** on the quick bar):
1. **Low FPS ($< 45\text{ FPS}$):** Check if live particles or entity count exceeds normal limits ($> 800$ particles).
2. **Audio Voices $> 10$:** Indicates sound voices are not releasing properly upon note termination.
3. **Collision Checks $> 300$:** Indicates entities are clustering in a single spatial grid cell.

---

## 3. Stage 0 & Stage 1 Architectural Baseline

### 3.1 Camera Coordinate System & Centering
- **Architecture**: `Camera` defaults position to `(0, 0)` so that world origin maps to canvas center `(width / 2, height / 2)` in `CanvasRenderer.beginWorldPass()`.
- **Reset Contract**: Every scene entry and exit triggers `camera.reset(0, 0, 1.0)` to ensure previous scene targets, shake offsets, and zooms do not leak across scene lifecycles.

### 3.2 Mouse Coordinate Scaling across Arbitrary Resolutions
- **Architecture**: `InputManager` references the active `HTMLCanvasElement` and computes normalized scale factors `scaleX = canvas.width / rect.width` and `scaleY = canvas.height / rect.height` via `getBoundingClientRect()`.
- **Result**: Mouse clicks and hover states remain pixel-accurate at all desktop and mobile aspect ratios (1920×1080, 1366×768, 1280×720, 390×844) regardless of browser CSS letterboxing.

### 3.3 Genuine Native Binary Deliverables
- **Desktop**: Tauri 2 Rust engine compiles genuine PE32+ `.exe` on Windows and ELF 64-bit binary on Linux.
- **Mobile**: Android Gradle compiles genuine `classes.dex` and binary manifest into debug APK; iOS Xcode compiles Mach-O ARM64 binary into Xcode archive.
