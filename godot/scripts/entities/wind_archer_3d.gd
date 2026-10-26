extends CharacterBody3D
class_name WindArcher3D

const CombatMath = preload("res://scripts/domain/combat_math.gd")

enum State {
	HOVER_STRAFE,
	TELEGRAPH_DRAW,
	FIRE_GALE_BURST,
	STAGGERED,
	DEFEATED
}

@export var max_health: int = 70
@export var current_health: int = 70
@export var arrow_damage: int = 20
@export var perception_radius: float = 22.0
@export var preferred_distance: float = 12.0

var current_state: State = State.HOVER_STRAFE
var poise: RefCounted = null
var target_player: Node3D = null
var state_timer: float = 0.0
var strafe_dir: float = 1.0

@onready var visual_mesh: Node3D = $VisualMesh
@onready var bow_light: OmniLight3D = $BowLight
@onready var arrow_spawn_point: Marker3D = $ArrowSpawnPoint

var anim_player: AnimationPlayer = null

signal archer_defeated(archer: CharacterBody3D)

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
	poise = CombatMath.PoiseData.new(40.0, 2.0)
	collision_layer = 4 # Layer 3: Enemies
	collision_mask = 3  # Layers 1 (Env) & 2 (Player)

func _ready() -> void:
	current_health = max_health
	anim_player = _find_anim_player(self)
	_play_anim("idle")
	if bow_light:
		bow_light.visible = false

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
		State.HOVER_STRAFE:
			_process_hover_strafe(delta)
		State.TELEGRAPH_DRAW:
			_process_telegraph(delta)
		State.FIRE_GALE_BURST:
			_process_fire(delta)
		State.STAGGERED:
			_process_staggered(delta)

func _process_hover_strafe(delta: float) -> void:
	state_timer += delta
	if not target_player:
		_play_anim("idle")
		return

	var to_player = target_player.global_position - global_position
	var dist = to_player.length()

	look_at(Vector3(target_player.global_position.x, global_position.y, target_player.global_position.z), Vector3.UP)

	if dist <= perception_radius:
		# Strafe left/right while maintaining preferred distance
		var side_vec = transform.basis.x * strafe_dir
		var dist_diff = dist - preferred_distance
		var forward_vec = transform.basis.z * -clamp(dist_diff * 0.5, -1.0, 1.0)

		# Flocking separation
		var separation = Vector3.ZERO
		if is_inside_tree():
			for enemy in get_tree().get_nodes_in_group("enemies"):
				if enemy != self and is_instance_valid(enemy):
					var diff = global_position - enemy.global_position
					var d = diff.length()
					if d > 0.001 and d < 3.0:
						separation += (diff / d) * (3.0 - d) * 1.5

		velocity = (side_vec * 3.5 + forward_vec * 4.0) + separation
		_play_anim("walk")
		move_and_slide()

		if state_timer >= 2.2:
			_start_draw()
	else:
		velocity = velocity.lerp(Vector3.ZERO, 4.0 * delta)
		_play_anim("idle")
		move_and_slide()

func _start_draw() -> void:
	current_state = State.TELEGRAPH_DRAW
	state_timer = 0.0
	velocity = Vector3.ZERO
	_play_anim("telegraph")
	if bow_light:
		bow_light.visible = true
		bow_light.light_energy = 3.5

func _process_telegraph(delta: float) -> void:
	state_timer += delta
	if target_player:
		look_at(Vector3(target_player.global_position.x, global_position.y, target_player.global_position.z), Vector3.UP)

	if state_timer >= 0.85:
		_fire_arrow()

func _fire_arrow() -> void:
	current_state = State.FIRE_GALE_BURST
	state_timer = 0.0
	_play_anim("attack")
	if bow_light:
		bow_light.visible = false

	# Direct raycast damage to player if line of sight is clear
	if target_player:
		var dist = global_position.distance_to(target_player.global_position)
		if dist <= perception_radius + 4.0:
			if target_player.has_method("take_damage_spec"):
				var spec = CombatMath.AttackSpec.new("wind_arrow", arrow_damage, 25.0, global_position)
				var res = target_player.take_damage_spec(spec)
				if res and res.is_parried:
					# Player parried the projectile! Stagger the archer!
					current_state = State.STAGGERED
					state_timer = 0.0
					_play_anim("stagger")
			elif target_player.has_method("take_damage"):
				target_player.take_damage(arrow_damage)

	strafe_dir *= -1.0 # Reverse strafe direction for next volley

func _process_fire(delta: float) -> void:
	state_timer += delta
	if state_timer >= 0.4:
		current_state = State.HOVER_STRAFE
		state_timer = 0.0

func _process_staggered(delta: float) -> void:
	state_timer += delta
	velocity.y -= 9.8 * delta
	move_and_slide()

	if state_timer >= 2.2:
		current_state = State.HOVER_STRAFE
		state_timer = 0.0
		if poise:
			poise.current = poise.max_poise

func take_damage_spec(attack_spec: CombatMath.AttackSpec) -> CombatMath.CombatHitResult:
	if current_state == State.DEFEATED:
		return CombatMath.CombatHitResult.new(false, false, false, 0, 0.0)

	var final_dmg = attack_spec.base_damage
	if current_state == State.STAGGERED:
		final_dmg = int(attack_spec.base_damage * 1.35)

	current_health = max(0, current_health - final_dmg)
	var broken = false
	if poise:
		broken = poise.take_poise_damage(attack_spec.poise_damage)
		if broken and current_state != State.STAGGERED:
			current_state = State.STAGGERED
			state_timer = 0.0
			_play_anim("stagger")
			if bow_light:
				bow_light.visible = false

	if is_inside_tree() and visual_mesh:
		var tween = create_tween()
		tween.tween_property(visual_mesh, "scale", Vector3(1.15, 0.85, 1.15), 0.08)
		tween.tween_property(visual_mesh, "scale", Vector3.ONE, 0.12)

	if current_health <= 0:
		_die()

	return CombatMath.CombatHitResult.new(true, false, broken, final_dmg, attack_spec.poise_damage)

func take_damage(amount: int, poise_dmg: float = 20.0) -> void:
	var spec = CombatMath.AttackSpec.new("generic", amount, poise_dmg, Vector3.ZERO)
	take_damage_spec(spec)

func _die() -> void:
	current_state = State.DEFEATED
	_play_anim("death")
	if bow_light:
		bow_light.visible = false
	archer_defeated.emit(self)

	if is_inside_tree() and visual_mesh:
		var tween = create_tween()
		tween.tween_property(visual_mesh, "scale", Vector3(0.01, 0.01, 0.01), 0.6)
		tween.tween_callback(queue_free)
	elif is_inside_tree():
		queue_free()
