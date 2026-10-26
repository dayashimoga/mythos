@tool
extends SceneTree

func _init() -> void:
	print("=== Starting direct glTF import of Devi Tara NPC ===")
	_import_actor("res://assets/characters/npcs/devi_tara.glb")
	print("=== Direct glTF import of Devi Tara complete! ===")
	quit(0)

func _import_actor(glb_path: String) -> void:
	print("Importing: ", glb_path)
	var gltf = GLTFDocument.new()
	var state = GLTFState.new()
	var err = gltf.append_from_file(glb_path, state)
	if err != OK:
		printerr("Failed to append gltf from file: ", glb_path, " err: ", err)
		return

	var scene_root = gltf.generate_scene(state)
	if not scene_root:
		printerr("Failed to generate scene from GLTFState: ", glb_path)
		return

	print("  Generated scene root: ", scene_root.name)
	var ap: AnimationPlayer = scene_root.find_child("AnimationPlayer", true, false)
	if ap:
		print("  AnimationPlayer found! Available animations:")
		for a in ap.get_animation_list():
			print("    * ", a)

	# Save to .scn in npcs folder as a pre-baked scene
	var packed = PackedScene.new()
	var pack_err = packed.pack(scene_root)
	if pack_err != OK:
		printerr("Failed to pack scene: ", pack_err)
		scene_root.free()
		return

	var dest_path = "res://assets/characters/npcs/devi_tara.scn"
	var save_err = ResourceSaver.save(packed, dest_path, ResourceSaver.FLAG_COMPRESS)
	if save_err != OK:
		printerr("Failed to save packed scene to ", dest_path, " err: ", save_err)
	else:
		print("  Successfully saved packed scene to: ", dest_path)

	scene_root.free()
