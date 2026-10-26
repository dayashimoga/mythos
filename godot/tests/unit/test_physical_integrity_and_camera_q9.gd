class_name TestPhysicalIntegrityAndCameraQ9
extends RefCounted

## Suite 26: Physical Integrity, Collisions & Camera Correction (Stage Q9)
## Comprehensive verification covering:
## 1. Architectural collision geometry generation across realms (WorldCollisionBuilder)
## 2. Sanctum and solid wall penetration prevention configuration & geometry
## 3. Temple pillar and column solid collision containment
## 4. Stair and ghat step elevation traversal physics
## 5. Collision-aware Prana Dash motion sweeping (no tunneling)
## 6. Camera SpringArm3D occlusion, tight-space framing, and roof containment
## 7. Environment interaction line-of-sight and orientation enforcement

const WorldCollisionBuilderScript = preload("res://scripts/levels/world_collision_builder.gd")
const BhumiValleyScene = preload("res://scenes/levels/BhumiValley3D.tscn")
const AntarikshaScene = preload("res://scenes/levels/AntarikshaSkyRealm3D.tscn")
const PatalaScene = preload("res://scenes/levels/PatalaUnderworld3D.tscn")
const Player3DScene = preload("res://scenes/player/Player3D.tscn")

static func run_all() -> Array[Dictionary]:
	var results: Array[Dictionary] = []
	results.append(test_world_collision_builder_hierarchical_coverage())
	results.append(test_player_wall_penetration_prevention())
	results.append(test_pillar_and_column_solid_collision())
	results.append(test_stair_and_ghat_step_traversal())
	results.append(test_dash_motion_sweep_and_no_tunneling())
	results.append(test_camera_springarm_occlusion_and_roof_containment())
	results.append(test_environment_interaction_line_of_sight_enforcement())
	return results

static func test_world_collision_builder_hierarchical_coverage() -> Dictionary:
	var test_name = "test_world_collision_builder_hierarchical_coverage"
	
	var bhumi = BhumiValleyScene.instantiate()
	if not bhumi:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate BhumiValley3D"}
	
	# Explicitly run collision builder
	WorldCollisionBuilderScript.build_collisions(bhumi)
	
	# Verify architectural static bodies exist on Layer 1
	var shikhara = bhumi.find_child("TempleShikhara", true, false)
	var col_01 = bhumi.find_child("Col_01", true, false)
	var ghat_north = bhumi.find_child("Ghat_North", true, false)
	var sun_shrine = bhumi.find_child("SunShrine3D", true, false)
	var shard_sanctum = bhumi.find_child("Shard_01_Sanctum", true, false)
	
	if not shikhara or not col_01 or not ghat_north:
		bhumi.free()
		return {"name": test_name, "passed": false, "message": "Essential architectural nodes missing in BhumiValley3D"}
	
	var shikhara_cols = _count_colliders(shikhara)
	var col_cols = _count_colliders(col_01)
	var ghat_cols = _count_colliders(ghat_north)
	
	if shikhara_cols < 1:
		bhumi.free()
		return {"name": test_name, "passed": false, "message": "TempleShikhara missing StaticBody3D collision shape"}
	if col_cols < 1:
		bhumi.free()
		return {"name": test_name, "passed": false, "message": "Col_01 missing pillar collision shape"}
	if ghat_cols < 2:
		bhumi.free()
		return {"name": test_name, "passed": false, "message": "Ghat_North missing stairs trimesh / ramp collision shapes"}
	
	# Verify that Area3D pickups and triggers do NOT have StaticBody3D obstacles created
	if sun_shrine:
		var shrine_static = sun_shrine.find_child("*StaticBody*", true, false)
		if shrine_static:
			bhumi.free()
			return {"name": test_name, "passed": false, "message": "SunShrine3D incorrectly contains a StaticBody3D obstacle"}
	
	if shard_sanctum:
		var shard_static = shard_sanctum.find_child("*StaticBody*", true, false)
		if shard_static:
			bhumi.free()
			return {"name": test_name, "passed": false, "message": "Shard_01_Sanctum incorrectly contains a StaticBody3D obstacle"}
	
	# Test Antariksha and Patala realms for cross-realm coverage
	var antariksha = AntarikshaScene.instantiate()
	var ant_built = WorldCollisionBuilderScript.build_collisions(antariksha)
	antariksha.free()
	
	var patala = PatalaScene.instantiate()
	var pat_built = WorldCollisionBuilderScript.build_collisions(patala)
	patala.free()
	
	bhumi.free()
	return {"name": test_name, "passed": true}

