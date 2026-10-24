class_name TestSatyalokaRealm3D
extends RefCounted

## Chapter VII Integration Test Suite: Realm of Satyaloka / Brahmaloka (The Transcendent Apex & Cosmic Wheel of Dharma)
## Validates QuestManager Act VII, DialogueRunner Satyaloka sequence, Dharmachakra Resonators,
## Brahman Light Bridges manifestation, Moksha Seraph aerial caster AI & prismatic barrier,
## Dharma Sentinel crystalline AI & lotus guard, Boss Brahma Avatara 2-phase enrage & cosmic dissolution,
## Moksha Mahapeetham consecration, full Seven-Realm save state integrity, and 3D level scene structure.

const QuestManagerScript = preload("res://scripts/domain/quest_manager.gd")
const DialogueRunnerScript = preload("res://scripts/domain/dialogue_runner.gd")
const SaveSystemScript = preload("res://scripts/domain/save_system.gd")
const CombatMath = preload("res://scripts/domain/combat_math.gd")
const MokshaSeraphScript = preload("res://scripts/entities/moksha_seraph_3d.gd")
const DharmaSentinelScript = preload("res://scripts/entities/dharma_sentinel_3d.gd")
const BossBrahmaAvataraScript = preload("res://scripts/entities/boss_brahma_avatara_3d.gd")
const DharmachakraNodeScript = preload("res://scripts/interactables/dharmachakra_node_3d.gd")
const BrahmanBridgeScript = preload("res://scripts/interactables/brahman_bridge_3d.gd")
const MokshaPeethamScript = preload("res://scripts/interactables/moksha_peetham_3d.gd")

static func run_all() -> Array:
	var results: Array = []
	results.append(_test_satyaloka_quest_progression())
	results.append(_test_satyaloka_dialogue_flow())
	results.append(_test_dharmachakra_resonator_and_bridges())
	results.append(_test_moksha_seraph_ai_and_barrier())
	results.append(_test_dharma_sentinel_ai_and_guard())
	results.append(_test_boss_brahma_avatara_phases_and_enrage())
	results.append(_test_moksha_peetham_and_campaign_completion_save())
	results.append(_test_satyaloka_level_scene_integrity())
	return results

static func _test_satyaloka_quest_progression() -> Dictionary:
	var test_name = "test_satyaloka_quest_progression"
	var qm = QuestManagerScript.new()
	var mission = qm.get_mission("ascension_to_satyaloka")
	if not mission:
		return {"name": test_name, "passed": false, "message": "Mission ascension_to_satyaloka missing."}
	if mission.objectives.size() < 4:
		return {"name": test_name, "passed": false, "message": "Expected 4 objectives in mission."}

	var ok = qm.start_mission("ascension_to_satyaloka")
	if not ok or qm.get_mission_status("ascension_to_satyaloka") != QuestManagerScript.Status.ACTIVE:
		return {"name": test_name, "passed": false, "message": "Failed to activate mission."}

	# Objective 1: commune_tara_satya
	qm.update_objective_progress("ascension_to_satyaloka", "commune_tara_satya", 1)
	if not mission.objectives[0].is_completed:
		return {"name": test_name, "passed": false, "message": "commune_tara_satya failed to complete."}

	# Objective 2: align_dharmachakras (target 2)
	qm.update_objective_progress("ascension_to_satyaloka", "align_dharmachakras", 1)
	if mission.objectives[1].is_completed:
		return {"name": test_name, "passed": false, "message": "align_dharmachakras prematurely completed at 1/2."}
	qm.update_objective_progress("ascension_to_satyaloka", "align_dharmachakras", 1)
	if not mission.objectives[1].is_completed:
		return {"name": test_name, "passed": false, "message": "align_dharmachakras failed to complete at 2/2."}

	# Objective 3: defeat_brahma_avatara
	qm.update_objective_progress("ascension_to_satyaloka", "defeat_brahma_avatara", 1)
	if not mission.objectives[2].is_completed:
		return {"name": test_name, "passed": false, "message": "defeat_brahma_avatara failed to complete."}

	# Objective 4: consecrate_moksha_peetham
	qm.update_objective_progress("ascension_to_satyaloka", "consecrate_moksha_peetham", 1)
	if not mission.objectives[3].is_completed:
		return {"name": test_name, "passed": false, "message": "consecrate_moksha_peetham failed to complete."}

	if qm.get_mission_status("ascension_to_satyaloka") != QuestManagerScript.Status.COMPLETED:
		return {"name": test_name, "passed": false, "message": "Mission should be COMPLETED."}

	return {"name": test_name, "passed": true, "message": "Satyaloka quest progression verified."}

