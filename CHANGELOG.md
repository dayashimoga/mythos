# Mythos: Astra & The Seven Realms — Append-Only Changelog
**Notice:** This file is strictly append-only. Historical releases and entries must NEVER be deleted or modified. New version blocks and changes must be appended to the bottom. Automated CI scripts enforce this constraint.

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-10-22

### Added
- **Astra Game Engine Foundation:**
  - High-performance 2D hardware-accelerated Canvas & WebGL rendering architecture.
  - Deterministic 60Hz fixed timestep accumulator game loop (`GameLoop.ts`) with spiral of death guards.
  - 2D Vector math library (`Vector2D.ts`) with chaining, normalization, lerp, and static operations.
  - Axis-Aligned Bounding Box collision physics (`AABB.ts`) with overlap and separation resolution.
  - Spatial partition grid (`SpatialHash.ts`) for $O(1)$ collision filtering.
  - Collision management subsystem (`CollisionSystem.ts`) supporting dynamic solids, static solids, and triggers.
  - Camera system (`Camera.ts`) with smooth lerp tracking, viewport clamping, and decaying harmonic screen shake.
  - High-performance particle engine (`ParticleSystem.ts`) with 800 pre-allocated pooled particles, velocity, drag, and radial burst emission.
  - Procedural WebAudio sound synthesizer (`AudioEngine.ts`) with zero external asset dependencies; synthesizes dashes, blasts, shard pickups, resonant drone altars, and victory fanfares.
  - Unified input manager (`InputManager.ts`) aggregating keyboard, mouse, gamepad, and virtual touch joystick (`VirtualJoystick.ts`).
  - State persistence manager (`SaveGameManager.ts`) with schema versioning and cryptographic checksum verification.
  - Error boundary subsystem (`ErrorBoundary.ts`) with graceful unhandled exception interception and crash recovery UI.
  - Diagnostics telemetry engine (`Diagnostics.ts`, `DiagnosticOverlay.ts`) providing real-time FPS, frame latency, memory, entity, particle, and collider toggles (F3).
  - Procedural sacred geometry generator (`SacredGeometry.ts`) creating animated Vedic mandalas and Sri Yantra motifs.
- **Narrative & Gameplay Scenes:**
  - `SplashScene`: Title screen with animated rotating sacred mandalas, cosmic particle aura, and keyboard/touch navigation.
  - `StoryScene`: Screenplay Act I dialogue cutscene between Devi Tara and Solar Guardian Veer with typewriter effect.
  - `GameScene`: Fully playable Sanctum of Astra level featuring Veer, 3 collectible Astra Shards, the monumental Sun Altar, patrolling Corrupted Sentinels, real combat, and consecration victory triggers.
  - `SettingsScene`: Audio volume, synthesizer mute toggle, controls reference card, and saved data purge.
- **Testing Infrastructure:**
  - Automated Vitest test suite with 80 tests across 21 test files achieving $92.7\%$ code coverage.
  - Unit, integration, performance benchmark, and UI test categories with headless Canvas2D/WebAudio mock harness.
- **DevOps & Multi-Platform CI/CD:**
  - GitHub Actions matrix workflow (`ci.yml`) testing Linux, Windows, and macOS runners.
  - Multi-platform release pipeline (`release.yml`) packaging Web, Windows x64, Linux x64, macOS Universal, Android APK, and iOS Xcode Archive.
  - Automated scripts: `build-platforms.js` (generates artifacts and SHA256SUMS.txt), `generate-sbom.js` (CycloneDX SBOM and dependency manifest), `verify-append-only.js` (enforces append-only history).
- **Comprehensive Documentation Suite:**
  - `README.md`, `REQUIREMENTS.md`, `ARCHITECTURE.md`, `CODEBASE_GUIDE.md`, `STORY_SCREENPLAY.md`, `ART_DIRECTION.md`, `IMPLEMENTATION_PLAN.md`, `SETUP.md`, `USER_GUIDE.md`, `TESTING.md`, `PERFORMANCE.md`, `RELEASE.md`, `TROUBLESHOOTING.md`, `TODO.md`, and `CHANGELOG.md`.

---

## [0.2.0] - 2026-10-22

