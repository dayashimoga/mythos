class_name TrainingSentinel3D
extends CharacterBody3D

const AudioManager3D = preload("res://scripts/audio/audio_manager_3d.gd")

## 3D Practice Automaton / Ancient Hoysala Sentinel entity for combat targeting, combo testing, and parry drills.
## Belongs to group "targetable" for OrbitCamera3D combat targeting.
## Integrates CombatMath for poise stagger, directional defense, and parry deflection feedback.

signal health_changed(current: int, max_hp: int)
signal poise_changed(current: float, max_poise: float)
signal staggered()
signal recovered()
signal sentinel_defeated()

@export var max_health: int = 150
@export var max_poise: float = 80.0
@export var practice_attack_interval: float = 4.5

var current_health: int = 150
var poise: CombatMath.PoiseData = CombatMath.PoiseData.new(80.0, 2.2)
var attack_cooldown: float = 2.5
var is_telegraphing: bool = false
var is_striking: bool = false
var is_defeated: bool = false
var telegraph_timer: float = 0.0

@onready var visual_root: Node3D = $Visual if has_node("Visual") else self
@onready var core_light: OmniLight3D = find_child("CoreLight", true, false) as OmniLight3D
@onready var ring_mesh: MeshInstance3D = find_child("OrbitalRing", true, false) as MeshInstance3D
@onready var ring_outer: MeshInstance3D = find_child("OrbitalRingOuter", true, false) as MeshInstance3D
@onready var status_label: Label3D = $StatusLabel if has_node("StatusLabel") else null
@onready var practice_strike_area: Area3D = $PracticeStrikeArea if has_node("PracticeStrikeArea") else null
@onready var collision_shape: CollisionShape3D = $CollisionShape3D if has_node("CollisionShape3D") else null

var anim_player: AnimationPlayer = null
var current_anim: String = ""

func _init() -> void:
	add_to_group("targetable")
	add_to_group("enemies")

func _ready() -> void:
	add_to_group("targetable")
	add_to_group("enemies")
	current_health = max_health
	if not poise:
		poise = CombatMath.PoiseData.new(max_poise, 2.2)
	
	anim_player = find_child("AnimationPlayer", true, false) as AnimationPlayer
	_play_anim("sentinel_idle")
	_update_status_display()

	if practice_strike_area:
		practice_strike_area.body_entered.connect(_on_strike_body_entered)
		practice_strike_area.monitoring = false

func _play_anim(anim_name: String, blend_time: float = 0.12) -> void:
	if not anim_player or current_anim == anim_name:
		return
	if anim_player.has_animation(anim_name):
		anim_player.play(anim_name, blend_time)
		current_anim = anim_name

func _process(delta: float) -> void:
	if is_defeated:
		return

	# Continuous continuous orbital ring rotation for dynamic yantra aesthetic
	if ring_mesh:
		var speed = 4.5 if is_telegraphing else 1.8
		ring_mesh.rotation.y += delta * speed
	if ring_outer:
		var speed = 3.2 if is_telegraphing else 1.2
		ring_outer.rotation.x += delta * speed

	# Handle Poise Stagger recovery
	if poise.is_staggered:
		poise.stagger_timer -= delta
		if status_label:
			status_label.text = "✦ POISE BROKEN! (+35% CRIT) ✦\n[ Stagger: %.1fs ]" % poise.stagger_timer
			status_label.modulate = Color(1.0, 0.4, 0.15)
		if poise.stagger_timer <= 0.0:
			poise.is_staggered = false
			poise.current = poise.max_poise
			_play_anim("sentinel_recover", 0.08)
			_update_status_display()
			recovered.emit()
			var t = create_tween()
			if t:
				t.tween_interval(0.4)
				t.tween_callback(func(): _play_anim("sentinel_idle", 0.15))
		return

	# Slowly regenerate poise if not damaged recently
	if poise.current < poise.max_poise:
		poise.current = min(poise.max_poise, poise.current + 10.0 * delta)
		_update_status_display()

	# Practice Telegraph & Attack Loop
	if attack_cooldown > 0.0:
		attack_cooldown -= delta
	elif not is_telegraphing and not is_striking:
		_start_practice_telegraph()

	if is_telegraphing:
		telegraph_timer -= delta
		if core_light:
			core_light.light_energy = 2.5 + sin(telegraph_timer * 22.0) * 2.0
			core_light.light_color = Color(1.0, 0.25, 0.1) # Blazing warning
		if telegraph_timer <= 0.0:
			_execute_practice_strike()

func _start_practice_telegraph() -> void:
	is_telegraphing = true
	telegraph_timer = 1.2
	_play_anim("sentinel_telegraph", 0.1)
	AudioManager3D.play_3d("boss_roar", global_position, 1.8) # High-pitched windup chime

	if status_label:
		status_label.text = "✦ INCOMING DUAL-BLADE CLEAVE ✦\n[ Parry (F), Guard (Q), or Dash (Shift) ]"
		status_label.modulate = Color(1.0, 0.85, 0.1)

