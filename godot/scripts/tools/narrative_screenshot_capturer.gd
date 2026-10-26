extends SceneTree

## Stage Q6 Complete Seven-Realm Narrative & Cinematic Integration Screenshot Capturer
## Captures 10 high-definition in-engine validation screenshots:
## 1. 01_bhumi_dandaka_cinematic_intro.png
## 2. 02_devi_tara_inworld_oracle_talk.png
## 3. 03_devi_tara_bless_astra_performance.png
## 4. 04_antariksha_vayu_cinematic_sweep.png
## 5. 05_patala_subterranean_descent_cinematic.png
## 6. 06_svar_solar_citadel_light_bridge_cinematic.png
## 7. 07_maharloka_astral_archives_cinematic.png
## 8. 08_tapoloka_caldera_conflagration_cinematic.png
## 9. 09_satyaloka_cosmic_lotus_climax_cinematic.png
## 10. 10_satyaloka_moksha_mahapeetham_resolution.png

const OUT_DIR = "res://../screenshots/narrative_q6/"
const BRAIN_DIR = "C:/Users/dayan/.gemini/antigravity-ide/brain/ebde482a-7463-4886-8fc0-62ef0783fc6e/"


var cine_cam: Camera3D = null
var canvas_layer: CanvasLayer = null
var top_bar: ColorRect = null
var bottom_bar: ColorRect = null
var subtitle_panel: PanelContainer = null
var speaker_label: Label = null
var role_label: Label = null
var subtitle_label: Label = null
var skip_prompt: Label = null

func _init() -> void:
	call_deferred("_run_narrative_captures")

func _setup_cinematic_ui() -> void:
	canvas_layer = CanvasLayer.new()
	canvas_layer.name = "CineCanvasLayer"
	canvas_layer.layer = 150
	root.add_child(canvas_layer)

	var root_control = Control.new()
	root_control.name = "CineRoot"
	root_control.set_anchors_preset(Control.PRESET_FULL_RECT)
	canvas_layer.add_child(root_control)

	top_bar = ColorRect.new()
	top_bar.name = "TopBar"
	top_bar.color = Color(0.03, 0.03, 0.05, 1.0)
	top_bar.anchor_left = 0.0
	top_bar.anchor_right = 1.0
	top_bar.anchor_top = 0.0
	top_bar.anchor_bottom = 0.0
	top_bar.offset_bottom = 85.0
	root_control.add_child(top_bar)

	bottom_bar = ColorRect.new()
	bottom_bar.name = "BottomBar"
	bottom_bar.color = Color(0.03, 0.03, 0.05, 1.0)
	bottom_bar.anchor_left = 0.0
	bottom_bar.anchor_right = 1.0
	bottom_bar.anchor_top = 1.0
	bottom_bar.anchor_bottom = 1.0
	bottom_bar.offset_top = -115.0
	root_control.add_child(bottom_bar)

	subtitle_panel = PanelContainer.new()
	subtitle_panel.name = "SubtitlePanel"
	subtitle_panel.anchor_left = 0.15
	subtitle_panel.anchor_right = 0.85
	subtitle_panel.anchor_top = 0.82
	subtitle_panel.anchor_bottom = 0.96
	
	var sb = StyleBoxFlat.new()
	sb.bg_color = Color(0.06, 0.08, 0.12, 0.88)
	sb.border_width_top = 2
	sb.border_color = Color(0.95, 0.82, 0.35, 0.85)
	sb.corner_radius_top_left = 6
	sb.corner_radius_top_right = 6
	sb.corner_radius_bottom_left = 6
	sb.corner_radius_bottom_right = 6
	sb.content_margin_left = 24
	sb.content_margin_right = 24
	sb.content_margin_top = 10
	sb.content_margin_bottom = 10
	subtitle_panel.add_theme_stylebox_override("panel", sb)
	root_control.add_child(subtitle_panel)

	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 4)
	subtitle_panel.add_child(vbox)

	var header_hbox = HBoxContainer.new()
	header_hbox.add_theme_constant_override("separation", 12)
	vbox.add_child(header_hbox)

	speaker_label = Label.new()
	speaker_label.name = "SpeakerLabel"
	speaker_label.text = "DEVI TARA"
	speaker_label.add_theme_color_override("font_color", Color(1.0, 0.88, 0.4, 1.0))
	speaker_label.add_theme_font_size_override("font_size", 20)
	header_hbox.add_child(speaker_label)

	role_label = Label.new()
	role_label.name = "RoleLabel"
	role_label.text = "— Celestial Oracle of Tapas"
	role_label.add_theme_color_override("font_color", Color(0.35, 0.85, 0.95, 0.85))
	role_label.add_theme_font_size_override("font_size", 16)
	header_hbox.add_child(role_label)

	subtitle_label = Label.new()
	subtitle_label.name = "SubtitleLabel"
	subtitle_label.text = "Dialogue text line..."
	subtitle_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	subtitle_label.add_theme_color_override("font_color", Color(0.96, 0.96, 0.98, 1.0))
	subtitle_label.add_theme_font_size_override("font_size", 16)
	vbox.add_child(subtitle_label)

	skip_prompt = Label.new()
	skip_prompt.name = "SkipPrompt"
	skip_prompt.text = "[SPACE / ESC] Skip Scene"
	skip_prompt.anchor_left = 1.0
	skip_prompt.anchor_right = 1.0
	skip_prompt.anchor_top = 1.0
	skip_prompt.anchor_bottom = 1.0
	skip_prompt.offset_left = -220
	skip_prompt.offset_top = -30
	skip_prompt.add_theme_color_override("font_color", Color(0.75, 0.75, 0.75, 0.75))
	skip_prompt.add_theme_font_size_override("font_size", 13)
	root_control.add_child(skip_prompt)

