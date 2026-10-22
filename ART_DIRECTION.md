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