static func _test_satyaloka_dialogue_flow() -> Dictionary:
	var test_name = "test_satyaloka_dialogue_flow"
	var dr = DialogueRunnerScript.new()
	var ok = dr.start("tara_satya_1")
	if not ok:
		return {"name": test_name, "passed": false, "message": "Failed to start dialogue tara_satya_1."}

	if dr.current_node_id != "tara_satya_1":
		return {"name": test_name, "passed": false, "message": "Expected start at tara_satya_1."}

	# Advance to veer_satya_1
	var adv1 = dr.advance()
	if not adv1 or dr.current_node_id != "veer_satya_1":
		return {"name": test_name, "passed": false, "message": "Expected advance to veer_satya_1."}

	# Advance to tara_satya_2
	var adv2 = dr.advance()
	if not adv2 or dr.current_node_id != "tara_satya_2":
		return {"name": test_name, "passed": false, "message": "Expected advance to tara_satya_2."}

	# Advance to veer_satya_2
	var adv3 = dr.advance()
	if not adv3 or dr.current_node_id != "veer_satya_2":
		return {"name": test_name, "passed": false, "message": "Expected advance to veer_satya_2."}

	# End of dialogue
	var adv4 = dr.advance()
	if adv4 or dr.is_active:
		return {"name": test_name, "passed": false, "message": "Dialogue should have ended after veer_satya_2."}

	return {"name": test_name, "passed": true, "message": "Satyaloka dialogue sequence flow verified."}

static func _test_dharmachakra_resonator_and_bridges() -> Dictionary:
	var test_name = "test_dharmachakra_resonator_and_bridges"
	var chakra = DharmachakraNodeScript.new()
	var aligned_signal = {"fired": false}
	chakra.chakra_aligned.connect(func(_id): aligned_signal["fired"] = true)

	chakra.interact()
	if not chakra.is_aligned:
		chakra.free()
		return {"name": test_name, "passed": false, "message": "Dharmachakra should be aligned after interact."}

	if not aligned_signal["fired"]:
		chakra.free()
		return {"name": test_name, "passed": false, "message": "chakra_aligned signal was not emitted."}

	chakra.free()

	# Test BrahmanBridge3D manifestation
	var bridge = BrahmanBridgeScript.new()
	var bridge_signal = {"fired": false}
	bridge.bridge_manifested.connect(func(_id): bridge_signal["fired"] = true)

	if bridge.is_manifested:
		bridge.free()
		return {"name": test_name, "passed": false, "message": "Bridge should start unmanifested."}

	bridge.manifest_bridge()
	if not bridge.is_manifested:
		bridge.free()
		return {"name": test_name, "passed": false, "message": "Bridge should be manifested."}

	if not bridge_signal["fired"]:
		bridge.free()
		return {"name": test_name, "passed": false, "message": "bridge_manifested signal was not emitted."}

	bridge.free()
	return {"name": test_name, "passed": true, "message": "Dharmachakra resonator and Brahman bridge verified."}

static func _test_moksha_seraph_ai_and_barrier() -> Dictionary:
	var test_name = "test_moksha_seraph_ai_and_barrier"
	var seraph = MokshaSeraphScript.new()
	seraph.position = Vector3(0, 0, 0)
	seraph.global_position = Vector3(0, 0, 0)

	var dummy_player = CharacterBody3D.new()
	dummy_player.add_to_group("player")
	dummy_player.position = Vector3(0, 0, 8.0)
	dummy_player.global_position = Vector3(0, 0, 8.0)
	seraph.target_player = dummy_player

	# Hover to telegraph
	seraph.state_timer = 2.0
	seraph._process_hover(0.1)
	if seraph.current_state != MokshaSeraphScript.State.LIGHT_BURST_TELEGRAPH:
		dummy_player.free()
		seraph.free()
		return {"name": test_name, "passed": false, "message": "Expected LIGHT_BURST_TELEGRAPH state."}

	# Execute light burst
	seraph.state_timer = 0.8
	seraph._process_telegraph(0.1)
	if seraph.current_state != MokshaSeraphScript.State.LIGHT_BURST_EXECUTE:
		dummy_player.free()
		seraph.free()
		return {"name": test_name, "passed": false, "message": "Expected LIGHT_BURST_EXECUTE state."}

	# Damage to trigger barrier (< 50% HP)
	seraph.take_damage(80) # 150 - 80 = 70 (< 75 HP)
	seraph.state_timer = 0.0
	seraph._process_hover(0.1)
	if seraph.current_state != MokshaSeraphScript.State.PRISMATIC_BARRIER:
		dummy_player.free()
		seraph.free()
		return {"name": test_name, "passed": false, "message": "Expected PRISMATIC_BARRIER state at low HP."}

	seraph._process_barrier(0.01)
	if not seraph.is_barrier_active():
		dummy_player.free()
		seraph.free()
		return {"name": test_name, "passed": false, "message": "Barrier should be active."}

	# Verify poise break stagger
	seraph.take_damage(20, 80.0)
	if seraph.current_state != MokshaSeraphScript.State.STAGGERED:
		dummy_player.free()
		seraph.free()
		return {"name": test_name, "passed": false, "message": "Expected STAGGERED state on poise break."}

	dummy_player.free()
	seraph.free()
	return {"name": test_name, "passed": true, "message": "Moksha Seraph AI and prismatic barrier verified."}

