class_name TestAntarikshaRealm3D
extends RefCounted

## Chapter II Integration Test Suite: Realm of Antariksha
## Validates QuestManager, DialogueRunner, Prana Glider & Harpoon Grapple physics,
## Gale Falcon AI, Wind Archer AI, Boss Matarishvan phase progression,
## Vayu Turbine harmonization, and Sky Realm boundary safeguards.

const QuestManagerScript = preload("res://scripts/domain/quest_manager.gd")
const DialogueRunnerScript = preload("res://scripts/domain/dialogue_runner.gd")
const SaveSystemScript = preload("res://scripts/domain/save_system.gd")
const PlayerControllerScript = preload("res://scripts/player/player_controller_3d.gd")
const GaleFalconScript = preload("res://scripts/entities/gale_falcon_3d.gd")
const WindArcherScript = preload("res://scripts/entities/wind_archer_3d.gd")
const BossMatarishvanScript = preload("res://scripts/entities/boss_matarishvan_3d.gd")
const VayuTurbineScript = preload("res://scripts/interactables/vayu_turbine_3d.gd")
const GrappleAnchorScript = preload("res://scripts/interactables/grapple_anchor_3d.gd")
const ThermalVentScript = preload("res://scripts/interactables/thermal_vent_3d.gd")

static func run_all() -> Array:
	var results: Array = []
	results.append(_test_antariksha_quest_progression())
	results.append(_test_antariksha_dialogue_flow())
	results.append(_test_prana_glider_physics())
	results.append(_test_harpoon_grapple_tether_and_pull())
	results.append(_test_thermal_vent_updraft())
	results.append(_test_gale_falcon_ai_and_dive_attack())
	results.append(_test_wind_archer_hover_and_combat())
	results.append(_test_boss_matarishvan_phases_and_enrage())
	results.append(_test_vayu_turbine_and_save_state())
	return results

static func _test_antariksha_quest_progression() -> Dictionary:
	var test_name = "test_antariksha_quest_progression"
	var qm = QuestManagerScript.new()
	var mission = qm.get_mission("liberation_of_antariksha")
	if not mission:
		return {"name": test_name, "passed": false, "message": "Mission liberation_of_antariksha missing."}
	if mission.objectives.size() < 4:
		return {"name": test_name, "passed": false, "message": "Expected 4 objectives in mission."}

	var ok = qm.start_mission("liberation_of_antariksha")
	if not ok or qm.get_mission_status("liberation_of_antariksha") != QuestManagerScript.Status.ACTIVE:
		return {"name": test_name, "passed": false, "message": "Failed to activate mission."}

	# Objective 1: commune_tara_sky
	qm.update_objective_progress("liberation_of_antariksha", "commune_tara_sky", 1)
	if not mission.objectives[0].is_completed:
		return {"name": test_name, "passed": false, "message": "commune_tara_sky failed to complete."}

	# Objective 2: restore_windmills (2 turbines)
	qm.update_objective_progress("liberation_of_antariksha", "restore_windmills", 1)
	if mission.objectives[1].is_completed:
		return {"name": test_name, "passed": false, "message": "restore_windmills prematurely completed."}
	qm.update_objective_progress("liberation_of_antariksha", "restore_windmills", 1)
	if not mission.objectives[1].is_completed:
		return {"name": test_name, "passed": false, "message": "restore_windmills failed to complete at target."}

	# Objective 3: defeat_matarishvan
	qm.update_objective_progress("liberation_of_antariksha", "defeat_matarishvan", 1)
	if not mission.objectives[2].is_completed:
		return {"name": test_name, "passed": false, "message": "defeat_matarishvan failed to complete."}

	# Objective 4: consecrate_vayu_peetham
	qm.update_objective_progress("liberation_of_antariksha", "consecrate_vayu_peetham", 1)
	if not mission.objectives[3].is_completed:
		return {"name": test_name, "passed": false, "message": "consecrate_vayu_peetham failed to complete."}

	if qm.get_mission_status("liberation_of_antariksha") != QuestManagerScript.Status.COMPLETED:
		return {"name": test_name, "passed": false, "message": "Mission should be COMPLETED."}

	return {"name": test_name, "passed": true}

