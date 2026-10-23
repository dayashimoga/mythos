# STAGE R1 — Modern Graphics & Production Art Pipeline Specification
**Document Version:** 1.0.0-PROD  
**Project Identifier:** `mythos-astra-game`  
**Classification:** Graphics Architecture, Art Direction, Asset Pipeline & Level Reconstruction Specification  
**Status:** Canonical & Approved for Stage R1 Execution  
**Date:** October 23, 2026  

---

## 1. Executive Summary & Mission Scope

The mission of **STAGE R1** is to elevate *Mythos: Astra & The Seven Realms* from a prototype with primitive wireframes and pasted rectangular illustrations into a **production-quality 2.5D illustrated mythological fantasy game**. 

This requires:
1. Eradicating all amateur visual artifacts: wireframe coordinate grids, rectangular JPEG backdrops, squashed images in rounded boxes, circular image cutouts, and mismatched perspectives.
2. Building and benchmarking an authoritative rendering architecture comparing standard Canvas2D, WebGL2 (PixiJS), and an optimized Hybrid 2.5D Production Renderer.
3. Establishing a coherent illustrated art direction inspired by classical Hoysala, Chalukya, and Vijayanagara temple architecture fused with Vedic solar mysticism.
4. Implementing a production asset pipeline featuring validated transparent sprites, sprite sheets/atlases with pivot points, frame metadata, scale normalization, checksum validation, and provenance records.
5. Completely reconstructing the **Sanctum of Astra** level into a visually rich, deeply atmospheric, playable environment while preserving all combat, movement, physics, and gameplay mechanics.
6. Implementing dynamic 2D lighting, soft contact shadows, ambient occlusion, volumetric light shafts, and depth sorting.

---

## 2. Phase 1.1 — Rendering & Art Audit

A forensic examination of the existing rendering passes in `GameScene.ts`, `LayeredRenderer.ts`, `AssetManager.ts`, and `AssetManifest.ts` reveals seven critical visual defects:

| Defect Category | Existing Code & Manifest Observation | Visual Degradation Result | Production Remedy |
| :--- | :--- | :--- | :--- |
| **Pasted JPEG Images** | `sanctum_pillar.jpg`, `sanctum_altar.jpg`, `sanctum_shard.jpg`, `sanctum_sentinel.jpg` were square JPEG files with black backgrounds. | Entities appeared as square cards or circle cutouts pasted over temple pavers. | Genuine transparent PNG sprites with normalized pivots and alpha channels. |
| **Squashed Aspect Ratios** | `renderPillar()` squeezed $1024 \times 1024$ square textures into $72 \times 160\text{ px}$ bounding boxes with rounded rectangle clipping. | Extreme vertical elongation and distorted stone carvings. | Authentic $1:2.2$ pillar sprites rendered with true sculptural proportions. |
| **Primitive Wireframe Grid** | `renderChamberFloor()` drew yellow wireframe lines (`step = 64`) using `ctx.stroke()` across the entire hall floor. | Looked like an unfinished debug sandbox rather than an ancient sacred sanctum. | Remove wireframe grid completely. Replace with sculpted stone pavers and ceremonial inlays. |
| **Crude Chamber Boundaries** | `renderChamberWalls()` rendered a plain $6\text{px}$ stroke boundary with 4 orange circles at corners. | Sterile geometric box with zero architectural depth. | Carved stone perimeter walls with cornices, stepped moldings, and corner shrines. |
| **Repetitive Image Tiling** | `renderChamberFloor()` tiled a single $1024 \times 1024$ painting in $256\text{px}$ chunks. | Visible seams and repetitive cutoffs of complex mandala artwork. | Modular, seamless granite pavers combined with a bespoke central ceremonial nave. |
| **Inconsistent Visual Styles** | Veer uses a dynamic 21-bone skeletal vector rig, whereas Sentinels and Altars used static clipped stock art. | Jarring clash between dynamic vector animation and static photo cutouts. | Unified illustrated fantasy style with shared palette, rim highlights, and ambient contact shadows. |
| **Missing Spatial Depth** | Props and entities sat flatly on top of floor tiles without ambient occlusion or floor integration. | Floated on screen without ground connection. | Elliptical contact shadows, ground dust, and base ambient occlusion. |

---

## 3. Phase 1.2 — Rendering Architecture Evaluation & Comparative Proof of Concept

### 3.1 Architectural Trade-Off Analysis

