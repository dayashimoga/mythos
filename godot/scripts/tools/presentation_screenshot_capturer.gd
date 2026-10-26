extends SceneTree

## Stage Q7 Complete Game Presentation, UI/UX & Audiovisual Polish Screenshot Capturer
## Captures 10 high-definition in-engine validation screenshots:
## 1. 01_hud_vitals_energy_compass_presentation.png
## 2. 02_contextual_interaction_prompt_glow.png
## 3. 03_pause_modal_quest_journal_overview.png
## 4. 04_pause_modal_realm_map_selection.png
## 5. 05_pause_modal_settings_and_accessibility.png
## 6. 06_pause_modal_sacred_codex_dossier.png
## 7. 07_boss_encounter_health_and_target_lock.png
## 8. 08_dialogue_typographic_presentation.png
## 9. 09_collapsible_dev_drawer_presentation.png
## 10. 10_victory_consecration_presentation.png

const OUT_DIR = "res://../screenshots/presentation_q7/"
const BRAIN_DIR = "C:/Users/dayan/.gemini/antigravity-ide/brain/ebde482a-7463-4886-8fc0-62ef0783fc6e/"

const PauseMenuScript = preload("res://scripts/ui/pause_menu_3d.gd")

var bhumi_scene: Node = null
var hud: HUD3D = null
var player: PlayerController3D = null
var pause_menu: Control = null

func _init() -> void:
	call_deferred("_run_presentation_captures")

