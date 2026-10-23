# Mythos: Astra & The Seven Realms — Requirements Specification
**Document Version:** 1.0.0-PROD  
**Project Identifier:** `mythos-astra-game`  
**Classification:** Production-Grade Technical & Gameplay Specification  
**Status:** Approved & Baseline Frozen for Stage 0  

---

## 1. Executive Summary & Vision

**Mythos: Astra & The Seven Realms** is an epic 2.5D mythological action-adventure and tactical action-RPG (ARPG) rooted in the rich cosmology, philosophy, and iconography of ancient Vedic mythology. Players assume the mantle of **Veer**, the last consecrated Solar Guardian, navigating through fractured cosmic planes (the Seven Lokas / Realms) to restore the divine order (*Rta*) disrupted by the awakening of cosmic entropy led by the primordial Asuric lord **Mahisha**.

Stage 0 establishes the **uncompromising, production-grade foundation** for this multi-platform franchise. Unlike toy prototypes or placeholder stubs, this foundation delivers a genuinely operational game engine architecture ("Astra Engine"), complete gameplay loop, fixed-timestep physics, custom particle systems, procedural audio synthesizer, save/load state serialization, robust diagnostic telemetry, automated testing with $\ge 90\%$ test coverage, and automated multi-platform CI/CD pipelines targeting Windows, Linux, macOS, Android, and iOS.

---

## 2. Target Audience & User Personas

1. **The Tactical Action Gamer (Primary):**
   - Seeks responsive, low-latency, 60 FPS combat with precise dodge windows, fluid movement, and deep weapon resonance mechanics (similar to *Hades*, *Hyper Light Drifter*, and *Raji: An Ancient Epic*).
2. **The Lore & Mythology Enthusiast (Secondary):**
   - Desires respectful, deeply researched mythological authenticity, sacred geometry visuals, Sanskrit-inspired incantations, philosophical depth, and poetic screenplay.
3. **The Multi-Platform Player:**
   - Demands seamless playability across desktop (Windows, macOS, Linux) with keyboard/mouse and gamepad, as well as mobile devices (Android, iOS) with responsive virtual touch controls.
4. **The QA / Systems Engineer:**
   - Demands real-time runtime diagnostics, verifiable FPS metrics, deterministic simulation, collision debug overlays, and rock-solid error boundaries.

---

## 3. Genre & Core Gameplay Mechanics

### 3.1 Genre
- **Primary:** Top-Down 2.5D Mythological Action-Adventure / ARPG.
- **Secondary:** Spatial Exploration with Sacred Geometry Environmental Puzzles.

### 3.2 Core Gameplay Pillars
1. **Astral Mobility:** 
   - Smooth 8-directional omni-movement with inertial deceleration.
   - High-velocity **Agni-Dash** providing temporary invulnerability frames (i-frames) and trail particle emission.
2. **Resonant Energy Combat & Projectiles:**
   - **Surya-Burst (Astra Beam):** Directional projectile emission reflecting celestial solar energy.
   - Elemental attunement (Solar, Mystic, Prana) modifying attack trajectory and resonance.
3. **Sacred Altar Attunement:**
   - Interactive environmental altars requiring players to channel gathered Astra Shards to calibrate the cosmic seal.
   - Altar activation triggers procedural visual mandala blooms and harmonic audio chimes.
4. **Astra Shard Harvesting:**
   - Shards hover with sinusoidal levitation and luminous pulsing.
   - Spatial proximity detection triggers magnetic suction toward the player.
5. **Deterministic Game Simulation:**
   - Fixed 60 Hz physics timestep with state interpolation ensuring identical simulation across high-refresh-rate desktop displays and mobile screens.

---

## 4. Narrative & Character Archetypes

