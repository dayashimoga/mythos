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
│   ├── assets/
│   │   ├── AssetManager.ts        # Preloader, BFS transparency keyer & proxies
│   │   ├── AssetManifest.ts       # 28-item production asset catalog
│   │   ├── AssetPipelineDiagnostics.ts # Lint, pivot & UI portrait separation validator
│   │   ├── AssetProvenance.ts     # SHA-256 provenance registry & CC-BY-4.0 licensing
│   │   └── SpriteAtlas.ts         # High-performance 2.5D sprite atlas with normalized pivots
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

---

## 4. Stage R0 Rendering, Viewport Safe-Area & Scene Lifecycle Contracts

### 4.1 World-Pass vs. Screen-Pass Rendering Separation
- **World Pass:** All entities, terrain tiles, particle bursts, and atmospheric effects must be drawn within `renderer.beginWorldPass()` and `renderer.endWorldPass()`.
- **Screen Pass:** All HUD elements, modal dialogs, dialogue trees, and cinematic letterboxes must be drawn strictly after `renderer.endWorldPass()`. Never apply camera translation offsets to screen-space elements.

### 4.2 Top-Bar Safe-Area Guidelines
- The DOM `#quick-bar` container occupies the top-right screen space ($x \ge 980\text{px}$, $y: 16\text{px} - 48\text{px}$).
- Top-right canvas UI buttons (e.g., Pause, Codex, Diagnostics, Compendium tabs) must be positioned at $y \ge 56\text{px}$ or positioned left of $x = 980\text{px}$ to avoid click and hover collisions with the DOM bar.

### 4.3 Canvas Path Hygiene (`ctx.beginPath`)
- Always execute `ctx.beginPath()` prior to calling `ctx.roundRect()` or geometric path generation. Omitting `ctx.beginPath()` causes accumulated path strokes to restroke repeatedly every frame, creating opaque dark rectangles and corrupted borders.

### 4.4 Scene Lifecycle & Stack Reset
- When returning to `SplashScene`, invoke `sceneManager.clearNavigationStack()` and `camera.reset(0, 0, 1.0)`.
- Scenes must clean up event listeners, pooled particle references, and transient UI states in `onExit()`.

---

## 5. Stage 3D-0 Godot 3D Project Structure & Developer Workflows

### 5.1 Directory Layout (`godot/`)
```
godot/
├── project.godot               # Master Godot 4.3 configuration
├── export_presets.cfg          # Export definitions (Windows, Linux, Web)
├── icon.svg                    # Sacred Surya 8-pointed solar icon
├── scenes/
│   ├── levels/
│   │   └── TestChamber3D.tscn  # Complete 3D Sanctum test environment
│   ├── player/
│   │   └── Player3D.tscn       # CharacterBody3D, SpringArm3D orbit camera, avatar mesh
│   ├── interactables/
│   │   ├── SunShrine3D.tscn    # Area3D Sun Altar shrine with rotating mandala
│   │   └── AstraShard3D.tscn   # Area3D floating crystal pickups
│   └── ui/
│       └── HUD3D.tscn          # CanvasLayer HUD (HP, shards, objectives, hotkeys)
├── scripts/
│   ├── camera/
│   │   └── orbit_camera_3d.gd  # Third-person spherical orbit camera controller
│   ├── domain/
│   │   ├── combat_math.gd      # Ported combat formulas, parry, block, poise, criticals
│   │   ├── quest_manager.gd    # Ported quest state machine and objectives
│   │   ├── dialogue_runner.gd  # Ported dialogue graph traversal
│   │   └── save_system.gd      # Ported JSON persistence with SHA-256 checksums
│   ├── interactables/
│   │   ├── shrine_3d.gd        # Proximity prompt and flame ignition logic
│   │   └── astra_shard_3d.gd   # Continuous rotation, bobbing, and pickup detection
│   ├── levels/
│   │   └── test_chamber_3d.gd  # Scene controller, lighting, and quest events
│   └── player/
│       └── player_controller_3d.gd # Locomotion, gravity, stairs, dash, combo slash
└── tests/
    ├── runner.gd               # Headless test runner script (exits 0 on success)
    ├── unit/                   # Unit test suites (combat, quests, save, dialogue)
    └── integration/            # 3D traversal, stairs elevation, camera orbit tests
```

### 5.2 Developer Commands
- `npm run test:godot`: Executes Godot headless test runner natively on Windows (`tools/godot/Godot_v4.3-stable_win64_console.exe`).
- `npm run test:godot:podman`: Executes Godot headless test runner in containerized Podman environment (`barichello/godot-ci:4.3`).
- `npm run test`: Executes full Vitest suite (including `Stage3D0MigrationAndParity.test.ts`).

---

## 6. Stage Q0 Seven-Realm Architecture, Testing & Build Workflows

### 6.1 Seven-Realm Scene Layout
```
godot/scenes/levels/
├── BhumiValley3D.tscn          # Act I: Terrestrial Valley & Boss Kalanemi
├── AntarikshaSkyRealm3D.tscn   # Act II: Cloud Islands, Glider & Boss Matarishvan
├── PatalaUnderworld3D.tscn     # Act III: Bioluminescent Cavern & Boss Shesha Echo
├── SvarSolarCitadel3D.tscn     # Act IV: Solar Light Bridges & Boss Surya Avatara
├── MaharlokaSanctuary3D.tscn   # Act V: Astral Library Archives & Boss Brihaspati
├── TapolokaForge3D.tscn        # Act VI: Magma Geysers & Boss Agni Rudra
├── SatyalokaApex3D.tscn        # Act VII: Cosmic Dharma Wheel & Boss Brahma Avatara
└── TestChamber3D.tscn          # Diagnostic baseline & physics test chamber
```

