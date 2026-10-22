# Mythos: Astra & The Seven Realms — Character System Specification
**Document ID:** `SPEC-CHAR-002`  
**Version:** `1.0.0`  
**Status:** `Approved & Authoritative`  
**Classification:** `Character Art, Technical Animation, Rigging & Graphics Architecture`

---

## 1. Scope & Objective

This document establishes the authoritative technical and artistic specifications for all character models, skeletal rigs, inverse kinematics (IK) solvers, animation blend trees, facial systems, and runtime integration pipelines for *Mythos: Astra & The Seven Realms*.

All characters must adhere to:
1. **Visual Accuracy & Consistency:** Proportions, cultural authenticity (Vedic-cosmic mythology), anatomical fidelity, and expressive silhouette readability.
2. **Deterministic Skeletal Rigs:** Hierarchical bone structures with transform propagation, zero bone distortion, and mathematical stability.
3. **Fluid Movement & Locomotion:** Natural weight transfer, zero foot sliding via normalized phase-matching and 2-bone analytical IK ground planting.
4. **Art-Direction Integrity:** Consistent palettes, golden celestial accents, obsidian hair, layered silks, and cosmic particle emanation.
5. **Runtime Budget Compliance:** Maximum 24 bones per character, $< 0.15\text{ms}$ CPU animation evaluation per frame, and 60 FPS performance.

---

## 2. Character Roster & Dossiers

```
+---------------------------------------------------------------------------------------+
|                                CHARACTER ROSTER OVERVIEW                              |
+-------------------+-----------------+---------------+------------------+--------------+
| Character Name    | Archetype       | Proportions   | Primary Palette  | Rig Bone Ct  |
+-------------------+-----------------+---------------+------------------+--------------+
| Veer              | Solar Guardian  | 8.0 Heads     | Gold / Crimson   | 18 Bones     |
| Devi Tara         | Astral Goddess  | 8.5 Heads     | Indigo / Silver  | 20 Bones     |
| Stone Rakshasa    | Heavy Brute     | 6.0 Heads     | Basalt / Crimson | 15 Bones     |
| Vanara Void-Scout | Agile Stalker   | 6.5 Heads     | Shadow Violet    | 16 Bones     |
| Enemy Sentinel    | Drone Sentinel  | 4.0 Heads     | Brass / Amber    | 8 Bones      |
+-------------------+-----------------+---------------+------------------+--------------+
```

---

### 2.1 Solar Guardian Veer (Hero Protagonist)

- **Role:** Champion of Surya-Kund, Avatar of Solar Will.
- **Personality:** Resolute, disciplined, calm under pressure, fierce in defense of Dharma.
- **Anatomy & Proportions:**
  - Stature: $1.85\text{m}$, 8.0-head athletic heroic build.
  - Broad shoulders, athletic taper, muscular forearms and calves.
- **Facial Structure & Features:**
  - Chiseled Vedic jawline, straight nose bridge, strong brow.
  - **Eyes:** Amber gold (`#FB8500`) with glowing iris ring.
  - **Forehead:** Golden Tripundra solar mark (`#FFD166`) pulsing with Prana.
  - **Hair:** Lustrous jet-black hair tied into an ancient warrior's *shikha* (topknot) bound with an engraved golden ring (`#FFB703`).
  - **Skin Tone:** Sun-bronzed radiant terracotta (`#DDA15E` base, `#BC6C25` shadow).
- **Attire & Accessories:**
  - **Dhoti:** Pleated vermilion silk dhoti (`#9B2226`) with gold geometric Vedic embroidery along the hem.
  - **Armor:** Surya chest medallion and right-shoulder sun-disk pauldron (`#FFB703` brass/gold).
  - **Vambraces:** Reinforced leather and polished bronze forearm guards.
  - **Footwear:** Traditional bound arch wraps leaving soles exposed to channel Agni through the earth.
- **Equipment & Weapon Sockets:**
  - `socket_right_hand`: *Surya-Kripana* (sacred curved sun blade with solar flare particle emitter).
  - `socket_forehead`: Golden Tripundra solar focus.
  - `socket_chest`: Sun Medallion.
