class_name TestSvarRealm3D
extends RefCounted

## Chapter IV Integration Test Suite: Realm of Svar / Svarga (The Celestial Solar Citadels)
## Validates QuestManager, DialogueRunner, Solar Light Bridge physics & toggle,
## Surya Prism rotation & alignment puzzle, Surya Guardian hoplite AI & shield block,
## Solar Gryphon winged beast AI, Boss Surya Avatara 2-phase Supernova enrage,
## Grand Solar Mahapeetham consecration, and 3D level scene integrity.

const QuestManagerScript = preload("res://scripts/domain/quest_manager.gd")
const DialogueRunnerScript = preload("res://scripts/domain/dialogue_runner.gd")
const SaveSystemScript = preload("res://scripts/domain/save_system.gd")
const CombatMath = preload("res://scripts/domain/combat_math.gd")
const PlayerControllerScript = preload("res://scripts/player/player_controller_3d.gd")
const SuryaGuardianScript = preload("res://scripts/entities/surya_guardian_3d.gd")
const SolarGryphonScript = preload("res://scripts/entities/solar_gryphon_3d.gd")
const BossSuryaAvataraScript = preload("res://scripts/entities/boss_surya_avatara_3d.gd")
const SolarLightBridgeScript = preload("res://scripts/interactables/solar_light_bridge_3d.gd")
const SuryaPrismScript = preload("res://scripts/interactables/surya_prism_3d.gd")
const SuryaMahapeethamScript = preload("res://scripts/interactables/surya_mahapeetham_3d.gd")

static func run_all() -> Array:
	var results: Array = []
	results.append(_test_svar_quest_progression())
	results.append(_test_svar_dialogue_flow())
	results.append(_test_solar_light_bridge_toggle())
	results.append(_test_surya_prism_rotation_and_alignment())
	results.append(_test_surya_guardian_combat_and_shield_block())
	results.append(_test_solar_gryphon_hover_and_screech())
	results.append(_test_boss_surya_avatara_phases_and_enrage())
	results.append(_test_surya_mahapeetham_and_save_state())
	results.append(_test_svar_level_scene_integrity())
	return results

static func _test_svar_quest_progression() -> Dictionary:
	var test_name = "test_svar_quest_progression"
	var qm = QuestManagerScript.new()
	var mission = qm.get_mission("ascension_to_svar")
	if not mission:
		return {"name": test_name, "passed": false, "message": "Mission ascension_to_svar missing."}
	if mission.objectives.size() < 4:
		return {"name": test_name, "passed": false, "message": "Expected 4 objectives in mission."}

	var ok = qm.start_mission("ascension_to_svar")
	if not ok or qm.get_mission_status("ascension_to_svar") != QuestManagerScript.Status.ACTIVE:
		return {"name": test_name, "passed": false, "message": "Failed to activate mission."}

	# Objective 1: commune_tara_solar
	qm.update_objective_progress("ascension_to_svar", "commune_tara_solar", 1)
	if not mission.objectives[0].is_completed:
		return {"name": test_name, "passed": false, "message": "commune_tara_solar failed to complete."}

	# Objective 2: align_surya_prisms (target 2)
	qm.update_objective_progress("ascension_to_svar", "align_surya_prisms", 1)
	if mission.objectives[1].is_completed:
		return {"name": test_name, "passed": false, "message": "align_surya_prisms prematurely completed at 1/2."}
	qm.update_objective_progress("ascension_to_svar", "align_surya_prisms", 1)
	if not mission.objectives[1].is_completed:
		return {"name": test_name, "passed": false, "message": "align_surya_prisms failed to complete at 2/2."}

	# Objective 3: defeat_surya_avatara
	qm.update_objective_progress("ascension_to_svar", "defeat_surya_avatara", 1)
	if not mission.objectives[2].is_completed:
		return {"name": test_name, "passed": false, "message": "defeat_surya_avatara failed to complete."}

	# Objective 4: consecrate_surya_mahapeetham
	qm.update_objective_progress("ascension_to_svar", "consecrate_surya_mahapeetham", 1)
	if not mission.objectives[3].is_completed:
		return {"name": test_name, "passed": false, "message": "consecrate_surya_mahapeetham failed to complete."}

	if qm.get_mission_status("ascension_to_svar") != QuestManagerScript.Status.COMPLETED:
		return {"name": test_name, "passed": false, "message": "Mission should be COMPLETED."}

	return {"name": test_name, "passed": true, "message": "Svar quest progression verified."}

