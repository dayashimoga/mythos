# Mythos: Astra & The Seven Realms — Stage 1 Vertical Slice Specification
**Document Version:** 1.0.0-PROD  
**Level Identifier:** `bhumi_sunken_temple` (The Sunken Temple of Agni)  
**Classification:** Functional Gameplay Specification & Technical Design Document  
**Status:** Canonical & Baseline Frozen for Stage 1  

---

## 1. Scenario Overview & Narrative Setting

Following the calibration of the Sanctum of Astra in Stage 0, Veer crosses through the Astral Gate and arrives at **The Sunken Fire Temple of Surya-Kund** in the mortal realm of **Bhumi**. 

The temple, once dedicated to solar purification, has been invaded by vanguard forces of the Asura lord **Mahisha**. A dark **Tamas Corruption Spire** has taken root in the temple's inner courtyard, casting an impenetrable void barrier around the central Sun Altar and animating corrupted sentinels, agile Void-Scouts, and a massive Stone Rakshasa.

Veer must navigate the temple grounds, commune with the sacred Agni-Forge to upgrade his combat stance, harmonize two ancient **Brahmic Resonance Pillars** to dispel the void barrier, overcome the guardian adversaries, cleanse the Tamas Spire, and consecrate the high altar to unlock the passage into the subterranean realm of **Patala**.

---

## 2. Gameplay Loop, Actions & Progression

```
[Arrival at Temple Entrance]
       │
       ▼
[Area 1: Outer Courtyard] ───► Battle Agile Vanara Scouts & Dodge Void Needles
       │
       ▼
[Area 2: Sacred Agni-Forge] ──► Press [ E ] to Attune Weapon Stance (Solar Resonant Flare)
       │
       ▼
[Area 3: East & West Wings] ──► Strike Brahmic Resonance Pillars to Dissolve Void Barrier
       │
       ▼
[Area 4: Inner Sanctum] ────► Face Stone Rakshasa Enforcer (Ground Slam & Shockwaves)
       │
       ▼
[Area 5: Tamas Spire] ──────► Destroy Corruption Spire Core (Floating Damage Feedback)
       │
       ▼
[Consecrate Surya Altar] ───► Stage 1 Victory & Rating Evaluation (S / A / B Rank)
```

---

## 3. Player Mechanics & Combat Stances

### 3.1 Dual-Attack Combat System
1. **Ranged Attack: Surya-Burst (Left Click / J):**
   - Fires high-velocity solar projectile along pointer trajectory.
   - Base damage: $25\text{ HP}$; Energy cost: $15\text{ Agni}$.
   - Upgraded (*Solar Resonant Flare*): Dual-shot spread dealing $2 \times 20\text{ HP}$.
2. **Melee Attack: Agni-Slash (Right Click / K / X):**
   - Sweeps a wide $120^\circ$ solar crescent blade arc ($80\text{ px}$ radius).
   - Base damage: $40\text{ HP}$; Energy cost: $20\text{ Agni}$.
   - **Tactical Utility:** Knocks back enemies, interrupts enemy windups, and deflects or shatters enemy void needles.
3. **Agni-Dash (Space / Shift):**
   - High-velocity evasive dash with $0.2\text{s}$ invulnerability frames (i-frames).
   - Allows dashing over hazardous lava trenches and through expanding shockwaves.

### 3.2 Weapon Stance Attunement (Agni-Forge)
- Located at the temple's western pavilion.
- Approaching and pressing `E` consecrates Veer's blade into **Solar Resonant Flare Stance**, granting glowing golden particle wings, double-projectile bursts, and $+20\%$ dash recovery.

---

## 4. Enemy Roster & Behaviors

