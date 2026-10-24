class_name SaveSystem
extends RefCounted

## Save State & Tamper Verification ported from legacy SaveGameManager.ts
## Produces exact 32-bit integer polynomial hashes matching legacy TypeScript checksums.

const CURRENT_VERSION: String = "1.0.0"
const SAVE_PATH: String = "user://mythos_save_data_v1.json"

static func calculate_checksum(data: Dictionary) -> String:
	var version = str(data.get("version", CURRENT_VERSION))
	var current_realm = str(data.get("currentRealm", "SanctumOfAstra"))
	var shards = str(data.get("shardsCollected", 0))
	var altar = "true" if data.get("altarConsecrated", false) else "false"
	var high_score = str(data.get("highScore", 0))
	var narrative_part = ""
	if data.has("narrative") and data["narrative"] is Dictionary and data["narrative"].has("checksum"):
		narrative_part = ":" + str(data["narrative"]["checksum"])

	var s = "%s:%s:%s:%s:%s%s" % [version, current_realm, shards, altar, high_score, narrative_part]

	# 32-bit signed integer hash matching JavaScript string hash: hash = ((hash << 5) - hash) + charCode
	var hash_val: int = 0
	for i in range(s.length()):
		var code: int = s.unicode_at(i)
		hash_val = ((hash_val << 5) - hash_val) + code
		# Clamp to 32-bit signed integer in GDScript
		hash_val = (hash_val & 0xFFFFFFFF)
		if hash_val & 0x80000000:
			hash_val = -((~hash_val & 0xFFFFFFFF) + 1)

	# Format as hex string matching JS Number.toString(16)
	if hash_val < 0:
		return "-" + String.num_uint64(-hash_val, 16)
	return String.num_uint64(hash_val, 16)

static func get_default_state() -> Dictionary:
	var base = {
		"version": CURRENT_VERSION,
		"timestamp": Time.get_unix_time_from_system() * 1000.0,
		"unlockedRealms": ["SanctumOfAstra"],
		"currentRealm": "SanctumOfAstra",
		"shardsCollected": 0,
		"altarConsecrated": false,
		"highScore": 0,
		"playtimeSeconds": 0.0
	}
	base["checksum"] = calculate_checksum(base)
	return base

static func save_game(state: Dictionary) -> bool:
	var full = get_default_state()
	for k in state.keys():
		full[k] = state[k]
	full["version"] = CURRENT_VERSION
	full["timestamp"] = Time.get_unix_time_from_system() * 1000.0
	full["checksum"] = calculate_checksum(full)

	var file = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if not file:
		return false
	file.store_string(JSON.stringify(full, "\t"))
	file.close()
	return true

static func load_game() -> Dictionary:
	if not FileAccess.file_exists(SAVE_PATH):
		return get_default_state()
	var file = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if not file:
		return get_default_state()
	var text = file.get_as_text()
	file.close()

	var json = JSON.new()
	if json.parse(text) != OK or not (json.data is Dictionary):
		return get_default_state()

	var data: Dictionary = json.data
	var expected = calculate_checksum(data)
	if str(data.get("checksum", "")) != expected:
		# Checksum mismatch! Tampered state detected, revert to default.
		return get_default_state()

	return data

static func is_save_valid(data: Dictionary) -> bool:
	return str(data.get("checksum", "")) == calculate_checksum(data)
