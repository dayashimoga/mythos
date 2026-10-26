extends CharacterBody3D
class_name SuryaGuardian3D

const CombatMath = preload("res://scripts/domain/combat_math.gd")

enum State {
	GUARD_PATROL,
	SPEAR_CHARGE_TELEGRAPH,
	SPEAR_THRUST,
	SHIELD_BLOCK,
	STAGGERED,
	DEFEATED
}

@export var max_health: int = 120
@export var current_health: int = 120
@export var spear_damage: int = 28
@export var perception_radius: float = 22.0
@export var attack_reach: float = 3.5

var current_state: State = State.GUARD_PATROL
var poise: RefCounted = null
var target_player: Node3D = null
var state_timer: float = 0.0
var anim_player: AnimationPlayer = null

@onready var visual_mesh: Node3D = $VisualMesh
@onready var thrust_hitbox: Area3D = $ThrustHitbox
@onready var sun_crest_light: OmniLight3D = $SunCrestLight

signal guardian_defeated(guardian: CharacterBody3D)
signal spear_hit(target: Node3D, damage: int)

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
	poise = CombatMath.PoiseData.new(70.0, 2.2)
	collision_layer = 4 # Layer 3: Enemies
	collision_mask = 3  # Layer 1: Env, Layer 2: Player

func _ready() -> void:
	current_health = max_health
	anim_player = _find_anim_player(self)
	_play_anim("idle")
	if thrust_hitbox:
		thrust_hitbox.monitoring = false
		thrust_hitbox.body_entered.connect(_on_thrust_hitbox_body_entered)

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
		State.GUARD_PATROL:
			_process_patrol(delta)
		State.SPEAR_CHARGE_TELEGRAPH:
			_process_telegraph(delta)
		State.SPEAR_THRUST:
			_process_thrust(delta)
		State.SHIELD_BLOCK:
			_process_block(delta)
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
	if not target_player or not is_instance_valid(target_player):
		velocity = velocity.move_toward(Vector3.ZERO, 10.0 * delta)
		_play_anim("idle")
		return

	var my_pos = _get_entity_pos(self)
	var player_pos = _get_entity_pos(target_player)
	var dist = my_pos.distance_to(player_pos)

	if dist > perception_radius:
		velocity = velocity.move_toward(Vector3.ZERO, 8.0 * delta)
		_play_anim("idle")
		return

	_safe_look_at(player_pos)
	var dir = (player_pos - my_pos).normalized() if dist > 0.001 else Vector3.FORWARD

	var separation = Vector3.ZERO
	if is_inside_tree():
		for enemy in get_tree().get_nodes_in_group("enemies"):
			if enemy != self and is_instance_valid(enemy):
				var diff = global_position - enemy.global_position
				var d = diff.length()
				if d > 0.001 and d < 3.0:
					separation += (diff / d) * (3.0 - d) * 1.5

	if dist > attack_reach + 1.0:
		velocity = dir * 4.8 + separation
		_play_anim("walk")
	else:
		velocity = Vector3.ZERO
		current_state = State.SPEAR_CHARGE_TELEGRAPH
		state_timer = 0.0
		_play_anim("telegraph")

func _process_telegraph(delta: float) -> void:
	state_timer += delta
	_play_anim("telegraph")
	if target_player and is_instance_valid(target_player):
		_safe_look_at(_get_entity_pos(target_player))

	if sun_crest_light:
		sun_crest_light.light_energy = 2.5 + sin(state_timer * 18.0) * 1.5

	if state_timer >= 0.65:
		current_state = State.SPEAR_THRUST
		state_timer = 0.0
		_play_anim("thrust_attack", 0.05)
		var my_pos = _get_entity_pos(self)
		var player_pos = _get_entity_pos(target_player) if target_player else my_pos + Vector3.FORWARD
		var dir = (player_pos - my_pos).normalized() if my_pos.distance_to(player_pos) > 0.001 else Vector3.FORWARD
		velocity = dir * 14.0

func _process_thrust(delta: float) -> void:
	state_timer += delta
	velocity = velocity.move_toward(Vector3.ZERO, 18.0 * delta)

	if thrust_hitbox:
		thrust_hitbox.monitoring = (state_timer >= 0.1 and state_timer <= 0.4)

	if state_timer >= 0.55:
		if thrust_hitbox:
			thrust_hitbox.monitoring = false
		current_state = State.SHIELD_BLOCK
		state_timer = 0.0
		_play_anim("shield_block")

func _process_block(delta: float) -> void:
	state_timer += delta
	velocity = Vector3.ZERO
	_play_anim("shield_block")
	if target_player and is_instance_valid(target_player):
		_safe_look_at(_get_entity_pos(target_player))

	if state_timer >= 1.2:
		current_state = State.GUARD_PATROL
		state_timer = 0.0

func _process_stagger(delta: float) -> void:
	state_timer += delta
	velocity = velocity.move_toward(Vector3.ZERO, 15.0 * delta)
	_play_anim("idle")
	if state_timer >= 1.4:
		current_state = State.GUARD_PATROL
		state_timer = 0.0

func _on_thrust_hitbox_body_entered(body: Node3D) -> void:
	if body == self or not is_instance_valid(body):
		return

	if body.is_in_group("player"):
		var my_pos = _get_entity_pos(self)
		var attack_spec = CombatMath.AttackSpec.new("surya_guardian", spear_damage, 35.0, my_pos)
		if body.has_method("take_damage_spec"):
			var res = body.take_damage_spec(attack_spec)
			if res and res.is_parried:
				_on_attack_parried()
		elif body.has_method("take_damage"):
			body.take_damage(spear_damage)
		spear_hit.emit(body, spear_damage)

func _on_attack_parried() -> void:
	if thrust_hitbox:
		thrust_hitbox.set_deferred("monitoring", false)
	current_state = State.STAGGERED
	state_timer = 0.0
	_play_anim("idle")
	if poise and poise.has_method("take_poise_damage"):
		poise.take_poise_damage(40.0)

func take_damage_spec(attack_spec: CombatMath.AttackSpec) -> CombatMath.CombatHitResult:
	if current_state == State.DEFEATED:
		return CombatMath.CombatHitResult.new()

	var my_pos = _get_entity_pos(self)
	var facing = -global_transform.basis.z if is_inside_tree() else Vector3.FORWARD
	var def_spec = CombatMath.DefenseSpec.new("surya_guardian", my_pos, facing)
	def_spec.is_guarding = (current_state == State.SHIELD_BLOCK)

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
		if thrust_hitbox:
			thrust_hitbox.monitoring = false

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
		if thrust_hitbox:
			thrust_hitbox.monitoring = false

func _die() -> void:
	current_state = State.DEFEATED
	velocity = Vector3.ZERO
	_play_anim("death", 0.1)
	if thrust_hitbox:
		thrust_hitbox.monitoring = false
	guardian_defeated.emit(self)
	if is_inside_tree():
		var tween = create_tween()
		tween.tween_interval(0.6)
		tween.tween_property(self, "scale", Vector3.ZERO, 0.4)
		tween.tween_callback(queue_free)
