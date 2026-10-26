# Mythos: Astra & The Seven Realms — Audiovisual & Cinematic Specification

**Subsystem:** Stage 7 Audiovisual Design, Dynamic Soundscapes, Procedural Synthesizers & VFX  
**Version:** `1.0.0`  
**Classification:** Core Architectural Specification  
**Status:** Canonical & Implemented  

---

## 1. Executive Vision & Artistic Direction

*Mythos: Astra & The Seven Realms* delivers an evocative, celestial audiovisual aesthetic rooted in classical Vedic cosmology, ancient temple acoustics, and high-impact mythological action. 

The aesthetic operates on a dramatic tonal polarity:
- **Solar Satva (Divine Order & Astra Power):** Defined by crystalline resonance, shimmering golden particles, harmonic Vedic ragas (*Bhairav*), sacred geometry runes, and clean acoustic chimes.
- **Tamasic Asura (Primordial Chaos & Shadow):** Defined by dissonant augmented intervals (*Raga Marwa*), sub-bass tectonic tremors, volcanic obsidian embers, jagged crimson shockwaves, and guttural vocal formants.

All audio, visual effects, and cinematic sequences are engineered to run procedurally and responsively within real-time WebAudio, WebGL, and Canvas architectures with deterministic synchronization, voice budget pooling, zero asset missing states, and full WCAG accessibility compliance.

---

## 2. Audio Architecture & Mixer Bus Topology

### 2.1 Mixer Bus Hierarchy
The audio engine organizes all audio emissions into a 5-tier mixer hierarchy with authoritative gain and ducking control:

```
[ Master Bus ] (Linked to AccessibilityManager masterVolume & isMuted)
    │
    ├── [ Music Bus ] ──── Dynamic Raga Generator (Tambura Drone, Sitar, Tabla)
    │
    ├── [ SFX Bus ] ────── Weapon Foley, Combat Impacts, Dash, Shockwaves
    │
    ├── [ Voice Bus ] ──── Mantra Synthesizer (Sanskrit Formants), Dialogue Chimes
    │
    ├── [ Ambience Bus ] ─ Wind, Water Ghats, Temple Braziers, Astral Harmonics
    │
    └── [ UI Bus ] ─────── Button Clicks, Slider Ticks, Modal Wooshes, Toasts
```

### 2.2 Voice Budgeting & Dynamic Voice Stealing
To maintain strict 60 FPS performance and prevent WebAudio node starvation or distortion:
- **Maximum Voice Limit:** 32 simultaneous active synthesizer nodes.
- **Priority Tiering:**
  1. *Priority 1 (Critical):* Dialogue / Mantra vocalizations, Boss phase stingers.
  2. *Priority 2 (High):* Player weapon impacts, perfect parry chimes, dash audio.
  3. *Priority 3 (Medium):* Enemy attacks, minion hits, projectile hums.
  4. *Priority 4 (Low):* Ambient brazier crackles, distant environmental debris.
- When active voices reach 32, the lowest-priority and oldest voice is smoothly ramped down over 15ms and reclaimed (*voice stealing*).

### 2.3 Audio Ducking
When the Voice Bus emits a sacred mantra or dialogue line:
- The **Music Bus** is automatically attenuated by -4.5 dB over 120ms.
- The **Ambience Bus** is attenuated by -6.0 dB.
- Both buses smoothly ramp back to their master level over 400ms after voice completion.

---

## 3. Procedural Vedic Raga Synthesizer

### 3.1 Mathematical Tuning & Microtonal Scales (Swaras)
The raga engine synthesizes music using Indian Classical microtonal tuning relative to a fundamental root frequency $S$ ($Sa$ tuned to 108.0 Hz or 216.0 Hz):

