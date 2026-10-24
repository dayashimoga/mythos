extends CharacterBody3D
class_name DharmaSentinel3D

## Dharma Sentinel Enemy AI for Chapter VII Satyaloka / Brahmaloka
## Transcendent crystalline guardian armed with divine spear and lotus shield.
## Executes lunging thrust attacks and defensive lotus shield blocks.

const CombatMath = preload("res://scripts/domain/combat_math.gd")

enum State {
	PATROL,
	CHASE,
	SPEAR_THRUST_TELEGRAPH,
	SPEAR_THRUST_EXECUTE,
	LOTUS_GUARD,
	STAGGERED,
	DEFEATED
}

@export var max_health: int = 200
@export var current_health: int = 200
@export var spear_damage: int = 36
@export var perception_radius: float = 22.0
@export var attack_reach: float = 3.6
@export var guard_damage_reduction: float = 0.75

var current_state: State = State.PATROL
var poise: RefCounted = null
var target_player: Node3D = null
var state_timer: float = 0.0
var patrol_center: Vector3 = Vector3.ZERO
var patrol_dir: float = 1.0

@onready var visual_mesh: Node3D = $VisualMesh
@onready var spear_hitbox: Area3D = $SpearHitbox
@onready var sentinel_light: OmniLight3D = $SentinelLight

signal sentinel_defeated(sentinel: CharacterBody3D)
signal spear_hit(target: Node3D, damage: int)
signal shield_blocked()
signal health_changed(current: int, max_hp: int)

func _init() -> void:
	add_to_group("enemies")
	poise = CombatMath.PoiseData.new(90.0, 2.5)
	collision_layer = 4 # Layer 3: Enemies
	collision_mask = 3  # Layer 1: Env, Layer 2: Player

func _ready() -> void:
	current_health = max_health
	patrol_center = global_position if is_inside_tree() else position
	if spear_hitbox:
		spear_hitbox.monitoring = false
		spear_hitbox.body_entered.connect(_on_spear_hitbox_body_entered)

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
		State.PATROL:
			_process_patrol(delta)
		State.CHASE:
			_process_chase(delta)
		State.SPEAR_THRUST_TELEGRAPH:
			_process_telegraph(delta)
		State.SPEAR_THRUST_EXECUTE:
			_process_execute(delta)
		State.LOTUS_GUARD:
			_process_guard(delta)
		State.STAGGERED:
			_process_stagger(delta)

	move_and_slide()

func _get_entity_pos(node: Node3D) -> Vector3:
	return node.global_position if node.is_inside_tree() else node.position

func _safe_look_at(target_pos: Vector3) -> void:
	if is_inside_tree():
		var my_pos = global_position
		var look_target = target_pos
		look_target.y = my_pos.y
		if my_pos.distance_squared_to(look_target) > 0.001:
			look_at(look_target, Vector3.UP)

func _process_patrol(delta: float) -> void:
	state_timer += delta
	var my_pos = _get_entity_pos(self)

	if target_player:
		var player_pos = _get_entity_pos(target_player)
		if my_pos.distance_to(player_pos) <= perception_radius:
			current_state = State.CHASE
			state_timer = 0.0
			return

	if state_timer >= 3.0:
		patrol_dir *= -1.0
		state_timer = 0.0

	velocity.x = patrol_dir * 2.0
	velocity.z = 0.0

func _process_chase(delta: float) -> void:
	if not target_player:
		current_state = State.PATROL
		return

	var my_pos = _get_entity_pos(self)
	var player_pos = _get_entity_pos(target_player)
	var dist = my_pos.distance_to(player_pos)

	if dist > perception_radius * 1.5:
		current_state = State.PATROL
		velocity = Vector3.ZERO
		return

	_safe_look_at(player_pos)
	var dir = (player_pos - my_pos).normalized()
	dir.y = 0.0

	if dist <= attack_reach:
		velocity = Vector3.ZERO
		# Chance of defensive lotus guard if player is close
		if randf() < 0.35:
			current_state = State.LOTUS_GUARD
			state_timer = 0.0
		else:
			current_state = State.SPEAR_THRUST_TELEGRAPH
			state_timer = 0.0
	else:
		velocity.x = dir.x * 4.8
		velocity.z = dir.z * 4.8

