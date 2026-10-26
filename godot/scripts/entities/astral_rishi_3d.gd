extends CharacterBody3D
class_name AstralRishi3D

## Astral Rishi / Vedic Sage Enemy AI for Chapter V Maharloka
## Floats above ground, casts mantra energy projectiles, and blinks away when approached.

const CombatMath = preload("res://scripts/domain/combat_math.gd")

enum State {
	HOVER_MEDITATE,
	CAST_MANTRA_TELEGRAPH,
	CAST_MANTRA_RELEASE,
	ASTRAL_BLINK,
	STAGGERED,
	DEFEATED
}

@export var max_health: int = 120
@export var current_health: int = 120
@export var mantra_damage: int = 24
@export var perception_radius: float = 24.0
@export var preferred_range: float = 8.0
@export var blink_threshold_distance: float = 3.5

var current_state: State = State.HOVER_MEDITATE
var poise: RefCounted = null
var target_player: Node3D = null
var state_timer: float = 0.0
var base_hover_height: float = 1.6

@onready var visual_mesh: Node3D = $VisualMesh
@onready var mantra_light: OmniLight3D = $MantraLight

signal rishi_defeated(rishi: CharacterBody3D)
signal mantra_cast(target: Node3D, damage: int)
signal rishi_blinked(from_pos: Vector3, to_pos: Vector3)

func _init() -> void:
	add_to_group("enemies")
	poise = CombatMath.PoiseData.new(40.0, 2.0)
	collision_layer = 4 # Layer 3: Enemies
	collision_mask = 3  # Layer 1: Env, Layer 2: Player

func _ready() -> void:
	current_health = max_health
	base_hover_height = position.y if position.y != 0.0 else 1.6

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
		State.HOVER_MEDITATE:
			_process_hover(delta)
		State.CAST_MANTRA_TELEGRAPH:
			_process_telegraph(delta)
		State.CAST_MANTRA_RELEASE:
			_process_release(delta)
		State.ASTRAL_BLINK:
			_process_blink(delta)
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

func _process_hover(delta: float) -> void:
	state_timer += delta
	# Bob up and down smoothly
	velocity.y = sin(state_timer * 3.0) * 0.5

	if not target_player or not is_instance_valid(target_player):
		velocity.x = move_toward(velocity.x, 0.0, 5.0 * delta)
		velocity.z = move_toward(velocity.z, 0.0, 5.0 * delta)
		return

	var my_pos = _get_entity_pos(self)
	var player_pos = _get_entity_pos(target_player)
	var dist = my_pos.distance_to(player_pos)

	if dist > perception_radius:
		velocity.x = move_toward(velocity.x, 0.0, 5.0 * delta)
		velocity.z = move_toward(velocity.z, 0.0, 5.0 * delta)
		return

	_safe_look_at(player_pos)

	# If player gets too close, trigger Astral Blink
	if dist < blink_threshold_distance:
		_start_blink()
		return

	# Maintain preferred range with neighbor separation
	var separation = Vector3.ZERO
	if is_inside_tree():
		for enemy in get_tree().get_nodes_in_group("enemies"):
			if enemy != self and is_instance_valid(enemy):
				var diff = global_position - enemy.global_position
				var d = diff.length()
				if d > 0.001 and d < 3.0:
					separation += (diff / d) * (3.0 - d) * 1.5

	if dist > preferred_range + 2.0:
		var dir = (player_pos - my_pos).normalized()
		velocity.x = dir.x * 3.5 + separation.x
		velocity.z = dir.z * 3.5 + separation.z
	elif dist < preferred_range - 2.0:
		var dir = (my_pos - player_pos).normalized()
		velocity.x = dir.x * 3.5 + separation.x
		velocity.z = dir.z * 3.5 + separation.z
	else:
		velocity.x = move_toward(velocity.x, 0.0, 5.0 * delta) + separation.x
		velocity.z = move_toward(velocity.z, 0.0, 5.0 * delta) + separation.z
		# Ready to cast mantra
		if state_timer > 1.5:
			_start_cast_telegraph()

