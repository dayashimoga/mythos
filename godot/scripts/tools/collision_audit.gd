@tool
extends SceneTree

func _init() -> void:
	print("=== RUNNING COLLISION & PHYSICS AUDIT ===")
	
	var assets_to_check = [
		"res://assets/environment/temple_shikhara.glb",
		"res://assets/environment/temple_torana.glb",
		"res://assets/environment/temple_column.glb",
		"res://assets/environment/water_ghat_stairs.glb",
		"res://assets/environment/ruined_watchtower.glb",
		"res://assets/environment/banyan_tree.glb",
		"res://assets/environment/basalt_boulder.glb",
		"res://assets/environment/lotus_pedestal.glb",
		"res://assets/environment/patala_entrance_chamber.glb",
		"res://assets/environment/svar_entry_bastion.glb"
	]
	
	for path in assets_to_check:
		var res = load(path)
		if not res:
			print("Could not load: ", path)
			continue
		var inst = res.instantiate()
		var colliders = _find_all_colliders(inst)
		print("Asset: ", path.get_file(), " | Colliders found: ", colliders.size())
		if colliders.is_empty():
			print("  -> WARNING: No CollisionShape3D / StaticBody3D in ", path.get_file(), "!")
		inst.free()

	print("\n--- Auditing Level Scenes ---")
	var levels = [
		"res://scenes/levels/BhumiValley3D.tscn",
		"res://scenes/levels/AntarikshaSkyRealm3D.tscn",
		"res://scenes/levels/PatalaUnderworld3D.tscn",
		"res://scenes/levels/SvarSolarCitadel3D.tscn",
		"res://scenes/levels/MaharlokaSanctuary3D.tscn",
		"res://scenes/levels/TapolokaForge3D.tscn",
		"res://scenes/levels/SatyalokaApex3D.tscn"
	]
	
	for lvl_path in levels:
		var scn = load(lvl_path)
		if not scn:
			print("Level missing: ", lvl_path)
			continue
		var lvl = scn.instantiate()
		var static_bodies = _find_all_static_bodies(lvl)
		var char_bodies = _find_all_character_bodies(lvl)
		print("Level: ", lvl_path.get_file(), " | StaticBodies: ", static_bodies.size(), " | CharacterBodies: ", char_bodies.size())
		lvl.free()
		
	quit(0)

func _find_all_colliders(node: Node) -> Array:
	var list = []
	if node is CollisionShape3D or node is CollisionPolygon3D:
		list.append(node)
	for child in node.get_children():
		list.append_array(_find_all_colliders(child))
	return list

func _find_all_static_bodies(node: Node) -> Array:
	var list = []
	if node is StaticBody3D:
		list.append(node)
	for child in node.get_children():
		list.append_array(_find_all_static_bodies(child))
	return list

func _find_all_character_bodies(node: Node) -> Array:
	var list = []
	if node is CharacterBody3D:
		list.append(node)
	for child in node.get_children():
		list.append_array(_find_all_character_bodies(child))
	return list