### 4.1 Narrative Premise
At the twilight of the Dvapara Yuga, the cosmic anchor binding the realm of shadows (*Patala*) to the heavens (*Svarga*) fractures. The primordial energy of *Tamas* (entropy) seeps into the mortal sanctuary of *Bhumi*. Veer, sanctified with the Solar Core of Astra, awakens within the subterranean Sanctum of Astra. Before traversing the Seven Realms, Veer must rekindle the primary Altar of Surya, prove mastery over elemental energy, and shatter the corruption sentinels guarding the Astral Gate.

### 4.2 Key Characters (Stage 0 Roster)
- **Veer (The Protagonist):** Solar Guardian adorned in bronze-trimmed armor, wielding the radiant Agni-Blade and Astra Focus.
- **Tara (The Voice of Guidance):** An astral oracle communicating across dimensions via sacred dialogue transcripts.
- **Entropy Sentinel (Stage 0 Adversary / Obstacle):** Manifestation of dark Tamas guarding the threshold of the Sanctum.

---

## 5. Functional Requirements (FR)

| ID | Module | Description | Criticality |
| :--- | :--- | :--- | :--- |
| **FR-01** | Core / Engine | Deterministic game loop utilizing fixed timestep accumulator (default: 16.66ms / 60 Hz) and RAF synchronization. | MUST HAVE |
| **FR-02** | Rendering | Hardware-accelerated 2D/2.5D Canvas/WebGL rendering pipeline with dynamic z-sorting, sacred geometry procedural rendering, and smooth camera tracking with viewport clamping. | MUST HAVE |
| **FR-03** | Physics | Real-time 2D Axis-Aligned Bounding Box (AABB) and circle collision detection, continuous separation resolution, and spatial partition grid. | MUST HAVE |
| **FR-04** | Input | Universal Input Manager supporting simultaneous Keyboard/Mouse (WASD/Arrows + Click/Space), Gamepad API (XInput/Standard), and Virtual Touch Joystick for mobile. | MUST HAVE |
| **FR-05** | Audio | WebAudio procedural sound synthesizer producing chiptune and harmonic chords for dashes, projectile blasts, shard pickups, and ambient drones without external asset blocking. | MUST HAVE |
| **FR-06** | Entities | Extensible Entity-Component-System (ECS) style entity hierarchy with Player, Projectile, Shard, Altar, Sentinel, and ParticleEmitter. | MUST HAVE |
| **FR-07** | Scene Mgmt | Robust Scene Manager with state transitions: Splash, Story Prologue (screenplay dialogue), Sanctum Gameplay, Pause, and Victory/Completion overlays. | MUST HAVE |
| **FR-08** | UI / HUD | Responsive HUD showing Health bar, Astra Energy meter, Shard Counter, Active Objective, and Keybindings helper. | MUST HAVE |
| **FR-09** | Diagnostics | In-engine Diagnostic Overlay displaying real-time FPS, frame duration (ms), entity count, particle count, audio node status, memory estimation, and collision box toggle (F3 / '`' key). | MUST HAVE |
| **FR-10** | Persistence | State persistence manager utilizing LocalStorage with schema versioning, JSON serialization, checksum validation, and fallback memory storage. | MUST HAVE |
| **FR-11** | Particles | Custom high-performance particle engine capable of emitting up to 1,000 active particles with velocity, drag, alpha fade, color interpolation, and radial bursts. | MUST HAVE |
| **FR-12** | Error Boundary | Global unhandled exception and rejection handlers preventing black screens; renders an elegant crash fallback screen with diagnostic error logs and reload options. | MUST HAVE |

---

## 6. Non-Functional Requirements (NFR)

