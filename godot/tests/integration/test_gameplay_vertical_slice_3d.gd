class_name TestGameplayVerticalSlice3D
extends RefCounted

## Stage E Integration Test Suite: Complete Entertaining Gameplay Vertical Slice
## Validates QuestManager, DialogueRunner, AsuraWarrior AI, Boss Kalanemi,
## Combat Mechanics, Tamas Barrier, and SaveSystem persistence.

const QuestManagerScript = preload("res://scripts/domain/quest_manager.gd")
const DialogueRunnerScript = preload("res://scripts/domain/dialogue_runner.gd")
const SaveSystemScript = preload("res://scripts/domain/save_system.gd")
const CombatMathScript = preload("res://scripts/domain/combat_math.gd")
const AsuraWarriorScript = preload("res://scripts/entities/asura_warrior_3d.gd")
const BossKalanemiScript = preload("res://scripts/entities/boss_kalanemi_3d.gd")
const BhumiValleyScript = preload("res://scripts/levels/bhumi_valley_3d.gd")
const PlayerControllerScript = preload("res://scripts/player/player_controller_3d.gd")

static func run_all() -> Array:
	var results: Array = []
	results.append(_test_quest_system_initialization_and_progression())
	results.append(_test_devi_tara_and_dialogue_runner_flow())
	results.append(_test_asura_warrior_ai_and_combat_interactions())
	results.append(_test_boss_kalanemi_phase_mechanics_and_enrage())
	results.append(_test_tamas_barrier_shatter_on_three_shards())
	results.append(_test_save_system_progression_and_tamper_verification())
	results.append(_test_checkpoint_respawn_and_retry_flow())
	return results

static func _test_quest_system_initialization_and_progression() -> Dictionary:
	var test_name = "test_quest_system_initialization_and_progression"
	var qm = QuestManagerScript.new()
	var mission = qm.get_mission("cleansing_of_bhumi")
	if not mission:
		return {"name": test_name, "passed": false, "message": "Mission cleansing_of_bhumi missing."}
	if mission.objectives.size() < 4:
		return {"name": test_name, "passed": false, "message": "Expected 4 objectives in mission."}

	var ok = qm.start_mission("cleansing_of_bhumi")
	if not ok or qm.get_mission_status("cleansing_of_bhumi") != QuestManagerScript.Status.ACTIVE:
		return {"name": test_name, "passed": false, "message": "Failed to activate mission."}

	# Progress objective 1 (commune_tara)
	qm.update_objective_progress("cleansing_of_bhumi", "commune_tara", 1)
	if not mission.objectives[0].is_completed:
		return {"name": test_name, "passed": false, "message": "Objective commune_tara failed to complete."}

	# Progress objective 2 (reclaim_shards)
	qm.update_objective_progress("cleansing_of_bhumi", "reclaim_shards", 1)
	qm.update_objective_progress("cleansing_of_bhumi", "reclaim_shards", 2)
	if not mission.objectives[1].is_completed:
		return {"name": test_name, "passed": false, "message": "Objective reclaim_shards failed to complete."}

	# Progress objective 3 (defeat_kalanemi)
	qm.update_objective_progress("cleansing_of_bhumi", "defeat_kalanemi", 1)
	if not mission.objectives[2].is_completed:
		return {"name": test_name, "passed": false, "message": "Objective defeat_kalanemi failed to complete."}

	# Complete objective 4 (consecrate_altar)
	qm.update_objective_progress("cleansing_of_bhumi", "consecrate_altar", 1)
	if not mission.objectives[3].is_completed:
		return {"name": test_name, "passed": false, "message": "Objective consecrate_altar failed to complete."}
	if qm.get_mission_status("cleansing_of_bhumi") != QuestManagerScript.Status.COMPLETED:
		return {"name": test_name, "passed": false, "message": "Mission status should be COMPLETED."}

	return {"name": test_name, "passed": true}

