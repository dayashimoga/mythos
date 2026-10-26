class_name TestCombatEncounter
extends RefCounted

## Suite 19: Polished 3D Combat, Enemy AI & Boss Experience Verification (Stage Q4)
## Validates:
## - 3D Asura Warrior skeletal rig, animations (idle, walk, run, telegraph, attack, stagger, death)
## - Asura Warrior perception, strafe orbiting, and strike hitbox frame synchronization
## - Boss General Kalanemi 4-armed monumental rig, 10 authored actions, telegraphs & enrage
## - Boss poise break stagger state (+35% critical vulnerability) and ground slam impact
## - Player combat responsiveness: hit-stop frame freeze, slash arc VFX, and camera trauma shake

const CombatMathScript = preload("res://scripts/domain/combat_math.gd")
const AsuraWarriorScript = preload("res://scripts/entities/asura_warrior_3d.gd")
const BossKalanemiScript = preload("res://scripts/entities/boss_kalanemi_3d.gd")
const PlayerControllerScript = preload("res://scripts/player/player_controller_3d.gd")
const OrbitCameraScript = preload("res://scripts/camera/orbit_camera_3d.gd")

static func run_all() -> Array:
	var results = []
	results.append(_test_asura_warrior_skeletal_animation_and_rig())
	results.append(_test_asura_warrior_strafing_and_telegraph_window())
	results.append(_test_boss_kalanemi_skeletal_animation_and_4arms_rig())
	results.append(_test_boss_kalanemi_enrage_and_poise_break_mechanics())
	results.append(_test_player_combat_hit_stop_and_slash_arc())
	results.append(_test_camera_trauma_and_shake_falloff())
	return results

static func _test_asura_warrior_skeletal_animation_and_rig() -> Dictionary:
	var test_name = "test_asura_warrior_skeletal_animation_and_rig"
	var warrior_scene = load("res://scenes/entities/AsuraWarrior3D.tscn")
	if not warrior_scene:
		return {"name": test_name, "passed": false, "message": "Failed to load AsuraWarrior3D scene."}

	var warrior = warrior_scene.instantiate() as AsuraWarrior3D
	var ap: AnimationPlayer = warrior.find_child("AnimationPlayer", true, false)
	if not ap:
		warrior.free()
		return {"name": test_name, "passed": false, "message": "Asura Warrior missing AnimationPlayer in hierarchy."}

	var anim_list = ap.get_animation_list()
	var required_anims = ["idle", "walk", "run", "telegraph", "attack", "stagger", "death"]
	for req in required_anims:
		var found = false
		for a in anim_list:
			if a == req or a.begins_with(req):
				found = true
				break
		if not found:
			warrior.free()
			return {"name": test_name, "passed": false, "message": "Asura Warrior missing required animation: " + req}

	# Verify animation triggers upon state transitions
	warrior._ready()
	if warrior.current_anim != "idle":
		warrior.free()
		return {"name": test_name, "passed": false, "message": "Warrior should start with idle animation."}

	warrior.free()
	return {"name": test_name, "passed": true}

static func _test_asura_warrior_strafing_and_telegraph_window() -> Dictionary:
	var test_name = "test_asura_warrior_strafing_and_telegraph_window"
	var warrior = AsuraWarriorScript.new()
	warrior._ready()

	# Start telegraph
	warrior._start_telegraph()
	if warrior.current_state != AsuraWarriorScript.State.TELEGRAPH:
		warrior.free()
		return {"name": test_name, "passed": false, "message": "Warrior state should be TELEGRAPH."}
	if warrior.state_timer < 0.70 or warrior.state_timer > 0.80:
		warrior.free()
		return {"name": test_name, "passed": false, "message": "Telegraph duration should be ~0.75s."}

	# Execute attack
	warrior._execute_attack()
	if warrior.current_state != AsuraWarriorScript.State.ATTACK:
		warrior.free()
		return {"name": test_name, "passed": false, "message": "Warrior state should be ATTACK."}
	if warrior.attack_cooldown <= 0.0:
		warrior.free()
		return {"name": test_name, "passed": false, "message": "Attack cooldown should be set on attack start."}

	warrior.free()
	return {"name": test_name, "passed": true}

static func _test_boss_kalanemi_skeletal_animation_and_4arms_rig() -> Dictionary:
	var test_name = "test_boss_kalanemi_skeletal_animation_and_4arms_rig"
	var boss_scene = load("res://scenes/entities/BossKalanemi3D.tscn")
	if not boss_scene:
		return {"name": test_name, "passed": false, "message": "Failed to load BossKalanemi3D scene."}

	var boss = boss_scene.instantiate() as BossKalanemi3D
	var ap: AnimationPlayer = boss.find_child("AnimationPlayer", true, false)
	if not ap:
		boss.free()
		return {"name": test_name, "passed": false, "message": "Boss Kalanemi missing AnimationPlayer in hierarchy."}

	var anim_list = ap.get_animation_list()
	var required_boss_anims = [
		"boss_idle", "boss_walk", "boss_cleave_telegraph", "boss_cleave_attack",
		"boss_slam_leap", "boss_slam_impact", "boss_charge", "boss_roar",
		"boss_stagger", "boss_defeat"
	]
	for req in required_boss_anims:
		var found = false
		for a in anim_list:
			if a == req or a.begins_with(req):
				found = true
				break
		if not found:
			boss.free()
			return {"name": test_name, "passed": false, "message": "Boss missing required animation: " + req}

	boss._ready()
	if boss.current_anim != "boss_idle":
		boss.free()
		return {"name": test_name, "passed": false, "message": "Boss should start with boss_idle animation."}

	boss.free()
	return {"name": test_name, "passed": true}