| ID | Category | Requirement Specification |
| :--- | :--- | :--- |
| **NFR-01** | **Performance** | Sustained 60 FPS on standard modern hardware (Intel Iris Xe / GTX 1050 or equivalent; Snapdragon 700+ / Apple A12+). Max frame budget: 16.66ms. |
| **NFR-02** | **Memory** | Baseline engine runtime footprint $\le 80\text{ MB}$ RAM in browser/desktop shell; zero memory leaks during scene transitions. |
| **NFR-03** | **Portability** | Universal TypeScript codebase running natively in modern browsers, packaged for Windows (.exe), Linux (standalone/tar), macOS (.app), Android (.apk), and iOS. |
| **NFR-04** | **Test Coverage** | First-party engine code must achieve $\ge 90\%$ test coverage (lines, functions, branches) with 100% passing test runs. |
| **NFR-05** | **Startup Time** | Engine cold boot to interactive splash $\le 1.2\text{ seconds}$ on broadband desktop, $\le 2.0\text{ seconds}$ on mid-tier mobile. |
| **NFR-06** | **Accessibility** | High-contrast visual cues for celestial altars and projectiles; fully rebindable input keys and touch-friendly interactive hitboxes ($\ge 44\times 44\text{ px}$). |
| **NFR-07** | **Integrity** | `TODO.md` and `CHANGELOG.md` are strictly append-only; enforced via automated CI git diff verification scripts. |
| **NFR-08** | **Zero Simulation** | All features claimed in Stage 0 (physics, rendering, audio synthesis, diagnostics, entity collision, navigation) must be real, executable code. |

---

## 7. Supported Platforms & Build Targets

| Platform | Deployment Target | Runner / Toolchain | Artifact Format | Release Status |
| :--- | :--- | :--- | :--- | :--- |
| **Web** | Modern Browsers (Chrome, Edge, Firefox, Safari) | Vite 5.x / HTML5 | Static PWA bundle (`dist/`) | Production Ready |
| **Windows** | Windows 10 & 11 x64 | Node / Electron / Runner | Standalone Win32 zip / exe | Production Ready |
| **Linux** | Ubuntu 20.04+, Debian, Fedora | Node / Linux Runner | Linux x64 standalone bundle | Production Ready |
| **macOS** | macOS 12+ (Intel & Apple Silicon) | macOS runner / tar | Unsigned `.app` / DMG bundle | Unsigned Dev Build |
| **Android** | Android 10+ (API Level 29+) | Gradle 8.x / Android SDK | `.apk` (Debug/Release ready) | Production Ready |
| **iOS** | iOS 15.0+ | Xcode 15+ / macOS runner | Unsigned `.xcarchive` / `.ipa` | Unsigned Dev Build |

> **Note on Apple Artifacts:** In compliance with engineering guidelines, macOS and iOS artifacts generated in CI without paid enterprise signing certificates are explicitly designated and checksummed as **Unsigned Development Builds**.

---

## 8. Performance Budgets

- **Target Framerate:** 60 FPS ($\pm 2\text{ FPS}$ tolerance)
- **Render Time Budget:** $\le 8.0\text{ ms}$
- **Physics & Update Budget:** $\le 3.5\text{ ms}$
- **Audio Synthesizer Budget:** $\le 1.0\text{ ms}$
- **Garbage Collection (GC) Pressure:** Near-zero allocation during active combat loop (pre-allocated particle and projectile object pools).
- **Bundle Size:** Compressed initial distribution $\le 5\text{ MB}$.

---

## 9. Measurable Acceptance Criteria (AC)

- **AC-01 (Clean Build):** `npm run build` succeeds with zero TypeScript typecheck errors and produces a valid `dist/` directory.
- **AC-02 (Test Suite):** `npm run test` executes all unit, integration, and UI tests with 100% passing assertions.
- **AC-03 (Test Coverage):** `npm run test:coverage` reports $\ge 90\%$ line coverage across `src/`.
- **AC-04 (Append-Only Enforcement):** `npm run verify:append-only` confirms that `TODO.md` and `CHANGELOG.md` have strictly append-only commit changes.
- **AC-05 (Interactive Navigation):** The application boots into the Title/Splash scene, navigates to the Story Prologue, advances into the Sanctum Gameplay, pauses with ESC/P, and reaches Victory upon collecting 3 shards and activating the Sun Altar.
- **AC-06 (Real Physics & Collision):** The player cannot walk through stone boundaries; projectiles collide with sentinels and cause damage; shards are gathered when within pickup radius.
- **AC-07 (Procedural Audio):** Audio synthesizer produces audible feedback for moves, dashes, blasts, and altar events upon user interaction, with mute toggle functionality.
- **AC-08 (Diagnostics Overlay):** Pressing `F3` or tapping the Diagnostics button displays a live readout of FPS, entities, audio status, and viewport dimensions.
- **AC-09 (State Roundtrip):** State persistence saves player shard count, altar state, and high scores to LocalStorage and loads them correctly across sessions.
- **AC-10 (Multi-Platform CI Workflows):** GitHub Actions CI and Release workflows validate multi-platform compilation across Windows, Linux, macOS, Android, and iOS runners with SHA-256 artifact hashing.

