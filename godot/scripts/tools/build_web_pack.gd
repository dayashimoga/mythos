@tool
extends SceneTree

## Native Godot PCK Builder using PCKPacker
## Packages project files into public/3d/index.pck without requiring external export templates

const TARGET_PCK = "h:/mythologicalgame/public/3d/index.pck"
const DIST_PCK = "h:/mythologicalgame/dist/3d/index.pck"
const BUILDS_PCK = "h:/mythologicalgame/builds/web/index.pck"

func _init() -> void:
	print("[PCK Builder] Starting native Godot package compilation...")
	var packer = PCKPacker.new()
	var err = packer.pck_start(TARGET_PCK)
	if err != OK:
		printerr("[PCK Builder] Failed to start PCK file: ", err)
		quit(1)
		return

	# Add project root files
	packer.add_file("res://project.godot", "h:/mythologicalgame/godot/project.godot")
	packer.add_file("res://export_presets.cfg", "h:/mythologicalgame/godot/export_presets.cfg")

	# Recursively add godot/ directories
	_pack_dir_recursive(packer, "res://assets", "h:/mythologicalgame/godot/assets")
	_pack_dir_recursive(packer, "res://scenes", "h:/mythologicalgame/godot/scenes")
	_pack_dir_recursive(packer, "res://scripts", "h:/mythologicalgame/godot/scripts")
	_pack_dir_recursive(packer, "res://.godot/imported", "h:/mythologicalgame/godot/.godot/imported")

	err = packer.flush()
	if err != OK:
		printerr("[PCK Builder] Failed to flush PCK file: ", err)
		quit(1)
		return

	print("[PCK Builder] Successfully built: ", TARGET_PCK)
	var file = FileAccess.open(TARGET_PCK, FileAccess.READ)
	var size = file.get_length() if file else 0
	file = null
	print("[PCK Builder] PCK file size: ", size, " bytes")

	# Copy to dist/3d, builds/web, builds/windows, and builds/linux
	DirAccess.make_dir_recursive_absolute("h:/mythologicalgame/dist/3d")
	DirAccess.make_dir_recursive_absolute("h:/mythologicalgame/builds/web")
	DirAccess.make_dir_recursive_absolute("h:/mythologicalgame/builds/windows")
	DirAccess.make_dir_recursive_absolute("h:/mythologicalgame/builds/linux")
	
	DirAccess.copy_absolute(TARGET_PCK, DIST_PCK)
	DirAccess.copy_absolute(TARGET_PCK, BUILDS_PCK)
	DirAccess.copy_absolute(TARGET_PCK, "h:/mythologicalgame/builds/windows/mythos_3d.pck")
	DirAccess.copy_absolute(TARGET_PCK, "h:/mythologicalgame/builds/linux/mythos_3d.pck")
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
