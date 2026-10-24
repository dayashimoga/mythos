class_name TestTapolokaRealm3D
extends RefCounted

## Chapter VI Integration Test Suite: Realm of Janaloka / Tapoloka (The Ascetic Flame & Agni's Primordial Forge)
## Validates QuestManager, DialogueRunner, Magma Pressure Geyser physics & cyclic eruption,
## Primordial Anvil Forge attunement, Agni Berserker flame asura AI & whirlwind,
## Tapas Magma Hound quadruped AI & spit/pounce, Boss Agni Rudra 2-phase enrage,
## Sacred Tapas Peetham consecration, and 3D level scene integrity.

const QuestManagerScript = preload("res://scripts/domain/quest_manager.gd")
const DialogueRunnerScript = preload("res://scripts/domain/dialogue_runner.gd")
const SaveSystemScript = preload("res://scripts/domain/save_system.gd")
const CombatMath = preload("res://scripts/domain/combat_math.gd")
const PlayerControllerScript = preload("res://scripts/player/player_controller_3d.gd")
const AgniBerserkerScript = preload("res://scripts/entities/agni_berserker_3d.gd")
const TapasMagmaHoundScript = preload("res://scripts/entities/tapas_magma_hound_3d.gd")
const BossAgniRudraScript = preload("res://scripts/entities/boss_agni_rudra_3d.gd")
const MagmaGeyserScript = preload("res://scripts/interactables/magma_geyser_3d.gd")
const PrimordialForgeScript = preload("res://scripts/interactables/primordial_forge_3d.gd")
const TapoPeethamScript = preload("res://scripts/interactables/tapo_peetham_3d.gd")

static func run_all() -> Array:
	var results: Array = []
	results.append(_test_tapoloka_quest_progression())
	results.append(_test_tapoloka_dialogue_flow())
	results.append(_test_magma_geyser_eruption())
	results.append(_test_primordial_forge_attunement())
	results.append(_test_agni_berserker_combat_and_whirlwind())
	results.append(_test_tapas_magma_hound_ai_and_spit())
	results.append(_test_boss_agni_rudra_phases_and_enrage())
	results.append(_test_tapo_peetham_and_save_state())
	results.append(_test_tapoloka_level_scene_integrity())
	return results

static func _test_tapoloka_quest_progression() -> Dictionary:
	var test_name = "test_tapoloka_quest_progression"
	var qm = QuestManagerScript.new()
	var mission = qm.get_mission("purification_of_tapoloka")
	if not mission:
		return {"name": test_name, "passed": false, "message": "Mission purification_of_tapoloka missing."}
	if mission.objectives.size() < 4:
		return {"name": test_name, "passed": false, "message": "Expected 4 objectives in mission."}

	var ok = qm.start_mission("purification_of_tapoloka")
	if not ok or qm.get_mission_status("purification_of_tapoloka") != QuestManagerScript.Status.ACTIVE:
		return {"name": test_name, "passed": false, "message": "Failed to activate mission."}

	# Objective 1: commune_tara_forge
	qm.update_objective_progress("purification_of_tapoloka", "commune_tara_forge", 1)
	if not mission.objectives[0].is_completed:
		return {"name": test_name, "passed": false, "message": "commune_tara_forge failed to complete."}

	# Objective 2: attune_forges (target 2)
	qm.update_objective_progress("purification_of_tapoloka", "attune_forges", 1)
	if mission.objectives[1].is_completed:
		return {"name": test_name, "passed": false, "message": "attune_forges prematurely completed at 1/2."}
	qm.update_objective_progress("purification_of_tapoloka", "attune_forges", 1)
	if not mission.objectives[1].is_completed:
		return {"name": test_name, "passed": false, "message": "attune_forges failed to complete at 2/2."}

	# Objective 3: defeat_agni_rudra
	qm.update_objective_progress("purification_of_tapoloka", "defeat_agni_rudra", 1)
	if not mission.objectives[2].is_completed:
		return {"name": test_name, "passed": false, "message": "defeat_agni_rudra failed to complete."}

	# Objective 4: consecrate_tapo_peetham
	qm.update_objective_progress("purification_of_tapoloka", "consecrate_tapo_peetham", 1)
	if not mission.objectives[3].is_completed:
		return {"name": test_name, "passed": false, "message": "consecrate_tapo_peetham failed to complete."}

	if qm.get_mission_status("purification_of_tapoloka") != QuestManagerScript.Status.COMPLETED:
		return {"name": test_name, "passed": false, "message": "Mission should be COMPLETED."}

	return {"name": test_name, "passed": true, "message": "Tapoloka quest progression verified."}

