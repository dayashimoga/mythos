class_name TestPatalaRealm3D
extends RefCounted

## Chapter III Integration Test Suite: Realm of Patala (The Subterranean Serpent Vaults)
## Validates QuestManager, DialogueRunner, Venom River hazard plane,
## Bioluminescent Bouncy Fungus springboard physics, Naga Spitter ranged AI,
## Naga Constrictor melee warrior AI, Boss Shesha's Tormented Echo 2-phase progression,
## Vasuki Peetham altar consecration, and 3D level scene integrity.

const QuestManagerScript = preload("res://scripts/domain/quest_manager.gd")
const DialogueRunnerScript = preload("res://scripts/domain/dialogue_runner.gd")
const SaveSystemScript = preload("res://scripts/domain/save_system.gd")
const CombatMath = preload("res://scripts/domain/combat_math.gd")
const PlayerControllerScript = preload("res://scripts/player/player_controller_3d.gd")
const NagaSpitterScript = preload("res://scripts/entities/naga_spitter_3d.gd")
const NagaConstrictorScript = preload("res://scripts/entities/naga_constrictor_3d.gd")
const BossSheshaEchoScript = preload("res://scripts/entities/boss_shesha_echo_3d.gd")
const VenomRiverScript = preload("res://scripts/interactables/venom_river_3d.gd")
const BouncyFungusScript = preload("res://scripts/interactables/bouncy_fungus_3d.gd")
const VasukiPeethamScript = preload("res://scripts/interactables/vasuki_peetham_3d.gd")

static func run_all() -> Array:
	var results: Array = []
	results.append(_test_patala_quest_progression())
	results.append(_test_patala_dialogue_flow())
	results.append(_test_venom_river_hazard())
	results.append(_test_bouncy_fungus_springboard())
	results.append(_test_naga_spitter_ai_and_projectile())
	results.append(_test_naga_constrictor_ai_and_combat())
	results.append(_test_boss_shesha_echo_phases_and_enrage())
	results.append(_test_vasuki_peetham_and_save_state())
	results.append(_test_patala_level_scene_integrity())
	return results

static func _test_patala_quest_progression() -> Dictionary:
	var test_name = "test_patala_quest_progression"
	var qm = QuestManagerScript.new()
	var mission = qm.get_mission("cleansing_of_patala")
	if not mission:
		return {"name": test_name, "passed": false, "message": "Mission cleansing_of_patala missing."}
	if mission.objectives.size() < 4:
		return {"name": test_name, "passed": false, "message": "Expected 4 objectives in mission."}

	var ok = qm.start_mission("cleansing_of_patala")
	if not ok or qm.get_mission_status("cleansing_of_patala") != QuestManagerScript.Status.ACTIVE:
		return {"name": test_name, "passed": false, "message": "Failed to activate mission."}

	# Objective 1: commune_tara_subterranean
	qm.update_objective_progress("cleansing_of_patala", "commune_tara_subterranean", 1)
	if not mission.objectives[0].is_completed:
		return {"name": test_name, "passed": false, "message": "commune_tara_subterranean failed to complete."}

	# Objective 2: defeat_naga_guardians (target 3)
	qm.update_objective_progress("cleansing_of_patala", "defeat_naga_guardians", 1)
	if mission.objectives[1].is_completed:
		return {"name": test_name, "passed": false, "message": "defeat_naga_guardians prematurely completed at 1/3."}
	qm.update_objective_progress("cleansing_of_patala", "defeat_naga_guardians", 2)
	if not mission.objectives[1].is_completed:
		return {"name": test_name, "passed": false, "message": "defeat_naga_guardians failed to complete at 3/3."}

	# Objective 3: defeat_shesha_echo
	qm.update_objective_progress("cleansing_of_patala", "defeat_shesha_echo", 1)
	if not mission.objectives[2].is_completed:
		return {"name": test_name, "passed": false, "message": "defeat_shesha_echo failed to complete."}

	# Objective 4: consecrate_vasuki_peetham
	qm.update_objective_progress("cleansing_of_patala", "consecrate_vasuki_peetham", 1)
	if not mission.objectives[3].is_completed:
		return {"name": test_name, "passed": false, "message": "consecrate_vasuki_peetham failed to complete."}

	if qm.get_mission_status("cleansing_of_patala") != QuestManagerScript.Status.COMPLETED:
		return {"name": test_name, "passed": false, "message": "Mission should be COMPLETED."}

	return {"name": test_name, "passed": true, "message": "Patala quest progression verified."}

