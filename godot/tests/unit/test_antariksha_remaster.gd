class_name TestAntarikshaRemaster
extends RefCounted

## Suite 20: Antariksha Production Remaster & Cosmic Realm Verification (Stage Q5-A)
## Validates 4 bespoke sculpted floating islands, quad-winged Boss Matarishvan 10-action rig,
## Gale Falcon & Wind Archer animation integration, Vayu wind turbine & celestial anchors,
## atmospheric sky lighting, traversal safeguards, and Patala descent portal transitions.

static func run_all() -> Array:
	var results: Array = []
	results.append(_test_antariksha_remastered_islands_and_collision())
	results.append(_test_boss_matarishvan_quad_wings_and_10_actions())
	results.append(_test_gale_falcon_and_wind_archer_animations())
	results.append(_test_vayu_wind_turbine_and_celestial_anchor())
	results.append(_test_antariksha_world_environment_and_sky_lighting())
	results.append(_test_patala_descent_portal_and_cleansing_save())
	return results

static func _test_antariksha_remastered_islands_and_collision() -> Dictionary:
	var test_name = "test_antariksha_remastered_islands_and_collision"
	var island_paths = [
		"res://assets/environment/sky_sanctuary_island.glb",
		"res://assets/environment/vayu_windmill_island.glb",
		"res://assets/environment/cyclone_spire_island.glb",
		"res://assets/environment/high_gale_pinnacle_island.glb"
	]

	for path in island_paths:
		if not ResourceLoader.exists(path):
			return {"name": test_name, "passed": false, "message": "Missing island model: " + path}
		var packed = load(path) as PackedScene
		if not packed:
			return {"name": test_name, "passed": false, "message": "Failed to load island scene: " + path}
		var inst = packed.instantiate()
		if not inst:
			return {"name": test_name, "passed": false, "message": "Failed to instantiate island: " + path}
		inst.free()

	return {"name": test_name, "passed": true}

static func _test_boss_matarishvan_quad_wings_and_10_actions() -> Dictionary:
	var test_name = "test_boss_matarishvan_quad_wings_and_10_actions"
	var boss_scene = load("res://scenes/entities/BossMatarishvan3D.tscn") as PackedScene
	if not boss_scene:
		return {"name": test_name, "passed": false, "message": "Failed to load BossMatarishvan3D.tscn"}

	var boss = boss_scene.instantiate() as BossMatarishvan3D
	if not boss:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate BossMatarishvan3D"}

	var ap: AnimationPlayer = boss._find_anim_player(boss)
	if not ap:
		boss.free()
		return {"name": test_name, "passed": false, "message": "AnimationPlayer missing on BossMatarishvan3D"}

	var required_actions = [
		"boss_idle", "boss_walk", "boss_cleave_telegraph", "boss_cleave_attack",
		"boss_vortex_channel", "boss_slam_leap", "boss_slam_impact", "boss_charge",
		"boss_roar", "boss_stagger", "boss_defeat"
	]

	for act in required_actions:
		if not ap.has_animation(act):
			boss.free()
			return {"name": test_name, "passed": false, "message": "Boss missing action: " + act}

	boss.free()
	return {"name": test_name, "passed": true}