### Added
- **Stage 1 Playable Vertical Slice — The Sunken Fire Temple of Surya-Kund (`BhumiTempleScene`):**
  - Production-grade vertical slice level set in the Realm of Bhumi (Mortal Realm).
  - 1500x1300 arena featuring carved Vedic stone tiles, heat-distorted animated lava trench hazard, and Sanskrit Brahmic pillars.
  - Dual-mode combat system for Solar Guardian Veer:
    - *Melee Agni-Slash* (135° sweeping crescent slash, 40 damage, deflecting and destroying incoming enemy projectiles).
    - *Ranged Surya-Burst* (high-velocity solar bolt, 500 px/s, 25 damage).
    - *Agni-Dash* (380 px/s burst with 250ms invulnerability i-frames to dodge shockwaves and hazards).
    - *Solar Resonant Flare Stance* (unlocked at Agni-Forge; empowers melee damage to 55 and fires dual-shot projectile spread).
  - Interactive sacred props:
    - *Brahmic Resonance Pillars*: Dual Sanskrit-inscribed obelisks (ॐ / क्रीं); striking them harmonizes frequencies and collapses the Tamas Spire void barrier.
    - *Amrita Healing Font*: Sacred fountain restoring 40 Prana with animated cool-down and turquoise water particles.
    - *Agni-Forge*: Ancient anvil granting permanent stance consecration.
    - *High Sun Altar of Surya-Kund*: Final consecrated altar accepting 3 purified Astra Shards to cleanse the temple.
  - Asura Enemy Archetypes & AI:
    - *Vanara Void-Scout*: Agile ranged skirmisher maintaining standoff orbit (140–260px), telegraphing with violet charge rings, and shooting Void Needles.
    - *Stone Rakshasa Enforcer*: Armored heavy brute (140 HP) charging the player, telegraphing seismic ground slam with expanding red ground indicator circle (1.0s windup), and producing expanding seismic shockwaves.
    - *Tamas Corruption Spire*: Monolith (200 HP) protected by an impervious Void Shield until both resonance pillars are harmonized.
  - Real-time Floating Combat Text (`DamageNumberSystem.ts`):
    - Pooled floating numbers rendering gold damage dealt, red damage taken, green healing received, and cyan deflection notices.
  - End-of-Level Evaluation & Retry:
    - Dynamic rank grading (Rank S for <90s, Rank A for <150s, Rank B otherwise) with clear time and enemy kill tally.
    - Instant retry overlay upon defeat (`R` key or `[ SPACE ]` to restart instantly without reloading).
- **Procedural Audio Enhancements:**
  - Added 7 procedural WebAudio synthesizers: `playMeleeSlash`, `playEnemyHit`, `playShockwave`, `playHeal`, `playDefeat`, `playPillarHarmonic`, and `playForgeUpgrade`.
- **Touch & Mobile Controls:**
  - Added dedicated Melee Agni-Slash touch button (`🗡️`) to `VirtualJoystick.ts` with responsive scale animations and semantic IDs.
- **Verification & Testing:**
  - Expanded test suite to 24 test files and 106 tests achieving 92.73% statement coverage, 85.56% branch coverage, and 100% passing tests.
  - Automated browser smoke testing via browser subagent with real-time diagnostics (60 FPS, 10 active entities, 5.6 MB JS heap, 0 console errors) and WebP recording.
- **Specification Documentation:**
  - Created `STAGE1_SPECIFICATION.md` defining functional gameplay scenario, combat formulas, entity contracts, and acceptance criteria.

---

## [0.3.0] - 2026-10-22

### Added
- **Production Character System & Hierarchical Skeletal Animation Engine (`src/animation/`):**
  - High-performance 2D Affine Transformation engine (`Transform2D.ts`) with forward transform composition, inverse local space transformations, shortest-arc rotational slerp, and directional vectors.
  - Hierarchical Bone Node tree (`Bone.ts`) supporting arbitrary parent-child skeletal graphs, rest pose caching, local-to-world transform cascades, and tip world coordinate evaluation.
  - Skeletal container & socket registry (`Skeleton.ts`) with named joint lookups, topological bone transform updates, equipment sockets (`getSocketTransform`), and color-coded vector bone debug rendering.
  - Analytical Two-Bone Inverse Kinematics solver (`TwoBoneIK.ts`) implementing the Law of Cosines with reachable distance clamping to prevent mathematical singularities ($NaN$) and smooth joint orientation bending.
  - Multi-track property keyframing engine (`KeyframeTrack.ts`) supporting both scalar floats and 2D vectors across Linear, Cubic Hermite Spline, and Stepped interpolation modes.
  - Animation Clip player (`AnimationClip.ts`) with clamped or looping playback and timed frame event dispatching (`getTriggeredEvents`) for audio, particle, and combat collision synchronization.
  - 1D Parametric Blend Tree (`BlendTree1D.ts`) with normalized cycle phase synchronization ($\phi \in [0, 1)$), eliminating foot sliding and cadence popping across idle-walk-run transitions.
  - Hierarchical Animation State Machine (`AnimationStateMachine.ts`) supporting clip nodes, blend tree nodes, dynamic float/boolean parameter driving, conditional transition evaluation, and smooth Hermite cross-fading (default 0.15s).
  - Master Character Rig controller (`CharacterRig.ts`) binding skeletal nodes, state machines, aim IK, foot IK, direction facing, and custom render delegates.
