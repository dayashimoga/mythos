extends CharacterBody3D
class_name AgniBerserker3D

## Agni Berserker Enemy AI for Chapter VI Tapoloka
## Aggressive flame warrior wielding twin obsidian flame blades with sprint rush and whirlwind attacks.

const CombatMath = preload("res://scripts/domain/combat_math.gd")

enum State {
	PATROL,
	CHASE_RUSH,
	TWIN_SLASH_TELEGRAPH,
	TWIN_SLASH_EXECUTE,
	FLAME_WHIRLWIND,
	STAGGERED,
	DEFEATED
}

@export var max_health: int = 140
@export var current_health: int = 140
@export var slash_damage: int = 30
@export var whirlwind_damage: int = 36
@export var perception_radius: float = 22.0
@export var attack_reach: float = 3.2

var current_state: State = State.PATROL
var poise: RefCounted = null
var target_player: Node3D = null
var state_timer: float = 0.0

@onready var visual_mesh: Node3D = $VisualMesh
@onready var slash_hitbox: Area3D = $SlashHitbox
@onready var flame_light: OmniLight3D = $FlameLight

signal berserker_defeated(berserker: CharacterBody3D)
signal slash_hit(target: Node3D, damage: int)

func _init() -> void:
	add_to_group("enemies")
	poise = CombatMath.PoiseData.new(60.0, 2.2)
	collision_layer = 4 # Layer 3: Enemies
	collision_mask = 3  # Layer 1: Env, Layer 2: Player

func _ready() -> void:
	current_health = max_health
	if slash_hitbox:
		slash_hitbox.monitoring = false
		slash_hitbox.body_entered.connect(_on_slash_hitbox_body_entered)

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
		State.PATROL:
			_process_patrol(delta)
		State.CHASE_RUSH:
			_process_chase(delta)
		State.TWIN_SLASH_TELEGRAPH:
			_process_slash_telegraph(delta)
		State.TWIN_SLASH_EXECUTE:
			_process_slash_execute(delta)
		State.FLAME_WHIRLWIND:
			_process_whirlwind(delta)
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
	velocity = velocity.move_toward(Vector3.ZERO, 8.0 * delta)

	if not target_player or not is_instance_valid(target_player):
		return

	var my_pos = _get_entity_pos(self)
	var player_pos = _get_entity_pos(target_player)
	var dist = my_pos.distance_to(player_pos)

	if dist <= perception_radius:
		current_state = State.CHASE_RUSH
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
		if randf() > 0.5:
			current_state = State.TWIN_SLASH_TELEGRAPH
		else:
			current_state = State.FLAME_WHIRLWIND
		state_timer = 0.0
	else:
		velocity = dir * 6.0

func _process_slash_telegraph(delta: float) -> void:
	state_timer += delta
	if target_player and is_instance_valid(target_player):
		_safe_look_at(_get_entity_pos(target_player))

	if flame_light:
		flame_light.light_energy = 3.5
		flame_light.light_color = Color(1.0, 0.5, 0.1, 1.0)

	if state_timer >= 0.5:
		current_state = State.TWIN_SLASH_EXECUTE
		state_timer = 0.0
		if slash_hitbox:
			slash_hitbox.monitoring = true

func _process_slash_execute(delta: float) -> void:
	state_timer += delta
	if state_timer >= 0.35:
		if slash_hitbox:
			slash_hitbox.monitoring = false
		if flame_light:
			flame_light.light_energy = 1.5
		current_state = State.CHASE_RUSH
		state_timer = 0.0

func _process_whirlwind(delta: float) -> void:
	state_timer += delta
	# Fast spinning attack
	rotation.y += delta * 14.0
	if slash_hitbox and not slash_hitbox.monitoring:
		slash_hitbox.monitoring = true

	if state_timer >= 0.6:
		if slash_hitbox:
			slash_hitbox.monitoring = false
		current_state = State.CHASE_RUSH
		state_timer = 0.0

func _process_stagger(delta: float) -> void:
	state_timer += delta
	velocity = velocity.move_toward(Vector3.ZERO, 10.0 * delta)
	if state_timer >= 1.3:
		if poise:
			poise.is_staggered = false
			poise.current = poise.max_poise
		current_state = State.CHASE_RUSH
		state_timer = 0.0

func _on_slash_hitbox_body_entered(body: Node3D) -> void:
	if not is_instance_valid(body) or body == self:
		return
	if body.is_in_group("player") and body.has_method("take_damage"):
		var dmg = slash_damage if current_state == State.TWIN_SLASH_EXECUTE else whirlwind_damage
		body.take_damage(dmg)
		slash_hit.emit(body, dmg)

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
		if slash_hitbox:
			slash_hitbox.monitoring = false

	if impact_dir != Vector3.ZERO:
		velocity = impact_dir.normalized() * 4.0

	if current_health <= 0:
		_die()

func _die() -> void:
	current_state = State.DEFEATED
	velocity = Vector3.ZERO
	if slash_hitbox:
		slash_hitbox.monitoring = false
	berserker_defeated.emit(self)
	if is_inside_tree():
		var tween = create_tween()
		tween.tween_property(self, "scale", Vector3.ZERO, 0.4).set_trans(Tween.TRANS_BACK)
		tween.tween_callback(queue_free)
	else:
		queue_free()
