class_name CampaignGraph
extends RefCounted

## Authoritative Declarative Campaign State Machine & Seven-Realm Quest Graph
## Stage Q17: Complete Story & Gameplay Sequencing Contract (v2.0.0)
##
## Hierarchy:
## Campaign (Mythos) -> Realm -> Chapter -> Quest (Mission) -> Objective -> Trigger -> Action -> Reward -> Next State

const VERSION: String = "2.0.0"

class CampaignObjective:
	var id: String = ""
	var title: String = ""
	var description: String = ""
	var why: String = ""
	var where_region: String = ""
	var where_coords: Vector3 = Vector3.ZERO
	var how_to_reach: String = ""
	var action_type: String = "INTERACT" # INTERACT, COLLECT, DEFEAT, CONSECRATE, PUZZLE
	var action_prompt: String = ""
	var trigger_type: String = ""
	var target_count: int = 1
	var current_count: int = 0
	var is_completed: bool = false
	var reward_description: String = ""
	var next_objective_id: String = ""

	func _init(p_id: String, p_title: String, p_desc: String, p_why: String,
	           p_region: String, p_coords: Vector3, p_reach: String,
	           p_action_type: String, p_prompt: String, p_trigger: String,
	           p_target: int, p_reward: String, p_next: String = "") -> void:
		id = p_id
		title = p_title
		description = p_desc
		why = p_why
		where_region = p_region
		where_coords = p_coords
		how_to_reach = p_reach
		action_type = p_action_type
		action_prompt = p_prompt
		trigger_type = p_trigger
		target_count = p_target
		current_count = 0
		is_completed = false
		reward_description = p_reward
		next_objective_id = p_next

	func to_dict() -> Dictionary:
		return {
			"id": id,
			"title": title,
			"description": description,
			"why": why,
			"where_region": where_region,
			"where_coords": [where_coords.x, where_coords.y, where_coords.z],
			"how_to_reach": how_to_reach,
			"action_type": action_type,
			"action_prompt": action_prompt,
			"trigger_type": trigger_type,
			"target_count": target_count,
			"current_count": current_count,
			"is_completed": is_completed,
			"reward_description": reward_description,
			"next_objective_id": next_objective_id
		}

class CampaignChapter:
	var index: int = 1
	var id: String = ""
	var realm_name: String = ""
	var title: String = ""
	var description: String = ""
	var mission_id: String = ""
	var scene_path: String = ""
	var intro_cutscene: String = ""
	var starting_coords: Vector3 = Vector3.ZERO
	var initial_weapon: String = ""
	var target_shards: int = 5
	var prerequisite_realm: String = ""
	var next_realm: String = ""
	var objectives: Array[CampaignObjective] = []

	func _init(p_idx: int, p_id: String, p_realm: String, p_title: String, p_desc: String,
	           p_mission: String, p_scene: String, p_cutscene: String,
	           p_start: Vector3, p_weapon: String, p_shards: int,
	           p_prereq: String, p_next: String) -> void:
		index = p_idx
		id = p_id
		realm_name = p_realm
		title = p_title
		description = p_desc
		mission_id = p_mission
		scene_path = p_scene
		intro_cutscene = p_cutscene
		starting_coords = p_start
		initial_weapon = p_weapon
		target_shards = p_shards
		prerequisite_realm = p_prereq
		next_realm = p_next
		objectives = []

# Registry
static var _chapters: Dictionary = {} # mission_id or chapter_id -> CampaignChapter
static var _chapters_ordered: Array[CampaignChapter] = []
static var _initialized: bool = false

# Runtime campaign replay tracking
static var is_chapter_replay: bool = false
static var active_replay_chapter: String = ""

static func _ensure_initialized() -> void:
	if _initialized:
		return
	_build_canonical_chapters()
	_initialized = true