### 6.2 Developer Realm Navigation Hotkeys (In-Game F1–F8)
For rapid in-engine inspection and QA traversal, the global realm controller responds to developer navigation keys:
- `F1`: Act I — Bhumi Valley
- `F2`: Act II — Antariksha Sky Realm
- `F3`: Act III — Patala Underworld
- `F4`: Act IV — Svar Solar Citadel
- `F5`: Act V — Maharloka Sanctuary
- `F6`: Act VI — Tapoloka Forge
- `F7`: Act VII — Satyaloka Apex
- `F8`: 3D Character Studio

### 6.3 Test & Build Verification Commands
- `npm run test:godot`: Executes all 16 Godot test suites (106 unit & integration tests) in headless mode via `Godot_v4.3-stable_win64_console.exe`.
- `npm test`: Executes legacy 2D Canvas Vitest suites (58 test files, 504 unit tests).
- `node scripts/verify-append-only.js`: Verifies append-only integrity of `TODO.md` and `CHANGELOG.md`.
- Export Web Package:
  ```powershell
  tools\godot\Godot_v4.3-stable_win64_console.exe --headless --path ./godot -s scripts/tools/build_web_pack.gd
  Copy-Item -Force public/3d/index.pck dist/3d/index.pck
  Copy-Item -Force public/3d/index.pck builds/web/index.pck
  ```

---

## 7. Stage Q1 Production 3D Veer Character Reconstruction Pipeline

### 7.1 Asset Hierarchy & Model Specification
- **Editable Source**: `godot/assets/characters/veer/veer_production.blend`
- **Exported glTF**: `godot/assets/characters/veer/veer.glb` (2,781,052 bytes, 22,147 vertices, 26,594 triangles)
- **Model Sheet**: `public/assets/art/veer_orthographic_model_sheet.jpg` & `godot/assets/characters/veer/veer_model_sheet.jpg`
- **PBR Textures**: `godot/assets/characters/veer/textures/` (23 1024x1024 textures across 7 materials: `skin`, `armor`, `gold`, `dhoti`, `sash`, `khadga`, `hair`)
- **Validation Screenshots**: `docs/images/veer_validation/` (8 high-resolution in-engine captures: front, three-quarter, closeup, weapon detail, back, profile, studio overview, bhumi gameplay)

### 7.2 Bone Hierarchy & Weapon Sockets (24-Node Skeleton3D)
```
root
└── pelvis
    ├── spine_01
    │   └── chest
    │       ├── neck
    │       │   └── head
    │       │       └── topknot
    │       ├── shoulder_l -> arm_l -> forearm_l -> hand_l
    │       ├── shoulder_r -> arm_r -> forearm_r -> hand_r -> socket_right_hand
    │       └── sash_01 -> sash_02
    ├── thigh_l -> shin_l -> foot_l
    └── thigh_r -> shin_r -> foot_r
```

### 7.3 Reconstruction & Packaging Scripts
- `scripts/build_veer_geometry.py`: Blender 4.2 headless script assembling anatomical base mesh and 9 bespoke Vedic polygonal costume elements.
- `scripts/generate_veer_textures.py`: Generates all 23 PBR maps with micro-surface normals and roughness/metallic values.
- `godot/scripts/import_veer_direct.gd`: Direct GLTFDocument `.scn` importer compiling imported binary scenes into `.godot/imported/`.
- `godot/scripts/tools/build_web_pack.gd`: Native `PCKPacker` builder compiling `public/3d/index.pck` without external export templates.

---

## 8. Stage Q2 Realistic 3D Locomotion & AnimationTree Architecture

### 8.1 Locomotion State Architecture (`godot/scripts/player/player_controller_3d.gd`)
The character controller integrates an `AnimationTree` with `AnimationNodeStateMachine` and a root `AnimationNodeBlendSpace2D` named `Locomotion`:
- **2D Locomotion Blend Space Coordinates**:
  - `(0.0, 0.0)`: `idle` (2.4s natural breathing, weight shifts, sash swing)
  - `(0.0, 4.2)`: `walk` (heel strike $+16^\circ$, foot roll, toe-off $-20^\circ$)
  - `(0.0, 7.5)`: `jog` (athletic spring and pelvic bounce)
  - `(0.0, 10.5)`: `sprint` (forward torso lean and arm counter-swing)
  - `(0.0, -3.5)`: `walk_backward` (backward gait with heel push)
  - `(-3.8, 0.0)`: `strafe_left` (lateral side-stepping)
  - `(3.8, 0.0)`: `strafe_right` (lateral side-stepping)
  - Diagonals: `(-2.5, 3.0)` and `(2.5, 3.0)` forward strafe; `(-2.5, -2.5)` and `(2.5, -2.5)` backward strafe
- **Discrete Action Nodes**:
  - Agility: `jump`, `fall`, `landing`, `dodge` (Prana Dash roll)
  - Combat: `block` (shield guard), `parry` (deflection), `attack_light_1`, `attack_light_2`, `attack_heavy_finisher`
  - Secondary: `hit_reaction` (stagger), `interact`, `turn_left_90`, `turn_right_90`, `turn_180`, `victory`, `defeat`
- **Transition Continuity**:
  - Cross-fade blending times range from $0.06\text{s}$ (parry, hit reaction) to $0.20\text{s}$ (victory, defeat).
  - One-shot actions return to `Locomotion` via `SWITCH_MODE_AT_END`.

### 8.2 Physics & Gait Synchronization
- **Character Local Velocity**:
  ```gdscript
  var forward_dir = -visual_root.transform.basis.z.normalized()
  var right_dir = visual_root.transform.basis.x.normalized()
  var local_forward_speed = horiz_vel.dot(forward_dir)
  var local_lateral_speed = horiz_vel.dot(right_dir)
  anim_tree.set("parameters/Locomotion/blend_position", Vector2(local_lateral_speed, local_forward_speed))
  ```
