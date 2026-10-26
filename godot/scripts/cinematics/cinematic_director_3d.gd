class_name CinematicDirector3D
extends Node

## CinematicDirector3D
## Centralized 3D cinematic camera choreography, letterboxing, subtitle streaming,
## and narrative pacing engine for the Seven-Realm Campaign.
##
## Features:
## 1. Controlled Camera3D choreography with smooth interpolation and multi-shot timelines.
## 2. 2.39:1 widescreen cinema matte bars (letterboxing) with smooth tween transitions.
## 3. Typographic subtitle lower-thirds displaying speaker, role, and dialogue lines.
## 4. Rock-solid skip reliability (ESC / Space / UI Cancel) preserving all quest and save states.
## 5. Built-in authored sequences for 7 Realm Intros, Boss Introductions, Consecrations, and Satyaloka Moksha Finale.

signal cinematic_started(sequence_name: String)
signal shot_transitioned(shot_index: int, total_shots: int)
signal cinematic_ended(sequence_name: String, skipped: bool)

class CinematicShot:
	var name: String = ""
	var start_pos: Vector3 = Vector3.ZERO
	var end_pos: Vector3 = Vector3.ZERO
	var look_target: Vector3 = Vector3.ZERO
	var fov: float = 65.0
	var duration: float = 4.0
	var speaker_name: String = ""
	var speaker_role: String = ""
	var dialogue_text: String = ""
	var on_start_callback: Callable = Callable()

	func _init(p_name: String, p_start: Vector3, p_end: Vector3, p_look: Vector3, p_dur: float,
	           p_speaker: String = "", p_role: String = "", p_text: String = "", p_fov: float = 65.0) -> void:
		name = p_name
		start_pos = p_start
		end_pos = p_end
		look_target = p_look
		duration = p_dur
		speaker_name = p_speaker
		speaker_role = p_role
		dialogue_text = p_text
		fov = p_fov

var is_active: bool = false
var current_sequence_name: String = ""
var current_shots: Array = []
var current_shot_idx: int = -1
var shot_elapsed: float = 0.0
var on_complete_callback: Callable = Callable()

# Internal Nodes
var cine_camera: Camera3D = null
var previous_camera: Camera3D = null
var canvas_layer: CanvasLayer = null
var top_bar: ColorRect = null
var bottom_bar: ColorRect = null
var subtitle_panel: PanelContainer = null
var speaker_label: Label = null
var role_label: Label = null
var subtitle_label: Label = null
var skip_prompt: Label = null

func _ready() -> void:
	_setup_cinematic_nodes()

