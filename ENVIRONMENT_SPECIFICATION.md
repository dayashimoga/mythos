# Mythos: Astra & The Seven Realms — Environment & World Specification
**Document Version:** 1.0.0-PROD  
**Classification:** World Architecture, Environment Design System & Spatial Specifications  
**Author:** Principal World Builder, Environment Artist, Graphics Engineer & Rendering Architect  
**Status:** Authoritative Baseline for Stage 3

---

## 1. World Overview & Spatial Design Philosophy

*Mythos: Astra* presents an expansive, contiguous 2D mythological world blending ancient Vedic monumental architecture with untamed primeval nature and cosmic luminescence. 

The environment is designed to deliver:
1. **Sacred Architectural Monumentality:** Granite stepped ghats, tiered *Vimana* and *Shikhara* spires, carved *Torana* archways, and colossal *Ashoka* prayer pillars.
2. **Organic Natural Scenery:** Sprawling *Banyan* (*Vata*) trees with winding aerial root collisions, swaying bamboo groves, blooming *Padma* (lotus) ponds, and golden-grass meadows.
3. **Atmospheric Immersion:** Real-time multi-source 2D lighting with point-light falloff, dynamic brazier fire flicker, day-night cycles, planar water reflections, crepuscular god rays, and monsoon mist.
4. **Collision Correctness & Flawless Navigation:** Distinct collision layers separating walkable roads, rough terrain, water basins, deep chasms, and solid monolithic obstacles, paired with an A* waypoint NavMesh.

---

## 2. World Coordinate System & Macro Region Layout

The delivered world region represents **The Sunken Citadel of Surya-Kund & Dandaka Valley** situated in the mortal realm of **Bhumi (Bhur)**, spanning a coordinate space of **$4000 \times 3200\text{ world units}$** ($X \in [-2000, 2000]$, $Y \in [-1600, 1600]$):

```
+===================================================================================================+
|                                    WORLD MAP & REGION LAYOUT                                      |
|                                    4000 x 3200 World Coordinates                                  |
+===================================================================================================+
|                                  [NORTH: PARALLAX HORIZON]                                        |
|                       Distant Mount Meru Peaks & Floating Vayu Citadels                           |
|---------------------------------------------------------------------------------------------------|
|                                 |                                 |                               |
|        ZONE 1: DANDAKA          |      ZONE 2: GRAND VEDIC        |     ZONE 3: SUNKEN CITADEL    |
|         SACRED FOREST           |           CAUSEWAY              |       & SURYA SANCTUM         |
|   X: [-2000, -600]              |   X: [-600, 600]                |   X: [600, 2000]              |
|   Y: [-1200, 400]               |   Y: [-1200, 800]               |   Y: [-1200, 800]             |
|                                 |                                 |                               |
|   - Sprawling Banyan Trees      |   - Paved Granite Highway       |   - Tiered Temple Spire       |
|   - Winding Dirt Paths          |   - Monumental Torana Gate      |   - Colonnaded Mandapa Hall   |
|   - Moss-covered Shrines        |   - Dual Ashoka Pillars         |   - Sacred Kalyani Bath Basin |
|   - Lotus Stream Crossing       |   - Roadside Stone Urns         |   - Blazing Surya Altar Dais  |
|   - Floating Pollen/Fireflies   |   - Prayer Wheel Shrines        |   - Stepped Water Ghats       |
|                                 |                                 |                               |
+---------------------------------+---------------------------------+-------------------------------+
|                                 ZONE 4: PATALA BASALT CHASM                                       |
|                                 X: [-1600, 1600], Y: [800, 1600]                                  |
|                                                                                                   |
|   - Deep Fractured Basalt Ravine & Magma Fissures                                                 |
|   - Ancient Wooden Suspension Bridge Crossing                                                     |
|   - Volcanic Smoke Vents & Drifting Embers                                                        |
|   - Glowing Red Tamasic Crystals                                                                  |
+===================================================================================================+
```

---

## 3. Five Distinct Environmental Zones

### Zone 1: The Sacred Forest of Dandaka (Verdant West)
- **Bounds:** $X \in [-2000, -600], Y \in [-1200, 400]$
- **Visual Character:** Deep emerald and moss-green forest floor dotted with wildflowers, twisted Banyan roots breaking through the soil, bamboo clusters, and warm golden light shafts piercing the dense canopy.
- **Key Landmarks:**
  - *The Elder Banyan of Dandaka:* A colossal ancient tree ($320\text{ px}$ span) with solid trunk colliders and multi-lobed swaying leaf canopy.
  - *The Shunya Shrine:* A tranquil mossy stone pavilion containing an interactive prayer bell.
  - *Saraswati Stream:* A crystal-clear shallow brook traversed via polished stepping stones.