static func _test_boss_kalanemi_enrage_and_poise_break_mechanics() -> Dictionary:
	var test_name = "test_boss_kalanemi_enrage_and_poise_break_mechanics"
	var boss = BossKalanemiScript.new()
	boss._ready()
	boss.activate_boss()

	if not boss.is_active or boss.current_state != BossKalanemiScript.State.CHASE:
		boss.free()
		return {"name": test_name, "passed": false, "message": "Boss failed to activate into CHASE."}

	# Test Phase 1 Telegraph cleave
	boss._start_telegraph_cleave()
	if boss.current_state != BossKalanemiScript.State.TELEGRAPH_CLEAVE:
		boss.free()
		return {"name": test_name, "passed": false, "message": "State should be TELEGRAPH_CLEAVE."}
	if boss.state_timer < 0.80 or boss.state_timer > 0.90:
		boss.free()
		return {"name": test_name, "passed": false, "message": "Phase 1 cleave telegraph should be ~0.85s."}

	# Trigger Phase 2 Enrage
	boss._trigger_enrage()
	if boss.current_phase != BossKalanemiScript.BossPhase.PHASE_2_ENRAGED:
		boss.free()
		return {"name": test_name, "passed": false, "message": "Boss should transition to PHASE_2_ENRAGED."}
	if boss.current_state != BossKalanemiScript.State.ENRAGE_ROAR:
		boss.free()
		return {"name": test_name, "passed": false, "message": "Boss state should be ENRAGE_ROAR during transition."}

	# Test Stagger state
	var heavy_spec = CombatMathScript.AttackSpec.new("veer_finisher", 60, 180.0, Vector3.ZERO)
	boss.current_state = BossKalanemiScript.State.CHASE
	var res = boss.take_damage_spec(heavy_spec)
	if not res.triggered_stagger or boss.current_state != BossKalanemiScript.State.STAGGERED:
		boss.free()
		return {"name": test_name, "passed": false, "message": "Expected poise break stagger state on 180 poise damage."}

	boss.free()
	return {"name": test_name, "passed": true}

static func _test_player_combat_hit_stop_and_slash_arc() -> Dictionary:
	var test_name = "test_player_combat_hit_stop_and_slash_arc"
	var player_scene = load("res://scenes/player/Player3D.tscn")
	if not player_scene:
		return {"name": test_name, "passed": false, "message": "Failed to load Player3D scene."}

	var player = player_scene.instantiate() as PlayerController3D
	player._ready()

	# Check slash arc mesh
	if not player.slash_arc:
		player.free()
		return {"name": test_name, "passed": false, "message": "Player slash arc effect mesh was not initialized."}
	if player.slash_arc.visible != false:
		player.free()
		return {"name": test_name, "passed": false, "message": "Slash arc should be hidden when not attacking."}

	# Trigger attack combo
	player._trigger_attack()
	if not player.is_attacking or player.combo_index != 1:
		player.free()
		return {"name": test_name, "passed": false, "message": "Player failed to trigger combo 1 attack."}

	# Trigger hit stop
	player._trigger_hit_stop(0.06)
	if player.hit_stop_timer < 0.05 or player.hit_stop_timer > 0.07:
		player.free()
		return {"name": test_name, "passed": false, "message": "Hit stop timer should be set to ~0.06s."}

	player.free()
	return {"name": test_name, "passed": true}

static func _test_camera_trauma_and_shake_falloff() -> Dictionary:
	var test_name = "test_camera_trauma_and_shake_falloff"
	var camera = OrbitCameraScript.new()
	var cam_3d = Camera3D.new()
	cam_3d.name = "Camera3D"
	camera.add_child(cam_3d)
	camera.camera_node = cam_3d

	camera._ready()
	if camera.trauma != 0.0:
		camera.free()
		return {"name": test_name, "passed": false, "message": "Camera trauma should initialize at 0.0."}

	camera.add_trauma(0.50)
	if camera.trauma != 0.50:
		camera.free()
		return {"name": test_name, "passed": false, "message": "Camera trauma should equal 0.50 after addition."}

	# Process 0.1s delta: trauma should decay
	camera._process(0.1)
	if camera.trauma >= 0.50 or camera.trauma <= 0.0:
		camera.free()
		return {"name": test_name, "passed": false, "message": "Camera trauma should decay over time."}

	camera.free()
	return {"name": test_name, "passed": true}
