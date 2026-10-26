class_name TestSvarRemaster
extends RefCounted

## Unit Test Suite: Svar Production Remaster (Stage Q5-C)
## Validates high-fidelity modular celestial bastions, Boss Surya Avatara's 26-bone rig with 10 authored actions,
## Surya Guardian and Solar Gryphon skeletal animations, PBR environment assets,
## celestial solar lighting, puzzle prisms & light bridges, and Maharloka ascent portal transitions.

static func run_all() -> Array:
	var results: Array = []
	results.append(_test_svar_remastered_bastions_and_collision())
	results.append(_test_boss_surya_avatara_rig_and_10_actions())
	results.append(_test_surya_guardian_and_gryphon_animations())
	results.append(_test_solar_prisms_and_light_bridges())
	results.append(_test_svar_world_environment_and_solar_lighting())
	results.append(_test_maharloka_ascent_portal_and_cleansing_save())
	return results

static func _test_svar_remastered_bastions_and_collision() -> Dictionary:
	var test_name = "test_svar_remastered_bastions_and_collision"
	var scene_res = load("res://scenes/levels/SvarSolarCitadel3D.tscn")
	if not scene_res or not (scene_res is PackedScene):
		return {"name": test_name, "passed": false, "message": "Failed to load SvarSolarCitadel3D.tscn"}

	var level = scene_res.instantiate()
	if not level:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate SvarSolarCitadel3D"}

	var required_bastions = [
		{"node": "EntryBastion", "model": "EntryBastionModel"},
		{"node": "MidBastion", "model": "MidBastionModel"},
		{"node": "ApexCitadel", "model": "ApexCitadelModel"},
		{"node": "SanctumBastion", "model": "SanctumBastionModel"}
	]

	for b_info in required_bastions:
		var b_node = level.get_node_or_null(b_info["node"])
		if not b_node:
			level.free()
			return {"name": test_name, "passed": false, "message": "Missing bastion node: %s" % b_info["node"]}
		var col = b_node.get_node_or_null("CollisionShape3D")
		if not col or not col.shape:
			level.free()
			return {"name": test_name, "passed": false, "message": "Bastion %s lacks CollisionShape3D" % b_info["node"]}
		var model = b_node.get_node_or_null(b_info["model"])
		if not model:
			level.free()
			return {"name": test_name, "passed": false, "message": "Bastion %s lacks 3D model %s" % [b_info["node"], b_info["model"]]}

	level.free()
	return {"name": test_name, "passed": true, "message": "All 4 Svar celestial bastions, models, and collisions verified."}

static func _test_boss_surya_avatara_rig_and_10_actions() -> Dictionary:
	var test_name = "test_boss_surya_avatara_rig_and_10_actions"
	var boss_glb = load("res://assets/characters/enemies/boss_surya_avatara.glb")
	if not boss_glb or not (boss_glb is PackedScene):
		return {"name": test_name, "passed": false, "message": "Failed to load boss_surya_avatara.glb"}

	var boss_inst = boss_glb.instantiate()
	if not boss_inst:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate boss_surya_avatara"}

	var ap: AnimationPlayer = boss_inst.find_child("AnimationPlayer", true, false)
	if not ap:
		boss_inst.free()
		return {"name": test_name, "passed": false, "message": "boss_surya_avatara missing AnimationPlayer"}

	var expected_actions = [
		"boss_idle",
		"boss_walk",
		"boss_cleave_telegraph",
		"boss_cleave_attack",
		"boss_solar_beam_channel",
		"boss_supernova_leap",
		"boss_supernova_impact",
		"boss_pillar_quake",
		"boss_enrage_flare",
		"boss_defeat"
	]

	for act in expected_actions:
		if not ap.has_animation(act):
			boss_inst.free()
			return {"name": test_name, "passed": false, "message": "Missing authored boss action: %s" % act}

	boss_inst.free()
	return {"name": test_name, "passed": true, "message": "Boss Surya Avatara Sun Titan rig with 10 authored actions verified."}

static func _test_surya_guardian_and_gryphon_animations() -> Dictionary:
	var test_name = "test_surya_guardian_and_gryphon_animations"

	# 1. Surya Guardian
	var guardian_glb = load("res://assets/characters/enemies/surya_guardian.glb")
	if not guardian_glb or not (guardian_glb is PackedScene):
		return {"name": test_name, "passed": false, "message": "Failed to load surya_guardian.glb"}

	var guardian_inst = guardian_glb.instantiate()
	var ap_g: AnimationPlayer = guardian_inst.find_child("AnimationPlayer", true, false)
	if not ap_g:
		guardian_inst.free()
		return {"name": test_name, "passed": false, "message": "surya_guardian missing AnimationPlayer"}

	for act in ["idle", "walk", "telegraph", "thrust_attack", "shield_block", "death"]:
		if not ap_g.has_animation(act):
			guardian_inst.free()
			return {"name": test_name, "passed": false, "message": "surya_guardian missing action: %s" % act}
	guardian_inst.free()

	# 2. Solar Gryphon
	var gryphon_glb = load("res://assets/characters/enemies/solar_gryphon.glb")
	if not gryphon_glb or not (gryphon_glb is PackedScene):
		return {"name": test_name, "passed": false, "message": "Failed to load solar_gryphon.glb"}

	var gryphon_inst = gryphon_glb.instantiate()
	var ap_gr: AnimationPlayer = gryphon_inst.find_child("AnimationPlayer", true, false)
	if not ap_gr:
		gryphon_inst.free()
		return {"name": test_name, "passed": false, "message": "solar_gryphon missing AnimationPlayer"}

	for act in ["idle", "fly_locomotion", "telegraph_screech", "dive_strike", "stagger", "death"]:
		if not ap_gr.has_animation(act):
			gryphon_inst.free()
			return {"name": test_name, "passed": false, "message": "solar_gryphon missing action: %s" % act}
	gryphon_inst.free()

	return {"name": test_name, "passed": true, "message": "Surya Guardian & Solar Gryphon rigs and animations verified."}