- **Traversable Surface:** Natural dirt road (cost 1.1), tall grass meadow (cost 1.4), shallow stream (cost 1.8).

### Zone 2: The Grand Vedic Causeway (Central Axis)
- **Bounds:** $X \in [-600, 600], Y \in [-1200, 800]$
- **Visual Character:** Polished gray basalt and sandstone flagstone road adorned with concentric *Yantra* medallions, ceremonial road lanterns, and Ashoka stone pillars.
- **Key Landmarks:**
  - *The Torana of the Dawn:* A 3-tiered monumental ceremonial archway spanning the central road with carved lion capitals.
  - *The Twin Ashoka Sthambhas:* Monolithic sandstone columns engraved with ancient Brahmic script.
  - *Prayer Wheel Pavilion:* Four rotating brass prayer wheels that spin and emit chiming resonances upon interaction.
- **Traversable Surface:** Paved stone flagstones (cost 1.0 — fastest player movement speed).

### Zone 3: The Sunken Citadel & Kalyani Ghats (Monumental East)
- **Bounds:** $X \in [600, 2000], Y \in [-1200, 800]$
- **Visual Character:** Multi-tiered stepped temple architecture inspired by Khajuraho and Konark, featuring warm ochre sandstone, dark basalt trim, and radiant gold trim.
- **Key Landmarks:**
  - *Surya Maha-Mandapa:* Massive colonnaded open-air hall with 8 carved pillars and central blazing brass braziers.
  - *The Great Kalyani (Sacred Stepped Reservoir):* Concentric stepped granite pool filled with turquoise water displaying real-time planar reflections of surrounding structures.
  - *The High Shikhara Sanctum:* The primary temple spire towering toward the sky, flanked by golden finials (*Kalashas*).
- **Traversable Surface:** Polished marble and granite steps (cost 1.0), colonnade aisles (cost 1.0).

### Zone 4: The Patala Basalt Chasm (Subterranean South)
- **Bounds:** $X \in [-1600, 1600], Y \in [800, 1600]$
- **Visual Character:** Menacing volcanic chasm of jagged black basalt, steaming fissures glowing with orange lava, and eerie purple/crimson corruption crystal outcrops.
- **Key Landmarks:**
  - *The Suspension Bridge of Rama:* A precarious wooden plank bridge suspended over the abyss with thick hemp rope railings.
  - *Magma Geyser Vents:* Active thermal vents periodically emitting smoke puffs and glowing ember particles.
  - *Tamasic Fissure Crystals:* Jagged obsidian cluster formations that pulse with deep violet luminescence.
- **Traversable Surface:** Wooden plank bridge (cost 1.05), basalt ledge trail (cost 1.2). Chasm abyss is strictly non-traversable (`IMPASSABLE` collision layer).

### Zone 5: Distant Scenery & Parallax Horizons (Far / Mid Background)
- **Layer 0 (Skybox & Celestial Dome):** Procedural sky gradient varying from soft rose dawn to blazing gold midday, crimson dusk, starry indigo night, and cosmic eclipse. Features the glowing Surya disc or crescent moon.
- **Layer 1 (Far Mountain Horizon - Parallax 0.08x):** Silhouettes of Mount Meru snow-capped peaks piercing the upper cloud deck.
- **Layer 2 (Mid-Distance Sky Citadels - Parallax 0.20x):** Floating celestial sky spires (*Vimanas*) tethered with silk prayer ribbons drifting across the horizon.
- **Layer 3 (Atmospheric Mist & Clouds - Parallax 0.35x):** Drifting volumetric cloud banks driven by ambient wind velocity.

---

## 4. Time-of-Day & Atmospheric Lighting Matrix

The lighting engine calculates ambient intensity and directional color across 5 canonical time presets:

