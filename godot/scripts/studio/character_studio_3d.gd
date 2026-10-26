class_name CharacterStudio3D
extends Node3D

## Production 3D Character Studio & Inspection Viewer for Hero Veer (Solar Guardian).
## Features:
## - 360° free orbit camera with zoom (1.2m - 6.5m), height pan, and auto-rotation
## - 4 Cinematic lighting presets (Surya Dawn, High Noon, Twilight Tapas, Agni Forge)
## - Complete animation picker for all 18 production animations:
##   * Locomotion: Idle, Walk, Run, Sprint, Turn
##   * Combat: Slash 1, Slash 2, Finisher, Combo, Block, Parry, Hit Reaction
##   * Agility & Actions: Jump, Fall, Land, Dodge, Interact
##   * Ceremonial & Finale: Victory, Defeat
## - Playback speed scaling (0.25x - 2.0x) and Pause / Resume
## - Camera focus presets (Face / Bust, Full Body, Surya Khadga Weapon)
## - 3D skeletal joint overlay visualization
## - Clean, responsive UI with zero clipped labels and standard UTF-8 glyphs

@onready var veer_instance: Node3D = $Pedestal/VeerModel
@onready var camera_pivot: Node3D = $CameraPivot
@onready var studio_camera: Camera3D = $CameraPivot/SpringArm3D/Camera3D
@onready var spring_arm: SpringArm3D = $CameraPivot/SpringArm3D
@onready var sun_light: DirectionalLight3D = $Lights/DirectionalLight3D
@onready var rim_light: OmniLight3D = $Lights/RimLight3D
@onready var fill_light: OmniLight3D = $Lights/FillLight3D
@onready var under_light: OmniLight3D = $Lights/UnderLight3D
@onready var world_env: WorldEnvironment = $WorldEnvironment
@onready var joint_container: Node3D = $JointContainer

# UI References
@onready var current_anim_label: Label = find_child("CurrentAnimLabel", true, false) as Label
@onready var speed_slider: HSlider = find_child("SpeedSlider", true, false) as HSlider
@onready var speed_label: Label = find_child("SpeedLabel", true, false) as Label
@onready var auto_rotate_check: CheckBox = find_child("AutoRotateCheck", true, false) as CheckBox
@onready var skeleton_check: CheckBox = find_child("SkeletonCheck", true, false) as CheckBox

var anim_player: AnimationPlayer = null
var skeleton: Skeleton3D = null

# Camera control state
var is_dragging: bool = false
var is_panning: bool = false
var auto_rotate: bool = false
var auto_rotate_speed: float = 18.0 # deg/sec
var mouse_sensitivity: float = 0.004
var zoom_speed: float = 0.4
var min_zoom: float = 1.2
var max_zoom: float = 6.5
var target_zoom: float = 3.2
var is_paused: bool = false
var saved_speed: float = 1.0

# Lighting Presets
enum LightPreset { SURYA_DAWN, HIGH_NOON, TWILIGHT_TAPAS, AGNI_FORGE }
var current_preset: LightPreset = LightPreset.SURYA_DAWN

func _ready() -> void:
	anim_player = _find_animation_player(veer_instance)
	skeleton = _find_skeleton(veer_instance)

	if anim_player:
		anim_player.playback_default_blend_time = 0.18
		play_animation("idle")

	# Setup Camera
	spring_arm.spring_length = target_zoom
	camera_pivot.position = Vector3(0, 1.15, 0) # Focus at chest level

	# Apply Initial Lighting Preset
	apply_lighting_preset(LightPreset.SURYA_DAWN)

	# Wire UI Buttons
	_setup_ui_connections()

