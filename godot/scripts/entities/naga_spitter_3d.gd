extends CharacterBody3D
class_name NagaSpitter3D

const CombatMath = preload("res://scripts/domain/combat_math.gd")

enum State {
	SLITHER_REPOSITION,
	TELEGRAPH_COIL,
	SPIT_VENOM,
	STAGGERED,
	DEFEATED
}

@export var max_health: int = 75
@export var current_health: int = 75
@export var spit_damage: int = 22
@export var perception_radius: float = 24.0
@export var preferred_distance: float = 13.0

var current_state: State = State.SLITHER_REPOSITION
var poise: RefCounted = null
var target_player: Node3D = null
var state_timer: float = 0.0
var strafe_angle: float = 0.0

@onready var visual_mesh: Node3D = $VisualMesh
@onready var venom_light: OmniLight3D = $VenomLight

signal spitter_defeated(spitter: CharacterBody3D)
signal venom_spit(origin: Vector3, direction: Vector3)

func _init() -> void:
	add_to_group("enemies")
	poise = CombatMath.PoiseData.new(45.0, 2.0)
	collision_layer = 4 # Layer 3: Enemies
	collision_mask = 3  # Layer 1: Env, Layer 2: Player

func _ready() -> void:
	current_health = max_health
	if venom_light:
		venom_light.visible = false

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
		State.SLITHER_REPOSITION:
			_process_slither(delta)
		State.TELEGRAPH_COIL:
			_process_telegraph(delta)
		State.SPIT_VENOM:
			_process_spit(delta)
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

func _process_slither(delta: float) -> void:
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

	var to_player = (player_pos - my_pos).normalized() if dist > 0.001 else Vector3.FORWARD
	# Slither in an oscillating circle / maintaining preferred distance
	strafe_angle += delta * 1.8
	var perp = Vector3(-to_player.z, 0, to_player.x)
	var move_vec = perp * sin(strafe_angle)

	if dist > preferred_distance + 2.0:
		move_vec += to_player * 0.8
	elif dist < preferred_distance - 2.0:
		move_vec -= to_player * 0.8

	velocity = move_vec.normalized() * 4.2
	_safe_look_at(player_pos)

	if state_timer >= 2.2:
		current_state = State.TELEGRAPH_COIL
		state_timer = 0.0
		velocity = Vector3.ZERO
		if venom_light:
			venom_light.visible = true

func _process_telegraph(delta: float) -> void:
	state_timer += delta
	if target_player and is_instance_valid(target_player):
		_safe_look_at(_get_entity_pos(target_player))

	# Hood glow pulses during telegraph coil
	if venom_light:
		venom_light.light_energy = 2.0 + sin(state_timer * 16.0) * 1.5

	if state_timer >= 0.75:
		current_state = State.SPIT_VENOM
		state_timer = 0.0

func _process_spit(delta: float) -> void:
	state_timer += delta
	if state_timer <= delta:
		# Fire venom spit
		var target_pos = target_player.global_position + Vector3(0, 1.0, 0) if target_player else global_position + -global_transform.basis.z * 10.0
		var spawn_pos = global_position + Vector3(0, 1.2, 0) + (-global_transform.basis.z * 0.8)
		var spit_dir = (target_pos - spawn_pos).normalized()
		venom_spit.emit(spawn_pos, spit_dir)

		# Direct distance check for hit
		if target_player and is_instance_valid(target_player):
			var dist = global_position.distance_to(target_player.global_position)
			if dist <= preferred_distance + 4.0:
				var attack_spec = CombatMath.AttackSpec.new("naga_spitter", spit_damage, 20.0, global_position)
				if target_player.has_method("take_damage_spec"):
					target_player.take_damage_spec(attack_spec)
				elif target_player.has_method("take_damage"):
					target_player.take_damage(spit_damage)

	if state_timer >= 0.5:
		if venom_light:
			venom_light.visible = false
		current_state = State.SLITHER_REPOSITION
		state_timer = 0.0

func _process_stagger(delta: float) -> void:
	state_timer += delta
	velocity = velocity.move_toward(Vector3.ZERO, 15.0 * delta)
	if state_timer >= 1.2:
		current_state = State.SLITHER_REPOSITION
		state_timer = 0.0

func take_damage_spec(attack_spec: CombatMath.AttackSpec) -> CombatMath.CombatHitResult:
	if current_state == State.DEFEATED:
		return CombatMath.CombatHitResult.new()

	var my_pos = global_position if is_inside_tree() else position
	var my_facing = -global_transform.basis.z if is_inside_tree() else Vector3.FORWARD
	var def_spec = CombatMath.DefenseSpec.new("naga_spitter", my_pos, my_facing)
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

func _die() -> void:
	current_state = State.DEFEATED
	velocity = Vector3.ZERO
	spitter_defeated.emit(self)
	if is_inside_tree():
		var tween = create_tween()
		tween.tween_property(self, "scale", Vector3.ZERO, 0.4)
		tween.tween_callback(queue_free)
