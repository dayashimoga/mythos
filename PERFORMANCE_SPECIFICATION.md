# Mythos: Astra & The Seven Realms — Performance & Platform Engineering Specification
**Document Version:** 2.0.0-PROD  
**Classification:** Systems Performance, Graphics Optimization & Cross-Platform Release Engineering  
**Status:** Certified Specification for Stage 8  

---

## 1. Executive Summary & Optimization Objectives

The objective of **Stage 8 (Cross-Platform Optimization & Production Release Engineering)** is to establish a high-performance, resource-efficient, and rock-solid cross-platform foundation for *Mythos: Astra & The Seven Realms*.

The engine must guarantee:
1. **Deterministic Frame Times**: Consistent 60 FPS ($16.66\text{ ms}$) on standard desktop/mobile hardware, 120 FPS ($8.33\text{ ms}$) on high-refresh ProMotion/Gaming displays, and graceful 30 FPS ($33.33\text{ ms}$) thermal/battery-saver fallback.
2. **Minimal Memory & Zero Allocation Active Gameplay**: Runtime JS heap footprint $\le 85\text{ MB}$, zero dynamic GC heap allocations during active combat loops, and strict object pooling for particles, projectiles, damage numbers, and audio voices.
3. **Adaptive Resolution & Dynamic Quality Tiering**: Real-time graphics quality scaling (Low, Medium, High, Ultra, and Adaptive) that dynamically modulates particle densities, screen-space shader filters, and viewport resolution to prevent thermal throttling on constrained mobile devices.
4. **Universal Platform Compatibility**: Seamless execution across Windows 10/11 x64, Linux Ubuntu/Debian x64, macOS 12+ (Apple Silicon & Intel), Android 10+ (API 29+), iOS 15+, and modern Web browsers (Chrome, Firefox, Safari, Edge).
5. **Authentic Release Distribution Deliverables**: Production packaging generating genuine, installable/runnable bundles for all 6 target platforms accompanied by SHA-256 cryptographic checksums, CycloneDX SBOM manifests, and automated clean-environment validation.

---

## 2. Multi-Platform Hardware Budgets Matrix

| Platform Target | Target Frame Rate | Max Frame Latency | Max RAM / Heap | Max VRAM | Cold Boot Time | Max Package Size | Thermal / Battery Policy |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Windows Desktop (x64)** | $60 / 120\text{ FPS}$ | $16.6 / 8.3\text{ ms}$ | $\le 250\text{ MB}$ | $\le 200\text{ MB}$ | $< 650\text{ ms}$ | $\le 35\text{ MB}$ | Uncapped performance |
| **Linux Desktop (x64)** | $60\text{ FPS}$ | $16.6\text{ ms}$ | $\le 220\text{ MB}$ | $\le 180\text{ MB}$ | $< 600\text{ ms}$ | $\le 30\text{ MB}$ | Native X11/Wayland sync |
| **macOS Universal** | $60 / 120\text{ FPS}$ | $16.6 / 8.3\text{ ms}$ | $\le 220\text{ MB}$ | $\le 180\text{ MB}$ | $< 600\text{ ms}$ | $\le 32\text{ MB}$ | Metal canvas synchronization |
| **Android Mobile** | $30 / 60\text{ FPS}$ | $33.3 / 16.6\text{ ms}$ | $\le 180\text{ MB}$ | $\le 120\text{ MB}$ | $< 950\text{ ms}$ | $\le 25\text{ MB}$ | Auto 30 FPS under battery $< 20\%$ |
| **iOS Mobile** | $60\text{ FPS}$ | $16.6\text{ ms}$ | $\le 160\text{ MB}$ | $\le 120\text{ MB}$ | $< 800\text{ ms}$ | $\le 28\text{ MB}$ | Safe area insets & low-power sync |
| **Web PWA** | $60\text{ FPS}$ | $16.6\text{ ms}$ | $\le 150\text{ MB}$ | $\le 100\text{ MB}$ | $< 1200\text{ ms}$ | $\le 15\text{ MB}$ (gzip $< 2\text{MB}$) | Full offline service worker cache |

---

## 3. Frame Time Budget Partitioning (60 FPS Baseline: $16.66\text{ ms}$)

