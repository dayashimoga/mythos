# Mythos: Astra & The Seven Realms — Art Direction & Visual Aesthetics
**Document Version:** 1.0.0-PROD  
**Classification:** Art Bible, Visual Design System & Shader/Aesthetic Specifications  
**Status:** Canonical & Baseline Frozen for Stage 0  

---

## 1. Core Visual Philosophy: "Sacred Solar Futurism"

The aesthetic direction of *Mythos: Astra* merges the monumental grandeur of ancient Indian rock-cut temple architecture (Ellora, Khajuraho, Konark Sun Temple) with radiant, high-energy cosmic mysticism. 

We avoid dreary, desaturated, or cliché generic fantasy tropes. Instead, every frame vibrates with **sacred luminescence, golden-ratio geometric balance, and vibrant harmonic colors**.

### 1.1 The Three Visual Pillars
1. **Sacred Geometry (Yantra & Mandala):**
   - Environmental floors, altars, spells, and UI frames are constructed using mathematical proportions derived from the *Sri Yantra* (interlocking isosceles triangles), the *Ashtakonam* (eight-pointed star), and expanding lotus petal flourishes.
2. **Dynamic Radiant Luminescence:**
   - Every divine artifact, weapon, and entity emits light that cuts through the mysterious, deep subterranean darkness. Light is treated not just as illumination, but as physical energy (*Tejas*).
3. **Sculptural Monumentality:**
   - Architecture feels carved from eons-old basalt, granite, and sandstone, adorned with polished brass and gold inlay that catches celestial reflections.

---

## 2. Master Color Palette & Design Tokens

```
========================================================================================
TOKEN NAME           HEX VALUE    CSS VARIABLE             SYMBOLIC MEANING / USAGE
========================================================================================
Cosmic Void          #080C14      --color-bg-deep          Subterranean base canvas & shadows
Abyssal Slate        #121824      --color-bg-surface       Dungeon tiles, stone walls
Astra Gold (Prime)   #FFB703      --color-solar-primary    Solar Core, Veer's blade, UI accent
Agni Flame           #FB8500      --color-solar-accent     Dash trails, fire bursts, heat
Surya Radiant        #FFD166      --color-solar-glow       Ambient light, particle highlights
Tara Azure           #00E5FF      --color-astral-cyan      Tara's astral projection, energy gauges
Prana Jade           #06D6A0      --color-life-green       Health recovery, vitality orbs, grass
Tamas Obsidian       #1F1A24      --color-corruption-dark  Corrupted sentinel stone
Tamas Crimson        #EF476F      --color-corruption-glow  Corrupted core, damage indicators, threat
Sacred Ivory         #F8F9FA      --color-text-primary     Primary typography, high-contrast labels
Muted Sandstone      #A0AAB8      --color-text-secondary   Secondary captions, lore inscriptions
========================================================================================
```

---

## 3. Visual Layer Hierarchy & Z-Ordering

To maintain crisp visual clarity during intense combat and exploration, the rendering pipeline adheres to a strict 6-layer compositing stack:

```
[Layer 5: UI & HUD System]       -> Z-Index: 1000 | Health, Energy, Dialogue, Diagnostics
[Layer 4: Foreground Lighting]   -> Z-Index: 500  | Ambient darkness mask, light shafts, vignette
[Layer 3: Dynamic Particles]     -> Z-Index: 300  | Agni-dash trails, sparks, blast ripples, motes
[Layer 2: Dynamic Entities]      -> Z-Index: 200  | Player (Veer), Sentinels, Projectiles, Shards (Y-sorted)
[Layer 1: Interactive Props]     -> Z-Index: 100  | Sun Altar, energy conduits, stone pillars
[Layer 0: Floor Canvas]          -> Z-Index: 0    | Basalt floor tiles, carved Yantra mandalas
```

---

## 4. Entity Aesthetic Specifications

### 4.1 Veer (The Solar Guardian)
- **Base Dimensions:** $36 \times 44\text{ px}$ collision box with an extended visual aura ($64 \times 64\text{ px}$).
- **Silhouette:** Bold, heroic shoulders crowned with a flowing saffron scarf that arcs dynamically opposite the movement vector.
- **Coloration:** Bronze cuirass (`#FFB703`), obsidian under-armor (`#121824`), and blazing amber sword glow (`#FB8500`).
- **Animation States:**
  - *Idle:* Sinusoidal breathing scale ($1.00 \to 1.04$), gentle sword hum.
  - *Run:* 8-frame walk cycle with footstep dust sparks.
  - *Dash:* High-velocity elongation ($1.4 \times$ X-stretch) with 5 trailing ghost sprites decaying over 250ms.
  - *Attack:* Sweeping circular arc flash rendering an expanding solar crescent.