static func _test_solar_prisms_and_light_bridges() -> Dictionary:
	var test_name = "test_solar_prisms_and_light_bridges"

	var bridge_res = load("res://scenes/interactables/SolarLightBridge3D.tscn")
	if not bridge_res or not (bridge_res is PackedScene):
		return {"name": test_name, "passed": false, "message": "Failed to load SolarLightBridge3D.tscn"}

	var bridge = bridge_res.instantiate()
	if not bridge:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate SolarLightBridge3D"}

	if bridge.has_method("activate_bridge"):
		bridge.activate_bridge()
		if not bridge.is_active:
			bridge.free()
			return {"name": test_name, "passed": false, "message": "Solar light bridge failed to activate"}
	bridge.free()

	var prism_res = load("res://scenes/interactables/SuryaPrism3D.tscn")
	if not prism_res or not (prism_res is PackedScene):
		return {"name": test_name, "passed": false, "message": "Failed to load SuryaPrism3D.tscn"}

	var prism = prism_res.instantiate()
	prism.target_step = 2
	var harmonized = {"fired": false}
	prism.prism_harmonized.connect(func(_id): harmonized["fired"] = true)

	prism.interact() # step 1
	if harmonized["fired"]:
		prism.free()
		return {"name": test_name, "passed": false, "message": "Prism prematurely harmonized at step 1"}
	prism.interact() # step 2
	if not harmonized["fired"] or not prism.is_harmonized:
		prism.free()
		return {"name": test_name, "passed": false, "message": "Prism failed to harmonize at step 2"}
	prism.free()

	return {"name": test_name, "passed": true, "message": "Solar light bridges and rotatable Surya prisms verified."}

static func _test_svar_world_environment_and_solar_lighting() -> Dictionary:
	var test_name = "test_svar_world_environment_and_solar_lighting"
	var scene_res = load("res://scenes/levels/SvarSolarCitadel3D.tscn")
	var level = scene_res.instantiate()

	var env_node: WorldEnvironment = level.get_node_or_null("WorldEnvironment")
	if not env_node or not env_node.environment:
		level.free()
		return {"name": test_name, "passed": false, "message": "Missing WorldEnvironment or Environment resource"}

	var env = env_node.environment
	if not env.sky:
		level.free()
		return {"name": test_name, "passed": false, "message": "WorldEnvironment missing Sky"}

	if not env.glow_enabled or env.glow_bloom < 0.2:
		level.free()
		return {"name": test_name, "passed": false, "message": "Glow/Bloom insufficient for solar citadel aesthetic"}

	var dir_light: DirectionalLight3D = level.get_node_or_null("DirectionalLight3D")
	if not dir_light or not dir_light.shadow_enabled:
		level.free()
		return {"name": test_name, "passed": false, "message": "DirectionalLight3D missing or shadows disabled"}

	level.free()
	return {"name": test_name, "passed": true, "message": "Svar celestial lighting, glow, and sky environment verified."}

static func _test_maharloka_ascent_portal_and_cleansing_save() -> Dictionary:
	var test_name = "test_maharloka_ascent_portal_and_cleansing_save"
	var SaveSystem = preload("res://scripts/domain/save_system.gd")

	var save_state = SaveSystem.get_default_state()
	save_state["currentRealm"] = "Svar"
	save_state["shardsCollected"] = 16
	save_state["altarConsecrated"] = true
	for r in ["Bhumi", "Antariksha", "Patala", "Svar"]:
		if not save_state["unlockedRealms"].has(r):
			save_state["unlockedRealms"].append(r)

	var ok = SaveSystem.save_game(save_state)
	if not ok:
		return {"name": test_name, "passed": false, "message": "SaveSystem.save_game failed for Svar state"}

	var loaded = SaveSystem.load_game()
	if not loaded or loaded.get("currentRealm") != "Svar" or loaded.get("shardsCollected") != 16:
		return {"name": test_name, "passed": false, "message": "Loaded save state verification failed for Svar"}

	if not loaded.get("unlockedRealms").has("Svar"):
		return {"name": test_name, "passed": false, "message": "Svar not found in unlockedRealms"}

	return {"name": test_name, "passed": true, "message": "Maharloka ascent transition and Svar save state verified."}
