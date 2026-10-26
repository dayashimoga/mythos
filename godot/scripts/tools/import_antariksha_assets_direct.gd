@tool
extends SceneTree

func _init() -> void:
	print("=== Starting direct glTF import of Antariksha Production Assets ===")
	_import_asset("res://assets/characters/enemies/boss_matarishvan.glb", "res://.godot/imported/boss_matarishvan.glb-15baec5b8ae56fb591fec2d67731a86a.scn")
	_import_asset("res://assets/characters/enemies/gale_falcon.glb", "res://.godot/imported/gale_falcon.glb-92cdaa35aecc8a5486c909eb75e6095e.scn")
	_import_asset("res://assets/characters/enemies/wind_archer.glb", "res://.godot/imported/wind_archer.glb-c3f0774ccf4292332fe684d1a0462344.scn")
	_import_asset("res://assets/environment/floating_island_base.glb", "res://.godot/imported/floating_island_base.glb-2198b6ee8a3f319ea9194e7ac780148a.scn")
	_import_asset("res://assets/environment/vayu_windmill.glb", "res://.godot/imported/vayu_windmill.glb-664036cef7a2d10968fcb4d3d98b3dcd.scn")
	_import_asset("res://assets/environment/grapple_anchor_ring.glb", "res://.godot/imported/grapple_anchor_ring.glb-8800c67adb1666b8870e800abf54a39c.scn")
	print("=== Direct glTF import of Antariksha assets complete! ===")
	quit(0)

func _import_asset(glb_path: String, dest_path: String) -> void:
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
