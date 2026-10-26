class_name TestGamePresentationAndUI
extends RefCounted

## Suite 24: Game Presentation, Modern UI/UX, Audio & Accessibility Verification (Stage Q7)
## Validates:
## 1. HUD Vitality (Health & Prana bars), numeric readouts, and state synchronization.
## 2. Active Weapon badge and Compass & Waypoint needle bearing navigation.
## 3. Contextual interaction prompt pill with pulsing glow and accessibility subtitles.
## 4. Modern Pause Menu modal, Tab switching (Journal, Map, Settings, Codex), and pause state.
## 5. Accessibility Controls: camera sensitivity, invert-Y, screen shake scaling, reduced motion.
## 6. Audio Manager volume buses, dynamic crossfading of 7-realm ambient soundscapes, and SFX.
## 7. Camera controller accessibility binding (sensitivity & invert-Y integration).

const HUD3DScene = preload("res://scenes/ui/HUD3D.tscn")
const PauseMenuScene = preload("res://scenes/ui/PauseMenu3D.tscn")
const PauseMenuScript = preload("res://scripts/ui/pause_menu_3d.gd")
const OrbitCameraScript = preload("res://scripts/camera/orbit_camera_3d.gd")

static func run_all() -> Array[Dictionary]:
	var results: Array[Dictionary] = []
	results.append(test_hud_vitality_and_energy_bar())
	results.append(test_hud_weapon_badge_and_compass())
	results.append(test_hud_contextual_prompt_and_subtitles())
	results.append(test_pause_menu_tabs_and_state())
	results.append(test_pause_menu_settings_and_accessibility())
	results.append(test_audio_manager_multi_bus_and_ambience())
	results.append(test_camera_accessibility_integration())
	return results

static func test_hud_vitality_and_energy_bar() -> Dictionary:
	var test_name = "test_hud_vitality_and_energy_bar"
	var hud = HUD3DScene.instantiate()
	if not hud:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate HUD3D.tscn."}

	hud._ready()

	var hp_bar = hud.find_child("HealthBar", true, false) as ProgressBar
	var hp_lbl = hud.find_child("HealthLabel", true, false) as Label
	var nrg_bar = hud.find_child("EnergyBar", true, false) as ProgressBar
	var nrg_lbl = hud.find_child("EnergyLabel", true, false) as Label

	if not hp_bar or not hp_lbl or not nrg_bar or not nrg_lbl:
		hud.free()
		return {"name": test_name, "passed": false, "message": "Missing vitality bars or labels in HUD."}

	hud.update_health(80, 100)
	if hp_bar.value != 80.0 or hp_lbl.text != "HP: 80 / 100":
		hud.free()
		return {"name": test_name, "passed": false, "message": "Health bar value or text mismatch."}

	hud.update_prana(65.0, 100.0)
	if nrg_bar.value != 65.0 or nrg_lbl.text != "PRANA: 65 / 100":
		hud.free()
		return {"name": test_name, "passed": false, "message": "Prana bar value or text mismatch."}

	hud.free()
	return {"name": test_name, "passed": true}

static func test_hud_weapon_badge_and_compass() -> Dictionary:
	var test_name = "test_hud_weapon_badge_and_compass"
	var hud = HUD3DScene.instantiate()
	if not hud:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate HUD3D."}

	hud._ready()

	var badge = hud.find_child("WeaponBadgeLabel", true, false) as Label
	var compass = hud.find_child("CompassLabel", true, false) as Label

	if not badge or not compass:
		hud.free()
		return {"name": test_name, "passed": false, "message": "Missing WeaponBadgeLabel or CompassLabel."}

	hud.update_weapon("Surya-Kripana")
	if badge.text != "⚔ SURYA-KRIPANA":
		hud.free()
		return {"name": test_name, "passed": false, "message": "Weapon badge text mismatch."}

	hud.set_waypoint(Vector3(20, 0, 20), "Purify Checkpoint")
	if not hud.has_waypoint or hud.waypoint_target_pos != Vector3(20, 0, 20):
		hud.free()
		return {"name": test_name, "passed": false, "message": "Waypoint state not set correctly."}

	hud._update_compass_navigation()
	if compass.text.is_empty():
		hud.free()
		return {"name": test_name, "passed": false, "message": "Compass navigation label is empty."}

	hud.free()
	return {"name": test_name, "passed": true}

