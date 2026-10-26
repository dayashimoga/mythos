class_name AudioManager3D
extends Node

## Centralized 3D & 2D Audio Manager & Soundscape Director for Mythos 3D Engine.
## Pools AudioStreamPlayer and AudioStreamPlayer3D instances to prevent runtime allocations.
## Features:
## 1. Multi-bus volume management (Master, Music, SFX, Ambience) with linear-to-dB conversion.
## 2. 7-Realm Atmospheric Ambient Soundscapes with smooth tween crossfading.
## 3. Comprehensive sound FX library (combat, movement, UI interactions, quest fanfares).
## 4. Static convenience helpers for global sound triggers.

static var instance: AudioManager3D = null

var sound_streams: Dictionary = {}
var ambience_streams: Dictionary = {}

var player_pool_2d: Array[AudioStreamPlayer] = []
var player_pool_3d: Array[AudioStreamPlayer3D] = []
const POOL_SIZE: int = 16

# Ambient audio loopers for cross-fading
var ambient_player_a: AudioStreamPlayer = null
var ambient_player_b: AudioStreamPlayer = null
var current_ambient_realm: String = ""

# Volume parameters (0.0 to 1.0 linear)
var master_volume: float = 1.0
var music_volume: float = 0.8
var sfx_volume: float = 1.0
var ambience_volume: float = 0.7

func _init() -> void:
	instance = self
	_load_sounds()

func _ready() -> void:
	instance = self
	_init_pools()
	_init_ambient_players()

func _load_sounds() -> void:
	var sound_files = {
		# Combat & Movement SFX
		"sword_slash": "res://assets/audio/sfx/sword_slash.wav",
		"parry_clink": "res://assets/audio/sfx/parry_clink.wav",
		"dash_whoosh": "res://assets/audio/sfx/dash_whoosh.wav",
		"crystal_pickup": "res://assets/audio/sfx/crystal_pickup.wav",
		"boss_roar": "res://assets/audio/sfx/boss_roar.wav",
		"altar_attune": "res://assets/audio/sfx/altar_attune.wav",
		"footstep_stone": "res://assets/audio/sfx/footstep_stone.wav",
		"hit_impact": "res://assets/audio/sfx/hit_impact.wav",
		# UI & Narrative SFX
		"ui_click": "res://assets/audio/sfx/ui_click.wav",
		"ui_open": "res://assets/audio/sfx/ui_open.wav",
		"ui_close": "res://assets/audio/sfx/ui_close.wav",
		"checkpoint_chime": "res://assets/audio/sfx/checkpoint_chime.wav",
		"quest_complete": "res://assets/audio/sfx/quest_complete.wav"
	}
	for key in sound_files:
		var path = sound_files[key]
		if ResourceLoader.exists(path):
			sound_streams[key] = load(path)

	# Seven-Realm Ambience Stems
	var amb_files = {
		"bhumi": "res://assets/audio/ambience/ambient_bhumi.wav",
		"antariksha": "res://assets/audio/ambience/ambient_antariksha.wav",
		"patala": "res://assets/audio/ambience/ambient_patala.wav",
		"svar": "res://assets/audio/ambience/ambient_svar.wav",
		"maharloka": "res://assets/audio/ambience/ambient_maharloka.wav",
		"tapoloka": "res://assets/audio/ambience/ambient_tapoloka.wav",
		"satyaloka": "res://assets/audio/ambience/ambient_satyaloka.wav"
	}
	for realm in amb_files:
		var path = amb_files[realm]
		if FileAccess.file_exists(path) or ResourceLoader.exists(path):
			var res = load(path)
			if res:
				ambience_streams[realm] = res
			else:
				ambience_streams[realm] = AudioStreamWAV.new()
		else:
			ambience_streams[realm] = AudioStreamWAV.new()

func _init_pools() -> void:
	for i in range(POOL_SIZE):
		var p2d = AudioStreamPlayer.new()
		add_child(p2d)
		player_pool_2d.append(p2d)

		var p3d = AudioStreamPlayer3D.new()
		p3d.max_distance = 45.0
		p3d.unit_size = 4.0
		add_child(p3d)
		player_pool_3d.append(p3d)

func _init_ambient_players() -> void:
	ambient_player_a = AudioStreamPlayer.new()
	ambient_player_a.name = "AmbientPlayerA"
	add_child(ambient_player_a)

	ambient_player_b = AudioStreamPlayer.new()
	ambient_player_b.name = "AmbientPlayerB"
	add_child(ambient_player_b)

# ---------------------------------------------------------
# Volume Bus Controls
# ---------------------------------------------------------

