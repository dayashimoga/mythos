class_name TacticalMapCanvas
extends Control

## 2D Tactical Realm Map Canvas for Bhumi Valley
## Renders top-down topological layout, regional boundaries, sanctum architecture,
## landmark pins, real-time player location with heading pointer, and active quest waypoint.

var player_pos: Vector3 = Vector3.ZERO
var player_yaw: float = 0.0
var waypoint_pos: Vector3 = Vector3.ZERO
var waypoint_label: String = ""
var has_waypoint: bool = false

# World boundary mapping (covers 180m x 180m centered around (0, 0))
const WORLD_MIN_X: float = -80.0
const WORLD_MAX_X: float = 80.0
const WORLD_MIN_Z: float = -80.0
const WORLD_MAX_Z: float = 80.0

# Canonical Bhumi Landmarks
const LANDMARKS = [
	{"name": "Sanctum Center", "pos": Vector3(0.0, 0.0, 0.0), "icon": "☀️", "color": Color(1.0, 0.85, 0.3)},
	{"name": "High Sun Altar", "pos": Vector3(0.0, 2.8, -2.0), "icon": "🔥", "color": Color(1.0, 0.7, 0.2)},
	{"name": "Torana Gateway", "pos": Vector3(0.0, 0.0, 35.0), "icon": "🏛️", "color": Color(0.9, 0.8, 0.5)},
	{"name": "Devi Tara (Grove)", "pos": Vector3(-24.0, 1.2, -13.0), "icon": "🪷", "color": Color(0.2, 0.85, 0.95)},
	{"name": "Surya Kund Kalyani", "pos": Vector3(22.0, -0.6, 18.0), "icon": "💧", "color": Color(0.3, 0.75, 1.0)},
	{"name": "Kalanemi Watchtower", "pos": Vector3(55.0, 12.0, -45.0), "icon": "☠", "color": Color(1.0, 0.3, 0.3)}
]

func _init() -> void:
	custom_minimum_size = Vector2(380, 380)

func set_player_state(p_pos: Vector3, p_yaw: float) -> void:
	player_pos = p_pos
	player_yaw = p_yaw
	queue_redraw()

func set_waypoint(pos: Vector3, label: String = "") -> void:
	waypoint_pos = pos
	waypoint_label = label
	has_waypoint = true
	queue_redraw()

func clear_waypoint() -> void:
	has_waypoint = false
	waypoint_label = ""
	queue_redraw()

func world_to_map_coord(world_p: Vector3) -> Vector2:
	var map_size = size
	if map_size.x < 10.0 or map_size.y < 10.0:
		map_size = custom_minimum_size

	var pad = 24.0
	var usable_w = map_size.x - (pad * 2.0)
	var usable_h = map_size.y - (pad * 2.0)

	var norm_x = clamp((world_p.x - WORLD_MIN_X) / (WORLD_MAX_X - WORLD_MIN_X), 0.0, 1.0)
	var norm_z = clamp((world_p.z - WORLD_MIN_Z) / (WORLD_MAX_Z - WORLD_MIN_Z), 0.0, 1.0)

	# In top-down map: X maps horizontally (left to right), Z maps vertically (North is -Z, South is +Z)
	var u = pad + norm_x * usable_w
	var v = pad + norm_z * usable_h
	return Vector2(u, v)