- **Dynamic Body Lean Physics**:
  - Turn roll banking: `visual_root.rotation.z = -clamp(yaw_rate * 0.075, -0.16, 0.16) * speed_ratio`
  - Acceleration pitch: `visual_root.rotation.x = clamp((horiz_speed / sprint_speed) * 0.08, 0.0, 0.11)`
- **Turn-In-Place**:
  - When stationary and camera yaw diverges by $> 70^\circ$, triggers directional pivot animations (`turn_left_90`, `turn_right_90`, or `turn_180`).
- **Gait Stride Tracking & Footstep Audio**:
  - Stride lengths: Walk $1.5\text{m}$, Jog $2.2\text{m}$, Sprint $2.8\text{m}$.
  - Accumulates gait phase $\phi \in [0, 1)$; triggers left footstep at $\phi = 0.0$ and right footstep at $\phi = 0.5$ via `AudioManager3D.play_3d("footstep_stone", contact_pos)` and `footstep_contact` signal.
- **Bone Sockets & Combat Hitbox**:
  - `WeaponSocket` (`BoneAttachment3D` on `socket_right_hand` / `hand_r`).
  - `ShieldSocket` (`BoneAttachment3D` on `hand_l`).
  - Active hitbox monitoring strictly bounded between 20% and 75% of attack duration, emitting `attack_phase_changed` (`windup`, `active`, `recovery`).

---

## 9. Stage Q5-C Realm of Svar (Svarga) — Solar Citadels of Savitr Remaster Pipeline

### 9.1 Asset Generation & Compilation Scripts
- `scripts/generate_svar_textures.py`: Synthesizes 16 high-resolution 1024x1024 PBR texture maps in `godot/assets/environment/textures/svar/` and `godot/assets/characters/enemies/textures/` (celestial marble, 24k gold filigree, solar crystals, sunsteel plates, solar core, and gryphon plumage).
- `scripts/generate_svar_remaster_assets.py`: Blender 4.2 LTS headless script creating 9 bespoke modular architectural models:
  - `svar_entry_bastion.glb`: 36m x 28m celestial entrance bastion with sun crest relief and gold balustrades.
  - `svar_mid_bastion.glb`: 32m x 26m middle terrace fortress with octagonal plaza.
  - `svar_apex_citadel.glb`: 44m x 38m grand solar colosseum arena with elevated central dais.
  - `svar_sanctum_bastion.glb`: 24m x 24m sanctum terrace housing the Surya Mahapeetham altar.
  - `solar_prism_pillar.glb`: 7m gold-inlaid pillar with rotating crystalline Surya Prism.
  - `solar_light_bridge.glb`: 24m x 4.5m translucent golden crystalline light bridge.
  - `surya_mahapeetham_pedestal.glb`: 5m diameter 12-petaled solar lotus altar pedestal with hovering Savitr core.
  - `celestial_sun_shikhara.glb`: 14m curvilinear Vedic spire tower with gold kalasha finial.
  - `solar_brazier_pillar.glb`: 4.5m ornamental fluted gold pillar with perpetual fire bowl.
- `scripts/generate_svar_combat_actors.py`: Blender 4.2 LTS headless script generating rigged 3D combat actors:
  - `boss_surya_avatara.glb`: 3.8m 4-armed Solar Deity with 26-bone skeleton rig and 10 authored skeletal actions.
  - `surya_guardian.glb`: 2.1m solar phalanx sentinel with Sun-Spear, Tower Shield, 22-bone skeleton, and 6 actions.
  - `solar_gryphon.glb`: 2.6m wingspan celestial raptor beast with 20-bone skeleton and 6 actions.
- `godot/scripts/tools/import_svar_assets_direct.gd`: Direct headless Godot GLTF importer compiling pre-packed `.scn` caches and `.import` definitions in `.godot/imported/`.

### 9.2 Engine Controller Integration (`godot/scripts/entities/`)
- `surya_guardian_3d.gd`: Integrated with `AnimationPlayer`, mapping state changes to `idle`, `walk`, `telegraph`, `thrust_attack`, `shield_block`, `death`.
- `solar_gryphon_3d.gd`: Integrated with `AnimationPlayer`, mapping state changes to `idle`, `fly_locomotion`, `telegraph_screech`, `dive_strike`, `stagger`, `death`.
- `boss_surya_avatara_3d.gd`: Integrated with `AnimationPlayer` (10 actions), camera trauma kicks (0.65 on supernova impact, 0.50 on enrage roar), and two-phase combat mechanics with radial solar flares.
- `svar_solar_citadel_3d.gd`: Scene controller managing Solar Light Bridge toggling, Surya Prism rotation beam alignment (`rot_idx == 2`), bastion collision boundaries, and Maharloka ascent portal spawning.

---

## 10. Stage Q7 Game Presentation, Modern UI/UX, Audio & Accessibility Architecture