func _set_subtitle(speaker: String, role: String, text: String) -> void:
	if speaker_label:
		speaker_label.text = speaker.to_upper()
	if role_label:
		role_label.text = ("— " + role) if not role.is_empty() else ""
	if subtitle_label:
		subtitle_label.text = text

func _run_narrative_captures() -> void:
	print("================================================================")
	print("  STARTING STAGE Q6 NARRATIVE & CINEMATIC INTEGRATION CAPTURES   ")
	print("================================================================")
	var abs_out_dir = ProjectSettings.globalize_path(OUT_DIR)
	DirAccess.make_dir_recursive_absolute(abs_out_dir)
	DirAccess.make_dir_recursive_absolute(BRAIN_DIR)

	_setup_cinematic_ui()

	# Dedicated Cinematic Camera
	cine_cam = Camera3D.new()
	cine_cam.name = "CineNarrativeCamera"
	cine_cam.fov = 52.0
	cine_cam.near = 0.1
	cine_cam.far = 400.0
	cine_cam.current = true
	root.add_child(cine_cam)

	var capture = func(filename: String, desc: String):
		for f in range(12):
			await process_frame

		var img = root.get_texture().get_image()
		if img and not img.is_empty():
			var p = abs_out_dir + filename + ".png"
			var err = img.save_png(p)
			if err == OK:
				print("  [CAPTURED] " + filename + " — " + desc)
				var brain_path = BRAIN_DIR + filename + ".png"
				img.save_png(brain_path)
			else:
				printerr("  [ERROR] Failed to save " + filename + ": ", err)
		else:
			printerr("  [ERROR] Image empty for " + filename)

	# -------------------------------------------------------------------------
	# 1. BHUMI — Dandaka Grove Cinematic Intro
	# -------------------------------------------------------------------------
	print("\n--- Shot 1: Bhumi Dandaka Grove Cinematic Intro ---")
	var bhumi_scene = load("res://scenes/levels/BhumiValley3D.tscn").instantiate()
	root.add_child(bhumi_scene)
	var bhumi_hud = bhumi_scene.find_child("HUD3D", true, false)
	if bhumi_hud:
		bhumi_hud.visible = false

	for f in range(25):
		await process_frame

	cine_cam.global_position = Vector3(-18.0, 16.0, 32.0)
	cine_cam.look_at(Vector3(0.0, 5.0, 0.0), Vector3.UP)
	_set_subtitle(
		"Narrator", "Cosmic Chronicles",
		"BHUMI — The Mortal Realm. Here at Dandaka Grove, the primordial flame of Surya has faltered."
	)
	await capture.call("01_bhumi_dandaka_cinematic_intro", "Bhumi Dandaka Grove widescreen cinematic opening vista")

	# -------------------------------------------------------------------------
	# 2. DEVI TARA — In-World Oracle Talk Performance
	# -------------------------------------------------------------------------
	print("\n--- Shot 2: Devi Tara In-World Oracle Talk Performance ---")
	var devi_tara: DeviTara3D = bhumi_scene.find_child("DeviTara3D", true, false)
	var player = bhumi_scene.find_child("Player3D", true, false)
	if player:
		player.global_position = Vector3(0.0, 1.2, 5.0)
		player._play_anim("idle")
	if devi_tara:
		devi_tara.play_talk()
		cine_cam.global_position = devi_tara.global_position + Vector3(1.2, 1.6, 2.8)
		cine_cam.look_at(devi_tara.global_position + Vector3(0.0, 1.35, 0.0), Vector3.UP)
	else:
		cine_cam.global_position = Vector3(0.0, 2.5, 7.0)
		cine_cam.look_at(Vector3(0.0, 1.5, 0.0), Vector3.UP)

	_set_subtitle(
		"Devi Tara", "Celestial Oracle of Tapas",
		"Arise, Child of the Sun. Reclaim the 3 Primal Astra Shards and cleanse the Asura corruption!"
	)
	await capture.call("02_devi_tara_inworld_oracle_talk", "Devi Tara performing in-world talk_oracle gesture with gold zari and cyan eyes")

	# -------------------------------------------------------------------------
	# 3. DEVI TARA — Bless Astra Performance
	# -------------------------------------------------------------------------
	print("\n--- Shot 3: Devi Tara Bless Astra Performance ---")
	if devi_tara:
		devi_tara.play_bless()
		cine_cam.global_position = devi_tara.global_position + Vector3(-0.8, 1.5, 2.4)
		cine_cam.look_at(devi_tara.global_position + Vector3(0.0, 1.3, 0.0), Vector3.UP)

	_set_subtitle(
		"Devi Tara", "Celestial Oracle of Tapas",
		"✦ Receive the Solar Agni Blessing! The power of Surya flows through your blade."
	)
	await capture.call("03_devi_tara_bless_astra_performance", "Devi Tara performing bless_astra with glowing prana mandala aura")

	bhumi_scene.queue_free()
	for f in range(5):
		await process_frame

	# -------------------------------------------------------------------------
	# 4. ANTARIKSHA — Aerial Vault of Vayu Cinematic Sweep
	# -------------------------------------------------------------------------
	print("\n--- Shot 4: Antariksha Aerial Vault Sweep ---")
	var antariksha_scene = load("res://scenes/levels/AntarikshaSkyRealm3D.tscn").instantiate()
	root.add_child(antariksha_scene)
	var ant_hud = antariksha_scene.find_child("HUD3D", true, false)
	if ant_hud:
		ant_hud.visible = false

	for f in range(25):
		await process_frame

	cine_cam.global_position = Vector3(-25.0, 48.0, 35.0)
	cine_cam.look_at(Vector3(0.0, 25.0, -20.0), Vector3.UP)
	_set_subtitle(
		"Narrator", "Cosmic Chronicles",
		"ANTARIKSHA — The Aerial Vault of Vayu. Floating citadels suspend in a vortex of roaring celestial gales."
	)
	await capture.call("04_antariksha_vayu_cinematic_sweep", "Antariksha floating islands, cloud banks, and Vayu turbine sweep")

	antariksha_scene.queue_free()
	for f in range(5):
		await process_frame

	# -------------------------------------------------------------------------
	# 5. PATALA — Subterranean Serpent Vaults Descent
	# -------------------------------------------------------------------------
	print("\n--- Shot 5: Patala Subterranean Descent ---")
	var patala_scene = load("res://scenes/levels/PatalaUnderworld3D.tscn").instantiate()
	root.add_child(patala_scene)
	var pat_hud = patala_scene.find_child("HUD3D", true, false)
	if pat_hud:
		pat_hud.visible = false

	for f in range(25):
		await process_frame

	cine_cam.global_position = Vector3(-12.0, 16.0, 25.0)
	cine_cam.look_at(Vector3(0.0, 5.0, -15.0), Vector3.UP)
	_set_subtitle(
		"Narrator", "Cosmic Chronicles",
		"PATALA — The Subterranean Serpent Vaults. Emerald rivers of venom snake beneath colossal basalt stalagmites."
	)
	await capture.call("05_patala_subterranean_descent_cinematic", "Patala subterranean venom river and colossal basalt stalagmite cavern")

	patala_scene.queue_free()
	for f in range(5):
		await process_frame

	# -------------------------------------------------------------------------
	# 6. SVAR — Solar Citadel Light Bridge Reveal
	# -------------------------------------------------------------------------
	print("\n--- Shot 6: Svar Solar Citadel Light Bridge ---")
	var svar_scene = load("res://scenes/levels/SvarSolarCitadel3D.tscn").instantiate()
	root.add_child(svar_scene)
	var svar_hud = svar_scene.find_child("HUD3D", true, false)
	if svar_hud:
		svar_hud.visible = false

	for f in range(25):
		await process_frame

	cine_cam.global_position = Vector3(-15.0, 24.0, 45.0)
	cine_cam.look_at(Vector3(0.0, 12.0, -10.0), Vector3.UP)
	_set_subtitle(
		"Narrator", "Cosmic Chronicles",
		"SVARLOKA — The Golden Solar Citadels of Savitr. Piercing sunlight bathes majestic marble sky bastions."
	)
	await capture.call("06_svar_solar_citadel_light_bridge_cinematic", "Svar solar citadel with crystalline light bridges and Surya Prisms")

	svar_scene.queue_free()
	for f in range(5):
		await process_frame

	# -------------------------------------------------------------------------
	# 7. MAHARLOKA — Astral Archives Cinematic Sweep
	# -------------------------------------------------------------------------
	print("\n--- Shot 7: Maharloka Astral Archives ---")
	var mahar_scene = load("res://scenes/levels/MaharlokaSanctuary3D.tscn").instantiate()
	root.add_child(mahar_scene)
	var mahar_hud = mahar_scene.find_child("HUD3D", true, false)
	if mahar_hud:
		mahar_hud.visible = false

	for f in range(25):
		await process_frame

	cine_cam.global_position = Vector3(-20.0, 32.0, 40.0)
	cine_cam.look_at(Vector3(0.0, 14.0, -15.0), Vector3.UP)
	_set_subtitle(
		"Narrator", "Cosmic Chronicles",
		"MAHARLOKA — The Cosmic Astral Libraries. Towering archive shelves preserve all hymns and eternal truths."
	)
	await capture.call("07_maharloka_astral_archives_cinematic", "Maharloka cosmic library with towering scripture pillars and glyphs")

	mahar_scene.queue_free()
	for f in range(5):
		await process_frame

	# -------------------------------------------------------------------------
	# 8. TAPOLOKA — Caldera Conflagration & Primordial Forge
	# -------------------------------------------------------------------------
	print("\n--- Shot 8: Tapoloka Caldera Conflagration ---")
	var tapo_scene = load("res://scenes/levels/TapolokaForge3D.tscn").instantiate()
	root.add_child(tapo_scene)
	var tapo_hud = tapo_scene.find_child("HUD3D", true, false)
	if tapo_hud:
		tapo_hud.visible = false

	for f in range(25):
		await process_frame

	cine_cam.global_position = Vector3(-22.0, 35.0, 42.0)
	cine_cam.look_at(Vector3(0.0, 10.0, -15.0), Vector3.UP)
	_set_subtitle(
		"Narrator", "Cosmic Chronicles",
		"TAPOLOKA — Agni's Primordial Forge. Magma rivers boil through obsidian calderas where sacred weapons are cast."
	)
	await capture.call("08_tapoloka_caldera_conflagration_cinematic", "Tapoloka magma calderas, pressure geysers, and primordial anvils")

	tapo_scene.queue_free()
	for f in range(5):
		await process_frame

	# -------------------------------------------------------------------------
	# 9. SATYALOKA — Cosmic Lotus Apex Climax
	# -------------------------------------------------------------------------
	print("\n--- Shot 9: Satyaloka Cosmic Lotus Apex Climax ---")
	var satya_scene = load("res://scenes/levels/SatyalokaApex3D.tscn").instantiate()
	root.add_child(satya_scene)
	var satya_hud = satya_scene.find_child("HUD3D", true, false)
	if satya_hud:
		satya_hud.visible = false

	for f in range(25):
		await process_frame

	cine_cam.global_position = Vector3(0.0, 45.0, 65.0)
	cine_cam.look_at(Vector3(0.0, 18.0, -15.0), Vector3.UP)
	_set_subtitle(
		"Narrator", "Cosmic Chronicles",
		"SATYALOKA — The Highest Apex of Creation. The Cosmic Lotus unfolds at the very boundary of mortal reality."
	)
	await capture.call("09_satyaloka_cosmic_lotus_climax_cinematic", "Satyaloka cosmic lotus unfolding at the boundary of mortal reality")

	# -------------------------------------------------------------------------
	# 10. SATYALOKA — Grand Climax Finale (Moksha Mahapeetham Resolution)
	# -------------------------------------------------------------------------
	print("\n--- Shot 10: Satyaloka Moksha Mahapeetham Resolution ---")
	var satya_player = satya_scene.find_child("Player3D", true, false)
	var satya_tara = satya_scene.find_child("DeviTara3D", true, false)
	if satya_player:
		satya_player.global_position = Vector3(-1.8, 4.0, -32.0)
		satya_player._play_anim("idle")
	if satya_tara:
		satya_tara.global_position = Vector3(1.8, 4.0, -32.0)
		satya_tara.play_bless()

	cine_cam.global_position = Vector3(0.0, 8.5, -20.0)
	cine_cam.look_at(Vector3(0.0, 5.0, -38.0), Vector3.UP)
	_set_subtitle(
		"Veer", "Solar Guardian",
		"From Bhumi's soil to Satyaloka's zenith, all souls are liberated. The light of Rta endures!"
	)
	await capture.call("10_satyaloka_moksha_mahapeetham_resolution", "Final Grand Climax Resolution at Moksha Mahapeetham with Devi Tara and Veer")

	print("\n================================================================")
	print("  ALL 10 NARRATIVE & CINEMATIC SCREENSHOTS CAPTURED!            ")
	print("================================================================")
	quit(0)