### 4.2 The Astra Shards
- **Silhouette:** Octahedral celestial crystal hovering $10\text{ px}$ above the ground.
- **Visual FX:** 
  - Vertical sinusoidal bobbing: $y(t) = y_0 + \sin(4t) \times 6\text{ px}$.
  - Concentric pulsing halo with radius alternating between $16\text{ px}$ and $26\text{ px}$.
  - Emits 2-3 stardust motes per second that drift upward and fade.

### 4.3 The Altar of Surya
- **Structure:** A triple-ringed monumental dais of dark basalt inlaid with gold glyphs ($120 \times 120\text{ px}$).
- **State Progression:**
  - *Dormant (0 Shards):* Inscribed rings are dark; center gem is dim amber.
  - *Attuning (1-2 Shards):* Inner ring begins slow clockwise rotation ($0.5\text{ rad/s}$); gentle ambient hum.
  - *Consecrated (3 Shards):* All three concentric rings counter-rotate at high velocity; an expansive 16-petal lotus mandala blooms in blinding golden light; vertical celestial beam pierces the ceiling.

---

## 5. Screen Shake, Camera & Juice Architecture

A game feels alive through microscopic tactile feedback ("game juice"):
1. **Screen Shake Model:**
   - Driven by decaying harmonic oscillation:
     $$\Delta x(t) = A \cdot e^{-\lambda t} \cdot \sin(\omega t + \phi)$$
   - Shake triggers:
     - Player Dash: $A = 2.0\text{ px}$, duration $= 120\text{ ms}$.
     - Surya-Burst Fire: $A = 3.5\text{ px}$, duration $= 180\text{ ms}$.
     - Sentinel Defeat: $A = 6.0\text{ px}$, duration $= 300\text{ ms}$.
     - Altar Activation: $A = 10.0\text{ px}$, duration $= 800\text{ ms}$.
2. **Camera Lerp Follow:**
   - Smooth viewport following using exponential smoothing:
     $$\mathbf{C}_{\text{new}} = \mathbf{C}_{\text{current}} + (\mathbf{P}_{\text{target}} - \mathbf{C}_{\text{current}}) \cdot (1 - e^{-\text{speed} \cdot \Delta t})$$
   - Viewport clamping prevents camera from panning into the unrendered void beyond chamber walls.

---

## 6. Procedural Sacred Geometry Shaders & Canvas Algorithms

To guarantee ultra-fast initial load times without waiting for multi-megabyte image downloads, all core decorative environmental mandalas, altars, and elemental effects are rendered procedurally using deterministic mathematical algorithms:
- **Mandala Flower Generator:** Parametric polar curve equation $r(\theta) = R_0 + A \cdot \cos(k \theta)$.
- **Sri Yantra Interlocking Triangles:** Centered geometric matrix with alternating up/down apexes.
- **Energy Conduits:** Pulsing linear bezier curves connecting the altar to perimeter pillars.

---

## 7. Stage 3D-0 3D Spatial Art Direction & Environmental Staging

### 7.1 Real Perspective Spatial Hierarchy
Transitioning from 2D isometric/oblique projection to authentic 3D spatial perspective:
- **Verticality & Monumentality:** Elevated sanctum platforms ($+2.4\text{m}$) and flights of real physical stone steps create a commanding sense of scale. Characters physically look up towards shrines and monuments.
- **Silhouette Readability:** High-contrast color values (dark basalt paver floors `#1E2430`, golden Surya medallions `#FFB703`, and bright cyan Astra crystal emissions `#00E5FF`) ensure instant gameplay readability from any camera orbit angle.
- **Lighting & Shadow Composition:** Directional sunlight with soft cascaded shadow mapping projects dramatic angular shadows across steps and platforms, communicating height and depth to the player.

