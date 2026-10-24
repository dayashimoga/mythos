extends CharacterBody3D
class_name ScriptureGolem3D

## Scripture Golem AI for Chapter V Maharloka
## Heavy stone-and-manuscript guardian with stone tablet slam and defensive codex block.

const CombatMath = preload("res://scripts/domain/combat_math.gd")

enum State {
	PATROL,
	CHASE,
	TABLET_SLAM_TELEGRAPH,
	TABLET_SLAM_IMPACT,
	MANUSCRIPT_GUARD,
	STAGGERED,
	DEFEATED
}

@export var max_health: int = 260
@export var current_health: int = 260
@export var slam_damage: int = 34
@export var perception_radius: float = 20.0
@export var attack_reach: float = 3.6
@export var guard_damage_reduction: float = 0.70

var current_state: State = State.PATROL
var poise: RefCounted = null
var target_player: Node3D = null
var state_timer: float = 0.0

@onready var visual_mesh: Node3D = $VisualMesh
@onready var slam_hitbox: Area3D = $SlamHitbox
@onready var golem_light: OmniLight3D = $GolemLight

signal golem_defeated(golem: CharacterBody3D)
signal tablet_slammed(target: Node3D, damage: int)

func _init() -> void:
	add_to_group("enemies")
	poise = CombatMath.PoiseData.new(100.0, 3.0)
	collision_layer = 4 # Layer 3: Enemies
	collision_mask = 3  # Layer 1: Env, Layer 2: Player

func _ready() -> void:
	current_health = max_health
	if slam_hitbox:
		slam_hitbox.monitoring = false
		slam_hitbox.body_entered.connect(_on_slam_hitbox_body_entered)

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
		State.TABLET_SLAM_TELEGRAPH:
			_process_slam_telegraph(delta)
		State.TABLET_SLAM_IMPACT:
			_process_slam_impact(delta)
		State.MANUSCRIPT_GUARD:
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
	velocity = velocity.move_toward(Vector3.ZERO, 6.0 * delta)

	if not target_player or not is_instance_valid(target_player):
		return

	var my_pos = _get_entity_pos(self)
	var player_pos = _get_entity_pos(target_player)
	var dist = my_pos.distance_to(player_pos)

	if dist <= perception_radius:
		current_state = State.CHASE
		state_timer = 0.0

func _process_chase(delta: float) -> void:
	state_timer += delta
	if not target_player or not is_instance_valid(target_player):
		current_state = State.PATROL
		return

	var my_pos = _get_entity_pos(self)
	var player_pos = _get_entity_pos(target_player)
	var dist = my_pos.distance_to(player_pos)

	if dist > perception_radius * 1.5:
		current_state = State.PATROL
		return

	_safe_look_at(player_pos)
	var dir = (player_pos - my_pos).normalized() if dist > 0.001 else Vector3.FORWARD

	if dist <= attack_reach:
		velocity = Vector3.ZERO
		_start_slam_telegraph()
	else:
		velocity = dir * 4.0

func _start_slam_telegraph() -> void:
	current_state = State.TABLET_SLAM_TELEGRAPH
	state_timer = 0.0
	velocity = Vector3.ZERO
	if golem_light:
		golem_light.light_energy = 3.5
		golem_light.light_color = Color(0.2, 0.5, 1.0, 1.0)

func _process_slam_telegraph(delta: float) -> void:
	state_timer += delta
	if target_player and is_instance_valid(target_player):
		_safe_look_at(_get_entity_pos(target_player))

	if state_timer >= 0.7:
		_execute_slam_impact()

func _execute_slam_impact() -> void:
	current_state = State.TABLET_SLAM_IMPACT
	state_timer = 0.0
	if slam_hitbox:
		slam_hitbox.monitoring = true

func _process_slam_impact(delta: float) -> void:
	state_timer += delta
	if state_timer >= 0.35:
		if slam_hitbox:
			slam_hitbox.monitoring = false
		if golem_light:
			golem_light.light_energy = 1.0
		# Alternate into guard stance or back to chase
		if randf() > 0.4:
			current_state = State.MANUSCRIPT_GUARD
			state_timer = 0.0
		else:
			current_state = State.CHASE
			state_timer = 0.0

func _process_guard(delta: float) -> void:
	state_timer += delta
	velocity = velocity.move_toward(Vector3.ZERO, 8.0 * delta)
	if target_player and is_instance_valid(target_player):
		_safe_look_at(_get_entity_pos(target_player))

	if state_timer >= 1.5:
		current_state = State.CHASE
		state_timer = 0.0

func _process_stagger(delta: float) -> void:
	state_timer += delta
	velocity = velocity.move_toward(Vector3.ZERO, 10.0 * delta)
	if state_timer >= 1.4:
		if poise:
			poise.is_broken = false
			poise.current = poise.max_poise
		current_state = State.CHASE
		state_timer = 0.0

func _on_slam_hitbox_body_entered(body: Node3D) -> void:
	if not is_instance_valid(body) or body == self:
		return
	if body.is_in_group("player") and body.has_method("take_damage"):
		body.take_damage(slam_damage)
		tablet_slammed.emit(body, slam_damage)

func take_hit(damage: int, poise_dmg: float = 20.0, _is_parryable: bool = false, impact_dir: Vector3 = Vector3.ZERO) -> void:
	if current_state == State.DEFEATED:
		return

	var actual_damage = damage
	if current_state == State.MANUSCRIPT_GUARD:
		actual_damage = int(damage * (1.0 - guard_damage_reduction))

	current_health = max(0, current_health - actual_damage)

	if poise:
		var broken = poise.damage(poise_dmg)
		if broken:
			current_state = State.STAGGERED
			state_timer = 0.0
			if slam_hitbox:
				slam_hitbox.monitoring = false

	if impact_dir != Vector3.ZERO and current_state != State.MANUSCRIPT_GUARD:
		velocity = impact_dir.normalized() * 3.0

	if current_health <= 0:
		_die()

func _die() -> void:
	current_state = State.DEFEATED
	velocity = Vector3.ZERO
	if slam_hitbox:
		slam_hitbox.monitoring = false
	golem_defeated.emit(self)
	if is_inside_tree():
		var tween = create_tween()
		tween.tween_property(self, "scale", Vector3.ZERO, 0.5).set_trans(Tween.TRANS_BACK)
		tween.tween_callback(queue_free)
	else:
		queue_free()