func _setup_cinematic_nodes() -> void:
	# 1. Dedicated Cinematic Camera
	cine_camera = Camera3D.new()
	cine_camera.name = "CinematicCamera3D"
	cine_camera.current = false
	add_child(cine_camera)

	# 2. Cinema Letterbox & Subtitle Canvas Layer
	canvas_layer = CanvasLayer.new()
	canvas_layer.name = "CinematicCanvasLayer"
	canvas_layer.layer = 120 # Above standard HUD
	add_child(canvas_layer)

	var root_control = Control.new()
	root_control.name = "CinematicRootControl"
	root_control.set_anchors_preset(Control.PRESET_FULL_RECT)
	root_control.mouse_filter = Control.MOUSE_FILTER_IGNORE
	canvas_layer.add_child(root_control)

	# Top Matte Bar
	top_bar = ColorRect.new()
	top_bar.name = "TopBar"
	top_bar.color = Color(0.04, 0.04, 0.06, 1.0)
	top_bar.anchor_left = 0.0
	top_bar.anchor_right = 1.0
	top_bar.anchor_top = 0.0
	top_bar.anchor_bottom = 0.0
	top_bar.offset_bottom = 0.0 # Animated to 90px
	top_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root_control.add_child(top_bar)

	# Bottom Matte Bar
	bottom_bar = ColorRect.new()
	bottom_bar.name = "BottomBar"
	bottom_bar.color = Color(0.04, 0.04, 0.06, 1.0)
	bottom_bar.anchor_left = 0.0
	bottom_bar.anchor_right = 1.0
	bottom_bar.anchor_top = 1.0
	bottom_bar.anchor_bottom = 1.0
	bottom_bar.offset_top = 0.0 # Animated to -120px
	bottom_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root_control.add_child(bottom_bar)

	# Subtitle Panel Container
	subtitle_panel = PanelContainer.new()
	subtitle_panel.name = "SubtitlePanel"
	subtitle_panel.anchor_left = 0.15
	subtitle_panel.anchor_right = 0.85
	subtitle_panel.anchor_top = 0.82
	subtitle_panel.anchor_bottom = 0.96
	subtitle_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	
	var sb = StyleBoxFlat.new()
	sb.bg_color = Color(0.06, 0.08, 0.12, 0.85)
	sb.border_width_top = 2
	sb.border_color = Color(0.95, 0.82, 0.35, 0.8) # Gold border
	sb.corner_radius_top_left = 6
	sb.corner_radius_top_right = 6
	sb.corner_radius_bottom_left = 6
	sb.corner_radius_bottom_right = 6
	sb.content_margin_left = 20
	sb.content_margin_right = 20
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
	role_label.add_theme_font_size_override("font_size", 14)
	header_hbox.add_child(role_label)

	subtitle_label = Label.new()
	subtitle_label.name = "SubtitleLabel"
	subtitle_label.text = "Arise, Child of the Sun..."
	subtitle_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	subtitle_label.add_theme_color_override("font_color", Color(0.96, 0.96, 0.98, 1.0))
	subtitle_label.add_theme_font_size_override("font_size", 16)
	vbox.add_child(subtitle_label)

	# Skip Prompt
	skip_prompt = Label.new()
	skip_prompt.name = "SkipPrompt"
	skip_prompt.text = "[SPACE / ESC] Skip Scene"
	skip_prompt.anchor_left = 1.0
	skip_prompt.anchor_right = 1.0
	skip_prompt.anchor_top = 1.0
	skip_prompt.anchor_bottom = 1.0
	skip_prompt.offset_left = -220
	skip_prompt.offset_top = -32
	skip_prompt.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7, 0.75))
	skip_prompt.add_theme_font_size_override("font_size", 13)
	root_control.add_child(skip_prompt)

	# Initially hidden
	canvas_layer.visible = false

func _process(delta: float) -> void:
	if not is_active:
		return

	# Handle skip input
	if Input.is_action_just_pressed("ui_cancel") or Input.is_action_just_pressed("ui_accept"):
		skip_cinematic()
		return

	if current_shot_idx < 0 or current_shot_idx >= current_shots.size():
		return

	var shot = current_shots[current_shot_idx]
	shot_elapsed += delta
	var t = clampf(shot_elapsed / maxf(shot.duration, 0.01), 0.0, 1.0)
	
	# Smooth Hermite / EaseInOut interpolation
	var smooth_t = smoothstep(0.0, 1.0, t)

	# Update Camera Position
	var curr_pos = shot.start_pos.lerp(shot.end_pos, smooth_t)
	cine_camera.position = curr_pos
	if is_inside_tree():
		cine_camera.global_position = curr_pos
		if shot.look_target != Vector3.ZERO and shot.look_target != curr_pos:
			cine_camera.look_at(shot.look_target, Vector3.UP)
	
	cine_camera.fov = shot.fov

	# Advance to next shot
	if t >= 1.0:
		_advance_shot()

func play_sequence(sequence_name: String, shots: Array, on_complete: Callable = Callable()) -> void:
	if shots.is_empty():
		if on_complete.is_valid():
			on_complete.call()
		return

	is_active = true
	current_sequence_name = sequence_name
	current_shots = shots.duplicate()
	current_shot_idx = -1
	shot_elapsed = 0.0
	on_complete_callback = on_complete

	# Store previous camera to restore later (safe for headless / off-tree usage)
	var vp = get_viewport()
	if vp:
		previous_camera = vp.get_camera_3d()
	else:
		previous_camera = null
	if cine_camera:
		cine_camera.current = true

	# Show Canvas Layer & Animate Letterbox Bars
	if canvas_layer:
		canvas_layer.visible = true
	_animate_letterbox(true)

	cinematic_started.emit(sequence_name)
	_advance_shot()