- **Authoritative Roster Rigs & Vedic Aesthetic Visuals (`CharacterDefinitions.ts`):**
  - *Solar Guardian Veer (21 Bones):* Complete spine, clavicle, arm, finger, leg, and foot hierarchy. Features radiant saffron tunic, Surya breastplate, golden cuffs, glowing tilak, and Surya Sun-Blade socketed to the right hand.
  - *Devi Tara (18 Bones):* Celestial guide rig with floating spine, graceful arms, flowing turquoise sari, diaphanous veil, glowing third eye, and Abhaya/Varada mudra hand poses.
  - *Stone Rakshasa (15 Bones):* Heavy crystalline brute with hunched spine, basalt spikes, glowing molten lava fissures, and stone-bound war club socketed to the right fist.
  - *Vanara Scout (16 Bones):* Agile forest scout with golden-amber fur, dynamic head crest, and expressive 4-segment prehensile tail with sinusoidal idle oscillation.
- **Interactive Character Studio & Inspection Environment (`CharacterShowcaseScene.ts`):**
  - Dedicated character inspection studio accessible via Title Screen button or `[ C ]` hotkey.
  - Interactive features:
    - Character switcher hotkeys: `[1]` Veer, `[2]` Devi Tara, `[3]` Stone Rakshasa, `[4]` Vanara Scout.
    - Animation playback state cycling: Idle, Walk, Run, Attack, Hurt, Dead.
    - Parameter speed slider `[ [ / ] ]` driving blend trees from 0.0 to 1.0.
    - Play/Pause toggle `[ Space ]` and slow-motion time-scaling `[ T ]` (1.0x, 0.5x, 0.25x, 0.1x).
    - Skeletal debug overlay toggle `[ B ]` displaying color-coded bone segments, joints, and sockets.
    - Dynamic Aim IK toggle `[ M ]` tracking mouse cursor in world space.
    - Dynamic Foot IK toggle `[ K ]` simulating uneven terrain raycast placement.
    - Telemetry HUD displaying active character, bone count, active state, transition progress, cycle time, and playback FPS.
- **Gameplay & Narrative Scene Integration:**
  - Integrated Veer's 21-bone `CharacterRig` into `Player.ts`, mapping velocity and actions directly to blend trees, slashes, dashes, hurt states, and directional facing.
  - Integrated Devi Tara's 18-bone `CharacterRig` into `StoryScene.ts`, rendering her ethereal floating posture and mudra hand gestures during the Act I prologue dialogue.
- **Character Specification & Documentation:**
  - Authored comprehensive `CHARACTER_SPECIFICATION.md` detailing lore dossiers, proportions, color palettes, skeletal joint hierarchies, 2-bone IK math formulations, and blend tree graphs.
- **Quality Assurance & Verification:**
  - Expanded automated test coverage across 27 test files and 125 tests achieving 94.09% statement coverage, 85.70% branch coverage, and 100% pass rate.
  - Verified visual fidelity, interaction stability, and 60 FPS performance via automated browser smoke tests with session WebP recording and artifacts.

---

## [0.4.0] - 2026-10-22