func _execute_practice_strike() -> void:
	is_telegraphing = false
	is_striking = true
	attack_cooldown = practice_attack_interval
	_play_anim("sentinel_strike", 0.06)

	if core_light:
		core_light.light_energy = 3.5
		core_light.light_color = Color(0.2, 0.88, 1.0) # Restored azure prana

	if status_label:
		status_label.text = "⚔ CLEAVING GROUND! ⚔"
		status_label.modulate = Color(1.0, 0.2, 0.1)

	if practice_strike_area:
		practice_strike_area.monitoring = true
		var t = create_tween()
		if t:
			t.tween_interval(0.28)
			t.tween_callback(func():
				if practice_strike_area:
					practice_strike_area.monitoring = false
				is_striking = false
				_play_anim("sentinel_idle", 0.15)
				_update_status_display()
			)

func _on_strike_body_entered(body: Node3D) -> void:
	if body is PlayerController3D and body.has_method("take_damage_spec"):
		var p = global_position if is_inside_tree() else position
		var atk = CombatMath.AttackSpec.new("sentinel", 22, 28.0, p)
		var res = body.take_damage_spec(atk)

		# Check for player parry deflection!
		if res and res.was_parried:
			_on_strike_parried()

func _on_strike_parried() -> void:
	# Successfully parried by player! Deflect and break poise
	is_telegraphing = false
	is_striking = false
	if practice_strike_area:
		practice_strike_area.monitoring = false

	attack_cooldown = practice_attack_interval * 0.8
	_play_anim("sentinel_stagger", 0.05)
	AudioManager3D.play_3d("hit_impact", global_position, 1.2)

	# Deal direct 40 poise damage to Sentinel
	poise.take_poise_damage(40.0)
	if poise.is_staggered:
		staggered.emit()

	if status_label:
		status_label.text = "✦ PARRY DEFLECTED! ✦\n[ +35% CRITICAL PUNISH WINDOW ]"
		status_label.modulate = Color(0.2, 1.0, 0.4)

func take_damage_spec(attack_spec: CombatMath.AttackSpec) -> CombatMath.CombatHitResult:
	if is_defeated:
		return CombatMath.CombatHitResult.new()

	var my_pos = global_position if is_inside_tree() else position
	var my_facing = -global_transform.basis.z if is_inside_tree() else Vector3.FORWARD
	var def_spec = CombatMath.DefenseSpec.new("sentinel", my_pos, my_facing)
	def_spec.poise = poise

	var result = CombatMath.resolve_attack(attack_spec, def_spec)
	current_health = max(0, current_health - result.damage_dealt)

	# Visual hit flash
	if core_light:
		core_light.light_color = Color(1.0, 0.2, 0.1)
		var t = create_tween()
		if t:
			t.tween_property(core_light, "light_color", Color(0.2, 0.85, 1.0), 0.25)

	# Flinch bounce
	if visual_root and is_inside_tree():
		var push = (global_position - attack_spec.origin).normalized() * 0.2
		push.y = 0.0
		visual_root.position += push
		var t = create_tween()
		if t:
			t.tween_property(visual_root, "position", Vector3.ZERO, 0.22).set_ease(Tween.EASE_OUT)

	if result.triggered_stagger and not is_defeated:
		_play_anim("sentinel_stagger", 0.06)
		staggered.emit()

	if current_health <= 0:
		_on_defeated()
	else:
		_update_status_display()

	health_changed.emit(current_health, max_health)
	poise_changed.emit(poise.current, poise.max_poise)
	return result

func take_damage(amount: int) -> void:
	var atk = CombatMath.AttackSpec.new("player", amount, 25.0, global_position)
	take_damage_spec(atk)

func _update_status_display() -> void:
	if not status_label or is_defeated:
		return
	if is_telegraphing or is_striking or poise.is_staggered:
		return
	status_label.text = "HOYSALA TRAINING SENTINEL\nHP: %d/%d | POISE: %d%%" % [current_health, max_health, int((poise.current / poise.max_poise) * 100)]
	status_label.modulate = Color(0.3, 0.9, 1.0)

func _on_defeated() -> void:
	is_defeated = true
	is_telegraphing = false
	is_striking = false
	if practice_strike_area:
		practice_strike_area.monitoring = false
	if collision_shape:
		collision_shape.disabled = true
	remove_from_group("targetable")

	_play_anim("sentinel_defeat", 0.08)
	AudioManager3D.play_3d("hit_impact", global_position, 0.6)
	sentinel_defeated.emit()

	if status_label:
		status_label.text = "☀️ SENTINEL PURIFIED! ☀️\n[ Re-arming in 4.0s... ]"
		status_label.modulate = Color(1.0, 0.85, 0.2)

	# Respawn after practice interval
	var t = create_tween()
	if t:
		t.tween_interval(4.0)
		t.tween_callback(func(): _respawn_sentinel())

func _respawn_sentinel() -> void:
	current_health = max_health
	poise.current = poise.max_poise
	poise.is_staggered = false
	is_defeated = false
	is_telegraphing = false
	is_striking = false
	attack_cooldown = 2.0

	if collision_shape:
		collision_shape.disabled = false
	add_to_group("targetable")

	if visual_root:
		visual_root.scale = Vector3.ONE

	_play_anim("sentinel_idle", 0.2)
	_update_status_display()
	AudioManager3D.play_3d("footstep_stone", global_position, 1.2)
