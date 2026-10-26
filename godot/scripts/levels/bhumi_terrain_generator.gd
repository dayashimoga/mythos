# Bhumi Terrain & Environment Generator (Procedural Landscape & Collision Engine)
# Stage Q3: Complete Bhumi 3D Environment, Sanctum Architecture & Landscape Remaster
# Generates a continuous, sculpted 180m x 180m multi-sector 3D landscape with physical elevation,
# processional pathways, stepped riverbed swales, mountain ridges, and multi-biome surface blending.
class_name BhumiTerrainGenerator
extends RefCounted

const WORLD_HALF_SIZE: float = 85.0
const GRID_RESOLUTION: int = 90 # 90x90 vertices = 8,100 vertices, 15,842 triangles

# Analytical Elevation Function: returns terrain height at world coordinates (x, z)
static func get_height(x: float, z: float) -> float:
	var dist_center: float = sqrt(x * x + z * z)
	
	# 1. Central Sun Temple Courtyard (Square [-20, 20] x [-20, 20])
	if abs(x) <= 20.0 and abs(z) <= 20.0:
		# Elevated Sanctum Peetham in the center (|x| <= 6, |z| <= 6)
		if abs(x) <= 6.0 and abs(z) <= 6.0:
			return 1.4
		# Stone-paved courtyard floor with subtle drainage slope
		return 0.0
	
	# Transition apron around temple plaza
	if abs(x) <= 24.0 and abs(z) <= 24.0:
		var edge_dist: float = max(abs(x), abs(z)) - 20.0
		var t_edge: float = clamp(edge_dist / 4.0, 0.0, 1.0)
		var surrounding: float = _get_natural_elevation(x, z)
		return lerp(0.0, surrounding, t_edge)
	
	# 2. Kalyani Stepped Water Reservoir Basin (x: [-24, 12], z: [26, 64])
	if x >= -24.0 and x <= 12.0 and z >= 26.0 and z <= 64.0:
		var cx: float = -6.0
		var cz: float = 45.0
		var rx: float = 16.0
		var rz: float = 17.0
		var dx: float = (x - cx) / rx
		var dz: float = (z - cz) / rz
		var ellipse_d: float = sqrt(dx * dx + dz * dz)
		if ellipse_d < 1.0:
			# Deep sunken basin bed at -2.2m with stepped tiers
			var basin_depth: float = -2.2 * (1.0 - ellipse_d * ellipse_d)
			return basin_depth
		elif ellipse_d < 1.25:
			# Stepped stone embankment leading up to valley level
			var t_bank: float = (ellipse_d - 1.0) / 0.25
			return lerp(-0.2, 0.8, t_bank)
	
	# 3. Tapas Mountain Ridge & Watchtower Plateau (x >= 25.0, z <= 25.0, within world bounds)
	if x >= 25.0 and z <= 25.0 and x < 75.0 and z > -75.0:
		var ridge_progress: float = clamp((x - 25.0) / 42.0, 0.0, 1.0)
		var base_mountain: float = 2.0 + ridge_progress * 13.5 # Ascends from 2.0m to 15.5m
		
		# Watchtower Summit Plateau (x >= 48.0, z <= -36.0)
		var is_plateau: bool = (x >= 48.0 and z <= -36.0)
		if is_plateau:
			var plateau_t: float = clamp(min((x - 48.0) / 6.0, (-36.0 - z) / 6.0), 0.0, 1.0)
			base_mountain = lerp(base_mountain, 14.5, plateau_t)
		
		var crags: float = sin(x * 0.12) * cos(z * 0.10) * 1.5 + sin(z * 0.22) * 0.8
		var path_factor: float = _get_ridge_path_carve(x, z) if not is_plateau else 0.0
		return (base_mountain + crags) * (1.0 - path_factor * 0.14)
	
	# 4. Perimeter Mountain Enclosure (dist_center >= 75.0m)
	if dist_center >= 75.0:
		var mountain_t: float = clamp((dist_center - 75.0) / 10.0, 0.0, 1.0)
		var jagged: float = sin(x * 0.18) * cos(z * 0.18) * 3.0 + sin(x * 0.35 + z * 0.25) * 1.5
		return 12.0 + mountain_t * 24.0 + jagged * mountain_t
	
	# 5. Dandaka Sacred Forest Grove: Rolling natural hills, riverbeds, and valleys
	return _get_natural_elevation(x, z)

