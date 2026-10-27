# MYTHOS 3D — CHARACTER ART DIRECTION & IDENTITY SPECIFICATION
## Hero Veer: The Solar Guardian (Surya-Tejas Kshatriya)
**Revision:** Stage Q18 Production Master  
**Engine:** Godot Engine 4.3 Stable (Forward+ PBR Pipeline)  
**Authoring:** Blender 4.2 LTS / Substance PBR Standards  
**Target:** Hero Protagonist of the Seven Realms (*Bhumi, Antariksha, Patala, Svar, Maharloka, Tapoloka, Satyaloka*)

---

## 1. Character Identity & Cultural Context

Veer is an ancient Kshatriya warrior imbued with the primordial solar radiance of *Surya-Deva*. He is neither a generic fantasy knight nor a western superhero; his visual identity is steeped in the rich visual traditions of classical Indian art—drawing inspiration from Maurya, Gupta, and Hoysala warrior sculptures, classical temple iconography (*Shilpa Shastra*), and ancient epic traditions (*Itihasa*).

### 1.1 Core Visual Pillars
1. **Dignified Heroic Realism**: Natural, athletic humanoid anatomy reflecting decades of rigorous martial training (*Dhanurveda* / *Kalaripayattu*). Avoids exaggerated superhero caricature and mannequin-like blockiness.
2. **Authentic Classical Attire**: Cohesive traditional Indian garments engineered with genuine draping logic (*Vira-Kachha* dhoti wrap, pleated *kashta*, fitted *kamarband*, flowing *uttariya* sash).
3. **Sacred Vedic Iconography**: Three horizontal sandalwood ash markings (*Tripundra Tilak*) with a sacred vermilion *Kumkum* bindu on the forehead; radiant amber-gold solar eyes (*Surya Netra*).
4. **Heroic Weaponry & Regalia**: Forged Damascus sunsteel scimitar (*Surya-Kripana* / *Khadga*), ornate 24k gold lotus ornaments (*Kamarband, Bajuband, Surya-Kavacha*), and classical warrior *Paduka* sandals.
5. **Physical PBR Materiality**: Natural subsurface dermal warmth, woven silk jacquard textures, antique polished metals, and realistic roughness responses—completely eliminating unnatural plastic specular shine.

---

## 2. Character Model Sheet & Anatomy Specifications

### 2.1 Anatomical Dimensions & Stature
- **Total Height**: $1.85\,\text{m}$ (Heroic martial stature)
- **Eye Height**: $1.68\,\text{m}$
- **Shoulder Width**: $0.46\,\text{m}$ (Broad heroic clavicle structure)
- **Waist Circumference**: $0.84\,\text{m}$ ($X \approx \pm 0.165\,\text{m}, Y \approx \pm 0.125\,\text{m}$ at $Z = 0.98\,\text{m}$)
- **Chest Depth**: $0.26\,\text{m}$ ($Y \approx -0.145\,\text{m}$ to $+0.115\,\text{m}$)
- **Base Topology**: Quad-dominant anatomical topology with clean edge loops for facial expression, shoulder rotation, knee articulation, and finger dexterity.

### 2.2 Facial Features & Cranial Sculpt
- **Facial Architecture**: High, defined cheekbones, strong jawline, natural nasal bridge, expressive brow ridge, and defined lips.
- **Eyes (*Surya Netra*)**: Detailed spherical eye geometry with dark amber-gold iris radiating solar flecks, defined black pupil, off-white sclera with subtle realistic vascularity, and high-gloss cornea ($R \approx 0.08$).
- **Ears**: Anatomically modeled helix, antihelix, concha, and earlobes adhering flush against temporal bones.
- **Hair & Coiffure (*Shikha*)**:
  - Natural obsidian black hair volume hugging the cranium with combed-back flow lines.
  - Tapered temple sideburns and clean hairline.
  - Flame-sculpted warrior topknot (*Shikha*) gathered at the crown ($Z = 1.78\,\text{m}$ to $1.88\,\text{m}$).
  - Double-banded filigree golden *Keshbandha* ring binding the base of the topknot.
  - Flowing nape locks (*Choti*) descending gracefully along the cervical spine.