### Added
- **Production Environment Subsystem & World Architecture (`src/environment/`):**
  - Continuous 4000x3200 open mythological world region: *The Sunken Citadel of Surya-Kund & Dandaka Valley*.
  - Five distinct interconnected environmental zones:
    - *Zone 1: The Sacred Forest of Dandaka* (Ancient Banyan trees with aerial drop-root collisions, mossy shrines, and fireflies).
    - *Zone 2: The Grand Vedic Causeway* (Flagstone highway, monumental Torana archway, Ashoka pillars, prayer wheel pavilion).
    - *Zone 3: The Sunken Citadel & Kalyani Ghats* (Stepped granite pool, colonnaded mandapa, towering Shikhara temple, 6 fire braziers).
    - *Zone 4: The Patala Basalt Chasm* (Deep volcanic ravine, wooden suspension bridge, molten lava fissures, glowing crystals).
    - *Zone 5: Distant Parallax Horizons* (Mount Meru snow peaks, floating Vimanas, drifting cloud silhouettes, celestial dome).
  - High-performance Spatial Chunk Manager (`ChunkManager.ts`):
    - 500x500 spatial chunk grid partitioning the 4000x3200 world canvas into 56 uniform cells.
    - Viewport frustum culling with predictive padding, reducing active draw calls by >70%.
    - Dynamic Level-of-Detail (LOD0 <600px, LOD1 600–1400px, LOD2 >1400px).
    - Instanced batching for repeated cobblestones, swaying grass tufts, and flora.
  - Multi-Source 2D Dynamic Lighting Engine (`LightingEngine.ts`):
    - Five canonical time-of-day presets: Dawn (Usha), Noon (Surya), Sunset (Sandhya), Night (Ratri), and Eclipse (Grahana).
    - Dynamic point lights with harmonic multi-frequency flame flicker and radial darkness cutouts.
    - Soft penumbra falloff and additive luminescence glow overlays.
  - Atmospheric & Weather Simulation Engine (`AtmosphericSystem.ts`):
    - Four weather systems: Solar Clear (crepuscular god rays), Monsoon Mist (diagonal rain and fog), Chasm Embers (volcanic sparks), and Valley Wind (drifting leaves).
  - 2D Navigation Mesh & A* Pathfinding (`NavMesh.ts`):
    - 40px cell resolution navigation grid spanning the 4000x3200 world space.
    - Terrain traversal weighting: Paved roads (cost 1.0), packed earth (cost 1.1), meadow (cost 1.4), shallow water (cost 2.0), obstacles (cost $\infty$).
    - A* pathfinding with 8-directional stepping and line-of-sight string-pulling path smoothing.
  - Automated Environment Probes (`EnvironmentProbes.ts`):
    - Collision boundary and geometry audit, landmark reachability audit, culling budget audit, and asset completeness audit.
- **Playable World Exploration Experience (`WorldExplorationScene.ts`):**
  - Fully explorable open world scene integrating Hero Veer's 21-bone skeletal rig and locomotion blend tree.
  - Real-time interactive props: igniting braziers, spinning prayer wheels, and chimes.
  - Real-time controls:
    - Time of Day toggle (`[ L ]`)
    - Weather cycle toggle (`[ W ]`)
    - NavMesh overlay toggle (`[ N ]`)
    - Collision overlay toggle (`[ B ]`)
    - Mini-map radar toggle (`[ M ]`)
    - 2D Lighting pass toggle (`[ F2 ]`)
    - Camera zoom adjustments (`[ + ]` / `[ - ]`)
    - Mouse click waypoint navigation path generation.
- **Quality Assurance & Verification:**
  - Expanded automated test coverage across 30 test files and 163 tests, achieving 94.21% statement coverage, 86.76% branch coverage, and 100% pass rate.
  - Verified 60 FPS performance, 11 MB heap, and zero errors in browser smoke test with archived WebP video recording (`mythos_stage3_world_smoke_1792690240396.webp`).

---

## [0.5.0] - 2026-10-23

### Added
- **Mechanics Specification & Authoritative Systems Design (`GAMEPLAY_SPECIFICATION.md`):**
  - Comprehensive action matrix mapping all player inputs to simulation events.
  - Mathematical formulas for dual-weapon damage scaling, combo chains, poise reduction, directional shield blocking, and 120ms frame-accurate parry window.
  - Multi-phase behavior specification for Titan Boss Mahishasura and squad flanker tactics for Asura Elite Vanguards.
- **Behavior Tree AI Subsystem (`src/gameplay/BehaviorTree.ts`):**
  - Modular, event-driven Behavior Tree implementation.
  - Core control flow nodes: `SequenceNode`, `SelectorNode`, `InverterNode`, `CooldownNode`.
  - Leaf execution nodes: `ActionNode` with delta-time callbacks, `ConditionNode` with blackboard predicates.
  - Centralized blackboard data container (`Blackboard`) for decoupled entity perception and tactical awareness.