static func _test_svar_dialogue_flow() -> Dictionary:
	var test_name = "test_svar_dialogue_flow"
	var dr = DialogueRunnerScript.new()
	var ok = dr.start("tara_svar_1")
	if not ok:
		return {"name": test_name, "passed": false, "message": "Failed to start dialogue tara_svar_1."}

	if dr.current_node_id != "tara_svar_1":
		return {"name": test_name, "passed": false, "message": "Expected start at tara_svar_1."}

	# Advance to veer_svar_1
	var adv1 = dr.advance()
	if not adv1 or dr.current_node_id != "veer_svar_1":
		return {"name": test_name, "passed": false, "message": "Expected advance to veer_svar_1."}

	# Advance to tara_svar_2
	var adv2 = dr.advance()
	if not adv2 or dr.current_node_id != "tara_svar_2":
		return {"name": test_name, "passed": false, "message": "Expected advance to tara_svar_2."}

	# Advance to veer_svar_2
	var adv3 = dr.advance()
	if not adv3 or dr.current_node_id != "veer_svar_2":
		return {"name": test_name, "passed": false, "message": "Expected advance to veer_svar_2."}

	# Advance to conclusion
	var adv4 = dr.advance()
	if adv4 or dr.is_active:
		return {"name": test_name, "passed": false, "message": "Expected dialogue to end after veer_svar_2."}

	return {"name": test_name, "passed": true, "message": "Svar dialogue sequence verified."}

static func _test_solar_light_bridge_toggle() -> Dictionary:
	var test_name = "test_solar_light_bridge_toggle"
	var bridge: Node3D = SolarLightBridgeScript.new()
	bridge.is_active = false

	var bridge_signal = {"active": false, "fired": false}
	bridge.bridge_state_changed.connect(func(act):
		bridge_signal["fired"] = true
		bridge_signal["active"] = act
	)

	bridge.activate_bridge()
	if not bridge.is_active or not bridge_signal["fired"] or not bridge_signal["active"]:
		bridge.free()
		return {"name": test_name, "passed": false, "message": "Bridge failed to activate."}

	bridge.deactivate_bridge()
	if bridge.is_active or bridge_signal["active"]:
		bridge.free()
		return {"name": test_name, "passed": false, "message": "Bridge failed to deactivate."}

	bridge.toggle_bridge()
	if not bridge.is_active:
		bridge.free()
		return {"name": test_name, "passed": false, "message": "Bridge toggle failed."}

	bridge.free()
	return {"name": test_name, "passed": true, "message": "Solar light bridge state verified."}

static func _test_surya_prism_rotation_and_alignment() -> Dictionary:
	var test_name = "test_surya_prism_rotation_and_alignment"
	var prism: Area3D = SuryaPrismScript.new()
	prism.prism_id = "test_prism"
	prism.current_step = 0
	prism.target_step = 2
	prism.is_harmonized = false

	var harmonized_signal = {"fired": false, "id": ""}
	prism.prism_harmonized.connect(func(pid):
		harmonized_signal["fired"] = true
		harmonized_signal["id"] = pid
	)

	# First rotate: step 0 -> 1
	prism.interact()
	if prism.current_step != 1 or prism.is_harmonized:
		prism.free()
		return {"name": test_name, "passed": false, "message": "Expected step 1, not yet harmonized."}

	# Second rotate: step 1 -> 2 (target!)
	prism.interact()
	if prism.current_step != 2 or not prism.is_harmonized:
		prism.free()
		return {"name": test_name, "passed": false, "message": "Expected step 2 and harmonized."}

	if not harmonized_signal["fired"] or harmonized_signal["id"] != "test_prism":
		prism.free()
		return {"name": test_name, "passed": false, "message": "prism_harmonized signal failed to emit."}

	prism.free()
	return {"name": test_name, "passed": true, "message": "Surya prism rotation and alignment verified."}

