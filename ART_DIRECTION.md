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

---

## 9. Stage Q1 Production-Grade 3D Veer Character Reconstruction Specification

### 9.1 Character Art Direction & Design Pillars
The Stage Q1 reconstruction replaces the legacy procedural mannequin with an authentic, anatomically believable Vedic warrior hero adhering to the following design specifications:
- **Heroic Stature:** 1.85m height, athletic warrior build with broad heroic shoulders and dynamic V-taper.
- **Anatomical Topology:** Full organic quad topology derived from the official Blender Studio CC0 production mesh (`GEO-body_male_realistic`), featuring articulated neck, jawline, ears, nose, lips, eye sockets, individually modeled 5 fingers per hand (including knuckle creases and fingernail beds), and 5 toes per foot.
- **Crown & Coiffure (*Shikha*):** High warrior topknot bun on the skull crown bound by a polished 24k gold *keshbandha* ring, flanked by flowing dark warrior locks framing the temples and nape of neck.
- **Sacred Facial Adornments:** 3D sculpted three-stripe sandalwood *Tripundra* across the brow with a sacred crimson *Kumkum* bindu at the third-eye center, complemented by luminous amber *Surya Netra* eyes.
- **Vedic Garments (*Dhoti & Kashta*):** Rich saffron orange silk *dhoti* pleated around the hips and thighs tapering to mid-calf, anchored by a central folded *kashta* panel with golden *zari* brocade embroidery along the hem.
- **Girdle (*Kamarband*):** Wide 24k gold waist girdle featuring an embossed 12-petal Surya lotus medallion buckle and dangling hip sash tassels.
- **Adornments & Armor (*Kavacha & Pada-rakshaka*):**
  - Upper chest: 12-pointed golden Surya medallion pendant on twin gold chains.
  - Biceps: Golden *bajuband* armlets with solar crests.
  - Forearms: Ergonomic antique bronze *kavacha* bracers with beveled flanges and relief flame motifs.
  - Shins: Antique bronze *pada-rakshaka* greaves guarding anterior shins from ankle to knee with flared knee guards, paired with warrior *paduka* sandals.
- **Celestial Sash (*Uttariya*):** Draped celestial azure silk stole draped over the left shoulder, sweeping diagonally across the torso and trailing in dynamic ribbon tails.
- **Celestial Weapon (*Surya-Kripana*):** Curved single-edged Damascus sunsteel scimitar featuring an 8-pointed golden sunburst quillon guard disc, wire-wrapped hilt, faceted teardrop ruby pommel, and fuller channel with radiant solar rune emissions.

### 9.2 Technical Mesh & Geometry Metrics
| Metric | Specification | Actual Delivery |
| :--- | :--- | :--- |
| **Source Editable File** | Blender 4.2 LTS (`.blend`) | `godot/assets/characters/veer/veer_production.blend` |
| **Binary Game Asset** | glTF 2.0 Binary (`.glb`) | `godot/assets/characters/veer/veer.glb` (2.78 MB) |
| **Unified Source Vertices** | > 10,000 quad-based | 13,690 vertices across 8 tailored components |
| **Engine Compiled Vertices** | Complete multi-surface split | 22,147 vertices, 26,594 triangles |
| **PBR Material Slots** | Exactly 7 standard slots | `Mat_Veer_Skin`, `Mat_Veer_Cuirass`, `Mat_Veer_Gold`, `Mat_Veer_Dhoti`, `Mat_Veer_Sash`, `Mat_Veer_Khadga`, `Mat_Veer_Hair` |
| **UV Layout** | Non-overlapping Smart UVs | 100% unwrapped to `UVMap` across all components |

### 9.3 PBR Material & Texture Pipeline
High-resolution 1024×1024 PBR textures generated via Pillow and NumPy:
- `skin_albedo.png`, `skin_normal.png`, `skin_mr.png`: Warm bronze tone, dermal pore noise, roughness 0.52.
- `armor_albedo.png`, `armor_normal.png`, `armor_mr.png`: Antique bronze, flame reliefs, metallic 0.85, roughness 0.35.
- `gold_albedo.png`, `gold_normal.png`, `gold_mr.png`: 24k polished gold, lotus motifs, metallic 0.95, roughness 0.20.
- `dhoti_albedo.png`, `dhoti_normal.png`, `dhoti_mr.png`: Saffron orange silk with golden zari brocade, roughness 0.65.
- `sash_albedo.png`, `sash_normal.png`, `sash_mr.png`, `sash_emissive.png`: Celestial azure silk with cyan rune bloom.
- `khadga_albedo.png`, `khadga_normal.png`, `khadga_mr.png`, `khadga_emissive.png`: Damascus wave steel, fuller rune emissive, metallic 0.98.
- `hair_albedo.png`, `hair_normal.png`, `hair_mr.png`: Lustrous black warrior locks with anisotropic highlights.

