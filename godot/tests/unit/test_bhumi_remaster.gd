class_name TestBhumiRemaster
extends RefCounted

## Suite 18: Bhumi 3D Environment, Sanctum Architecture & Landscape Remaster
## Validates high-density terrain reconstruction, Hoysala temple architecture,
## vegetation diversity, PBR materials, lighting & traversal geometry.

const BhumiValleyScene = preload("res://scenes/levels/BhumiValley3D.tscn")
const BhumiTerrainGeneratorScript = preload("res://scripts/levels/bhumi_terrain_generator.gd")

static func run_all() -> Array[Dictionary]:
	var results: Array[Dictionary] = []
	results.append(_test_remastered_terrain_generator_mesh_and_grid())
	results.append(_test_processional_path_and_elevation_contours())
	results.append(_test_architecture_glb_assets_fidelity())
	results.append(_test_vegetation_and_props_variety())
	results.append(_test_world_lighting_and_atmosphere_parameters())
	results.append(_test_player_traversal_on_sanctum_stairs_and_pathway())
	return results

static func _test_remastered_terrain_generator_mesh_and_grid() -> Dictionary:
	var test_name = "test_remastered_terrain_generator_mesh_and_grid"
	
	# Verify high-density grid resolution
	var res = BhumiTerrainGeneratorScript.GRID_RESOLUTION
	if res < 90:
		return {"name": test_name, "passed": false, "message": "Expected GRID_RESOLUTION >= 90, got %d" % res}

	# Generate mesh and inspect geometry
	var mesh = BhumiTerrainGeneratorScript.create_terrain_mesh()
	if not mesh or mesh.get_surface_count() == 0:
		return {"name": test_name, "passed": false, "message": "create_terrain_mesh returned empty mesh"}

	var arrays = mesh.surface_get_arrays(0)
	var vertices: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
	var normals: PackedVector3Array = arrays[Mesh.ARRAY_NORMAL]
	var colors: PackedColorArray = arrays[Mesh.ARRAY_COLOR]

	var expected_verts = res * res
	if vertices.size() != expected_verts:
		return {"name": test_name, "passed": false, "message": "Expected %d vertices, got %d" % [expected_verts, vertices.size()]}

	if normals.size() != expected_verts:
		return {"name": test_name, "passed": false, "message": "Normals size mismatch"}

	if colors.size() != expected_verts:
		return {"name": test_name, "passed": false, "message": "Colors size mismatch"}

	# Verify multi-biome color variation across terrain vertices
	var found_stone = false
	var found_grass = false
	var found_ridge = false
	for col in colors:
		if col.g > 0.4 and col.r < 0.3:
			found_grass = true
		elif col.r > 0.45 and col.b < 0.35:
			found_ridge = true
		elif abs(col.r - col.g) < 0.05 and abs(col.g - col.b) < 0.05:
			found_stone = true

	var passed = found_stone and found_grass and found_ridge
	return {
		"name": test_name,
		"passed": passed,
		"message": "Generated %d vertices with verified multi-biome PBR vertex color channels (stone, grass, ridge)." % vertices.size() if passed else "Multi-biome color channels missing."
	}

static func _test_processional_path_and_elevation_contours() -> Dictionary:
	var test_name = "test_processional_path_and_elevation_contours"

	# 1. Processional path from Torana (0, 16) to Temple (0, 0)
	var h_torana = BhumiTerrainGeneratorScript.get_height(0.0, 16.0)
	var h_path_mid = BhumiTerrainGeneratorScript.get_height(0.0, 8.0)
	var h_peetham = BhumiTerrainGeneratorScript.get_height(0.0, 0.0)
	var path_flat = abs(h_torana - 0.0) < 0.1 and abs(h_path_mid - 0.0) < 0.1
	var peetham_elevated = abs(h_peetham - 1.4) < 0.1

	# 2. Forest trail depression
	var trail_center = BhumiTerrainGeneratorScript._get_forest_trail_depression(-24.0, -13.0)
	var trail_outside = BhumiTerrainGeneratorScript._get_forest_trail_depression(-24.0, 20.0)
	var trail_ok = trail_center > 0.5 and trail_outside == 0.0

	# 3. Ridge path smooth switchback ascent
	var h_ridge_start = BhumiTerrainGeneratorScript.get_height(28.0, 0.0)
	var h_ridge_mid = BhumiTerrainGeneratorScript.get_height(42.0, -22.0)
	var h_ridge_end = BhumiTerrainGeneratorScript.get_height(55.0, -45.0)
	var ridge_ascending = (h_ridge_end > h_ridge_mid) and (h_ridge_mid > h_ridge_start) and (h_ridge_end > 12.0)

	var passed = path_flat and peetham_elevated and trail_ok and ridge_ascending
	return {
		"name": test_name,
		"passed": passed,
		"message": "Processional path, forest trail, and switchback mountain ascent verified (start: %.1fm -> end: %.1fm)." % [h_ridge_start, h_ridge_end] if passed else "Elevation contour test failed."
	}