static func _test_patala_dialogue_flow() -> Dictionary:
	var test_name = "test_patala_dialogue_flow"
	var dr = DialogueRunnerScript.new()
	var ok = dr.start("tara_patala_1")
	if not ok:
		return {"name": test_name, "passed": false, "message": "Failed to start dialogue tara_patala_1."}

	if dr.current_node_id != "tara_patala_1":
		return {"name": test_name, "passed": false, "message": "Expected start at tara_patala_1."}

	# Advance to veer_patala_1
	var adv1 = dr.advance()
	if not adv1 or dr.current_node_id != "veer_patala_1":
		return {"name": test_name, "passed": false, "message": "Expected advance to veer_patala_1."}

	# Advance to tara_patala_2
	var adv2 = dr.advance()
	if not adv2 or dr.current_node_id != "tara_patala_2":
		return {"name": test_name, "passed": false, "message": "Expected advance to tara_patala_2."}

	# Advance to veer_patala_2
	var adv3 = dr.advance()
	if not adv3 or dr.current_node_id != "veer_patala_2":
		return {"name": test_name, "passed": false, "message": "Expected advance to veer_patala_2."}

	# Advance to conclusion
	var adv4 = dr.advance()
	if adv4 or dr.is_active:
		return {"name": test_name, "passed": false, "message": "Expected dialogue to end after veer_patala_2."}

	return {"name": test_name, "passed": true, "message": "Patala dialogue sequence verified."}

static func _test_venom_river_hazard() -> Dictionary:
	var test_name = "test_venom_river_hazard"
	var river: Area3D = VenomRiverScript.new()
	river.damage_per_tick = 10
	river.tick_interval = 0.5

	var player: CharacterBody3D = PlayerControllerScript.new()
	player.health = 100
	player.max_health = 100

	var poison_signal = {"fired": false, "dmg": 0}
	river.entity_poisoned.connect(func(body, dmg):
		poison_signal["fired"] = true
		poison_signal["dmg"] = dmg
	)

	# Simulate body entered
	river._on_body_entered(player)
	if player.health != 90:
		river.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "Expected 10 instant venom damage, got HP: %d" % player.health}

	if not poison_signal["fired"] or poison_signal["dmg"] != 10:
		river.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "entity_poisoned signal failed to emit."}

	# Process 0.6 seconds to trigger periodic tick
	river._physics_process(0.6)
	if player.health != 80:
		river.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "Expected second venom tick to reduce HP to 80, got %d" % player.health}

	river._on_body_exited(player)
	river.free()
	player.free()
	return {"name": test_name, "passed": true, "message": "Venom River hazard damage verified."}

static func _test_bouncy_fungus_springboard() -> Dictionary:
	var test_name = "test_bouncy_fungus_springboard"
	var fungus: Area3D = BouncyFungusScript.new()
	fungus.bounce_force = 18.0
	fungus.cooldown_time = 0.4

	var player: CharacterBody3D = PlayerControllerScript.new()
	player.velocity = Vector3(0, -5.0, 0)

	var bounce_signal = {"fired": false, "force": 0.0}
	fungus.bounced.connect(func(body, force):
		bounce_signal["fired"] = true
		bounce_signal["force"] = force
	)

	fungus._on_body_entered(player)
	if player.velocity.y < 18.0:
		fungus.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "Expected bounce force >= 18.0, got: %f" % player.velocity.y}

	if not bounce_signal["fired"] or bounce_signal["force"] != 18.0:
		fungus.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "bounced signal failed to fire properly."}

	# Cooldown check: Immediate second enter should be ignored
	player.velocity.y = 0.0
	fungus._on_body_entered(player)
	if player.velocity.y != 0.0:
		fungus.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "Springboard should respect cooldown."}

	fungus.free()
	player.free()
	return {"name": test_name, "passed": true, "message": "Bouncy Fungus springboard physics verified."}

static func _test_naga_spitter_ai_and_projectile() -> Dictionary:
	var test_name = "test_naga_spitter_ai_and_projectile"
	var spitter: CharacterBody3D = NagaSpitterScript.new()
	var player: CharacterBody3D = PlayerControllerScript.new()
	spitter.target_player = player
	spitter.current_state = NagaSpitterScript.State.TELEGRAPH_COIL

	# Simulate telegraph finish -> spit venom
	spitter._process_telegraph(0.8)
	if spitter.current_state != NagaSpitterScript.State.SPIT_VENOM:
		spitter.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "Expected transition to SPIT_VENOM."}

	# Test taking poise damage and stagger
	spitter.current_state = NagaSpitterScript.State.SLITHER_REPOSITION
	var heavy_attack = CombatMath.AttackSpec.new("veer", 30, 50.0, Vector3.ZERO)
	spitter.take_damage_spec(heavy_attack)
	if spitter.current_state != NagaSpitterScript.State.STAGGERED:
		spitter.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "Heavy attack should stagger Naga Spitter."}

	# Test defeat
	var defeated_signal = {"fired": false}
	spitter.spitter_defeated.connect(func(_s): defeated_signal["fired"] = true)
	spitter.take_damage(60)
	if spitter.current_state != NagaSpitterScript.State.DEFEATED or not defeated_signal["fired"]:
		spitter.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "Fatal damage should defeat Naga Spitter."}

	spitter.free()
	player.free()
	return {"name": test_name, "passed": true, "message": "Naga Spitter AI and combat verified."}