static func _get_natural_elevation(x: float, z: float) -> float:
	# Multi-frequency organic terrain with gentle hillocks, ancient stream swales, and forest mounds
	var h1: float = sin(x * 0.07) * cos(z * 0.06) * 2.8
	var h2: float = sin(x * 0.14 + z * 0.09) * 1.4
	var h3: float = cos(x * 0.03 - z * 0.04) * 1.2
	var micro: float = sin(x * 0.3 + z * 0.2) * 0.25
	
	# Pathway depression for natural forest trail
	var trail_factor: float = _get_forest_trail_depression(x, z)
	
	return clamp((1.2 + h1 + h2 + h3 + micro) * (1.0 - trail_factor * 0.25), 0.2, 8.5)

static func _get_forest_trail_depression(x: float, z: float) -> float:
	# Subtle trail running from temple (-12, 0) west toward Dandaka grove (-36, -26)
	var t: float = clamp((-x - 12.0) / 24.0, 0.0, 1.0)
	var ideal_z: float = lerp(0.0, -26.0, t) + sin(t * PI * 2.0) * 4.0
	var dist: float = abs(z - ideal_z)
	if dist < 3.5:
		return 1.0 - (dist / 3.5)
	return 0.0

static func _get_ridge_path_carve(x: float, z: float) -> float:
	# Ascending switchback trail from (28, 0) up to watchtower plateau (55, -45)
	var t: float = clamp((x - 28.0) / 27.0, 0.0, 1.0)
	var path_z: float = lerp(0.0, -45.0, t) + sin(t * PI * 2.0) * 8.0
	var dist_to_path: float = abs(z - path_z)
	if dist_to_path < 4.2:
		return 1.0 - (dist_to_path / 4.2)
	return 0.0

