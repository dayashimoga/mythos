extends Area3D
class_name AstralGlyph3D

## Astral Levitation Glyph of Maharloka
## Applies upward vertical levitation impulse to the player while standing on the glyph.

@export var glyph_id: String = "glyph_1"
@export var is_active: bool = true
@export var levitation_speed: float = 12.0
@export var max_height_boost: float = 18.0

var _overlapping_bodies: Array[Node3D] = []
var _visual_mesh: Node3D = null
var _glyph_light: OmniLight3D = null

signal glyph_activated(glyph_id: String)
signal glyph_deactivated(glyph_id: String)
signal body_levitated(body: Node3D, speed: float)

func _init() -> void:
	add_to_group("astral_glyphs")
	collision_layer = 16 # Layer 5: Interactables
	collision_mask = 6   # Layer 2: Player, Layer 3: Enemies

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)

	if has_node("VisualMesh"):
		_visual_mesh = get_node("VisualMesh")
	if has_node("GlyphLight"):
		_glyph_light = get_node("GlyphLight")

	_update_visuals()

func _physics_process(_delta: float) -> void:
	if not is_active:
		return

	for body in _overlapping_bodies:
		if is_instance_valid(body) and body is CharacterBody3D:
			body.velocity.y = max(body.velocity.y, levitation_speed)
			body_levitated.emit(body, levitation_speed)

func set_active(active: bool) -> void:
	is_active = active
	_update_visuals()
	if is_active:
		glyph_activated.emit(glyph_id)
	else:
		glyph_deactivated.emit(glyph_id)

func _on_body_entered(body: Node3D) -> void:
	if not _overlapping_bodies.has(body):
		_overlapping_bodies.append(body)

	if is_active and is_instance_valid(body) and body is CharacterBody3D:
		body.velocity.y = max(body.velocity.y, levitation_speed)
		body_levitated.emit(body, levitation_speed)

func _on_body_exited(body: Node3D) -> void:
	_overlapping_bodies.erase(body)

func _update_visuals() -> void:
	if _glyph_light:
		_glyph_light.visible = is_active
		if is_active:
			_glyph_light.light_color = Color(0.4, 0.7, 1.0, 1.0)
			_glyph_light.light_energy = 3.5
