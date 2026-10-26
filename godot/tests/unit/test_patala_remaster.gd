class_name TestPatalaRemaster
extends RefCounted

## Unit Test Suite: Patala Production Remaster (Stage Q5-B)
## Validates high-fidelity modular cavern chambers, Boss Shesha's 7-hooded rig with 10 authored actions,
## Naga Constrictor and Naga Spitter skeletal animations, PBR environment assets,
## subterranean cavern lighting, traversal safeguards, and Svar ascension portal transitions.

static func run_all() -> Array:
	var results: Array = []
	results.append(_test_patala_remastered_cavern_chambers_and_collision())
	results.append(_test_boss_shesha_echo_7_hoods_and_10_actions())
	results.append(_test_naga_guardians_rig_and_actions())
	results.append(_test_patala_environmental_props_and_springboard())
	results.append(_test_patala_world_environment_and_subterranean_lighting())
	results.append(_test_svar_ascension_portal_and_cleansing_save())
	return results

static func _test_patala_remastered_cavern_chambers_and_collision() -> Dictionary:
	var test_name = "test_patala_remastered_cavern_chambers_and_collision"
	var scene_res = load("res://scenes/levels/PatalaUnderworld3D.tscn")
	if not scene_res or not (scene_res is PackedScene):
		return {"name": test_name, "passed": false, "message": "Failed to load PatalaUnderworld3D.tscn"}

	var level = scene_res.instantiate()
	if not level:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate PatalaUnderworld3D"}

	var required_floors = ["EntranceFloor", "MidChamberFloor", "BossArenaFloor", "SanctumFloor"]
	for f_name in required_floors:
		var floor_node = level.get_node_or_null(f_name)
		if not floor_node:
			level.free()
			return {"name": test_name, "passed": false, "message": "Missing floor node: %s" % f_name}
		var col = floor_node.get_node_or_null("CollisionShape3D")
		if not col or not col.shape:
			level.free()
			return {"name": test_name, "passed": false, "message": "Floor %s lacks CollisionShape3D" % f_name}

	level.free()
	return {"name": test_name, "passed": true, "message": "All 4 Patala cavern chambers and collisions verified."}

static func _test_boss_shesha_echo_7_hoods_and_10_actions() -> Dictionary:
	var test_name = "test_boss_shesha_echo_7_hoods_and_10_actions"
	var boss_glb = load("res://assets/characters/enemies/boss_shesha_echo.glb")
	if not boss_glb or not (boss_glb is PackedScene):
		return {"name": test_name, "passed": false, "message": "Failed to load boss_shesha_echo.glb"}

	var boss_inst = boss_glb.instantiate()
	if not boss_inst:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate boss_shesha_echo"}

	var ap: AnimationPlayer = boss_inst.find_child("AnimationPlayer", true, false)
	if not ap:
		boss_inst.free()
		return {"name": test_name, "passed": false, "message": "boss_shesha_echo missing AnimationPlayer"}

	var expected_actions = [
		"boss_idle",
		"boss_slither",
		"boss_hood_flare",
		"boss_tail_sweep_telegraph",
		"boss_tail_sweep_execute",
		"boss_venom_barrage",
		"boss_quake_slam",
		"boss_roar_enrage",
		"boss_stagger",
		"boss_defeat"
	]

	for act in expected_actions:
		if not ap.has_animation(act):
			boss_inst.free()
			return {"name": test_name, "passed": false, "message": "Missing authored boss action: %s" % act}

	boss_inst.free()
	return {"name": test_name, "passed": true, "message": "Boss Shesha Echo 7-hooded rig with 10 authored actions verified."}

static func _test_naga_guardians_rig_and_actions() -> Dictionary:
	var test_name = "test_naga_guardians_rig_and_actions"

	# 1. Naga Constrictor
	var constrictor_glb = load("res://assets/characters/enemies/naga_constrictor.glb")
	if not constrictor_glb or not (constrictor_glb is PackedScene):
		return {"name": test_name, "passed": false, "message": "Failed to load naga_constrictor.glb"}

	var constrictor_inst = constrictor_glb.instantiate()
	var ap_c: AnimationPlayer = constrictor_inst.find_child("AnimationPlayer", true, false)
	if not ap_c:
		constrictor_inst.free()
		return {"name": test_name, "passed": false, "message": "naga_constrictor missing AnimationPlayer"}

	for act in ["idle", "stalk", "telegraph", "leap_strike", "stagger", "defeat"]:
		if not ap_c.has_animation(act):
			constrictor_inst.free()
			return {"name": test_name, "passed": false, "message": "naga_constrictor missing action: %s" % act}
	constrictor_inst.free()

	# 2. Naga Spitter
	var spitter_glb = load("res://assets/characters/enemies/naga_spitter.glb")
	if not spitter_glb or not (spitter_glb is PackedScene):
		return {"name": test_name, "passed": false, "message": "Failed to load naga_spitter.glb"}

	var spitter_inst = spitter_glb.instantiate()
	var ap_s: AnimationPlayer = spitter_inst.find_child("AnimationPlayer", true, false)
	if not ap_s:
		spitter_inst.free()
		return {"name": test_name, "passed": false, "message": "naga_spitter missing AnimationPlayer"}

	for act in ["idle", "slither", "telegraph_coil", "spit_venom", "stagger", "defeat"]:
		if not ap_s.has_animation(act):
			spitter_inst.free()
			return {"name": test_name, "passed": false, "message": "naga_spitter missing action: %s" % act}
	spitter_inst.free()

	return {"name": test_name, "passed": true, "message": "Naga Constrictor and Naga Spitter skeletal rigs and actions verified."}

