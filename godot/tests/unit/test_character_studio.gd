class_name TestCharacterStudio
extends RefCounted

const CharacterStudioScript = preload("res://scripts/studio/character_studio_3d.gd")

static func run_all() -> Array[Dictionary]:
	var results: Array[Dictionary] = []
	results.append(_test_studio_scene_load_and_nodes())
	results.append(_test_studio_lighting_presets())
	results.append(_test_studio_animation_switching())
	return results

static func _test_studio_scene_load_and_nodes() -> Dictionary:
	var studio_scene = load("res://scenes/studio/CharacterStudio3D.tscn")
	if not studio_scene:
		return {"name": "test_studio_scene_load_and_nodes", "passed": false}

	var studio = studio_scene.instantiate()
	var has_pedestal = studio.has_node("Pedestal/VeerModel")
	var has_cam = studio.has_node("CameraPivot/SpringArm3D/Camera3D")
	var has_sun = studio.has_node("Lights/DirectionalLight3D")
	var has_ui = studio.has_node("UI/Panel")

	var passed = (has_pedestal and has_cam and has_sun and has_ui)
	studio.free()
	return {"name": "test_studio_scene_load_and_nodes", "passed": passed}

static func _test_studio_lighting_presets() -> Dictionary:
	var studio_scene = load("res://scenes/studio/CharacterStudio3D.tscn")
	var studio = studio_scene.instantiate()

	# Test Dawn Preset
	studio.apply_lighting_preset(CharacterStudioScript.LightPreset.SURYA_DAWN)
	var dawn_ok = (studio.current_preset == CharacterStudioScript.LightPreset.SURYA_DAWN and studio.sun_light.light_energy > 1.5)

	# Test Twilight Preset
	studio.apply_lighting_preset(CharacterStudioScript.LightPreset.TWILIGHT_TAPAS)
	var twilight_ok = (studio.current_preset == CharacterStudioScript.LightPreset.TWILIGHT_TAPAS and studio.rim_light.light_color.b > 0.8)

	# Test Forge Preset
	studio.apply_lighting_preset(CharacterStudioScript.LightPreset.AGNI_FORGE)
	var forge_ok = (studio.current_preset == CharacterStudioScript.LightPreset.AGNI_FORGE and studio.under_light.light_energy > 2.0)

	var passed = (dawn_ok and twilight_ok and forge_ok)
	studio.free()
	return {"name": "test_studio_lighting_presets", "passed": passed}

static func _test_studio_animation_switching() -> Dictionary:
	var studio_scene = load("res://scenes/studio/CharacterStudio3D.tscn")
	var studio = studio_scene.instantiate()

	studio.play_animation("idle")
	var ok_idle = (studio.anim_player != null and (studio.anim_player.current_animation.ends_with("idle") or studio.anim_player.current_animation == "idle"))

	studio.play_animation("walk")
	var ok_walk = (studio.anim_player != null and (studio.anim_player.current_animation.ends_with("walk") or studio.anim_player.current_animation == "walk"))

	studio.play_animation("attack_light_1")
	var ok_atk = (studio.anim_player != null and (studio.anim_player.current_animation.ends_with("attack_light_1") or studio.anim_player.current_animation == "attack_light_1"))

	var passed = (ok_idle and ok_walk and ok_atk)
	studio.free()
	return {"name": "test_studio_animation_switching", "passed": passed}
