@tool
extends SceneTree

func _init():
	print("Starting direct glTF import of veer.glb via GLTFDocument...")
	var gltf = GLTFDocument.new()
	var state = GLTFState.new()
	var err = gltf.append_from_file("res://assets/characters/veer/veer.glb", state)
	if err != OK:
		print("Failed to append gltf from file: ", err)
		quit(1)
		return

	var scene_root = gltf.generate_scene(state)
	if not scene_root:
		print("Failed to generate scene from GLTFState")
		quit(1)
		return

	print("Successfully generated scene from veer.glb! Root name: ", scene_root.name)
	
	# Pack and save to res://.godot/imported/veer.glb-f12527fb6e6dd986581755be1b7c12eb.scn
	var packed = PackedScene.new()
	var pack_err = packed.pack(scene_root)
	if pack_err != OK:
		print("Failed to pack scene: ", pack_err)
		quit(1)
		return

	var dest_path = "res://.godot/imported/veer.glb-f12527fb6e6dd986581755be1b7c12eb.scn"
	var save_err = ResourceSaver.save(packed, dest_path, ResourceSaver.FLAG_COMPRESS)
	if save_err != OK:
		print("Failed to save packed scene to ", dest_path, ": ", save_err)
		quit(1)
		return

	print("Successfully saved packed scene to: ", dest_path)
	scene_root.free()
	quit(0)
