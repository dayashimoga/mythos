class_name QuestManager
extends RefCounted

## Domain Quest & Narrative State Machine ported from legacy QuestManager.ts
## Manages Sanctum Calibration, Shard collection, Altar consecration, and progression flags.

enum Status {
	LOCKED,
	AVAILABLE,
	ACTIVE,
	COMPLETED,
	FAILED
}

class Objective:
	var id: String = ""
	var description: String = ""
	var target_count: int = 1
	var current_count: int = 0
	var is_completed: bool = false
	var is_optional: bool = false

	func _init(p_id: String, p_desc: String, p_target: int = 1, p_optional: bool = false) -> void:
		id = p_id
		description = p_desc
		target_count = p_target
		current_count = 0
		is_completed = false
		is_optional = p_optional

class Mission:
	var id: String = ""
	var title: String = ""
	var description: String = ""
	var prerequisites: Array[String] = []
	var objectives: Array[Objective] = []
	var xp_reward: int = 100
	var unlocked_shards: int = 0

	func _init(p_id: String, p_title: String, p_desc: String, p_prereqs: Array[String] = []) -> void:
		id = p_id
		title = p_title
		description = p_desc
		prerequisites = p_prereqs
		objectives = []

var missions: Dictionary = {} # id -> Mission
var statuses: Dictionary = {} # id -> Status
var active_mission_id: String = ""
var story_flags: Dictionary = {}

signal mission_activated(mission: Mission)
signal objective_updated(mission_id: String, objective: Objective)
signal mission_completed(mission: Mission)

func _init() -> void:
	_register_canonical_missions()

