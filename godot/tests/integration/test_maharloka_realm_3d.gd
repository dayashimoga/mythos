class_name TestMaharlokaRealm3D
extends RefCounted

## Chapter V Integration Test Suite: Realm of Maharloka (The Sage Sanctuary & Astral Libraries)
## Validates QuestManager, DialogueRunner, Astral Glyph vertical levitation physics,
## Scripture Pedestal deciphering, Astral Rishi hovering caster AI & blink,
## Scripture Golem heavy guardian AI & manuscript guard, Boss Brihaspati Sage Titan 2-phase enrage,
## Mahar Mandala consecration, and 3D level scene integrity.

const QuestManagerScript = preload("res://scripts/domain/quest_manager.gd")
const DialogueRunnerScript = preload("res://scripts/domain/dialogue_runner.gd")
const SaveSystemScript = preload("res://scripts/domain/save_system.gd")
const CombatMath = preload("res://scripts/domain/combat_math.gd")
const PlayerControllerScript = preload("res://scripts/player/player_controller_3d.gd")
const AstralRishiScript = preload("res://scripts/entities/astral_rishi_3d.gd")
const ScriptureGolemScript = preload("res://scripts/entities/scripture_golem_3d.gd")
const BossBrihaspatiScript = preload("res://scripts/entities/boss_brihaspati_3d.gd")
const AstralGlyphScript = preload("res://scripts/interactables/astral_glyph_3d.gd")
const ScripturePedestalScript = preload("res://scripts/interactables/scripture_pedestal_3d.gd")
const MaharMandalaScript = preload("res://scripts/interactables/mahar_mandala_3d.gd")

static func run_all() -> Array:
	var results: Array = []
	results.append(_test_maharloka_quest_progression())
	results.append(_test_maharloka_dialogue_flow())
	results.append(_test_astral_glyph_levitation())
	results.append(_test_scripture_pedestal_deciphering())
	results.append(_test_astral_rishi_hover_and_cast())
	results.append(_test_scripture_golem_combat_and_guard())
	results.append(_test_boss_brihaspati_phases_and_enrage())
	results.append(_test_mahar_mandala_and_save_state())
	results.append(_test_maharloka_level_scene_integrity())
	return results

static func _test_maharloka_quest_progression() -> Dictionary:
	var test_name = "test_maharloka_quest_progression"
	var qm = QuestManagerScript.new()
	var mission = qm.get_mission("wisdom_of_maharloka")
	if not mission:
		return {"name": test_name, "passed": false, "message": "Mission wisdom_of_maharloka missing."}
	if mission.objectives.size() < 4:
		return {"name": test_name, "passed": false, "message": "Expected 4 objectives in mission."}

	var ok = qm.start_mission("wisdom_of_maharloka")
	if not ok or qm.get_mission_status("wisdom_of_maharloka") != QuestManagerScript.Status.ACTIVE:
		return {"name": test_name, "passed": false, "message": "Failed to activate mission."}

	# Objective 1: commune_tara_astral
	qm.update_objective_progress("wisdom_of_maharloka", "commune_tara_astral", 1)
	if not mission.objectives[0].is_completed:
		return {"name": test_name, "passed": false, "message": "commune_tara_astral failed to complete."}

	# Objective 2: commune_scriptures (target 2)
	qm.update_objective_progress("wisdom_of_maharloka", "commune_scriptures", 1)
	if mission.objectives[1].is_completed:
		return {"name": test_name, "passed": false, "message": "commune_scriptures prematurely completed at 1/2."}
	qm.update_objective_progress("wisdom_of_maharloka", "commune_scriptures", 1)
	if not mission.objectives[1].is_completed:
		return {"name": test_name, "passed": false, "message": "commune_scriptures failed to complete at 2/2."}

	# Objective 3: defeat_brihaspati
	qm.update_objective_progress("wisdom_of_maharloka", "defeat_brihaspati", 1)
	if not mission.objectives[2].is_completed:
		return {"name": test_name, "passed": false, "message": "defeat_brihaspati failed to complete."}

	# Objective 4: consecrate_mahar_mandala
	qm.update_objective_progress("wisdom_of_maharloka", "consecrate_mahar_mandala", 1)
	if not mission.objectives[3].is_completed:
		return {"name": test_name, "passed": false, "message": "consecrate_mahar_mandala failed to complete."}

	if qm.get_mission_status("wisdom_of_maharloka") != QuestManagerScript.Status.COMPLETED:
		return {"name": test_name, "passed": false, "message": "Mission should be COMPLETED."}

	return {"name": test_name, "passed": true, "message": "Maharloka quest progression verified."}

