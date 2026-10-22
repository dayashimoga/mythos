# Mythos: Astra & The Seven Realms — User & Player Guide
**Document Version:** 1.0.0-PROD  
**Classification:** Player Manual, Controls Scheme & Gameplay Mechanics  
**Status:** Approved for Stage 0  

---

## 1. Introduction & Stage 0 Objectives

Welcome to **Mythos: Astra & The Seven Realms**. In this foundational chapter, you guide the Solar Guardian **Veer** through the subterranean **Sanctum of Astra**. 

Your sacred quest in Stage 0:
1. Master astral mobility, dashing, and celestial projectile firing.
2. Defeat the corrupted Tamas Sentinels patrolling the outer wings.
3. Discover and gather all **3 radiant Astra Shards** scattered in the chamber quadrants.
4. Return to the monumental **Sun Altar** and channel your shards to rekindle the solar seal (*Rta*).

---

## 2. Controls & Input Mapping

The Astra Engine supports unified input across Keyboard/Mouse, Gamepad, and Mobile Touchscreens:

### 2.1 Desktop Controls (Keyboard & Mouse)

| Action | Primary Key | Alternate Key | Description |
| :--- | :--- | :--- | :--- |
| **Move Up** | `W` | `Up Arrow` | Run north |
| **Move Down** | `S` | `Down Arrow` | Run south |
| **Move Left** | `A` | `Left Arrow` | Run west |
| **Move Right** | `D` | `Right Arrow` | Run east |
| **Agni-Dash** | `Space` | `Left Shift` | High-speed dash with invulnerability frames |
| **Surya-Burst** | `Left Click` | `J` or `X` | Fire celestial projectile toward pointer / facing direction |
| **Attune / Consecrate** | `E` | `F` | Interact with Sun Altar when in proximity |
| **Pause / Menu** | `Escape` | `P` | Pause simulation and open menu |
| **Toggle Diagnostics** | `F3` | \` (Tilde) | Toggle real-time FPS, entity, and memory telemetry |
| **Toggle Colliders** | `F2` | `C` | Render physical bounding boxes in green/cyan |
| **Mute Sound** | `M` | Quick-Bar Button | Toggle procedural audio synthesizer |

### 2.2 Mobile & Touch Controls

When launched on a touch-enabled screen or mobile browser:
- **Left Virtual Stick:** Appears in the bottom-left corner. Drag in any direction to move Veer smoothly.
- **Action Buttons (Bottom-Right):**
  - **⚔️ (Crossed Swords):** Fire Surya-Burst projectile.
  - **⚡ (Lightning Bolt):** Execute Agni-Dash.
  - **✨ (Sparkles):** Attune with the Sun Altar.
- **Top Quick Bar:** Onscreen buttons to toggle Diagnostics, Sound, and Fullscreen mode.

---

## 3. HUD (Heads-Up Display) Elements

1. **Prana Gauge (Green Bar, Top-Left):**
   - Represents Veer's vital health. Decreases when taking damage from sentinels.
2. **Agni Energy Gauge (Orange Bar, Top-Left):**
   - Energy required for special abilities. Dashing consumes $25\text{ energy}$; firing Surya-Bursts consumes $15\text{ energy}$. Energy regenerates automatically over time ($18/\text{second}$).
3. **Astra Shard Counter (Top-Left):**
   - Displays current shards collected out of 3 required ($0/3 \to 3/3$).
4. **Cosmic Objective Banner (Top-Center):**
   - Directs you to the next immediate tactical step in the sanctum.
5. **Quick Navigation Bar (Top-Right):**
   - One-click buttons for Telemetry Diagnostics (`F3`), Audio Mute (`M`), and Fullscreen.

---

## 4. Diagnostics Overlay (F3)

Press `F3` or click the 📊 **Diagnostics** button at any time to inspect live engine telemetry:
- **FPS:** Target 60 FPS with frame latency readout in milliseconds.
- **Update / Render Timings:** Physics and rendering step durations.
- **Active Entities & Particles:** Number of live simulated entities and visual sparks.
- **Spatial Checks:** Number of collision pair checks executed per frame.
- **Memory (JS Heap):** Heap memory utilized by the engine runtime.

---

## 5. State Persistence & Auto-Save

Your progress is automatically saved to LocalStorage:
- Completed objectives and consecrated altars persist across browser refreshes.
- High scores and audio preferences are remembered.
- To reset progress, press `P` to enter Settings and press `C` to purge local state.