---

## 10. Comprehensive Requirements Traceability Matrix (Stages 0–8 Audit)

| Req ID | Requirement Description | Stage | Source Implementation | Test Verification | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **REQ-001** | Deterministic Fixed-Timestep Simulation Loop | Stage 0 | `src/engine/GameLoop.ts` | `tests/unit/BranchCoverage.test.ts` | **COMPLETE** |
| **REQ-002** | 2D/2.5D Canvas Rendering & Visual Diagnostics | Stage 0 | `src/render/CanvasRenderer.ts`, `Diagnostics.ts` | `tests/unit/RendererAndGeometry.test.ts` | **COMPLETE** |
| **REQ-003** | Spatial Partitioning & AABB Collision System | Stage 0 | `src/physics/SpatialHash.ts`, `CollisionSystem.ts` | `tests/unit/SpatialHash.test.ts` | **COMPLETE** |
| **REQ-004** | Bhumi Sunken Temple Vertical Slice Experience | Stage 1 | `src/scenes/BhumiTempleScene.ts` | `tests/integration/BhumiTempleFlow.test.ts` | **COMPLETE** |
| **REQ-005** | Resonance Pillars, Agni-Forge & Tamas Spire | Stage 1 | `src/entities/ResonancePillar.ts`, `AgniForge.ts` | `tests/integration/BhumiTempleFlow.test.ts` | **COMPLETE** |
| **REQ-006** | 21-Bone Skeletal Rigging & Dual-Bone IK | Stage 2 | `src/animation/CharacterRig.ts`, `InverseKinematics.ts` | `tests/unit/CharacterRigAndShowcase.test.ts` | **COMPLETE** |
| **REQ-007** | Character Animation Studio & Showcase Scene | Stage 2 | `src/scenes/CharacterShowcaseScene.ts` | `tests/unit/CharacterRigAndShowcase.test.ts` | **COMPLETE** |
| **REQ-008** | Dynamic 2D Lighting, Shadow Penumbra & Weather | Stage 3 | `src/environment/2DLightingEngine.ts`, `AtmosphericSystem.ts` | `tests/unit/EnvironmentSystems.test.ts` | **COMPLETE** |
| **REQ-009** | 2D NavMesh & A* Pathfinding Grid | Stage 3 | `src/environment/NavMesh.ts` | `tests/unit/NavMeshAndPathfinding.test.ts` | **COMPLETE** |
| **REQ-010** | Open-World Exploration Experience | Stage 3 | `src/scenes/WorldExplorationScene.ts` | `tests/unit/WorldExplorationScene.test.ts` | **COMPLETE** |
| **REQ-011** | Authoritative Combat, Parrying & Shield Block | Stage 4 | `src/gameplay/CombatSystem.ts`, `EquipmentManager.ts` | `tests/unit/CombatAndEquipment.test.ts` | **COMPLETE** |
| **REQ-012** | Behavior Tree AI & Blackboard Perception | Stage 4 | `src/gameplay/BehaviorTree.ts` | `tests/unit/BehaviorTree.test.ts` | **COMPLETE** |
| **REQ-013** | Mahishasura Titan Boss & Asura Vanguard AI | Stage 4 | `src/entities/MahishasuraBoss.ts`, `AsuraEliteVanguard.ts` | `tests/unit/BossAndVanguardAI.test.ts` | **COMPLETE** |
| **REQ-014** | Narrative Architecture, Screenplay & Dialogue Trees | Stage 5 | `src/narrative/DialogueTree.ts`, `CampaignChapter1.ts` | `tests/unit/QuestAndNarrative.test.ts` | **COMPLETE** |
| **REQ-015** | Directed Acyclic Graph (DAG) Quest Manager | Stage 5 | `src/narrative/QuestManager.ts` | `tests/unit/QuestAndNarrative.test.ts` | **COMPLETE** |
| **REQ-016** | Playable Story Campaign Act I & Encounter Scenes | Stage 5 | `src/scenes/StoryCampaignScene.ts`, `BossEncounterScene.ts` | `tests/unit/CinematicAndCampaignScene.test.ts` | **COMPLETE** |
| **REQ-017** | Accessible Design System & WCAG 2.1 Contrast Tokens | Stage 6 | `src/ui/design/DesignTokens.ts`, `FocusManager.ts` | `tests/unit/DesignSystemAndUI.test.ts` | **COMPLETE** |
| **REQ-018** | Reusable Accessible UI Components & Modals | Stage 6 | `src/ui/components/UIModal.ts`, `UIButton.ts` | `tests/ui/UIComponents.test.ts` | **COMPLETE** |
| **REQ-019** | Full Accessibility Manager (Motion, Shake, Subtitles) | Stage 6 | `src/ui/accessibility/AccessibilityManager.ts` | `tests/unit/DesignSystemAndUI.test.ts` | **COMPLETE** |
| **REQ-020** | Responsive Production HUD & Codex Modal | Stage 6 | `src/ui/ProductionHUD.ts`, `CodexQuestModal.ts` | `tests/unit/DesignSystemAndUI.test.ts` | **COMPLETE** |
| **REQ-021** | Procedural Vedic Raga Synthesizer (Tanpura/Sitar/Tabla) | Stage 7 | `src/audio/RagaMusicGenerator.ts` | `tests/unit/AudioDesignAndSynthesizer.test.ts` | **COMPLETE** |
| **REQ-022** | 2D Spatial Audio Listener with Doppler Shift | Stage 7 | `src/audio/SpatialAudioListener.ts` | `tests/unit/AudioDesignAndSynthesizer.test.ts` | **COMPLETE** |
| **REQ-023** | Formant Sanskrit Mantra Synthesizer (OM/HRĪM/KRĪM/PHAṬ) | Stage 7 | `src/audio/MantraSynthesizer.ts` | `tests/unit/AudioDesignAndSynthesizer.test.ts` | **COMPLETE** |
| **REQ-024** | Physics-Based Material Foley Synthesizer | Stage 7 | `src/audio/FoleySynthesizer.ts` | `tests/unit/AudioDesignAndSynthesizer.test.ts` | **COMPLETE** |
| **REQ-025** | Dynamic Cinematic Director & Vertigo Dolly Zoom | Stage 7 | `src/cinematics/CinematicDirector.ts` | `tests/unit/CinematicsAndVFX.test.ts` | **COMPLETE** |
| **REQ-026** | Celestial Particle VFX & Chromatic Shockwaves | Stage 7 | `src/render/CelestialVFX.ts` | `tests/unit/CinematicsAndVFX.test.ts` | **COMPLETE** |
| **REQ-027** | Multi-Platform Performance Budgets & Specification | Stage 8 | `PERFORMANCE_SPECIFICATION.md` | `tests/performance/PlatformBenchmark.test.ts` | **COMPLETE** |
| **REQ-028** | Graphics Quality Manager & Adaptive Resolution Scaling | Stage 8 | `src/render/GraphicsQualityManager.ts` | `tests/unit/PerformanceAndPlatform.test.ts` | **COMPLETE** |
| **REQ-029** | Render Batcher & Viewport Frustum Culling | Stage 8 | `src/render/RenderBatcher.ts` | `tests/unit/PerformanceAndPlatform.test.ts` | **COMPLETE** |
| **REQ-030** | Zero-Allocation Object Pool & Memory Profiler | Stage 8 | `src/core/ObjectPool.ts`, `MemoryProfiler.ts` | `tests/unit/PerformanceAndPlatform.test.ts` | **COMPLETE** |
| **REQ-031** | Cross-Platform Bridge with Notches & Safe Areas | Stage 8 | `src/platform/PlatformBridge.ts` | `tests/unit/PerformanceAndPlatform.test.ts` | **COMPLETE** |
| **REQ-032** | Genuine Multi-Platform Releases (6 Targets) & CI Audit | Stage 8 | `scripts/build-platforms.js`, `validate-artifacts.js` | `npm run validate:artifacts` | **COMPLETE** |