---

## 3. Costume Construction & Draping Architecture

```
                          [ Shikha Topknot & Keshbandha Ring ]
                                         │
                                [ Forehead Tripundra ]
                                         │
                    ┌────────────────────┴────────────────────┐
     [ Left Shoulder ]                                   [ Right Shoulder ]
  (Uttariya Sash Anchor)                               (Bare Heroic Torso)
            │                                                 │
            │           [ Surya Pectoral Medallion ]          │
            │                                                 │
            └───────────────> (Diagonal Chest Drape) ─────────┘
                                         │
                     [ Fitted Kamarband Girdle (Z=0.98m) ]
                     [ 12-Petal Surya Medallion Buckle   ]
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
      [ Left Thigh Wrap ]                             [ Right Thigh Wrap ]
                 │                                               │
                 └───────────> [ Pleated Kashta / Patka ] <──────┘
                               (Central Fan-Fold Panel)
                                         │
                               [ Bare Knees & Calves ]
                                         │
                               [ Pada-rakshaka Greaves ]
                                         │
                               [ Classical Paduka Sandals ]
```

### 3.1 *Vira-Kachha* (Warrior Dhoti)
- **Style**: Classical warrior dhoti wrap (*Kachha*), as depicted in Gupta and Hoysala reliefs.
- **Construction**:
  - Snug upper waist band tucked flush at $Z = 0.96\,\text{m} - 1.02\,\text{m}$.
  - Snug thigh wraps hugging the quadriceps down to just above the knees ($Z = 0.52\,\text{m}$), allowing full martial leg mobility.
  - **Kashta (Central Pleated Drape)**: Dense accordion pleats cascading down the front midline from the waist buckle down to $Z = 0.42\,\text{m}$, displaying an authentic flared fan fold.
  - **Rear Waist Tuck**: Back fabric gathered and neatly tucked into the posterior waistband along the sacral midline.
- **Fabric**: 100% Saffron Raw Silk (*Kshauma*) with woven golden jacquard threads and royal crimson zari hem borders.

### 3.2 *Kamarband* (Golden Waist Girdle)
- **Fit**: Conforms snugly to the waist perimeter with zero floating air gap (tolerance $< 6\,\text{mm}$ from body mesh).
- **Buckle**: Ornate dimensional 12-petal *Surya-Mandala* medallion ($12\,\text{cm}$ diameter) positioned at the front navel point.
- **Side Embellishments**: Sculpted side hip cords and hanging silk-tassel loops.

### 3.3 *Uttariya* (Upper Body Sash)
- **Draping**:
  - Anchors naturally over the muscular left shoulder ($Z \approx 1.40\,\text{m}$).
  - Sweeps diagonally across the chest beneath the pectoral muscle line to the right waist ($Z \approx 1.02\,\text{m}$).
  - Organic cloth thickness ($3\,\text{mm}$) with soft fabric curves instead of rigid polygons.
  - Trailing sash ends cascade down the left flank with subtle wind-responsive curve.
- **Fabric**: Deep Tapovan celestial azure silk with radiant golden solar border stitching.

### 3.4 Ornaments & Armor (*Abharana & Kavacha*)
1. **Surya Pectoral Medallion**: Arched 3D golden medallion resting flush against the upper chest curvature, suspended by an engraved Vedic neck torque.
2. **Bajuband (Bicep Armlets)**: Contoured spiraled 24k gold bands hugging the upper bicep musculature ($Z \approx 1.24\,\text{m}$).
3. **Kavacha (Forearm Bracers)**: Ergonomic forged antique bronze armguards tapering from elbow to wrist with flared rims, protecting the outer forearm while leaving palms free.
4. **Pada-rakshaka (Shin Greaves)**: Anatomically curved antique bronze shin plates protecting tibia crests with double calf straps.
5. **Paduka (Sandals)**: Traditional Indian raised wooden/bronze sandals with sculpted footbed, polished golden toe peg (*Khadaun* grip), and supple leather arch strap.

---

## 4. Weapon Design: *Surya-Kripana* (Solar Khadga)