- **Animation Suite:**
  - `idle`: Breathing cycle (2.4s loop), subtle weight shift, cloth sway.
  - `walk`: Confident ground-gripping stride (1.0s loop), alternating arm counter-swing.
  - `run`: Dynamic forward-leaning sprint (0.7s loop), powerful knee drive, foot dust emission.
  - `dash`: Compressed silhouette leap, horizontal trajectory with Agni trail.
  - `melee_slash`: 3-phase anticipation, $135^\circ$ fluid crescent sweep, crisp follow-through.
  - `ranged_burst`: Drawing weapon back, channeling solar energy, forward release with snappy recoil.
  - `hurt`: Torso flinch, head snapback, golden energy disperse.
  - `death`: Knees buckle, slow descent, Prana dissolution into sun motes.
  - `interact`: One-knee devotional kneel, right hand reaching out towards altars.

---

### 2.2 Devi Tara (Goddess of Astral Cosmos & Guide)

- **Role:** Divine Celestial Guide, Weaver of Stellar Constellations.
- **Personality:** Ancient, benevolent, serene, possessing cosmic wisdom.
- **Anatomy & Proportions:**
  - Stature: $1.78\text{m}$ (levitating $20\text{–}30\text{cm}$ above the floor), 8.5-head slender ethereal silhouette.
  - Elongated neck, graceful arms and mudra-shaped fingers.
- **Facial Structure & Features:**
  - Gentle almond-shaped eyes glowing with stellar nebulae (`#48CAE4`).
  - Luminous third-eye bindi shaped like an eight-pointed star (`#00E5FF`).
  - Pale starlight-tinted porcelain skin (`#E0F2FE`).
  - Radiant silver-lavender hair flowing freely with weightless cosmic buoyancy.
- **Attire & Accessories:**
  - Layered midnight-indigo silk angavastram (`#03045E` to `#4361EE` cosmic gradient) with embedded constellations.
  - Translucent astral starlight veil undulating with lunar harmonics.
  - Golden celestial bangles and floating sacred lotus ornaments.
- **Animation Suite:**
  - `float_idle`: Weightless vertical sinusoidal levitation ($A = 12\text{px}, T = 3.2\text{s}$), hair and veil soft secondary drift.
  - `blessing_mudra`: Raising right hand in Abhaya Mudra (gesture of fearlessness), radiating celestial aura.
  - `dialogue_talk`: Subtle head tilt, hand on heart, rhythmic viseme speech movements.
  - `astral_channel`: Raising both arms skyward, spinning celestial mandala above head.

---

### 2.3 Stone Rakshasa Enforcer (Heavy Armored Brute)

- **Role:** Ancient Corrupted Guardian of Subterranean Foundations.
- **Personality:** Brutal, relentless, slow but overwhelmingly powerful.
- **Anatomy & Proportions:**
  - Stature: $2.30\text{m}$, 6.0-head hulking muscular stone titan.
  - Massive basalt torso, shoulder blocks, short powerful digitigrade legs.
- **Facial Structure & Features:**
  - Jagged obsidian horns curling backward.
  - Single central cyclopean eye burning with crimson hate (`#EF476F`).
  - Volcanic cracks along chest and shoulders venting crimson embers.
- **Attire & Materials:**
  - Rough-hewn basalt stone plates bound by corroded iron rings.
- **Animation Suite:**
  - `heavy_walk`: Weighty thudding gait (1.4s loop), camera shake impulse on each step.
  - `slam_telegraph`: Raising stone clubs overhead, drawing seismic red glyphs on ground ($1.0\text{s}$ windup).
  - `slam_impact`: Downward crushing blow into ground, releasing expanding circular shockwave.
  - `flinch`: Heavy recoil, sparks erupting from stone plates.
  - `crumble_death`: Joints fracture, stone blocks collapse into rubble.

---

### 2.4 Vanara Void-Scout (Agile Aerial Skirmisher)

- **Role:** Shadow Skirmisher, Ranged Harasser.
- **Personality:** Feral, cunning, opportunistic, evasive.
- **Anatomy & Proportions:**
  - Stature: $1.45\text{m}$, 6.5-head lean simian silhouette.
  - Long nimble limbs, prehensile acrobatic tail for balance.
- **Facial Structure & Features:**
  - Dark shadow-violet fur (`#3A0CA3`), glowing cyan slit visor eyes (`#4CC9F0`).
- **Animation Suite:**
  - `orbit_skitter`: Lateral hovering skitter, tail undulating to counterbalance turns.
  - `telegraph_charge`: Contracting into a defensive ball while gathering void energy.
  - `shoot_needle`: Rapid extension and snappy needle release with visual kickback.
  - `deflected_stagger`: Tumbling backward when player deflects projectiles.
  - `vanish_death`: Implosion into a brief void vortex.

---

## 3. Skeletal Hierarchy & Rigging Architecture