| Swara | Note Name | Ratio to Sa | Interval Name | Frequency (Sa = 108Hz) |
| :--- | :--- | :--- | :--- | :--- |
| **S** | Shadja | $1/1$ | Root Unison | 108.0 Hz |
| **r** | Komal Rishabh | $16/15$ | Minor Second | 115.2 Hz |
| **R** | Shuddha Rishabh | $9/8$ | Major Second | 121.5 Hz |
| **g** | Komal Gandhar | $6/5$ | Minor Third | 129.6 Hz |
| **G** | Shuddha Gandhar | $5/4$ | Major Third | 135.0 Hz |
| **m** | Shuddha Madhyam | $4/3$ | Perfect Fourth | 144.0 Hz |
| **M** | Tivra Madhyam | $45/32$ | Augmented Fourth | 151.875 Hz |
| **P** | Pancham | $3/2$ | Perfect Fifth | 162.0 Hz |
| **d** | Komal Dhaivat | $8/5$ | Minor Sixth | 172.8 Hz |
| **D** | Shuddha Dhaivat | $5/3$ | Major Sixth | 180.0 Hz |
| **n** | Komal Nishad | $9/5$ | Minor Seventh | 194.4 Hz |
| **N** | Shuddha Nishad | $15/8$ | Major Seventh | 202.5 Hz |
| **S'**| Tar Shadja | $2/1$ | Octave | 216.0 Hz |

### 3.2 Canonical Raga Profiles
1. **Raga Bhairav (Morning / Sanctum of Astra):**
   - *Arohana (Ascent):* S - r - G - m - P - d - N - S'
   - *Mood:* Deep devotion, morning peace, sacred majesty.
   - *Characteristic:* Heavy microtonal oscillation (*andolan*) on $r$ (Komal Re) and $d$ (Komal Dha).
2. **Raga Darbari Kanada (Deep Forest of Dandaka):**
   - *Arohana:* S - R - g - m - P - d - n - S'
   - *Mood:* Solemnity, nocturnal gravity, ancient grandeur.
   - *Characteristic:* Slow sliding glissando (*meend*) across $g$ and $d$.
3. **Raga Marwa (Titan Boss Mahishasura Encounter):**
   - *Arohana:* S - r - G - M - D - N - S' (Omission of Pancham $P$)
   - *Mood:* Restless heroic tension, impending doom, divine fury.
   - *Characteristic:* Sharp dissonance created by the juxtaposition of $r$ (Komal Re) and $M$ (Tivra Ma).

### 3.3 Dynamic Combat Tension Model ($\theta \in [0.0, 1.0]$)
Music complexity dynamically modulates based on authoritative player combat state:
$$\text{Tension } \theta = \text{clamp}(0.35 \cdot \text{EnemiesEngaged} + 0.40 \cdot \text{BossActive} + 0.25 \cdot (1 - \text{HealthRatio}), 0.0, 1.0)$$

- **$\theta < 0.25$ (Meditative Exploration):** Four-string Tanpura drone + meditative solo Veena alap notes (slow attack 1.2s, intervals > 2s apart). No percussion.
- **$0.25 \le \theta < 0.65$ (Skirmish Tension):** Medium tempo *Jor* layer engages; Bayan bass pulse begins on beats 1 and 9 of Tintal (16-beat cycle); melodic phrases quicken.
- **$\theta \ge 0.65$ (Boss Battle Climax):** High-tempo *Jhala* and rapid 16th-note Tabla bol rhythm; Dayan treble rim strokes; Tivra Ma dissonances accentuate boss attacks.

---

## 4. Spatial 3D Audio & Attenuation Physics

### 4.1 Attenuation Model
Sound attenuation follows a clamped logarithmic falloff simulating architectural acoustics:
$$A(d) = \begin{cases} 
1.0 & \text{if } d \le r_{\min} \\
\text{clamp}\left(\frac{r_{\min}}{r_{\min} + (d - r_{\min}) \cdot \alpha}, 0.0, 1.0\right) & \text{if } r_{\min} < d \le r_{\max} \\
0.0 & \text{if } d > r_{\max}
\end{cases}$$
Where default parameters are $r_{\min} = 120\text{ px}$, $r_{\max} = 1400\text{ px}$, and roll-off $\alpha = 0.85$.

### 4.2 Stereo Panning & Low-Pass Occlusion
Stereo panning is determined by the relative vector between source $\vec{P}_s$ and listener $\vec{P}_l$:
$$\text{pan} = \text{clamp}\left(\frac{P_{s,x} - P_{l,x}}{r_{\max}}, -1.0, 1.0\right)$$
Distance-dependent air absorption is emulated via a low-pass biquad filter:
$$f_{\text{cutoff}}(d) = \text{clamp}\left(20000 - \frac{d}{r_{\max}} \cdot 17500, 2500, 20000\right)\text{ Hz}$$