- **Authoritative Combat Subsystem (`src/gameplay/CombatSystem.ts`):**
  - Authoritative damage evaluation resolving `AttackSpec` and `DefenseSpec`.
  - Directional shield blocking: checks dot product between defender facing and incoming vector ($\vec{F} \cdot \vec{A} > 0.38$), absorbing 75% of health damage and 50% poise damage.
  - Shield-break attacks: completely bypasses guard and inflicts 2.0x poise damage.
  - Stagger system: breaks target when poise depletes to 0, locking entity into stagger duration and granting +35% critical punish damage.
  - Frame-accurate 120ms perfect parry window: completely nullifies damage and poise impact, triggering cyan visual effects and camera shake.
  - Integrated floating combat text numbers and harmonic camera impact shake.
- **Dual-Weapon Equipment & Combo Engine (`src/gameplay/EquipmentManager.ts`):**
  - Dynamic weapon switching between:
    - *Agni-Chakram*: Fast twin solar discs (28 base damage, 75px reach, 0.22s cadence).
    - *Prana-Glaive*: Monumental polearm (48 base damage, 38 poise damage, 125px reach, guard-breaking thrusts).
  - Dynamic 3-hit combo chain: Hit 1 (1.0x), Hit 2 (1.25x damage, 1.3x poise damage, 1.1x reach), Finisher (1.6x damage, 1.8x poise damage, 1.25x reach, shield-break).
  - Astra Essence currency accumulation and weapon tier upgrades.
- **Tactical Checkpoint Subsystem (`src/gameplay/CheckpointManager.ts`):**
  - Checkpoint registration, activation tracking, and instantaneous player restoration upon defeat.
- **Asura Elite Vanguard AI Entity (`src/entities/AsuraEliteVanguard.ts`):**
  - Behavior Tree-driven squad elite with 180 HP, 60 Poise, and directional bronze tower shield.
  - Cooperative flanking tactics: `Alpha_Left` (-50° offset) vs `Beta_Right` (+50° offset) pincer maneuvers.
  - Leap slam jump with shockwave impact and melee cleave windup.
- **Mahishasura Titan Boss Entity (`src/entities/MahishasuraBoss.ts`):**
  - Colossal multi-phase titan with 1000 HP, 250 Poise, and custom Behavior Tree AI.
  - *Phase 1: Buffalo Wrath* (100% - 70% HP): Buffalo Horn Charge (400 px/s charge sprint with red vector telegraph) and Seismic Hammer Slam (expanding shockwave ring).
  - *Phase 2: Tamas Sorcery* (70% - 30% HP): Shadow Blink teleportation behind player, 3-orb Tamas Homing Volley, and reinforcement squad summoning.
  - *Phase 3: Eclipse Cataclysm* (30% - 0% HP): Berserk speed (+35%), 300 Max Poise, and Eclipse Leap creating 8-directional radial magma bursts.
- **Playable Boss Encounter Scene (`src/scenes/BossEncounterScene.ts`):**
  - Setting: The Obsidian Throne with basalt boundary pillars, molten floor fissures, and sacred Brahmic floor circle.
  - Dedicated Boss Health Bar HUD with 70% and 30% phase notches and Poise stagger meter.
  - Player combat HUD showing active weapon, combo chain state, energy, and parry window indicator.
  - Instant Checkpoint retry (`[ R ]`), pause overlay (`[ ESC ]`), and battle ranking system (Rank S/A/B).
  - Registered in `Engine.ts` and title menu navigation in `SplashScene.ts` (`[ X ]` / `[ 👹 ]`).
- **Quality Assurance & Verification:**
  - Expanded test coverage across 32 test files and 207 automated tests with 93.56% statement coverage and 85.84% branch coverage (100% passing).
  - Multi-platform production packaging validated across Web, Windows x64, Linux x64, macOS Universal, Android, and iOS.

---

## [0.6.0] - 2026-10-23