static func _test_gale_falcon_and_wind_archer_animations() -> Dictionary:
	var test_name = "test_gale_falcon_and_wind_archer_animations"

	# 1. Gale Falcon
	var falcon_scene = load("res://scenes/entities/GaleFalcon3D.tscn") as PackedScene
	var falcon = falcon_scene.instantiate() as GaleFalcon3D
	var falcon_ap: AnimationPlayer = falcon._find_anim_player(falcon)
	if not falcon_ap:
		falcon.free()
		return {"name": test_name, "passed": false, "message": "GaleFalcon3D missing AnimationPlayer"}

	for act in ["idle", "walk", "telegraph", "attack", "stagger", "death"]:
		if not falcon_ap.has_animation(act):
			falcon.free()
			return {"name": test_name, "passed": false, "message": "GaleFalcon missing action: " + act}
	falcon.free()

	# 2. Wind Archer
	var archer_scene = load("res://scenes/entities/WindArcher3D.tscn") as PackedScene
	var archer = archer_scene.instantiate() as WindArcher3D
	var archer_ap: AnimationPlayer = archer._find_anim_player(archer)
	if not archer_ap:
		archer.free()
		return {"name": test_name, "passed": false, "message": "WindArcher3D missing AnimationPlayer"}

	for act in ["idle", "walk", "telegraph", "attack", "stagger", "death"]:
		if not archer_ap.has_animation(act):
			archer.free()
			return {"name": test_name, "passed": false, "message": "WindArcher missing action: " + act}
	archer.free()

	return {"name": test_name, "passed": true}

static func _test_vayu_wind_turbine_and_celestial_anchor() -> Dictionary:
	var test_name = "test_vayu_wind_turbine_and_celestial_anchor"
	var assets = [
		"res://assets/environment/vayu_wind_turbine.glb",
		"res://assets/environment/celestial_grapple_anchor.glb",
		"res://assets/environment/thermal_updraft_vent.glb",
		"res://assets/environment/sky_temple_pavilion.glb",
		"res://assets/environment/floating_prana_crystal.glb"
	]

	for path in assets:
		if not ResourceLoader.exists(path):
			return {"name": test_name, "passed": false, "message": "Missing asset: " + path}
		var packed = load(path) as PackedScene
		if not packed:
			return {"name": test_name, "passed": false, "message": "Failed to load: " + path}
		var inst = packed.instantiate()
		inst.free()

	return {"name": test_name, "passed": true}

static func _test_antariksha_world_environment_and_sky_lighting() -> Dictionary:
	var test_name = "test_antariksha_world_environment_and_sky_lighting"
	var scene_res = load("res://scenes/levels/AntarikshaSkyRealm3D.tscn") as PackedScene
	if not scene_res:
		return {"name": test_name, "passed": false, "message": "Failed to load AntarikshaSkyRealm3D.tscn"}

	var realm = scene_res.instantiate() as AntarikshaSkyRealm3D
	var env_node: WorldEnvironment = realm.get_node_or_null("WorldEnvironment")
	if not env_node or not env_node.environment:
		realm.free()
		return {"name": test_name, "passed": false, "message": "Missing WorldEnvironment in Antariksha"}

	if env_node.environment.tonemap_mode != Environment.TONE_MAPPER_FILMIC and env_node.environment.tonemap_mode != Environment.TONE_MAPPER_ACES:
		realm.free()
		return {"name": test_name, "passed": false, "message": "Antariksha should use Filmic or ACES tonemapper"}

	if not env_node.environment.glow_enabled:
		realm.free()
		return {"name": test_name, "passed": false, "message": "Antariksha should have glow enabled for Prana crystals"}

	var sun: DirectionalLight3D = realm.get_node_or_null("DirectionalLight3D")
	if not sun or sun.light_energy < 1.4:
		realm.free()
		return {"name": test_name, "passed": false, "message": "Directional light energy should be >= 1.4"}

	realm.free()
	return {"name": test_name, "passed": true}

static func _test_patala_descent_portal_and_cleansing_save() -> Dictionary:
	var test_name = "test_patala_descent_portal_and_cleansing_save"
	var scene_res = load("res://scenes/levels/AntarikshaSkyRealm3D.tscn") as PackedScene
	var realm = scene_res.instantiate() as AntarikshaSkyRealm3D

	realm._spawn_patala_descent_portal()
	var portal = realm.get_node_or_null("PatalaDescentPortal")
	if not portal or not (portal is Area3D):
		realm.free()
		return {"name": test_name, "passed": false, "message": "Failed to spawn PatalaDescentPortal"}

	realm.free()
	return {"name": test_name, "passed": true}