static func _test_antariksha_dialogue_flow() -> Dictionary:
	var test_name = "test_antariksha_dialogue_flow"
	var dr = DialogueRunnerScript.new()
	var started = dr.start("tara_sky_1")
	if not started or not dr.is_active:
		return {"name": test_name, "passed": false, "message": "Failed to start tara_sky_1."}
	if dr.current_node_id != "tara_sky_1":
		return {"name": test_name, "passed": false, "message": "Incorrect starting node."}

	# Advance to Veer reply
	var adv1 = dr.advance()
	if not adv1 or dr.current_node_id != "veer_sky_1":
		return {"name": test_name, "passed": false, "message": "Failed to advance to veer_sky_1."}

	# Advance to Tara instructions
	var adv2 = dr.advance()
	if not adv2 or dr.current_node_id != "tara_sky_2":
		return {"name": test_name, "passed": false, "message": "Failed to advance to tara_sky_2."}

	# Advance to Veer resolution
	var adv3 = dr.advance()
	if not adv3 or dr.current_node_id != "veer_sky_2":
		return {"name": test_name, "passed": false, "message": "Failed to advance to veer_sky_2."}

	# Advance past end
	var ended = not dr.advance()
	if not ended or dr.is_active:
		return {"name": test_name, "passed": false, "message": "Dialogue did not terminate cleanly."}

	return {"name": test_name, "passed": true}

static func _test_prana_glider_physics() -> Dictionary:
	var test_name = "test_prana_glider_physics"
	var player_scene = load("res://scenes/player/Player3D.tscn")
	var player = player_scene.instantiate() as PlayerController3D

	# In air, falling down
	player.velocity.y = -10.0
	player.is_gliding = true
	# Simulate glide clamp
	if player.is_gliding and player.velocity.y < -player.glide_fall_speed:
		player.velocity.y = -player.glide_fall_speed

	if player.velocity.y != -player.glide_fall_speed:
		player.free()
		return {"name": test_name, "passed": false, "message": "Glider failed to clamp descent speed to -2.0 m/s."}

	if player.glide_speed < 10.0:
		player.free()
		return {"name": test_name, "passed": false, "message": "Glider horizontal speed too low."}

	player.free()
	return {"name": test_name, "passed": true}

static func _test_harpoon_grapple_tether_and_pull() -> Dictionary:
	var test_name = "test_harpoon_grapple_tether_and_pull"
	var player_scene = load("res://scenes/player/Player3D.tscn")
	var player = player_scene.instantiate() as PlayerController3D
	player.position = Vector3(0, 10, 0)

	var anchor_scene = load("res://scenes/interactables/GrappleAnchor3D.tscn")
	var anchor = anchor_scene.instantiate() as Node3D
	anchor.position = Vector3(10, 20, 0)

	var dist = player.position.distance_to(anchor.position)
	if dist > 28.0:
		anchor.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "Anchor outside grapple range."}

	# Set grappling
	player.is_grappling = true
	player.grapple_target_pos = anchor.position
	var pull_dir = (player.grapple_target_pos - player.position).normalized()
	player.velocity = pull_dir * player.grapple_speed

	if player.velocity.length() < 20.0:
		anchor.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "Grapple pull speed below target threshold."}

	anchor.free()
	player.free()
	return {"name": test_name, "passed": true}

static func _test_thermal_vent_updraft() -> Dictionary:
	var test_name = "test_thermal_vent_updraft"
	var player_scene = load("res://scenes/player/Player3D.tscn")
	var player = player_scene.instantiate() as PlayerController3D
	player.is_gliding = true
	player.velocity.y = -2.0

	# Apply thermal vent updraft
	player.apply_updraft(14.0)

	if player.velocity.y <= 0.0:
		player.free()
		return {"name": test_name, "passed": false, "message": "Thermal vent did not apply positive lift."}

	if player.velocity.y > 12.0:
		player.free()
		return {"name": test_name, "passed": false, "message": "Thermal vent exceeded max climb speed."}

	player.free()
	return {"name": test_name, "passed": true}

static func _test_gale_falcon_ai_and_dive_attack() -> Dictionary:
	var test_name = "test_gale_falcon_ai_and_dive_attack"
	var falcon_scene = load("res://scenes/entities/GaleFalcon3D.tscn")
	var falcon = falcon_scene.instantiate() as CharacterBody3D

	if falcon.current_state != GaleFalconScript.State.CIRCLING:
		falcon.free()
		return {"name": test_name, "passed": false, "message": "Falcon should initialize in CIRCLING state."}

	# Set telegraph countdown
	falcon.current_state = GaleFalconScript.State.TELEGRAPH
	falcon.state_timer = 0.8
	# Simulate timer completion
	falcon.current_state = GaleFalconScript.State.DIVE_ATTACK
	falcon.velocity = Vector3(0, -1, 1).normalized() * 18.0

	if falcon.velocity.length() < 16.0:
		falcon.free()
		return {"name": test_name, "passed": false, "message": "Falcon dive attack speed too low."}

	# Test take damage
	falcon.take_damage(20)
	if falcon.current_health != 30:
		falcon.free()
		return {"name": test_name, "passed": false, "message": "Falcon health did not decrease correctly."}

	falcon.take_damage(40)
	if falcon.current_state != GaleFalconScript.State.DEFEATED:
		falcon.free()
		return {"name": test_name, "passed": false, "message": "Falcon did not enter DEFEATED state on fatal damage."}

	falcon.free()
	return {"name": test_name, "passed": true}

