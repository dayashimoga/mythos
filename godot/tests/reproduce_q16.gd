extends SceneTree

func _init() -> void:
	_run()

func _run() -> void:
	var bhumi_scene = load("res://scenes/levels/BhumiValley3D.tscn")
	var world = bhumi_scene.instantiate()
	root.add_child(world)

	await process_frame
	await physics_frame

	var player = world.get_node_or_null("Player3D") as PlayerController3D
	var camera_arm = player.get_node_or_null("CameraArm") as SpringArm3D
	var shrine = world.find_child("SunShrine3D", true, false) as Area3D
	print("[START] Spawn pos=%s on_floor=%s" % [str(player.global_position), player.is_on_floor()])

	# 1. Inward Journey: Outside -> Temple Stairs -> Inner Sanctum -> Altar
	print("\n--- PHASE 1: INWARD TEMPLE TRAVERSAL ---")
	var reached_altar = false
	var ticks_in = 0
	for f in range(90):
		Input.action_press("move_forward")
		await physics_frame
		ticks_in += 1
		var pos = player.global_position
		if f % 10 == 0 or pos.z <= 0.0:
			print("Inward Tick %02d: pos=%s on_floor=%s cam_len=%.2f" % [
				f, str(pos), player.is_on_floor(), camera_arm.get_hit_length() if camera_arm else 0.0
			])
		if pos.z <= 0.0:
			reached_altar = true
			break
	Input.action_release("move_forward")

	print("[CHECKPOINT 1] Reached Altar: %s (at pos %s in %d ticks)" % [reached_altar, str(player.global_position), ticks_in])
	assert(reached_altar, "Failed to reach altar inside temple!")

	# 2. Altar Interaction Check
	print("\n--- PHASE 2: ALTAR INTERACTION CHECK ---")
	await physics_frame
	var overlapping_areas = player.get_node("InteractDetector").get_overlapping_areas()
	var shrine_detected = shrine in overlapping_areas or player.current_interactable == shrine
	print("InteractDetector overlapping areas: %s, detected_shrine=%s" % [str(overlapping_areas), shrine_detected])
	assert(shrine_detected, "Player cannot detect SunShrine3D at altar!")

	# Consecrate shrine with E
	Input.action_press("interact")
	await physics_frame
	Input.action_release("interact")
	await physics_frame
	print("Shrine ignited state: %s" % [shrine.is_ignited if shrine else false])

	# 3. Outward Journey: Altar -> Inner Sanctum -> Doorway -> Stairs Down -> Outside
	print("\n--- PHASE 3: OUTWARD TEMPLE TRAVERSAL ---")
	var reached_outside = false
	var ticks_out = 0
	for f in range(90):
		Input.action_press("move_backward")
		await physics_frame
		ticks_out += 1
		var pos = player.global_position
		if f % 10 == 0 or pos.z >= 7.0:
			print("Outward Tick %02d: pos=%s on_floor=%s cam_len=%.2f" % [
				f, str(pos), player.is_on_floor(), camera_arm.get_hit_length() if camera_arm else 0.0
			])
		if pos.z >= 7.0:
			reached_outside = true
			break
	Input.action_release("move_backward")

	print("[CHECKPOINT 2] Reached Outside: %s (at pos %s in %d ticks)" % [reached_outside, str(player.global_position), ticks_out])
	assert(reached_outside, "Failed to return outside from temple!")

	print("\n=======================================================")
	print("  TWO-WAY TEMPLE ROUTE SUCCESSFULLY COMPLETED! PASS!  ")
	print("=======================================================\n")
	world.queue_free()
	quit(0)