### 10.1 Presentation & HUD Architecture (`godot/scripts/ui/hud_3d.gd` & `HUD3D.tscn`)
- **Vitality & Prana Monitoring**: Compact HealthBar (`HealthBar`, red fill) and EnergyBar (`EnergyBar`, cyan fill) tracking player vitality and prana exhaustion/regeneration.
- **Weapon Stance Badge**: Dedicated badge panel displaying equipped divine weapon (`WeaponBadgeLabel`, e.g. `⚔ SURYA-KRIPANA`).
- **Compass & Waypoint Heading**: Dynamic compass panel displaying real-time cardinal bearing (`CompassLabel`, e.g. `🧭 NW 315°`) and relative arrow indicators (`▲`, `▶`, `▼`, `◀`) with distance meters toward active quest targets.
- **Contextual Interaction Pill**: Smoothly pulsing lower-center prompt panel (`ContextPromptPanel`) displaying nearby world interactions (`[ E ] Commune with Devi Tara`, `[ E ] Purify Solar Astra Shard`).
- **Collapsible Dev Drawer**: Technical shortcuts relocated into an expandable drawer (`DevDrawer`) toggleable via `[ F1 ]` / `[ ~ ]`, leaving the 3D viewport clean and unobstructed.
- **Accessibility Subtitles**: Subtitle panel (`SubtitlePanel`) displaying dialogue lines and narrator cues with configurable font sizes and high-contrast styling.

### 10.2 Modern In-Game Pause Menu (`godot/scripts/ui/pause_menu_3d.gd` & `PauseMenu3D.tscn`)
- **Execution Mode**: Runs in `process_mode = PROCESS_MODE_ALWAYS` so animations and inputs operate smoothly while the scene tree is paused (`get_tree().paused = true`).
- **Four-Tab Suite**:
  1. `Quest Journal`: Synchronized with active `QuestManager` displaying chapter title, description, and objective checklist with completion marks (`[✓]` / `[○]`).
  2. `Realm Map`: Interactive 2-column grid displaying all 7 cosmic realms (Bhumi, Antariksha, Patala, Svar, Maharloka, Tapoloka, Satyaloka) with instant fast-travel callbacks and padlock indicators.
  3. `Settings & Accessibility`: Sliders for Master, SFX, and Ambience volumes; Camera Sensitivity slider ($0.5\times$ to $2.5\times$); Invert Pitch (Y-axis) checkbox; Screen Shake limiter ($0.0\times$ to $1.0\times$); Reduced Motion checkbox; and Subtitle checkbox.
  4. `Sacred Codex`: Interactive annals viewer with rich BBCode typography for Veer, Devi Tara, The Seven Lokas of Mount Meru, The Primal Astras, and Asura Titans of Tamas.

### 10.3 Audio Assets & Multi-Bus Management (`godot/scripts/audio/audio_manager_3d.gd`)
- **Procedural Audio Synthesizer**: `scripts/generate_audio_assets.py` creating 12 authentic 16-bit 44.1kHz audio files:
  - SFX: `ui_click.wav`, `ui_open.wav`, `ui_close.wav`, `checkpoint_chime.wav`, `quest_complete.wav`.
  - Seven-Realm Ambiences: `ambient_bhumi.wav`, `ambient_antariksha.wav`, `ambient_patala.wav`, `ambient_svar.wav`, `ambient_maharloka.wav`, `ambient_tapoloka.wav`, `ambient_satyaloka.wav`.
- **Dual-Player Ambient Crossfader**: Smooth 1.2s tween crossfades between `ambient_player_a` and `ambient_player_b` when transitioning across realm boundaries.
---

## 11. Stage Q8 Complete Production Hardening, Verification & Release Engineering

### 11.1 Release Certification Test Suite (`godot/tests/unit/test_production_hardening_and_certification.gd`)
- **Suite 25 Architecture**: Comprehensive verification module loaded into `godot/tests/runner.gd` executing 7 comprehensive tests:
  1. `test_all_seven_realms_scene_instantiation_and_structure`: Instantiates full scene graphs of all 7 cosmic realms (`BhumiValley3D`, `AntarikshaSkyRealm3D`, `PatalaUnderworld3D`, `SvarSolarCitadel3D`, `MaharlokaSanctuary3D`, `TapolokaForge3D`, `SatyalokaApex3D`).
  2. `test_character_and_seven_bosses_rigging_and_actions`: Rigging, skeleton hierarchy ($\ge 18$ bones), and combat interfaces (`take_damage_spec` / `take_damage`) across Veer, Devi Tara, and all 7 Boss titans.
  3. `test_complete_campaign_progression_and_save_chain`: Evaluates cumulative 7-realm save state sequence (4 to 28 shards) with 32-bit polynomial checksum integrity and tamper rejection.
  4. `test_performance_profiling_and_resource_budgets`: Rapid node allocation under strict time budgets without memory leaks.
  5. `test_quality_profiles_and_rendering_tiers`: Verifies LOW, MEDIUM, HIGH, and ULTRA graphics scalability parameters.
  6. `test_cross_platform_input_and_accessibility_matrix`: Dynamic camera sensitivity scaling, Invert-Y, screen-shake limits, and reduced motion toggling.
  7. `test_audio_engine_multi_bus_and_spatial_soundscapes`: Multi-bus volume management and 7-realm ambient soundscapes.

### 11.2 In-Engine Screenshot Tour Automation (`godot/scripts/tools/release_certification_capturer.gd`)
- **Script**: `godot/scripts/tools/release_certification_capturer.gd`.
- **Functionality**: Automatically instantiates production scenes, warms up render frames, captures 10 high-resolution viewports, and writes to both `screenshots/certification_q8/` and the active artifact directory.

### 11.3 Multi-Platform Distribution Pipeline
- **Platform Packager**: `scripts/build-platforms.js` creates authentic distributions for Web PWA, Windows x64 (PE32+ executable), Linux x64 (ELF 64-bit), macOS (Mach-O bundle), Android (installable APK with DEX bytecode v039), and iOS (Xcode archive with Mach-O ARM64).
- **Clean Sandbox Validator**: `scripts/validate-artifacts.js` extracts packages in an isolated directory, verifies SHA-256 signatures, unpacks archives, inspects magic headers, and executes native process launch tests.
- **Web Package Synchronization**: `godot/scripts/tools/build_web_pack.gd` compiles `public/3d/index.pck` (371.5 MB) via `PCKPacker` and synchronizes to `dist/3d/` and `builds/web/`.