static func _test_maharloka_dialogue_flow() -> Dictionary:
	var test_name = "test_maharloka_dialogue_flow"
	var dr = DialogueRunnerScript.new()
	var ok = dr.start("tara_mahar_1")
	if not ok:
		return {"name": test_name, "passed": false, "message": "Failed to start dialogue tara_mahar_1."}

	if dr.current_node_id != "tara_mahar_1":
		return {"name": test_name, "passed": false, "message": "Expected start at tara_mahar_1."}

	# Advance to veer_mahar_1
	var adv1 = dr.advance()
	if not adv1 or dr.current_node_id != "veer_mahar_1":
		return {"name": test_name, "passed": false, "message": "Expected advance to veer_mahar_1."}

	# Advance to tara_mahar_2
	var adv2 = dr.advance()
	if not adv2 or dr.current_node_id != "tara_mahar_2":
		return {"name": test_name, "passed": false, "message": "Expected advance to tara_mahar_2."}

	# Advance to veer_mahar_2
	var adv3 = dr.advance()
	if not adv3 or dr.current_node_id != "veer_mahar_2":
		return {"name": test_name, "passed": false, "message": "Expected advance to veer_mahar_2."}

	# Advance finishes dialogue
	var adv4 = dr.advance()
	if adv4 or dr.is_active:
		return {"name": test_name, "passed": false, "message": "Dialogue should finish after veer_mahar_2."}

	return {"name": test_name, "passed": true, "message": "Maharloka dialogue sequence verified."}

static func _test_astral_glyph_levitation() -> Dictionary:
	var test_name = "test_astral_glyph_levitation"
	var glyph = AstralGlyphScript.new()
	glyph.glyph_id = "test_glyph"
	glyph.levitation_speed = 15.0

	var test_body = CharacterBody3D.new()
	test_body.velocity = Vector3(0, -5.0, 0)

	var levitated_signal = {"fired": false}
	glyph.body_levitated.connect(func(_b, _s):
		levitated_signal["fired"] = true
	)

	glyph._on_body_entered(test_body)
	if test_body.velocity.y < 15.0:
		test_body.free()
		glyph.free()
		return {"name": test_name, "passed": false, "message": "Body velocity Y should be lifted to at least 15.0."}

	if not levitated_signal["fired"]:
		test_body.free()
		glyph.free()
		return {"name": test_name, "passed": false, "message": "body_levitated signal was not emitted."}

	# Test deactivation
	glyph.set_active(false)
	test_body.velocity = Vector3(0, -2.0, 0)
	glyph._physics_process(0.016)
	if test_body.velocity.y != -2.0:
		test_body.free()
		glyph.free()
		return {"name": test_name, "passed": false, "message": "Deactivated glyph should not apply upward force."}

	test_body.free()
	glyph.free()
	return {"name": test_name, "passed": true, "message": "Astral glyph levitation physics verified."}

static func _test_scripture_pedestal_deciphering() -> Dictionary:
	var test_name = "test_scripture_pedestal_deciphering"
	var ped = ScripturePedestalScript.new()
	ped.pedestal_id = "scripture_test"
	ped.scripture_title = "Veda of Pure Consciousness"

	var deciphered_signal = {"fired": false}
	ped.scripture_deciphered.connect(func(_id, _title):
		deciphered_signal["fired"] = true
	)

	ped.interact()
	if not ped.is_deciphered:
		ped.free()
		return {"name": test_name, "passed": false, "message": "Pedestal should be marked as deciphered."}

	if not deciphered_signal["fired"]:
		ped.free()
		return {"name": test_name, "passed": false, "message": "scripture_deciphered signal not received."}

	# Duplicate interact should be ignored
	deciphered_signal["fired"] = false
	ped.interact()
	if deciphered_signal["fired"]:
		ped.free()
		return {"name": test_name, "passed": false, "message": "Duplicate interact should not re-emit signal."}

	ped.free()
	return {"name": test_name, "passed": true, "message": "Scripture pedestal deciphering verified."}