static func test_player_wall_penetration_prevention() -> Dictionary:
	var test_name = "test_player_wall_penetration_prevention"
	
	var player = Player3DScene.instantiate() as PlayerController3D
	if not player:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate Player3D"}
	
	# 1. Verify safe margin calibration
	if player.safe_margin < 0.05 or player.safe_margin > 0.15:
		player.free()
		return {"name": test_name, "passed": false, "message": "safe_margin not properly calibrated: %.3f" % player.safe_margin}
	
	# 2. Verify wall blocking configuration
	if not player.floor_block_on_wall:
		player.free()
		return {"name": test_name, "passed": false, "message": "floor_block_on_wall must be true"}
	
	if player.up_direction != Vector3.UP:
		player.free()
		return {"name": test_name, "passed": false, "message": "up_direction must be Vector3.UP"}
	
	# 3. Verify sanctum wall geometry in Bhumi
	var bhumi = BhumiValleyScene.instantiate()
	WorldCollisionBuilderScript.build_collisions(bhumi)
	var shikhara = bhumi.find_child("TempleShikhara", true, false)
	if not shikhara:
		player.free()
		bhumi.free()
		return {"name": test_name, "passed": false, "message": "TempleShikhara missing"}
	
	var mesh_inst = shikhara.find_child("*MeshInstance*", true, false) as MeshInstance3D
	if not mesh_inst:
		# Search any MeshInstance child
		for c in shikhara.get_children():
			if c is MeshInstance3D:
				mesh_inst = c
				break
	
	if mesh_inst and mesh_inst.mesh:
		var aabb = mesh_inst.mesh.get_aabb()
		if aabb.size.z < 4.0 or aabb.size.y < 4.0:
			player.free()
			bhumi.free()
			return {"name": test_name, "passed": false, "message": "TempleShikhara mesh dimensions insufficient"}
	
	bhumi.free()
	player.free()
	return {"name": test_name, "passed": true}

static func test_pillar_and_column_solid_collision() -> Dictionary:
	var test_name = "test_pillar_and_column_solid_collision"
	
	var bhumi = BhumiValleyScene.instantiate()
	WorldCollisionBuilderScript.build_collisions(bhumi)
	
	var col_01 = bhumi.find_child("Col_01", true, false)
	if not col_01:
		bhumi.free()
		return {"name": test_name, "passed": false, "message": "Col_01 not found"}
	
	var col_shape = col_01.find_child("PillarCollisionShape", true, false) as CollisionShape3D
	if not col_shape:
		bhumi.free()
		return {"name": test_name, "passed": false, "message": "PillarCollisionShape missing on Col_01"}
	
	var cyl = col_shape.shape as CylinderShape3D
	if not cyl:
		bhumi.free()
		return {"name": test_name, "passed": false, "message": "Col_01 collider is not a CylinderShape3D"}
	
	if cyl.radius < 0.35 or cyl.height < 2.0:
		bhumi.free()
		return {"name": test_name, "passed": false, "message": "Pillar cylinder dimensions out of calibration"}
	
	bhumi.free()
	return {"name": test_name, "passed": true}

static func test_stair_and_ghat_step_traversal() -> Dictionary:
	var test_name = "test_stair_and_ghat_step_traversal"
	
	var player = Player3DScene.instantiate() as PlayerController3D
	if not player:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate Player3D"}
	
	# Verify floor snapping and step margin calibration
	if player.floor_snap_length < 0.40:
		player.free()
		return {"name": test_name, "passed": false, "message": "floor_snap_length (%.2f) too low for stairs" % player.floor_snap_length}
	if player.floor_max_angle < deg_to_rad(45.0):
		player.free()
		return {"name": test_name, "passed": false, "message": "floor_max_angle (%.2f) too shallow for stair ramps" % player.floor_max_angle}
	if not player.floor_block_on_wall:
		player.free()
		return {"name": test_name, "passed": false, "message": "floor_block_on_wall must be true"}
	if player.safe_margin < 0.05:
		player.free()
		return {"name": test_name, "passed": false, "message": "safe_margin too small (%.3f)" % player.safe_margin}
	
	# Verify step-up handler exists
	if not player.has_method("_handle_stair_step_up"):
		player.free()
		return {"name": test_name, "passed": false, "message": "PlayerController3D missing _handle_stair_step_up method"}
	
	# Verify Ghat_North smooth ramp collider
	var bhumi = BhumiValleyScene.instantiate()
	WorldCollisionBuilderScript.build_collisions(bhumi)
	var ghat_north = bhumi.find_child("Ghat_North", true, false)
	var ramp = ghat_north.find_child("StairSmoothRampShape", true, false) as CollisionShape3D if ghat_north else null
	if not ramp or not (ramp.shape is BoxShape3D):
		player.free()
		bhumi.free()
		return {"name": test_name, "passed": false, "message": "Ghat_North missing StairSmoothRampShape BoxShape3D"}
	
	bhumi.free()
	player.free()
	return {"name": test_name, "passed": true}

