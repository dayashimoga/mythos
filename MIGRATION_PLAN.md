# Mythos: Astra & The Seven Realms
## STAGE 3D-0 — Complete 3D Architecture Transformation Plan

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Lead Authors:** Principal 3D Game Architect, Godot Engineer, TypeScript Migration Specialist, DevOps Architect, QA Director  
**Baseline Git Tag:** [`v1.14.0-legacy-2d`](file:///h:/mythologicalgame)  
**Legacy Preservation Branch:** `legacy/2d-canvas`  
**Chosen 3D Engine:** Godot Engine 4.3 Stable Official (`4.3.stable.official.77dcf97d8`) with Standard GDScript & Dual Web/Headless Runtime  

---

### 1. Executive Summary & Transformation Mission

*Mythos: Astra & The Seven Realms* has transitioned from its 2D exploratory Canvas prototype to a **genuine third-person 3D game architecture**. The mission of Stage 3D-0 is to establish a solid, production-grade 3D engine foundation without abandoning the rich mythological world, narrative lore, combat mathematics, quest structures, dialogue trees, audio composition, or historical development milestones established across Stages 1–14 and Stages R0–R2.

```
       LEGACY 2D CANVAS STACK                         NEW GENUINE 3D GODOT ARCHITECTURE
┌──────────────────────────────────────┐            ┌──────────────────────────────────────────────┐
│  src/render/LayeredRenderer.ts       │            │  Godot 4.3 RenderingServer (Forward+ / GL)  │
│  src/render/CanvasRenderer.ts        │   ====>    │  Camera3D with SpringArm3D Orbit Controller   │
│  src/render/Camera.ts (2D Pan/Zoom)  │            │  WorldEnvironment (Procedural Sky & Sun)     │
└──────────────────────────────────────┘            └──────────────────────────────────────────────┘
┌──────────────────────────────────────┐            ┌──────────────────────────────────────────────┐
│  src/animation/CharacterRig.ts       │            │  CharacterBody3D + Articulated Avatar Mesh   │
│  src/animation/Skeleton.ts (2D)      │   ====>    │  CollisionShape3D (Capsule 0.4m x 1.8m)      │
│  src/animation/TwoBoneIK.ts (2D)     │            │  3D Weapon Sockets & Combat State Machine    │
└──────────────────────────────────────┘            └──────────────────────────────────────────────┘
┌──────────────────────────────────────┐            ┌──────────────────────────────────────────────┐
│  src/combat/CombatSystem.ts          │            │  scripts/domain/combat_math.gd               │
│  src/narrative/QuestManager.ts       │   ====>    │  scripts/domain/quest_manager.gd             │
│  src/narrative/DialogueTree.ts       │  (PORT)    │  scripts/domain/dialogue_runner.gd           │
│  src/persistence/SaveGameManager.ts  │            │  scripts/domain/save_system.gd (SHA256)      │
└──────────────────────────────────────┘            └──────────────────────────────────────────────┘
```

---

### 2. Full Legacy Codebase Audit (Phase 0.1)

Every subsystem in `src/`, `tests/`, and project configuration has been audited and classified under five canonical categories:

| Subsystem | File(s) | Category | Audit Findings & Target Architecture |
| :--- | :--- | :--- | :--- |
| **Engine Loop** | `src/engine/Engine.ts` | **REUSABLE CONCEPT** | Replaced by Godot SceneTree (`_process`, `_physics_process`). Timestep, diagnostics counters, and state management ported to autoload singleton `scripts/engine/engine_service.gd`. |
| **Rendering** | `src/render/CanvasRenderer.ts`<br>`src/render/LayeredRenderer.ts` | **REQUIRES 3D REIMPLEMENTATION** | 2D canvas context and 2.5D layer sorting are deprecated. Replaced by Godot 4.3 Vulkan Forward+ on desktop and OpenGL Compatibility on Web/mobile, with real perspective `Camera3D` and `DirectionalLight3D`. |
| **Camera** | `src/render/Camera.ts` | **REQUIRES 3D REIMPLEMENTATION** | 2D pan/zoom replaced by spherical orbit `SpringArm3D` + `Camera3D` with collision margin raycasting, pitch constraints (`-70°` to `+25°`), mouse orbit, and camera-relative motion vectors. |
| **Character Rigging** | `src/animation/Skeleton.ts`<br>`src/animation/Bone.ts`<br>`src/animation/TwoBoneIK.ts` | **REQUIRES 3D REIMPLEMENTATION** | 2D planar bone matrices replaced by `Node3D` hierarchical articulation, `Skeleton3D`, and 3D IK solvers. |
| **Character Definitions** | `src/animation/CharacterDefinitions.ts`<br>`src/animation/ArticulatedRenderer.ts` | **PORTABLE SPECIFICATION** | Proportions, color tokens (Surya Gold, Imperial Crimson, Basalt Magma), sacred motifs, and socket offsets serve as the master specification for 3D meshes. |
| **Combat Rules & Math** | `src/combat/CombatSystem.ts` | **PORTABLE LOGIC** | Ported verbatim into `godot/scripts/domain/combat_math.gd`: 3-hit combo chain, startup/active/recovery windows, poise damage, stagger timers, critical multipliers, and mitigation formulas. |
| **Enemy AI Logic** | `src/entities/EnemySentinel.ts`<br>`src/entities/StoneRakshasa.ts`<br>`src/entities/VanaraScout.ts` | **REQUIRES 3D REIMPLEMENTATION** | 2D distance checks and orbit angles replaced by 3D spatial steering vectors, `NavigationAgent3D` for elevated terrain, and 3D bounding volumes. |
| **Quest State Machine** | `src/narrative/QuestManager.ts` | **PORTABLE LOGIC** | Ported verbatim into `godot/scripts/domain/quest_manager.gd`: Sanctum Calibration, Shard tracking, Altar Kindle objectives, and rewards. |
| **Dialogue Trees** | `src/narrative/DialogueTree.ts` | **PORTABLE LOGIC** | Ported verbatim into `godot/scripts/domain/dialogue_runner.gd`: Speaker roles, conditional branching, audio cues, and dialogue history. |
| **Save State & Checksums** | `src/persistence/SaveGameManager.ts` | **PORTABLE LOGIC** | Ported into `godot/scripts/domain/save_system.gd`: JSON serialization with SHA-256 / Adler-32 tamper detection. |
| **Audio System** | `src/audio/AudioEngine.ts` | **PORTABLE LOGIC** | Audio triggers (Altar resonate, melee slash, dash, shockwave) mapped to Godot `AudioStreamPlayer3D` and `AudioStreamPlayer`. |
| **Sacred Geometry** | `src/render/SacredGeometry.ts` | **PORTABLE SPECIFICATION** | Mandalas and Yantras converted into procedural 3D radial meshes, particle emitters, and emissive decal shaders. |
| **UI & Overlays** | `src/ui/ProductionHUD.ts`<br>`src/ui/DiagnosticOverlay.ts` | **REQUIRES 3D REIMPLEMENTATION** | DOM and 2D canvas HUD replaced by Godot `CanvasLayer` Control nodes (`ProgressBar`, `TextureRect`, `RichTextLabel`, `PanelContainer`). |
| **Platform Exports** | `package.json`, `vite.config.ts`, `playwright.config.ts` | **DEPRECATED / PRESERVED AS DUAL RUNTIME** | 2D Web build preserved in `legacy/2d-canvas`; Godot CI export pipeline configured for Windows, Linux, and WebAssembly in `.github/workflows/godot-ci.yml`. |

---

### 3. Source-to-Target Migration Matrix

| Legacy Source (TypeScript) | Target 3D Component (Godot / GDScript) | Status | Test Coverage Strategy |
| :--- | :--- | :--- | :--- |
| `src/entities/Player.ts` | `godot/scenes/player/Player3D.tscn`<br>`godot/scripts/player/player_controller_3d.gd` | **Implemented** | Functional traversal test (`test_player_traversal_3d.gd`): verifies gravity, camera-relative input, stair climbing, dash, and jumping. |
| `src/render/Camera.ts` | `godot/scripts/camera/orbit_camera_3d.gd` | **Implemented** | Orbit pitch clamping, distance zoom, and raycast occlusion tests. |
| `src/combat/CombatSystem.ts` | `godot/scripts/domain/combat_math.gd` | **Implemented** | Parity unit test (`test_combat_math.gd`) matching exact legacy TypeScript results. |
| `src/narrative/QuestManager.ts` | `godot/scripts/domain/quest_manager.gd` | **Implemented** | State machine unit test (`test_quest_manager.gd`) asserting Sanctum Calibration flow. |
| `src/narrative/DialogueTree.ts` | `godot/scripts/domain/dialogue_runner.gd` | **Implemented** | Dialogue progression unit test (`test_dialogue_runner.gd`) asserting node branching. |
| `src/persistence/SaveGameManager.ts`| `godot/scripts/domain/save_system.gd` | **Implemented** | Save/load & tamper resistance test (`test_save_system.gd`) verifying checksum validation. |
| `src/scenes/GameScene.ts` | `godot/scenes/levels/TestChamber3D.tscn`<br>`godot/scripts/levels/test_chamber_3d.gd` | **Implemented** | Full 3D environment with elevation, stairs, obstacles, Sun Shrine, and lighting. |
| `src/entities/Altar.ts` | `godot/scenes/interactables/SunShrine3D.tscn`<br>`godot/scripts/interactables/shrine_3d.gd` | **Implemented** | Area3D proximity interaction, Kindle event, and golden solar illumination. |
| `src/entities/AstraShard.ts` | `godot/scenes/interactables/AstraShard3D.tscn`<br>`godot/scripts/interactables/astra_shard_3d.gd` | **Implemented** | Area3D pickup detection, collection counting, and sound trigger. |

---

### 4. Engine Feasibility Evaluation & Architecture Decision (Phase 0.2)

Two potential 3D architectures were evaluated through technical proofs:
1. **Godot Engine 4.3 Standard (GDScript)**
2. **Babylon.js (v7.x) + TypeScript**

#### Quantitative Benchmark & Comparison Matrix

| Evaluation Criterion | Godot 4.3 Standard (GDScript) | Babylon.js + TypeScript | Selected Architecture & Rationale |
| :--- | :--- | :--- | :--- |
| **Native Desktop Binary** | First-class native C++ runtime (Windows x86_64, Linux x86_64, macOS). Single compact executable (~84 MB). | Requires Electron / Tauri wrapper with Chromium overhead (~150+ MB). | **Godot 4.3 Selected:** Native execution provides zero-overhead GPU access and rock-solid 60+ FPS. |
| **3D Physics & Character Controller** | Built-in `CharacterBody3D` with Jolt / GodotPhysics, automatic floor snapping, slope sliding, and step-up assistance. | Requires external Havok or Cannon.js bindings, manual step handling, and raycast polling. | **Godot 4.3 Selected:** `CharacterBody3D` delivers out-of-the-box physical elevation traversal and stair stepping. |
| **Headless CI & Containerization** | Official Docker/Podman image (`barichello/godot-ci:4.3`) capable of headless import, unit testing, and multiplatform export. | Node.js headless testing via Puppeteer/Playwright or mock WebGL. | **Godot 4.3 Selected:** Podman image executes headless validation in < 2 seconds without host dependencies. |
| **3D Scene Graph & Visual Tools** | Native hierarchical `.tscn` text format, integrated scene editor, visual materials, and standard glTF import pipeline. | Code-driven scene construction or web-based Inspector. | **Godot 4.3 Selected:** `.tscn` files are Git-friendly and clean to version control. |
| **Web Export (HTML5 / Wasm)** | Export template `web_release.zip` compiling to WebAssembly + WebGL 2.0 (Compatibility renderer). | Native JavaScript/TypeScript in browser canvas. | **Godot 4.3 Selected:** Standard GDScript avoids C# web threading constraints. |
| **Mobile Export Support** | Direct export to Android APK and iOS Xcode project using official templates. | Requires Capacitor / Cordova wrapping. | **Godot 4.3 Selected:** Official export presets ready out-of-the-box. |

**Decision:** **Godot Engine 4.3 Stable Official (`4.3.stable.official.77dcf97d8`) with Standard GDScript is chosen as the canonical 3D engine for *Mythos*.** C# is explicitly excluded to ensure uncompromised web export compatibility and zero-dependency containerized builds.

---

### 5. Regression Prevention & Legacy Preservation Plan

To guarantee that zero historical progress, working features, or tests are lost:
1. **Git Preservation:** Tag `v1.14.0-legacy-2d` and branch `legacy/2d-canvas` preserve the full 2D Canvas engine, all 56 Vitest test suites (486 tests), and 45 Playwright E2E tests in a permanently runnable state.
2. **Dual-Stack Coexistence:** The Godot 3D project resides in `godot/`, allowing the existing TypeScript build system (`npm run build`, `npm test`) to continue operating alongside Godot headless tests (`npm run test:godot`).
3. **Domain Cross-Validation:** Mathematical unit tests assert that GDScript domain systems (`combat_math.gd`, `quest_manager.gd`, `save_system.gd`) output identical numerical and state values to their TypeScript counterparts.
4. **Append-Only Compliance:** `TODO.md` and `CHANGELOG.md` follow strict append-only governance, verified by `scripts/verify-append-only.js`.

---

### 6. Genuine 3D Technical Demonstration Design (Phase 0.5)

The test chamber (`res://scenes/levels/TestChamber3D.tscn`) is built with genuine 3D physical geometry:
- **Ground Floor:** 36m x 36m basalt flagstone platform (`StaticBody3D` with `BoxShape3D`).
- **Elevated Sanctum Stage:** Raised +2.7m above ground floor with stone balustrades.
- **Physical Stairs:** A monumental flight of 9 steps connecting the ground floor to the elevated stage. Each step has height `0.30m`, depth `0.60m`, and width `4.0m` with individual box collision hulls.
- **Hoysala Pillars:** Four fluted granite columns (`CylinderShape3D`) providing physical collision obstacles.
- **Sun Altar Shrine:** Positioned atop the elevated platform, featuring a central golden pedestal, rotating Surya solar mandala, and an `Area3D` proximity sensor. Pressing `[E]` triggers the sacred Kindle animation and golden solar flare.
- **Lighting & Atmosphere:** `DirectionalLight3D` positioned at `(-45°, 35°, 0°)` casting soft shadow maps with depth bias, coupled with a `WorldEnvironment` sky dome and glowing ember particles.
- **Controllable 3D Avatar (Veer):**
  - Mesh constructed with distinct articulated anatomical segments (torso, head, topknot, pauldrons, Agni gauntlets, Surya Khadga scimitar on right hand socket, dhoti, thighs, shins, and feet).
  - Orbit camera via `SpringArm3D` (`4.5m` arm length, `-70°` to `+25°` pitch).
  - Physics movement: W/A/S/D camera-relative translation, smooth facing interpolation, Space jump, Shift dash with trail, and Left Click melee attack.

---

### 7. Verification, CI/CD & Delivery Schedule

- **Native Windows Execution:** Verified via `tools/godot/Godot_v4.3-stable_win64_console.exe`.
- **Container Execution:** Verified via `podman run --rm -v "H:\mythologicalgame:/workspace:Z" docker.io/barichello/godot-ci:4.3 godot --headless`.
- **Unit Testing:** Executed via `godot/tests/runner.gd` with automated exit code reporting.
- **GitHub Actions:** Configured in `.github/workflows/godot-ci.yml` covering headless validation, unit tests, and multiplatform exports.