func _run_presentation_captures() -> void:
	print("================================================================")
	print("  STARTING STAGE Q7 GAME PRESENTATION & UI SCREENSHOT TOUR      ")
	print("================================================================")

	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(OUT_DIR))
	DirAccess.make_dir_recursive_absolute(BRAIN_DIR)

	# Instantiate Bhumi Realm
	bhumi_scene = load("res://scenes/levels/BhumiValley3D.tscn").instantiate()
	root.add_child(bhumi_scene)

	hud = bhumi_scene.find_child("HUD3D", true, false) as HUD3D
	player = bhumi_scene.find_child("Player3D", true, false) as PlayerController3D
	if hud:
		pause_menu = hud.find_child("PauseMenu", true, false) as Control

	# Hide any cinematic cutscene bars that may trigger automatically
	var cine = bhumi_scene.find_child("CinematicDirector3D", true, false)
	if cine and cine.has_method("stop_cinematic"):
		cine.stop_cinematic()

	# Warmup frames
	for f in range(30):
		await process_frame

	var capture = func(stem: String, label: String):
		await RenderingServer.frame_post_draw
		var img = root.get_viewport().get_texture().get_image()
		var out_path = ProjectSettings.globalize_path(OUT_DIR + stem + ".png")
		var brain_path = BRAIN_DIR + stem + ".png"
		img.save_png(out_path)
		img.save_png(brain_path)
		print("  -> Saved %s (%s)" % [stem, label])

	# -------------------------------------------------------------------------
	# 1. Compact HUD Vitals, Energy Bar & Compass Heading
	# -------------------------------------------------------------------------
	print("\n--- Shot 1: HUD Vitals, Energy Bar & Compass Heading ---")
	if hud:
		hud.visible = true
		hud.update_health(95, 100)
		hud.update_prana(88.0, 100.0)
		hud.update_weapon("Surya-Kripana")
		hud.update_shards(2, 5)
		hud.update_objective("Recover 5 Astra Shards & Purify the Sanctum")
		hud.set_waypoint(Vector3(12.0, 1.0, 24.0), "Sanctum Altar")
		hud.set_context_prompt("")
		if pause_menu: pause_menu.visible = false

	if player:
		player.global_position = Vector3(0.0, 1.2, 8.0)
		if player.visual_root:
			player.visual_root.rotation.y = 0.0

	for f in range(15):
		await process_frame

	await capture.call("01_hud_vitals_energy_compass_presentation", "Compact HUD with health, prana energy, weapon badge, and compass navigation")

	# -------------------------------------------------------------------------
	# 2. Contextual Interaction Prompt Pill with Glow
	# -------------------------------------------------------------------------
	print("\n--- Shot 2: Contextual Interaction Prompt Glow ---")
	var tara = bhumi_scene.find_child("DeviTara3D", true, false)
	if tara and player:
		tara.global_position = Vector3(0.0, 1.0, 2.0)
		player.global_position = Vector3(0.0, 1.0, 4.2)
		if player.visual_root:
			player.visual_root.rotation.y = PI

	if hud:
		hud.set_context_prompt("[ E ] Commune with Devi Tara")

	for f in range(15):
		await process_frame

	await capture.call("02_contextual_interaction_prompt_glow", "Contextual interaction prompt pill with breathing glow near Devi Tara")

	# -------------------------------------------------------------------------
	# 3. Pause Modal — Tab 1: Quest Journal Overview
	# -------------------------------------------------------------------------
	print("\n--- Shot 3: Pause Modal Quest Journal Overview ---")
	if hud:
		hud.set_context_prompt("")
	if pause_menu:
		pause_menu.open_menu("Bhumi", bhumi_scene.quest_mgr if "quest_mgr" in bhumi_scene else null)
		var tabs = pause_menu.find_child("TabContainer", true, false) as TabContainer
		if tabs:
			tabs.current_tab = 0

	for f in range(15):
		await process_frame

	await capture.call("03_pause_modal_quest_journal_overview", "Pause Modal Tab 1 with comprehensive campaign Quest Journal and objective checklist")

	# -------------------------------------------------------------------------
	# 4. Pause Modal — Tab 2: Seven-Realm Fast-Travel Map
	# -------------------------------------------------------------------------
	print("\n--- Shot 4: Pause Modal Seven-Realm Map Selection ---")
	if pause_menu:
		var tabs = pause_menu.find_child("TabContainer", true, false) as TabContainer
		if tabs:
			tabs.current_tab = 1

	for f in range(15):
		await process_frame

	await capture.call("04_pause_modal_realm_map_selection", "Pause Modal Tab 2 with interactive Seven-Realm fast travel map and progression status")

	# -------------------------------------------------------------------------
	# 5. Pause Modal — Tab 3: Settings & Accessibility Suite
	# -------------------------------------------------------------------------
	print("\n--- Shot 5: Pause Modal Settings & Accessibility Suite ---")
	if pause_menu:
		var tabs = pause_menu.find_child("TabContainer", true, false) as TabContainer
		if tabs:
			tabs.current_tab = 2

	for f in range(15):
		await process_frame

	await capture.call("05_pause_modal_settings_and_accessibility", "Pause Modal Tab 3 with audio volume buses, camera sensitivity, invert-Y, and reduced motion")

	# -------------------------------------------------------------------------
	# 6. Pause Modal — Tab 4: Sacred Vedic Codex Dossier
	# -------------------------------------------------------------------------
	print("\n--- Shot 6: Pause Modal Sacred Codex Dossier ---")
	if pause_menu:
		var tabs = pause_menu.find_child("TabContainer", true, false) as TabContainer
		if tabs:
			tabs.current_tab = 3
		var list = pause_menu.find_child("CodexItemList", true, false) as ItemList
		if list and list.item_count > 0:
			list.select(0)
			list.item_selected.emit(0)

	for f in range(15):
		await process_frame

	await capture.call("06_pause_modal_sacred_codex_dossier", "Pause Modal Tab 4 with Sacred Codex character lore, Astra histories, and titan annals")

	# Close pause menu for gameplay presentations
	if pause_menu:
		pause_menu.close_menu()

	for f in range(10):
		await process_frame

	# -------------------------------------------------------------------------
	# 7. Boss Encounter Health Bar & Cyan Combat Target Lock
	# -------------------------------------------------------------------------
	print("\n--- Shot 7: Boss Encounter Health & Target Lock ---")
	var boss = bhumi_scene.find_child("BossKalanemi", true, false)
	if boss and player:
		boss.global_position = Vector3(0.0, 1.0, -10.0)
		player.global_position = Vector3(0.0, 1.0, 0.0)

	if hud:
		hud.show_boss_bar("General Kalanemi — Corrupted Asura General", 260, 350)
		if hud.target_lock_panel and hud.target_label:
			hud.target_label.text = "⌖ TARGET LOCKED: GENERAL KALANEMI"
			hud.target_lock_panel.visible = true

	for f in range(15):
		await process_frame

	await capture.call("07_boss_encounter_health_and_target_lock", "Boss encounter presentation with monumental health bar and cyan lock-on frame")

	# Hide boss bar and lock
	if hud:
		hud.hide_boss_bar()
		if hud.target_lock_panel:
			hud.target_lock_panel.visible = false

	# -------------------------------------------------------------------------
	# 8. In-World Dialogue Modal & Typographic Presentation
	# -------------------------------------------------------------------------
	print("\n--- Shot 8: Dialogue Typographic Presentation ---")
	if hud:
		hud.show_dialogue(
			"Devi Tara",
			"[Celestial Oracle of Tapas]",
			"Arise, Child of the Sun. The Wheel of Time falters across the Seven Spheres. " +
			"Gather the shattered Astra prisms and cleanse General Kalanemi's blight."
		)

	for f in range(15):
		await process_frame

	await capture.call("08_dialogue_typographic_presentation", "In-world dialogue modal with Sanskrit lore, role tag, and accessibility subtitles")

	if hud:
		hud.hide_dialogue()

	# -------------------------------------------------------------------------
	# 9. Collapsible Developer Drawer Presentation
	# -------------------------------------------------------------------------
	print("\n--- Shot 9: Collapsible Developer Drawer Presentation ---")
	if hud:
		if hud.dev_drawer:
			hud.dev_drawer.visible = true
		if hud.btn_dev_toggle:
			hud.btn_dev_toggle.text = "[F1] Dev ▴"

	for f in range(15):
		await process_frame

	await capture.call("09_collapsible_dev_drawer_presentation", "Collapsible dev drawer with non-obtrusive tools, keeping the 3D game view clean")

	if hud and hud.dev_drawer:
		hud.dev_drawer.visible = false
	if hud and hud.btn_dev_toggle:
		hud.btn_dev_toggle.text = "[F1] Dev ▾"

	# -------------------------------------------------------------------------
	# 10. Consecration Victory Modal Presentation
	# -------------------------------------------------------------------------
	print("\n--- Shot 10: Consecration Victory Presentation ---")
	if hud:
		hud.show_victory_overlay(5, 114.5, "Realm of Bhumi (Dandaka Valley)")

	for f in range(15):
		await process_frame

	await capture.call("10_victory_consecration_presentation", "Consecration victory modal with S-rank rating, purified shard summary, and ascension action")

	print("\n================================================================")
	print("  ALL 10 STAGE Q7 PRESENTATION SCREENSHOTS CAPTURED!            ")
	print("================================================================")
	quit(0)