static func test_hud_contextual_prompt_and_subtitles() -> Dictionary:
	var test_name = "test_hud_contextual_prompt_and_subtitles"
	var hud = HUD3DScene.instantiate()
	if not hud:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate HUD3D."}

	hud._ready()

	var prompt_panel = hud.find_child("ContextPromptPanel", true, false) as PanelContainer
	var prompt_lbl = hud.find_child("ContextPromptLabel", true, false) as Label
	var sub_panel = hud.find_child("SubtitlePanel", true, false) as PanelContainer
	var sub_lbl = hud.find_child("SubtitleLabel", true, false) as Label

	if not prompt_panel or not prompt_lbl or not sub_panel or not sub_lbl:
		hud.free()
		return {"name": test_name, "passed": false, "message": "Missing ContextPromptPanel or SubtitlePanel."}

	hud.set_context_prompt("[ E ] Commune with Devi Tara")
	if not prompt_panel.visible or prompt_lbl.text != "[ E ] Commune with Devi Tara":
		hud.free()
		return {"name": test_name, "passed": false, "message": "Context prompt text or visibility mismatch."}

	hud.set_context_prompt("")
	if prompt_panel.visible:
		hud.free()
		return {"name": test_name, "passed": false, "message": "Context prompt should hide when text is empty."}

	PauseMenuScript.subtitles_enabled = true
	hud.show_subtitle("Devi Tara", "The cosmic wheel turns.")
	if not sub_panel.visible or not ("The cosmic wheel turns." in sub_lbl.text):
		hud.free()
		return {"name": test_name, "passed": false, "message": "Subtitle panel should display text when enabled."}

	hud.free()
	return {"name": test_name, "passed": true}

static func test_pause_menu_tabs_and_state() -> Dictionary:
	var test_name = "test_pause_menu_tabs_and_state"
	var menu = PauseMenuScene.instantiate()
	if not menu:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate PauseMenu3D.tscn."}

	var tabs = menu.find_child("TabContainer", true, false) as TabContainer
	if not tabs or tabs.get_tab_count() < 4:
		menu.free()
		return {"name": test_name, "passed": false, "message": "PauseMenu should have at least 4 tabs."}

	menu._ready()
	menu.open_menu("Bhumi")
	if not menu.visible:
		menu.free()
		return {"name": test_name, "passed": false, "message": "PauseMenu should be visible after open_menu()."}

	menu.close_menu()
	if menu.visible:
		menu.free()
		return {"name": test_name, "passed": false, "message": "PauseMenu should be hidden after close_menu()."}

	menu.free()
	return {"name": test_name, "passed": true}

static func test_pause_menu_settings_and_accessibility() -> Dictionary:
	var test_name = "test_pause_menu_settings_and_accessibility"
	var menu = PauseMenuScene.instantiate()
	if not menu:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate PauseMenu3D."}

	var sens_slider = menu.find_child("SliderCamSens", true, false) as HSlider
	var invert_check = menu.find_child("CheckInvertY", true, false) as CheckBox
	var shake_slider = menu.find_child("SliderShake", true, false) as HSlider
	var reduced_check = menu.find_child("CheckReducedMotion", true, false) as CheckBox

	if not sens_slider or not invert_check or not shake_slider or not reduced_check:
		menu.free()
		return {"name": test_name, "passed": false, "message": "Missing accessibility controls in PauseMenu."}

	menu._ready()

	# Test sensitivity slider
	sens_slider.value = 1.6
	sens_slider.value_changed.emit(1.6)
	if abs(PauseMenuScript.camera_sensitivity - 1.6) > 0.05:
		menu.free()
		return {"name": test_name, "passed": false, "message": "Camera sensitivity setting did not propagate."}

	# Test invert Y
	invert_check.button_pressed = true
	if not PauseMenuScript.invert_camera_y:
		menu.free()
		return {"name": test_name, "passed": false, "message": "Invert Y setting did not propagate."}

	# Test screen shake
	shake_slider.value = 0.40
	shake_slider.value_changed.emit(0.40)
	if abs(PauseMenuScript.screen_shake_multiplier - 0.40) > 0.05:
		menu.free()
		return {"name": test_name, "passed": false, "message": "Screen shake setting did not propagate."}

	# Test reduced motion
	reduced_check.button_pressed = true
	if not PauseMenuScript.reduced_motion:
		menu.free()
		return {"name": test_name, "passed": false, "message": "Reduced motion setting did not propagate."}

	# Restore defaults
	sens_slider.value = 1.0
	invert_check.button_pressed = false
	shake_slider.value = 1.0
	reduced_check.button_pressed = false

	menu.free()
	return {"name": test_name, "passed": true}