func set_master_volume(linear_val: float) -> void:
	master_volume = clamp(linear_val, 0.0, 1.0)

func set_sfx_volume(linear_val: float) -> void:
	sfx_volume = clamp(linear_val, 0.0, 1.0)

func set_ambience_volume(linear_val: float) -> void:
	ambience_volume = clamp(linear_val, 0.0, 1.0)
	var db = linear_to_db(ambience_volume * master_volume) if (ambience_volume * master_volume) > 0.001 else -80.0
	if ambient_player_a and ambient_player_a.playing:
		ambient_player_a.volume_db = db
	if ambient_player_b and ambient_player_b.playing:
		ambient_player_b.volume_db = db

func _calculate_db(bus: String, base_db: float = 0.0) -> float:
	var mult: float = master_volume
	match bus:
		"sfx": mult *= sfx_volume
		"music": mult *= music_volume
		"ambience": mult *= ambience_volume
	if mult <= 0.001:
		return -80.0
	return base_db + linear_to_db(mult)

# ---------------------------------------------------------
# Sound Effects Playback
# ---------------------------------------------------------

func play_sfx(sound_name: String, pitch_scale: float = 1.0, volume_db: float = 0.0) -> void:
	if not sound_streams.has(sound_name):
		return
	var final_db = _calculate_db("sfx", volume_db)
	if final_db <= -79.0:
		return
	for p in player_pool_2d:
		if not p.playing:
			p.stream = sound_streams[sound_name]
			p.pitch_scale = pitch_scale
			p.volume_db = final_db
			p.play()
			return

func play_sfx_3d(sound_name: String, pos: Vector3, pitch_scale: float = 1.0, volume_db: float = 0.0) -> void:
	if not sound_streams.has(sound_name):
		return
	var final_db = _calculate_db("sfx", volume_db)
	if final_db <= -79.0:
		return
	for p in player_pool_3d:
		if not p.playing:
			p.stream = sound_streams[sound_name]
			p.global_position = pos
			p.pitch_scale = pitch_scale
			p.volume_db = final_db
			p.play()
			return

# ---------------------------------------------------------
# Seven-Realm Ambient Soundscapes
# ---------------------------------------------------------

func play_realm_ambience(realm_id: String) -> void:
	var key = realm_id.to_lower()
	if current_ambient_realm == key:
		return
	current_ambient_realm = key
	if not ambience_streams.has(key):
		return
	var stream = ambience_streams[key]

	if not ambient_player_a or not ambient_player_b:
		_init_ambient_players()

	# Target volume in dB
	var target_db = _calculate_db("ambience", 0.0)

	# Crossfade from active player to next player
	var active = ambient_player_a if (ambient_player_a and ambient_player_a.playing) else ambient_player_b
	var next = ambient_player_b if active == ambient_player_a else ambient_player_a
	if not next:
		return

	next.stream = stream
	next.volume_db = -80.0
	next.play()

	if is_inside_tree():
		var tw = create_tween().set_parallel(true)
		tw.tween_property(next, "volume_db", target_db, 1.2)
		if active and active.playing:
			tw.tween_property(active, "volume_db", -80.0, 1.2)
			tw.chain().tween_callback(func(): active.stop())
	else:
		next.volume_db = target_db
		if active and active.playing:
			active.stop()

# ---------------------------------------------------------
# Static Convenience Helpers
# ---------------------------------------------------------

static func play(sound_name: String, pitch_scale: float = 1.0) -> void:
	if instance:
		instance.play_sfx(sound_name, pitch_scale)

static func play_3d(sound_name: String, pos: Vector3, pitch_scale: float = 1.0) -> void:
	if instance:
		instance.play_sfx_3d(sound_name, pos, pitch_scale)

static func play_click() -> void:
	if instance:
		instance.play_sfx("ui_click", 1.0, -2.0)

static func play_open() -> void:
	if instance:
		instance.play_sfx("ui_open", 1.0, 0.0)

static func play_close() -> void:
	if instance:
		instance.play_sfx("ui_close", 1.0, 0.0)

static func play_chime() -> void:
	if instance:
		instance.play_sfx("checkpoint_chime", 1.0, 1.0)

static func play_fanfare() -> void:
	if instance:
		instance.play_sfx("quest_complete", 1.0, 2.0)

static func play_hit() -> void:
	if instance:
		instance.play_sfx("hit_impact", 1.0, 1.0)

static func play_parry() -> void:
	if instance:
		instance.play_sfx("parry_clink", 1.0, 2.0)

static func set_ambience(realm_id: String) -> void:
	if instance:
		instance.play_realm_ambience(realm_id)