func _setup_ui_connections() -> void:
	# Animation Buttons map
	var anim_buttons = {
		# Locomotion
		"BtnIdle": "idle",
		"BtnWalk": "walk",
		"BtnRun": "run",
		"BtnSprint": "sprint",
		"BtnTurn": "turn",

		# Combat & Defense
		"BtnAtk1": "attack_light_1",
		"BtnAtk2": "attack_light_2",
		"BtnFinisher": "attack_heavy_finisher",
		"BtnCombo": "combo",
		"BtnBlock": "block",
		"BtnParry": "parry",
		"BtnHit": "hit_reaction",

		# Actions & Agility
		"BtnJump": "jump",
		"BtnFall": "fall",
		"BtnLand": "landing",
		"BtnDodge": "dodge",
		"BtnInteract": "interact",

		# Ceremonial
		"BtnVictory": "victory",
		"BtnDefeat": "defeat",
	}

	for btn_name in anim_buttons:
		var btn = find_child(btn_name, true, false)
		if btn is Button:
			var a_name = anim_buttons[btn_name]
			btn.pressed.connect(func(): play_animation(a_name))

	# Lighting Preset Buttons
	var btn_dawn = find_child("BtnDawn", true, false)
	var btn_noon = find_child("BtnNoon", true, false)
	var btn_twilight = find_child("BtnTwilight", true, false)
	var btn_forge = find_child("BtnForge", true, false)

	if btn_dawn: btn_dawn.pressed.connect(func(): apply_lighting_preset(LightPreset.SURYA_DAWN))
	if btn_noon: btn_noon.pressed.connect(func(): apply_lighting_preset(LightPreset.HIGH_NOON))
	if btn_twilight: btn_twilight.pressed.connect(func(): apply_lighting_preset(LightPreset.TWILIGHT_TAPAS))
	if btn_forge: btn_forge.pressed.connect(func(): apply_lighting_preset(LightPreset.AGNI_FORGE))

	# Camera Focus Preset Buttons
	var btn_focus_head = find_child("BtnFocusHead", true, false)
	var btn_focus_body = find_child("BtnFocusBody", true, false)
	var btn_focus_weapon = find_child("BtnFocusWeapon", true, false)

	if btn_focus_head:
		btn_focus_head.pressed.connect(func():
			camera_pivot.position = Vector3(0, 1.70, 0)
			target_zoom = 1.6
		)
	if btn_focus_body:
		btn_focus_body.pressed.connect(func():
			camera_pivot.position = Vector3(0, 1.15, 0)
			target_zoom = 3.4
		)
	if btn_focus_weapon:
		btn_focus_weapon.pressed.connect(func():
			camera_pivot.position = Vector3(0.55, 1.45, 0.25)
			target_zoom = 1.8
		)

	# Play / Pause Toggle
	var btn_pause = find_child("BtnPause", true, false)
	if btn_pause:
		btn_pause.pressed.connect(func():
			is_paused = not is_paused
			if anim_player:
				if is_paused:
					saved_speed = anim_player.speed_scale
					anim_player.speed_scale = 0.0
					btn_pause.text = "Resume"
				else:
					anim_player.speed_scale = saved_speed if saved_speed > 0 else 1.0
					btn_pause.text = "Pause"
		)

	# Speed Slider
	if speed_slider:
		speed_slider.value_changed.connect(_on_speed_changed)

	# Toggles
	if auto_rotate_check:
		auto_rotate_check.toggled.connect(func(val): auto_rotate = val)
	if skeleton_check:
		skeleton_check.toggled.connect(_on_skeleton_toggled)

	# Return Button
	var btn_return = find_child("BtnReturn", true, false)
	if btn_return:
		btn_return.pressed.connect(_return_to_chamber)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT or event.button_index == MOUSE_BUTTON_RIGHT:
			is_dragging = event.pressed
		elif event.button_index == MOUSE_BUTTON_MIDDLE:
			is_panning = event.pressed
		elif event.button_index == MOUSE_BUTTON_WHEEL_UP:
			target_zoom = max(min_zoom, target_zoom - zoom_speed)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			target_zoom = min(max_zoom, target_zoom + zoom_speed)

	elif event is InputEventMouseMotion:
		if is_dragging:
			camera_pivot.rotation.y -= event.relative.x * mouse_sensitivity
			camera_pivot.rotation.x -= event.relative.y * mouse_sensitivity
			camera_pivot.rotation.x = clamp(camera_pivot.rotation.x, deg_to_rad(-65.0), deg_to_rad(45.0))
		elif is_panning:
			camera_pivot.position.y += event.relative.y * 0.005
			camera_pivot.position.y = clamp(camera_pivot.position.y, 0.4, 2.2)

	elif event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_ESCAPE:
			_return_to_chamber()

func _process(delta: float) -> void:
	# Auto-Rotate
	if auto_rotate and not is_dragging:
		camera_pivot.rotation.y += deg_to_rad(auto_rotate_speed) * delta

	# Smooth Zoom
	spring_arm.spring_length = lerp(spring_arm.spring_length, target_zoom, 10.0 * delta)

	# Update Skeleton Joint Markers if active
	if skeleton and joint_container and joint_container.visible:
		_update_joint_markers()

func play_animation(anim_name: String) -> void:
	if not anim_player:
		anim_player = _find_animation_player(self)
	if not anim_player:
		return

	var actual_name = ""
	for a in anim_player.get_animation_list():
		if a == anim_name or a.ends_with("/" + anim_name) or a.ends_with(anim_name):
			actual_name = a
			break

	if actual_name.is_empty():
		return

	anim_player.play(actual_name, 0.18)
	if is_paused:
		is_paused = false
		var btn_pause = find_child("BtnPause", true, false)
		if btn_pause: btn_pause.text = "Pause"
		if speed_slider: anim_player.speed_scale = speed_slider.value

	if current_anim_label:
		current_anim_label.text = "ANIMATION: " + anim_name.to_upper().replace("_", " ")

func _on_speed_changed(val: float) -> void:
	saved_speed = val
	if anim_player and not is_paused:
		anim_player.speed_scale = val
	if speed_label:
		speed_label.text = "SPEED: %.2fx" % val

