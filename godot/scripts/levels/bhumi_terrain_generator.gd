# Bhumi Terrain & Environment Generator (Procedural Mesh & Collision Engine)
# Generates a continuous, sculpted 180m x 180m multi-sector 3D landscape for the Mortal Realm of Bhumi.
class_name BhumiTerrainGenerator
extends RefCounted

const WORLD_HALF_SIZE: float = 85.0
const GRID_RESOLUTION: int = 70 # 70x70 vertices = 4,900 vertices, 9,604 triangles

# Analytical Elevation Function: returns terrain height at world coordinates (x, z)
static func get_height(x: float, z: float) -> float:
	var dist_center: float = sqrt(x * x + z * z)
	
	# 1. Central Sun Temple Courtyard (Square [-20, 20] x [-20, 20])
	if abs(x) <= 20.0 and abs(z) <= 20.0:
		# Elevated Sanctum Peetham in the dead center (|x| <= 6, |z| <= 6)
		if abs(x) <= 6.0 and abs(z) <= 6.0:
			return 1.4
		return 0.0
	
	# Transition zone around temple
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
			var basin_depth: float = -2.2 * (1.0 - ellipse_d * ellipse_d)
			return basin_depth
		elif ellipse_d < 1.25:
			var t_bank: float = (ellipse_d - 1.0) / 0.25
			return lerp(-0.2, 0.8, t_bank)
	
	# 3. Tapas Mountain Ridge & Watchtower Plateau (x >= 25.0, z <= 25.0, within world bounds)
	if x >= 25.0 and z <= 25.0 and x < 75.0 and z > -75.0:
		var ridge_progress: float = clamp((x - 25.0) / 45.0, 0.0, 1.0)
		var base_mountain: float = 2.0 + ridge_progress * 13.5 # Up to +15.5m
		var crags: float = sin(x * 0.12) * cos(z * 0.10) * 1.8 + sin(z * 0.22) * 1.2
		var path_factor: float = _get_ridge_path_carve(x, z)
		return (base_mountain + crags) * (1.0 - path_factor * 0.22)
	
	# 4. Perimeter Mountain Enclosure (dist_center >= 75.0m)
	if dist_center >= 75.0:
		var mountain_t: float = clamp((dist_center - 75.0) / 10.0, 0.0, 1.0)
		var jagged: float = sin(x * 0.18) * cos(z * 0.18) * 3.0
		return 12.0 + mountain_t * 24.0 + jagged * mountain_t
	
	# 5. Dandaka Sacred Forest Grove
	return _get_natural_elevation(x, z)

static func _get_natural_elevation(x: float, z: float) -> float:
	# Gentle rolling hills, forest mounds, and riverbed swales
	var h1: float = sin(x * 0.07) * cos(z * 0.06) * 2.8
	var h2: float = sin(x * 0.14 + z * 0.09) * 1.4
	var h3: float = cos(x * 0.03 - z * 0.04) * 1.2
	return clamp(1.2 + h1 + h2 + h3, 0.2, 8.5)

static func _get_ridge_path_carve(x: float, z: float) -> float:
	# Winding path ascending from (28, 0) to (55, -45)
	var t: float = clamp((x - 28.0) / 27.0, 0.0, 1.0)
	var path_z: float = lerp(0.0, -45.0, t) + sin(t * PI * 2.0) * 8.0
	var dist_to_path: float = abs(z - path_z)
	if dist_to_path < 4.0:
		return 1.0 - (dist_to_path / 4.0)
	return 0.0

# Builds a complete ArrayMesh with vertex normals, UVs, and vertex colors
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
			var eps: float = 0.5
			var h_l: float = get_height(x - eps, z)
			var h_r: float = get_height(x + eps, z)
			var h_d: float = get_height(x, z - eps)
			var h_u: float = get_height(x, z + eps)
			var norm: Vector3 = Vector3(h_l - h_r, 2.0 * eps, h_d - h_u).normalized()
			
			# Multi-biome vertex coloring:
			# R: Stone Pavers / Basalt
			# G: Lush Grass / Forest Moss
			# B: Mountain Rock / Sandstone
			var col: Color = Color(0.18, 0.38, 0.15) # Default Forest Green
			var dist_center: float = sqrt(x * x + z * z)
			
			if abs(x) <= 22.0 and abs(z) <= 22.0:
				# Temple Basalt
				col = Color(0.24, 0.25, 0.28)
			elif x >= -24.0 and x <= 12.0 and z >= 26.0 and z <= 64.0 and y < 0.2:
				# Water basin wet stone / sand
				col = Color(0.35, 0.32, 0.24)
			elif x >= 26.0 and z <= 26.0:
				# Mountain Ridge Red Ochre Rock
				col = Color(0.48, 0.36, 0.26)
			elif dist_center >= 68.0:
				# Jagged Mountain Granite
				col = Color(0.32, 0.32, 0.34)
			
			# Steep slope rock shading
			var slope: float = norm.dot(Vector3.UP)
			if slope < 0.75:
				col = col.lerp(Color(0.28, 0.28, 0.30), 0.6)
			
			var uv: Vector2 = Vector2((x + WORLD_HALF_SIZE) * 0.15, (z + WORLD_HALF_SIZE) * 0.15)
			
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
	mat.roughness = 0.88
	mat.metallic = 0.05
	mat.specular = 0.2
	return mat

# Creates sacred water surface plane mesh
static func create_water_mesh() -> PlaneMesh:
	var plane: PlaneMesh = PlaneMesh.new()
	plane.size = Vector2(36.0, 38.0)
	plane.subdivide_width = 16
	plane.subdivide_depth = 16
	return plane

# Creates translucent sacred water material with Fresnel reflections
static func create_water_material() -> StandardMaterial3D:
	var mat: StandardMaterial3D = StandardMaterial3D.new()
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.albedo_color = Color(0.12, 0.45, 0.52, 0.78) # Radiant Turquoise
	mat.roughness = 0.12
	mat.metallic = 0.15
	mat.specular = 0.85
	mat.emission_enabled = true
	mat.emission = Color(0.04, 0.16, 0.20)
	return mat
