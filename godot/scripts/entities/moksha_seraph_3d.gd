extends CharacterBody3D
class_name MokshaSeraph3D

## Moksha Seraph Enemy AI for Chapter VII Satyaloka / Brahmaloka
## Hovering celestial seraph with radiant wings that casts transcendent light bursts
## and manifests protective prismatic barriers.

const CombatMath = preload("res://scripts/domain/combat_math.gd")

enum State {
	HOVER_PATROL,
	LIGHT_BURST_TELEGRAPH,
	LIGHT_BURST_EXECUTE,
	PRISMATIC_BARRIER,
	STAGGERED,
	DEFEATED
}

@export var max_health: int = 150
@export var current_health: int = 150
@export var burst_damage: int = 34
@export var perception_radius: float = 24.0
@export var preferred_range: float = 9.0
@export var barrier_threshold_ratio: float = 0.5

var current_state: State = State.HOVER_PATROL
var poise: RefCounted = null
var target_player: Node3D = null
var state_timer: float = 0.0
var base_hover_height: float = 1.8
var barrier_used: bool = false
var barrier_timer: float = 0.0

@onready var visual_mesh: Node3D = $VisualMesh
@onready var seraph_light: OmniLight3D = $SeraphLight

signal seraph_defeated(seraph: CharacterBody3D)
signal burst_hit(target: Node3D, damage: int)
signal barrier_activated()
signal health_changed(current: int, max_hp: int)

func _init() -> void:
	add_to_group("enemies")
	poise = CombatMath.PoiseData.new(70.0, 2.2)
	collision_layer = 4 # Layer 3: Enemies
	collision_mask = 3  # Layer 1: Env, Layer 2: Player

func _ready() -> void:
	current_health = max_health
	base_hover_height = position.y if position.y != 0.0 else 1.8

func _physics_process(delta: float) -> void:
	if current_state == State.DEFEATED:
		return

	if not target_player:
		var players = get_tree().get_nodes_in_group("player") if is_inside_tree() else []
		if players.size() > 0:
			target_player = players[0] as Node3D

	if poise:
		poise.update(delta)

	if barrier_timer > 0.0:
		barrier_timer -= delta

	match current_state:
		State.HOVER_PATROL:
			_process_hover(delta)
		State.LIGHT_BURST_TELEGRAPH:
			_process_telegraph(delta)
		State.LIGHT_BURST_EXECUTE:
			_process_execute(delta)
		State.PRISMATIC_BARRIER:
			_process_barrier(delta)
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
	var hover_offset = sin(state_timer * 2.0) * 0.3
	position.y = base_hover_height + hover_offset

	if not target_player:
		velocity = velocity.move_toward(Vector3.ZERO, 6.0 * delta)
		return

	var my_pos = _get_entity_pos(self)
	var player_pos = _get_entity_pos(target_player)
	var dist = my_pos.distance_to(player_pos)

	if dist <= perception_radius:
		_safe_look_at(player_pos)
		var dir = (player_pos - my_pos).normalized()
		dir.y = 0.0

		var separation = Vector3.ZERO
		if is_inside_tree():
			for enemy in get_tree().get_nodes_in_group("enemies"):
				if enemy != self and is_instance_valid(enemy):
					var diff = global_position - enemy.global_position
					var d = diff.length()
					if d > 0.001 and d < 3.0:
						separation += (diff / d) * (3.0 - d) * 1.5

		if dist > preferred_range + 1.0:
			velocity.x = dir.x * 4.5 + separation.x
			velocity.z = dir.z * 4.5 + separation.z
		elif dist < preferred_range - 1.0:
			velocity.x = -dir.x * 3.5 + separation.x
			velocity.z = -dir.z * 3.5 + separation.z
		else:
			velocity.x = separation.x
			velocity.z = separation.z

		# Health-based barrier check
		if not barrier_used and float(current_health) / float(max_health) <= barrier_threshold_ratio:
			current_state = State.PRISMATIC_BARRIER
			state_timer = 0.0
			velocity = Vector3.ZERO
			return

		# Cast attack trigger
		if state_timer >= 2.0:
			current_state = State.LIGHT_BURST_TELEGRAPH
			state_timer = 0.0
			velocity = Vector3.ZERO
			if seraph_light:
				seraph_light.light_color = Color(1.0, 0.9, 0.3, 1.0)
				seraph_light.light_energy = 5.0
	else:
		velocity = velocity.move_toward(Vector3.ZERO, 5.0 * delta)

