extends CharacterBody3D
class_name NagaConstrictor3D

const CombatMath = preload("res://scripts/domain/combat_math.gd")

enum State {
	SERPENTINE_STALK,
	LEAP_STRIKE,
	TWIN_SLASH,
	STAGGERED,
	DEFEATED
}

@export var max_health: int = 110
@export var current_health: int = 110
@export var melee_damage: int = 26
@export var perception_radius: float = 20.0
@export var attack_reach: float = 3.2

var current_state: State = State.SERPENTINE_STALK
var poise: RefCounted = null
var target_player: Node3D = null
var state_timer: float = 0.0

@onready var visual_mesh: Node3D = $VisualMesh
@onready var strike_hitbox: Area3D = $StrikeHitbox

var anim_player: AnimationPlayer = null

signal constrictor_defeated(constrictor: CharacterBody3D)
signal strike_connected(target: Node3D, damage: int)

func _find_anim_player(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer:
		return node
	for child in node.get_children():
		var found = _find_anim_player(child)
		if found:
			return found
	return null

func _play_anim(anim_name: String, blend_time: float = 0.15) -> void:
	if not anim_player:
		anim_player = _find_anim_player(self)
	if anim_player and anim_player.has_animation(anim_name):
		if anim_player.current_animation != anim_name:
			anim_player.play(anim_name, blend_time)

func _init() -> void:
	add_to_group("enemies")
	poise = CombatMath.PoiseData.new(65.0, 2.2)
	collision_layer = 4 # Layer 3: Enemies
	collision_mask = 3  # Layer 1: Env, Layer 2: Player

func _ready() -> void:
	current_health = max_health
	anim_player = _find_anim_player(self)
	if anim_player:
		_play_anim("idle")
	if strike_hitbox:
		strike_hitbox.monitoring = false
		strike_hitbox.body_entered.connect(_on_strike_hitbox_body_entered)

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
		State.SERPENTINE_STALK:
			_process_stalk(delta)
		State.LEAP_STRIKE:
			_process_leap(delta)
		State.TWIN_SLASH:
			_process_twin_slash(delta)
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
	_play_anim("stalk")
	state_timer += delta
	if not target_player or not is_instance_valid(target_player):
		velocity = velocity.move_toward(Vector3.ZERO, 10.0 * delta)
		return

	var my_pos = _get_entity_pos(self)
	var player_pos = _get_entity_pos(target_player)
	var dist = my_pos.distance_to(player_pos)

	if dist > perception_radius:
		velocity = velocity.move_toward(Vector3.ZERO, 8.0 * delta)
		return

	_safe_look_at(player_pos)

	var dir = (player_pos - my_pos).normalized() if dist > 0.001 else Vector3.FORWARD
	velocity = dir * 5.5

	if dist <= attack_reach:
		current_state = State.TWIN_SLASH
		state_timer = 0.0
		velocity = Vector3.ZERO
	elif dist <= 9.0 and state_timer >= 1.6:
		current_state = State.LEAP_STRIKE
		state_timer = 0.0
		velocity = dir * 12.0

func _process_leap(delta: float) -> void:
	_play_anim("leap_strike")
	state_timer += delta
	velocity = velocity.move_toward(Vector3.ZERO, 14.0 * delta)

	if strike_hitbox:
		strike_hitbox.monitoring = (state_timer >= 0.15 and state_timer <= 0.45)

	if state_timer >= 0.6:
		if strike_hitbox:
			strike_hitbox.monitoring = false
		current_state = State.SERPENTINE_STALK
		state_timer = 0.0

func _process_twin_slash(delta: float) -> void:
	_play_anim("telegraph")
	state_timer += delta
	velocity = Vector3.ZERO

	if strike_hitbox:
		strike_hitbox.monitoring = (state_timer >= 0.2 and state_timer <= 0.5)

	if state_timer >= 0.7:
		if strike_hitbox:
			strike_hitbox.monitoring = false
		current_state = State.SERPENTINE_STALK
		state_timer = 0.0

func _on_strike_hitbox_body_entered(body: Node3D) -> void:
	if body == self or not is_instance_valid(body):
		return

	if body.is_in_group("player"):
		var attack_spec = CombatMath.AttackSpec.new("naga_constrictor", melee_damage, 35.0, global_position)
		if body.has_method("take_damage_spec"):
			body.take_damage_spec(attack_spec)
		elif body.has_method("take_damage"):
			body.take_damage(melee_damage)
		strike_connected.emit(body, melee_damage)

func take_damage_spec(attack_spec: CombatMath.AttackSpec) -> CombatMath.CombatHitResult:
	if current_state == State.DEFEATED:
		return CombatMath.CombatHitResult.new()

	var def_spec = CombatMath.DefenseSpec.new("naga_constrictor", global_position, -global_transform.basis.z)
	var res = CombatMath.resolve_attack(attack_spec, def_spec)

	current_health = max(0, current_health - res.damage_dealt)

	var poise_broken = false
	if poise and poise.has_method("take_poise_damage"):
		poise_broken = poise.take_poise_damage(attack_spec.poise_damage)

	if current_health <= 0:
		_die()
	elif poise_broken or res.is_critical:
		current_state = State.STAGGERED
		state_timer = 0.0
		if strike_hitbox:
			strike_hitbox.monitoring = false

	return res

func take_damage(amount: int) -> void:
	if current_state == State.DEFEATED:
		return
	current_health = max(0, current_health - amount)
	if current_health <= 0:
		_die()
	else:
		current_state = State.STAGGERED
		state_timer = 0.0
		if strike_hitbox:
			strike_hitbox.monitoring = false

func _process_stagger(delta: float) -> void:
	_play_anim("stagger")
	state_timer += delta
	velocity = velocity.move_toward(Vector3.ZERO, 15.0 * delta)
	if state_timer >= 1.4:
		current_state = State.SERPENTINE_STALK
		state_timer = 0.0

func _die() -> void:
	current_state = State.DEFEATED
	velocity = Vector3.ZERO
	_play_anim("defeat")
	if strike_hitbox:
		strike_hitbox.monitoring = false
	constrictor_defeated.emit(self)
	if is_inside_tree():
		var tween = create_tween()
		tween.tween_property(self, "scale", Vector3.ZERO, 0.4)
		tween.tween_callback(queue_free)