static func _test_surya_guardian_combat_and_shield_block() -> Dictionary:
	var test_name = "test_surya_guardian_combat_and_shield_block"
	var guardian: CharacterBody3D = SuryaGuardianScript.new()
	var player: CharacterBody3D = PlayerControllerScript.new()
	guardian.target_player = player

	guardian.position = Vector3(0, 0, 8.0)
	guardian.global_position = Vector3(0, 0, 8.0)
	player.position = Vector3.ZERO
	player.global_position = Vector3.ZERO

	# Test telegraph transition
	guardian.current_state = SuryaGuardianScript.State.SPEAR_CHARGE_TELEGRAPH
	guardian._process_telegraph(0.7)
	if guardian.current_state != SuryaGuardianScript.State.SPEAR_THRUST:
		guardian.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "Guardian should enter SPEAR_THRUST from telegraph."}

	# Test shield block
	guardian.current_state = SuryaGuardianScript.State.SHIELD_BLOCK
	var attack_spec = CombatMath.AttackSpec.new("veer", 30, 20.0, Vector3(0, 0, -2.0))
	var res = guardian.take_damage_spec(attack_spec)
	if not res.was_blocked:
		guardian.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "Attack from front during SHIELD_BLOCK should be blocked."}

	# Test defeat
	var defeated_signal = {"fired": false}
	guardian.guardian_defeated.connect(func(_g): defeated_signal["fired"] = true)
	guardian.take_damage(150)
	if guardian.current_state != SuryaGuardianScript.State.DEFEATED or not defeated_signal["fired"]:
		guardian.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "Guardian should be DEFEATED."}

	guardian.free()
	player.free()
	return {"name": test_name, "passed": true, "message": "Surya Guardian combat and shield block verified."}

static func _test_solar_gryphon_hover_and_screech() -> Dictionary:
	var test_name = "test_solar_gryphon_hover_and_screech"
	var gryphon: CharacterBody3D = SolarGryphonScript.new()
	var player: CharacterBody3D = PlayerControllerScript.new()
	gryphon.target_player = player

	gryphon.position = Vector3(0, 0, 6.0)
	gryphon.global_position = Vector3(0, 0, 6.0)
	player.position = Vector3.ZERO
	player.global_position = Vector3.ZERO

	var screech_signal = {"fired": false}
	gryphon.sunflare_screech.connect(func(_o, _d): screech_signal["fired"] = true)

	gryphon.current_state = SolarGryphonScript.State.SUNFLARE_SCREECH_TELEGRAPH
	gryphon._process_telegraph(0.75)

	if gryphon.current_state != SolarGryphonScript.State.DIVE_POUNCE or not screech_signal["fired"]:
		gryphon.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "Gryphon should enter DIVE_POUNCE and emit screech."}

	# Test defeat
	var defeated_signal = {"fired": false}
	gryphon.gryphon_defeated.connect(func(_g): defeated_signal["fired"] = true)
	gryphon.take_damage(100)
	if gryphon.current_state != SolarGryphonScript.State.DEFEATED or not defeated_signal["fired"]:
		gryphon.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "Gryphon should be DEFEATED."}

	gryphon.free()
	player.free()
	return {"name": test_name, "passed": true, "message": "Solar Gryphon hover and screech verified."}