static func _build_canonical_chapters() -> void:
	_chapters.clear()
	_chapters_ordered.clear()

	# -------------------------------------------------------------------------
	# CHAPTER I: BHUMI
	# -------------------------------------------------------------------------
	var ch1 = CampaignChapter.new(
		1, "bhumi", "Bhumi", "The Dawning Flare of Dandaka",
		"Seek guidance from Devi Tara, reclaim 3 Primal Astra Shards, dispel the Tamas Barrier, defeat General Kalanemi, and consecrate the High Sun Altar of Surya-Kund.",
		"cleansing_of_bhumi", "res://scenes/levels/BhumiValley3D.tscn", "bhumi_intro",
		Vector3(0.0, 0.8, 7.5), "Surya-Kripana", 5, "", "Antariksha"
	)
	ch1.objectives.append(CampaignObjective.new(
		"commune_tara", "Seek Counsel from Devi Tara",
		"Seek counsel from Devi Tara in Dandaka Grove",
		"Receive divine guidance on how to dispel the Asura Tamas Barrier blocking the mountain ridge.",
		"Dandaka Sacred Grove", Vector3(-24.0, 1.2, -13.0),
		"Follow the northwestern flagstone path past the ancient banyans and stone lanterns.",
		"INTERACT", "Press [E] / [Y] to Commune with Devi Tara", "DIALOGUE_COMPLETE",
		1, "+100 XP, unlocks shard collection resonance", "reclaim_shards"
	))
	ch1.objectives.append(CampaignObjective.new(
		"reclaim_shards", "Reclaim 3 Primal Astra Shards",
		"Reclaim 3 Primal Astra Shards across Bhumi",
		"Harmonize 3 solar fragments to shatter the Tamas Barrier erected by General Kalanemi.",
		"Bhumi Valley (Grove & Kalyani)", Vector3(-6.0, 0.2, 45.0),
		"Use your dynamic compass needle to track the nearest uncollected shard across the valley.",
		"COLLECT", "Touch / Pick up floating Astra Shard", "ITEM_PICKUP",
		3, "Shatters Tamas Barrier, opens Tapas Ridge pass", "defeat_kalanemi"
	))
	ch1.objectives.append(CampaignObjective.new(
		"defeat_kalanemi", "Defeat General Kalanemi",
		"Defeat General Kalanemi at the Watchtower",
		"Cleanse the corrupted four-armed Asura General commanding the invasion vanguard.",
		"Ruined Watchtower Summit", Vector3(55.0, 12.2, -45.0),
		"Ascend Tapas Ridge through the dispelled barrier pass to the fortress summit.",
		"DEFEAT", "Parry cleaves, break poise, and strike finisher", "BOSS_DEFEATED",
		1, "+500 XP, cleanses Kalanemi, unlocks Sun Altar consecration", "consecrate_altar"
	))
	ch1.objectives.append(CampaignObjective.new(
		"consecrate_altar", "Consecrate the High Sun Altar",
		"Consecrate the High Sun Altar of Surya-Kund",
		"Rekindle the primordial solar flame to open the ascension portal to the upper spheres.",
		"Sanctum of Surya-Kund (Temple)", Vector3(0.0, 2.82, -2.2),
		"Return to the temple, ascend the 7-step grand staircase into the inner sanctum.",
		"CONSECRATE", "Press [E] / [Y] to Kindle Sun Altar", "SHRINE_ATTUNED",
		1, "Opens Sky Portal to Antariksha, completes Chapter I", ""
	))
	_register_chapter(ch1)

	# -------------------------------------------------------------------------
	# CHAPTER II: ANTARIKSHA
	# -------------------------------------------------------------------------
	var ch2 = CampaignChapter.new(
		2, "antariksha", "Antariksha", "The Aerial Vault of Vayu",
		"Traverse soaring floating citadels, harmonize the Vayu Wind Turbines, defeat Cyclone Titan Matarishvan, and consecrate the High Gale Peetham.",
		"liberation_of_antariksha", "res://scenes/levels/AntarikshaSkyRealm3D.tscn", "antariksha_intro",
		Vector3(0.0, 42.0, 0.0), "Vayu-Chakram", 8, "Bhumi", "Patala"
	)
	ch2.objectives.append(CampaignObjective.new(
		"commune_tara_sky", "Commune with Astral Tara",
		"Commune with Astral Tara at the Sky Portal",
		"Learn how to harness the aerial wind currents and tether to celestial grapple rings.",
		"Sky Sanctuary Arrival", Vector3(0.0, 42.0, 0.0),
		"Step forward from the arrival portal to the hovering astral oracle.",
		"INTERACT", "Press [E] / [Y] to Converse with Tara", "DIALOGUE_COMPLETE",
		1, "+150 XP, activates Prana Glider and Grapple", "restore_windmills"
	))
	ch2.objectives.append(CampaignObjective.new(
		"restore_windmills", "Harmonize 2 Vayu Wind Turbines",
		"Harmonize 2 Vayu Wind Turbines across the Citadels",
		"Calm the tempest vortexes to create stable updrafts to the Cyclone Pinnacle.",
		"Floating Sky Bastions", Vector3(-20.0, 55.0, -35.0),
		"Glide across thermal air currents and grapple to golden celestial rings.",
		"PUZZLE", "Press [E] / [Y] to Harmonize Wind Turbine", "TURBINE_HARMONIZED",
		2, "Unseals Cyclone Pinnacle updraft beam", "defeat_matarishvan"
	))
	ch2.objectives.append(CampaignObjective.new(
		"defeat_matarishvan", "Defeat Cyclone Titan Matarishvan",
		"Defeat Corrupted Cyclone Titan Matarishvan",
		"Pacify the storm lord ensnared by the Void at the apex of the tempest.",
		"Cyclone Pinnacle", Vector3(0.0, 75.0, -130.0),
		"Ascend the central cyclone beam to the monumental storm arena.",
		"DEFEAT", "Dodge gale blades, strike the tempest core", "BOSS_DEFEATED",
		1, "+750 XP, pacifies Matarishvan, unlocks Gale Peetham", "consecrate_vayu_peetham"
	))
	ch2.objectives.append(CampaignObjective.new(
		"consecrate_vayu_peetham", "Consecrate the High Gale Peetham",
		"Consecrate the High Gale Peetham at the Pinnacle",
		"Harmonize the atmospheric sphere and open the abyssal portal to Patala.",
		"Cyclone Pinnacle Altar", Vector3(0.0, 78.0, -145.0),
		"Ascend the golden dais at the north edge of the storm arena.",
		"CONSECRATE", "Press [E] / [Y] to Consecrate Peetham", "SHRINE_ATTUNED",
		1, "Opens Subterranean Portal to Patala, completes Chapter II", ""
	))
	_register_chapter(ch2)

	# -------------------------------------------------------------------------
	# CHAPTER III: PATALA
	# -------------------------------------------------------------------------
	var ch3 = CampaignChapter.new(
		3, "patala", "Patala", "The Subterranean Serpent Vaults",
		"Descend into basalt serpent caverns, leap across venom rivers on giant fungal caps, defeat Shesha's Tormented Echo, and consecrate the Nagamani Peetham.",
		"cleansing_of_patala", "res://scenes/levels/PatalaUnderworld3D.tscn", "patala_intro",
		Vector3(0.0, 15.0, 30.0), "Vasuki-Trisula", 12, "Antariksha", "Svar"
	)
	ch3.objectives.append(CampaignObjective.new(
		"commune_tara_subterranean", "Commune with Astral Tara",
		"Commune with Astral Tara at the Subterranean Descent",
		"Learn to navigate toxic venom rivers and bypass serpent sentinels.",
		"Subterranean Descent", Vector3(0.0, 15.0, 30.0),
		"Approach the glowing cyan oracle beside the entrance stalagmites.",
		"INTERACT", "Press [E] / [Y] to Converse with Tara", "DIALOGUE_COMPLETE",
		1, "+200 XP, unlocks fungal springboard traversal", "defeat_naga_guardians"
	))
	ch3.objectives.append(CampaignObjective.new(
		"defeat_naga_guardians", "Defeat 3 Naga Guardians",
		"Defeat 3 Naga Guardians patrolling the serpent chambers",
		"Clear the subterranean venom sentinels guarding the passage to Shesha's vault.",
		"Basalt Cavern Corridors", Vector3(-15.0, 6.0, 0.0),
		"Bounce across venom chasms on bioluminescent mushroom caps.",
		"DEFEAT", "Defeat 3 patrolling Naga Spitters / Constrictors", "ENEMY_DEFEATED",
		3, "Dispels the Nagamani serpent ward", "defeat_shesha_echo"
	))
	ch3.objectives.append(CampaignObjective.new(
		"defeat_shesha_echo", "Defeat Shesha's Tormented Echo",
		"Defeat Shesha's Tormented Echo",
		"Soothe the grief of the 7-hooded serpent king corrupted by void sorrow.",
		"Great Serpent Basin", Vector3(0.0, 4.0, -75.0),
		"Cross the central bone bridge into the monumental subterranean vault.",
		"DEFEAT", "Parry sweeping tail strikes, shatter the grief crest", "BOSS_DEFEATED",
		1, "+1000 XP, cleanses Shesha, unlocks Nagamani Peetham", "consecrate_vasuki_peetham"
	))
	ch3.objectives.append(CampaignObjective.new(
		"consecrate_vasuki_peetham", "Consecrate the Nagamani Peetham",
		"Consecrate the Sacred Nagamani Peetham",
		"Transmute the subterranean venom into clear amrita and open the ascension path to Svar.",
		"Vasuki Sacred Dais", Vector3(0.0, 6.0, -90.0),
		"Ascend the coiled serpent altar platform.",
		"CONSECRATE", "Press [E] / [Y] to Consecrate Nagamani Peetham", "SHRINE_ATTUNED",
		1, "Opens Ascension Beam to Svar, completes Chapter III", ""
	))
	_register_chapter(ch3)

	# -------------------------------------------------------------------------
	# CHAPTER IV: SVAR (SVARGA)
	# -------------------------------------------------------------------------
	var ch4 = CampaignChapter.new(
		4, "svar", "Svar", "The Celestial Solar Citadels",
		"Ascend into the golden citadels of Savitr, align the sacred Surya Prisms to energize light bridges, defeat the Sun Titan Avatara, and consecrate the Grand Solar Mahapeetham.",
		"ascension_to_svar", "res://scenes/levels/SvarSolarCitadel3D.tscn", "svar_intro",
		Vector3(0.0, 20.0, 50.0), "Savitr-Surya-Gada", 16, "Patala", "Maharloka"
	)
	ch4.objectives.append(CampaignObjective.new(
		"commune_tara_solar", "Commune with Astral Tara",
		"Commune with Astral Tara at the Solar Citadel Gates",
		"Discover how to refract solar rays through optical prisms to manifest light bridges.",
		"Entry Bastion", Vector3(0.0, 20.0, 50.0),
		"Approach the golden balustrades overlooking the celestial cloud sea.",
		"INTERACT", "Press [E] / [Y] to Converse with Tara", "DIALOGUE_COMPLETE",
		1, "+250 XP, unlocks Surya Prism interaction", "align_surya_prisms"
	))
	ch4.objectives.append(CampaignObjective.new(
		"align_surya_prisms", "Align 2 Sacred Surya Prisms",
		"Align 2 Sacred Surya Prisms across the citadels",
		"Channel concentrated solar beams to bridge the sky bastions.",
		"Mid Bastions", Vector3(-15.0, 25.0, -10.0),
		"Ascend the marble towers and rotate the optical prism pedestals.",
		"PUZZLE", "Press [E] / [Y] to Rotate Surya Prism", "PRISM_ALIGNED",
		2, "Manifests solid Solar Light Bridges to the Apex Colosseum", "defeat_surya_avatara"
	))
	ch4.objectives.append(CampaignObjective.new(
		"defeat_surya_avatara", "Defeat Sun Titan Avatara",
		"Defeat Corrupted Sun Titan Avatara",
		"Purify the four-armed solar titan wielding dual war hammers during supernova flare.",
		"Apex Colosseum", Vector3(0.0, 15.0, -40.0),
		"Cross the golden light bridge into the grand solar colosseum.",
		"DEFEAT", "Parry heavy war hammer cleaves, break solar armor", "BOSS_DEFEATED",
		1, "+1500 XP, frees Sun Titan, unlocks Grand Mahapeetham", "consecrate_surya_mahapeetham"
	))
	ch4.objectives.append(CampaignObjective.new(
		"consecrate_surya_mahapeetham", "Consecrate the Solar Mahapeetham",
		"Consecrate the Grand Solar Mahapeetham",
		"Harmonize the celestial solar citadel and manifest the ascent portal to Maharloka.",
		"High Solar Dais", Vector3(0.0, 18.0, -60.0),
		"Ascend the golden sun throne steps.",
		"CONSECRATE", "Press [E] / [Y] to Consecrate Mahapeetham", "SHRINE_ATTUNED",
		1, "Opens Ascent Portal to Maharloka, completes Chapter IV", ""
	))
	_register_chapter(ch4)

	# -------------------------------------------------------------------------
	# CHAPTER V: MAHARLOKA
	# -------------------------------------------------------------------------
	var ch5 = CampaignChapter.new(
		5, "maharloka", "Maharloka", "The Cosmic Astral Libraries",
		"Scale celestial archive tiers on levitation glyphs, commune with Vedic Scripture Pedestals, defeat Brihaspati's Astral Avatar, and attune the Sage Core at the Mahar Mandala.",
		"wisdom_of_maharloka", "res://scenes/levels/MaharlokaSanctuary3D.tscn", "maharloka_intro",
		Vector3(0.0, 10.0, 40.0), "Brahma-Lipi-Danda", 20, "Svar", "Tapoloka"
	)
	ch5.objectives.append(CampaignObjective.new(
		"commune_tara_astral", "Commune with Astral Tara",
		"Commune with Astral Tara at the Astral Library Terrace",
		"Receive instruction on deciphering cosmic glyphs and operating astral levitation lifts.",
		"Terrace of the Sages", Vector3(0.0, 10.0, 40.0),
		"Step onto the translucent star terrace to the glowing oracle.",
		"INTERACT", "Press [E] / [Y] to Converse with Tara", "DIALOGUE_COMPLETE",
		1, "+300 XP, unlocks levitation glyph activation", "commune_scriptures"
	))
	ch5.objectives.append(CampaignObjective.new(
		"commune_scriptures", "Commune with 2 Scripture Pedestals",
		"Commune with 2 Ancient Vedic Scripture Pedestals",
		"Harmonize the fractured cosmic knowledge preserving universal truth.",
		"Elevated Archive Tiers", Vector3(-12.0, 22.0, 5.0),
		"Ride Astral Levitation Glyphs upward to the soaring bookstack balconies.",
		"PUZZLE", "Press [E] / [Y] to Attune Scripture Pedestal", "SCRIPTURE_ATTUNED",
		2, "Unlocks the Grand Observatory barrier", "defeat_brihaspati"
	))
	ch5.objectives.append(CampaignObjective.new(
		"defeat_brihaspati", "Defeat Brihaspati's Astral Avatar",
		"Defeat Brihaspati's Astral Avatar in the Observatory",
		"Withstand the mental trials and cosmic knowledge bolts of the Divine Preceptor.",
		"Grand Observatory", Vector3(0.0, 15.0, -30.0),
		"Enter the star-vaulted observatory dome.",
		"DEFEAT", "Deflect astral bolts, prove spiritual fortitude", "BOSS_DEFEATED",
		1, "+2000 XP, earns Sage's cosmic blessing, unlocks Mahar Mandala", "consecrate_mahar_mandala"
	))
	ch5.objectives.append(CampaignObjective.new(
		"consecrate_mahar_mandala", "Attune the Sacred Mahar Mandala",
		"Attune the Sage Core at the Sacred Mahar Mandala",
		"Anchor cosmic knowledge and ignite the volcanic gateway to Tapoloka.",
		"Mahar Mandala Center", Vector3(0.0, 18.0, -50.0),
		"Approach the concentric Sanskrit mandala ring at the observatory apex.",
		"CONSECRATE", "Press [E] / [Y] to Attune Mahar Mandala", "SHRINE_ATTUNED",
		1, "Opens Volcanic Gateway to Tapoloka, completes Chapter V", ""
	))
	_register_chapter(ch5)

	# -------------------------------------------------------------------------
	# CHAPTER VI: TAPOLOKA
	# -------------------------------------------------------------------------
	var ch6 = CampaignChapter.new(
		6, "tapoloka", "Tapoloka", "Agni's Primordial Forge",
		"Navigate volcanic calderas via Magma Pressure Geysers, attune 2 Primordial Anvil Forges of Agni, defeat Fire Titan Agni Rudra, and ignite the Eternal Tapas Flame at the Tapo Peetham.",
		"purification_of_tapoloka", "res://scenes/levels/TapolokaForge3D.tscn", "tapoloka_intro",
		Vector3(0.0, 12.0, 45.0), "Agni-Rudra-Trisula", 24, "Maharloka", "Satyaloka"
	)
	ch6.objectives.append(CampaignObjective.new(
		"commune_tara_forge", "Commune with Astral Tara",
		"Commune with Astral Tara at the Caldera Threshold",
		"Learn to time magma geyser eruptions to cross molten golden fissures.",
		"Caldera Threshold", Vector3(0.0, 12.0, 45.0),
		"Meet Tara enveloped in a protective cooling mist aura.",
		"INTERACT", "Press [E] / [Y] to Converse with Tara", "DIALOGUE_COMPLETE",
		1, "+400 XP, unlocks magma geyser super-leaps", "attune_forges"
	))
	ch6.objectives.append(CampaignObjective.new(
		"attune_forges", "Attune 2 Primordial Anvil Forges",
		"Attune 2 Primordial Anvil Forges of Agni",
		"Reignite the cosmic furnaces that forge divine celestial armaments.",
		"Volcanic Crucible Chasms", Vector3(20.0, 18.0, 10.0),
		"Ride superheated steam geysers across the boiling molten chasms.",
		"PUZZLE", "Press [E] / [Y] to Strike Anvil of Agni", "FORGE_ATTUNED",
		2, "Dispels firestorm barrier around the Crucible Heart", "defeat_agni_rudra"
	))
	ch6.objectives.append(CampaignObjective.new(
		"defeat_agni_rudra", "Defeat Fire Titan Agni Rudra",
		"Defeat Primordial Fire Titan Agni Rudra",
		"Quench the wrath of the primordial fire titan with disciplined martial mastery.",
		"Crucible Heart", Vector3(0.0, 10.0, -30.0),
		"Step onto the central obsidian anvil platform.",
		"DEFEAT", "Dodge fire vortexes, parry flame thrusts, break poise", "BOSS_DEFEATED",
		1, "+2500 XP, tempers the flame, unlocks Tapo Peetham", "consecrate_tapo_peetham"
	))
	ch6.objectives.append(CampaignObjective.new(
		"consecrate_tapo_peetham", "Ignite the Tapo Peetham",
		"Ignite the Eternal Tapas Flame at the Tapo Peetham",
		"Focus the primordial fire into a crystalline lotus beam pointing to Satyaloka.",
		"Tapo Peetham Dais", Vector3(0.0, 14.0, -50.0),
		"Ascend the tiered obsidian altar.",
		"CONSECRATE", "Press [E] / [Y] to Ignite Tapo Peetham", "SHRINE_ATTUNED",
		1, "Manifests Transcendent Beam to Satyaloka, completes Chapter VI", ""
	))
	_register_chapter(ch6)

	# -------------------------------------------------------------------------
	# CHAPTER VII: SATYALOKA
	# -------------------------------------------------------------------------
	var ch7 = CampaignChapter.new(
		7, "satyaloka", "Satyaloka", "The Cosmic Wheel of Dharma",
		"Ascend to the boundary of reality, align 2 Cosmic Dharmachakra Resonators, liberate Four-Headed Creator Titan Brahma Avatara, and attune the Supreme Moksha Mahapeetham with all 28 Astra Shards.",
		"ascension_to_satyaloka", "res://scenes/levels/SatyalokaApex3D.tscn", "satyaloka_intro",
		Vector3(0.0, 10.0, 60.0), "Moksha-Brahmastra", 28, "Tapoloka", ""
	)
	ch7.objectives.append(CampaignObjective.new(
		"commune_tara_satya", "Commune with Fully Manifest Tara",
		"Commune with Astral Tara at the Lotus Apex of Satyaloka",
		"Witness the culmination of your journey and prepare to turn the Cosmic Wheel.",
		"Lotus Apex Entrance", Vector3(0.0, 10.0, 60.0),
		"Step onto the unfolding golden lotus petal.",
		"INTERACT", "Press [E] / [Y] to Converse with Tara", "DIALOGUE_COMPLETE",
		1, "+500 XP, unlocks Dharmachakra resonator alignment", "align_dharmachakras"
	))
	ch7.objectives.append(CampaignObjective.new(
		"align_dharmachakras", "Align 2 Dharmachakra Resonators",
		"Align 2 Cosmic Dharmachakra Resonators across the Void",
		"Materialize the Transcendent Light Bridges across iridescent void space.",
		"Apex Petal Nodes", Vector3(-25.0, 18.0, 10.0),
		"Walk along the outer lotus rim to the celestial resonator pedestals.",
		"PUZZLE", "Press [E] / [Y] to Align Dharmachakra Resonator", "RESONATOR_ALIGNED",
		2, "Manifests the Transcendent Bridges to the Cosmic Core", "defeat_brahma_avatara"
	))
	ch7.objectives.append(CampaignObjective.new(
		"defeat_brahma_avatara", "Liberate Brahma Avatara",
		"Liberate Four-Headed Creator Titan Brahma Avatara",
		"Shatter the dark Mahapralaya shroud encircling the Creator Titan.",
		"Cosmic Lotus Core", Vector3(0.0, 15.0, -30.0),
		"Cross the transcendent starlight bridge to the central lotus core.",
		"DEFEAT", "Parry reality-bending dissolution waves, strike pure light", "BOSS_DEFEATED",
		1, "+5000 XP, liberates Brahma Avatara, unlocks Moksha Mahapeetham", "consecrate_moksha_peetham"
	))
	ch7.objectives.append(CampaignObjective.new(
		"consecrate_moksha_peetham", "Attune Supreme Moksha Mahapeetham",
		"Attune the Supreme Moksha Mahapeetham and Attain Cosmic Liberation",
		"Place all 28 reunited Astra Shards into the central mandala to turn the Wheel of Dharma for eternity.",
		"Supreme Moksha Mahapeetham", Vector3(0.0, 20.0, -60.0),
		"Ascend the golden steps to the summit of the blooming cosmic lotus.",
		"CONSECRATE", "Press [E] / [Y] to Attune Moksha Mahapeetham", "CAMPAIGN_RESOLVED",
		1, "UNIVERSAL MOKSHA: Restores cosmic balance across all Seven Spheres", ""
	))
	_register_chapter(ch7)

