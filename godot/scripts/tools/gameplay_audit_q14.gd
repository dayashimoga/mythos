@tool
extends SceneTree

func _init() -> void:
	print("\n========================================================")
	print("  STAGE Q14 — GAMEPLAY, COMBAT & ENCOUNTER AUDIT")
	print("========================================================")

	_audit_scene("Player3D", "res://scenes/player/Player3D.tscn")
	_audit_scene("TrainingSentinel3D", "res://scenes/entities/TrainingSentinel3D.tscn")
	_audit_scene("AsuraWarrior3D", "res://scenes/entities/AsuraWarrior3D.tscn")
	_audit_scene("BossKalanemi3D", "res://scenes/entities/BossKalanemi3D.tscn")
	_audit_scene("DeviTara3D", "res://scenes/entities/DeviTara3D.tscn")

	print("\n--- Auditing Enemy glTF Animation Libraries ---")
	_audit_gltf_animations("asura_warrior.glb", "res://assets/characters/enemies/asura_warrior.glb")
	_audit_gltf_animations("boss_kalanemi.glb", "res://assets/characters/enemies/boss_kalanemi.glb")
	_audit_gltf_animations("devi_tara.scn", "res://assets/characters/npcs/devi_tara.scn")

	print("\n========================================================")
	print("  AUDIT COMPLETED")
	print("========================================================\n")
	quit(0)

func _audit_scene(name: String, path: String) -> void:
	print("\n--- Auditing Scene: %s (%s) ---" % [name, path])
	if not ResourceLoader.exists(path):
		print("  -> ERROR: File does not exist!")
		return
	var packed: PackedScene = load(path)
	if not packed:
		print("  -> ERROR: Could not load PackedScene!")
		return
	var inst: Node = packed.instantiate()
	if not inst:
		print("  -> ERROR: Failed to instantiate!")
		return

	print("  Root Type: %s | Groups: %s" % [inst.get_class(), inst.get_groups()])
	if inst is CharacterBody3D:
		print("  Collision Layer: %d | Mask: %d" % [inst.collision_layer, inst.collision_mask])

	# Find AnimationPlayer
	var anim_players = []
	_find_nodes_of_type(inst, "AnimationPlayer", anim_players)
	print("  AnimationPlayers found: %d" % anim_players.size())
	for ap in anim_players:
		var anims = ap.get_animation_list()
		print("    [%s] Animations (%d): %s" % [ap.name, anims.size(), str(anims)])

	# Find Areas (Hitboxes/Hurtboxes)
	var areas = []
	_find_nodes_of_type(inst, "Area3D", areas)
	print("  Area3Ds found: %d" % areas.size())
	for a in areas:
		print("    [%s] Layer: %d | Mask: %d | Monitoring: %s | Monitorable: %s" % [a.name, a.collision_layer, a.collision_mask, a.monitoring, a.monitorable])

	# Find Meshes & Materials
	var meshes = []
	_find_nodes_of_type(inst, "MeshInstance3D", meshes)
	print("  MeshInstance3Ds found: %d" % meshes.size())
	for m in meshes:
		var mesh_name = m.mesh.get_class() if m.mesh else "null"
		print("    [%s] Mesh: %s" % [m.name, mesh_name])

	# Find Skeletons
	var skeletons = []
	_find_nodes_of_type(inst, "Skeleton3D", skeletons)
	print("  Skeleton3Ds found: %d" % skeletons.size())
	for sk in skeletons:
		print("    [%s] Bone Count: %d" % [sk.name, sk.get_bone_count()])

	inst.free()

func _audit_gltf_animations(name: String, path: String) -> void:
	if not ResourceLoader.exists(path):
		print("  -> %s: Not found" % name)
		return
	var res = load(path)
	if not res:
		print("  -> %s: Failed to load" % name)
		return
	var inst = res.instantiate() if res is PackedScene else null
	if not inst:
		print("  -> %s: Not a PackedScene" % name)
		return
	var anim_players = []
	_find_nodes_of_type(inst, "AnimationPlayer", anim_players)
	print("  %s AnimationPlayers: %d" % [name, anim_players.size()])
	for ap in anim_players:
		var list = ap.get_animation_list()
		print("    Animations: %s" % str(list))
	inst.free()

func _find_nodes_of_type(root: Node, type_name: String, out_arr: Array) -> void:
	if root.is_class(type_name):
		out_arr.append(root)
	for c in root.get_children():
		_find_nodes_of_type(c, type_name, out_arr)