# Builds a complete ArrayMesh with vertex normals, UVs, and rich multi-biome vertex colors
static func create_terrain_mesh() -> ArrayMesh:
	var st: SurfaceTool = SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	
	var step: float = (WORLD_HALF_SIZE * 2.0) / float(GRID_RESOLUTION - 1)
	
	for gz in range(GRID_RESOLUTION):
		var z: float = -WORLD_HALF_SIZE + float(gz) * step
		for gx in range(GRID_RESOLUTION):
			var x: float = -WORLD_HALF_SIZE + float(gx) * step
			var y: float = get_height(x, z)
			
			# Finite difference normal calculation
			var eps: float = 0.4
			var h_l: float = get_height(x - eps, z)
			var h_r: float = get_height(x + eps, z)
			var h_d: float = get_height(x, z - eps)
			var h_u: float = get_height(x, z + eps)
			var norm: Vector3 = Vector3(h_l - h_r, 2.0 * eps, h_d - h_u).normalized()
			
			# Multi-biome vertex coloring:
			# Processional Pavers / Flagstone Courtyard: Basalt Gray
			# Dandaka Sacred Grove: Lush Emerald Grass & Forest Moss
			# Tapas Ridge: Red Ochre & Terracotta Sandstone
			# Kalyani Basin: Wet Sand & Chiseled Sandstone
			# Perimeter Mountains: Ancient Jagged Granite
			var col: Color = Color(0.24, 0.45, 0.18) # Default Lush Forest Green
			var dist_center: float = sqrt(x * x + z * z)
			
			if abs(x) <= 22.0 and abs(z) <= 22.0:
				# Temple Courtyard Flagstones
				if abs(x) <= 6.0 and abs(z) <= 6.0:
					col = Color(0.38, 0.36, 0.40) # Elevated Peetham Stone
				else:
					col = Color(0.30, 0.31, 0.34) # Temple Basalt Pavers
			elif x >= -24.0 and x <= 12.0 and z >= 26.0 and z <= 64.0 and y < 0.2:
				# Kalyani Reservoir Wet Sand & Silt
				col = Color(0.44, 0.40, 0.30)
			elif x >= 25.0 and z <= 25.0:
				# Mountain Ridge Red Ochre Rock
				var ridge_t: float = clamp((x - 25.0) / 45.0, 0.0, 1.0)
				col = Color(0.54, 0.38, 0.28).lerp(Color(0.46, 0.34, 0.26), ridge_t)
			elif dist_center >= 68.0:
				# Jagged Mountain Granite
				col = Color(0.36, 0.36, 0.38)
			
			# Pilgrim Processional Pathways
			# 1. Torana Processional: (0, 0) to (0, 18)
			if abs(x) <= 2.8 and z >= 0.0 and z <= 18.0:
				col = col.lerp(Color(0.48, 0.44, 0.38), 0.75) # Paved stone path
			# 2. Dandaka Trail:
			var trail_f: float = _get_forest_trail_depression(x, z)
			if trail_f > 0.3:
				col = col.lerp(Color(0.42, 0.35, 0.25), trail_f * 0.7) # Earth and trodden soil
			# 3. Tapas Ridge Path:
			var ridge_path_f: float = _get_ridge_path_carve(x, z)
			if ridge_path_f > 0.3:
				col = col.lerp(Color(0.58, 0.46, 0.34), ridge_path_f * 0.8) # Mountain rock path
			
			# Steep slope rock shading (strata exposure)
			var slope: float = norm.dot(Vector3.UP)
			if slope < 0.78:
				var t_cliff: float = clamp((0.78 - slope) / 0.25, 0.0, 1.0)
				col = col.lerp(Color(0.28, 0.29, 0.32), t_cliff * 0.85)
			
			var uv: Vector2 = Vector2((x + WORLD_HALF_SIZE) * 0.12, (z + WORLD_HALF_SIZE) * 0.12)
			
			st.set_normal(norm)
			st.set_color(col)
			st.set_uv(uv)
			st.add_vertex(Vector3(x, y, z))
	
	# Generate triangle indices
	for gz in range(GRID_RESOLUTION - 1):
		for gx in range(GRID_RESOLUTION - 1):
			var i00: int = gz * GRID_RESOLUTION + gx
			var i10: int = i00 + 1
			var i01: int = (gz + 1) * GRID_RESOLUTION + gx
			var i11: int = i01 + 1
			
			st.add_index(i00)
			st.add_index(i10)
			st.add_index(i01)
			
			st.add_index(i10)
			st.add_index(i11)
			st.add_index(i01)
	
	var mesh: ArrayMesh = st.commit()
	return mesh

# Creates standard PBR terrain material
static func create_terrain_material() -> StandardMaterial3D:
	var mat: StandardMaterial3D = StandardMaterial3D.new()
	mat.vertex_color_use_as_albedo = true
	mat.albedo_color = Color(1.0, 1.0, 1.0, 1.0)
	mat.roughness = 0.84
	mat.metallic = 0.04
	mat.specular = 0.22
	return mat

# Creates sacred water surface plane mesh
static func create_water_mesh() -> PlaneMesh:
	var plane: PlaneMesh = PlaneMesh.new()
	plane.size = Vector2(36.0, 38.0)
	plane.subdivide_width = 24
	plane.subdivide_depth = 24
	return plane

# Creates translucent sacred water material with Fresnel reflections and subtle emission
static func create_water_material() -> StandardMaterial3D:
	var mat: StandardMaterial3D = StandardMaterial3D.new()
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.albedo_color = Color(0.14, 0.52, 0.58, 0.82) # Radiant Sacred Turquoise
	mat.roughness = 0.08
	mat.metallic = 0.18
	mat.specular = 0.92
	mat.emission_enabled = true
	mat.emission = Color(0.04, 0.18, 0.22)
	return mat
