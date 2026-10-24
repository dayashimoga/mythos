extends Area3D
class_name MagmaGeyser3D

## Magma Pressure Geyser of Tapoloka
## Cycles through pressure build-up and explosive thermal eruptions, launching entities vertically.

enum GeyserState {
	DORMANT,
	PRESSURE_BUILDUP,
	ERUPTING
}

@export var geyser_id: String = "geyser_1"
@export var eruption_force: float = 18.0
@export var eruption_damage: int = 15
@export var dormant_duration: float = 2.5
@export var buildup_duration: float = 1.0
@export var eruption_duration: float = 1.2

var current_state: GeyserState = GeyserState.DORMANT
var state_timer: float = 0.0
var _overlapping_bodies: Array[Node3D] = []

var _visual_mesh: Node3D = null
var _geyser_light: OmniLight3D = null

signal geyser_erupted(geyser_id: String, force: float)
signal body_launched(body: Node3D, force: float)

func _init() -> void:
	add_to_group("geysers")
	collision_layer = 16 # Layer 5: Interactables
	collision_mask = 6   # Layer 2: Player, Layer 3: Enemies

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)

	if has_node("VisualMesh"):
		_visual_mesh = get_node("VisualMesh")
	if has_node("GeyserLight"):
		_geyser_light = get_node("GeyserLight")

	_update_visuals()

func _physics_process(delta: float) -> void:
	state_timer += delta

	match current_state:
		GeyserState.DORMANT:
			if state_timer >= dormant_duration:
				current_state = GeyserState.PRESSURE_BUILDUP
				state_timer = 0.0
				_update_visuals()

		GeyserState.PRESSURE_BUILDUP:
			if state_timer >= buildup_duration:
				_trigger_eruption()

		GeyserState.ERUPTING:
			# Continuously apply upward velocity during eruption
			for body in _overlapping_bodies:
				if is_instance_valid(body) and body is CharacterBody3D:
					body.velocity.y = max(body.velocity.y, eruption_force)
					body_launched.emit(body, eruption_force)

			if state_timer >= eruption_duration:
				current_state = GeyserState.DORMANT
				state_timer = 0.0
				_update_visuals()

func _trigger_eruption() -> void:
	current_state = GeyserState.ERUPTING
	state_timer = 0.0
	_update_visuals()
	geyser_erupted.emit(geyser_id, eruption_force)

	for body in _overlapping_bodies:
		if is_instance_valid(body) and body is CharacterBody3D:
			body.velocity.y = max(body.velocity.y, eruption_force)
			body_launched.emit(body, eruption_force)

func _on_body_entered(body: Node3D) -> void:
	if not _overlapping_bodies.has(body):
		_overlapping_bodies.append(body)

	if current_state == GeyserState.ERUPTING and is_instance_valid(body) and body is CharacterBody3D:
		body.velocity.y = max(body.velocity.y, eruption_force)
		body_launched.emit(body, eruption_force)

func _on_body_exited(body: Node3D) -> void:
	_overlapping_bodies.erase(body)

func _update_visuals() -> void:
	if not _geyser_light:
		return

	match current_state:
		GeyserState.DORMANT:
			_geyser_light.light_color = Color(1.0, 0.35, 0.1, 1.0)
			_geyser_light.light_energy = 1.0
		GeyserState.PRESSURE_BUILDUP:
			_geyser_light.light_color = Color(1.0, 0.6, 0.1, 1.0)
			_geyser_light.light_energy = 3.0
		GeyserState.ERUPTING:
			_geyser_light.light_color = Color(1.0, 0.85, 0.3, 1.0)
			_geyser_light.light_energy = 6.0