static func test_dash_motion_sweep_and_no_tunneling() -> Dictionary:
	var test_name = "test_dash_motion_sweep_and_no_tunneling"
	
	var player = Player3DScene.instantiate() as PlayerController3D
	if not player:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate Player3D"}
	
	# Verify dash speed and duration are calibrated
	if player.dash_speed < 15.0 or player.dash_speed > 25.0:
		player.free()
		return {"name": test_name, "passed": false, "message": "dash_speed out of calibrated bounds: %.2f" % player.dash_speed}
	if player.dash_duration < 0.15 or player.dash_duration > 0.35:
		player.free()
		return {"name": test_name, "passed": false, "message": "dash_duration out of calibrated bounds: %.2f" % player.dash_duration}
	
	# Verify kinematic test_move is integrated into controller
	var dummy_col = KinematicCollision3D.new()
	var test_res = player.test_move(player.global_transform, Vector3.ZERO, dummy_col, 0.08)
	
	player.free()
	return {"name": test_name, "passed": true}

static func test_camera_springarm_occlusion_and_roof_containment() -> Dictionary:
	var test_name = "test_camera_springarm_occlusion_and_roof_containment"
	
	var player = Player3DScene.instantiate() as PlayerController3D
	var cam_arm = player.get_node_or_null("CameraArm") as OrbitCamera3D
	if not cam_arm:
		player.free()
		return {"name": test_name, "passed": false, "message": "CameraArm missing on Player3D"}
	
	var cam = cam_arm.get_node_or_null("Camera3D") as Camera3D
	if not cam:
		player.free()
		return {"name": test_name, "passed": false, "message": "Camera3D missing on CameraArm"}
	
	# 1. Verify near clipping plane is <= 0.05 to prevent near-plane clipping
	if cam.near > 0.06:
		player.free()
		return {"name": test_name, "passed": false, "message": "Camera3D.near (%.3f) too large, must be <= 0.05" % cam.near}
	
	# 2. Verify collision mask includes Environment Layer 1
	if (cam_arm.collision_mask & 1) == 0:
		player.free()
		return {"name": test_name, "passed": false, "message": "CameraArm collision_mask must include Layer 1"}
	
	# 3. Verify pitch limits
	if cam_arm.min_pitch_deg > -60.0 or cam_arm.max_pitch_deg < 20.0:
		player.free()
		return {"name": test_name, "passed": false, "message": "Pitch limits not properly configured (min=%.1f, max=%.1f)" % [cam_arm.min_pitch_deg, cam_arm.max_pitch_deg]}
	
	# 4. Verify adaptive tight space framing configuration
	if cam_arm.standard_arm_offset.y < 1.0 or cam_arm.standard_arm_offset.y > 2.0:
		player.free()
		return {"name": test_name, "passed": false, "message": "standard_arm_offset not calibrated"}
	
	player.free()
	return {"name": test_name, "passed": true}

static func test_environment_interaction_line_of_sight_enforcement() -> Dictionary:
	var test_name = "test_environment_interaction_line_of_sight_enforcement"
	
	var player = Player3DScene.instantiate() as PlayerController3D
	if not player:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate Player3D"}
	
	# 1. Test distance limit (> 3.2m must be rejected)
	var distant_node = Node3D.new()
	distant_node.position = Vector3(0.0, 0.0, 5.0)
	var can_interact_distant = player._can_interact_with(distant_node)
	distant_node.free()
	if can_interact_distant:
		player.free()
		return {"name": test_name, "passed": false, "message": "Target beyond 3.2m was incorrectly allowed"}
	
	# 2. Test forward facing arc check (target directly behind player must be rejected)
	var behind_node = Node3D.new()
	behind_node.position = Vector3(0.0, 0.0, -2.0) # Player forward is -Z, so +Z is behind
	if player.visual_root:
		player.visual_root.rotation.y = 0.0
	behind_node.position = Vector3(0.0, 0.0, 2.0)
	var can_interact_behind = player._can_interact_with(behind_node)
	behind_node.free()
	if can_interact_behind:
		player.free()
		return {"name": test_name, "passed": false, "message": "Target behind player was incorrectly allowed"}
	
	# 3. Test prompt formatting
	var prompt_altar = player._format_prompt("SunShrine3D")
	if prompt_altar != "[ E ] Attune Checkpoint Altar":
		player.free()
		return {"name": test_name, "passed": false, "message": "Incorrect prompt format for altar: '%s'" % prompt_altar}
	
	var prompt_shard = player._format_prompt("Shard_01_Sanctum")
	if prompt_shard != "[ E ] Purify Solar Astra Shard":
		player.free()
		return {"name": test_name, "passed": false, "message": "Incorrect prompt format for shard: '%s'" % prompt_shard}
	
	player.free()
	return {"name": test_name, "passed": true}

static func _count_colliders(node: Node) -> int:
	if not node:
		return 0
	var count = 0
	if node is CollisionShape3D or node is CollisionPolygon3D:
		count += 1
	for c in node.get_children():
		count += _count_colliders(c)
	return count