static func _test_boss_surya_avatara_phases_and_enrage() -> Dictionary:
	var test_name = "test_boss_surya_avatara_phases_and_enrage"
	var boss: CharacterBody3D = BossSuryaAvataraScript.new()
	var player: CharacterBody3D = PlayerControllerScript.new()
	boss.target_player = player

	if boss.current_health != 500 or boss.max_health != 500:
		boss.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "Boss should start with 500 HP."}

	var phase_signal = {"phase": 1}
	boss.boss_phase_changed.connect(func(p): phase_signal["phase"] = p)

	# Damage down to 240 HP (<= 250 enrage threshold)
	boss.take_damage(260)
	if not boss.is_enraged or boss.current_phase != 2:
		boss.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "Boss should be ENRAGED in Phase 2 at <= 250 HP."}

	if phase_signal["phase"] != 2:
		boss.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "boss_phase_changed signal failed to emit 2."}

	# Defeat boss
	var defeated_signal = {"fired": false}
	boss.boss_defeated.connect(func(): defeated_signal["fired"] = true)
	boss.current_state = BossSuryaAvataraScript.State.SOLAR_APPROACH
	boss.take_damage(300)

	if boss.current_state != BossSuryaAvataraScript.State.DEFEATED or boss.current_health != 0:
		boss.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "Boss should be DEFEATED with 0 HP."}

	if not defeated_signal["fired"]:
		boss.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "boss_defeated signal should emit."}

	boss.free()
	player.free()
	return {"name": test_name, "passed": true, "message": "Boss Surya Avatara phases and enrage verified."}

static func _test_surya_mahapeetham_and_save_state() -> Dictionary:
	var test_name = "test_surya_mahapeetham_and_save_state"
	var peetham: Area3D = SuryaMahapeethamScript.new()

	var consecrated_signal = {"fired": false}
	peetham.mahapeetham_consecrated.connect(func(_p): consecrated_signal["fired"] = true)

	peetham.interact()
	if not peetham.is_consecrated or not consecrated_signal["fired"]:
		peetham.free()
		return {"name": test_name, "passed": false, "message": "Mahapeetham consecration failed."}

	# Save state validation
	var state = SaveSystemScript.get_default_state()
	state["currentRealm"] = "Svar"
	state["shardsCollected"] = 16
	state["altarConsecrated"] = true
	state["unlockedRealms"].append("Svar")

	var save_ok = SaveSystemScript.save_game(state)
	if not save_ok:
		peetham.free()
		return {"name": test_name, "passed": false, "message": "SaveSystem failed to save Svar state."}

	var loaded = SaveSystemScript.load_game()
	if not loaded or loaded["currentRealm"] != "Svar":
		peetham.free()
		return {"name": test_name, "passed": false, "message": "Loaded state mismatch for Svar realm."}

	peetham.free()
	return {"name": test_name, "passed": true, "message": "Surya Mahapeetham consecration and save state verified."}

static func _test_svar_level_scene_integrity() -> Dictionary:
	var test_name = "test_svar_level_scene_integrity"
	var scene_res = load("res://scenes/levels/SvarSolarCitadel3D.tscn")
	if not scene_res or not (scene_res is PackedScene):
		return {"name": test_name, "passed": false, "message": "Failed to load SvarSolarCitadel3D.tscn."}

	var instance = scene_res.instantiate()
	if not instance:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate SvarSolarCitadel3D scene."}

	var required_nodes = [
		"WorldEnvironment",
		"DirectionalLight3D",
		"Player3D",
		"HUD3D",
		"DeviTaraSvar3D",
		"SolarLightBridge1",
		"SuryaPrism1",
		"SuryaPrism2",
		"SuryaGuardian1",
		"SolarGryphon1",
		"BossSuryaAvatara3D",
		"SuryaMahapeetham3D"
	]

	for node_name in required_nodes:
		if not instance.has_node(node_name):
			instance.free()
			return {"name": test_name, "passed": false, "message": "Missing node %s in SvarSolarCitadel3D scene." % node_name}

	instance.free()
	return {"name": test_name, "passed": true, "message": "Svar Solar Citadel level scene integrity verified."}