func _advance_shot() -> void:
	current_shot_idx += 1
	shot_elapsed = 0.0

	if current_shot_idx >= current_shots.size():
		finish_cinematic(false)
		return

	var shot = current_shots[current_shot_idx]
	shot_transitioned.emit(current_shot_idx, current_shots.size())

	# Initialise camera at shot start
	if cine_camera:
		cine_camera.position = shot.start_pos
		if is_inside_tree():
			cine_camera.global_position = shot.start_pos
			if shot.look_target != Vector3.ZERO:
				cine_camera.look_at(shot.look_target, Vector3.UP)
		cine_camera.fov = shot.fov

	# Display Subtitles
	if shot.dialogue_text.is_empty():
		subtitle_panel.visible = false
	else:
		subtitle_panel.visible = true
		speaker_label.text = shot.speaker_name.to_upper()
		role_label.text = "— " + shot.speaker_role if not shot.speaker_role.is_empty() else ""
		subtitle_label.text = shot.dialogue_text

	if shot.on_start_callback.is_valid():
		shot.on_start_callback.call()

func skip_cinematic() -> void:
	if not is_active:
		return
	finish_cinematic(true)

func finish_cinematic(skipped: bool) -> void:
	if not is_active:
		return
	is_active = false
	var seq = current_sequence_name
	current_sequence_name = ""
	current_shots.clear()
	current_shot_idx = -1

	# Animate Letterbox Out
	_animate_letterbox(false)

	# Restore previous camera
	if previous_camera and is_instance_valid(previous_camera):
		previous_camera.current = true
	elif cine_camera:
		cine_camera.current = false

	# Hide subtitles
	if subtitle_panel:
		subtitle_panel.visible = false

	cinematic_ended.emit(seq, skipped)

	if on_complete_callback.is_valid():
		var cb = on_complete_callback
		on_complete_callback = Callable()
		cb.call()

func _animate_letterbox(open: bool) -> void:
	if not top_bar or not bottom_bar:
		return
	if not is_inside_tree():
		if open:
			top_bar.offset_bottom = 90.0
			bottom_bar.offset_top = -120.0
		else:
			top_bar.offset_bottom = 0.0
			bottom_bar.offset_top = 0.0
			if canvas_layer:
				canvas_layer.visible = false
		return
	var tw = create_tween().set_parallel(true).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	if open:
		tw.tween_property(top_bar, "offset_bottom", 90.0, 0.6)
		tw.tween_property(bottom_bar, "offset_top", -120.0, 0.6)
	else:
		tw.tween_property(top_bar, "offset_bottom", 0.0, 0.5)
		tw.tween_property(bottom_bar, "offset_top", 0.0, 0.5)
		tw.chain().tween_callback(func():
			if not is_active and canvas_layer:
				canvas_layer.visible = false
		)

# =========================================================================
# Authored Cinematic Sequence Generators
# =========================================================================

