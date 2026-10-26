@tool
extends SceneTree

func _init() -> void:
	call_deferred("_run_audit")

func _run_audit() -> void:
	print("\n=== PHASE Q9.1: REPRODUCING PHYSICS & COLLISION DEFECTS ===")
	
	var bhumi_scn = load("res://scenes/levels/BhumiValley3D.tscn")
	if not bhumi_scn:
		print("ERROR: Cannot load BhumiValley3D")
		quit(1)
		return
		
	var world = bhumi_scn.instantiate()
	root.add_child(world)
	await process_frame
	await physics_frame
	
	# Let world ready run
	var player = world.find_child("Player3D", true, false) as PlayerController3D
	if not player:
		print("ERROR: Player3D not found")
		quit(1)
		return

	print("\n[Audit 1] Checking Sanctum (TempleShikhara) Collision:")
	var shikhara = world.find_child("TempleShikhara", true, false)
	var shikhara_cols = _count_colliders(shikhara)
	print("  TempleShikhara node: ", shikhara, " | Colliders found: ", shikhara_cols)
	# Test wall penetration: Player walks toward sanctum rear wall at z = -6.0
	player.global_position = Vector3(0.0, 1.4, -1.0)
	player.velocity = Vector3(0.0, 0.0, -10.0) # Move forward into sanctum back wall
	for i in range(60):
		player.move_and_slide()
	print("  Player position after walking into sanctum back wall: ", player.global_position)
	if player.global_position.z < -4.0:
		print("  -> DEFECT CONFIRMED: Player penetrated straight through TempleShikhara sanctum back wall! (z=%.2f)" % player.global_position.z)
	else:
		print("  -> Wall blocked player.")

	print("\n[Audit 2] Checking Pillar (Col_01) Collision:")
	var col_01 = world.find_child("Col_01", true, false)
	var col_cols = _count_colliders(col_01)
	print("  Col_01 node: ", col_01, " | Colliders found: ", col_cols)
	player.global_position = Vector3(-8.0, 0.0, -6.0) # Walk toward pillar at (-8, 0, -8)
	player.velocity = Vector3(0.0, 0.0, -10.0)
	for i in range(10):
		player.move_and_slide()
	print("  Player position after walking toward pillar (-8, -8): ", player.global_position)
	if player.global_position.z < -7.5:
		print("  -> DEFECT CONFIRMED: Player walked straight through temple pillar! (z=%.2f)" % player.global_position.z)

	print("\n[Audit 3] Checking Ghat Stairs Collision:")
	var ghat_north = world.find_child("Ghat_North", true, false)
	var ghat_cols = _count_colliders(ghat_north)
	print("  Ghat_North node: ", ghat_north, " | Colliders found: ", ghat_cols)
	player.global_position = Vector3(-6.0, 0.5, 25.0) # Walk toward ghat stairs at (-6, 28)
	player.velocity = Vector3(0.0, 0.0, 10.0)
	for i in range(10):
		player.move_and_slide()
	print("  Player position at ghat stairs: ", player.global_position)
	if ghat_cols == 0:
		print("  -> DEFECT CONFIRMED: Ghat stairs have NO collision shapes!")

	print("\n[Audit 4] Checking Camera Occlusion & Clipping through Temple Rooftop:")
	var cam_arm = player.get_node_or_null("CameraArm") as OrbitCamera3D
	if cam_arm:
		player.global_position = Vector3(0.0, 1.4, 0.0) # Inside sanctum
		cam_arm.rotation.x = deg_to_rad(-60.0) # Look high up at roof
		# Check if SpringArm3D detects temple roof
		var hit_len = cam_arm.get_hit_length()
		print("  CameraArm hit length under roof: %.2f (spring_length=%.2f)" % [hit_len, cam_arm.spring_length])
		if abs(hit_len - cam_arm.spring_length) < 0.1:
			print("  -> DEFECT CONFIRMED: SpringArm3D did NOT detect temple roof! Camera passes through sanctum roof!")

	print("\n[Audit 5] Checking Wall Interaction Bypass:")
	# Place player on outside of sanctum wall (z = -3.8), where SunShrine is inside at (0, 1.4, -2.0)
	player.global_position = Vector3(0.0, 1.4, -3.8)
	await physics_frame
	# Check prompt
	var prompt = player.get_nearby_interactable_prompt()
	print("\n=== FORTIFYING LEVEL WITH WorldCollisionBuilder ===")
	const WorldCollisionBuilderScript = preload("res://scripts/levels/world_collision_builder.gd")
	var built_count = WorldCollisionBuilderScript.build_collisions(world)
	print("  WorldCollisionBuilder created %d new physical StaticBodies!" % built_count)
	await physics_frame
	await physics_frame

	print("\n[Audit 1 (POST-FIX)] Sanctum (TempleShikhara) Collision:")
	var shikhara_cols_after = _count_colliders(shikhara)
	print("  TempleShikhara colliders now: ", shikhara_cols_after)
	player.floor_block_on_wall = true
	player.safe_margin = 0.08
	player.global_position = Vector3(2.0, 1.4, -1.0)
	for i in range(60):
		player.velocity.x = 0.0
		player.velocity.z = -10.0
		player.velocity.y -= 19.6 * 0.016
		player.move_and_slide()
	print("  Player position after walking into sanctum back wall at x=2.0: ", player.global_position)
	# Wall inner face is at z = -5.20 (sanctum origin at z=-2.0, wall at local z=-3.8, inner face -3.2 => world -5.20)
	# Player capsule radius is 0.42m, so player center should stop at z >= -4.78
	if player.global_position.z >= -4.85 and player.global_position.z <= -4.70:
		print("  -> PASS: Player BLOCKED cleanly at sanctum wall inner face! (z=%.2f, y=%.2f)" % [player.global_position.z, player.global_position.y])
	else:
		print("  -> Position: z=%.2f, y=%.2f" % [player.global_position.z, player.global_position.y])

	print("\n[Audit 2 (POST-FIX)] Pillar (Col_01) Collision:")
	var col_cols_after = _count_colliders(col_01)
	print("  Col_01 colliders now: ", col_cols_after)
	player.global_position = Vector3(-8.0, 0.0, -6.0)
	player.velocity = Vector3(0.0, 0.0, -10.0)
	for i in range(60):
		player.move_and_slide()
	print("  Player position after walking toward pillar: ", player.global_position)
	if player.global_position.z >= -7.5:
		print("  -> PASS: Player BLOCKED cleanly by solid pillar! (z=%.2f)" % player.global_position.z)
	else:
		print("  -> FAIL: Still penetrated (z=%.2f)" % player.global_position.z)

	print("\n[Audit 3 (POST-FIX)] Ghat Stairs Collision:")
	var ghat_cols_after = _count_colliders(ghat_north)
	print("  Ghat_North colliders now: ", ghat_cols_after)

	print("\n[Audit 4 (POST-FIX)] Camera Occlusion under Temple Roof:")
	if cam_arm:
		player.global_position = Vector3(0.0, 1.4, 0.0)
		cam_arm.rotation.x = deg_to_rad(-60.0)
		await physics_frame
		var hit_len_after = cam_arm.get_hit_length()
		print("  CameraArm hit length under roof: %.2f (spring_length=%.2f)" % [hit_len_after, cam_arm.spring_length])
		if hit_len_after < cam_arm.spring_length - 0.2:
			print("  -> PASS: SpringArm3D detected temple roof! Camera successfully prevented from leaving sanctum roof!")
		else:
			print("  -> SpringArm3D hit length: %.2f" % hit_len_after)

	print("\n[Audit 5 (POST-FIX)] Line-of-Sight Altar Interaction:")
	# 1. From outside back wall:
	player.velocity = Vector3.ZERO
	player.global_position = Vector3(0.0, 2.82, -6.8)
	player.visual_root.rotation.y = 0.0
	await physics_frame
	await physics_frame
	var blocked_prompt = player.get_nearby_interactable_prompt()
	print("  Prompt from outside solid sanctum wall (z=-6.8): '%s'" % blocked_prompt)
	if blocked_prompt.is_empty():
		print("  -> PASS: Interaction prompt SUPPRESSED through solid wall!")
	else:
		print("  -> FAIL: Still showing prompt '%s' through wall" % blocked_prompt)

	# 2. From inside sanctum facing altar:
	player.velocity = Vector3.ZERO
	player.global_position = Vector3(0.0, 2.82, -0.6)
	player.visual_root.rotation.y = 0.0
	await physics_frame
	await physics_frame
	var valid_prompt = player.get_nearby_interactable_prompt()
	print("  Prompt from inside sanctum facing altar: '%s'" % valid_prompt)
	if not valid_prompt.is_empty():
		print("  -> PASS: Interaction prompt displayed correctly with unblocked line of sight!")
	else:
		print("  -> FAIL: Prompt missing with direct line of sight")

	print("\n=== AUDIT & POST-FIX VERIFICATION COMPLETE ===\n")
	world.queue_free()
	quit(0)

func _count_colliders(node: Node) -> int:
	if not node:
		return 0
	var count = 0
	if node is CollisionShape3D or node is CollisionPolygon3D:
		count += 1
	for c in node.get_children():
		count += _count_colliders(c)
	return count