```
+========================================================================================================+
| TIME PRESET     | AMBIENT COLOR | AMBIENT LIGHT | SUN/SKY COLOR  | SHADOW ANGLE | ATMOSPHERE           |
+========================================================================================================+
| 1. DAWN (Usha)  | #1A1226       | 0.40          | #FFAA55 (Rose) | 65 deg       | Gentle valley mist,  |
|                 |               |               |                |              | cool dew motes       |
+-----------------+---------------+---------------+----------------+--------------+----------------------+
| 2. NOON (Surya) | #182238       | 0.85          | #FFFDF0 (Gold) | 90 deg (top) | High clarity, sharp  |
|                 |               |               |                |              | god rays, heat haze  |
+-----------------+---------------+---------------+----------------+--------------+----------------------+
| 3. SUNSET       | #260C1A       | 0.50          | #FF5533 (Amber)| 120 deg      | Long golden shadows, |
|    (Sandhya)    |               |               |                |              | glowing braziers     |
+-----------------+---------------+---------------+----------------+--------------+----------------------+
| 4. NIGHT        | #060914       | 0.15          | #4466AA (Moon) | None (radial)| High contrast point  |
|    (Ratri)      |               |               |                |              | lights, fireflies    |
+-----------------+---------------+---------------+----------------+--------------+----------------------+
| 5. ECLIPSE      | #12030A       | 0.22          | #EF476F (Blood)| 45 deg       | Violet aura, cosmic  |
|    (Grahana)    |               |               |                |              | drifting embers      |
+========================================================================================================+
```

---

## 5. Collision Layer Architecture & Physical Materials

To prevent clipping through architecture or trees, collisions are segregated into discrete physical categories:

```
+===================================================================================================+
| LAYER NAME       | MASK BIT | DESCRIPTION                      | REACTION                         |
+===================================================================================================+
| TERRAIN_SOLID    | 0x0001   | Stone walls, pillars, tree       | Hard separation, zero penetration|
|                  |          | trunks, bridge railings, cliffs  |                                  |
+------------------+----------+----------------------------------+----------------------------------+
| CHASM_ABYSS      | 0x0002   | Bottomless chasm drops           | Hard boundary clamping, blocks   |
|                  |          |                                  | ground navigation                |
+------------------+----------+----------------------------------+----------------------------------+
| HAZARD_LAVA      | 0x0004   | Volcanic magma fissures          | Deals 15 heat damage/sec, plays  |
|                  |          |                                  | sizzle FX, repels character      |
+------------------+----------+----------------------------------+----------------------------------+
| WATER_SHALLOW    | 0x0008   | Kalyani basin, Saraswati stream  | Slows movement (speed x 0.7),    |
|                  |          |                                  | spawns footstep splash rings     |
+------------------+----------+----------------------------------+----------------------------------+
| INTERACTIVE_PROP | 0x0010   | Braziers, prayer wheels, shrines | Triggers prompt [F], ignites     |
|                  |          |                                  | flame, plays audio chime         |
+------------------+----------+----------------------------------+----------------------------------+
| TRIGGER_ZONE     | 0x0020   | Landmark discovery trigger,      | Displays area title banner,      |
|                  |          | zone transition boundary         | updates background audio theme   |
+===================================================================================================+
```

---

## 6. Navigation Mesh & Pathfinding Standards

- **Grid Resolution:** $40\text{ px} \times 40\text{ px}$ cell size yielding a $100 \times 80$ navigation grid across the $4000 \times 3200$ world space.
- **Cell Classification:**
  - `0`: Blocked (Solid obstacle, tree trunk, wall, abyss).
  - `1`: Paved Highway / Bridge (Cost: $1.0$).
  - `2`: Packed Dirt Path (Cost: $1.1$).
  - `3`: Forest Meadow / Grass (Cost: $1.4$).
  - `4`: Shallow Water / Stream (Cost: $2.0$).
- **A\* Pathfinding Heuristic:** Euclidean distance with diagonal movement smoothing and dynamic shortcutting.
- **Coverage Acceptance Criteria:** 100% of defined landmarks must have at least one validated contiguous path to all other landmarks.

---

## 7. Performance & Resource Budgets

```
+=============================================================================================+
| METRIC                       | BUDGET TARGET          | VERIFICATION METHOD                 |
+=============================================================================================+
| Target Framerate             | 60 FPS (<=16.6 ms)     | Diagnostics overlay / browser test  |
| Frustum Culling Ratio        | >= 70% of world culled | ChunkManager culling counter        |
| Active Rendered Chunks       | <= 6 of 48 total       | ChunkManager viewport query         |
| Active Point Lights          | Up to 16 dynamic lights| LightingEngine radius culling       |
| Total Particle Count         | <= 800 pooled particles| ParticleSystem pre-allocation       |
| JS Heap Memory               | <= 35 MB total heap    | Chrome performance telemetry        |
| Asset Load Time              | Instant (< 150 ms)     | Procedural generation on worker/main|
+=============================================================================================+
```
