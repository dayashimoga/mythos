@tool
extends SceneTree

func _init():
	print("Starting direct glTF import of environment models...")
	var models = [
		"res://assets/environment/champaka_tree.glb",
		"res://assets/environment/rock_outcrop.glb",
		"res://assets/environment/flowering_shrub.glb",
		"res://assets/environment/sky_sanctuary_island.glb",
		"res://assets/environment/vayu_windmill_island.glb",
		"res://assets/environment/cyclone_spire_island.glb",
		"res://assets/environment/high_gale_pinnacle_island.glb",
		"res://assets/environment/vayu_wind_turbine.glb",
		"res://assets/environment/celestial_grapple_anchor.glb",
		"res://assets/environment/thermal_updraft_vent.glb",
		"res://assets/environment/sky_temple_pavilion.glb",
		"res://assets/environment/floating_prana_crystal.glb"
	]
	
	for model_path in models:
		_import_model(model_path)
		
	print("All environment models successfully processed.")
	quit(0)

func _import_model(model_path: String) -> void:
	var gltf = GLTFDocument.new()
	var state = GLTFState.new()
	var err = gltf.append_from_file(model_path, state)
	if err != OK:
		print("Failed to append gltf from file: ", model_path, " err: ", err)
		return

	var scene_root = gltf.generate_scene(state)
	if not scene_root:
		print("Failed to generate scene from: ", model_path)
		return

	var packed = PackedScene.new()
	var pack_err = packed.pack(scene_root)
	if pack_err != OK:
		print("Failed to pack scene for: ", model_path, " err: ", pack_err)
		scene_root.free()
		return

	var file_name = model_path.get_file()
	var md5 = model_path.md5_text()
	var dest_path = "res://.godot/imported/%s-%s.scn" % [file_name, md5]

	var save_err = ResourceSaver.save(packed, dest_path, ResourceSaver.FLAG_COMPRESS)
	if save_err != OK:
		print("Failed to save packed scene to: ", dest_path, " err: ", save_err)
		scene_root.free()
		return

	print("Saved packed scene to: ", dest_path)

	# Write .glb.import file
	var import_path = model_path + ".import"
	var import_content = """[remap]

importer="scene"
importer_version=1
type="PackedScene"
uid="uid://%s"
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
""" % [md5.substr(0, 13), dest_path, model_path, dest_path]

	var f = FileAccess.open(import_path, FileAccess.WRITE)
	if f:
		f.store_string(import_content)
		f.close()
		print("Wrote import metadata to: ", import_path)
	else:
		print("Failed to write import metadata: ", import_path)

	scene_root.free()