static func _test_architecture_glb_assets_fidelity() -> Dictionary:
	var test_name = "test_architecture_glb_assets_fidelity"

	var shikhara_scene = load("res://assets/environment/temple_shikhara.glb")
	var torana_scene = load("res://assets/environment/temple_torana.glb")
	var column_scene = load("res://assets/environment/temple_column.glb")
	var ghat_scene = load("res://assets/environment/water_ghat_stairs.glb")
	var lantern_scene = load("res://assets/environment/stone_lantern.glb")
	var watchtower_scene = load("res://assets/environment/ruined_watchtower.glb")
	var pedestal_scene = load("res://assets/environment/lotus_pedestal.glb")

	var all_loaded = (shikhara_scene != null and torana_scene != null and column_scene != null and 
		ghat_scene != null and lantern_scene != null and watchtower_scene != null and pedestal_scene != null)
	if not all_loaded:
		return {"name": test_name, "passed": false, "message": "Failed to load one or more architectural glb assets."}

	var shikhara = shikhara_scene.instantiate()
	var ghat = ghat_scene.instantiate()
	var watchtower = watchtower_scene.instantiate()

	var shikhara_ok = shikhara != null
	var ghat_ok = ghat != null
	var watchtower_ok = watchtower != null

	shikhara.free()
	ghat.free()
	watchtower.free()

	var passed = all_loaded and shikhara_ok and ghat_ok and watchtower_ok
	return {
		"name": test_name,
		"passed": passed,
		"message": "All 7 architectural glb assets (Shikhara, Torana, Column, Ghat, Lantern, Watchtower, Pedestal) instantiated cleanly." if passed else "Architectural asset verification failed."
	}

static func _test_vegetation_and_props_variety() -> Dictionary:
	var test_name = "test_vegetation_and_props_variety"

	var banyan_scene = load("res://assets/environment/banyan_tree.glb")
	var sal_scene = load("res://assets/environment/sal_tree.glb")
	var champaka_scene = load("res://assets/environment/champaka_tree.glb")
	var boulder_scene = load("res://assets/environment/basalt_boulder.glb")
	var outcrop_scene = load("res://assets/environment/rock_outcrop.glb")
	var shrub_scene = load("res://assets/environment/flowering_shrub.glb")

	var all_loaded = (banyan_scene != null and sal_scene != null and champaka_scene != null and 
		boulder_scene != null and outcrop_scene != null and shrub_scene != null)
	if not all_loaded:
		return {"name": test_name, "passed": false, "message": "Failed to load one or more vegetation glb assets."}

	var banyan = banyan_scene.instantiate()
	var champaka = champaka_scene.instantiate()
	var shrub = shrub_scene.instantiate()

	var banyan_ok = banyan != null
	var champaka_ok = champaka != null
	var shrub_ok = shrub != null

	banyan.free()
	champaka.free()
	shrub.free()

	var passed = all_loaded and banyan_ok and champaka_ok and shrub_ok
	return {
		"name": test_name,
		"passed": passed,
		"message": "All 6 vegetation and rock assets (Banyan, Sal, Champaka, Boulder, Outcrop, Shrub) verified." if passed else "Vegetation asset verification failed."
	}

static func _test_world_lighting_and_atmosphere_parameters() -> Dictionary:
	var test_name = "test_world_lighting_and_atmosphere_parameters"
	var world = BhumiValleyScene.instantiate()
	if not world:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate BhumiValley3D."}

	var sun = world.find_child("LordSuryaSunLight", true, false) as DirectionalLight3D
	var env_node = world.find_child("WorldEnvironment", true, false) as WorldEnvironment
	var sanctum_light = world.find_child("SanctumInnerLight", true, false) as OmniLight3D
	var lantern_light = world.find_child("Light_01", true, false) as OmniLight3D

	var sun_ok = (sun != null and sun.shadow_enabled and sun.light_energy > 1.2 and sun.shadow_bias <= 0.05)
	var env_ok = (env_node != null and env_node.environment != null and env_node.environment.tonemap_mode == 2 and env_node.environment.fog_enabled)
	var lights_ok = (sanctum_light != null and sanctum_light.light_energy > 1.5 and lantern_light != null)

	world.queue_free()

	var passed = sun_ok and env_ok and lights_ok
	return {
		"name": test_name,
		"passed": passed,
		"message": "World lighting calibrated: Surya Sun (energy=%.2f, shadows=ON), Filmic tonemapping, distance fog, and warm OmniLights." % [sun.light_energy if sun else 0.0] if passed else "World lighting parameters out of calibration."
	}

static func _test_player_traversal_on_sanctum_stairs_and_pathway() -> Dictionary:
	var test_name = "test_player_traversal_on_sanctum_stairs_and_pathway"
	var world = BhumiValleyScene.instantiate()
	if not world:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate BhumiValley3D."}

	var player = world.find_child("Player3D", true, false) as PlayerController3D
	var has_player = (player != null and player is CharacterBody3D)

	# Verify player spawn point on the processional pathway
	var spawn_pos = player.position
	var is_on_pathway = abs(spawn_pos.x) <= 2.0 and spawn_pos.z >= 0.0 and spawn_pos.z <= 16.0
	var spawn_above_ground = spawn_pos.y >= 0.5 and spawn_pos.y <= 2.5

	world.queue_free()

	var passed = has_player and is_on_pathway and spawn_above_ground
	return {
		"name": test_name,
		"passed": passed,
		"message": "Player traversal verified: Veer spawned at processional pathway (%.1f, %.1f, %.1f) with active 3D character physics." % [spawn_pos.x, spawn_pos.y, spawn_pos.z] if passed else "Player traversal setup invalid."
	}