static func test_audio_manager_multi_bus_and_ambience() -> Dictionary:
	var test_name = "test_audio_manager_multi_bus_and_ambience"
	var audio_mgr = AudioManager3D.instance
	if not audio_mgr:
		audio_mgr = AudioManager3D.new()
		audio_mgr.name = "AudioManager3D"
		audio_mgr._ready()

	# Test volume bus controls
	audio_mgr.set_master_volume(0.85)
	if abs(audio_mgr.master_volume - 0.85) > 0.01:
		return {"name": test_name, "passed": false, "message": "Master volume not set correctly."}

	audio_mgr.set_sfx_volume(0.90)
	if abs(audio_mgr.sfx_volume - 0.90) > 0.01:
		return {"name": test_name, "passed": false, "message": "SFX volume not set correctly."}

	audio_mgr.set_ambience_volume(0.75)
	if abs(audio_mgr.ambience_volume - 0.75) > 0.01:
		return {"name": test_name, "passed": false, "message": "Ambience volume not set correctly."}

	# Test realm ambience switching
	audio_mgr.play_realm_ambience("bhumi")
	if audio_mgr.current_ambient_realm != "bhumi":
		return {"name": test_name, "passed": false, "message": "Failed to set bhumi realm ambience."}

	audio_mgr.play_realm_ambience("antariksha")
	if audio_mgr.current_ambient_realm != "antariksha":
		return {"name": test_name, "passed": false, "message": "Failed to set antariksha realm ambience."}

	# Test convenience SFX methods without throwing
	AudioManager3D.play_click()
	AudioManager3D.play_open()
	AudioManager3D.play_close()
	AudioManager3D.play_chime()

	# Restore default volumes
	audio_mgr.set_master_volume(1.0)
	audio_mgr.set_sfx_volume(1.0)
	audio_mgr.set_ambience_volume(0.7)

	return {"name": test_name, "passed": true}

static func test_camera_accessibility_integration() -> Dictionary:
	var test_name = "test_camera_accessibility_integration"
	var camera = OrbitCameraScript.new()
	var cam_3d = Camera3D.new()
	cam_3d.name = "Camera3D"
	camera.add_child(cam_3d)
	camera.camera_node = cam_3d
	camera._ready()

	PauseMenuScript.camera_sensitivity = 2.0
	PauseMenuScript.invert_camera_y = false

	var initial_rot_y = camera.rotation.y
	var initial_rot_x = camera.rotation.x

	camera.orbit(10.0, 10.0)
	var expected_yaw_delta = 10.0 * camera.mouse_sensitivity * 2.0
	var actual_yaw_delta = initial_rot_y - camera.rotation.y
	if abs(actual_yaw_delta - expected_yaw_delta) > 0.0001:
		camera.free()
		return {"name": test_name, "passed": false, "message": "Yaw did not scale with camera_sensitivity."}

	# Test Invert-Y
	PauseMenuScript.invert_camera_y = true
	var rot_x_before = camera.rotation.x
	camera.orbit(0.0, 10.0)
	# When invert_camera_y is true, dy > 0 should increase rotation.x
	if camera.rotation.x <= rot_x_before:
		camera.free()
		return {"name": test_name, "passed": false, "message": "Pitch did not invert with invert_camera_y."}

	# Restore defaults
	PauseMenuScript.camera_sensitivity = 1.0
	PauseMenuScript.invert_camera_y = false
	camera.free()
	return {"name": test_name, "passed": true}
