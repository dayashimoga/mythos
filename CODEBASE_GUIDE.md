# Mythos: Astra & The Seven Realms — Codebase Guide
**Document Version:** 1.0.0-PROD  
**Classification:** Developer Onboarding, Module Index & Code Convention Guide  
**Status:** Canonical & Baseline Frozen for Stage 0  

---

## 1. Directory Tree & Architecture Overview

The codebase is organized into modular, strictly decoupled layers:

```
mythologicalgame/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Multi-platform matrix CI (Ubuntu, Windows, macOS)
│       └── release.yml            # Multi-platform distribution pipeline (all 5 targets)
├── dist/                          # Production builds, SBOM, and release bundles
├── scripts/
│   ├── build-platforms.js         # Multi-platform packaging with SHA-256 generation
│   ├── generate-sbom.js           # CycloneDX SBOM & Dependency Manifest generator
│   └── verify-append-only.js      # Git diff validator for TODO.md & CHANGELOG.md
├── src/
│   ├── audio/
│   │   └── AudioEngine.ts         # WebAudio procedural sound synthesizer
│   ├── core/
│   │   ├── Diagnostics.ts         # FPS, timing, particle, and memory telemetry
│   │   ├── ErrorBoundary.ts       # Global crash handler with recovery UI
│   │   ├── EventBus.ts            # Type-safe publish/subscribe bus
│   │   └── Logger.ts              # Buffered structured logger with log levels
│   ├── engine/
│   │   ├── Engine.ts              # Root coordinator implementing IGameEngine
│   │   └── GameLoop.ts            # Fixed timestep accumulator (60Hz / 16.66ms)
│   ├── entities/
│   │   ├── Altar.ts               # Sun Altar (dormant -> attuning -> consecrated)
│   │   ├── AstraShard.ts          # Sinusoidally levitating collectible crystal
│   │   ├── EnemySentinel.ts       # Corrupted Tamas sentinel with patrol and health
│   │   ├── Entity.ts              # Abstract base entity class
│   │   ├── Player.ts              # Hero Veer (movement, dash, shoot, energy)
│   │   └── Projectile.ts          # Linear trajectory celestial energy projectile
│   ├── input/
│   │   ├── InputManager.ts        # Action-mapped keyboard/mouse/gamepad aggregator
│   │   └── VirtualJoystick.ts     # Mobile touch on-screen joystick & action buttons
│   ├── physics/
│   │   ├── AABB.ts                # Axis-Aligned Bounding Box & overlap resolution
│   │   ├── CollisionSystem.ts     # Spatial hash accelerated collision engine
│   │   ├── SpatialHash.ts         # Spatial partition grid for O(1) collision queries
│   │   └── Vector2D.ts            # 2D vector math with chaining operations
│   ├── platform/
│   │   └── PlatformBridge.ts      # Hardware & platform detection, canvas scaling
│   ├── render/
│   │   ├── Camera.ts              # Camera2D with lerp follow and screen shake
│   │   ├── CanvasRenderer.ts      # IRenderer Canvas2D implementation
│   │   ├── ParticleSystem.ts      # High-performance 800-particle pooled emitter
│   │   └── SacredGeometry.ts      # Procedural Vedic mandalas & Sri Yantra motifs
│   ├── scenes/
│   │   ├── GameScene.ts           # Playable Sanctum of Astra level
│   │   ├── SceneManager.ts        # Scene stack, transitions, and lifecycle
│   │   ├── SettingsScene.ts       # Audio volume, keybindings, reset data
│   │   ├── SplashScene.ts         # Title screen with animated sacred mandala
│   │   └── StoryScene.ts          # Prologue cutscene dialogue between Tara and Veer
│   ├── ui/
│   │   ├── DiagnosticOverlay.ts   # Live F3 telemetry panel
│   │   ├── DialogueBox.ts         # Screenplay cutscene dialogue box
│   │   └── HUD.ts                 # Health, energy, shard counter, objective banner
│   ├── main.ts                    # Application bootstrap & DOM binding
│   └── style.css                  # Modern dark cosmic theme & responsive canvas
├── tests/
│   ├── integration/
│   │   ├── Gameplay.test.ts       # Full combat, shard collection, and altar attunement
│   │   └── SceneFlow.test.ts      # Scene lifecycle transitions
│   ├── performance/
│   │   └── Benchmark.test.ts      # 800-particle and spatial hash frame budgets
│   ├── setup.ts                   # Headless Canvas2D and WebAudio mock harness
│   ├── ui/
│   │   └── UIComponents.test.ts   # HUD, DialogueBox, and DiagnosticOverlay tests
│   └── unit/
│       ├── AABB.test.ts           # Bounding box collision tests
│       ├── AudioEngine.test.ts    # Procedural audio synthesis tests
│       ├── Camera.test.ts         # Viewport and screen shake tests
│       ├── CollisionSystem.test.ts# Penetration resolution and trigger tests
│       ├── Diagnostics.test.ts    # Metric calculation tests
│       ├── Entities.test.ts       # Player, Shard, Altar, Sentinel tests
│       ├── EventBus.test.ts       # Event pub/sub tests
│       ├── Logger.test.ts         # Structured log buffer tests
│       ├── ParticleSystem.test.ts # Particle pooling tests
│       ├── SaveGameManager.test.ts# Checksum and schema tests
│       ├── SpatialHash.test.ts    # Spatial partition grid tests
│       └── Vector2D.test.ts       # Vector math tests
├── index.html                     # Semantic HTML shell, SEO tags, quick-bar
├── package.json                   # Pinned dependencies & npm scripts
├── tsconfig.json                  # Strict TypeScript configuration
└── vite.config.ts                 # Vite bundler & Vitest coverage setup
```

---

## 2. Key Subsystem Responsibilities

1. **`src/engine/GameLoop.ts`:**
   - Enforces a fixed timestep accumulator ($60\text{ Hz} \to \Delta t = 16.666\text{ ms}$).
   - Decouples physics and game logic simulation from display refresh rates ($60\text{ Hz}, 120\text{ Hz}, 144\text{ Hz}, 240\text{ Hz}$).
   - Guarded against browser tab-out "spiral of death" by capping max accumulated delta at $250\text{ ms}$.

2. **`src/physics/CollisionSystem.ts`:**
   - Leverages `SpatialHashGrid` with $128\text{ px}$ cells.
   - Divides entities into `solid` (resolves penetration) and `trigger` (invokes `onCollide`).
   - $O(1)$ lookup time per entity regardless of total world area.

3. **`src/audio/AudioEngine.ts`:**
   - 100% procedural WebAudio synthesis. Requires zero external audio downloads.
   - Generates frequency-ramped sawtooth sweeps for dashes, triangle chords for projectile firing, and major triads for shard pickups and consecration.

4. **`src/state/SaveGameManager.ts`:**
   - Schema version $1.0.0$ state with deterministic checksum calculation.
   - Detects state tampering or corrupted data and falls back gracefully to default state.

---

## 3. Coding Conventions & Best Practices

- **Strict Typing:** All TypeScript files must compile with `--strict`, `noUnusedLocals`, and `noUnusedParameters`.
- **Zero Allocations in Game Loop:** Entities, particles, and vectors are pooled or reused where possible to avoid garbage collection spikes.
- **Headless Testability:** Subsystems in `core`, `physics`, and `state` must never directly touch `window` or `document` without safe fallbacks.