---

## 11. Stage 9 — Independent QA, Performance Certification & Release Verification Traceability Matrix

| Req ID | Requirement Description | Stage | Source Implementation | Test Verification | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **REQ-033** | Requirements & Implementation Traceability Engine | Stage 9 | `src/scenes/StoryCampaignScene.ts`, `AssetManifest.ts` | `tests/unit/Stage9ProductionHardeningAndTraceability.test.ts` | **VERIFIED** |
| **REQ-034** | Deep Graphics & Runtime Lifecycle Audit | Stage 9 | `src/scenes/BhumiTempleScene.ts`, `StoryCampaignScene.ts`, `BossEncounterScene.ts` | `tests/unit/Stage9ProductionHardeningAndTraceability.test.ts`, Playwright E2E | **VERIFIED** |
| **REQ-035** | Real Performance Profiling & Hardware Budgets | Stage 9 | `src/core/MemoryProfiler.ts`, `tests/performance/PlatformBenchmark.test.ts` | `npm run test` (PlatformBenchmark) | **VERIFIED** |
| **REQ-036** | Targeted Optimization & Zero Visual Degradation | Stage 9 | `src/render/RenderBatcher.ts`, `src/physics/SpatialHash.ts` | `tests/performance/PlatformBenchmark.test.ts` | **VERIFIED** |
| **REQ-037** | Comprehensive Functional Certification & Code Coverage Gate | Stage 9 | Full `src/` codebase (55 test files, 478 unit tests) | `npm run test:coverage` (Stmt $\ge$ 90%, Branch $\ge$ 85%, Func $\ge$ 90%, Line $\ge$ 90%) | **VERIFIED** |
| **REQ-038** | Genuine Platform Release Verification (6 Targets) | Stage 9 | `scripts/build-platforms.js`, `scripts/validate-artifacts.js` | `npm run validate:artifacts` (100% binary integrity) | **VERIFIED** |
| **REQ-039** | Immutable Release Manifest, Governance & Final GO Decision | Stage 9 | `TODO.md`, `CHANGELOG.md`, `scripts/verify-append-only.js` | `npm run verify:append-only`, `stage_9_performance_and_release_certification_report.md` | **VERIFIED (GO)** |

