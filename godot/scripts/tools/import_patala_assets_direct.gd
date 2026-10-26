@tool
extends SceneTree

func _init() -> void:
	print("=== Starting direct glTF import of Patala Production Assets ===")
	# Existing models with predefined import hashes
	_import_asset("res://assets/characters/enemies/boss_shesha_echo.glb", "res://.godot/imported/boss_shesha_echo.glb-3fb20f04ae371045c47a8a0132c02301.scn")
	_import_asset("res://assets/characters/enemies/naga_constrictor.glb", "res://.godot/imported/naga_constrictor.glb-8f62f5a4454a80709b1e957d0bcfb1f8.scn")
	_import_asset("res://assets/characters/enemies/naga_spitter.glb", "res://.godot/imported/naga_spitter.glb-7d26681457833f37dc2d6ecbfd8cabdf.scn")
	_import_asset("res://assets/environment/patala_stalagmite_cluster.glb", "res://.godot/imported/patala_stalagmite_cluster.glb-6bf6dc4619999ef12d42dfe948b4793b.scn")
	_import_asset("res://assets/environment/vasuki_shrine_pedestal.glb", "res://.godot/imported/vasuki_shrine_pedestal.glb-03c84b01f448d3329e3b3f3a57894ce0.scn")
	_import_asset("res://assets/environment/bioluminescent_fungus.glb", "res://.godot/imported/bioluminescent_fungus.glb-95e4def7612c2c1c4771bdb09ff3da1f.scn")

	# New modular environmental assets
	var new_env_assets = [
		"patala_entrance_chamber",
		"patala_mid_chamber",
		"patala_boss_arena",
		"patala_sanctum_chamber",
		"patala_stalactite_cluster",
		"patala_serpent_archway",
		"patala_venom_river_basin"
	]

	for asset_name in new_env_assets:
		var glb_path = "res://assets/environment/%s.glb" % asset_name
		var hash_str = glb_path.md5_text()
		var dest_scn = "res://.godot/imported/%s.glb-%s.scn" % [asset_name, hash_str]
		_create_import_file(glb_path, asset_name, hash_str, dest_scn)
		_import_asset(glb_path, dest_scn)

	print("=== Direct glTF import of Patala assets complete! ===")
	quit(0)

func _create_import_file(glb_path: String, asset_name: String, hash_str: String, dest_scn: String) -> void:
	var import_path = glb_path + ".import"
	var content = """[remap]

importer="scene"
importer_version=1
type="PackedScene"
uid="uid://patala_%s"
path="%s"

[deps]

source_file="%s"
dest_files=["%s"]

[params]

nodes/root_type=""
nodes/root_name=""
nodes/apply_root_scale=true
nodes/root_scale=1.0
nodes/import_as_skeleton_bones=false
meshes/ensure_tangents=true
meshes/generate_lods=true
meshes/create_shadow_meshes=true
meshes/light_baking=1
meshes/lightmap_texel_size=0.2
meshes/force_disable_compression=false
skins/use_named_skins=true
animation/import=true
animation/fps=30
animation/trimming=false
animation/remove_immutable_tracks=true
animation/import_rest_as_RESET=false
import_script/path=""
_subresources={}
gltf/naming_version=1
gltf/embedded_image_handling=1
""" % [asset_name, dest_scn, glb_path, dest_scn]

	var file = FileAccess.open(import_path, FileAccess.WRITE)
	if file:
		file.store_string(content)
		file.close()
		print("Created .import: ", import_path)
	else:
		printerr("Failed to create .import file for: ", import_path)

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