- **Blade Geometry**: Gently curved single-edged Indian scimitar (*Khadga* / *Talwar* lineage) with a reinforced armor-piercing tip.
  - Length: $0.85\,\text{m}$ blade, $0.18\,\text{m}$ hilt.
  - Fuller: Dual fuller channels running along the spine inscribed with solar Devanagari runes.
  - Finish: Forged Damascus Sunsteel (*Wootz*) with shimmering wavy crystalline patterns.
- **Hilt & Guard**:
  - Traditional disc pommel (*Katora*) with a faceted ruby center point.
  - Quillon guard with radiating 8-point sunburst quillons.
  - Grip: Wrapped dark leather with spiral gold filigree wire.
- **Socket Attachment**: Rigidly gripped in the palm of the right hand (`socket_right_hand`), angled forward-outward in high-readiness guard pose. Zero forearm or hip clipping.

---

## 5. PBR Material Architecture & Surface Responses

| Material Identifier | Base Color / Albedo | Metallic | Roughness | Normal Detail | Special Properties |
|---|---|---|---|---|---|
| **Mat_Veer_Skin** | Warm Indian Bronze (`#9E5A2C` - `#B86E3C`) | `0.00` | `0.58 - 0.64` | Subsurface pores & muscle clefts | Natural epidermal warmth |
| **Mat_Veer_Eyes** | Amber Surya Netra (`#F0A500` / `#221200`) | `0.00` | `0.08` | Smooth corneal curvature | Radiant specular corneal reflection |
| **Mat_Veer_Tilak** | Sandalwood Ash & Kumkum (`#ECE6D8` / `#C41E24`) | `0.00` | `0.78` | Paste brushstroke relief | Third-eye sacred mark |
| **Mat_Veer_Dhoti** | Saffron Silk & Crimson Zari (`#DE6218` / `#941822`) | `0.04` | `0.70` | Woven silk twill & pleat folds | Jacquard zari weave highlights |
| **Mat_Veer_Kamarband** | 24k Vedic Antique Gold (`#E8BA48`) | `0.94` | `0.22` | Lotus filigree & beveled rims | High anisotropic metallic sheen |
| **Mat_Veer_Cuirass** | Forged Antique Bronze (`#8C5A32`) | `0.85` | `0.35` | Hammered relief & solar flares | Patina shading in crevices |
| **Mat_Veer_Sash** | Tapovan Celestial Azure (`#1A4A88`) | `0.05` | `0.65` | Silk weave & embroidered borders | Golden border micro-emission |
| **Mat_Veer_Khadga** | Damascus Sunsteel & Ruby (`#9AA4B0` / `#C81428`) | `0.95` | `0.18` | Wootz steel waves & fuller groove | Solar fuller channel emission (2.0) |
| **Mat_Veer_Hair** | Obsidian Black (`#121014`) | `0.00` | `0.45` | Flowing strand anisotropic lines | Natural glossy warrior locks |

---

## 6. Rigging & Animation Technical Contracts

- **Skeleton**: 24-bone hierarchy preserving 100% runtime compatibility with `PlayerController3D` and `AnimationTree`:
  `root` $\rightarrow$ `pelvis` $\rightarrow$ `spine_01` $\rightarrow$ `chest` $\rightarrow$ `neck` $\rightarrow$ `head` $\rightarrow$ `topknot`  
  `chest` $\rightarrow$ `shoulder_l/r` $\rightarrow$ `arm_l/r` $\rightarrow$ `forearm_l/r` $\rightarrow$ `hand_l/r` $\rightarrow$ `socket_right_hand`  
  `pelvis` $\rightarrow$ `thigh_l/r` $\rightarrow$ `shin_l/r` $\rightarrow$ `foot_l/r`  
  `pelvis` $\rightarrow$ `sash_01` $\rightarrow$ `sash_02`
- **Animation Library**: All 36 authored animation clips in `veer.glb` strictly preserved and functional.
- **Deformation Quality**: 100% vertex assignment with smooth falloff; zero unweighted or detached vertices; zero clipping during walk, run, jump, and combat attacks.