---

## 12. Stage R0 — Runtime, Camera, Viewport & Scene Composition Defects Repair Matrix

| Req ID | Requirement Description | Stage | Source Implementation | Test Verification | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **REQ-R0-001** | Authoritative World, Viewport & Screen Coordinate Spaces | Stage R0 | `src/render/Camera.ts`, `src/render/CanvasRenderer.ts` | `tests/e2e/scene-runtime.spec.ts` | **VERIFIED** |
| **REQ-R0-002** | Camera Bounds Clamping & Player-Centered Tracking | Stage R0 | `src/render/Camera.ts` | `tests/unit/Camera.test.ts`, `tests/e2e/scene-runtime.spec.ts` | **VERIFIED** |
| **REQ-R0-003** | Render Transform Isolation & State Balancing | Stage R0 | `src/render/CanvasRenderer.ts`, `src/scenes/SceneManager.ts`, `src/engine/Engine.ts` | `tests/e2e/scene-runtime.spec.ts` | **VERIFIED** |
| **REQ-R0-004** | Alpha Feathering & Chroma-Keying Asset Shaders | Stage R0 | `src/assets/AssetManager.ts` | `tests/e2e/scene-runtime.spec.ts` | **VERIFIED** |
| **REQ-R0-005** | Viewport-Safe HUD, Dialogue & Modal Positioning | Stage R0 | `src/narrative/DialogueTree.ts`, `src/cinematics/CinematicDirector.ts`, `src/scenes/StoryCampaignScene.ts`, `src/scenes/BossEncounterScene.ts`, `src/ui/ProductionHUD.ts`, `src/ui/DiagnosticOverlay.ts` | `tests/e2e/scene-runtime.spec.ts` | **VERIFIED** |
| **REQ-R0-006** | Compounded Path Stroke Eradication & Canvas Clearing | Stage R0 | `src/scenes/WorldExplorationScene.ts`, `src/engine/Engine.ts` | `tests/e2e/scene-runtime.spec.ts` | **VERIFIED** |
| **REQ-R0-007** | Safe Scene Transition Navigation & Lifecycle Isolation | Stage R0 | `src/scenes/SceneManager.ts`, `src/scenes/StoryCampaignScene.ts`, `src/scenes/BossEncounterScene.ts` | `tests/e2e/scene-runtime.spec.ts` (20x sequential transitions) | **VERIFIED** |
| **REQ-R0-008** | Automated Visual Regression Testing (5 Viewport Profiles) | Stage R0 | `playwright.config.ts`, `tests/e2e/scene-runtime.spec.ts` | Playwright test suite (45/45 passing across 5 viewports) | **VERIFIED** |