func _register_canonical_missions() -> void:
	# 1. Mission: Sanctum Calibration
	var m1 = Mission.new(
		"sanctum_calibration",
		"Sanctum Calibration: Rekindle the Primal Flame",
		"Corrupted Asura sentinels have shattered the seal of Surya. Recover 3 Astra Shards and ignite the Sun Altar."
	)
	m1.objectives.append(Objective.new("collect_shards", "Collect Astra Shards in the Sanctum", 3))
	m1.objectives.append(Objective.new("kindle_altar", "Kindle the Sacred Sun Altar", 1))
	m1.xp_reward = 250
	m1.unlocked_shards = 3

	register_mission(m1)

	# 2. Mission: Cleansing of the Bhumi Valley (Stage E 3D Campaign)
	var m2 = Mission.new(
		"cleansing_of_bhumi",
		"Cleansing of the Bhumi Valley: Act I",
		"Seek guidance from Oracle Devi Tara in Dandaka Grove, recover 3 Primal Astra Shards, defeat Corrupted General Kalanemi, and consecrate the High Sun Altar."
	)
	m2.objectives.append(Objective.new("commune_tara", "Seek counsel from Devi Tara in Dandaka Grove", 1))
	m2.objectives.append(Objective.new("reclaim_shards", "Reclaim 3 Primal Astra Shards across Bhumi", 3))
	m2.objectives.append(Objective.new("defeat_kalanemi", "Defeat General Kalanemi at the Watchtower", 1))
	m2.objectives.append(Objective.new("consecrate_altar", "Consecrate the High Sun Altar of Surya-Kund", 1))
	m2.xp_reward = 1000
	m2.unlocked_shards = 5
	register_mission(m2)

	# 3. Mission: Liberation of Antariksha (Chapter II 3D Campaign)
	var m3 = Mission.new(
		"liberation_of_antariksha",
		"Liberation of Antariksha: Act II",
		"Traverse the floating sky citadels of Vayu using your Prana Glider and Harpoon Grapple. Harmonize the wind turbines, defeat Cyclone Titan Matarishvan, and consecrate the High Gale Peetham."
	)
	m3.objectives.append(Objective.new("commune_tara_sky", "Commune with Astral Tara at the Sky Portal", 1))
	m3.objectives.append(Objective.new("restore_windmills", "Harmonize 2 Vayu Wind Turbines across the Citadels", 2))
	m3.objectives.append(Objective.new("defeat_matarishvan", "Defeat Corrupted Cyclone Titan Matarishvan", 1))
	m3.objectives.append(Objective.new("consecrate_vayu_peetham", "Consecrate the High Gale Peetham at the Pinnacle", 1))
	m3.xp_reward = 2500
	m3.unlocked_shards = 5
	register_mission(m3)

	# 4. Mission: Cleansing of Patala (Chapter III 3D Campaign)
	var m4 = Mission.new(
		"cleansing_of_patala",
		"Cleansing of Patala: Act III",
		"Descend into the subterranean Serpent Vaults of Patala. Navigate toxic venom rivers using bioluminescent springboards, defeat Shesha's Tormented Echo, and consecrate the Nagamani Peetham."
	)
	m4.objectives.append(Objective.new("commune_tara_subterranean", "Commune with Astral Tara at the Subterranean Descent", 1))
	m4.objectives.append(Objective.new("defeat_naga_guardians", "Defeat 3 Naga Guardians patrolling the serpent chambers", 3))
	m4.objectives.append(Objective.new("defeat_shesha_echo", "Defeat Shesha's Tormented Echo", 1))
	m4.objectives.append(Objective.new("consecrate_vasuki_peetham", "Consecrate the Sacred Nagamani Peetham", 1))
	m4.xp_reward = 3500
	m4.unlocked_shards = 7
	register_mission(m4)

	# 5. Mission: Ascension to Svarloka (Chapter IV 3D Campaign)
	var m5 = Mission.new(
		"ascension_to_svar",
		"Ascension to Svarloka: Act IV",
		"Ascend into the golden celestial sun citadels of Svar. Align the sacred Surya Prisms to energize solar light bridges, defeat the corrupted Sun Titan Avatara, and consecrate the Grand Solar Mahapeetham."
	)
	m5.objectives.append(Objective.new("commune_tara_solar", "Commune with Astral Tara at the Solar Citadel Gates", 1))
	m5.objectives.append(Objective.new("align_surya_prisms", "Align 2 Sacred Surya Prisms across the citadels", 2))
	m5.objectives.append(Objective.new("defeat_surya_avatara", "Defeat Corrupted Sun Titan Avatara", 1))
	m5.objectives.append(Objective.new("consecrate_surya_mahapeetham", "Consecrate the Grand Solar Mahapeetham", 1))
	m5.xp_reward = 4500
	m5.unlocked_shards = 8
	register_mission(m5)

	# 6. Mission: Wisdom of Maharloka (Chapter V 3D Campaign)
	var m6 = Mission.new(
		"wisdom_of_maharloka",
		"Wisdom of Maharloka: Act V",
		"Ascend to the cosmic astral libraries and sage sanctuaries of Maharloka. Use Astral Levitation Glyphs to scale celestial archive tiers, commune with Vedic Scripture Pedestals, defeat Brihaspati's Astral Avatar, and attune the Sage Core at the Mahar Mandala."
	)
	m6.objectives.append(Objective.new("commune_tara_astral", "Commune with Astral Tara at the Astral Library Terrace", 1))
	m6.objectives.append(Objective.new("commune_scriptures", "Commune with 2 Ancient Vedic Scripture Pedestals", 2))
	m6.objectives.append(Objective.new("defeat_brihaspati", "Defeat Brihaspati's Astral Avatar in the Observatory", 1))
	m6.objectives.append(Objective.new("consecrate_mahar_mandala", "Attune the Sage Core at the Sacred Mahar Mandala", 1))
	m6.xp_reward = 6000
	m6.unlocked_shards = 10
	register_mission(m6)

	# 7. Mission: Purification of Tapoloka (Chapter VI 3D Campaign)
	var m7 = Mission.new(
		"purification_of_tapoloka",
		"Purification of Tapoloka: Act VI",
		"Ascend into the volcanic foundries and ascetic fire realms of Janaloka and Tapoloka. Navigate eruption chasms via Magma Pressure Geysers, attune 2 Primordial Anvil Forges to reignite cosmic furnaces, defeat the Primordial Fire Titan Agni Rudra, and ignite the Eternal Tapas Flame at the Tapo Peetham."
	)
	m7.objectives.append(Objective.new("commune_tara_forge", "Commune with Astral Tara at the Caldera Threshold", 1))
	m7.objectives.append(Objective.new("attune_forges", "Attune 2 Primordial Anvil Forges of Agni", 2))
	m7.objectives.append(Objective.new("defeat_agni_rudra", "Defeat Primordial Fire Titan Agni Rudra", 1))
	m7.objectives.append(Objective.new("consecrate_tapo_peetham", "Ignite the Eternal Tapas Flame at the Tapo Peetham", 1))
	m7.xp_reward = 8000
	m7.unlocked_shards = 12
	register_mission(m7)

	# 8. Mission: Ascension to Satyaloka (Chapter VII 3D Campaign — Final Climax)
	var m8 = Mission.new(
		"ascension_to_satyaloka",
		"Ascension to Satyaloka: Act VII — The Cosmic Wheel of Dharma",
		"Ascend to the transcendent apex realm of Brahmaloka and Satyaloka. Align 2 Cosmic Dharmachakra Resonators across the void to materialize the Transcendent Light Bridges, liberate the Four-Headed Creator Titan Brahma Avatara from Mahapralaya dissolution, and attune the Moksha Mahapeetham to restore Cosmic Dharma and complete the Seven-Realm Cosmic Cycle."
	)
	m8.objectives.append(Objective.new("commune_tara_satya", "Commune with Astral Tara at the Lotus Apex of Satyaloka", 1))
	m8.objectives.append(Objective.new("align_dharmachakras", "Align 2 Cosmic Dharmachakra Resonators across the Void", 2))
	m8.objectives.append(Objective.new("defeat_brahma_avatara", "Liberate Four-Headed Creator Titan Brahma Avatara", 1))
	m8.objectives.append(Objective.new("consecrate_moksha_peetham", "Attune the Supreme Moksha Mahapeetham and Attain Cosmic Liberation", 1))
	m8.xp_reward = 12000
	m8.unlocked_shards = 15
	register_mission(m8)

