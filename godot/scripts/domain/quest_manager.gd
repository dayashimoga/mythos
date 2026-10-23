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
