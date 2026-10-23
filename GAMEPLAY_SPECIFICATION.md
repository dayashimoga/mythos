# Mythos: Astra & The Seven Realms — Gameplay & AI Specification
**Document Version:** 1.0.0-PROD  
**Classification:** Core Gameplay Systems, Combat Mechanics, AI Architecture & Progression Specifications  
**Author:** Principal Gameplay Systems Architect, AI Engineer, Physics Engineer & QA Lead  
**Status:** Authoritative Baseline for Stage 4

---

## 1. Overview & Gameplay Design Philosophy

*Mythos: Astra & The Seven Realms* delivers high-octane, responsive, tactical combat rooted in ancient Vedic martial arts (*Dhanurveda* & *Kalaripayattu*).

The combat and gameplay experience centers on three core pillars:
1. **Fluid Dual-Weapon Synergy:** Instant tactical swapping between the swift, high-velocity **Agni-Chakram** (rapid solar disc slashes and ranged ricochets) and the heavy, long-reach **Prana-Glaive** (wide sweeping arcs, shield-breaking thrusts, and area denial).
2. **Predictive AI with Tactical Behavior Trees:** Enemies are not stationary fodder or predictable automatons. They operate via modular Behavior Trees, maintain perception cones (sight and sound), flank in cooperative pincer formations, raise directional shields, and telegraph lethal attacks with read-and-react timing.
3. **Multi-Phase Titan Boss Battles:** Boss encounters feature dynamic multi-phase state machines, arena-scale environmental hazards, telegraphed charge lines, poise-stagger punish windows, and escalating threat phases.

---

## 2. Core Player Combat Mechanics & Actions

### 2.1 Action Mapping & Input Contracts

```
+========================================================================================================+
| ACTION              | KEYBOARD / MOUSE        | GAMEPAD            | TOUCH BUTTON | CONTRACT           |
+========================================================================================================+
| Movement (8-Way)    | W, A, S, D / Arrows     | Left Analog Stick  | Virtual Stick| Instant responsive |
|                     |                         |                    |              | acceleration       |
+---------------------+-------------------------+--------------------+--------------+--------------------+
| Light Attack / Combo| Left Mouse / Key J      | Button X (West)    | 🗡️ Button    | 3-hit combo chain  |
|                     |                         |                    |              | with cancel window |
+---------------------+-------------------------+--------------------+--------------+--------------------+
| Heavy / Weapon Skill| Right Mouse / Key K     | Button Y (North)   | ⚡ Button    | Guard-break thrust |
|                     |                         |                    |              | / Solar disc burst |
+---------------------+-------------------------+--------------------+--------------+--------------------+
| Weapon Swap         | Key Q                   | D-Pad Left / L1    | 🔄 Button    | Instant swap       |
|                     |                         |                    |              | (0.12s cooldown)   |
+---------------------+-------------------------+--------------------+--------------+--------------------+
| Agni-Dash           | Space / Shift           | Button A (South)   | 💨 Button    | 250ms i-frames,    |
|                     |                         |                    |              | 520 px/s burst     |
+---------------------+-------------------------+--------------------+--------------+--------------------+
| Guard / Parry       | Key C / Key X           | Button B (East)/ R1| 🛡️ Button    | 120ms parry window |
|                     |                         |                    |              | reflects attacks   |
+---------------------+-------------------------+--------------------+--------------+--------------------+
| Interact            | Key F / Key E           | Button A (Near)    | ✋ Button    | Props, checkpoints |
+========================================================================================================+
```

### 2.2 Dual-Weapon Specifications & Combo Chains

#### Weapon A: Agni-Chakram (The Solar Wheels of Agni)
- **Role:** High mobility, fast attack cadence, projectile deflection, burn application.
- **Attack Speed:** $0.22\text{s}$ per strike.
- **Combo String:**
  - *Hit 1 (Agni-Slash I):* Rapid horizontal sweep ($60^\circ$ arc, $70\text{px}$ radius, 28 damage, 15 poise damage).
  - *Hit 2 (Agni-Slash II):* Upward diagonal cleave ($90^\circ$ arc, $75\text{px}$ radius, 34 damage, 20 poise damage).
  - *Hit 3 (Solar Chakram Finisher):* Launches two spinning solar chakram discs forward ($500\text{ px/s}$, 45 damage each, ignites targets for $6\text{ dmg/s}$ over $3\text{s}$).

#### Weapon B: Prana-Glaive (The Celestial Spear of Surya)
- **Role:** Long reach, crowd control, shield-breaking, heavy stagger.
- **Attack Speed:** $0.42\text{s}$ per strike.
- **Combo String:**
  - *Hit 1 (Glaive Sweep):* Sweeping wide arc ($140^\circ$ arc, $115\text{px}$ radius, 48 damage, 35 poise damage).
  - *Hit 2 (Spear Thrust):* Piercing forward thrust ($140\text{px}$ reach, 58 damage, 60 poise damage, **breaks enemy shields**).
  - *Hit 3 (Ground Piercer):* Vaults downward into the earth ($90\text{px}$ radial shockwave, 75 damage, knocks down small enemies and staggers large enemies for $1.5\text{s}$).

