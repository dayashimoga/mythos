@tool
extends SceneTree

func _init() -> void:
	print("=== Starting direct glTF import of Bhumi Combat Actors ===")
	_import_actor("res://assets/characters/enemies/asura_warrior.glb", "res://.godot/imported/asura_warrior.glb-613b7dc7337bd917a73730b658fe44fd.scn")
	_import_actor("res://assets/characters/enemies/boss_kalanemi.glb", "res://.godot/imported/boss_kalanemi.glb-cd6204add59d67c858c6961a453dd31a.scn")
	print("=== Direct glTF import complete! ===")
	quit(0)

func _import_actor(glb_path: String, dest_path: String) -> void:
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

	var packed = PackedScene.new()
	var pack_err = packed.pack(scene_root)
	if pack_err != OK:
		printerr("Failed to pack scene: ", pack_err)
		scene_root.free()
		return

	var save_err = ResourceSaver.save(packed, dest_path, ResourceSaver.FLAG_COMPRESS)
	if save_err != OK:
		printerr("Failed to save packed scene to ", dest_path, " err: ", save_err)
	else:
		print("  Successfully saved packed scene to: ", dest_path)

	scene_root.free()