### 9.4 24-Bone Skeleton3D & Animation Rigging
- **Hierarchy:** `root` -> `pelvis` -> `spine_01` -> `chest` -> `neck` -> `head` -> `topknot`; `chest` -> `shoulder_l/r` -> `arm_l/r` -> `forearm_l/r` -> `hand_l/r` -> `socket_right_hand`; `pelvis` -> `thigh_l/r` -> `shin_l/r` -> `foot_l/r`; `pelvis` -> `sash_01` -> `sash_02`.
- **Skinning:** 3D heat diffusion weights computed on unified mesh in Rest Pose. Surya-Kripana locked rigidly to `socket_right_hand` (1.0) and `hand_r` (0.4) to eliminate weapon flexing.
- **Authored Animations (22 tracks in AnimationPlayer):** `idle` (2.4s), `walk` (1.0s), `run` (0.75s), `jog` (0.75s), `sprint` (0.55s), `turn` (0.6s), `jump` (0.75s), `jump_start` (0.3s), `fall` (0.6s), `jump_fall` (0.6s), `landing` (0.4s), `jump_land` (0.4s), `dodge` (0.65s), `block` (0.5s), `parry` (0.45s), `attack_light_1` (0.6s), `attack_light_2` (0.6s), `attack_heavy_finisher` (1.0s), `combo` (1.0s), `hit_reaction` (0.5s), `interact` (1.0s), `victory` (2.0s), `defeat` (1.8s).

---

## 10. Stage Q5-C Realm of Svar (Svarga) — Solar Citadels of Savitr Art Specification

### 10.1 Environmental Architecture & Visual Identity
The Celestial Solar Citadel of Svar is envisioned as a luminous floating acropolis high above the mortal sphere, bathed in perpetual solar radiance (*Tejas*):
- **Celestial White Marble & 24k Gold Filigree:** Monumental terraced bastions (`svar_entry_bastion.glb`, `svar_mid_bastion.glb`, `svar_apex_citadel.glb`, `svar_sanctum_bastion.glb`) constructed from polished crystalline white marble inlaid with intricate 24k gold sunburst mandalas and geometric balustrades.
- **Pulsing Solar Light Bridges:** Dynamic traversal pathways (`solar_light_bridge.glb`) composed of translucent amber crystal tiles that materialize beneath the player with glowing solar treads.
- **Surya Prisms & Light Rays:** Optical puzzle conduits (`solar_prism_pillar.glb`) featuring hovering faceted octahedral prisms that rotate to focus golden laser beams and complete circuit mechanisms.
- **Surya Mahapeetham Altar:** Consecration pedestal (`surya_mahapeetham_pedestal.glb`) featuring a 12-petaled solar lotus dais with a hovering blinding Savitr solar core and concentric rotating gold rings.
- **Atmospheric Palette:** Warm amber and golden yellow volumetric daylight, sun shafts, gold particle motes, and distant golden mountain citadels against an azure sky.

### 10.2 Combat Actors & Rigging
1. **Boss Surya Avatara (`boss_surya_avatara.glb`):**
   - Monumental 3.8m Solar Deity with 4 muscular arms, radiant spiked solar halo crown, gold cuirass, and dual monumental Sun-Gada war hammers.
   - 26-bone hierarchical skeleton with upper and lower dual arm chains (`arm_u_l/r`, `arm_l_l/r`).
   - 10 authored skeletal actions: `boss_idle`, `boss_walk`, `boss_cleave_telegraph`, `boss_cleave_attack`, `boss_solar_flare_channel`, `boss_supernova_leap`, `boss_supernova_impact`, `boss_charge`, `boss_roar_enrage`, `boss_defeat`.
2. **Surya Guardian (`surya_guardian.glb`):**
   - 2.1m solar phalanx sentinel armored in gold and white sunsteel, wielding an ornamental Sun-Spear and a massive Radiant Tower Shield with sunburst crest.
   - 22-bone skeleton rig with 6 authored actions: `idle`, `walk`, `telegraph`, `thrust_attack`, `shield_block`, `death`.
3. **Solar Gryphon (`solar_gryphon.glb`):**
   - 2.6m wingspan celestial raptor beast with shimmering golden plumage, eagle head with crown crest, feline hindquarters, and curved beak.
   - 20-bone skeleton with multi-segment wing articulators and 6 authored actions: `idle`, `fly_locomotion`, `telegraph_screech`, `dive_strike`, `stagger`, `death`.



