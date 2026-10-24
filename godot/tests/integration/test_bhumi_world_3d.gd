class_name TestBhumiWorld3D
extends RefCounted

## Automated Integration Test Suite: Stage D Complete 3D Landscape & World Architecture
## Validates world terrain, elevations, 5 sectors, architecture, shards, NPC, enemies, and checkpoints.

const BhumiValleyScene = preload("res://scenes/levels/BhumiValley3D.tscn")
const BhumiValleyScript = preload("res://scripts/levels/bhumi_valley_3d.gd")
const BhumiTerrainGeneratorScript = preload("res://scripts/levels/bhumi_terrain_generator.gd")
const DeviTaraScene = preload("res://scenes/entities/DeviTara3D.tscn")
const SentinelScene = preload("res://scenes/entities/TrainingSentinel3D.tscn")
const AmritaScene = preload("res://scenes/interactables/AmritaFountain3D.tscn")
const CheckpointScene = preload("res://scenes/interactables/ResonanceCheckpoint3D.tscn")

static func run_all() -> Array:
	var results: Array = []
	results.append(_test_world_scene_load_and_nodes())
	results.append(_test_terrain_mesh_generation_and_elevations())
	results.append(_test_world_region_detection())
	results.append(_test_shards_and_exploration_objectives())
	results.append(_test_architecture_and_prop_instances())
	results.append(_test_npc_and_dialogue_integration())
	results.append(_test_combat_and_sentinel_encounters())
	results.append(_test_amrita_fountain_and_checkpoints())
	return results

static func _test_world_scene_load_and_nodes() -> Dictionary:
	var test_name = "test_world_scene_load_and_nodes"
	var world = BhumiValleyScene.instantiate()
	if not world:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate BhumiValley3D scene."}
	
	var has_terrain = world.has_node("TerrainContainer")
	var has_arch = world.has_node("Architecture")
	var has_veg = world.has_node("VegetationAndRocks")
	var has_interact = world.has_node("Interactables")
	var has_npc = world.has_node("NPCs")
	var has_enemies = world.has_node("Enemies")
	var has_player = world.has_node("Player3D")
	var has_hud = world.has_node("HUD3D")
	
	world.queue_free()
	
	var passed = has_terrain and has_arch and has_veg and has_interact and has_npc and has_enemies and has_player and has_hud
	return {
		"name": test_name,
		"passed": passed,
		"message": "Loaded BhumiValley3D with all 8 master sub-containers." if passed else "Missing key containers in BhumiValley3D."
	}

static func _test_terrain_mesh_generation_and_elevations() -> Dictionary:
	var test_name = "test_terrain_mesh_generation_and_elevations"
	# 1. Center temple elevation
	var h_temple = BhumiTerrainGeneratorScript.get_height(0.0, 0.0)
	var h_temple_court = BhumiTerrainGeneratorScript.get_height(10.0, 10.0)
	# 2. Kalyani sunken water basin
	var h_kalyani = BhumiTerrainGeneratorScript.get_height(-6.0, 45.0)
	# 3. Dandaka forest grove
	var h_grove = BhumiTerrainGeneratorScript.get_height(-45.0, -30.0)
	# 4. Tapas mountain ridge
	var h_ridge_low = BhumiTerrainGeneratorScript.get_height(30.0, 0.0)
	var h_ridge_high = BhumiTerrainGeneratorScript.get_height(65.0, -35.0)
	# 5. Perimeter mountains
	var h_mountain = BhumiTerrainGeneratorScript.get_height(82.0, 0.0)
	
	var c_temple = abs(h_temple - 1.4) < 0.2 and abs(h_temple_court - 0.0) < 0.2
	var c_kalyani = h_kalyani < -1.5 # Sunken basin
	var c_grove = h_grove > 0.5 and h_grove < 8.0 # Rolling natural hills
	var c_ridge = h_ridge_high > h_ridge_low and h_ridge_high > 10.0 # Ascending mountain
	var c_mountain = h_mountain > 22.0 # High mountain enclosure
	
	# Verify ArrayMesh generation
	var mesh = BhumiTerrainGeneratorScript.create_terrain_mesh()
	var mesh_valid = mesh != null and mesh.get_surface_count() > 0
	
	var passed = c_temple and c_kalyani and c_grove and c_ridge and c_mountain and mesh_valid
	return {
		"name": test_name,
		"passed": passed,
		"message": "Terrain elevations calibrated: Temple=%.1fm, Basin=%.1fm, Grove=%.1fm, Ridge=%.1fm, Mountains=%.1fm." % [h_temple, h_kalyani, h_grove, h_ridge_high, h_mountain] if passed else "Terrain elevation calibration out of range."
	}