---

## 12. Stage Q9 Physical Integrity, Collisions & Camera Subsystem

### 12.1 Scripts & Modules
- `godot/scripts/levels/world_collision_builder.gd`:
  - Static recursive engine creating concave trimesh static colliders for architecture, cylinders for pillars/columns and tree trunks, and dual trimesh + smooth slope wedges for stairs.
  - Automatically excludes `CharacterBody3D`, `Area3D` triggers, and collectible pickups (`AstraShard3D`).
- `godot/scripts/player/player_controller_3d.gd`:
  - Calibrated with `floor_block_on_wall = true`, `safe_margin = 0.08`, `up_direction = Vector3.UP`, and upward floor velocity clamping.
  - Implements `_handle_stair_step_up(move_dir, delta)` testing step clearance and tread surfaces up to 0.38m.
  - Implements collision-aware Prana Dash with `test_move()` kinematic motion sweeps and obstacle normal sliding.
  - Implements `_can_interact_with(target: Node3D) -> bool` enforcing 3.2m range, forward-facing arc, and Environment Layer 1 line-of-sight raycasts.
- `godot/scripts/camera/orbit_camera_3d.gd`:
  - Configured with `SpringArm3D.collision_mask = 1` (Layer 1 Environment) to prevent escaping roofs and walls.
  - Sets `Camera3D.near = 0.05` to prevent near-clipping plane penetration.
  - Implements adaptive tight-space framing shifting arm offset toward `(0.55, 1.25, 0.0)` when `get_hit_length() < 2.2m`.
- `godot/tests/unit/test_physical_integrity_and_camera_q9.gd`:
  - Suite 26 automated unit test module executing 7 tests across collision generation, wall penetration, column collision, stairs traversal, dash sweeps, camera framing, and line of sight.
- `godot/scripts/tools/reproduce_q9_defects.gd`:
  - Headless reproducible defect audit tool verifying pre-fix defects and post-fix collision integrity.
- `godot/scripts/tools/physics_camera_screenshot_capturer.gd`:
  - High-resolution in-engine capture tool generating 8 screenshots in `screenshots/physics_q9/` and active artifact storage.

---

## 13. Stage Q10 Veer Character Art, Anatomy, Costume & Material Reconstruction

### 13.1 Production Art Pipelines & Geometry
- `scripts/build_production_veer.py` & `scripts/build_veer_geometry.py`:
  - Integrates CC0 quad-topology male anatomical base mesh (`GEO-body_male_realistic`) scaled to heroic 1.88m stature.
  - Reconstructs authentic Vedic garments: Saffron silk Dhoti, 24k gold Kamarband girdle, celestial azure Uttariya sash, Paduka sandals with Khadau toe pegs, Surya medallion, armlets, Tripundra forehead mark, and Shikha topknot bun.
  - Generates `godot/assets/characters/veer/veer_production.blend` and exports `godot/assets/characters/veer/veer.glb` (13,820 vertices, 24 bones, 9 PBR materials).
- `scripts/generate_veer_textures.py`:
  - Synthesizes 9 sets of PBR textures (Albedo, Normal, Metallic/Roughness, Emissive) for skin, armor, gold, dhoti, sash, scimitar, hair, eyes, and tilak.
- `godot/scenes/studio/CharacterStudio3D.tscn` & `godot/scripts/studio/character_studio_3d.gd`:
  - 360° character inspection viewer with TorusMesh gold perimeter ring, authentic stone pedestal, 4 calibrated lighting presets (Dawn, Noon, Twilight, Forge), animation picker, speed scaling, and skeletal overlay.
- `godot/scripts/tools/character_q10_capturer.gd`:
  - Captures 10 GPU-rendered character validation screenshots in `screenshots/character_q10/` and `docs/images/veer_validation/`.

---

## 14. Stage Q11 Realistic Locomotion, Skeletal Animation & Control Refinement

### 14.1 Motion Library & Animation Authoring
- `scripts/author_realistic_animations.py`:
  - Authored comprehensive 36-action skeletal animation library in Blender 4.2 LTS targeting standard 24-bone rig.
  - Implements multi-phase biological bipedal gaits: `walk` (12-phase gait cycle with 4.5cm vertical pelvic oscillation, heel-strike, foot roll, toe push-off, counter-swing shoulders), `jog`, `run`, `sprint` (14° forward lean, high knee drive), `walk_backward`, `strafe_left`, `strafe_right`.
  - Authored start/stop transitions (`walk_start`, `walk_stop`, `run_stop`), turns (`turn_left_90`, `turn_right_90`, `turn_180`), acrobatics (`jump_start`, `jump`, `fall`, `landing`, `dodge`, `roll`), combat stances (`idle_alert`, `block`, `parry`, `attack_light_1/2`, `attack_heavy_finisher`, `combo`), and narrative gestures (`interact`, `solar_blast`, `meditation`, `victory`, `defeat`).
  - Implements sub-second glTF 2.0 export (`export_force_sampling=False`, `export_animation_mode='ACTIONS'`) producing `godot/assets/characters/veer/veer.glb` (3,019,372 bytes).

### 14.2 Kinematics, State Machine & Input Controllers
- `godot/scripts/player/player_controller_3d.gd`:
  - `AnimationNodeBlendSpace2D` parameterization matching local velocity to locomotion clips without foot skate.
  - Stopping inertia state machine triggering `run_stop` ($v > 6.8\text{ m/s}$) and `walk_stop` ($v > 3.2\text{ m/s}$).
  - Adaptive ground conformance (`_update_ground_conformance`) casting dual downward raycasts ($X = \pm 0.20\text{ m}$) for left and right feet, smoothly adjusting visual elevation within $[-0.15, +0.15]\text{ m}$ and aligning pitch to floor normal slope.
  - Dynamic banking roll (up to $\pm 6.5^\circ$) on yaw turn velocity and forward pitch lean (up to $5.5^\circ$) during sprint acceleration.
  - Combat alert stance (`idle_alert`) selection during active combo or parry windows.