---

## 13. Stage R1 — Modern Graphics & Production Art Pipeline Matrix

| Req ID | Requirement Description | Stage | Source Implementation | Test Verification | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **REQ-R1-001** | Forensic Rendering & Production Art Audit | Stage R1 | `STAGE_R1_ART_AND_RENDERING_SPECIFICATION.md` | `tests/unit/StageR1AssetPipelineAndSanctum.test.ts` | **VERIFIED** |
| **REQ-R1-002** | Comparative Architecture Benchmark POC (Canvas2D vs PixiJS/WebGL2) | Stage R1 | `tests/performance/RenderingArchitectureComparison.test.ts` | `npm run test` (RenderingArchitectureComparison) | **VERIFIED** |
| **REQ-R1-003** | 2.5D Hoysala/Vedic Temple Fantasy Art Direction & Standards | Stage R1 | `ART_DIRECTION.md`, `STAGE_R1_ART_AND_RENDERING_SPECIFICATION.md` | Human visual review, screenshot captures | **VERIFIED** |
| **REQ-R1-004** | Real Asset Pipeline, SpriteAtlas, Normalized Pivots & Provenance | Stage R1 | `src/assets/SpriteAtlas.ts`, `AssetProvenance.ts`, `AssetPipelineDiagnostics.ts` | `tests/unit/StageR1AssetPipelineAndSanctum.test.ts` | **VERIFIED** |
| **REQ-R1-005** | Complete Sanctum Level Visual Reconstruction | Stage R1 | `src/scenes/GameScene.ts`, `public/assets/art/` | Playwright E2E, Browser subagent walkthrough | **VERIFIED** |
| **REQ-R1-006** | Multi-Pass Dynamic Lighting, Contact Shadows & Shading Optimization | Stage R1 | `src/scenes/GameScene.ts`, `src/assets/AssetManager.ts` | `tests/unit/StageR1AssetPipelineAndSanctum.test.ts` | **VERIFIED** |
| **REQ-R1-007** | Automated Visual & Functional Validation with Video Recordings | Stage R1 | Playwright E2E (`scene-runtime.spec.ts`), Vitest test suite (56 suites, 486 tests) | Playwright E2E (45/45 passing), WebP gameplay recording | **VERIFIED** |