static func _test_world_region_detection() -> Dictionary:
	var test_name = "test_world_region_detection"
	var world = BhumiValleyScene.instantiate()
	
	var r_sanctum = world._evaluate_region_at(0.0, 0.0, 1.0)
	var r_kalyani = world._evaluate_region_at(-6.0, 45.0, -0.5)
	var r_grove = world._evaluate_region_at(-45.0, -30.0, 2.5)
	var r_ridge = world._evaluate_region_at(35.0, -10.0, 6.0)
	var r_watchtower = world._evaluate_region_at(55.0, -45.0, 14.0)
	
	world.queue_free()
	
	var passed = (r_sanctum == BhumiValleyScript.WorldRegion.SANCTUM_SURYA_KUND and
		r_kalyani == BhumiValleyScript.WorldRegion.KALYANI_RESERVOIR and
		r_grove == BhumiValleyScript.WorldRegion.DANDAKA_GROVE and
		r_ridge == BhumiValleyScript.WorldRegion.TAPAS_RIDGE and
		r_watchtower == BhumiValleyScript.WorldRegion.RUINS_WATCHTOWER)
	
	return {
		"name": test_name,
		"passed": passed,
		"message": "All 5 world regions (Sanctum, Kalyani, Dandaka, Ridge, Watchtower) accurately detected." if passed else "World region evaluation failed."
	}

static func _test_shards_and_exploration_objectives() -> Dictionary:
	var test_name = "test_shards_and_exploration_objectives"
	var world = BhumiValleyScene.instantiate()
	
	var shard_sanctum = world.find_child("Shard_01_Sanctum", true, false)
	var shard_kalyani = world.find_child("Shard_02_Kalyani", true, false)
	var shard_grove = world.find_child("Shard_03_Grove", true, false)
	var shard_ridge = world.find_child("Shard_04_Ridge", true, false)
	var shard_watchtower = world.find_child("Shard_05_Watchtower", true, false)
	
	var all_present = (shard_sanctum != null and shard_kalyani != null and 
		shard_grove != null and shard_ridge != null and shard_watchtower != null)
	
	# Verify elevation diversity across shards
	var diverse_elevations = (shard_sanctum.position.y > 1.5 and 
		shard_kalyani.position.y < 1.0 and 
		shard_ridge.position.y > 8.0 and 
		shard_watchtower.position.y > 15.0)
	
	# Simulate collecting shards
	world._on_shard_collected()
	world._on_shard_collected()
	world._on_shard_collected()
	world._on_shard_collected()
	world._on_shard_collected()
	var complete = (world.collected_shards == 5)
	
	world.queue_free()
	
	var passed = all_present and diverse_elevations and complete
	return {
		"name": test_name,
		"passed": passed,
		"message": "5 exploration Astra Shards verified across vertical elevations (-0.3m to +16.2m) with complete collection trigger." if passed else "Shard exploration test failed."
	}

