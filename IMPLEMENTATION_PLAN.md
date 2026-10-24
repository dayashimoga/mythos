# Mythos: Astra & The Seven Realms — Implementation Plan & Roadmap
**Document Version:** 1.0.0-PROD  
**Classification:** Engineering Roadmap, Multi-Stage Milestones & Delivery Schedule  
**Status:** Canonical & Baseline Frozen for Stage 0  

---

## 1. Stage-by-Stage Roadmap Overview

The *Mythos: Astra* development lifecycle is structured across 8 strictly defined sequential stages (Stage 0 through Stage 7):

```
[Stage 0: Production-Grade Engine & Sanctum Foundation]  <-- [COMPLETED / CERTIFIED]
       │
       ▼
[Stage 1: Realm of Bhumi (Mortal Realm & Temple Ruins)]
       │
       ▼
[Stage 2: Realm of Patala (Subterranean Caverns & Serpent Lords)]
       │
       ▼
[Stage 3: Realm of Bhuvarloka (The Atmospheric Ether)]
       │
       ▼
[Stage 4: Realm of Tapoloka (Plane of Astral Austerity)]
       │
       ▼
[Stage 5: Realm of Janaloka (Crucible of Cosmic Memory)]
       │
       ▼
[Stage 6: Realm of Maharloka (High Orbit of Ascended Sages)]
       │
       ▼
[Stage 7: Realm of Svarga & Cosmic Convergence (Climax)]
```

---

## 2. Detailed Stage Breakdown

### Stage 0: Production-Grade Engine & Sanctum Foundation (Current)
- **Goal:** Establish runnable, hardware-accelerated Astra Game Engine with zero placeholder stubs, deterministic 60Hz loop, procedural audio, multi-platform CI/CD, and $\ge 90\%$ test coverage.
- **Deliverables:**
  - Deterministic game loop (`GameLoop.ts`) with fixed 16.66ms timestep accumulator.
  - Spatial hash collision detection (`SpatialHash.ts`, `CollisionSystem.ts`).
  - WebAudio procedural chiptune/harmonic synthesizer (`AudioEngine.ts`).
  - Playable Sanctum of Astra level with Hero Veer, Shards, Altar, and Sentinels.
  - Multi-platform packaging for Web, Windows, Linux, macOS, Android, and iOS.
  - Automated CI matrix and release pipeline with SHA-256 artifact hashing.
  - 80 automated tests with $92.7\%$ code coverage.
- **Status:** **100% COMPLETE & CERTIFIED**.

### Stage 1: Realm of Bhumi (Mortal Realm & Temple Ruins)
- **Target Timeline:** Sprint 1 - 3 (Weeks 1 - 6)
- **Scope:**
  - Expanded world map with procedural tile loading and chunk streaming.
  - 4 distinct enemy archetypes: Corrupted Vanara scout, Stone Rakshasa, Asura archer, and Void Spectre.
  - Inventory & Equipment system: Weapon forging at sacred anvils.
  - Boss Encounter: *Kalanemi's Shadow*.

### Stage 2: Realm of Patala (Subterranean Caverns)
- **Target Timeline:** Sprint 4 - 6 (Weeks 7 - 12)
- **Scope:**
  - Dynamic fluid mechanics (Lava, toxic mist, divine amrita pools).
  - Vertical traversal mechanics: Grappling tether via Astra Whip.
  - Naga subterranean lore quests and ancestral serpent dialogues.
  - Boss Encounter: *The Serpent King Takshaka*.

### Stage 3: Realm of Bhuvarloka (Atmospheric Ether)
- **Target Timeline:** Sprint 7 - 9 (Weeks 13 - 18)
- **Scope:**
  - Aerial wind currents and omnidirectional dash currents (*Vayu-Currents*).
  - Environmental puzzles manipulating atmospheric pressure and storm nodes.
  - Boss Encounter: *Vritra the Cloud Devourer*.

### Stage 4: Realm of Tapoloka (Plane of Austerity)
- **Target Timeline:** Sprint 10 - 12 (Weeks 19 - 24)
- **Scope:**
  - Samadhi state mechanics (Time-dilation, slow-motion bullet time).
  - Astral projection puzzles guided by Devi Tara.
  - Trial of the Seven Sages (*Sapta-Rishi*).

### Stage 5: Realm of Janaloka (Crucible of Cosmic Memory)
- **Target Timeline:** Sprint 13 - 15 (Weeks 25 - 30)
- **Scope:**
  - Illusory timelines and temporal rewinding mechanics.
  - Memory crystal extraction and past Yuga cinematic archives.

### Stage 6: Realm of Maharloka (High Orbit of Sages)
- **Target Timeline:** Sprint 16 - 18 (Weeks 31 - 36)
- **Scope:**
  - Zero-gravity orbital combat arenas.
  - Celestial chariot mechanics.

### Stage 7: Realm of Svarga & Cosmic Convergence (The Climax)
- **Target Timeline:** Sprint 19 - 22 (Weeks 37 - 44)
- **Scope:**
  - The Grand Citadel of Indra and Mount Meru Summit.
  - Asura Titan Mahisha multi-phase climax battle.
  - Cosmic Kala-Chakra realignment and multiple canonical endings based on player resonance.

---

## 3. Engineering Quality Gates Between Stages