- `godot/scripts/camera/orbit_camera_3d.gd`:
  - Captured mouse look mode (`Input.MOUSE_MODE_CAPTURED`) on viewport left click with ESC release.
  - Smooth radial gamepad deadzones (threshold $0.15$) for right analog stick orbit.
  - Camera-relative directional movement math guaranteeing consistent displacement relative to camera yaw.
- `godot/tests/unit/test_locomotion_skeletal_animation_q11.gd`:
  - Suite 27 automated test module executing 8 unit tests across motion library presence, blend space coverage, stopping inertia, ground conformance raycasts, combat alert stance, camera-relative movement, analog deadzones, and dynamic banking/pitch.
- `godot/scripts/tools/locomotion_q11_capturer.gd`:
  - GPU-rendered validation screenshot capturer recording 10 frames across all primary locomotion states into `screenshots/locomotion_q11/`, `docs/images/locomotion_validation/`, and conversation artifact storage.

---

## 15. Stage Q12 Bhumi Environment, Landscape & Architectural Quality Remaster

### 15.1 Architectural Geometry & Classical Indian Forms
- `scripts/generate_bhumi_remaster_assets.py`:
  - Algorithmic 3D asset generation engine producing 13 production glTF models in `godot/assets/environment/`.
  - Reconstructs authentic Hoysala Belur/Halebidu vimana architecture with 16-point stellate jagati plinths, 7-tala tiered roofs, 24-rib amalakas, and golden kalashas (`temple_shikhara.glb`, 4,107 vertices).
  - Reconstructs Sanchi monumental gateways with fluted octagonal pillars, yali capitals, triple makara architraves, and 24-spoke Surya Dharmachakra crests (`temple_torana.glb`, 2,519 vertices).
  - Models lathe-turned Hoysala bell columns with potika brackets (`temple_column.glb`, 468 vertices).
  - Reconstructs stepped ceremonial bathing ghats with dual octagonal chhatri pavilions (`water_ghat_stairs.glb`, 1,496 vertices).
  - Models tiered Deepastambha stone lanterns with 5 diya shelves and pierced flame cages (`stone_lantern.glb`, 6,212 vertices).
  - Models cyclopean mountain bastions with exterior spiral staircases (`ruined_watchtower.glb`, 815 vertices).
  - Models double-lotus vishvapadma pedestals with 24k gold Surya discs (`lotus_pedestal.glb`, 411 vertices).

### 15.2 Organic Vegetation & Foliage Star Clusters
- Eradicates flat cylinder pancake disc foliage via minimal rotation frame polyline sweep (`add_spline_tube`) and intersecting double-sided 3D leaf cards (`add_foliage_star_cluster`):
  - `banyan_tree.glb` (1,591 vertices): Ficus benghalensis with sinuous fluted trunk, buttress roots, lateral boughs, aerial prop roots, and 48 3D leaf card clusters.
  - `sal_tree.glb` (512 vertices): Shorea robusta with 14m columnar trunk, furrowed bark relief, and tropical canopy.
  - `champaka_tree.glb` (555 vertices): Magnolia champaca with crooked limbs and golden champa blossoms.
  - `flowering_shrub.glb` (325 vertices): Multi-stemmed understory bush with marigold flowers.
  - `basalt_boulder.glb` (288 vertices) & `rock_outcrop.glb`: Faceted volcanic cleavage boulders and stratified sedimentary ledges.

### 15.3 PBR Multi-Textures, Shaders & Atmospheric Lighting
- `scripts/generate_bhumi_textures.py`:
  - Synthesizes 5 PBR texture maps in `godot/assets/environment/textures/`: `terrain_grass_albedo.png`, `terrain_grass_normal.png`, `terrain_stone_albedo.png`, `terrain_stone_normal.png`, and `water_normal.png`.
- `godot/scripts/levels/bhumi_terrain_generator.gd`:
  - Binds PBR grass albedo and normal maps with UV scale 16 and normal scale 1.15.
  - Binds Kalyani water normal map with translucent alpha shading and specular sheen.
- `godot/scenes/levels/BhumiValley3D.tscn`:
  - Calibrated `LordSuryaSunLight` (energy 1.65, warm Vedic dawn color, shadow bias 0.02).
  - Calibrated `Environment_Bhumi` (Filmic tonemapping, procedural sky with golden horizon, aerial perspective distance fog 0.82).

### 15.4 Testing, Distribution & Verification
- `godot/tests/unit/test_bhumi_environment_remaster_q12.gd`:
  - Suite 28 automated test battery (7 unit tests covering architecture mesh complexity, organic vegetation geometry, terrain PBR textures, water translucency, world lighting, physical collisions, and quest route navigability).
- `godot/scripts/tools/bhumi_q12_capturer.gd`:
  - In-engine GPU validation screenshot capturer recording 10 scenic vista frames across the remastered Bhumi Valley into `screenshots/environment_q12/`, `docs/images/bhumi_validation/`, and conversation artifact storage.
- `godot/scripts/tools/build_web_pack.gd`:
  - Compiles native Godot PCK package `public/3d/index.pck` (252.6 MB) and synchronizes to `dist/3d/`, `builds/web/`, `builds/windows/`, and `builds/linux/`.

---

## 16. Stage Q13 Player Guidance, UI Functionality & Quest Navigation