---

## 3. Combat Formulas & Stagger System

### 3.1 Poise & Stagger Mechanics
Every dynamic entity possesses a **Poise Bar** ($0 \dots \text{MaxPoise}$):
- Incoming attacks deal both **Health Damage** and **Poise Damage**.
- When Poise drops to $0$, the entity enters a **Staggered State** for $1.5\text{s}$ to $2.5\text{s}$:
  - Current actions are cancelled immediately.
  - Entity is unable to move, attack, or block.
  - Takes $+30\%$ Critical Vulnerability damage from all sources.
  - Poise regenerates to $100\%$ upon recovery.

### 3.2 Parry & Deflection Window
- Activating Guard within $120\text{ms}$ before an incoming strike triggers a **Perfect Surya Parry**:
  - Nullifies $100\%$ of damage.
  - Reflects incoming enemy projectiles back toward the attacker with $2\times$ damage.
  - Deals $50$ instant Poise Damage to melee attackers, triggering a staggering recoil.
  - Triggers a momentary $60\text{ms}$ time-dilation hit-stop and golden shockwave flash.

---

## 4. Enemy AI & Behavior Tree Architecture

### 4.1 Modular Behavior Tree Engine
Enemies are controlled by a formal Behavior Tree composed of:
- **Composite Nodes:** `Sequence` (AND logic), `Selector` (OR fallback logic), `Parallel` (concurrent evaluation).
- **Decorator Nodes:** `Inverter`, `Repeater`, `CooldownDecorator`, `ConditionDecorator`.
- **Action Nodes:** `ChaseTarget`, `MaintainStandoff`, `FlankTarget`, `RaiseShield`, `ExecuteAttack`, `EvadeThreat`, `IdleWander`.
- **Blackboard:** Centralized state sharing (`targetPosition`, `distanceToTarget`, `isTargetVisible`, `squadRole`, `timeSinceLastHit`).

```
                [Root: Selector]
                       |
       +---------------+---------------+
       |                               |
[Sequence: Staggered Recovery]  [Sequence: Combat Engagement]
       |                               |
       v                               +---------------+---------------+
[Action: Stagger Animation]            |                               |
                                [Selector: Defend/Evade]        [Sequence: Execute Attack]
                                       |                               |
                               +-------+-------+               +-------+-------+
                               |               |               |               |
                         [Raise Shield]   [Dash Evade]   [Check Range]   [Execute Combo]
```

### 4.2 Asura Elite Vanguard (Pincer Squad Tactics)
- **Role:** Heavily armored elite guard operating in squads of 2.
- **Perception:** Sight cone ($120^\circ$, $350\text{px}$ range), Hearing radius ($450\text{px}$).
- **Cooperative Squad AI:**
  - Vanguard Alpha approaches target from the left flank ($\theta - 45^\circ$).
  - Vanguard Beta approaches target from the right flank ($\theta + 45^\circ$).
  - Prevents overlapping attacks; coordinates alternating strikes.
- **Shield Stance:** Directional tower shield blocks $75\%$ of frontal damage unless broken by the Prana-Glaive thrust.
- **Leap Strike:** When target is $>180\text{px}$ away, performs an airborne leap slam landing with a $60\text{px}$ impact shockwave.

### 4.3 Mahishasura Boss Encounter (The Primordial Avatar)
- **Health:** $1000\text{ HP}$, $250\text{ Max Poise}$.
- **Phase 1: Buffalo Titan Stomp (100% - 65% HP)**
  - *Horn Charge:* Locks target direction with glowing red indicator line ($1.0\text{s}$ telegraph), then charges at $650\text{ px/s}$ across the arena.
  - *Earthquake Slam:* Slams spiked club creating an expanding ring of 3 seismic shockwaves.
- **Phase 2: Shadow Morph & Squad Summon (65% - 30% HP)**
  - Morphs into an invulnerable dark cloud and teleports to the arena center.
  - Summons 2 Asura Elite Vanguard flankers.
  - Rains down homing Tamasic Void Orbs from the ceiling.
- **Phase 3: Eclipse Berserk (30% - 0% HP)**
  - Arena lighting shifts to Blood Eclipse (`#EF476F`).
  - Speed increased by $+35\%$.
  - Executes rapid 3-hit infernal leap slams with zero cooldown between charges.
  - Can be staggered for massive critical damage by deflecting his infernal club strikes.

---

## 5. Checkpoints, State Persistence & Progression

- **Checkpoint Pillars:** Sacred Brahmic stele anchors placed before boss gates. Interacting restores full Health, resets Prana, and saves progress into `SaveGameManager` with checksum validation.
- **Defeat & Instant Retry:** When player Health reaches $0$, defeat overlay displays instant retry option (`[ R ]` or `[ Space ]`) which respawns Veer at the active checkpoint in $<50\text{ms}$ with zero reload.
- **Victory Grading:** Evaluates boss clear time, damage taken, and parry count (Rank S: $< 90\text{s}$, 0 deaths; Rank A: $< 150\text{s}$; Rank B: Completed).