### 3.1 Veer Skeleton (18 Bones)
```
root (0, 0)
└── pelvis (0, -28)
    ├── spine_01 (0, -42)
    │   └── spine_02 (0, -56)
    │       └── chest (0, -70)
    │           ├── neck (0, -78)
    │           │   └── head (0, -88) [socket_forehead]
    │           ├── shoulder_l (-14, -68)
    │           │   └── arm_l (-22, -66)
    │           │       └── forearm_l (-30, -64)
    │           │           └── hand_l (-36, -62) [socket_left_hand]
    │           └── shoulder_r (14, -68)
    │               └── arm_r (22, -66)
    │                   └── forearm_r (30, -64)
    │                       └── hand_r (36, -62) [socket_right_hand / Surya-Kripana]
    ├── thigh_l (-10, -24)
    │   └── shin_l (-10, -12)
    │       └── foot_l (-10, 0) [IK_Foot_L]
    └── thigh_r (10, -24)
        └── shin_r (10, -12)
            └── foot_r (10, 0) [IK_Foot_R]
```

### 3.2 Devi Tara Skeleton (20 Bones)
```
root (0, 0)
└── pelvis (0, -32) [Floating Root]
    ├── spine (0, -48)
    │   └── chest (0, -64)
    │       ├── neck (0, -74)
    │       │   └── head (0, -86) [socket_bindi]
    │       ├── shoulder_l (-12, -62)
    │       │   └── arm_l (-20, -60)
    │       │       └── forearm_l (-28, -58)
    │       │           └── hand_l (-34, -56) [Mudra]
    │       └── shoulder_r (12, -62)
    │           └── arm_r (20, -60)
    │               └── forearm_r (28, -58)
    │                   └── hand_r (34, -56) [Mudra]
    ├── dress_center (0, -16)
    │   └── dress_hem (0, 0)
    ├── veil_left (-18, -48)
    │   └── veil_tip_l (-24, -20)
    └── veil_right (18, -48)
        └── veil_tip_r (24, -20)
```

---

## 4. Inverse Kinematics (IK) & Blend Tree Architecture

### 4.1 Two-Bone Analytical IK Solver
For leg and arm chains ($L_1 = \text{thigh length}$, $L_2 = \text{shin length}$, target distance $D$):
1. **Distance Clamping:**
   $$D = \operatorname{clamp}(D, |L_1 - L_2| + 0.001, L_1 + L_2 - 0.001)$$
2. **Knee Interior Angle (Law of Cosines):**
   $$\cos(\beta) = \frac{L_1^2 + L_2^2 - D^2}{2 L_1 L_2}$$
   $$\theta_{\text{knee}} = \pi - \arccos(\cos(\beta))$$
3. **Hip Angle to Target:**
   $$\cos(\alpha) = \frac{L_1^2 + D^2 - L_2^2}{2 L_1 D}$$
   $$\theta_{\text{hip}} = \operatorname{atan2}(T_y - H_y, T_x - H_x) \pm \arccos(\cos(\alpha))$$
4. **Foot Ground Planting:** Locks foot angle parallel to terrain tangent and prevents vertical penetration.

### 4.2 Locomotion 1D Blend Tree
- **Parameter:** `speed` ($0.0 \rightarrow 1.0$)
- **Clip A:** `idle` (weight $w_1 = \max(0, 1 - 2 \cdot \text{speed})$)
- **Clip B:** `walk` (weight $w_2 = 1 - |2 \cdot \text{speed} - 1|$)
- **Clip C:** `run` (weight $w_3 = \max(0, 2 \cdot \text{speed} - 1)$)
- **Phase Sync:** Both walk and run clips are normalized to cycle phase $\phi \in [0, 1]$. Stride transition interpolates position without popping.

---

## 5. Acceptance Criteria & Quality Gates

1. **Anatomical Correctness:** Characters maintain defined proportions without elongation or crushing ($s_x, s_y \in [0.8, 1.2]$ under squash/stretch).
2. **Zero Foot Sliding:** Feet lock to contact points during support phase; IK adjusts hip offset dynamically.
3. **Seamless State Transitions:** Cross-fading over $0.15\text{–}0.25\text{s}$ avoids visual popping or snapping.
4. **Interactive Character Showcase:** A dedicated inspection studio scene allowing real-time character, animation, playback speed, bone hierarchy overlay, and IK manipulation.
5. **Authoritative Gameplay Integration:** All active scenes use the new character rigs for Veer, Devi Tara, and enemies with zero rendering or behavioral regressions.
6. **Performance Budget:** $< 0.15\text{ms}$ CPU time per character skeleton update; steady 60 FPS across all targets.