static func _test_astral_rishi_hover_and_cast() -> Dictionary:
	var test_name = "test_astral_rishi_hover_and_cast"
	var rishi = AstralRishiScript.new()
	rishi.position = Vector3(0, 2.0, 0)

	var dummy_player = CharacterBody3D.new()
	dummy_player.add_to_group("player")
	dummy_player.position = Vector3(0, 2.0, 8.0)
	rishi.target_player = dummy_player

	# Initial hover state
	rishi._process_hover(0.1)
	if rishi.current_state != AstralRishiScript.State.HOVER_MEDITATE:
		dummy_player.free()
		rishi.free()
		return {"name": test_name, "passed": false, "message": "Expected HOVER_MEDITATE state."}

	# Cast telegraph
	rishi.state_timer = 2.0
	rishi._process_hover(0.1)
	if rishi.current_state != AstralRishiScript.State.CAST_MANTRA_TELEGRAPH:
		dummy_player.free()
		rishi.free()
		return {"name": test_name, "passed": false, "message": "Expected CAST_MANTRA_TELEGRAPH after hover timer."}

	# Cast release
	rishi.state_timer = 0.85
	rishi._process_telegraph(0.1)
	if rishi.current_state != AstralRishiScript.State.CAST_MANTRA_RELEASE:
		dummy_player.free()
		rishi.free()
		return {"name": test_name, "passed": false, "message": "Expected CAST_MANTRA_RELEASE after telegraph."}

	# Damage & Poise stagger
	rishi.take_hit(30, 45.0)
	if rishi.current_health != 90:
		dummy_player.free()
		rishi.free()
		return {"name": test_name, "passed": false, "message": "Health should be 90."}

	if rishi.current_state != AstralRishiScript.State.STAGGERED:
		dummy_player.free()
		rishi.free()
		return {"name": test_name, "passed": false, "message": "Expected STAGGERED state upon poise break."}

	dummy_player.free()
	rishi.free()
	return {"name": test_name, "passed": true, "message": "Astral Rishi hover and cast verified."}

static func _test_scripture_golem_combat_and_guard() -> Dictionary:
	var test_name = "test_scripture_golem_combat_and_guard"
	var golem = ScriptureGolemScript.new()
	golem.position = Vector3(0, 0, 0)

	var dummy_player = CharacterBody3D.new()
	dummy_player.add_to_group("player")
	dummy_player.position = Vector3(0, 0, 3.0)
	golem.target_player = dummy_player

	# Patrol to chase
	golem._process_patrol(0.1)
	if golem.current_state != ScriptureGolemScript.State.CHASE:
		dummy_player.free()
		golem.free()
		return {"name": test_name, "passed": false, "message": "Expected CHASE state when player is nearby."}

	# Chase into slam telegraph
	golem._process_chase(0.1)
	if golem.current_state != ScriptureGolemScript.State.TABLET_SLAM_TELEGRAPH:
		dummy_player.free()
		golem.free()
		return {"name": test_name, "passed": false, "message": "Expected TABLET_SLAM_TELEGRAPH at close reach."}

	# Test manuscript guard damage reduction
	golem.current_state = ScriptureGolemScript.State.MANUSCRIPT_GUARD
	golem.take_hit(100, 10.0) # 100 * (1 - 0.70) = 30 dmg taken
	if golem.current_health != 230:
		dummy_player.free()
		golem.free()
		return {"name": test_name, "passed": false, "message": "Expected 230 HP after guarded hit (took %d)." % (260 - golem.current_health)}

	dummy_player.free()
	golem.free()
	return {"name": test_name, "passed": true, "message": "Scripture golem combat and guard verified."}