static func _test_devi_tara_and_dialogue_runner_flow() -> Dictionary:
	var test_name = "test_devi_tara_and_dialogue_runner_flow"
	var dr = DialogueRunnerScript.new()
	var started = dr.start("tara_dandaka_1")
	if not started or not dr.is_active:
		return {"name": test_name, "passed": false, "message": "Failed to start tara_dandaka_1."}
	if dr.current_node_id != "tara_dandaka_1":
		return {"name": test_name, "passed": false, "message": "Incorrect start node."}

	# Advance to Veer reply
	var adv1 = dr.advance()
	if not adv1 or dr.current_node_id != "veer_dandaka_1":
		return {"name": test_name, "passed": false, "message": "Failed to advance to veer_dandaka_1."}

	# Advance to Tara instructions
	var adv2 = dr.advance()
	if not adv2 or dr.current_node_id != "tara_dandaka_2":
		return {"name": test_name, "passed": false, "message": "Failed to advance to tara_dandaka_2."}

	# Advance to Veer resolution
	var adv3 = dr.advance()
	if not adv3 or dr.current_node_id != "veer_dandaka_2":
		return {"name": test_name, "passed": false, "message": "Failed to advance to veer_dandaka_2."}

	# Conclude dialogue
	var adv4 = dr.advance()
	if adv4 or dr.is_active:
		return {"name": test_name, "passed": false, "message": "Dialogue should be inactive after final node."}

	return {"name": test_name, "passed": true}

static func _test_asura_warrior_ai_and_combat_interactions() -> Dictionary:
	var test_name = "test_asura_warrior_ai_and_combat_interactions"
	var warrior = AsuraWarriorScript.new()
	if not warrior.is_in_group("enemies") or not warrior.is_in_group("targetable"):
		warrior.free()
		return {"name": test_name, "passed": false, "message": "Warrior missing groups."}

	var initial_hp = warrior.current_health
	var atk = CombatMathScript.AttackSpec.new("veer_slash", 25, 30.0, Vector3.ZERO)
	var hit_res = warrior.take_damage_spec(atk)

	if hit_res.damage_dealt != 25:
		warrior.free()
		return {"name": test_name, "passed": false, "message": "Expected 25 damage dealt."}
	if warrior.current_health != initial_hp - 25:
		warrior.free()
		return {"name": test_name, "passed": false, "message": "Incorrect remaining HP."}

	# Trigger poise break with heavy attack on living warrior (warrior HP: 55, Poise: 20)
	var heavy_atk = CombatMathScript.AttackSpec.new("veer_heavy", 30, 60.0, Vector3.ZERO)
	var heavy_res = warrior.take_damage_spec(heavy_atk)
	if not heavy_res.triggered_stagger:
		warrior.free()
		return {"name": test_name, "passed": false, "message": "Expected poise break on heavy attack."}
	if warrior.current_state != AsuraWarriorScript.State.STAGGERED:
		warrior.free()
		return {"name": test_name, "passed": false, "message": "Warrior state should be STAGGERED."}

	# Fatal strike to verify defeat trigger
	var defeated_signal = {"fired": false}
	warrior.warrior_defeated.connect(func(_w): defeated_signal["fired"] = true)
	var fatal_atk = CombatMathScript.AttackSpec.new("veer_fatal", 30, 20.0, Vector3.ZERO)
	warrior.take_damage_spec(fatal_atk)
	if not defeated_signal["fired"] or warrior.current_state != AsuraWarriorScript.State.DEFEATED:
		warrior.free()
		return {"name": test_name, "passed": false, "message": "Warrior failed to trigger defeated state."}

	warrior.free()
	return {"name": test_name, "passed": true}

static func _test_boss_kalanemi_phase_mechanics_and_enrage() -> Dictionary:
	var test_name = "test_boss_kalanemi_phase_mechanics_and_enrage"
	var boss = BossKalanemiScript.new()
	if not boss.is_in_group("boss") or not boss.is_in_group("enemies"):
		boss.free()
		return {"name": test_name, "passed": false, "message": "Boss missing groups."}

	# Activate boss
	boss.activate_boss()
	if not boss.is_active or boss.current_state != BossKalanemiScript.State.CHASE:
		boss.free()
		return {"name": test_name, "passed": false, "message": "Boss failed to activate."}

	# Damage boss down past 50% HP (350 -> <= 175) to trigger Phase 2 Enrage
	var atk1 = CombatMathScript.AttackSpec.new("veer_combo", 180, 50.0, Vector3.ZERO)
	boss.take_damage_spec(atk1)

	if boss.current_phase != BossKalanemiScript.BossPhase.PHASE_2_ENRAGED:
		boss.free()
		return {"name": test_name, "passed": false, "message": "Boss should transition to Phase 2 Enraged."}
	if boss.current_state != BossKalanemiScript.State.ENRAGE_ROAR:
		boss.free()
		return {"name": test_name, "passed": false, "message": "Boss should be in ENRAGE_ROAR."}

	# Conclude enrage roar and transition back to chase
	boss.current_state = BossKalanemiScript.State.CHASE

	# Finish off boss to verify defeat trigger
	var boss_defeated_signal = {"fired": false}
	boss.boss_defeated.connect(func(): boss_defeated_signal["fired"] = true)

	var fatal_atk = CombatMathScript.AttackSpec.new("veer_fatal", 200, 100.0, Vector3.ZERO)
	boss.take_damage_spec(fatal_atk)

	if not boss_defeated_signal["fired"] or boss.current_state != BossKalanemiScript.State.DEFEATED:
		boss.free()
		return {"name": test_name, "passed": false, "message": "Boss failed to trigger defeated state."}

	boss.free()
	return {"name": test_name, "passed": true}