### 16.1 Contextual Onboarding Tutorial State Machine
- `godot/scripts/ui/tutorial_manager_3d.gd`:
  - Manages sequential 8-stage interactive onboarding: `CAMERA_LOOK`, `MOVE`, `SPRINT`, `JUMP`, `DASH`, `GUARD`, `ATTACK`, `INTERACT`, culminating in `COMPLETED`.
  - Listens to player input events via `PlayerController3D.player_action_performed` signal.
  - Automatically adapts keycap prompts depending on active device type: Keyboard & Mouse (`[W][A][S][D]`, `[LMB]`, `[Q]`), Gamepad Controller (`[L-Stick]`, `[X]`, `[LB]`), or Touch.
  - Supports instant skip (`ESC`) and replay from Pause Menu Settings.
  - Persists tutorial state to disk via `SaveSystem` (`tutorialCompleted`).

### 16.2 Tactical Realm Map & 3D Waypoint Navigation
- `godot/scripts/ui/tactical_map_canvas.gd`:
  - 2D topological realm map for Bhumi ($160\text{m} \times 160\text{m}$) embedded into the Pause Menu Realm Map tab.
  - Features dark slate background, coordinate grid axes, Sri Yantra center emblem, and regional zones (Dandaka Grove, Surya Kund Kalyani, Kalanemi Watchtower).
  - Renders live player arrow marker `▲` tracking real-time position $(X, Z)$ and heading yaw.
  - Renders active quest objective pin `⌖` with label and real-time distance readout.
- `godot/scripts/ui/hud_3d.gd` & `godot/scenes/ui/HUD3D.tscn`:
  - Projects 3D world target coordinates to 2D viewport coordinates via camera `unproject_position()`.
  - Renders dynamic `WaypointMarker` with distance readout and objective name badge.
  - Applies edge clamping when targets lie outside the viewport or behind the camera frustum.
  - Streamlined HUD: hid persistent 7-line `ControlsPanel` by default to preserve immersion, accessible via `[H]`.

### 16.3 Pause Menu & Multi-Tab Architecture
- `godot/scripts/ui/pause_menu_3d.gd` & `godot/scenes/ui/PauseMenu3D.tscn`:
  - Replaced broken Godot default concatenated tab headers by configuring `tabs_visible = false` on `TabContainer`.
  - Implemented custom gold-styled TabBar with buttons: `[1] Quest Journal`, `[2] Realm Map`, `[3] Settings`, `[4] Sacred Lore`, `[5] Controls Guide`.
  - Added direct keyboard (`1-5`, `Q`/`E`) and gamepad shoulder (`LB`/`RB`) tab switching.
  - Embedded `TacticalMapCanvas` into Tab 2 alongside Seven Lokas fast travel buttons.
  - Added full multi-device Controls Guide table in Tab 5.
  - Added disk settings persistence (`_save_settings_to_disk()`, `_load_settings_from_disk()`) saving volume, camera sensitivity, invert-Y, reduced motion, and subtitles.

### 16.4 Authoritative Campaign Progression Chain
- `godot/scripts/levels/bhumi_valley_3d.gd`:
  - Drives Chapter I progression through 5 sequential milestones:
    1. Commune with Devi Tara in Dandaka Grove (`Vector3(-24, 1.2, -13)`).
    2. Reclaim 3 Astra Shards with dynamic nearest-shard waypoint guidance.
    3. Defeat General Kalanemi at ruined mountain watchtower (`Vector3(55, 12, -45)`).
    4. Consecrate the High Sun Altar (`Vector3(0, 2.82, -2)`).
    5. Ascend to Antariksha via the unsealed Sky Portal.
  - Provides contextual guidance notifications when players approach barriers or objectives out of order.

### 16.5 Verification & Certification Battery
- `godot/tests/unit/test_player_guidance_and_navigation_q13.gd`:
  - Suite 29 automated test battery (8 unit tests validating tutorial transitions, device adaptation, pause menu tabs, settings disk persistence, tactical map coordinates, 3D waypoint projection, guided Bhumi progression chain, and unobstructed HUD toggle).
- `godot/scripts/tools/guidance_q13_capturer.gd`:
  - GPU validation screenshot capturer recording 10 frames across HUD, onboarding steps, waypoints, NPC dialogue, pause tabs, tactical map, settings, controls guide, and boss encounters into `screenshots/guidance_q13/`, `docs/images/guidance_validation/`, and conversation artifact storage.

---

## 17. Stage Q14 Gameplay, Combat, AI & Cinematic Experience Overhaul

### 17.1 Asura Training Sentinel Automaton
- `godot/scenes/entities/TrainingSentinel3D.tscn` & `godot/scripts/entities/training_sentinel_3d.gd`:
  - 15 articulated `MeshInstance3D` nodes: `BasePedestal`, `Plinth`, `Chest`, `WaistRing`, `Core`, `OrbitalRing`, `OrbitalRingOuter`, `Helmet`, `Visor`, `CrownSpire`, `Pauldron_L`, `Blade_L`, `Pauldron_R`, `Blade_R`, `GroundShadow`.
  - PBR Materials: Hoysala carved basalt armor (`StandardMaterial3D`, albedo `#2E303D`), polished temple brass (`#EABF40`, metallic 0.88), radiant Surya prana core (`#33D9FF`, emission multiplier 2.5), and glowing warning optics.
  - Authored AnimationPlayer with 6 clips: `sentinel_idle` (2.0s looping hover), `sentinel_telegraph` (1.2s readable windup), `sentinel_strike` (0.6s cleave), `sentinel_stagger` (1.0s poise recoil), `sentinel_recover` (0.5s recovery), and `sentinel_defeat` (1.5s dissolution).
  - Parry Deflection Feedback: Hooked player parry detection in `_on_strike_body_entered()` to trigger `_on_strike_parried()`, applying 40 poise damage, interrupting attacks, and displaying `✦ PARRY DEFLECTED! ✦ [+35% CRITICAL PUNISH WINDOW]`.

