extends SceneTree

## Stage Q16 Evidence Recorder: Two-Way Temple Traversal & Camera Sightline Verification
## Records telemetry, waypoints, floor contact, and camera hit length along the route.

func _init() -> void:
	_run()

func _run() -> void:
	var bhumi_scene = load("res://scenes/levels/BhumiValley3D.tscn")
	var world = bhumi_scene.instantiate()
	root.add_child(world)

	await process_frame
	await physics_frame

	var player = world.find_child("Player3D", true, false) as PlayerController3D
	var camera_arm = player.find_child("CameraArm", true, false) as SpringArm3D
	var shrine = world.find_child("SunShrine3D", true, false) as Area3D

	var log_file = FileAccess.open("res://../artifacts/traversal_q16/telemetry_q16.json", FileAccess.WRITE)
	var telemetry_entries: Array[Dictionary] = []

	print("================================================================")
	print("  RECORDING STAGE Q16 TWO-WAY TEMPLE TRAVERSAL TELEMETRY")
	print("================================================================")

	# Phase 1: Inward Traversal (Outside spawn -> Approach -> Stairs -> Sanctum -> Altar)
	var reached_altar = false
	for f in range(85):
		Input.action_press("move_forward")
		await physics_frame
		var pos = player.global_position
		var cam_len = camera_arm.get_hit_length() if camera_arm else 4.5
		var entry = {
			"phase": "inward",
			"tick": f,
			"pos_x": snapped(pos.x, 0.001),
			"pos_y": snapped(pos.y, 0.001),
			"pos_z": snapped(pos.z, 0.001),
			"on_floor": player.is_on_floor(),
			"on_wall": player.is_on_wall(),
			"cam_hit_len": snapped(cam_len, 0.01)
		}
		telemetry_entries.append(entry)

		if f % 15 == 0 or pos.z <= -0.1:
			print("[INWARD] Tick %02d | Pos: (%.2f, %.2f, %.2f) | Floor: %s | CamLen: %.2f" % [
				f, pos.x, pos.y, pos.z, player.is_on_floor(), cam_len
			])
		if pos.z <= -0.1:
			reached_altar = true
			break
	Input.action_release("move_forward")

	# Phase 2: Altar Interaction
	await physics_frame
	var detector = player.find_child("InteractDetector", true, false) as Area3D
	var overlapping = detector.get_overlapping_areas() if detector else []
	var altar_in_range = shrine in overlapping
	print("\n[ALTAR] Reached Altar: %s | In-Range: %s | Overlapping: %d areas" % [reached_altar, altar_in_range, overlapping.size()])

	Input.action_press("interact")
	await physics_frame
	Input.action_release("interact")
	await physics_frame

	# Phase 3: Outward Traversal (Altar -> Sanctum -> Doorway -> Stairs Down -> Outside)
	var reached_outside = false
	for f in range(85):
		Input.action_press("move_backward")
		await physics_frame
		var pos = player.global_position
		var cam_len = camera_arm.get_hit_length() if camera_arm else 4.5
		var entry = {
			"phase": "outward",
			"tick": f,
			"pos_x": snapped(pos.x, 0.001),
			"pos_y": snapped(pos.y, 0.001),
			"pos_z": snapped(pos.z, 0.001),
			"on_floor": player.is_on_floor(),
			"on_wall": player.is_on_wall(),
			"cam_hit_len": snapped(cam_len, 0.01)
		}
		telemetry_entries.append(entry)

		if f % 15 == 0 or pos.z >= 7.1:
			print("[OUTWARD] Tick %02d | Pos: (%.2f, %.2f, %.2f) | Floor: %s | CamLen: %.2f" % [
				f, pos.x, pos.y, pos.z, player.is_on_floor(), cam_len
			])
		if pos.z >= 7.1:
			reached_outside = true
			break
	Input.action_release("move_backward")

	print("\n[OUTSIDE] Returned Outside: %s | Final Pos: %s" % [reached_outside, str(player.global_position)])

	if log_file:
		log_file.store_string(JSON.stringify(telemetry_entries, "\t"))
		log_file.close()
		print("[SAVED] Telemetry recorded to artifacts/traversal_q16/telemetry_q16.json (%d entries)" % telemetry_entries.size())

	world.queue_free()
	quit(0 if (reached_altar and reached_outside) else 1)
