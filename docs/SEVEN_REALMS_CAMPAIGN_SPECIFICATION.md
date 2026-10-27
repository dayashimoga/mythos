# MYTHOS: ASTRA & THE SEVEN REALMS
## Complete Seven-Realm Story & Campaign Specification (Stage Q17)
**Version:** 2.0.0-PROD  
**Classification:** Authoritative Campaign Architecture, Quest Graph & Story Flow Contract  
**Engine:** Godot Engine v4.3.stable.official (3D Action RPG)  
**Status:** Canonical & Released  

---

## 1. Campaign Architecture Overview

The campaign follows protagonist **Veer**, the Consecrated Solar Guardian, along the cosmic vertical axis of Mount Meru across the Seven Lokas (Spheres). The campaign is structured as a declarative, versioned mission graph:

```
Campaign (Mythos: Astra & The Seven Realms)
  ↳ Realm (Seven Lokas: Bhumi -> Antariksha -> Patala -> Svar -> Maharloka -> Tapoloka -> Satyaloka)
      ↳ Chapter (I through VII)
          ↳ Quest (Canonical Mission)
              ↳ Objective (Ordered Tasks with Strict Prerequisites)
                  ↳ Trigger & Action (Player Input, Interaction, Combat, Ritual)
                      ↳ Reward & Progression Flag
                          ↳ Next State Transition
```

### 1.1 Global Campaign Constants & Progression Contract
- **Total Astra Shards:** 28 Shards (Bhumi: 5, Antariksha: 3 [Total 8], Patala: 4 [Total 12], Svar: 4 [Total 16], Maharloka: 4 [Total 20], Tapoloka: 4 [Total 24], Satyaloka: 4 [Total 28]).
- **Campaign Version:** `2.0.0`
- **Tamper Protection:** 32-bit polynomial hash checksum over version, realm, shards, altar status, and high score.
- **Narrative Philosophy:** Dharma against Tamas (entropy/corruption). Adversaries are purified and cleansed, not merely destroyed.

---

## 2. Exhaustive Per-Realm Campaign Specification

### CHAPTER I: BHUMI — THE DAWNING FLARE OF DANDAKA
- **Realm:** Bhumi (The Terrestrial Mortal Realm)
- **Scene File:** `res://scenes/levels/BhumiValley3D.tscn`
- **Mission ID:** `cleansing_of_bhumi`
- **Title:** *Cleansing of the Bhumi Valley: Act I*
- **Introduction & Motivation:** Veer awakens outside the Sunken Temple of Surya-Kund at dawn. Mahishasura's assault on the Kala-Chakra has fractured the Solar Anchor, plunging Mount Meru into twilight. Asura General Kalanemi has seized the mountain watchtower and erected a Tamasic barrier across the valley pass. Veer must seek counsel from Devi Tara to learn how to break the barrier, purify Kalanemi, and consecrate the Sun Altar.
- **Starting Position:** `Vector3(0.0, 0.8, 7.5)` on the processional approach facing the courtyard.
- **Initial Weapon:** Surya-Kripana (Sunsteel Blade).
- **Enemies:** Gatekeeper Sentinel, Grove Sentinel, Asura Warriors (Ridge & Pass), Watchtower Champion, Boss General Kalanemi (4-armed Asura Warlord).
- **Cinematic Events:**
  1. `bhumi_intro`: Panoramic camera sweep of Dandaka Grove and Sunken Temple; Narrator & Devi Tara introduction.
  2. `kalanemi_boss_intro`: Camera focuses on Watchtower summit as Kalanemi drops with earth-shattering crash.
  3. `Bhumi_consecration`: Altar kindles in solar gold; vertical sky beam manifests the Antariksha Sky Portal.
