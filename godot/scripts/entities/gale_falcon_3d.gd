extends CharacterBody3D
class_name GaleFalcon3D

const CombatMath = preload("res://scripts/domain/combat_math.gd")

enum State {
	CIRCLING,
	TELEGRAPH,
	DIVE_ATTACK,
	RECOVERY,
	STAGGERED,
	DEFEATED
}

@export var max_health: int = 50
@export var current_health: int = 50
@export var talon_damage: int = 16
@export var perception_radius: float = 24.0
@export var flight_altitude: float = 8.0

var current_state: State = State.CIRCLING
var poise: RefCounted = null
var target_player: Node3D = null
var circle_angle: float = 0.0
var dive_target: Vector3 = Vector3.ZERO
var state_timer: float = 0.0
var anchor_origin: Vector3 = Vector3.ZERO

@onready var visual_mesh: Node3D = $VisualMesh
@onready var talon_hitbox: Area3D = $TalonHitbox
@onready var telegraph_light: OmniLight3D = $TelegraphLight

signal falcon_defeated(falcon: CharacterBody3D)

func _init() -> void:
	add_to_group("enemies")
	poise = CombatMath.PoiseData.new(30.0, 1.8)
	collision_layer = 4 # Layer 3: Enemies
	collision_mask = 3  # Layers 1 (Env) & 2 (Player)

func _ready() -> void:
	anchor_origin = global_position
	current_health = max_health
	if talon_hitbox:
		talon_hitbox.monitoring = false
		talon_hitbox.body_entered.connect(_on_talon_hit_body)
	if telegraph_light:
		telegraph_light.visible = false

func _physics_process(delta: float) -> void:
	if current_state == State.DEFEATED:
		return

	if not target_player:
		var players = get_tree().get_nodes_in_group("player") if is_inside_tree() else []
		if players.size() > 0:
			target_player = players[0] as Node3D

	if poise:
		poise.update(delta)

	match current_state:
		State.CIRCLING:
			_process_circling(delta)
		State.TELEGRAPH:
			_process_telegraph(delta)
		State.DIVE_ATTACK:
			_process_dive(delta)
		State.RECOVERY:
			_process_recovery(delta)
		State.STAGGERED:
			_process_staggered(delta)

func _process_circling(delta: float) -> void:
	circle_angle += 1.8 * delta
	var radius = 7.0
	var offset = Vector3(cos(circle_angle) * radius, flight_altitude + sin(circle_angle * 2.0) * 1.5, sin(circle_angle) * radius)
	var desired_pos = anchor_origin + offset

	velocity = (desired_pos - global_position) * 4.0
	move_and_slide()

	if target_player:
		var dist = global_position.distance_to(target_player.global_position)
		if dist <= perception_radius:
			state_timer += delta
			if state_timer >= 2.5:
				_start_telegraph()

func _start_telegraph() -> void:
	current_state = State.TELEGRAPH
	state_timer = 0.0
	dive_target = target_player.global_position + Vector3(0, 0.5, 0) if target_player else anchor_origin
	if telegraph_light:
		telegraph_light.visible = true
		telegraph_light.light_energy = 4.0

func _process_telegraph(delta: float) -> void:
	state_timer += delta
	velocity = velocity.lerp(Vector3.ZERO, 5.0 * delta)
	move_and_slide()

	if target_player:
		look_at(target_player.global_position, Vector3.UP)

	if state_timer >= 0.7:
		_start_dive()

func _start_dive() -> void:
	current_state = State.DIVE_ATTACK
	state_timer = 0.0
	if telegraph_light:
		telegraph_light.visible = false
	if talon_hitbox:
		talon_hitbox.monitoring = true

func _process_dive(delta: float) -> void:
	state_timer += delta
	var dir = (dive_target - global_position).normalized()
	velocity = dir * 22.0
	move_and_slide()

	if global_position.distance_to(dive_target) < 1.5 or state_timer >= 1.2:
		_start_recovery()

func _start_recovery() -> void:
	current_state = State.RECOVERY
	state_timer = 0.0
	if talon_hitbox:
		talon_hitbox.monitoring = false

func _process_recovery(delta: float) -> void:
	state_timer += delta
	var return_pos = anchor_origin + Vector3(0, flight_altitude, 0)
	var dir = (return_pos - global_position).normalized()
	velocity = dir * 14.0
	move_and_slide()

	if global_position.distance_to(return_pos) < 2.5 or state_timer >= 2.0:
		current_state = State.CIRCLING
		state_timer = 0.0

func _process_staggered(delta: float) -> void:
	state_timer += delta
	velocity.y -= 9.8 * delta
	move_and_slide()

	if state_timer >= 2.0:
		current_state = State.RECOVERY
		state_timer = 0.0
		if poise:
			poise.current = poise.max_poise

func take_damage(amount: int, poise_dmg: float = 15.0) -> void:
	if current_state == State.DEFEATED:
		return

	var final_dmg = amount
	if current_state == State.STAGGERED:
		final_dmg = int(amount * 1.35)

	current_health = max(0, current_health - final_dmg)

	if poise:
		var broken = poise.take_poise_damage(poise_dmg)
		if broken and current_state != State.STAGGERED:
			current_state = State.STAGGERED
			state_timer = 0.0
			if talon_hitbox:
				talon_hitbox.monitoring = false

	if is_inside_tree() and visual_mesh:
		var tween = create_tween()
		tween.tween_property(visual_mesh, "scale", Vector3(1.2, 0.8, 1.2), 0.08)
		tween.tween_property(visual_mesh, "scale", Vector3.ONE, 0.12)

	if current_health <= 0:
		_die()

func _on_talon_hit_body(body: Node3D) -> void:
	if body.is_in_group("player") and body.has_method("take_damage"):
		body.take_damage(talon_damage, 20.0)

func _die() -> void:
	current_state = State.DEFEATED
	if talon_hitbox:
		talon_hitbox.monitoring = false
	falcon_defeated.emit(self)

	if is_inside_tree() and visual_mesh:
		var tween = create_tween()
		tween.tween_property(visual_mesh, "scale", Vector3(0.01, 0.01, 0.01), 0.6)
		tween.tween_callback(queue_free)
	elif is_inside_tree():
		queue_free()