func apply_lighting_preset(preset: LightPreset) -> void:
	current_preset = preset

	if not sun_light:
		sun_light = get_node_or_null("Lights/DirectionalLight3D")
	if not rim_light:
		rim_light = get_node_or_null("Lights/RimLight3D")
	if not fill_light:
		fill_light = get_node_or_null("Lights/FillLight3D")
	if not under_light:
		under_light = get_node_or_null("Lights/UnderLight3D")
	if not world_env:
		world_env = get_node_or_null("WorldEnvironment")

	if not sun_light or not rim_light or not under_light:
		return

	match preset:
		LightPreset.SURYA_DAWN:
			sun_light.rotation_degrees = Vector3(-32.0, 45.0, 0.0)
			sun_light.light_color = Color(1.0, 0.88, 0.65)
			sun_light.light_energy = 1.95
			rim_light.light_color = Color(1.0, 0.92, 0.75)
			rim_light.light_energy = 1.4
			if fill_light:
				fill_light.light_color = Color(0.85, 0.75, 0.95)
				fill_light.light_energy = 1.0
			under_light.light_color = Color(1.0, 0.65, 0.2)
			under_light.light_energy = 0.04
			if world_env and world_env.environment:
				world_env.environment.background_energy_multiplier = 1.05
				world_env.environment.ambient_light_color = Color(0.35, 0.30, 0.28)

		LightPreset.HIGH_NOON:
			sun_light.rotation_degrees = Vector3(-75.0, 20.0, 0.0)
			sun_light.light_color = Color(1.0, 0.98, 0.92)
			sun_light.light_energy = 2.2
			rim_light.light_color = Color(1.0, 0.88, 0.7)
			rim_light.light_energy = 0.9
			if fill_light:
				fill_light.light_color = Color(0.8, 0.85, 0.95)
				fill_light.light_energy = 1.1
			under_light.light_energy = 0.0
			if world_env and world_env.environment:
				world_env.environment.background_energy_multiplier = 1.2
				world_env.environment.ambient_light_color = Color(0.32, 0.30, 0.30)

		LightPreset.TWILIGHT_TAPAS:
			sun_light.rotation_degrees = Vector3(-18.0, -110.0, 0.0)
			sun_light.light_color = Color(0.45, 0.60, 1.0)
			sun_light.light_energy = 1.4
			rim_light.light_color = Color(0.0, 0.95, 1.0)
			rim_light.light_energy = 2.4
			if fill_light:
				fill_light.light_color = Color(0.9, 0.45, 0.25)
				fill_light.light_energy = 1.1
			under_light.light_energy = 0.3
			if world_env and world_env.environment:
				world_env.environment.background_energy_multiplier = 0.8
				world_env.environment.ambient_light_color = Color(0.22, 0.20, 0.32)

		LightPreset.AGNI_FORGE:
			sun_light.rotation_degrees = Vector3(-40.0, 150.0, 0.0)
			sun_light.light_color = Color(0.75, 0.25, 0.10)
			sun_light.light_energy = 1.2
			rim_light.light_color = Color(1.0, 0.55, 0.15)
			rim_light.light_energy = 2.0
			if fill_light:
				fill_light.light_color = Color(0.9, 0.35, 0.1)
				fill_light.light_energy = 1.5
			under_light.light_color = Color(1.0, 0.45, 0.0)
			under_light.light_energy = 3.5
			if world_env and world_env.environment:
				world_env.environment.background_energy_multiplier = 0.75
				world_env.environment.ambient_light_color = Color(0.30, 0.12, 0.06)

func _on_skeleton_toggled(active: bool) -> void:
	if not joint_container:
		return
	joint_container.visible = active
	if active and skeleton:
		_create_joint_markers()

func _create_joint_markers() -> void:
	for c in joint_container.get_children():
		c.queue_free()

	if not skeleton:
		return

	var marker_mat = StandardMaterial3D.new()
	marker_mat.albedo_color = Color(0.0, 1.0, 0.8)
	marker_mat.emission_enabled = true
	marker_mat.emission = Color(0.0, 1.0, 0.8)
	marker_mat.emission_energy_multiplier = 2.0

	var sphere_mesh = SphereMesh.new()
	sphere_mesh.radius = 0.035
	sphere_mesh.height = 0.07

	for i in range(skeleton.get_bone_count()):
		var mi = MeshInstance3D.new()
		mi.mesh = sphere_mesh
		mi.material_override = marker_mat
		mi.name = "Joint_" + str(i)
		joint_container.add_child(mi)

func _update_joint_markers() -> void:
	if not skeleton or not joint_container:
		return

	for i in range(skeleton.get_bone_count()):
		var mi = joint_container.get_node_or_null("Joint_" + str(i)) as MeshInstance3D
		if mi:
			var bone_transform = skeleton.global_transform * skeleton.get_bone_global_pose(i)
			mi.global_position = bone_transform.origin

func _return_to_chamber() -> void:
	get_tree().change_scene_to_file("res://scenes/levels/TestChamber3D.tscn")

func _find_animation_player(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer:
		return node
	for child in node.get_children():
		var ap = _find_animation_player(child)
		if ap:
			return ap
	return null

func _find_skeleton(node: Node) -> Skeleton3D:
	if node is Skeleton3D:
		return node
	for child in node.get_children():
		var s = _find_skeleton(child)
		if s:
			return s
	return null