- **Objectives:**
  1. `commune_tara`:
     - *Why:* Receive strategic guidance on dispelling the Tamas barrier.
     - *Where:* Dandaka Sacred Grove `Vector3(-24.0, 1.2, -13.0)`.
     - *How:* Follow the northwest flagstone path past the sal trees and stone lanterns.
     - *Action:* Press `[E]` / `[Y]` to Converse.
     - *Success:* Dialogue sequence completed.
     - *Reward:* +100 XP, unlocks shard collection tracking.
  2. `reclaim_shards`:
     - *Why:* Harness 3 Primal Astra Shards whose combined solar harmonic resonance shatters Kalanemi's barrier.
     - *Where:* Shards in Grove `Vector3(-52.0, 3.5, -40.0)`, Kalyani Reservoir `Vector3(-6.0, 0.2, 45.0)`, and East Foothill `Vector3(12.0, 1.0, 14.0)`.
     - *How:* Dynamic compass needle tracks nearest uncollected shard.
     - *Action:* Physical touch / collision pickup.
     - *Success:* 3 Shards collected (`collected_shards >= 3`).
     - *Reward:* Tamas Barrier at `Vector3(45.0, 10.5, -35.0)` dispelled, opening the Tapas Ridge mountain pass.
  3. `defeat_kalanemi`:
     - *Why:* Cleanse the corrupted Asura General commanding the invasion force.
     - *Where:* Ruined Watchtower Summit `Vector3(55.0, 12.2, -45.0)`.
     - *How:* Ascend Tapas Ridge past the shattered barrier.
     - *Action:* Third-person melee combat, parries, poise break, and finisher.
     - *Success:* Kalanemi HP reaches 0; dissolves into golden ash.
     - *Reward:* +500 XP, drops 50 Solar Essence, unlocks High Sun Altar consecration.
  4. `consecrate_altar`:
     - *Why:* Rekindle the primal solar fire of Surya-Kund to open the ascension path to the upper spheres.
     - *Where:* High Sun Altar `Vector3(0.0, 2.82, -2.2)` inside the temple.
     - *How:* Return from the watchtower to the temple, ascend the 7-step grand staircase through the Mandapa portal.
     - *Action:* Press `[E]` / `[Y]` to Kindle Sun Altar.
     - *Success:* Altar kindled; `consecrated` signal emitted.
     - *Reward:* +1000 XP, unseals Antariksha Sky Portal, save state persists `currentRealm = "Antariksha"`.
- **Next Realm:** Chapter II: Antariksha (`res://scenes/levels/AntarikshaSkyRealm3D.tscn`).

---

### CHAPTER II: ANTARIKSHA — THE AERIAL VAULT OF VAYU
- **Realm:** Antariksha (Atmospheric Ether & Sky Citadels)
- **Scene File:** `res://scenes/levels/AntarikshaSkyRealm3D.tscn`
- **Mission ID:** `liberation_of_antariksha`
- **Title:** *Liberation of Antariksha: Act II*
- **Introduction & Motivation:** Veer emerges into soaring floating islands suspended amidst roaring celestial gales. Lord Matarishvan, ancient lord of storms, has been ensnared by the Void. Veer must glide across updrafts, harmonize the twin Vayu Wind Turbines, pacify Matarishvan, and consecrate the High Gale Peetham.
- **Starting Position:** `Vector3(0.0, 42.0, 0.0)` at the Sky Sanctuary Arrival.
- **Initial Weapon:** Vayu-Chakram (Aerodynamic Wind Discs).
- **Enemies:** Wind Archers, Gale Falcons, Boss Cyclone Titan Matarishvan.
- **Cinematic Events:** `antariksha_intro`, `matarishvan_boss_intro`, `Antariksha_consecration`.
- **Objectives:**
  1. `commune_tara_sky`: Commune with Astral Tara at the Sky Portal.
  2. `restore_windmills`: Harmonize 2 Vayu Wind Turbines across the floating citadels.
  3. `defeat_matarishvan`: Defeat Corrupted Cyclone Titan Matarishvan at the Cyclone Pinnacle.
  4. `consecrate_vayu_peetham`: Consecrate the High Gale Peetham.
- **Next Realm:** Chapter III: Patala (`res://scenes/levels/PatalaUnderworld3D.tscn`).

---

