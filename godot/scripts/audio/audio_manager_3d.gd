class_name AudioManager3D
extends Node

## Centralized 3D & 2D Audio Manager for Mythos 3D Engine.
## Pools AudioStreamPlayer and AudioStreamPlayer3D instances to prevent runtime allocations.

static var instance: AudioManager3D = null

var sound_streams: Dictionary = {}
var player_pool_2d: Array[AudioStreamPlayer] = []
var player_pool_3d: Array[AudioStreamPlayer3D] = []
const POOL_SIZE: int = 16

func _init() -> void:
	instance = self
	_load_sounds()

func _ready() -> void:
	instance = self
	_init_pools()

func _load_sounds() -> void:
	var sound_files = {
		"sword_slash": "res://assets/audio/sfx/sword_slash.wav",
		"parry_clink": "res://assets/audio/sfx/parry_clink.wav",
		"dash_whoosh": "res://assets/audio/sfx/dash_whoosh.wav",
		"crystal_pickup": "res://assets/audio/sfx/crystal_pickup.wav",
		"boss_roar": "res://assets/audio/sfx/boss_roar.wav",
		"altar_attune": "res://assets/audio/sfx/altar_attune.wav",
		"footstep_stone": "res://assets/audio/sfx/footstep_stone.wav",
		"hit_impact": "res://assets/audio/sfx/hit_impact.wav"
	}
	for key in sound_files:
		var path = sound_files[key]
		if ResourceLoader.exists(path):
			sound_streams[key] = load(path)

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

func play_sfx(sound_name: String, pitch_scale: float = 1.0, volume_db: float = 0.0) -> void:
	if not sound_streams.has(sound_name):
		return
	for p in player_pool_2d:
		if not p.playing:
			p.stream = sound_streams[sound_name]
			p.pitch_scale = pitch_scale
			p.volume_db = volume_db
			p.play()
			return

func play_sfx_3d(sound_name: String, pos: Vector3, pitch_scale: float = 1.0, volume_db: float = 0.0) -> void:
	if not sound_streams.has(sound_name):
		return
	for p in player_pool_3d:
		if not p.playing:
			p.stream = sound_streams[sound_name]
			p.global_position = pos
			p.pitch_scale = pitch_scale
			p.volume_db = volume_db
			p.play()
			return

static func play(sound_name: String, pitch_scale: float = 1.0) -> void:
	if instance:
		instance.play_sfx(sound_name, pitch_scale)

static func play_3d(sound_name: String, pos: Vector3, pitch_scale: float = 1.0) -> void:
	if instance:
		instance.play_sfx_3d(sound_name, pos, pitch_scale)