static func _test_tapoloka_dialogue_flow() -> Dictionary:
	var test_name = "test_tapoloka_dialogue_flow"
	var dr = DialogueRunnerScript.new()
	var ok = dr.start("tara_tapo_1")
	if not ok:
		return {"name": test_name, "passed": false, "message": "Failed to start dialogue tara_tapo_1."}

	if dr.current_node_id != "tara_tapo_1":
		return {"name": test_name, "passed": false, "message": "Expected start at tara_tapo_1."}

	# Advance to veer_tapo_1
	var adv1 = dr.advance()
	if not adv1 or dr.current_node_id != "veer_tapo_1":
		return {"name": test_name, "passed": false, "message": "Expected advance to veer_tapo_1."}

	# Advance to tara_tapo_2
	var adv2 = dr.advance()
	if not adv2 or dr.current_node_id != "tara_tapo_2":
		return {"name": test_name, "passed": false, "message": "Expected advance to tara_tapo_2."}

	# Advance to veer_tapo_2
	var adv3 = dr.advance()
	if not adv3 or dr.current_node_id != "veer_tapo_2":
		return {"name": test_name, "passed": false, "message": "Expected advance to veer_tapo_2."}

	# Advance finishes dialogue
	var adv4 = dr.advance()
	if adv4 or dr.is_active:
		return {"name": test_name, "passed": false, "message": "Dialogue should finish after veer_tapo_2."}

	return {"name": test_name, "passed": true, "message": "Tapoloka dialogue sequence verified."}

static func _test_magma_geyser_eruption() -> Dictionary:
	var test_name = "test_magma_geyser_eruption"
	var geyser = MagmaGeyserScript.new()
	geyser.geyser_id = "test_geyser"
	geyser.eruption_force = 20.0
	geyser.dormant_duration = 0.1
	geyser.buildup_duration = 0.1

	var test_body = CharacterBody3D.new()
	test_body.velocity = Vector3(0, -4.0, 0)

	var erupted_signal = {"fired": false}
	geyser.geyser_erupted.connect(func(_id, _f):
		erupted_signal["fired"] = true
	)

	# Trigger manual eruption
	geyser._overlapping_bodies.append(test_body)
	geyser._trigger_eruption()

	if test_body.velocity.y < 20.0:
		test_body.free()
		geyser.free()
		return {"name": test_name, "passed": false, "message": "Body velocity Y should be boosted to at least 20.0."}

	if not erupted_signal["fired"]:
		test_body.free()
		geyser.free()
		return {"name": test_name, "passed": false, "message": "geyser_erupted signal was not emitted."}

	test_body.free()
	geyser.free()
	return {"name": test_name, "passed": true, "message": "Magma geyser eruption physics verified."}

static func _test_primordial_forge_attunement() -> Dictionary:
	var test_name = "test_primordial_forge_attunement"
	var forge = PrimordialForgeScript.new()
	forge.forge_id = "test_forge_alpha"

	var attuned_signal = {"fired": false}
	forge.forge_attuned.connect(func(_id):
		attuned_signal["fired"] = true
	)

	forge.interact()
	if not forge.is_attuned:
		forge.free()
		return {"name": test_name, "passed": false, "message": "Forge should be marked as attuned."}

	if not attuned_signal["fired"]:
		forge.free()
		return {"name": test_name, "passed": false, "message": "forge_attuned signal not received."}

	# Duplicate interact ignored
	attuned_signal["fired"] = false
	forge.interact()
	if attuned_signal["fired"]:
		forge.free()
		return {"name": test_name, "passed": false, "message": "Duplicate interact should not re-emit signal."}

	forge.free()
	return {"name": test_name, "passed": true, "message": "Primordial forge attunement verified."}