| Architectural Criterion | Option A: Pure WebGL2 / PixiJS | Option B: Standard Canvas2D | Option C: Hybrid 2.5D Production Renderer (Selected) |
| :--- | :--- | :--- | :--- |
| **GPU Batching** | Automatic quad batching via WebGL2/WebGPU. | Manual draw call per sprite; state switches costly. | High-performance Canvas2D batching + offscreen composite cache. |
| **Skeletal Rigging** | Requires Spine or custom WebGL mesh shaders. | Directly supports 21-bone hierarchical affine transforms. | Native support for 21-bone affine skeletal rigs + IK solvers. |
| **Headless CI Testability** | **Fails in standard JSDOM** without complex WebGL mock harnesses. | **100% Native & Instantaneous** in JSDOM / Vitest runners. | **100% Native & Instantaneous** in headless CI runners. |
| **Bundle Overhead** | $+1.4\text{ MB}$ minified runtime bundle. | $0\text{ KB}$ runtime overhead. | $0\text{ KB}$ runtime overhead (native platform capabilities). |
| **Native Shell Stability** | Occasional context loss on mobile sleep/wake in WebViews. | Rock-solid stability across Tauri, Android, and iOS. | Rock-solid stability across Tauri, Android, and iOS. |
| **2D Dynamic Lighting** | Custom fragment shaders with normal maps. | Radial gradients with `'lighter'` blend modes. | Multi-source lighting buffer with flicker and ambient occlusion. |
| **Gameplay Preservation** | High risk of breaking working combat, collision, and HUD. | Low risk; preserves existing architecture. | **Zero risk; 100% backwards compatible with existing code**. |

### 3.2 Formal Architectural Decision
**DECISION: Option C (Hybrid 2.5D Production Renderer).**  
Option C delivers the optimal balance of visual richness, high-throughput sprite batching, multi-layer depth sorting, native skeletal animation support, zero bundle bloat, zero native shell context loss, and 100% passing headless CI tests.

---

## 4. Phase 1.3 — Production Art Direction

### 4.1 Art Philosophy: "Vedic Temple Fantasy"
The visual language draws directly from classical Indian sacred temple architecture (Hoysala star-shaped sanctums, Belur and Halebidu soapstone filigree, Konark Sun Temple chariot wheels) illuminated by celestial cosmic energy.

### 4.2 Spatial & Geometric Standards
- **Projection Angle:** $30^\circ$ Top-Down Oblique (2.5D).
- **Ground Grid Unit:** $48\text{px}$ standard tile module.
- **Protagonist Scale:** Veer stands $64\text{px}$ tall (head-to-toe), $40\text{px}$ broad.
- **Architectural Scale:** Pillars stand $160\text{px}$ tall ($2.5\times$ hero height); Sun Altar spans $140\times 140\text{px}$ ($2.2\times$ hero width).
- **Visual Depth Hierarchy:**
  1. *Subterranean Void Backdrop:* Pitch indigo `#080C14` with cosmic nebula dust.
  2. *Floor Foundation:* Carved dark basalt pavers `#141C2E` with gold inlay accents.
  3. *Central Ceremonial Nave:* Luminous sunstone pathway engraved with Sanskrit mantras.
  4. *Ground Decals & Contact Shadows:* Elliptical soft shadows (`rgba(4, 6, 12, 0.65)`).
  5. *Architectural Columns & Altars:* Deep carved Hoysala granite pillars with brass braziers.
  6. *Dynamic Entities:* 21-bone Hero Veer, hovering Astra Shards, patrolling Asura Sentinels.
  7. *Particle & Combat VFX:* Celestial solar flares, Agni embers, Chakram weapon ribbons.
  8. *Atmospheric Lighting & Shafts:* Volumetric god rays filtering through temple skylights.
  9. *Screen-Space UI & HUD:* Framed golden vital gauges, quest cards, and minimap.

### 4.3 Color Palette & Light Script
- **Sanctum Granite (Base):** `#1E2638` (Deep temple basalt), `#2D3748` (Carved stone trim).
- **Surya Gold (Sacred Core):** `#FFB703` (Sun Altar radiance), `#FFD166` (Celestial highlights), `#FFF3BF` (Light core).
- **Agni Amber (Fire & Energy):** `#FB8500` (Brazier fire, dash trail, sword sparks).
- **Prana Cyan (Astra Shards):** `#00E5FF` (Crystalline shard refraction, portal beams).
- **Tamas Crimson (Corruption):** `#EF476F` (Asura optic flare, sentinel corruption).
- **Ambient Darkness (Vignette):** `#050811` (Chamber periphery shadows).

---

## 5. Phase 1.4 — Real Asset Pipeline & Sprite Atlas System

### 5.1 Metadata Schema & Architecture
Every game asset is registered in an authoritative manifest with:
- `id`: Unique constant identifier (e.g. `SPRITE_SANCTUM_PILLAR`).
- `src`: Path to web-optimized asset.
- `width` & `height`: Canonical pixel dimensions.
- `pivotX` & `pivotY`: Normalized anchor points ($0.5, 0.9$ for upright actors and pillars; $0.5, 0.5$ for altars and shards).
- `category`: `environment`, `prop`, `actor`, `vfx`, or `ui`.
- `checksum`: Cryptographic verification hash.
- `provenance`: Historical authoring and licensing record.