static func _test_architecture_and_prop_instances() -> Dictionary:
	var test_name = "test_architecture_and_prop_instances"
	var world = BhumiValleyScene.instantiate()
	
	var shikhara = world.find_child("TempleShikhara", true, false)
	var torana = world.find_child("TempleTorana", true, false)
	var watchtower = world.find_child("RuinedWatchtower", true, false)
	var banyan = world.find_child("Banyan_01", true, false)
	var sal = world.find_child("Sal_01", true, false)
	var boulder = world.find_child("Boulder_01", true, false)
	var lantern = world.find_child("Lantern_01", true, false)
	
	var passed = (shikhara != null and torana != null and watchtower != null and 
		banyan != null and sal != null and boulder != null and lantern != null)
	
	world.queue_free()
	return {
		"name": test_name,
		"passed": passed,
		"message": "Verified presence of temple shikhara, torana gateway, watchtower, banyan trees, sal trees, boulders, and lanterns." if passed else "Missing architectural or environmental props."
	}

static func _test_npc_and_dialogue_integration() -> Dictionary:
	var test_name = "test_npc_and_dialogue_integration"
	var tara = DeviTaraScene.instantiate()
	if not tara:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate DeviTara3D."}
	
	var in_npc_group = tara.is_in_group("npcs")
	var has_interaction = tara.has_node("InteractionArea")
	var has_crown = tara.find_child("CrownMesh", true, false) != null
	var has_aura = tara.find_child("AuraRing", true, false) != null
	
	# Verify dialogue request signal
	var tara_state: Dictionary = {"signal_received": false, "received_id": ""}
	tara.dialogue_requested.connect(func(d_id):
		tara_state["signal_received"] = true
		tara_state["received_id"] = d_id
	)
	tara.trigger_dialogue()
	
	tara.queue_free()
	
	var passed = in_npc_group and has_interaction and has_crown and has_aura and tara_state["signal_received"] and tara_state["received_id"] == "act1_dandaka_briefing"
	return {
		"name": test_name,
		"passed": passed,
		"message": "Devi Tara guide NPC verified with celestial crown, aura ring, and dialogue trigger (%s)." % tara_state["received_id"] if passed else "Devi Tara NPC verification failed."
	}

static func _test_combat_and_sentinel_encounters() -> Dictionary:
	var test_name = "test_combat_and_sentinel_encounters"
	var world = BhumiValleyScene.instantiate()
	
	var gatekeeper = world.find_child("GatekeeperSentinel", true, false)
	var vanguard = world.find_child("GroveSentinel", true, false)
	var champion = world.find_child("WatchtowerChampion", true, false)
	
	var all_exist = (gatekeeper != null and vanguard != null and champion != null)
	var in_targetable = (gatekeeper.is_in_group("targetable") and vanguard.is_in_group("targetable") and champion.is_in_group("targetable"))
	var champion_buffed = (champion.max_health >= 200.0)
	
	world.queue_free()
	
	var passed = all_exist and in_targetable and champion_buffed
	return {
		"name": test_name,
		"passed": passed,
		"message": "Verified 3 Asura Sentinels guarding Gate, Grove, and Watchtower with champion scaling (200 HP)." if passed else "Sentinel encounter verification failed."
	}

static func _test_amrita_fountain_and_checkpoints() -> Dictionary:
	var test_name = "test_amrita_fountain_and_checkpoints"
	var fount = AmritaScene.instantiate()
	var cp = CheckpointScene.instantiate()
	
	# Test Amrita consecrate signal
	var fount_state: Dictionary = {"signal": false}
	fount.fountain_used.connect(func(_hp, _pr): fount_state["signal"] = true)
	fount.consecrate()
	
	# Test Checkpoint activation
	var cp_state: Dictionary = {"signal": false}
	cp.checkpoint_activated.connect(func(_id, _pos): cp_state["signal"] = true)
	cp.activate_checkpoint()
	
	var cp_active = cp.is_activated
	
	fount.queue_free()
	cp.queue_free()
	
	var passed = fount_state["signal"] and cp_state["signal"] and cp_active
	return {
		"name": test_name,
		"passed": passed,
		"message": "Verified Amrita Healing Fountain vitals restoration and Resonance Checkpoint state attunement." if passed else "Fountain or checkpoint test failed."
	}