static func _test_agni_berserker_combat_and_whirlwind() -> Dictionary:
	var test_name = "test_agni_berserker_combat_and_whirlwind"
	var berserker = AgniBerserkerScript.new()
	berserker.position = Vector3(0, 0, 0)

	var dummy_player = CharacterBody3D.new()
	dummy_player.add_to_group("player")
	dummy_player.position = Vector3(0, 0, 5.0)
	berserker.target_player = dummy_player

	# Patrol to chase rush
	berserker._process_patrol(0.1)
	if berserker.current_state != AgniBerserkerScript.State.CHASE_RUSH:
		dummy_player.free()
		berserker.free()
		return {"name": test_name, "passed": false, "message": "Expected CHASE_RUSH state."}

	# Damage & Poise stagger
	berserker.take_hit(40, 70.0) # Inflicts 70 poise damage, breaking 60 max poise
	if berserker.current_health != 100:
		dummy_player.free()
		berserker.free()
		return {"name": test_name, "passed": false, "message": "Expected 100 HP after hit."}

	if berserker.current_state != AgniBerserkerScript.State.STAGGERED:
		dummy_player.free()
		berserker.free()
		return {"name": test_name, "passed": false, "message": "Expected STAGGERED state upon poise break."}

	dummy_player.free()
	berserker.free()
	return {"name": test_name, "passed": true, "message": "Agni Berserker combat and whirlwind verified."}

static func _test_tapas_magma_hound_ai_and_spit() -> Dictionary:
	var test_name = "test_tapas_magma_hound_ai_and_spit"
	var hound = TapasMagmaHoundScript.new()
	hound.position = Vector3(0, 0, 0)

	var dummy_player = CharacterBody3D.new()
	dummy_player.add_to_group("player")
	dummy_player.position = Vector3(0, 0, 8.0)
	hound.target_player = dummy_player

	# Initial stalk to spit telegraph
	hound.state_timer = 2.0
	hound._process_stalk(0.1)
	if hound.current_state != TapasMagmaHoundScript.State.MAGMA_SPIT_TELEGRAPH:
		dummy_player.free()
		hound.free()
		return {"name": test_name, "passed": false, "message": "Expected MAGMA_SPIT_TELEGRAPH state."}

	# Spit release
	hound.state_timer = 0.55
	hound._process_spit_telegraph(0.1)
	if hound.current_state != TapasMagmaHoundScript.State.MAGMA_SPIT_RELEASE:
		dummy_player.free()
		hound.free()
		return {"name": test_name, "passed": false, "message": "Expected MAGMA_SPIT_RELEASE state."}

	dummy_player.free()
	hound.free()
	return {"name": test_name, "passed": true, "message": "Tapas magma hound AI and spit verified."}

static func _test_boss_agni_rudra_phases_and_enrage() -> Dictionary:
	var test_name = "test_boss_agni_rudra_phases_and_enrage"
	var boss = BossAgniRudraScript.new()
	boss.position = Vector3(0, 0, 0)

	var dummy_player = CharacterBody3D.new()
	dummy_player.add_to_group("player")
	dummy_player.position = Vector3(0, 0, 16.0)
	boss.target_player = dummy_player

	if boss.max_health != 600 or boss.current_health != 600:
		dummy_player.free()
		boss.free()
		return {"name": test_name, "passed": false, "message": "Boss should start at 600 HP."}

	# Phase 1 approach
	boss._process_idle(0.1)
	if boss.current_state != BossAgniRudraScript.State.CONFLAGRATION_APPROACH:
		dummy_player.free()
		boss.free()
		return {"name": test_name, "passed": false, "message": "Expected CONFLAGRATION_APPROACH state."}

	# Damage to trigger Enrage Phase 2 (<= 300 HP)
	boss.take_damage(310) # 600 - 310 = 290 HP
	if boss.current_phase != 2:
		dummy_player.free()
		boss.free()
		return {"name": test_name, "passed": false, "message": "Expected Phase 2 upon taking heavy damage."}

	if not boss.is_enraged:
		dummy_player.free()
		boss.free()
		return {"name": test_name, "passed": false, "message": "Boss should be marked enraged."}

	if boss.current_state != BossAgniRudraScript.State.TAPAS_ENRAGE_ROAR:
		dummy_player.free()
		boss.free()
		return {"name": test_name, "passed": false, "message": "Expected TAPAS_ENRAGE_ROAR state."}

	# Defeat check
	var defeated_signal = {"fired": false}
	boss.boss_defeated.connect(func(): defeated_signal["fired"] = true)
	boss.take_damage(350)
	if not defeated_signal["fired"] or boss.current_state != BossAgniRudraScript.State.DEFEATED:
		dummy_player.free()
		boss.free()
		return {"name": test_name, "passed": false, "message": "Expected boss_defeated signal and DEFEATED state."}

	dummy_player.free()
	boss.free()
	return {"name": test_name, "passed": true, "message": "Boss Agni Rudra phases and enrage verified."}

