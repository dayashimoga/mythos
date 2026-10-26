@tool
extends SceneTree

func _init() -> void:
	print("=== Starting direct glTF import of Svar Production Assets ===")
	# Existing models with predefined import hashes
	_import_asset("res://assets/characters/enemies/boss_surya_avatara.glb", "res://.godot/imported/boss_surya_avatara.glb-cd6ed6881fb8fd2b1fdc8ab8f37bfb6f.scn")
	_import_asset("res://assets/characters/enemies/surya_guardian.glb", "res://.godot/imported/surya_guardian.glb-d6280bee20c6d8783623225158400e79.scn")
	_import_asset("res://assets/characters/enemies/solar_gryphon.glb", "res://.godot/imported/solar_gryphon.glb-7844c83ef2b9c609c2b6e666054eb6f4.scn")
	_import_asset("res://assets/environment/solar_prism_pillar.glb", "res://.godot/imported/solar_prism_pillar.glb-7379138baef19583e61c99c531a3cb10.scn")
	_import_asset("res://assets/environment/celestial_sun_shikhara.glb", "res://.godot/imported/celestial_sun_shikhara.glb-b37e7d78069470d9c98bdfe3d830d87b.scn")
	_import_asset("res://assets/environment/surya_mahapeetham_pedestal.glb", "res://.godot/imported/surya_mahapeetham_pedestal.glb-63356697b22983016fdc530d424d6d20.scn")

	# New modular environmental assets
	var new_env_assets = [
		"svar_entry_bastion",
		"svar_mid_bastion",
		"svar_apex_citadel",
		"svar_sanctum_bastion",
		"solar_light_bridge",
		"solar_brazier_pillar"
	]

	for asset_name in new_env_assets:
		var glb_path = "res://assets/environment/%s.glb" % asset_name
		var hash_str = glb_path.md5_text()
		var dest_scn = "res://.godot/imported/%s.glb-%s.scn" % [asset_name, hash_str]
		_create_import_file(glb_path, asset_name, hash_str, dest_scn)
		_import_asset(glb_path, dest_scn)

	print("=== Direct glTF import of Svar assets complete! ===")
	quit(0)

func _create_import_file(glb_path: String, asset_name: String, hash_str: String, dest_scn: String) -> void:
	var import_path = glb_path + ".import"
	var content = """[remap]

importer="scene"
importer_version=1
type="PackedScene"
uid="uid://svar_%s"
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
		return

	var save_err = ResourceSaver.save(packed, dest_path)
	if save_err == OK:
		print("Successfully saved packed scene to: ", dest_path)
	else:
		printerr("Failed to save packed scene: ", save_err)