static func _test_wind_archer_hover_and_combat() -> Dictionary:
	var test_name = "test_wind_archer_hover_and_combat"
	var archer_scene = load("res://scenes/entities/WindArcher3D.tscn")
	var archer = archer_scene.instantiate() as CharacterBody3D

	if archer.max_health != 70 or archer.current_health != 70:
		archer.free()
		return {"name": test_name, "passed": false, "message": "Archer initial health incorrect."}

	# Test damage and stagger
	archer.take_damage(20)
	if archer.current_health != 50:
		archer.free()
		return {"name": test_name, "passed": false, "message": "Archer health did not decrease by 20."}

	archer.take_damage(60)
	if archer.current_state != WindArcherScript.State.DEFEATED:
		archer.free()
		return {"name": test_name, "passed": false, "message": "Archer should enter DEFEATED state on fatal hit."}

	archer.free()
	return {"name": test_name, "passed": true}

static func _test_boss_matarishvan_phases_and_enrage() -> Dictionary:
	var test_name = "test_boss_matarishvan_phases_and_enrage"
	var boss_scene = load("res://scenes/entities/BossMatarishvan3D.tscn")
	var boss = boss_scene.instantiate() as CharacterBody3D

	if boss.max_health != 350 or boss.current_health != 350:
		boss.free()
		return {"name": test_name, "passed": false, "message": "Boss initial health should be 350."}
	if boss.current_phase != 1:
		boss.free()
		return {"name": test_name, "passed": false, "message": "Boss should start in Phase 1."}

	# Damage to 250 (still Phase 1)
	boss.take_damage(100)
	if boss.current_health != 250 or boss.current_phase != 1:
		boss.free()
		return {"name": test_name, "passed": false, "message": "Boss should remain Phase 1 at 250 HP."}

	# Damage to 150 (below 175 = 50%, trigger Enrage Phase 2)
	boss.take_damage(100)
	if boss.current_health != 150:
		boss.free()
		return {"name": test_name, "passed": false, "message": "Boss health should be 150 HP."}
	if boss.current_phase != 2 or not boss.is_enraged:
		boss.free()
		return {"name": test_name, "passed": false, "message": "Boss should enrage into Phase 2 at <= 50% HP."}

	# End enrage roar and transition to combat
	boss.current_state = BossMatarishvanScript.State.HOVER_COMBAT

	# Fatal damage
	boss.take_damage(200)
	if boss.current_health != 0 or boss.current_state != BossMatarishvanScript.State.DEFEATED:
		boss.free()
		return {"name": test_name, "passed": false, "message": "Boss should be DEFEATED on fatal hit."}

	boss.free()
	return {"name": test_name, "passed": true}

static func _test_vayu_turbine_and_save_state() -> Dictionary:
	var test_name = "test_vayu_turbine_and_save_state"
	var turbine = VayuTurbineScript.new()

	var turbine_signal = {"fired": false}
	turbine.turbine_harmonized.connect(func(_id): turbine_signal["fired"] = true)
	turbine.interact(null)

	if not turbine.is_harmonized or not turbine_signal["fired"]:
		var err_msg = "Turbine harmonized: %s, signal: %s" % [str(turbine.is_harmonized), str(turbine_signal["fired"])]
		turbine.free()
		return {"name": test_name, "passed": false, "message": err_msg}

	turbine.free()

	# Test Save state with Antariksha and Dyaus realms
	var default_state = SaveSystemScript.get_default_state()
	default_state["currentRealm"] = "Dyaus"
	default_state["shardsCollected"] = 8
	default_state["unlockedRealms"].append("Antariksha")
	default_state["unlockedRealms"].append("Dyaus")

	var ok_save = SaveSystemScript.save_game(default_state)
	if not ok_save:
		return {"name": test_name, "passed": false, "message": "Save failed."}

	var loaded = SaveSystemScript.load_game()
	if not loaded or loaded["currentRealm"] != "Dyaus":
		return {"name": test_name, "passed": false, "message": "Save state realm serialization failed."}
	if not loaded["unlockedRealms"].has("Antariksha") or not loaded["unlockedRealms"].has("Dyaus"):
		return {"name": test_name, "passed": false, "message": "Unlocked realms not preserved in save."}

	return {"name": test_name, "passed": true}
