@tool
extends SceneTree

## Native Godot PCK Builder using PCKPacker
## Packages project files into public/3d/index.pck without requiring external export templates

func _init() -> void:
	print("[PCK Builder] Starting native Godot package compilation...")
	var project_dir = ProjectSettings.globalize_path("res://").trim_suffix("/")
	var root_dir = ProjectSettings.globalize_path("res://../").trim_suffix("/")

	var target_pck = root_dir + "/public/3d/index.pck"
	var dist_pck = root_dir + "/dist/3d/index.pck"
	var builds_pck = root_dir + "/builds/web/index.pck"
	var win_pck = root_dir + "/builds/windows/mythos_3d.pck"
	var linux_pck = root_dir + "/builds/linux/mythos_3d.pck"

	var packer = PCKPacker.new()
	var err = packer.pck_start(target_pck)
	if err != OK:
		printerr("[PCK Builder] Failed to start PCK file: ", err)
		quit(1)
		return

	# Add project root files
	packer.add_file("res://project.godot", project_dir + "/project.godot")
	packer.add_file("res://export_presets.cfg", project_dir + "/export_presets.cfg")

	# Recursively add godot/ directories
	_pack_dir_recursive(packer, "res://assets", project_dir + "/assets")
	_pack_dir_recursive(packer, "res://scenes", project_dir + "/scenes")
	_pack_dir_recursive(packer, "res://scripts", project_dir + "/scripts")
	_pack_dir_recursive(packer, "res://.godot/imported", project_dir + "/.godot/imported")

	err = packer.flush()
	if err != OK:
		printerr("[PCK Builder] Failed to flush PCK file: ", err)
		quit(1)
		return

	print("[PCK Builder] Successfully built: ", target_pck)
	var file = FileAccess.open(target_pck, FileAccess.READ)
	var size = file.get_length() if file else 0
	file = null
	print("[PCK Builder] PCK file size: ", size, " bytes")

	# Copy to dist/3d, builds/web, builds/windows, and builds/linux
	DirAccess.make_dir_recursive_absolute(root_dir + "/dist/3d")
	DirAccess.make_dir_recursive_absolute(root_dir + "/builds/web")
	DirAccess.make_dir_recursive_absolute(root_dir + "/builds/windows")
	DirAccess.make_dir_recursive_absolute(root_dir + "/builds/linux")
	
	DirAccess.copy_absolute(target_pck, dist_pck)
	DirAccess.copy_absolute(target_pck, builds_pck)
	DirAccess.copy_absolute(target_pck, win_pck)
	DirAccess.copy_absolute(target_pck, linux_pck)
	print("[PCK Builder] Synchronized PCK to dist/3d/, builds/web/, builds/windows/, and builds/linux/.")
	quit(0)

func _pack_dir_recursive(packer: PCKPacker, res_prefix: String, disk_dir: String) -> void:
	var dir = DirAccess.open(disk_dir)
	if not dir:
		return
	dir.list_dir_begin()
	var file_name = dir.get_next()
	while file_name != "":
		if file_name != "." and file_name != "..":
			if file_name.ends_with(".blend") or file_name.ends_with(".blend1") or file_name.ends_with(".tmp"):
				file_name = dir.get_next()
				continue
			var disk_path = disk_dir + "/" + file_name
			var res_path = res_prefix + "/" + file_name
			if dir.current_is_dir():
				_pack_dir_recursive(packer, res_path, disk_path)
			else:
				packer.add_file(res_path, disk_path)
		file_name = dir.get_next()
	dir.list_dir_end()
