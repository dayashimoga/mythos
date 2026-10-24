class_name TestPlayerTraversal3D
extends RefCounted

## Validates 3D character physics, camera orbit, combat targeting, slope/ramp handling, obstacle geometry, and spatial interaction.

const TrainingSentinelScript = preload("res://scripts/entities/training_sentinel_3d.gd")

static func run_all() -> Array[Dictionary]:
	var results: Array[Dictionary] = []
	results.append(_test_player_3d_node_hierarchy())
	results.append(_test_gravity_and_vertical_physics())
	results.append(_test_camera_orbit_perspective())
	results.append(_test_camera_combat_target_locking())
	results.append(_test_stair_and_ramp_elevation_geometry())
	results.append(_test_obstacle_and_platform_geometry())
	results.append(_test_training_sentinel_combat_interaction())
	results.append(_test_shrine_spatial_proximity())
	return results

static func _test_player_3d_node_hierarchy() -> Dictionary:
	var player_scene = load("res://scenes/player/Player3D.tscn")
	if not player_scene:
		return {"name": "test_player_3d_node_hierarchy", "passed": false}

	var player = player_scene.instantiate() as PlayerController3D
	var has_col = player.has_node("CollisionShape3D")
	var has_cam_arm = player.has_node("CameraArm")
	var has_cam = player.has_node("CameraArm/Camera3D")
	var has_model = player.has_node("Visual/VeerModel")
	var has_raycast = player.has_node("InteractRayCast")
	var has_hitbox = player.has_node("MeleeHitbox")

	var passed = (player is CharacterBody3D and has_col and has_cam_arm and has_cam and has_model and has_raycast and has_hitbox)
	player.free()
	return {"name": "test_player_3d_node_hierarchy", "passed": passed}

static func _test_gravity_and_vertical_physics() -> Dictionary:
	var player_scene = load("res://scenes/player/Player3D.tscn")
	var player = player_scene.instantiate() as PlayerController3D

	# Simulate airborne acceleration
	player.velocity = Vector3(0, 0, 0)
	var delta = 0.05
	var expected_fall_vel = -player.gravity * delta
	player.velocity.y -= player.gravity * delta

	# Jump buffer and coyote time properties
	var has_jump_buffer = ("jump_buffer_timer" in player)
	var has_coyote = ("coyote_timer" in player)

	var passed = (player.velocity.y < -0.8 and abs(player.velocity.y - expected_fall_vel) < 0.01 and has_jump_buffer and has_coyote)
	player.free()
	return {"name": "test_gravity_and_vertical_physics", "passed": passed}

static func _test_camera_orbit_perspective() -> Dictionary:
	var player_scene = load("res://scenes/player/Player3D.tscn")
	var player = player_scene.instantiate() as PlayerController3D
	var cam_arm = player.get_node("CameraArm") as OrbitCamera3D

	var initial_rot_y = cam_arm.rotation.y
	# Orbit 45 degrees
	cam_arm.orbit(100.0, 0.0)
	var rotated_rot_y = cam_arm.rotation.y

	# Pitch clamping test
	cam_arm.orbit(0.0, 5000.0) # Heavy downward drag
	var pitch = rad_to_deg(cam_arm.rotation.x)
	var pitch_clamped = (pitch >= cam_arm.min_pitch_deg - 0.1 and pitch <= cam_arm.max_pitch_deg + 0.1)

	var passed = (rotated_rot_y != initial_rot_y and pitch_clamped and cam_arm.shape is SphereShape3D)
	player.free()
	return {"name": "test_camera_orbit_perspective", "passed": passed}

static func _test_camera_combat_target_locking() -> Dictionary:
	var player_scene = load("res://scenes/player/Player3D.tscn")
	var player = player_scene.instantiate() as PlayerController3D
	var cam_arm = player.get_node("CameraArm") as OrbitCamera3D

	# Create dummy target in group targetable
	var dummy = Node3D.new()
	dummy.name = "DummyTarget"
	dummy.position = Vector3(0, 0, -8.0)
	dummy.add_to_group("targetable")

	# Add dummy to root tree for candidate query
	var test_root = Node3D.new()
	test_root.add_child(player)
	test_root.add_child(dummy)

	cam_arm.target_node = player
	cam_arm.find_and_lock_target()
	var locked = cam_arm.is_locked_on()
	var lock_target = cam_arm.get_locked_target()

	cam_arm.clear_target_lock()
	var unlocked = not cam_arm.is_locked_on()

	var passed = (locked and lock_target == dummy and unlocked)
	test_root.free()
	return {"name": "test_camera_combat_target_locking", "passed": passed}