static func _test_naga_constrictor_ai_and_combat() -> Dictionary:
	var test_name = "test_naga_constrictor_ai_and_combat"
	var constrictor: CharacterBody3D = NagaConstrictorScript.new()
	var player: CharacterBody3D = PlayerControllerScript.new()
	constrictor.target_player = player

	# Test stalk to leap transition
	constrictor.position = Vector3(0, 0, 8.0)
	player.position = Vector3.ZERO
	constrictor.current_state = NagaConstrictorScript.State.SERPENTINE_STALK
	constrictor.state_timer = 2.0
	constrictor._process_stalk(0.1)

	if constrictor.current_state != NagaConstrictorScript.State.LEAP_STRIKE:
		constrictor.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "Constrictor should enter LEAP_STRIKE from stalk."}

	# Test defeat
	var defeated_signal = {"fired": false}
	constrictor.constrictor_defeated.connect(func(_c): defeated_signal["fired"] = true)
	constrictor.take_damage(120)
	if constrictor.current_state != NagaConstrictorScript.State.DEFEATED or not defeated_signal["fired"]:
		constrictor.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "Fatal damage should defeat Naga Constrictor."}

	constrictor.free()
	player.free()
	return {"name": test_name, "passed": true, "message": "Naga Constrictor AI and combat verified."}

static func _test_boss_shesha_echo_phases_and_enrage() -> Dictionary:
	var test_name = "test_boss_shesha_echo_phases_and_enrage"
	var boss: CharacterBody3D = BossSheshaEchoScript.new()
	var player: CharacterBody3D = PlayerControllerScript.new()
	boss.target_player = player

	if boss.current_health != 450 or boss.max_health != 450:
		boss.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "Boss should start with 450 HP."}

	var phase_signal = {"phase": 1}
	boss.boss_phase_changed.connect(func(p): phase_signal["phase"] = p)

	# Damage boss down to 220 HP (<= 225 enrage threshold)
	boss.take_damage(230)
	if not boss.is_enraged or boss.current_phase != 2:
		boss.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "Boss should be ENRAGED in Phase 2 at <= 225 HP."}

	if phase_signal["phase"] != 2:
		boss.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "boss_phase_changed signal failed to emit 2."}

	# Defeat boss
	var defeated_signal = {"fired": false}
	boss.boss_defeated.connect(func(): defeated_signal["fired"] = true)
	boss.current_state = BossSheshaEchoScript.State.COIL_SLITHER
	boss.take_damage(250)

	if boss.current_state != BossSheshaEchoScript.State.DEFEATED or boss.current_health != 0:
		boss.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "Boss should be DEFEATED with 0 HP."}

	if not defeated_signal["fired"]:
		boss.free()
		player.free()
		return {"name": test_name, "passed": false, "message": "boss_defeated signal should emit."}

	boss.free()
	player.free()
	return {"name": test_name, "passed": true, "message": "Boss Shesha Echo phases and enrage verified."}

static func _test_vasuki_peetham_and_save_state() -> Dictionary:
	var test_name = "test_vasuki_peetham_and_save_state"
	var peetham: Area3D = VasukiPeethamScript.new()

	var consecrated_signal = {"fired": false}
	peetham.consecrated.connect(func(_p): consecrated_signal["fired"] = true)

	peetham.interact()
	if not peetham.is_consecrated or not consecrated_signal["fired"]:
		peetham.free()
		return {"name": test_name, "passed": false, "message": "Peetham consecration failed."}

	# Save state validation
	var state = SaveSystemScript.get_default_state()
	state["currentRealm"] = "Patala"
	state["shardsCollected"] = 12
	state["altarConsecrated"] = true
	state["unlockedRealms"].append("Patala")

	var save_ok = SaveSystemScript.save_game(state)
	if not save_ok:
		peetham.free()
		return {"name": test_name, "passed": false, "message": "SaveSystem failed to save Patala state."}

	var loaded = SaveSystemScript.load_game()
	if not loaded or loaded["currentRealm"] != "Patala":
		peetham.free()
		return {"name": test_name, "passed": false, "message": "Loaded state mismatch for Patala realm."}

	peetham.free()
	return {"name": test_name, "passed": true, "message": "Vasuki Peetham consecration and save state verified."}

static func _test_patala_level_scene_integrity() -> Dictionary:
	var test_name = "test_patala_level_scene_integrity"
	var scene_res = load("res://scenes/levels/PatalaUnderworld3D.tscn")
	if not scene_res or not (scene_res is PackedScene):
		return {"name": test_name, "passed": false, "message": "Failed to load PatalaUnderworld3D.tscn."}

	var instance = scene_res.instantiate()
	if not instance:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate PatalaUnderworld3D scene."}

	var required_nodes = [
		"WorldEnvironment",
		"DirectionalLight3D",
		"Player3D",
		"HUD3D",
		"DeviTaraPatala3D",
		"VenomRiver3D",
		"BouncyFungus1",
		"NagaSpitter1",
		"NagaConstrictor1",
		"BossSheshaEcho3D",
		"VasukiPeetham3D"
	]

	for node_name in required_nodes:
		if not instance.has_node(node_name):
			instance.free()
			return {"name": test_name, "passed": false, "message": "Missing node %s in PatalaUnderworld3D scene." % node_name}

	instance.free()
	return {"name": test_name, "passed": true, "message": "Patala Underworld level scene integrity verified."}