### 4.3 Doppler Velocity Shift
For moving entities (e.g. projectile volleys, charging Titan boss):
$$f_{\text{shifted}} = f_0 \cdot \left(\frac{c - (\vec{V}_l \cdot \hat{u})}{c - (\vec{V}_s \cdot \hat{u})}\right)$$
Where acoustic speed constant $c = 1500\text{ px/s}$ and $\hat{u} = \frac{\vec{P}_s - \vec{P}_l}{\|\vec{P}_s - \vec{P}_l\|}$.

---

## 5. Mantra Vocalization & Material Foley Synthesizer

### 5.1 Formant Vowel Filter Synthesis
Vocal syllables are produced using an oscillator carrier coupled with parallel bandpass biquad filters tuned to classical human vocal tract resonances:

| Syllable | Carrier Freq ($f_0$) | Formant F1 (Bandpass) | Formant F2 (Bandpass) | Envelope Dynamics |
| :--- | :--- | :--- | :--- | :--- |
| **"OM" (ॐ)** | 108.0 Hz | 800 Hz $\to$ 350 Hz $\to$ 250 Hz | 1200 Hz $\to$ 800 Hz $\to$ 500 Hz | 400ms attack, 1800ms sustain, 1200ms decay |
| **"HRĪM" (ह्रीं)** | 216.0 Hz | 280 Hz ($Q=5$) | 2300 Hz ($Q=8$) | 80ms attack, 600ms sustain, 400ms decay |
| **"KRĪM" (क्रीं)** | 144.0 Hz | 300 Hz ($Q=4$) | 1900 Hz ($Q=6$) | 40ms attack, 500ms sustain, 350ms decay |
| **"PHAṬ" (फट्)** | White Noise + 180 Hz | 750 Hz ($Q=3$) | 1400 Hz ($Q=3$) | 5ms transient pop, 150ms explosive decay |

### 5.2 Material Foley Resonator Banks
- **Celestial Gold (Astra Weapons):** Dual high-Q peak filters at 1450 Hz and 3200 Hz with slow exponential decay ($t = 420\text{ ms}$).
- **Bronze / Iron (Asura Shields):** Mid-range bell resonance at 580 Hz and 920 Hz with rapid metallic damping ($t = 180\text{ ms}$).
- **Granite / Stone (Pillars & Ruins):** Low-frequency impulse at 85 Hz combined with granular noise burst ($t = 120\text{ ms}$).
- **Tamasic Shadow (Asura Spells):** Sub-bass frequency pairs (55 Hz and 77 Hz) with ring-modulated pitch drooping.

---

## 6. Cinematic Direction & Camera Choreography

### 6.1 Anamorphic 2.39:1 Presentation
- All cinematic sequences engage smooth top and bottom letterbox curtains expanding to 64px height.
- Golden celestial trim line (`#FFB703`, 2px height, 0.75 alpha) frames the letterbox borders.
- Subtitles are rendered centered in the lower letterbox bar with responsive font scaling and dyslexia font support.

### 6.2 Camera Behaviors & Staging
- **Dolly Zoom (Vertigo Effect):** Camera zooms in while compensating world viewport position during moments of divine realization.
- **Cinematic Orbit:** Camera gracefully revolves around a focal coordinate (e.g. Altar of Surya) using smooth sinusoidal easing.
- **Depth-of-Field Emulation:** Foreground and background elements outside the focal focal plane receive subtle radial alpha softening.
- **Interruption & Skip Guarantee:** Pressing `ESC` instantly completes transitions, restores normal camera framing, closes active letterboxes, and aligns narrative/combat state without audio clipping or phase desynchronization.

---

## 7. Visual Effects (VFX) & Microanimations

### 7.1 Particle Subsystems
1. **Brahmastra Shockwave Ring:** Expanding circular ring with inner golden core (`#FFB703`) and outer cyan astral refraction (`#00E5FF`). Expands from $r = 10\text{ px} \to 280\text{ px}$ over 450ms.
2. **Sanskrit Celestial Runes:** Sacred glyph particles (ॐ, क्रीं, ह्रीं, श्रीं, स्वाहा) ascending vertically with gentle horizontal cosine swaying and alpha sparkle.
3. **Weapon Slash Ribbons:** Quad-strip curved mesh rendered along the blade tip trajectory, color-coded by active weapon (Solar Agni orange for Chakram, Astral cyan for Glaive).
4. **Material Impact Debris:** Directionally-biased rock chunks and luminous embers ejected along the surface reflection normal.