static func _test_stair_and_ramp_elevation_geometry() -> Dictionary:
	var chamber_scene = load("res://scenes/levels/TestChamber3D.tscn")
	if not chamber_scene:
		return {"name": "test_stair_and_ramp_elevation_geometry", "passed": false}

	var chamber = chamber_scene.instantiate() as Node3D
	var elevated_stage = chamber.get_node("Environment/ElevatedStage") as StaticBody3D
	var step1 = chamber.get_node("Environment/Stairs/Step1") as StaticBody3D
	var step8 = chamber.get_node("Environment/Stairs/Step8") as StaticBody3D
	var ramp = chamber.get_node("Environment/SlopeRamp") as StaticBody3D

	var stage_y = elevated_stage.position.y
	var step1_y = step1.position.y
	var step8_y = step8.position.y
	var ramp_y = ramp.position.y

	# Step 8 must be higher than Step 1, stage at y=1.2 (top=2.4), and ramp center at y=1.2
	var stairs_ok = (step8_y > step1_y and step1_y > 0.0 and stage_y > 1.0)
	var ramp_ok = (ramp != null and ramp_y > 0.8 and ramp.rotation.x != 0.0)

	var passed = (stairs_ok and ramp_ok)
	chamber.free()
	return {"name": "test_stair_and_ramp_elevation_geometry", "passed": passed}

static func _test_obstacle_and_platform_geometry() -> Dictionary:
	var chamber_scene = load("res://scenes/levels/TestChamber3D.tscn")
	var chamber = chamber_scene.instantiate() as Node3D

	var hurdle = chamber.get_node("Environment/LowHurdle") as StaticBody3D
	var plat1 = chamber.get_node("Environment/SteppingPlatforms/Platform1") as StaticBody3D
	var plat2 = chamber.get_node("Environment/SteppingPlatforms/Platform2") as StaticBody3D
	var plat3 = chamber.get_node("Environment/SteppingPlatforms/Platform3") as StaticBody3D

	var hurdle_ok = (hurdle != null and hurdle.position.y > 0.2 and hurdle.position.y < 0.6)
	var platforms_ascending = (plat1 != null and plat2 != null and plat3 != null and plat3.position.y > plat2.position.y and plat2.position.y > plat1.position.y)

	var passed = (hurdle_ok and platforms_ascending)
	chamber.free()
	return {"name": "test_obstacle_and_platform_geometry", "passed": passed}

static func _test_training_sentinel_combat_interaction() -> Dictionary:
	var sentinel_scene = load("res://scenes/entities/TrainingSentinel3D.tscn")
	if not sentinel_scene:
		return {"name": "test_training_sentinel_combat_interaction", "passed": false}

	var sentinel = sentinel_scene.instantiate()
	sentinel._ready()
	var is_targetable = sentinel.is_in_group("targetable")
	var init_hp = sentinel.current_health

	# Hit with CombatMath attack
	var atk = CombatMath.AttackSpec.new("veer", 30, 40.0, Vector3(0, 0, 2))
	var res = sentinel.take_damage_spec(atk)

	var dmg_taken = (sentinel.current_health < init_hp)
	var poise_reduced = (sentinel.poise.current < sentinel.poise.max_poise)

	var passed = (is_targetable and dmg_taken and poise_reduced and res.damage_dealt == 30)
	sentinel.free()
	return {"name": "test_training_sentinel_combat_interaction", "passed": passed}

static func _test_shrine_spatial_proximity() -> Dictionary:
	var shrine_scene = load("res://scenes/interactables/SunShrine3D.tscn")
	var shrine = shrine_scene.instantiate() as SunShrine3D

	var has_col = shrine.has_node("CollisionShape3D")
	var has_prompt = shrine.has_node("PromptLabel")
	var has_light = shrine.has_node("SunLight")

	var passed = (shrine is Area3D and has_col and has_prompt and has_light and not shrine.is_ignited)
	shrine.free()
	return {"name": "test_shrine_spatial_proximity", "passed": passed}