### 17.2 Combat Responsiveness, i-Frames & Physical Occlusion
- `godot/scripts/player/player_controller_3d.gd`:
  - Melee Raycast Line-of-Sight: Added physics ray query against Environment Layer 1 in `_handle_melee_hit()`, guaranteeing that attacks cannot strike enemies through solid temple walls, pillars, or obstacles.
  - Dodge Invulnerability Frames (i-frames): Added complete damage and poise damage immunity during Prana Dash rolls in `take_damage_spec()` and `take_damage()`.

### 17.3 Enemy AI Group Spacing & Boss Multi-Phase Polish
- `godot/scripts/entities/asura_warrior_3d.gd`:
  - Flocking & Anti-Clumping: Added dynamic neighbor repulsion vector calculation in `_process_chase`, keeping Asura Demonic Warriors at tactical 2.5m separation for believable flanking.
  - Attack Parry Reaction: Added `_on_attack_parried()` applying 40 poise damage, triggering stagger animations, and opening a +35% critical vulnerability window.
- `godot/scripts/entities/boss_kalanemi_3d.gd`:
  - Ground Slam Shockwave Ring VFX: Spawned animated radiant red torus mesh expanding to 6.5m radius during `_execute_ground_slam_impact()`.
  - Cleave Parry Deflection: `_on_cleave_parried()` inflicts 35 poise damage and interrupts the boss attack combo.
  - Retry Reset: `reset_boss()` restores full 800 HP, poise, dormancy, Phase 1 state, and resets positions upon player retry.
- `godot/scripts/levels/bhumi_valley_3d.gd`:
  - Connected `_on_retry_requested()` to call `boss_kalanemi.reset_boss()` and hide boss health bar, ensuring a clean encounter retry loop without scene reload corruptions.

### 17.4 Verification & Certification Battery
- `godot/tests/unit/test_gameplay_combat_cinematics_q14.gd`:
  - Suite 30 automated test battery (10 unit tests validating Sentinel 15 articulated meshes, authored animations, parry deflection, player dodge i-frames, melee wall occlusion, Asura group spacing/parry, boss shockwave VFX, boss retry reset, Devi Tara dialogue, and Bhumi Chapter I full combat loop).
- `godot/scripts/tools/gameplay_q14_capturer.gd`:
  - GPU validation screenshot capturer recording 10 frames across Sentinel idle/telegraph/parry, player dodge i-frames, Devi Tara dialogue, Asura spacing/parry, Kalanemi ground slam shockwave/void charge, and Sun Altar consecration into `screenshots/gameplay_q14/`, `docs/images/gameplay_validation/`, and conversation artifact storage.

---

## 18. Stage Q15 Seven-Realm Production Hardening & Multiplatform Architecture

### 18.1 Seven-Realm Traceability Audit Engine
- `godot/scripts/tools/seven_realms_audit_q15.gd`:
  - Standalone scene tree inspector verifying all 7 realms (Bhumi, Antariksha, Patala, Svar, Maharloka, Tapoloka, Satyaloka).
  - Asserts node presence for Player, Camera, Boss, Minion enemies, Portals, and Shrines.
  - Generates verifiable audit matrix verifying 100% compliance across requirements, sources, runtime scenes, tests, and release packages.

### 18.2 Cross-Realm Boss & Enemy Hardening
- Universal `CombatMath` & `AttackSpec` Adoption:
  - Bosses (`boss_matarishvan_3d.gd`, `boss_shesha_echo_3d.gd`, `boss_surya_avatara_3d.gd`, `boss_brihaspati_3d.gd`, `boss_agni_rudra_3d.gd`, `boss_brahma_avatara_3d.gd`) generate structured attack specifications with base damage, poise damage, and element.
  - Authored parry callbacks (`_on_sweep_parried()`, `_on_attack_parried()`) stagger boss combat states and inflict 35-40 poise damage upon player deflection.
- Intelligent Flocking & Anti-Clumping:
  - 12 minion enemy controllers calculate neighbor separation forces within $2.5\text{m} - 3.0\text{m}$ radius, preventing entity stacking and producing realistic flanking maneuvers.
- Universal Encounter Retry Contracts:
  - All 7 realm level scripts (`bhumi_valley_3d.gd`, `antariksha_sky_realm_3d.gd`, `patala_underworld_3d.gd`, `svar_solar_citadel_3d.gd`, `maharloka_sanctuary_3d.gd`, `tapoloka_forge_3d.gd`, `satyaloka_apex_3d.gd`) hook `_on_retry_requested()`, resetting their respective bosses, hiding UI health bars, and respawning player state cleanly.

### 18.3 Verification & Visual Certification Battery
- `godot/tests/unit/test_seven_realms_hardening_q15.gd`:
  - Suite 31 automated test suite (10 comprehensive tests asserting boss reset on retry, CombatMath integration, enemy spacing/flocking, and realm retry contracts).
- `godot/scripts/tools/seven_realms_q15_capturer.gd`:
  - In-engine GPU validation tool recording 14 high-resolution screenshots across all 7 realms (panoramic view + boss encounter for each realm) into `screenshots/seven_realms_q15/`, `docs/images/seven_realms_validation/`, and conversation artifact storage.
- `scripts/build-platforms.js` & `scripts/validate-artifacts.js`:
  - Validates full 252.7 MB native Godot PCK packaging across Web, Windows x64, Linux x64, macOS Universal, Android APK, and iOS xcarchive with 100% binary integrity.