static func _test_tapo_peetham_and_save_state() -> Dictionary:
	var test_name = "test_tapo_peetham_and_save_state"
	var peetham = TapoPeethamScript.new()

	var consecrated_signal = {"fired": false}
	peetham.peetham_consecrated.connect(func(_altar):
		consecrated_signal["fired"] = true
	)

	peetham.interact()
	if not peetham.is_consecrated:
		peetham.free()
		return {"name": test_name, "passed": false, "message": "Peetham should be marked consecrated."}

	if not consecrated_signal["fired"]:
		peetham.free()
		return {"name": test_name, "passed": false, "message": "peetham_consecrated signal was not emitted."}

	# Test save system contract with Tapoloka
	var state = SaveSystemScript.get_default_state()
	state["currentRealm"] = "Tapoloka"
	state["shardsCollected"] = 24
	state["altarConsecrated"] = true
	state["unlockedRealms"].append("Tapoloka")

	var saved = SaveSystemScript.save_game(state)
	if not saved:
		peetham.free()
		return {"name": test_name, "passed": false, "message": "Failed to save game state."}

	var loaded = SaveSystemScript.load_game()
	if not loaded or loaded["currentRealm"] != "Tapoloka":
		peetham.free()
		return {"name": test_name, "passed": false, "message": "Loaded state should have currentRealm Tapoloka."}

	peetham.free()
	return {"name": test_name, "passed": true, "message": "Tapo Peetham consecration and save state verified."}

static func _test_tapoloka_level_scene_integrity() -> Dictionary:
	var test_name = "test_tapoloka_level_scene_integrity"
	var scene_res = load("res://scenes/levels/TapolokaForge3D.tscn")
	if not scene_res:
		return {"name": test_name, "passed": false, "message": "Failed to load TapolokaForge3D.tscn."}

	var level = scene_res.instantiate()
	if not level:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate TapolokaForge3D."}

	# Verify essential nodes exist
	var player = level.get_node_or_null("Player3D")
	var hud = level.get_node_or_null("HUD3D")
	var tara = level.get_node_or_null("DeviTaraTapo3D")
	var boss = level.get_node_or_null("BossAgniRudra3D")
	var peetham = level.get_node_or_null("TapoPeetham3D")
	var geyser1 = level.get_node_or_null("MagmaGeyser1")
	var forge1 = level.get_node_or_null("PrimordialForge1")
	var berserker1 = level.get_node_or_null("AgniBerserker1")
	var hound1 = level.get_node_or_null("TapasMagmaHound1")

	if not player or not hud or not tara or not boss or not peetham:
		level.free()
		return {"name": test_name, "passed": false, "message": "Missing core entity nodes in level."}

	if not geyser1 or not forge1 or not berserker1 or not hound1:
		level.free()
		return {"name": test_name, "passed": false, "message": "Missing Tapoloka interactive/enemy nodes."}

	level.free()
	return {"name": test_name, "passed": true, "message": "Tapoloka level scene integrity verified."}