static func _test_dharma_sentinel_ai_and_guard() -> Dictionary:
	var test_name = "test_dharma_sentinel_ai_and_guard"
	var sentinel = DharmaSentinelScript.new()
	sentinel.position = Vector3(0, 0, 0)
	sentinel.global_position = Vector3(0, 0, 0)

	var dummy_player = CharacterBody3D.new()
	dummy_player.add_to_group("player")
	dummy_player.position = Vector3(0, 0, 3.0)
	dummy_player.global_position = Vector3(0, 0, 3.0)
	sentinel.target_player = dummy_player

	# Chase into melee
	sentinel._process_chase(0.1)
	if sentinel.current_state != DharmaSentinelScript.State.SPEAR_THRUST_TELEGRAPH and sentinel.current_state != DharmaSentinelScript.State.LOTUS_GUARD:
		dummy_player.free()
		sentinel.free()
		return {"name": test_name, "passed": false, "message": "Expected telegraph or guard state in melee range."}

	# Force guard state to test blocking damage reduction
	sentinel.current_state = DharmaSentinelScript.State.LOTUS_GUARD
	if not sentinel.is_blocking():
		dummy_player.free()
		sentinel.free()
		return {"name": test_name, "passed": false, "message": "is_blocking should return true during LOTUS_GUARD."}

	var pre_hp = sentinel.current_health
	sentinel.take_damage(100) # 75% reduction -> takes 25 dmg
	var expected_hp = pre_hp - 25
	if sentinel.current_health != expected_hp:
		dummy_player.free()
		sentinel.free()
		return {"name": test_name, "passed": false, "message": "Guard damage reduction failed: expected %d, got %d" % [expected_hp, sentinel.current_health]}

	# Poise stagger
	sentinel.current_state = DharmaSentinelScript.State.CHASE
	sentinel.take_damage(20, 100.0)
	if sentinel.current_state != DharmaSentinelScript.State.STAGGERED:
		dummy_player.free()
		sentinel.free()
		return {"name": test_name, "passed": false, "message": "Expected STAGGERED state upon poise break."}

	dummy_player.free()
	sentinel.free()
	return {"name": test_name, "passed": true, "message": "Dharma Sentinel combat and lotus guard verified."}

static func _test_boss_brahma_avatara_phases_and_enrage() -> Dictionary:
	var test_name = "test_boss_brahma_avatara_phases_and_enrage"
	var boss = BossBrahmaAvataraScript.new()
	boss.position = Vector3(0, 0, 0)
	boss.global_position = Vector3(0, 0, 0)

	var dummy_player = CharacterBody3D.new()
	dummy_player.add_to_group("player")
	dummy_player.position = Vector3(0, 0, 18.0)
	dummy_player.global_position = Vector3(0, 0, 18.0)
	boss.target_player = dummy_player

	if boss.max_health != 650 or boss.current_health != 650:
		dummy_player.free()
		boss.free()
		return {"name": test_name, "passed": false, "message": "Boss should start at 650 HP."}

	# Approach in Phase 1
	boss._process_idle(0.1)
	if boss.current_state != BossBrahmaAvataraScript.State.APPROACH:
		dummy_player.free()
		boss.free()
		return {"name": test_name, "passed": false, "message": "Expected APPROACH state."}

	# Damage to trigger Phase 2 Enrage (<= 325 HP)
	boss.take_damage(330) # 650 - 330 = 320 HP
	if boss.current_phase != 2:
		dummy_player.free()
		boss.free()
		return {"name": test_name, "passed": false, "message": "Expected Phase 2 upon taking heavy damage."}

	if not boss.is_enraged:
		dummy_player.free()
		boss.free()
		return {"name": test_name, "passed": false, "message": "Boss should be marked enraged."}

	if boss.current_state != BossBrahmaAvataraScript.State.MAHAPRALAYA_ENRAGE_ROAR:
		dummy_player.free()
		boss.free()
		return {"name": test_name, "passed": false, "message": "Expected MAHAPRALAYA_ENRAGE_ROAR state."}

	# Test cosmic dissolution
	var dissolution_signal = {"fired": false}
	boss.dissolution_triggered.connect(func(_pos): dissolution_signal["fired"] = true)
	boss.current_state = BossBrahmaAvataraScript.State.COSMIC_DISSOLUTION
	boss.state_timer = 0.45
	boss._process_dissolution(0.1)
	if not dissolution_signal["fired"]:
		dummy_player.free()
		boss.free()
		return {"name": test_name, "passed": false, "message": "dissolution_triggered signal was not emitted."}

	# Defeat check
	var defeated_signal = {"fired": false}
	boss.boss_defeated.connect(func(): defeated_signal["fired"] = true)
	boss.take_damage(400)
	if not defeated_signal["fired"] or boss.current_state != BossBrahmaAvataraScript.State.DEFEATED:
		dummy_player.free()
		boss.free()
		return {"name": test_name, "passed": false, "message": "Expected boss_defeated signal and DEFEATED state."}

	dummy_player.free()
	boss.free()
	return {"name": test_name, "passed": true, "message": "Boss Brahma Avatara phases and enrage verified."}

