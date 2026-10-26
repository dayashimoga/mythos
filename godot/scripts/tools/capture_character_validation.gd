extends SceneTree

const OUT_DIR = "h:/mythologicalgame/docs/images/veer_validation/"
const BRAIN_DIR = "C:/Users/dayan/.gemini/antigravity-ide/brain/4a5bfbbb-2b05-4ffa-a9b4-fd46b2031671/"

func _init() -> void:
	call_deferred("_run_captures")

func _run_captures() -> void:
	print("[CHARACTER CAPTURER] Starting Veer 3D Reconstruction Visual Validation Sequence...")
	DirAccess.make_dir_recursive_absolute(OUT_DIR)

	# 1. Load CharacterStudio3D
	var studio_res = load("res://scenes/studio/CharacterStudio3D.tscn")
	if not studio_res:
		printerr("Failed to load CharacterStudio3D.tscn")
		quit(1)
		return

	var studio: Node3D = studio_res.instantiate()
	root.add_child(studio)

	# Studio references
	var camera_pivot: Node3D = studio.find_child("CameraPivot", true, false)
	var spring_arm: SpringArm3D = studio.find_child("SpringArm3D", true, false)

	# Allow scene shaders, materials, and textures to compile
	for f in range(30):
		await process_frame

	var studio_shots = [
		{
			"id": "veer_front",
			"pivot_pos": Vector3(0, 1.05, 0),
			"rot_y": 0.0,
			"zoom": 3.0,
			"desc": "Full Body Front Stature & Vedic Attire"
		},
		{
			"id": "veer_three_quarter",
			"pivot_pos": Vector3(0, 1.10, 0),
			"rot_y": 0.65,
			"zoom": 2.8,
			"desc": "Heroic Three-Quarter Angle & PBR Material Response"
		},
		{
			"id": "veer_closeup_face",
			"pivot_pos": Vector3(0, 1.64, 0),
			"rot_y": 0.15,
			"zoom": 1.4,
			"desc": "Facial Anatomy, Amber Surya Netra, Tripundra & Shikha"
		},
		{
			"id": "veer_weapon_detail",
			"pivot_pos": Vector3(-0.45, 1.0, 0.0),
			"rot_y": -0.85,
			"zoom": 1.6,
			"desc": "Forged Damascus Surya-Kripana & Antique Bronze Bracer"
		},
		{
			"id": "veer_back",
			"pivot_pos": Vector3(0, 1.05, 0),
			"rot_y": 3.14159,
			"zoom": 3.0,
			"desc": "Full Body Rear, Shikha Binding, and Kashta Fold"
		},
		{
			"id": "veer_profile_left",
			"pivot_pos": Vector3(0, 1.05, 0),
			"rot_y": 1.5708,
			"zoom": 3.0,
			"desc": "Profile Left Showing Flowing Uttariya & Bicep Armlet"
		},
		{
			"id": "veer_character_studio_overview",
			"pivot_pos": Vector3(0, 1.15, 0),
			"rot_y": 0.40,
			"zoom": 3.6,
			"desc": "Full Character Studio 3D Inspection Environment"
		}
	]

	for shot in studio_shots:
		if camera_pivot:
			camera_pivot.position = shot["pivot_pos"]
			camera_pivot.rotation.y = shot["rot_y"]
		if spring_arm:
			spring_arm.spring_length = shot["zoom"]

		for f in range(15):
			await process_frame

		_save_root_image(shot["id"])

	root.remove_child(studio)
	studio.queue_free()
	for f in range(5):
		await process_frame

	# 2. Capture Real Gameplay Scene: Bhumi Valley 3D with new Veer
	var bhumi_res = load("res://scenes/levels/BhumiValley3D.tscn")
	if bhumi_res:
		var bhumi = bhumi_res.instantiate()
		root.add_child(bhumi)

		for f in range(35):
			await process_frame

		_save_root_image("veer_bhumi_gameplay")

		root.remove_child(bhumi)
		bhumi.queue_free()

	print("[CHARACTER CAPTURER] Validation captures successfully completed.")
	quit(0)

func _save_root_image(shot_id: String) -> void:
	var img = root.get_texture().get_image()
	if img and not img.is_empty():
		var doc_path = OUT_DIR + shot_id + ".png"
		img.save_png(doc_path)
		print("[CHARACTER CAPTURER] Saved: ", doc_path)

		var brain_path = BRAIN_DIR + shot_id + ".png"
		img.save_png(brain_path)
		print("[CHARACTER CAPTURER] Saved to brain artifact directory: ", brain_path)
	else:
		printerr("[CHARACTER CAPTURER] Failed to get image for: ", shot_id)