### 7.2 3D Material System (`StandardMaterial3D`)
- **Basalt Flagstone:** Low metallic ($0.0$), high roughness ($0.8$), subtle dark blue-gray albedo.
- **Temple Gold Trim:** High metallic ($0.85$), low roughness ($0.25$), emissive bloom multiplier $1.2-1.5$.
- **Astra Crystals:** Translucent refractive cyan surface with high emission energy ($2.0-2.5$) and rim lighting ($0.8$).
- **Hero Cuirass & Khadga:** Deep bronze metallic cuirass accented by radiant golden sun scimitar blade.

---

## 8. Stage Q0 Seven-Realm Visual Quality Baseline & Asset Classification

### 8.1 Hero Character Specification (Veer)
- **Geometry & Mesh Density:** 3,806 vertices, 6,068 triangles, 8 PBR material assignments (`mat_skin`, `mat_dhoti`, `mat_armor`, `mat_sash`, `mat_bracers`, `mat_boots`, `mat_blade`, `mat_hair`).
- **Anatomy & Topology:** Continuous anatomical limbs featuring contoured upper arms, elbows, forearms (`forearm_l/r`), wrists, thighs, knees, and calf shins (`shin_l/r`).
- **Skeletal Rigging:** 24-bone humanoid skeleton with dedicated `socket_right_hand` bone for stable weapon attachment.
- **Warrior Posture:** Default rest pose calibrated with $68^\circ$ shoulder roll and $12^\circ$ elbow flexion, avoiding immersion-breaking horizontal T-poses during locomotion.

### 8.2 Seven-Realm Visual Palettes & Atmospheric Signatures
| Realm | Dominant Palette | Ambient Lighting | Signature Visual Elements |
| :--- | :--- | :--- | :--- |
| **Bhumi Valley** | Forest Green `#2E7D32`, Basalt `#1E2430`, Gold `#FFB703` | Warm daylight, directional sun cascades | Terraced valley, Hoysala pillars, stone Sun Altar |
| **Antariksha Sky** | Sky Blue `#0288D1`, Cloud White `#FFFFFF`, Cyan `#00E5FF` | High-altitude atmospheric haze, bright sunlight | Floating cloud archipelagos, prana gliders, thermal updrafts |
| **Patala Underworld** | Toxic Emerald `#00E676`, Violet `#7B1FA2`, Deep Obsidian `#121212` | Subterranean bioluminescence, glowing river glow | Venom rivers, bouncy fungal springboards, serpent totems |
| **Svar Solar Citadel** | Radiant Gold `#FFD700`, Solar Amber `#FF6F00`, White Marble `#F5F5F5` | Intense solar flares, celestial god-rays | Floating light bridges, rotating Surya prisms, crystal spires |
| **Maharloka Sanctuary** | Astral Indigo `#1A237E`, Cyan `#00E5FF`, Parchment Ivory `#FFF8E1` | Twilight cosmic glow, glyph scintillation | Levitating Sanskrit runes, ancient scripture pedestals |
| **Tapoloka Forge** | Incandescent Magma `#FF3D00`, Volcanic Ash `#212121`, Fiery Crimson `#D50000` | Volcanic underlighting, floating ember sparks | Magma geysers, primordial anvils, smoking fissures |
| **Satyaloka Apex** | Transcendent Pearl `#FFFFFF`, Prismatic Gold `#FFD700`, Lotus Rose `#FF80AB` | Pure celestial radiance, cosmic wheel aura | Dharmachakra resonators, crystalline light bridges, lotus daises |

### 8.3 Asset Classification & Fidelity Audit (Procedural Primitives vs Production Models)
A critical finding of the Stage Q0 audit is the forensic classification of non-player assets:
- **Veer Hero:** Continuous skinned humanoid mesh (Production Ready Baseline).
- **All Enemies (14 types):** Asuras, Gale Falcons, Wind Archers, Naga Spitters, Naga Constrictors, Surya Guardians, Solar Gryphons, Astral Rishis, Scripture Golems, Agni Berserkers, Tapas Hounds, Moksha Seraphs, Dharma Sentinels are **procedural unskinned assemblies of primitive boxes, cylinders, and spheres** generated by Python scripts.
- **All Bosses (7 entities):** Kalanemi, Matarishvan, Shesha Echo, Surya Avatara, Sage Brihaspati, Agni Rudra, Brahma Avatara are **procedural primitive hierarchical assemblies**.
- **Certification Gate:** In accordance with Stage Q0 audit guidelines, these primitive assets are strictly certified as *Functional Gameplay Prototypes* and remain explicitly **INCOMPLETE** pending Stage Q1 high-fidelity modeling and texturing.