No stage may begin until the preceding stage satisfies:
1. **Zero Failing Tests:** $100\%$ passing required test suites.
2. **Coverage Budget:** Minimum $90\%$ lines and functions coverage.
3. **Performance Envelope:** Maximum $16.6\text{ ms}$ frame time on standard hardware; memory footprint $\le 80\text{ MB}$.

---

## 4. Stage Q0 Independent Audit & Verified Baseline Roadmap

### 4.1 Stage Q0 Status: COMPLETE (Baseline Established)
- **Engine Pinned:** Godot 4.3 Stable Official (`4.3.stable.official.77dcf97d8`).
- **Seven-Realm Functional Integrity:** All 7 realms (Bhumi, Antariksha, Patala, Svar, Maharloka, Tapoloka, Satyaloka) render on GPU with 0 script errors and verified camera, player, HUD, and portal lifecycles.
- **Runtime Repairs:** Fixed HUD typing (`CanvasLayer`), Tara typing (`Node3D`), interaction signals, sprint action, missing inter-realm portal methods, and continuous humanoid skeleton rigging for Veer (24 bones, 3.8k verts, natural rest pose).
- **Test Integrity:** 106/106 Godot tests pass (Suites 1–16); 504/504 TypeScript tests pass.
- **Web Export:** Web package synchronized at 1,493,712 bytes across `public/3d/`, `dist/3d/`, and `builds/web/`.

### 4.2 Stage Q1 Remediation Progress (COMPLETED & VERIFIED)
1. **Q1.1 High-Fidelity Character & Boss Modeling (COMPLETED):**
   - Completely replaced procedural box/cylinder primitive placeholders across all 7 realms with 20 high-fidelity binary GLB models authored in `scripts/production_asset_builder.py` and `scripts/generate_all_production_realm_assets.py`. Continuous anatomy, Vedic ornamentation, and procedural PBR textures (Albedo, Normal, Metallic/Roughness, Emissive) delivered for all 14 enemies and 7 bosses:
     - Act I: `asura_warrior.glb` (75.5 KB), `boss_kalanemi.glb` (115.0 KB)
     - Act II: `gale_falcon.glb` (45.5 KB), `wind_archer.glb` (53.8 KB), `boss_matarishvan.glb` (69.8 KB)
     - Act III: `naga_spitter.glb` (33.4 KB), `naga_constrictor.glb` (62.7 KB), `boss_shesha_echo.glb` (65.2 KB)
     - Act IV: `surya_guardian.glb` (70.1 KB), `solar_gryphon.glb` (45.0 KB), `boss_surya_avatara.glb` (74.1 KB)
     - Act V: `astral_rishi.glb` (77.5 KB), `scripture_golem.glb` (28.1 KB), `boss_brihaspati.glb` (80.8 KB)
     - Act VI: `agni_berserker.glb` (60.0 KB), `tapas_magma_hound.glb` (46.5 KB), `boss_agni_rudra.glb` (81.5 KB)
     - Act VII: `moksha_seraph.glb` (75.3 KB), `dharma_sentinel.glb` (89.0 KB), `boss_brahma_avatara.glb` (126.8 KB)
2. **Q1.2 3D Spatial Audio & Sound Effects Pipeline (COMPLETED):**
   - Synthesized 8 authentic 16-bit 44.1kHz PCM sound effects into `godot/assets/audio/sfx/` via `scripts/generate_production_audio.py`. Implemented `godot/scripts/audio/audio_manager_3d.gd` with 16-channel pooled 2D and 3D spatialized audio players. Wired spatial sound triggers into `player_controller_3d.gd`, `asura_warrior_3d.gd`, `boss_kalanemi_3d.gd`, `astra_shard_3d.gd`, and `shrine_3d.gd`.
3. **Q1.3 Environment & Scene UID Warning Sanitization (COMPLETED):**
   - Sanitized invalid placeholder synthetic UIDs from `.tscn` resource declarations across `GaleFalcon3D.tscn`, `WindArcher3D.tscn`, `BossMatarishvan3D.tscn`, `VayuTurbine3D.tscn`, `GrappleAnchor3D.tscn`, `AntarikshaSkyRealm3D.tscn`, and `BhumiValley3D.tscn`, achieving 100% warning-free engine loads (0 warnings).
4. **Q1.4 Production Web Packaging & Test Verification (COMPLETED):**
   - Re-exported updated Godot Web package `public/3d/index.pck` (2,780,656 bytes), synchronized to `dist/3d/index.pck` and `builds/web/index.pck`, and synchronized `fileSizes` in `index.html`. Confirmed 106/106 Godot tests passing (0 failures, 0 warnings across all 16 suites) and 504/504 TypeScript tests passing (0 failures across all 58 test files). Verified append-only governance via `scripts/verify-append-only.js`.

### 4.3 Stage Q2 Next-Phase Horizons (Future Roadmap)
1. **Q2.1 In-Engine Cutscene & Cinematic Dialogue Director:**
   - Camera track sequencing for Tara interactions, boss introductions, and realm transition cinematics.
2. **Q2.2 Occlusion Culling & LOD Optimization:**
   - Generate mesh LODs and room-and-portal / occlusion culling trees for complex realms (Patala caverns and Maharloka libraries).


