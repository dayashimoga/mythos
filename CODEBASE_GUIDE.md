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