static func _test_tamas_barrier_shatter_on_three_shards() -> Dictionary:
	var test_name = "test_tamas_barrier_shatter_on_three_shards"
	var level = BhumiValleyScript.new()

	var barrier = StaticBody3D.new()
	barrier.name = "TamasBarrier"
	barrier.collision_layer = 1
	level.tamas_barrier = barrier

	level.collected_shards = 2
	level._on_shard_collected() # Becomes 3
	if level.collected_shards != 3:
		barrier.free()
		level.free()
		return {"name": test_name, "passed": false, "message": "Shard count not 3."}
	if not level.is_barrier_dispelled:
		barrier.free()
		level.free()
		return {"name": test_name, "passed": false, "message": "Tamas barrier was not dispelled."}

	barrier.free()
	level.free()
	return {"name": test_name, "passed": true}

static func _test_save_system_progression_and_tamper_verification() -> Dictionary:
	var test_name = "test_save_system_progression_and_tamper_verification"
	var state = SaveSystemScript.get_default_state()
	state["currentRealm"] = "Antariksha"
	state["shardsCollected"] = 5
	state["altarConsecrated"] = true
	state["highScore"] = 2500

	var saved = SaveSystemScript.save_game(state)
	if not saved:
		return {"name": test_name, "passed": false, "message": "Failed to save game."}

	var loaded = SaveSystemScript.load_game()
	if loaded.get("currentRealm", "") != "Antariksha":
		return {"name": test_name, "passed": false, "message": "Current realm not Antariksha."}
	if int(loaded.get("shardsCollected", 0)) != 5:
		return {"name": test_name, "passed": false, "message": "Incorrect shards count."}
	if not loaded.get("altarConsecrated", false):
		return {"name": test_name, "passed": false, "message": "Altar should be consecrated."}

	# Verify tamper detection
	var tampered = loaded.duplicate()
	tampered["highScore"] = 999999
	var calculated = SaveSystemScript.calculate_checksum(tampered)
	if calculated == tampered["checksum"]:
		return {"name": test_name, "passed": false, "message": "Tamper detection failed."}

	return {"name": test_name, "passed": true}

static func _test_checkpoint_respawn_and_retry_flow() -> Dictionary:
	var test_name = "test_checkpoint_respawn_and_retry_flow"
	var level = BhumiValleyScript.new()
	var cp_pos = Vector3(36.0, 6.5, -5.0)

	level._on_checkpoint_activated("checkpoint_tapas_ridge", cp_pos)
	if level.last_checkpoint_pos != cp_pos:
		level.free()
		return {"name": test_name, "passed": false, "message": "Checkpoint position not recorded."}

	var dummy_player = CharacterBody3D.new()
	dummy_player.set_script(PlayerControllerScript)
	dummy_player.health = 0
	dummy_player.position = Vector3(100, 0, 100)
	level.player = dummy_player

	level._on_retry_requested()
	if dummy_player.health != 100:
		dummy_player.free()
		level.free()
		return {"name": test_name, "passed": false, "message": "Health not restored to 100 on retry."}
	if dummy_player.position != cp_pos:
		dummy_player.free()
		level.free()
		return {"name": test_name, "passed": false, "message": "Player position not reset to checkpoint."}

	dummy_player.free()
	level.free()
	return {"name": test_name, "passed": true}