func _process_telegraph(delta: float) -> void:
	state_timer += delta
	velocity = Vector3.ZERO
	if target_player:
		_safe_look_at(_get_entity_pos(target_player))

	if sentinel_light:
		sentinel_light.light_color = Color(1.0, 0.8, 0.2, 1.0)
		sentinel_light.light_energy = 4.5

	if state_timer >= 0.6:
		current_state = State.SPEAR_THRUST_EXECUTE
		state_timer = 0.0
		if spear_hitbox:
			spear_hitbox.monitoring = true

func _process_execute(delta: float) -> void:
	state_timer += delta
	# Lunge forward during thrust
	var forward = -transform.basis.z if is_inside_tree() else Vector3.FORWARD
	forward.y = 0.0
	velocity = forward.normalized() * 7.5

	if state_timer >= 0.35:
		current_state = State.CHASE
		state_timer = 0.0
		velocity = Vector3.ZERO
		if spear_hitbox:
			spear_hitbox.monitoring = false
		if sentinel_light:
			sentinel_light.light_color = Color(0.8, 0.9, 1.0, 1.0)
			sentinel_light.light_energy = 2.0

func _process_guard(delta: float) -> void:
	state_timer += delta
	velocity = Vector3.ZERO
	if target_player:
		_safe_look_at(_get_entity_pos(target_player))

	if sentinel_light:
		sentinel_light.light_color = Color(0.5, 0.8, 1.0, 1.0)
		sentinel_light.light_energy = 4.0

	if state_timer >= 1.5:
		current_state = State.SPEAR_THRUST_TELEGRAPH
		state_timer = 0.0

func _process_stagger(delta: float) -> void:
	state_timer += delta
	velocity = velocity.move_toward(Vector3.ZERO, 8.0 * delta)
	if spear_hitbox:
		spear_hitbox.monitoring = false

	if state_timer >= 1.8:
		current_state = State.CHASE
		state_timer = 0.0
		if sentinel_light:
			sentinel_light.light_color = Color(0.8, 0.9, 1.0, 1.0)
			sentinel_light.light_energy = 2.0

func is_blocking() -> bool:
	return current_state == State.LOTUS_GUARD

func _on_spear_hitbox_body_entered(body: Node3D) -> void:
	if body == self:
		return
	if body.is_in_group("player"):
		if body.has_method("take_damage"):
			body.take_damage(spear_damage)
		spear_hit.emit(body, spear_damage)

func take_damage(amount: int, poise_dmg: float = 0.0) -> void:
	if current_state == State.DEFEATED:
		return

	if is_blocking():
		amount = int(amount * (1.0 - guard_damage_reduction))
		shield_blocked.emit()

	current_health = maxi(0, current_health - amount)
	health_changed.emit(current_health, max_health)

	if poise and poise_dmg > 0.0:
		if poise.damage(poise_dmg):
			current_state = State.STAGGERED
			state_timer = 0.0
			velocity = Vector3.ZERO
			if spear_hitbox:
				spear_hitbox.monitoring = false

	if current_health <= 0:
		_die()

func _die() -> void:
	current_state = State.DEFEATED
	velocity = Vector3.ZERO
	if spear_hitbox:
		spear_hitbox.monitoring = false
	sentinel_defeated.emit(self)
	if is_inside_tree():
		var tween = create_tween()
		if tween:
			tween.tween_property(self, "scale", Vector3.ZERO, 0.5)
			tween.tween_callback(queue_free)
		else:
			queue_free()
	else:
		queue_free()