func _draw() -> void:
	var map_rect = Rect2(Vector2.ZERO, size)

	# 1. Dark Slate Canvas Background
	draw_rect(map_rect, Color(0.04, 0.06, 0.11, 0.95), true)
	draw_rect(map_rect, Color(0.95, 0.8, 0.35, 0.85), false, 2.0)

	# 2. Grid & Coordinates Lines
	var pad = 24.0
	var inner_rect = Rect2(pad, pad, size.x - pad * 2.0, size.y - pad * 2.0)
	draw_rect(inner_rect, Color(0.06, 0.09, 0.16, 0.7), true)
	draw_rect(inner_rect, Color(0.2, 0.35, 0.5, 0.4), false, 1.0)

	# Crosshair grid at (0, 0)
	var center_pt = world_to_map_coord(Vector3.ZERO)
	draw_line(Vector2(inner_rect.position.x, center_pt.y), Vector2(inner_rect.end.x, center_pt.y), Color(0.25, 0.4, 0.55, 0.35), 1.0)
	draw_line(Vector2(center_pt.x, inner_rect.position.y), Vector2(center_pt.x, inner_rect.end.y), Color(0.25, 0.4, 0.55, 0.35), 1.0)

	# Concentric Sri Yantra ring around Sanctum
	draw_arc(center_pt, 28.0, 0.0, TAU, 32, Color(0.95, 0.8, 0.3, 0.25), 1.5)
	draw_arc(center_pt, 54.0, 0.0, TAU, 32, Color(0.95, 0.8, 0.3, 0.15), 1.0)

	# 3. Regional Outlines
	# Dandaka Grove (-24, -13)
	var grove_pt = world_to_map_coord(Vector3(-24.0, 0, -13.0))
	draw_circle(grove_pt, 22.0, Color(0.1, 0.3, 0.18, 0.35))
	draw_arc(grove_pt, 22.0, 0.0, TAU, 24, Color(0.2, 0.6, 0.35, 0.5), 1.0)

	# Kalyani Pool (22, 18)
	var kalyani_pt = world_to_map_coord(Vector3(22.0, 0, 18.0))
	draw_circle(kalyani_pt, 20.0, Color(0.1, 0.25, 0.45, 0.4))
	draw_arc(kalyani_pt, 20.0, 0.0, TAU, 24, Color(0.25, 0.65, 0.95, 0.6), 1.0)

	# Watchtower Ruins (55, -45)
	var watch_pt = world_to_map_coord(Vector3(55.0, 0, -45.0))
	draw_circle(watch_pt, 24.0, Color(0.4, 0.12, 0.12, 0.4))
	draw_arc(watch_pt, 24.0, 0.0, TAU, 24, Color(0.9, 0.25, 0.25, 0.6), 1.0)

	# 4. Canonical Landmarks
	var default_font = ThemeDB.fallback_font
	for lm in LANDMARKS:
		var pt = world_to_map_coord(lm["pos"])
		# Draw node marker
		draw_circle(pt, 4.0, lm["color"])
		draw_circle(pt, 6.0, Color(lm["color"].r, lm["color"].g, lm["color"].b, 0.4))
		# Draw text label
		if default_font:
			var label_pos = pt + Vector2(8.0, 3.0)
			draw_string(default_font, label_pos, lm["name"], HORIZONTAL_ALIGNMENT_LEFT, -1, 9, Color(0.85, 0.9, 0.95, 0.9))

	# 5. Active Waypoint Pin
	if has_waypoint:
		var wp_pt = world_to_map_coord(waypoint_pos)
		# Draw pulsing diamond pin
		var diamond: PackedVector2Array = [
			wp_pt + Vector2(0, -9),
			wp_pt + Vector2(7, 0),
			wp_pt + Vector2(0, 9),
			wp_pt + Vector2(-7, 0)
		]
		draw_colored_polygon(diamond, Color(1.0, 0.88, 0.2, 0.95))
		draw_polyline(diamond, Color(1.0, 1.0, 1.0, 0.9), 1.5)
		draw_arc(wp_pt, 13.0, 0.0, TAU, 20, Color(1.0, 0.8, 0.2, 0.5), 1.2)
		if default_font:
			var dist = player_pos.distance_to(waypoint_pos)
			var wp_str = "⌖ OBJECTIVE [%dm]" % int(dist)
			if not waypoint_label.is_empty():
				wp_str = "⌖ " + waypoint_label + " [%dm]" % int(dist)
			draw_string(default_font, wp_pt + Vector2(-40, -13), wp_str, HORIZONTAL_ALIGNMENT_LEFT, -1, 9, Color(1.0, 0.92, 0.35, 1.0))

	# 6. Live Player Location & Orientation Arrow
	var p_pt = world_to_map_coord(player_pos)
	# Draw arrow pointing along player yaw
	# Note: world yaw 0 is -Z (North/Up on map). Rotation clockwise for +yaw.
	var forward_vec = Vector2(-sin(player_yaw), cos(player_yaw)) * 10.0
	var right_vec = Vector2(cos(player_yaw), sin(player_yaw)) * 6.0

	var arrow_tip = p_pt + forward_vec
	var arrow_left = p_pt - forward_vec * 0.5 - right_vec
	var arrow_right = p_pt - forward_vec * 0.5 + right_vec

	var player_poly: PackedVector2Array = [arrow_tip, arrow_left, p_pt, arrow_right]
	draw_colored_polygon(player_poly, Color(0.2, 0.95, 0.85, 1.0))
	draw_polyline(player_poly, Color(1.0, 1.0, 1.0, 1.0), 1.2)
	draw_arc(p_pt, 8.0, 0.0, TAU, 16, Color(0.2, 0.95, 0.85, 0.5), 1.0)

	# 7. Coordinate Legend
	if default_font:
		var coord_str = "VEER: [%d, %d] | ALT: %dm" % [int(player_pos.x), int(player_pos.z), int(player_pos.y)]
		draw_string(default_font, Vector2(pad + 6, size.y - pad - 6), coord_str, HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(0.6, 0.8, 0.9, 0.85))
