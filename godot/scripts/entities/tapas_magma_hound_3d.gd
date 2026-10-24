extends CharacterBody3D
class_name TapasMagmaHound3D

## Tapas Magma Hound AI for Chapter VI Tapoloka
## Fast quadrupedal volcanic predator with magma spit and pouncing bite leaps.

const CombatMath = preload("res://scripts/domain/combat_math.gd")

enum State {
	STALK,
	MAGMA_SPIT_TELEGRAPH,
	MAGMA_SPIT_RELEASE,
	POUNCE_TELEGRAPH,
	POUNCE_EXECUTE,
	STAGGERED,
	DEFEATED
}

@export var max_health: int = 90
@export var current_health: int = 90
@export var spit_damage: int = 20
@export var pounce_damage: int = 26
@export var perception_radius: float = 24.0
@export var attack_reach: float = 4.0

var current_state: State = State.STALK
var poise: RefCounted = null
var target_player: Node3D = null
var state_timer: float = 0.0

@onready var visual_mesh: Node3D = $VisualMesh
@onready var pounce_hitbox: Area3D = $PounceHitbox
@onready var hound_light: OmniLight3D = $HoundLight

signal hound_defeated(hound: CharacterBody3D)
signal spit_fired(target: Node3D, damage: int)
signal pounce_hit(target: Node3D, damage: int)

func _init() -> void:
	add_to_group("enemies")
	poise = CombatMath.PoiseData.new(30.0, 1.8)
	collision_layer = 4 # Layer 3: Enemies
	collision_mask = 3  # Layer 1: Env, Layer 2: Player

func _ready() -> void:
	current_health = max_health
	if pounce_hitbox:
		pounce_hitbox.monitoring = false
		pounce_hitbox.body_entered.connect(_on_pounce_hitbox_body_entered)

func _physics_process(delta: float) -> void:
	if current_state == State.DEFEATED:
		return

	if not target_player:
		var players = get_tree().get_nodes_in_group("player") if is_inside_tree() else []
		if players.size() > 0:
			target_player = players[0] as Node3D

	if poise and poise.has_method("update"):
		poise.update(delta)

	match current_state:
		State.STALK:
			_process_stalk(delta)
		State.MAGMA_SPIT_TELEGRAPH:
			_process_spit_telegraph(delta)
		State.MAGMA_SPIT_RELEASE:
			_process_spit_release(delta)
		State.POUNCE_TELEGRAPH:
			_process_pounce_telegraph(delta)
		State.POUNCE_EXECUTE:
			_process_pounce_execute(delta)
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

func _process_stalk(delta: float) -> void:
	state_timer += delta

	if not target_player or not is_instance_valid(target_player):
		velocity = velocity.move_toward(Vector3.ZERO, 6.0 * delta)
		return

	var my_pos = _get_entity_pos(self)
	var player_pos = _get_entity_pos(target_player)
	var dist = my_pos.distance_to(player_pos)

	if dist > perception_radius:
		velocity = velocity.move_toward(Vector3.ZERO, 6.0 * delta)
		return

	_safe_look_at(player_pos)
	var dir = (player_pos - my_pos).normalized() if dist > 0.001 else Vector3.FORWARD

	if dist <= attack_reach:
		velocity = Vector3.ZERO
		current_state = State.POUNCE_TELEGRAPH
		state_timer = 0.0
	elif dist <= 12.0 and state_timer >= 1.6:
		velocity = Vector3.ZERO
		current_state = State.MAGMA_SPIT_TELEGRAPH
		state_timer = 0.0
	else:
		velocity = dir * 5.0

func _process_spit_telegraph(delta: float) -> void:
	state_timer += delta
	if target_player and is_instance_valid(target_player):
		_safe_look_at(_get_entity_pos(target_player))

	if hound_light:
		hound_light.light_energy = 3.0
		hound_light.light_color = Color(1.0, 0.5, 0.05, 1.0)

	if state_timer >= 0.5:
		current_state = State.MAGMA_SPIT_RELEASE
		state_timer = 0.0
		_execute_spit()

func _execute_spit() -> void:
	if target_player and is_instance_valid(target_player):
		var dist = _get_entity_pos(self).distance_to(_get_entity_pos(target_player))
		if dist <= perception_radius:
			if target_player.has_method("take_damage"):
				target_player.take_damage(spit_damage)
			spit_fired.emit(target_player, spit_damage)

func _process_spit_release(delta: float) -> void:
	state_timer += delta
	if state_timer >= 0.4:
		if hound_light:
			hound_light.light_energy = 1.2
		current_state = State.STALK
		state_timer = 0.0

func _process_pounce_telegraph(delta: float) -> void:
	state_timer += delta
	if target_player and is_instance_valid(target_player):
		_safe_look_at(_get_entity_pos(target_player))

	if state_timer >= 0.4:
		current_state = State.POUNCE_EXECUTE
		state_timer = 0.0
		if pounce_hitbox:
			pounce_hitbox.monitoring = true

		if target_player and is_instance_valid(target_player):
			var dir = (_get_entity_pos(target_player) - _get_entity_pos(self)).normalized()
			velocity = dir * 14.0 + Vector3.UP * 3.0

func _process_pounce_execute(delta: float) -> void:
	state_timer += delta
	velocity = velocity.move_toward(Vector3.ZERO, 15.0 * delta)

	if state_timer >= 0.45:
		if pounce_hitbox:
			pounce_hitbox.monitoring = false
		current_state = State.STALK
		state_timer = 0.0

func _process_stagger(delta: float) -> void:
	state_timer += delta
	velocity = velocity.move_toward(Vector3.ZERO, 12.0 * delta)
	if state_timer >= 1.2:
		if poise:
			poise.is_staggered = false
			poise.current = poise.max_poise
		current_state = State.STALK
		state_timer = 0.0

func _on_pounce_hitbox_body_entered(body: Node3D) -> void:
	if not is_instance_valid(body) or body == self:
		return
	if body.is_in_group("player") and body.has_method("take_damage"):
		body.take_damage(pounce_damage)
		pounce_hit.emit(body, pounce_damage)

func take_hit(damage: int, poise_dmg: float = 20.0, _is_parryable: bool = false, impact_dir: Vector3 = Vector3.ZERO) -> void:
	if current_state == State.DEFEATED:
		return

	current_health = max(0, current_health - damage)

	var poise_broken = false
	if poise and poise.has_method("take_poise_damage"):
		poise_broken = poise.take_poise_damage(poise_dmg)

	if poise_broken:
		current_state = State.STAGGERED
		state_timer = 0.0
		if pounce_hitbox:
			pounce_hitbox.monitoring = false

	if impact_dir != Vector3.ZERO:
		velocity = impact_dir.normalized() * 5.0

	if current_health <= 0:
		_die()

func _die() -> void:
	current_state = State.DEFEATED
	velocity = Vector3.ZERO
	if pounce_hitbox:
		pounce_hitbox.monitoring = false
	hound_defeated.emit(self)
	if is_inside_tree():
		var tween = create_tween()
		tween.tween_property(self, "scale", Vector3.ZERO, 0.35).set_trans(Tween.TRANS_BACK)
		tween.tween_callback(queue_free)
	else:
		queue_free()