## 1. Realm Introductions for all 7 Realms
func play_realm_intro(realm_id: String, on_complete: Callable = Callable()) -> void:
	var shots: Array[CinematicShot] = []
	match realm_id.to_lower():
		"bhumi":
			shots.append(CinematicShot.new(
				"bhumi_vista",
				Vector3(-25.0, 18.0, 40.0), Vector3(0.0, 12.0, 18.0), Vector3(0.0, 2.0, 0.0), 4.0,
				"Narrator", "Cosmic Chronicles",
				"BHUMI — The Mortal Realm. Here at Dandaka Grove, the primordial flame of Surya has faltered.", 70.0
			))
			shots.append(CinematicShot.new(
				"sanctum_reveal",
				Vector3(0.0, 6.0, 15.0), Vector3(0.0, 3.2, 8.0), Vector3(0.0, 1.5, 0.0), 3.5,
				"Devi Tara", "Celestial Oracle of Tapas",
				"Arise, Child of the Sun. Reclaim the 3 Primal Astra Shards and cleanse the Asura corruption!", 60.0
			))
		"antariksha":
			shots.append(CinematicShot.new(
				"sky_sweep",
				Vector3(-30.0, 50.0, 40.0), Vector3(-10.0, 35.0, 10.0), Vector3(0.0, 20.0, -40.0), 4.0,
				"Narrator", "Cosmic Chronicles",
				"ANTARIKSHA — The Aerial Vault of Vayu. Floating citadels suspend in a vortex of roaring celestial gales.", 72.0
			))
			shots.append(CinematicShot.new(
				"pinnacle_reveal",
				Vector3(0.0, 85.0, -80.0), Vector3(0.0, 78.0, -110.0), Vector3(0.0, 75.0, -130.0), 3.5,
				"Devi Tara", "Celestial Oracle of Tapas",
				"Spread your Prana Glider upon the updrafts, align the Vayu Turbines, and pacify Lord Matarishvan!", 62.0
			))
		"patala":
			shots.append(CinematicShot.new(
				"abyss_descent",
				Vector3(-20.0, 22.0, 35.0), Vector3(0.0, 14.0, 15.0), Vector3(0.0, 3.0, -20.0), 4.0,
				"Narrator", "Cosmic Chronicles",
				"PATALA — The Subterranean Serpent Vaults. Emerald rivers of venom snake beneath colossal basalt stalagmites.", 70.0
			))
			shots.append(CinematicShot.new(
				"nagamani_vault",
				Vector3(0.0, 12.0, -35.0), Vector3(0.0, 6.5, -55.0), Vector3(0.0, 4.0, -75.0), 3.5,
				"Devi Tara", "Celestial Oracle of Tapas",
				"Leap upon the glowing fungal caps to cross the venom chasms. Purify Shesha's Tormented Echo!", 60.0
			))
		"svar":
			shots.append(CinematicShot.new(
				"citadel_sweep",
				Vector3(0.0, 45.0, 60.0), Vector3(0.0, 30.0, 25.0), Vector3(0.0, 15.0, -40.0), 4.0,
				"Narrator", "Cosmic Chronicles",
				"SVARLOKA — The Golden Solar Citadels of Savitr. Piercing sunlight bathes majestic marble sky bastions.", 70.0
			))
			shots.append(CinematicShot.new(
				"light_bridges",
				Vector3(-15.0, 25.0, -10.0), Vector3(0.0, 18.0, -35.0), Vector3(0.0, 12.0, -60.0), 3.5,
				"Devi Tara", "Celestial Oracle of Tapas",
				"Rotate the sacred Surya Prisms to manifest the radiant Light Bridges and confront the Sun Titan Avatara!", 60.0
			))
		"maharloka":
			shots.append(CinematicShot.new(
				"library_archives",
				Vector3(-25.0, 38.0, 45.0), Vector3(-5.0, 26.0, 15.0), Vector3(0.0, 15.0, -30.0), 4.0,
				"Narrator", "Cosmic Chronicles",
				"MAHARLOKA — The Cosmic Astral Libraries. Towering archive shelves preserve all hymns and eternal truths.", 72.0
			))
			shots.append(CinematicShot.new(
				"observatory_sanctuary",
				Vector3(0.0, 28.0, -40.0), Vector3(0.0, 18.0, -65.0), Vector3(0.0, 12.0, -85.0), 3.5,
				"Devi Tara", "Celestial Oracle of Tapas",
				"Ascend via Astral Levitation Glyphs, commune with the Vedic Pedestals, and attune the Sage Core!", 62.0
			))
		"tapoloka":
			shots.append(CinematicShot.new(
				"caldera_eruption",
				Vector3(-30.0, 42.0, 50.0), Vector3(-10.0, 28.0, 20.0), Vector3(0.0, 10.0, -30.0), 4.0,
				"Narrator", "Cosmic Chronicles",
				"TAPOLOKA — Agni's Primordial Forge. Magma rivers boil through obsidian calderas where sacred weapons are cast.", 72.0
			))
			shots.append(CinematicShot.new(
				"tapo_peetham",
				Vector3(0.0, 24.0, -35.0), Vector3(0.0, 15.0, -60.0), Vector3(0.0, 8.0, -80.0), 3.5,
				"Devi Tara", "Celestial Oracle of Tapas",
				"Ride the Magma Pressure Geysers, awaken the Primordial Anvils, and face the Fire Titan Agni Rudra!", 60.0
			))
		"satyaloka":
			shots.append(CinematicShot.new(
				"cosmic_lotus",
				Vector3(0.0, 55.0, 75.0), Vector3(0.0, 35.0, 35.0), Vector3(0.0, 15.0, -30.0), 4.5,
				"Narrator", "Cosmic Chronicles",
				"SATYALOKA — The Highest Apex of Creation. The Cosmic Lotus unfolds at the very boundary of mortal reality.", 75.0
			))
			shots.append(CinematicShot.new(
				"dharmachakra_core",
				Vector3(0.0, 30.0, -30.0), Vector3(0.0, 18.0, -60.0), Vector3(0.0, 10.0, -85.0), 4.0,
				"Devi Tara", "Celestial Oracle of Tapas",
				"The Dharmachakra has halted! Align the Resonators, liberate Brahma Avatara, and attain Moksha!", 60.0
			))
		_:
			shots.append(CinematicShot.new(
				"generic_sweep",
				Vector3(-15.0, 15.0, 25.0), Vector3(0.0, 8.0, 10.0), Vector3(0.0, 2.0, 0.0), 3.5,
				"Narrator", "Cosmic Chronicles",
				"Entering " + realm_id.capitalize() + "...", 65.0
			))

	play_sequence(realm_id + "_intro", shots, on_complete)