### 7.2 Accessibility & Motion Sensitivity Controls
- When `AccessibilityManager.isReducedMotion()` is active:
  - Screen shake intensity is completely zeroed.
  - Camera zoom jumps and dolly shakes are replaced with smooth linear pans.
  - Rapid particle bursts are clamped to a maximum density of 15 particles.
- Dynamic screen shake factor ($0.0 \to 1.0$) linearly dampens all combat impact impulses.
- High-contrast mode renders high-luminance boundary contours on all particle emitters.

---

## 8. Measurable Quality & Acceptance Criteria

1. **Audio Latency:** Sound trigger-to-oscillator start $\le 20\text{ ms}$.
2. **Voice Pooling:** Zero audio dropouts or browser memory leaks across 500+ rapid sequential sound emissions.
3. **Raga Dynamic Blending:** Zero clicks or audible phase pops during transition between quiet exploration and high-tension boss battle.
4. **Cinematic Continuity:** 100% state restoration upon cutscene skip (`ESC`), verified by automated regression tests.
5. **Code Coverage:** Global coverage across all audiovisual subsystems maintained at $\ge 90\%$ Statements/Lines and $\ge 85\%$ Branches.

---

## 9. 3D Engine Audiovisual Polish & Spatial Mixing Architecture (Stage Q7)

### 9.1 In-Engine 3D Audio Subsystem (`AudioManager3D`)
- **Spatial Attenuation**: 3D positional sound emitter pooling (`AudioStreamPlayer3D`) with unit size $4.0\text{m}$, max distance $45.0\text{m}$, and realistic logarithmic distance falloff.
- **Footstep Foley Synchronization**: Synchronized with Veer's skeletal gait phase in `PlayerController3D` (`_update_footstep_audio`), calculating contact timing for left and right foot strikes on stone and consecrated terrain.
- **Multi-Bus Decibel Attenuation**: Live player control over `master_volume`, `sfx_volume`, and `ambience_volume` via `PauseMenu3D` sliders with linear-to-dB conversion (`linear_to_db(vol * master)` down to $-80.0\text{ dB}$).
- **Seven-Realm Atmospheric Soundscapes**: Dynamic dual-stream crossfading (`ambient_player_a` and `ambient_player_b` over $1.2\text{s}$ tween) delivering procedural 16-bit 44.1kHz audio stems across all 7 Lokas:
  - *Bhumi:* Dandaka sacred grove rustling, wind through ancient pillars, temple bell hums.
  - *Antariksha:* Roaring aerodynamic high-altitude gusts, gale updrafts, celestial turbines.
  - *Patala:* Subterranean cavern resonance, mineral water drips, low-frequency serpentine rumble.
  - *Svar:* Solar light prism resonance, sunlit marble acoustic reflections, brass drone.
  - *Maharloka:* Ethereal astral glyph levitation hums, chanting harmonics, tranquil stillness.
  - *Tapoloka:* Magma geyser bubbling, caldera volcanic heat rush, deep furnace combustion.
  - *Satyaloka:* Harmonic cosmic lotus singing bowls, transcendent tanpura frequencies.

### 9.2 In-Engine VFX & Camera Combat Polish
- **Hit-Stop Micro-Freezes**: Authoritative $0.06\text{s}$ time dilation on successful combo melee strikes, emphasizing kinetic impact weight.
- **Torus Slash Arc Meshes**: Geometric golden solar slash arcs dynamically spawned along Veer's sunsteel blade path, fading smoothly over $0.14\text{s}$.
- **Camera Trauma & Accessibility Shake Limits**: Rotational trauma shake system in `OrbitCamera3D` operating with quadratic decay ($\text{shake} = \text{trauma}^2 \times \text{multiplier}$), scaling instantaneously with the player's accessibility settings and fully suppressed when `reduced_motion` is enabled.