static func _test_moksha_peetham_and_campaign_completion_save() -> Dictionary:
	var test_name = "test_moksha_peetham_and_campaign_completion_save"
	var peetham = MokshaPeethamScript.new()

	var consecrated_signal = {"fired": false}
	var moksha_signal = {"fired": false}
	peetham.peetham_consecrated.connect(func(_altar): consecrated_signal["fired"] = true)
	peetham.moksha_attained.connect(func(_altar): moksha_signal["fired"] = true)

	peetham.interact()
	if not peetham.is_consecrated:
		peetham.free()
		return {"name": test_name, "passed": false, "message": "Peetham should be marked consecrated."}

	if not consecrated_signal["fired"] or not moksha_signal["fired"]:
		peetham.free()
		return {"name": test_name, "passed": false, "message": "Signals were not emitted on peetham interact."}

	# Verify full campaign save state with 7 realms
	var state = SaveSystemScript.get_default_state()
	state["currentRealm"] = "Satyaloka"
	state["shardsCollected"] = 28
	state["altarConsecrated"] = true
	var all_realms = ["Bhumi", "Antariksha", "Patala", "Svar", "Maharloka", "Tapoloka", "Satyaloka"]
	for r in all_realms:
		if not state["unlockedRealms"].has(r):
			state["unlockedRealms"].append(r)

	var saved = SaveSystemScript.save_game(state)
	if not saved:
		peetham.free()
		return {"name": test_name, "passed": false, "message": "Failed to save game state."}

	var loaded = SaveSystemScript.load_game()
	if not loaded or loaded["currentRealm"] != "Satyaloka":
		peetham.free()
		return {"name": test_name, "passed": false, "message": "Loaded state should have currentRealm Satyaloka."}

	if loaded["unlockedRealms"].size() < 7:
		peetham.free()
		return {"name": test_name, "passed": false, "message": "Loaded state should have all 7 realms unlocked."}

	peetham.free()
	return {"name": test_name, "passed": true, "message": "Moksha Peetham consecration and full campaign save verified."}

static func _test_satyaloka_level_scene_integrity() -> Dictionary:
	var test_name = "test_satyaloka_level_scene_integrity"
	var scene_res = load("res://scenes/levels/SatyalokaApex3D.tscn")
	if not scene_res:
		return {"name": test_name, "passed": false, "message": "Failed to load SatyalokaApex3D.tscn."}

	var level = scene_res.instantiate()
	if not level:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate SatyalokaApex3D."}

	var player = level.get_node_or_null("Player3D")
	var hud = level.get_node_or_null("HUD3D")
	var tara = level.get_node_or_null("DeviTaraSatya3D")
	var boss = level.get_node_or_null("BossBrahmaAvatara3D")
	var peetham = level.get_node_or_null("MokshaPeetham3D")
	var chakra1 = level.get_node_or_null("LeftChakraTerrace/DharmachakraNode1")
	var chakra2 = level.get_node_or_null("RightChakraTerrace/DharmachakraNode2")
	var seraph1 = level.get_node_or_null("LeftChakraTerrace/MokshaSeraph1")
	var sentinel1 = level.get_node_or_null("RightChakraTerrace/DharmaSentinel1")
	var bridge_left = level.get_node_or_null("BridgeLeft")
	var bridge_right = level.get_node_or_null("BridgeRight")
	var bridge_apex = level.get_node_or_null("BridgeToApex")

	if not player or not hud or not tara or not boss or not peetham:
		level.free()
		return {"name": test_name, "passed": false, "message": "Missing core entity nodes in level."}

	if not chakra1 or not chakra2 or not seraph1 or not sentinel1:
		level.free()
		return {"name": test_name, "passed": false, "message": "Missing Satyaloka interactive/enemy nodes."}

	if not bridge_left or not bridge_right or not bridge_apex:
		level.free()
		return {"name": test_name, "passed": false, "message": "Missing Brahman bridge nodes."}

	level.free()
	return {"name": test_name, "passed": true, "message": "Satyaloka level scene integrity verified."}