func register_mission(mission: Mission) -> void:
	missions[mission.id] = mission
	if not statuses.has(mission.id):
		statuses[mission.id] = Status.AVAILABLE if mission.prerequisites.is_empty() else Status.LOCKED

func get_mission(id: String) -> Mission:
	return missions.get(id, null)

func get_mission_status(id: String) -> Status:
	return statuses.get(id, Status.LOCKED)

func can_activate_mission(id: String) -> bool:
	if not missions.has(id):
		return false
	var st = statuses.get(id, Status.LOCKED)
	if st == Status.COMPLETED or st == Status.ACTIVE:
		return false
	var mission: Mission = missions[id]
	for prereq_id in mission.prerequisites:
		if statuses.get(prereq_id, Status.LOCKED) != Status.COMPLETED:
			return false
	return true

func start_mission(id: String) -> bool:
	if not can_activate_mission(id):
		return false
	var mission: Mission = missions[id]
	statuses[id] = Status.ACTIVE
	active_mission_id = id
	for obj in mission.objectives:
		obj.current_count = 0
		obj.is_completed = false
	mission_activated.emit(mission)
	return true

func update_objective_progress(mission_id: String, objective_id: String, amount: int = 1) -> bool:
	if not missions.has(mission_id) or statuses.get(mission_id, Status.LOCKED) != Status.ACTIVE:
		return false
	var mission: Mission = missions[mission_id]
	var found_obj: Objective = null
	for obj in mission.objectives:
		if obj.id == objective_id:
			found_obj = obj
			break
	if found_obj == null or found_obj.is_completed:
		return false

	found_obj.current_count = mini(found_obj.target_count, found_obj.current_count + amount)
	if found_obj.current_count >= found_obj.target_count:
		found_obj.is_completed = true

	objective_updated.emit(mission_id, found_obj)

	# Check if all non-optional objectives are met
	var all_done = true
	for obj in mission.objectives:
		if not obj.is_optional and not obj.is_completed:
			all_done = false
			break

	if all_done:
		complete_mission(mission_id)

	return true

func complete_mission(mission_id: String) -> void:
	if not missions.has(mission_id):
		return
	var mission: Mission = missions[mission_id]
	statuses[mission_id] = Status.COMPLETED
	if active_mission_id == mission_id:
		active_mission_id = ""
	mission_completed.emit(mission)