| Enemy Type | Role | HP | Speed | Attacks & AI Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Vanara Void-Scout** | Agile Ranged Skirmisher | $45$ | $160\text{ px/s}$ | Maintains standoff distance ($160-240\text{ px}$); circles Veer; telegraphs needle shot with violet spark; fires 3-round void burst. |
| **Stone Rakshasa** | Heavy Armored Brute | $140$ | $90\text{ px/s}$ | Charges directly at Veer; pauses with a glowing crimson telegraph ring ($1.0\text{s}$ windup); slams ground emitting an expanding circular shockwave ($180\text{ px/s}$) that deals $35\text{ damage}$ unless dodged with i-frame dash. |
| **Tamas Corruption Spire** | Monolithic Objective Core | $200$ | $0$ (Static) | Protected by void shield until both Resonance Pillars are struck. Emits periodic corruption pulses ($15\text{ damage}$) and spawns minion motes until destroyed. |

---

## 5. Environmental Interactables & Hazards

1. **Brahmic Resonance Pillars (Pillar Alpha & Beta):**
   - Ancient stone obelisks carved with Sanskrit runes.
   - Initially dormant (dark violet). Striking them with a Surya-Burst or Agni-Slash activates resonance (radiant gold), emitting a harmonic chime and opening the corresponding barrier gate.
2. **Surya Amrita Healing Font:**
   - Sacred stone pool emitting jade and golden water droplets.
   - Standing within radius and pressing `E` restores $40\text{ Prana (Health)}$ and refills Agni energy.
3. **Lava Channels / Fire Trenches:**
   - Magma rifts crossing the courtyard. Stepping in lava deals $10\text{ damage/second}$ tick; dashing over them bypasses the hazard safely.
4. **Floating Combat Damage Numbers:**
   - Real-time animated numbers popping upward with gravity and alpha fade:
     - Gold / Orange: Player damage dealt to enemies.
     - Red: Damage taken by Veer.
     - Green: Healing received from Amrita Font.

---

## 6. Success, Failure & Progression States

### 6.1 Failure State (Prana Depleted)
- If Veer's Prana reaches $0$, game transitions to **Defeat Overlay**:
  - Dramatic time-dilation ($0.3\times$ speed for $1.5\text{s}$) followed by grayscale vignette.
  - Options: Press `R` to Instant Retry (respawns with full health at temple entrance) or press `Q` to return to title.

### 6.2 Success State (Surya Altar Consecrated)
- Triggered when:
  1. Both Brahmic Resonance Pillars are attuned.
  2. The Tamas Corruption Spire is destroyed.
  3. All 3 Temple Astra Shards are gathered.
  4. Veer interacts with the High Sun Altar.
- Displays **Stage 1 Victory Screen**:
  - Cleanse cinematic with expanding golden mandala bloom.
  - Performance Evaluation:
    - **Time Elapsed:** seconds taken.
    - **Enemies Cleansed:** total vanquished.
    - **Combat Rating:** Rank S ($< 90\text{s}$, 0 deaths), Rank A, or Rank B.
  - Progression unlocked: Realm of Patala unlocked in `SaveGameManager`.

---

## 7. Measurable Acceptance Criteria

- **AC-101 (Melee & Ranged Combat):** Left-click fires Surya-Burst; Right-click / K performs sweeping crescent melee slash that damages enemies and deflects enemy projectiles.
- **AC-102 (AI Behavior & Telegraphed Attacks):** Rakshasa charges, telegraphs ground slam with expanding red circle, and generates an expanding shockwave; Vanara scout maintains distance and fires telegraphed darts.
- **AC-103 (Resonance Pillars & Gate System):** Striking the 2 Resonance Pillars activates their harmonic state and drops the void barrier blocking the inner sanctum.
- **AC-104 (Agni-Forge Upgrade):** Interacting with the Sacred Anvil upgrades Veer's attack stance with visual indicator and enhanced projectiles.
- **AC-105 (Damage Numbers & Visual Juice):** Every attack spawns crisp floating damage numbers; hits trigger micro screen shake and particle bursts.
- **AC-106 (Retry & Recovery Loop):** Dying allows instantaneous restart via `R` key without memory leaks, hanging entities, or corrupted state.
- **AC-107 (Test Suite & Coverage):** All Stage 1 code covered with automated unit/integration tests achieving $\ge 90\%$ test coverage with zero failing tests.
- **AC-108 (Append-Only Enforcement):** Historical entries in `TODO.md` and `CHANGELOG.md` remain completely unmodified.