### CHAPTER III: PATALA — THE SUBTERRANEAN SERPENT VAULTS
- **Realm:** Patala (Subterranean Caverns & Serpent Foundations)
- **Scene File:** `res://scenes/levels/PatalaUnderworld3D.tscn`
- **Mission ID:** `cleansing_of_patala`
- **Title:** *Cleansing of Patala: Act III*
- **Introduction & Motivation:** Veer descends into the basalt caverns of King Vasuki where emerald rivers of toxic venom flow beneath glowing stalactites. Shesha's Tormented Echo guards the subterranean vault. Veer must bounce across fungal caps, defeat the patrolling Naga Guardians, cleanse Shesha, and consecrate the Nagamani Peetham.
- **Starting Position:** `Vector3(0.0, 15.0, 30.0)` at the Subterranean Descent.
- **Initial Weapon:** Vasuki-Trisula (Subterranean Venom Spear).
- **Enemies:** Naga Spitters, Naga Constrictors, Boss Shesha's Tormented Echo (7-headed Cobra King).
- **Cinematic Events:** `patala_intro`, `shesha_boss_intro`, `Patala_consecration`.
- **Objectives:**
  1. `commune_tara_subterranean`: Commune with Astral Tara at the descent.
  2. `defeat_naga_guardians`: Defeat 3 Naga Guardians patrolling the serpent chambers.
  3. `defeat_shesha_echo`: Defeat Shesha's Tormented Echo in the Great Basin.
  4. `consecrate_vasuki_peetham`: Consecrate the Sacred Nagamani Peetham.
- **Next Realm:** Chapter IV: Svar (`res://scenes/levels/SvarSolarCitadel3D.tscn`).

---

### CHAPTER IV: SVAR (SVARGA) — THE CELESTIAL SOLAR CITADELS
- **Realm:** Svar / Svarga (The Celestial Citadels of Savitr)
- **Scene File:** `res://scenes/levels/SvarSolarCitadel3D.tscn`
- **Mission ID:** `ascension_to_svar`
- **Title:** *Ascension to Svarloka: Act IV*
- **Introduction & Motivation:** Veer ascends to gleaming white marble citadels trimmed in 24k gold floating above golden cloud seas. The light bridges have severed. Veer must align the optical Surya Prisms, cross into the Apex Colosseum, purify the Corrupted Sun Titan Avatara, and consecrate the Grand Solar Mahapeetham.
- **Starting Position:** `Vector3(0.0, 20.0, 50.0)` on the Entry Bastion.
- **Initial Weapon:** Savitr-Surya-Gada (Heavy Sun War-Hammer).
- **Enemies:** Surya Guardians (Phalanx sentinels with tower shields), Solar Gryphons, Boss Sun Titan Avatara (4-armed solar deity).
- **Cinematic Events:** `svar_intro`, `surya_boss_intro`, `Svar_consecration`.
- **Objectives:**
  1. `commune_tara_solar`: Commune with Astral Tara at the Citadel Gate.
  2. `align_surya_prisms`: Align 2 Sacred Surya Prisms to manifest solar light bridges.
  3. `defeat_surya_avatara`: Defeat Corrupted Sun Titan Avatara.
  4. `consecrate_surya_mahapeetham`: Consecrate the Grand Solar Mahapeetham.
- **Next Realm:** Chapter V: Maharloka (`res://scenes/levels/MaharlokaSanctuary3D.tscn`).

---

### CHAPTER V: MAHARLOKA — THE COSMIC ASTRAL LIBRARIES
- **Realm:** Maharloka (The High Orbit of Ascended Sages)
- **Scene File:** `res://scenes/levels/MaharlokaSanctuary3D.tscn`
- **Mission ID:** `wisdom_of_maharloka`
- **Title:** *Wisdom of Maharloka: Act V*
- **Introduction & Motivation:** Veer reaches deep indigo cosmos where monumental archive stacks hold eternal Vedic hymns. Veer must soar upon Astral Levitation Glyphs, commune with the ancient Scripture Pedestals, withstand Brihaspati's intellect trials, and attune the Sage Core at the Mahar Mandala.
- **Starting Position:** `Vector3(0.0, 10.0, 40.0)` at the Terrace of the Sages.
- **Initial Weapon:** Brahma-Lipi-Danda (Astral Sage Staff).
- **Enemies:** Scripture Golems, Astral Rishis, Boss Brihaspati's Astral Avatar.
- **Cinematic Events:** `maharloka_intro`, `brihaspati_boss_intro`, `Maharloka_consecration`.
- **Objectives:**
  1. `commune_tara_astral`: Commune with Astral Tara at the Library Terrace.
  2. `commune_scriptures`: Commune with 2 Ancient Vedic Scripture Pedestals.
  3. `defeat_brihaspati`: Defeat Brihaspati's Astral Avatar in the Observatory.
  4. `consecrate_mahar_mandala`: Attune the Sage Core at the Sacred Mahar Mandala.