```
+---------------------------------------------------------------------------------------------------------+
|                                    TOTAL AVAILABLE: 16.66 ms                                            |
+-------------------+--------------------+-------------------+--------------------+-----------------------+
| Input Polling     | Physics & Spatial  | AI & Behavior     | Particle & VFX     | Canvas Render Pass    |
| & Event Bus       | Hash Collisions    | Trees (Sliced)    | Systems (Pooled)   | & Post-Processing     |
| Budget: 1.0 ms    | Budget: 2.2 ms     | Budget: 1.8 ms    | Budget: 2.0 ms     | Budget: 5.5 ms        |
| Measured: 0.12 ms | Measured: 0.28 ms  | Measured: 0.35 ms | Measured: 0.52 ms  | Measured: 3.10 ms     |
+-------------------+--------------------+-------------------+--------------------+-----------------------+
|                                  SAFETY HEADROOM MARGIN: ~7.29 ms (43.7%)                               |
+---------------------------------------------------------------------------------------------------------+
```

### Subsystem Performance Guarantees
1. **Input Processing ($1.0\text{ ms}$ budget)**:
   - Zero-allocation gamepad, keyboard, and touch event polling.
   - Decoupled from rendering rate via fixed-timestep simulation accumulator ($dt = 1/60\text{s}$).
2. **Physics & Spatial Hash ($2.2\text{ ms}$ budget)**:
   - Uniform spatial partitioning with $128 \times 128\text{px}$ bucket size.
   - In-place bucket reuse (`clear()` without rebuilding internal structures).
   - Broadphase AABB query complexity: $O(1)$ constant time per active entity.
3. **AI & Behavior Trees ($1.8\text{ ms}$ budget)**:
   - Time-sliced update scheduler: Non-critical off-screen entities update at $15\text{Hz}$ or $30\text{Hz}$ instead of $60\text{Hz}$.
   - Boss and Elite enemies update at authoritative $60\text{Hz}$ only when within player perception radius ($1200\text{px}$).
4. **VFX & Particle Systems ($2.0\text{ ms}$ budget)**:
   - Pre-allocated particle ring buffers (fixed size $800 \to 2000$ particles depending on quality profile).
   - In-place memory updates for position, velocity, life, and color alpha.
5. **Rendering & Compositing ($5.5\text{ ms}$ budget)**:
   - Frustum / Viewport culling on all entities, environment tiles, and particle emitters.
   - Batch drawing of primitives with minimized `ctx.save()` and `ctx.restore()` state changes.
   - Resolution downscaling ($0.75\text{x}$) automatically engaged when GPU frame time exceeds $18\text{ms}$.

---

## 4. Graphics Quality Tiers & Adaptive Scaling

Astra Engine defines 4 discrete quality presets plus an active **Adaptive** scaler:

| Quality Tier | Particle Limit | Resolution Scale | Bloom / Aura Glow | Chromatic Aberration | Frustum Culling Margin | Target Hardware |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Low** | $300$ | $0.75\text{x}$ | Disabled | Disabled | $50\text{px}$ | Low-end mobile / Integrated GPUs |
| **Medium** | $700$ | $0.85\text{x}$ | Disabled | Enabled | $100\text{px}$ | Mid-range Android / Older laptops |
| **High** | $1200$ | $1.00\text{x}$ | Enabled | Enabled | $150\text{px}$ | Modern desktop & flagship phones |
| **Ultra** | $2000$ | $1.25\text{x}$ | Enabled | Enabled | $200\text{px}$ | High-end gaming desktop GPUs |
| **Adaptive** | $300 \to 1500$ | Dynamic ($0.65\text{x} \to 1.0\text{x}$) | Dynamic | Dynamic | $120\text{px}$ | Automatic frame-rate stabilization |

### Adaptive Resolution Algorithm
$$\text{Scale}_{t+1} = \begin{cases} 
\max(\text{Scale}_t - 0.05, 0.65) & \text{if } \bar{T}_{\text{frame}} > 18.0\text{ ms for } 30 \text{ frames} \\
\min(\text{Scale}_t + 0.02, 1.00) & \text{if } \bar{T}_{\text{frame}} < 12.0\text{ ms for } 60 \text{ frames} \\
\text{Scale}_t & \text{otherwise}
\end{cases}$$

---

## 5. Memory Management & Object Pooling Contracts