func _start_cast_telegraph() -> void:
	current_state = State.CAST_MANTRA_TELEGRAPH
	state_timer = 0.0
	velocity = Vector3.ZERO
	if mantra_light:
		mantra_light.light_energy = 4.0
		mantra_light.light_color = Color(0.3, 0.7, 1.0, 1.0)

func _process_telegraph(delta: float) -> void:
	state_timer += delta
	if target_player and is_instance_valid(target_player):
		_safe_look_at(_get_entity_pos(target_player))

	if state_timer >= 0.8:
		_execute_cast()

func _execute_cast() -> void:
	current_state = State.CAST_MANTRA_RELEASE
	state_timer = 0.0

	if target_player and is_instance_valid(target_player):
		var dist = _get_entity_pos(self).distance_to(_get_entity_pos(target_player))
		if dist <= perception_radius:
			var attack_spec = CombatMath.AttackSpec.new("astral_mantra", mantra_damage, 25.0, _get_entity_pos(self))
			if target_player.has_method("take_damage_spec"):
				var res = target_player.take_damage_spec(attack_spec)
				if res and res.is_parried:
					current_state = State.STAGGERED
					state_timer = 0.0
					if poise and poise.has_method("take_poise_damage"):
						poise.take_poise_damage(35.0)
			elif target_player.has_method("take_damage"):
				target_player.take_damage(mantra_damage)
			mantra_cast.emit(target_player, mantra_damage)

func _process_release(delta: float) -> void:
	state_timer += delta
	if state_timer >= 0.4:
		if mantra_light:
			mantra_light.light_energy = 1.5
		current_state = State.HOVER_MEDITATE
		state_timer = 0.0

func _start_blink() -> void:
	var my_pos = _get_entity_pos(self)
	var player_pos = _get_entity_pos(target_player) if target_player else my_pos
	var away_dir = (my_pos - player_pos).normalized()
	if away_dir.length_squared() < 0.01:
		away_dir = Vector3.BACK

	var dest = my_pos + away_dir * 7.0
	current_state = State.ASTRAL_BLINK
	state_timer = 0.0

	rishi_blinked.emit(my_pos, dest)
	if is_inside_tree():
		global_position = dest
	else:
		position = dest

func _process_blink(delta: float) -> void:
	state_timer += delta
	if state_timer >= 0.3:
		current_state = State.HOVER_MEDITATE
		state_timer = 0.0

func _process_stagger(delta: float) -> void:
	state_timer += delta
	velocity = velocity.move_toward(Vector3.ZERO, 8.0 * delta)
	if state_timer >= 1.2:
		if poise:
			poise.is_broken = false
			poise.current = poise.max_poise
		current_state = State.HOVER_MEDITATE
		state_timer = 0.0

func take_damage_spec(attack_spec: CombatMath.AttackSpec) -> CombatMath.CombatHitResult:
	if current_state == State.DEFEATED:
		return CombatMath.CombatHitResult.new()
	var my_pos = _get_entity_pos(self)
	var facing = -global_transform.basis.z if is_inside_tree() else Vector3.FORWARD
	var def_spec = CombatMath.DefenseSpec.new("astral_rishi", my_pos, facing)
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
	var spec = CombatMath.AttackSpec.new("generic", amount, 20.0, Vector3.ZERO)
	take_damage_spec(spec)

func take_hit(damage: int, poise_dmg: float = 20.0, _is_parryable: bool = false, impact_dir: Vector3 = Vector3.ZERO) -> void:
	if current_state == State.DEFEATED:
		return

	current_health = max(0, current_health - damage)

	if poise:
		var broken = poise.damage(poise_dmg)
		if broken:
			current_state = State.STAGGERED
			state_timer = 0.0

	if impact_dir != Vector3.ZERO:
		velocity = impact_dir.normalized() * 5.0

	if current_health <= 0:
		_die()

func _die() -> void:
	current_state = State.DEFEATED
	velocity = Vector3.ZERO
	rishi_defeated.emit(self)
	if is_inside_tree():
		var tween = create_tween()
		tween.tween_property(self, "scale", Vector3.ZERO, 0.4).set_trans(Tween.TRANS_BACK)
		tween.tween_callback(queue_free)
	else:
		queue_free()