### 5.2 Separation of UI Portraits and World Assets
Character portraits (e.g. Devi Tara's circular ornate portrait) are strictly separated from world-space animation assets. Dialogue systems reference portrait atlases, while gameplay entities reference skeletal rigs and directional sprite sheets.

---

## 6. Phase 1.5 — Sanctum Reconstruction Blueprint

```
+===================================================================================+
| SANCTUM OF ASTRA RECONSTRUCTED FLOOR PLAN (1200 x 1000 px)                       |
|                                                                                   |
|                      [ NORTH TORANA PORTAL GATEWAY ]                              |
|                       (y = -460, w = 220, h = 180)                                |
|                                   │                                               |
|                    ┌──────────────┴──────────────┐                                |
|                    │  SACRED SURYA-PEETHAM ALTAR │                                |
|                    │    (y = -180, w = 140x140)   │                                |
|                    └──────────────┬──────────────┘                                |
|                                   │                                               |
|       [ PILLAR NORTH-WEST ]       │       [ PILLAR NORTH-EAST ]                   |
|       (-240, -120) with Brazier   │       (+240, -120) with Brazier               |
|                                   │                                               |
|                                   │                                               |
|  [ ASTRA SHARD 1 ]                │                [ ASTRA SHARD 2 ]              |
|  (-340, 160)                      │                (+340, 160)                    |
|                                   │                                               |
|       [ PILLAR SOUTH-WEST ]       │       [ PILLAR SOUTH-EAST ]                   |
|       (-240, 260) with Brazier    │       (+240, 260) with Brazier                |
|                                   │                                               |
|                                   │                                               |
|                               [ VEER ]                                            |
|                             SPAWN (0, 120)                                        |
|                                   │                                               |
|                            [ ASTRA SHARD 3 ]                                      |
|                                (0, 360)                                           |
|                                   │                                               |
|                  ===================================                              |
|                  SOUTH ENTRY VESTIBULE & SUNKEN STEPS                             |
|                  ===================================                              |
+===================================================================================+
```

### Key Architectural Features Reconstructed:
1. **Perimeter Stone Walls:** Heavy carved relief walls with stepped bas-relief friezes, corner lotus stupas, and dark granite coping replacing the wireframe stroke boundary.
2. **Sculpted Temple Pavers:** Hexagonal and rectangular granite pavers with subtle beveling, natural stone grain, and golden mortar veins.
3. **Walkable Ceremonial Nave:** A 160px wide central stone avenue adorned with glowing Brahmic solar symbols leading directly from the south entrance to the Sun Altar.
4. **Four Monumental Hoysala Pillars:** Multi-tiered granite columns with carved dancer capitals, brass hanging braziers, and dynamic flame flickers.
5. **The Altar of Surya:** Reconstructed with an octagonal stepped dais, layered lotus petals, inlaid sunstone disc, and concentric rotating mandalas.
6. **Celestial Astra Shards:** Faceted crystal prisms hovering with sinusoidal levitation, stardust motes, and prismatic refraction auras.
7. **Corrupted Asura Sentinels:** Mechanical basalt sentinels with menacing crimson optic cores, hovering hover-engines, and mechanical patrol paths.

---

## 7. Phase 1.6 — Lighting & Render Optimization

1. **Deterministic Layer Sorting:** 10 discrete Z-layers sorted by `sortY` to prevent sorting popping.
2. **Dynamic 2D Multi-Source Lighting:**
   - 4 pillar flame braziers ($R = 180\text{px}$, intensity $0.65$, warm amber).
   - Sun Altar central radiance ($R = 220\text{px} \to 340\text{px}$, golden yellow).
   - 3 Astra Shards ($R = 120\text{px}$, prana cyan).
   - 2 Corrupted Sentinels ($R = 100\text{px}$, crimson flare).
   - Player Veer Solar Aura ($R = 160\text{px}$, warm gold).
3. **Soft Ambient Occlusion:** Dark vignette gradients cast along the perimeter walls and column bases.
4. **Volumetric Light Shafts:** Celestial rays penetrating from the unroofed sanctum dome.
5. **Performance Budgets:** Total render pass under $4.5\text{ms}$ on desktop ($< 8.0\text{ms}$ on mobile).

---

## 8. Phase 1.7 — Validation & Certification Gates

1. **Artistic Cohesion:** Sanctum renders as one unified, illustrated world without rectangular clipping or visible asset bounds.
2. **Gameplay Integrity:** Player movement, collisions, Agni-Dash, Surya-Burst, shard collection, sentinel combat, altar consecration, victory state, and pause modals all function seamlessly.
3. **Zero Test Regressions:** 100% pass rate across all Vitest unit tests and Playwright E2E visual regression tests.
4. **Append-Only Governance:** All changes preserved in `TODO.md` and `CHANGELOG.md` passing `verify-append-only.js`.