static func _test_boss_brihaspati_phases_and_enrage() -> Dictionary:
	var test_name = "test_boss_brihaspati_phases_and_enrage"
	var boss = BossBrihaspatiScript.new()
	boss.position = Vector3(0, 0, 0)

	var dummy_player = CharacterBody3D.new()
	dummy_player.add_to_group("player")
	dummy_player.position = Vector3(0, 0, 15.0)
	boss.target_player = dummy_player

	if boss.max_health != 550 or boss.current_health != 550:
		dummy_player.free()
		boss.free()
		return {"name": test_name, "passed": false, "message": "Boss should start at 550 HP."}

	# Phase 1 approach
	boss._process_idle(0.1)
	if boss.current_state != BossBrihaspatiScript.State.ASTRAL_APPROACH:
		dummy_player.free()
		boss.free()
		return {"name": test_name, "passed": false, "message": "Expected ASTRAL_APPROACH state."}

	# Damage to trigger Enrage Phase 2 (<= 275 HP)
	boss.take_damage(280) # 550 - 280 = 270 HP
	if boss.current_phase != 2:
		dummy_player.free()
		boss.free()
		return {"name": test_name, "passed": false, "message": "Expected Phase 2 upon taking heavy damage."}

	if not boss.is_enraged:
		dummy_player.free()
		boss.free()
		return {"name": test_name, "passed": false, "message": "Boss should be marked enraged."}

	if boss.current_state != BossBrihaspatiScript.State.COSMIC_ENLIGHTENMENT_ROAR:
		dummy_player.free()
		boss.free()
		return {"name": test_name, "passed": false, "message": "Expected COSMIC_ENLIGHTENMENT_ROAR state."}

	# Defeat check
	var defeated_signal = {"fired": false}
	boss.boss_defeated.connect(func(): defeated_signal["fired"] = true)
	boss.take_damage(300)
	if not defeated_signal["fired"] or boss.current_state != BossBrihaspatiScript.State.DEFEATED:
		dummy_player.free()
		boss.free()
		return {"name": test_name, "passed": false, "message": "Expected boss_defeated signal and DEFEATED state."}

	dummy_player.free()
	boss.free()
	return {"name": test_name, "passed": true, "message": "Boss Brihaspati phases and enrage verified."}

static func _test_mahar_mandala_and_save_state() -> Dictionary:
	var test_name = "test_mahar_mandala_and_save_state"
	var mandala = MaharMandalaScript.new()

	var consecrated_signal = {"fired": false}
	mandala.mandala_consecrated.connect(func(_altar):
		consecrated_signal["fired"] = true
	)

	mandala.interact()
	if not mandala.is_consecrated:
		mandala.free()
		return {"name": test_name, "passed": false, "message": "Mandala should be marked consecrated."}

	if not consecrated_signal["fired"]:
		mandala.free()
		return {"name": test_name, "passed": false, "message": "mandala_consecrated signal was not emitted."}

	# Test save system contract with Maharloka
	var state = SaveSystemScript.get_default_state()
	state["currentRealm"] = "Maharloka"
	state["shardsCollected"] = 20
	state["altarConsecrated"] = true
	state["unlockedRealms"].append("Maharloka")

	var saved = SaveSystemScript.save_game(state)
	if not saved:
		mandala.free()
		return {"name": test_name, "passed": false, "message": "Failed to save game state."}

	var loaded = SaveSystemScript.load_game()
	if not loaded or loaded["currentRealm"] != "Maharloka":
		mandala.free()
		return {"name": test_name, "passed": false, "message": "Loaded state should have currentRealm Maharloka."}

	mandala.free()
	return {"name": test_name, "passed": true, "message": "Mahar Mandala consecration and save state verified."}

static func _test_maharloka_level_scene_integrity() -> Dictionary:
	var test_name = "test_maharloka_level_scene_integrity"
	var scene_res = load("res://scenes/levels/MaharlokaSanctuary3D.tscn")
	if not scene_res:
		return {"name": test_name, "passed": false, "message": "Failed to load MaharlokaSanctuary3D.tscn."}

	var level = scene_res.instantiate()
	if not level:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate MaharlokaSanctuary3D."}

	# Verify essential nodes exist
	var player = level.get_node_or_null("Player3D")
	var hud = level.get_node_or_null("HUD3D")
	var tara = level.get_node_or_null("DeviTaraMahar3D")
	var boss = level.get_node_or_null("BossBrihaspati3D")
	var mandala = level.get_node_or_null("MaharMandala3D")
	var glyph1 = level.get_node_or_null("AstralGlyph1")
	var ped1 = level.get_node_or_null("ScripturePedestal1")
	var golem1 = level.get_node_or_null("ScriptureGolem1")
	var rishi1 = level.get_node_or_null("AstralRishi1")

	if not player or not hud or not tara or not boss or not mandala:
		level.free()
		return {"name": test_name, "passed": false, "message": "Missing core entity nodes in level."}

	if not glyph1 or not ped1 or not golem1 or not rishi1:
		level.free()
		return {"name": test_name, "passed": false, "message": "Missing Maharloka interactive/enemy nodes."}

	level.free()
	return {"name": test_name, "passed": true, "message": "Maharloka level scene integrity verified."}