### Added
- **Narrative Architecture & Screenplay Bible (`NARRATIVE_SPECIFICATION.md`):**
  - Canonical lore bible and screenplay for Chapter 1: *The Dawning Flare of Dandaka*.
  - Three-Act dramatic progression: Act I (The Shattered Sanctum), Act II (The Blighted Groves of Dandaka), Act III (The Obsidian Throne).
  - Character relationship affinity system tracking `taraAffinity`, `vanaraTrust`, and `karmicBalance` across moral decision nodes.
  - Comprehensive objective taxonomy (`EXPLORE_LOCATION`, `COLLECT_SHARD`, `DEFEAT_TARGET`, `INTERACT_NPC`, `CONSECRATE_ALTAR`, `CHOOSE_DIALOGUE`).
  - Strict `v2.0.0` narrative save-state contract with cryptographic checksum validation.
- **Narrative Data Models & Schemas (`src/narrative/NarrativeTypes.ts`):**
  - Strongly-typed TypeScript interfaces for `MissionDefinition`, `MissionObjective`, `MissionReward`, `DialogueChoice`, `DialogueNodeData`, and `NarrativeSaveState`.
- **Branching Dialogue Tree Engine (`src/narrative/DialogueTree.ts`):**
  - Typewriter text pacing with configurable speed ($22\text{ ms/char}$) and instant fast-forward on input.
  - Branching choice selection with story-flag prerequisites and moral alignment deltas.
  - Distinct speaker badges, custom portrait color motifs, and celestial expressions (`neutral`, `focused`, `determined`, `surprised`, `sorrowful`, `wrathful`).
  - Keyboard number hotkeys (`[ 1 ]`, `[ 2 ]`, `[ 3 ]`) preventing accidental choice skips.
- **Authoritative Quest & Progression Manager (`src/narrative/QuestManager.ts`):**
  - Directed Acyclic Graph (DAG) mission prerequisite validation.
  - Objective event trigger dispatch system decoupled from scene rendering.
  - Story flag persistence, relationship affinity clamping ($[-100, +100]$), and cutscene unlock tracking.
  - Cryptographic checksum generation and tampering detection.
- **Canonical Chapter 1 Campaign Missions & Dialogues (`src/narrative/CampaignChapter1.ts`):**
  - Five complete sequential missions:
    - *M1: Awakening of the Solar Flame* (Sanctum calibration, combo strike attunement).
    - *M2: The Consecration of Surya-Kund* (Gathering Astra Shards, purifying Sun Altar).
    - *M3: The Blighted Groves of Dandaka* (Torana Gate transition, Vanara Scout Kapi standoff).
    - *M4: The Harmonies of Brahman* (Harmonizing Om and Krim Brahmic Pillars).
    - *M5: The Eclipse Titan's Fall* (Obsidian Throne confrontation, Mahishasura defeat).
  - Full dialogue trees for Devi Tara, Vanara Scout Kapi, and Mahishasura.
- **Cinematic Director & Camera Choreographer (`src/cinematics/CinematicDirector.ts`):**
  - Smooth 2.39:1 widescreen black letterbox bar transitions with golden accent trim lines.
  - Camera position and zoom interpolation towards cinematic points of interest.
  - Elegant serif title card overlays with subtitle pacing and alpha fade curves.
  - Seamless skip handling (`[ ESC ]`) restoring gameplay camera and state without desync.
- **Backwards-Compatible Save State Upgrade (`src/state/SaveGameManager.ts`):**
  - Extended `GameSaveState` with optional `narrative?: NarrativeSaveState`.
  - Checksum validation maintains 100% backward compatibility with `v1.0.0` save states.
- **Playable Story Campaign Scene (`src/scenes/StoryCampaignScene.ts`):**
  - Full multi-act story arc across Sanctum of Astra, Dandaka Gateway, and Obsidian Throne.
  - Active Quest Tracker HUD displaying current mission, active objectives, and progress counts.
  - Quest Log modal (`[ O ]` / `[ TAB ]`) with full mission summaries, rewards, and lore entries.
  - Seamless transitions between scripted cutscenes, narrative dialogues, and intense real-time combat.
  - Tactical checkpoint respawn (`[ R ]`), game-over recovery, and title screen navigation.
  - Fast-travel button (`STAGE 5: STORY CAMPAIGN [ S / 📜 ]`) integrated into `SplashScene.ts`.
- **Quality Assurance & Certification:**
  - Expanded test suite to 34 test files and 239 automated tests with 100% pass rate.
  - Global test coverage: 93.46% statements/lines ($\ge 90\%$ requirement), 85.74% branch coverage ($\ge 85\%$ requirement).
  - Multi-platform packaging builds verified for Web, Windows x64, Linux x64, macOS, Android, and iOS.