static func _register_chapter(ch: CampaignChapter) -> void:
	_chapters[ch.id] = ch
	_chapters[ch.mission_id] = ch
	_chapters[str(ch.index)] = ch
	_chapters_ordered.append(ch)

static func get_all_chapters() -> Array[CampaignChapter]:
	_ensure_initialized()
	return _chapters_ordered

static func get_chapter(key) -> CampaignChapter:
	_ensure_initialized()
	var k_str = str(key).to_lower()
	return _chapters.get(k_str, null)

static func get_objective(mission_id: String, objective_id: String) -> CampaignObjective:
	_ensure_initialized()
	var ch = get_chapter(mission_id)
	if not ch:
		return null
	for obj in ch.objectives:
		if obj.id == objective_id:
			return obj
	return null

static func get_first_objective(mission_id: String) -> CampaignObjective:
	_ensure_initialized()
	var ch = get_chapter(mission_id)
	if ch and not ch.objectives.is_empty():
		return ch.objectives[0]
	return null

static func serialize_campaign_state(current_mission: String, completed_obj_ids: Array[String], current_counts: Dictionary) -> Dictionary:
	return {
		"version": VERSION,
		"active_mission": current_mission,
		"completed_objectives": completed_obj_ids,
		"objective_counts": current_counts,
		"is_replay": is_chapter_replay,
		"replay_chapter": active_replay_chapter
	}

static func deserialize_campaign_state(quest_mgr: RefCounted, state: Dictionary) -> bool:
	if not quest_mgr or state.is_empty():
		return false

	var mission_id = state.get("active_mission", "")
	if mission_id.is_empty():
		return false

	if quest_mgr.has_method("start_mission"):
		quest_mgr.start_mission(mission_id)

	var mission = quest_mgr.get_mission(mission_id) if quest_mgr.has_method("get_mission") else null
	if not mission:
		return false

	var completed_list = state.get("completed_objectives", [])
	var counts_dict = state.get("objective_counts", {})

	for obj in mission.objectives:
		if counts_dict.has(obj.id):
			obj.current_count = int(counts_dict[obj.id])
		if completed_list.has(obj.id):
			obj.is_completed = true
			obj.current_count = obj.target_count

	is_chapter_replay = bool(state.get("is_replay", false))
	active_replay_chapter = str(state.get("replay_chapter", ""))
	return true