func _process_telegraph(delta: float) -> void:
	state_timer += delta
	if target_player:
		_safe_look_at(_get_entity_pos(target_player))

	if state_timer >= 0.75:
		current_state = State.LIGHT_BURST_EXECUTE
		state_timer = 0.0

func _process_execute(delta: float) -> void:
	state_timer += delta
	if target_player:
		var dist = _get_entity_pos(self).distance_to(_get_entity_pos(target_player))
		if dist <= perception_radius:
			var attack_spec = CombatMath.AttackSpec.new("moksha_burst", burst_damage, 30.0, _get_entity_pos(self))
			if target_player.has_method("take_damage_spec"):
				var res = target_player.take_damage_spec(attack_spec)
				if res and res.is_parried:
					current_state = State.STAGGERED
					state_timer = 0.0
					if poise and poise.has_method("take_poise_damage"):
						poise.take_poise_damage(35.0)
			elif target_player.has_method("take_damage"):
				target_player.take_damage(burst_damage)
			burst_hit.emit(target_player, burst_damage)

	if state_timer >= 0.4:
		current_state = State.HOVER_PATROL
		state_timer = 0.0
		if seraph_light:
			seraph_light.light_color = Color(0.7, 0.9, 1.0, 1.0)
			seraph_light.light_energy = 2.0

func _process_barrier(delta: float) -> void:
	state_timer += delta
	if state_timer <= delta * 1.5:
		barrier_used = true
		barrier_timer = 3.0
		barrier_activated.emit()
		if seraph_light:
			seraph_light.light_color = Color(0.8, 1.0, 0.9, 1.0)
			seraph_light.light_energy = 6.0

	if state_timer >= 1.0:
		current_state = State.HOVER_PATROL
		state_timer = 0.0

func _process_stagger(delta: float) -> void:
	state_timer += delta
	velocity = velocity.move_toward(Vector3.ZERO, 10.0 * delta)
	if state_timer >= 1.5:
		current_state = State.HOVER_PATROL
		state_timer = 0.0
		if seraph_light:
			seraph_light.light_color = Color(0.7, 0.9, 1.0, 1.0)
			seraph_light.light_energy = 2.0

func is_barrier_active() -> bool:
	return barrier_timer > 0.0

func take_damage_spec(attack_spec: CombatMath.AttackSpec) -> CombatMath.CombatHitResult:
	if current_state == State.DEFEATED:
		return CombatMath.CombatHitResult.new()
	var my_pos = _get_entity_pos(self)
	var facing = -global_transform.basis.z if is_inside_tree() else Vector3.FORWARD
	var def_spec = CombatMath.DefenseSpec.new("moksha_seraph", my_pos, facing)
	def_spec.is_guarding = is_barrier_active()
	var res = CombatMath.resolve_attack(attack_spec, def_spec)
	current_health = maxi(0, current_health - res.damage_dealt)
	health_changed.emit(current_health, max_health)
	var poise_broken = false
	if poise and poise.has_method("take_poise_damage"):
		poise_broken = poise.take_poise_damage(attack_spec.poise_damage)
	if current_health <= 0:
		_die()
	elif poise_broken or res.is_critical:
		current_state = State.STAGGERED
		state_timer = 0.0
		if seraph_light:
			seraph_light.light_color = Color(0.4, 0.4, 0.8, 1.0)
			seraph_light.light_energy = 1.0
	return res

func take_damage(amount: int, poise_dmg: float = 0.0) -> void:
	if current_state == State.DEFEATED:
		return

	if is_barrier_active():
		amount = int(amount * 0.3) # 70% damage reduction while barrier active

	current_health = maxi(0, current_health - amount)
	health_changed.emit(current_health, max_health)

	if poise and poise_dmg > 0.0:
		if poise.damage(poise_dmg):
			current_state = State.STAGGERED
			state_timer = 0.0
			velocity = Vector3.ZERO
			if seraph_light:
				seraph_light.light_color = Color(0.4, 0.4, 0.8, 1.0)
				seraph_light.light_energy = 1.0

	if current_health <= 0:
		_die()

func _die() -> void:
	current_state = State.DEFEATED
	velocity = Vector3.ZERO
	seraph_defeated.emit(self)
	if is_inside_tree():
		var tween = create_tween()
		if tween:
			tween.tween_property(self, "scale", Vector3.ZERO, 0.5)
			tween.tween_callback(queue_free)
		else:
			queue_free()
	else:
		queue_free()