## 2. Boss Introductions
func play_boss_intro(boss_id: String, boss_name: String, boss_title: String, boss_pos: Vector3, on_complete: Callable = Callable()) -> void:
	var shots: Array[CinematicShot] = []
	shots.append(CinematicShot.new(
		"boss_reveal",
		boss_pos + Vector3(0.0, 6.0, 14.0),
		boss_pos + Vector3(0.0, 2.8, 6.5),
		boss_pos + Vector3(0.0, 2.2, 0.0),
		3.5,
		boss_name, boss_title,
		"⚡ %s awakens! Defeat the corrupted sentinel to restore cosmic balance." % boss_name,
		55.0
	))
	play_sequence(boss_id + "_boss_intro", shots, on_complete)

## 3. Consecration Victory Sequences
func play_consecration_victory(realm_name: String, altar_pos: Vector3, on_complete: Callable = Callable()) -> void:
	var shots: Array[CinematicShot] = []
	shots.append(CinematicShot.new(
		"consecration_rise",
		altar_pos + Vector3(0.0, 2.0, 5.0),
		altar_pos + Vector3(0.0, 12.0, 10.0),
		altar_pos + Vector3(0.0, 1.5, 0.0),
		3.8,
		"Devi Tara", "Celestial Oracle of Tapas",
		"✦ The sacred Peetham shines with divine radiance! The cosmic seal of %s is restored." % realm_name,
		60.0
	))
	play_sequence(realm_name + "_consecration", shots, on_complete)

## 4. Grand Climax Finale (Satyaloka Moksha Mahapeetham)
func play_campaign_resolution(moksha_pos: Vector3, on_complete: Callable = Callable()) -> void:
	var shots: Array[CinematicShot] = []
	shots.append(CinematicShot.new(
		"moksha_awakening",
		moksha_pos + Vector3(0.0, 4.0, 10.0),
		moksha_pos + Vector3(0.0, 16.0, 18.0),
		moksha_pos + Vector3(0.0, 2.0, 0.0),
		4.5,
		"Devi Tara", "Celestial Oracle of Tapas",
		"Veer... look upon the Seven Spheres. The Wheel of Dharma turns once more, radiant and eternal.",
		65.0
	))
	shots.append(CinematicShot.new(
		"cosmic_moksha_ascension",
		moksha_pos + Vector3(-8.0, 12.0, 12.0),
		moksha_pos + Vector3(0.0, 24.0, 28.0),
		moksha_pos + Vector3(0.0, 4.0, -10.0),
		5.0,
		"Veer", "Solar Guardian",
		"From Bhumi's soil to Satyaloka's zenith, all souls are liberated. The light of Rta endures!",
		70.0
	))
	play_sequence("satyaloka_campaign_resolution", shots, on_complete)