- **Next Realm:** Chapter VI: Tapoloka (`res://scenes/levels/TapolokaForge3D.tscn`).

---

### CHAPTER VI: TAPOLOKA — AGNI'S PRIMORDIAL FORGE
- **Realm:** Tapoloka / Janaloka (The Volcanic Crucible of Ascetic Fire)
- **Scene File:** `res://scenes/levels/TapolokaForge3D.tscn`
- **Mission ID:** `purification_of_tapoloka`
- **Title:** *Purification of Tapoloka: Act VI*
- **Introduction & Motivation:** Veer enters the primordial volcanic calderas where cosmic weapons are forged in rivers of liquid gold. Veer must ride Magma Pressure Geysers, attune the twin Primordial Anvils of Agni, defeat the raging Fire Titan Agni Rudra, and ignite the Eternal Tapas Flame at the Tapo Peetham.
- **Starting Position:** `Vector3(0.0, 12.0, 45.0)` on the Caldera Threshold.
- **Initial Weapon:** Agni-Rudra-Trisula (Primordial Flame Spear).
- **Enemies:** Agni Berserkers, Magma Hounds, Boss Fire Titan Agni Rudra.
- **Cinematic Events:** `tapoloka_intro`, `agni_boss_intro`, `Tapoloka_consecration`.
- **Objectives:**
  1. `commune_tara_forge`: Commune with Astral Tara at the Caldera Threshold.
  2. `attune_forges`: Attune 2 Primordial Anvil Forges of Agni.
  3. `defeat_agni_rudra`: Defeat Primordial Fire Titan Agni Rudra.
  4. `consecrate_tapo_peetham`: Ignite the Eternal Tapas Flame at the Tapo Peetham.
- **Next Realm:** Chapter VII: Satyaloka (`res://scenes/levels/SatyalokaApex3D.tscn`).

---

### CHAPTER VII: SATYALOKA — THE COSMIC DHARMA APEX & MOKSHA
- **Realm:** Satyaloka / Brahmaloka (The Transcendent Apex of Reality)
- **Scene File:** `res://scenes/levels/SatyalokaApex3D.tscn`
- **Mission ID:** `ascension_to_satyaloka`
- **Title:** *Ascension to Satyaloka: Act VII — The Cosmic Wheel of Dharma*
- **Introduction & Motivation:** Veer reaches the boundary of reality where an infinite golden lotus blooms across iridescent space. The monumental Dharmachakra has halted, fractured by the shadow of Mahapralaya. Veer must align the Cosmic Resonators, liberate the Four-Headed Creator Titan Brahma Avatara, and place all 28 reunited Astra Shards into the Moksha Mahapeetham to achieve universal liberation.
- **Starting Position:** `Vector3(0.0, 10.0, 60.0)` at the Lotus of Infinite Reality.
- **Initial Weapon:** Moksha-Brahmastra (Transcendent Cosmic Blade).
- **Enemies:** Dharma Sentinels, Moksha Seraphs, Boss Brahma Avatara (4-faced Creator Titan).
- **Cinematic Events:** `satyaloka_intro`, `brahma_boss_intro`, `satyaloka_campaign_resolution`.
- **Objectives:**
  1. `commune_tara_satya`: Commune with Astral Tara at the Lotus Apex.
  2. `align_dharmachakras`: Align 2 Cosmic Dharmachakra Resonators across the Void.
  3. `defeat_brahma_avatara`: Liberate Four-Headed Creator Titan Brahma Avatara from Mahapralaya.
  4. `consecrate_moksha_peetham`: Attune the Supreme Moksha Mahapeetham with all 28 Astra Shards.
- **Reward:** Grand Campaign Resolution & Moksha. The Seven Spheres are restored, the Dharmachakra resumes its eternal revolution, and peace descends upon Mount Meru.
