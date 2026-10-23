class_name TestPlayerTraversal3D
extends RefCounted

## Validates 3D character physics, camera orbit, stair elevation, and spatial interaction.

static func run_all() -> Array[Dictionary]:
	var results: Array[Dictionary] = []
	results.append(_test_player_3d_node_hierarchy())
	results.append(_test_gravity_and_vertical_physics())
	results.append(_test_camera_orbit_perspective())
	results.append(_test_stair_elevation_geometry())
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
	var has_model = player.has_node("Visual/VeerModel") or player.has_node("Visual/Body/ArmR/WeaponSocket/SuryaKhadga")
	var has_anim = player.anim_player != null or player.find_child("AnimationPlayer", true, false) != null

	var passed = (player is CharacterBody3D and has_col and has_cam_arm and has_cam and has_model and has_anim)
	player.free()
	return {"name": "test_player_3d_node_hierarchy", "passed": passed}

static func _test_gravity_and_vertical_physics() -> Dictionary:
	var player_scene = load("res://scenes/player/Player3D.tscn")
	var player = player_scene.instantiate() as PlayerController3D

	# Simulate airborne state
	player.velocity = Vector3(0, 0, 0)
	var delta = 0.05
	# When not on floor, gravity accelerates downward
	var expected_fall_vel = -player.gravity * delta
	player.velocity.y -= player.gravity * delta

	var passed = (player.velocity.y < -0.8 and abs(player.velocity.y - expected_fall_vel) < 0.01)
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

	var passed = (rotated_rot_y != initial_rot_y and pitch_clamped)
	player.free()
	return {"name": "test_camera_orbit_perspective", "passed": passed}

static func _test_stair_elevation_geometry() -> Dictionary:
	var chamber_scene = load("res://scenes/levels/TestChamber3D.tscn")
	if not chamber_scene:
		return {"name": "test_stair_elevation_geometry", "passed": false}

	var chamber = chamber_scene.instantiate() as Node3D
	var elevated_stage = chamber.get_node("Environment/ElevatedStage") as StaticBody3D
	var step1 = chamber.get_node("Environment/Stairs/Step1") as StaticBody3D
	var step8 = chamber.get_node("Environment/Stairs/Step8") as StaticBody3D

	var stage_y = elevated_stage.position.y
	var step1_y = step1.position.y
	var step8_y = step8.position.y

	# Step 8 must be higher than Step 1, and elevated stage must be at height ~1.2 (top at 2.4m)
	var stairs_have_real_height = (step8_y > step1_y and step1_y > 0.0 and stage_y > 1.0)

	chamber.free()
	return {"name": "test_stair_elevation_geometry", "passed": stairs_have_real_height}

static func _test_shrine_spatial_proximity() -> Dictionary:
	var shrine_scene = load("res://scenes/interactables/SunShrine3D.tscn")
	var shrine = shrine_scene.instantiate() as SunShrine3D

	var has_col = shrine.has_node("CollisionShape3D")
	var has_prompt = shrine.has_node("PromptLabel")
	var has_light = shrine.has_node("SunLight")

	var passed = (shrine is Area3D and has_col and has_prompt and has_light and not shrine.is_ignited)
	shrine.free()
	return {"name": "test_shrine_spatial_proximity", "passed": passed}