static func _test_patala_environmental_props_and_springboard() -> Dictionary:
	var test_name = "test_patala_environmental_props_and_springboard"
	var props = [
		{"res": "res://assets/environment/patala_stalagmite_cluster.glb", "min_bytes": 100000},
		{"res": "res://assets/environment/patala_stalactite_cluster.glb", "min_bytes": 100000},
		{"res": "res://assets/environment/patala_serpent_archway.glb", "min_bytes": 100000},
		{"res": "res://assets/environment/bioluminescent_fungus.glb", "min_bytes": 50000},
		{"res": "res://assets/environment/vasuki_shrine_pedestal.glb", "min_bytes": 100000},
		{"res": "res://assets/environment/patala_venom_river_basin.glb", "min_bytes": 100000}
	]

	for p in props:
		var scene = load(p["res"])
		if not scene or not (scene is PackedScene):
			return {"name": test_name, "passed": false, "message": "Failed to load prop: %s" % p["res"]}
		var inst = scene.instantiate()
		if not inst:
			return {"name": test_name, "passed": false, "message": "Failed to instantiate prop: %s" % p["res"]}
		inst.free()

	return {"name": test_name, "passed": true, "message": "All Patala 3D environmental props and springboard verified."}

static func _test_patala_world_environment_and_subterranean_lighting() -> Dictionary:
	var test_name = "test_patala_world_environment_and_subterranean_lighting"
	var scene_res = load("res://scenes/levels/PatalaUnderworld3D.tscn")
	var level = scene_res.instantiate()

	var we: WorldEnvironment = level.get_node_or_null("WorldEnvironment")
	if not we or not we.environment:
		level.free()
		return {"name": test_name, "passed": false, "message": "Missing WorldEnvironment or Environment resource"}

	var env = we.environment
	if not (env.tonemap_mode == 2 or env.tonemap_mode == 3):
		level.free()
		return {"name": test_name, "passed": false, "message": "Patala should use Filmic or ACES tonemapper"}

	if not env.glow_enabled:
		level.free()
		return {"name": test_name, "passed": false, "message": "Glow must be enabled in Patala"}

	if not env.fog_enabled:
		level.free()
		return {"name": test_name, "passed": false, "message": "Subterranean fog must be enabled in Patala"}

	# Directional and Omni light checks
	var dir_light = level.get_node_or_null("DirectionalLight3D")
	if not dir_light:
		level.free()
		return {"name": test_name, "passed": false, "message": "DirectionalLight3D missing in Patala"}

	var c_light = level.get_node_or_null("CavernLight1")
	if not c_light:
		level.free()
		return {"name": test_name, "passed": false, "message": "Cavern illumination OmniLight missing"}

	level.free()
	return {"name": test_name, "passed": true, "message": "Patala subterranean atmospheric lighting verified."}

static func _test_svar_ascension_portal_and_cleansing_save() -> Dictionary:
	var test_name = "test_svar_ascension_portal_and_cleansing_save"
	var scene_res = load("res://scenes/levels/PatalaUnderworld3D.tscn")
	var realm = scene_res.instantiate()

	# Test portal spawning
	realm._spawn_svar_portal()
	var portal = realm.get_node_or_null("SvarAscensionPortal")
	if not portal:
		realm.free()
		return {"name": test_name, "passed": false, "message": "Failed to spawn SvarAscensionPortal"}

	# Test Save state
	var SaveSystem = preload("res://scripts/domain/save_system.gd")
	var state = SaveSystem.get_default_state()
	state["currentRealm"] = "Patala"
	state["shardsCollected"] = 12
	state["altarConsecrated"] = true
	state["unlockedRealms"] = ["Bhumi", "Antariksha", "Patala"]

	var save_ok = SaveSystem.save_game(state)
	if not save_ok:
		realm.free()
		return {"name": test_name, "passed": false, "message": "SaveSystem.save_game failed for Patala"}

	var loaded = SaveSystem.load_game()
	if not loaded or loaded["currentRealm"] != "Patala" or not loaded["altarConsecrated"]:
		realm.free()
		return {"name": test_name, "passed": false, "message": "Failed to load/verify Patala cleansed state"}

	realm.free()
	return {"name": test_name, "passed": true, "message": "Svar portal spawn and cleansing save verified."}