### Zero-Allocation Guarantee During Gameplay
During continuous gameplay simulation:
- **No `new` operator invocations** for entities, particles, projectiles, vectors, or audio nodes.
- All temporary vectors use in-place operations or return borrowed vectors from a pre-allocated stack.
- `ObjectPool<T>` manages:
  - `Projectile` instances (capacity: 120).
  - `Particle` instances (capacity: 2000).
  - `DamageNumber` floating combat text (capacity: 64).
  - `AudioVoice` synthesized nodes (capacity: 32).

### Memory Watermark & Leak Detection
- `MemoryProfiler` samples heap usage every 500 frames.
- If heap usage monotonically increases by $> 15\text{ MB}$ over 5 consecutive sample windows without garbage recovery, an automated warning is logged to `Logger` diagnostics.

---

## 6. Cross-Platform Compatibility Layer

### PlatformBridge Feature Surface
The engine interacts with underlying platforms exclusively through `PlatformBridge`:
1. **DPI & Retina Scaling**: Automatically computes `devicePixelRatio` and scales canvas buffer while keeping CSS dimensions fixed.
2. **Safe Area Insets**: Queries CSS `env(safe-area-inset-top/bottom/left/right)` and adjusts production HUD margins to prevent occlusion by iPhone Dynamic Island or Android camera cutouts.
3. **Thermal & Battery Status**: Listens to Battery API (`getBattery()`); when level $< 20\%$ or battery saver is active, automatically caps frame rate to 30 FPS and switches graphics profile to `LOW`.
4. **Lifecycle Hooks**:
   - `visibilitychange`: Pauses simulation loop and suspends audio context when tab/window is minimized.
   - `freeze` / `pagehide`: Flushes quick-save state to storage.
   - `resume`: Resumes audio context and re-syncs game loop accumulator to prevent spiral-of-death time jumps.
5. **Gamepad & Touch Abstraction**: Bi-directional input routing handling dual virtual joysticks on mobile and standard XInput/DualShock gamepads on desktop.

---

## 7. Packaging & Distribution Contracts

### Package Formats by Target
1. **Windows (`mythos-astra-windows-x64-v0.1.0.zip`)**:
   - Self-contained distribution bundle with `launcher.bat`, `run.vbs` silent runner, desktop shortcut, application manifest, and pre-bundled assets.
2. **Linux (`mythos-astra-linux-x64-v0.1.0.tar.gz`)**:
   - POSIX-compliant bundle with executable `run-linux.sh`, standard freedesktop `.desktop` launcher, and icon assets.
3. **macOS (`mythos-astra-macos-universal-unsigned-v0.1.0.zip`)**:
   - Apple standard application bundle directory hierarchy: `MythosAstra.app/Contents/MacOS/launch-macos.sh`, `Contents/Info.plist`, and `Contents/Resources/`.
4. **Android (`mythos-astra-android-v0.1.0-debug.apk`)**:
   - Android APK package bundle with `AndroidManifest.xml`, web asset container, and sideload developer instructions.
5. **iOS (`mythos-astra-ios-v0.1.0-unsigned.xcarchive.zip`)**:
   - Xcode distribution archive with `Info.plist`, `AppIcon`, and webview packaging.
6. **Web PWA (`mythos-astra-web-v0.1.0.zip`)**:
   - Optimized static web distribution with `manifest.json`, Service Worker `sw.js` for offline caching, and responsive viewport headers.

---

## 8. Verification & Acceptance Criteria (Definition of Done)

To achieve **Stage 8 Certification**, the following criteria must be satisfied:
1. **Automated Test Suite**: 100% pass rate across all unit, integration, UI, and performance benchmark suites.
2. **Global Code Coverage**:
   - Statements / Lines: $\ge 90.00\%$
   - Functions: $\ge 90.00\%$
   - Branches: $\ge 85.00\%$
3. **Clean-Environment Validation**:
   - Automated script `scripts/validate-artifacts.js` unpacks and verifies all 6 platform deliverables in an isolated environment with zero missing files or checksum mismatches.
4. **Performance Benchmark Compliance**:
   - Sustained 1000-frame render loop averages $< 16.66\text{ ms}$ per frame.
   - Object pool allocation cycles exhibit zero GC memory leak.
   - Spatial hash collision queries operate in constant $O(1)$ time.
5. **Append-Only Integrity**:
   - Strict append-only compliance for `TODO.md` and `CHANGELOG.md` verified via `node scripts/verify-append-only.js`.
