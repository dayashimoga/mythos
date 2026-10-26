class_name WorldCollisionBuilder
extends RefCounted

## Master Level Collision Engine & Physical Integrity Subsystem
## Stage Q9: Physical Integrity, Collisions & Camera Correction
## Automatically inspects, generates, and calibrates physically correct 3D collision
## geometry for all architectural structures, staircases, pillars, boulders, and terrain
## across all seven mythological realms.

const ENVIRONMENT_LAYER: int = 1 # Physics Layer 1: Environment

## Builds and registers physical collisions recursively for any node hierarchy
static func build_collisions(root_node: Node) -> int:
	if not root_node:
		return 0
	
	var count: int = 0
	count += _process_node(root_node)
	return count

static func _process_node(node: Node) -> int:
	var created_count: int = 0
	
	# Skip nodes that are players, enemies, NPCs, hitboxes, pickups, or areas
	if node is CharacterBody3D or node is Area3D:
		return 0
	
	var lower_name: String = node.name.to_lower()
	
	# Check if this node is a MeshInstance3D needing physical collision
	if node is MeshInstance3D and node.visible:
		var has_collider: bool = _has_existing_collision(node)
		if not has_collider:
			if _should_have_collision(node, lower_name):
				if _create_collision_for_mesh(node, lower_name):
					created_count += 1
	
	# Also inspect instantiated GLB PackedScene roots (often Node3D containers)
	if node is Node3D and not (node is MeshInstance3D) and not (node is CollisionObject3D):
		if _is_architectural_container(lower_name):
			# If this container contains MeshInstances with no collision, generate for them
			for child in node.get_children():
				if child is MeshInstance3D and not _has_existing_collision(child):
					if _create_collision_for_mesh(child, lower_name):
						created_count += 1
	
	# Recurse through children
	for child in node.get_children():
		if not (child is CharacterBody3D) and not (child is Area3D):
			created_count += _process_node(child)
			
	return created_count

## Determines if this node or its immediate parent already has a StaticBody3D collider
static func _has_existing_collision(node: Node) -> bool:
	if node is CollisionObject3D:
		return true
	var parent = node.get_parent()
	while parent:
		if parent is CollisionObject3D:
			return true
		parent = parent.get_parent()
	parent = node.get_parent()
	if parent:
		for sibling in parent.get_children():
			if sibling is CollisionShape3D or sibling is StaticBody3D:
				return true
	for child in node.get_children():
		if child is CollisionObject3D or child is CollisionShape3D:
			return true
	return false

## Decides if an object is solid geometry or purely decorative
static func _should_have_collision(_mesh_node: MeshInstance3D, name_lower: String) -> bool:
	# Purely decorative items or collectibles that should not block character navigation
	if "shrub" in name_lower or "grass" in name_lower or "flower" in name_lower or "leaf" in name_lower or "particle" in name_lower or "slash" in name_lower:
		return false
	if "water" in name_lower or "basin_water" in name_lower:
		return false # Water surfaces are traversable / swimming
	if "shard" in name_lower or "crystal" in name_lower or "pickup" in name_lower or "relic" in name_lower or "mandala" in name_lower or "flame" in name_lower:
		return false
	return true

## Checks if node name represents known architectural or environmental GLB models
static func _is_architectural_container(name_lower: String) -> bool:
	var keys = [
		"shikhara", "torana", "column", "pillar", "ghat", "stairs", "watchtower",
		"bastion", "chamber", "citadel", "pavilion", "shelf", "pedestal",
		"boulder", "outcrop", "stalagmite", "stalactite", "archway", "banyan", "sal", "champaka"
	]
	for k in keys:
		if k in name_lower:
			return true
	return false

## Creates precise static collision geometry matching the visual mesh
static func _create_collision_for_mesh(mesh_node: MeshInstance3D, context_name: String) -> bool:
	var mesh = mesh_node.mesh
	if not mesh:
		return false
	
	var static_body = StaticBody3D.new()
	static_body.name = mesh_node.name + "_StaticBody"
	static_body.collision_layer = ENVIRONMENT_LAYER
	static_body.collision_mask = 0 # Static bodies do not scan masks
	static_body.add_to_group("environment_collisions")
	
	var shape: Shape3D = null
	var combined_name = (mesh_node.name + " " + context_name).to_lower()
	
	# 1. Pillars & Columns: Use Cylinder Collider
	if "column" in combined_name or "pillar" in combined_name or "col_" in combined_name:
		var aabb = mesh.get_aabb()
		var cyl = CylinderShape3D.new()
		cyl.height = max(1.0, aabb.size.y)
		cyl.radius = max(0.35, max(aabb.size.x, aabb.size.z) * 0.48)
		shape = cyl
		
		var col_shape = CollisionShape3D.new()
		col_shape.name = "PillarCollisionShape"
		col_shape.shape = shape
		# Center cylinder on column height
		col_shape.position = aabb.position + Vector3(aabb.size.x * 0.5, aabb.size.y * 0.5, aabb.size.z * 0.5)
		static_body.add_child(col_shape)
	
	# 2. Trees (Banyan, Sal, Champaka): Solid Trunk Cylinder at base
	elif "banyan" in combined_name or "sal_tree" in combined_name or "champaka" in combined_name:
		var aabb = mesh.get_aabb()
		var cyl = CylinderShape3D.new()
		var trunk_height = min(6.0, aabb.size.y * 0.55)
		cyl.height = trunk_height
		var trunk_radius = 1.1 if "banyan" in combined_name else 0.55
		cyl.radius = trunk_radius
		shape = cyl
		
		var col_shape = CollisionShape3D.new()
		col_shape.name = "TrunkCollisionShape"
		col_shape.shape = shape
		col_shape.position = Vector3(0.0, trunk_height * 0.5, 0.0)
		static_body.add_child(col_shape)
	
	# 3. Stairs (Water Ghat Stairs): Precise Trimesh + Smooth Stair Ramp Wedge
	elif "ghat" in combined_name or "stairs" in combined_name or "step" in combined_name:
		var trimesh_shape = mesh.create_trimesh_shape()
		if trimesh_shape:
			shape = trimesh_shape
			var col_shape = CollisionShape3D.new()
			col_shape.name = "StairsTrimeshShape"
			col_shape.shape = shape
			static_body.add_child(col_shape)
		
		# Add smooth invisible slope ramp collider for fluid character locomotion
		var aabb = mesh.get_aabb()
		var ramp_box = BoxShape3D.new()
		var ramp_len = sqrt(aabb.size.y * aabb.size.y + aabb.size.z * aabb.size.z)
		ramp_box.size = Vector3(aabb.size.x * 0.96, 0.12, ramp_len * 0.98)
		
		var ramp_col = CollisionShape3D.new()
		ramp_col.name = "StairSmoothRampShape"
		ramp_col.shape = ramp_box
		var angle = atan2(aabb.size.y, aabb.size.z)
		ramp_col.rotation.x = angle
		ramp_col.position = aabb.position + Vector3(aabb.size.x * 0.5, aabb.size.y * 0.5, aabb.size.z * 0.5)
		static_body.add_child(ramp_col)
	
	# 4. Complex Architecture, Caverns, Bastions, Rooftops, Sanctum Walls & Boulders: Exact Trimesh
	else:
		var trimesh_shape = mesh.create_trimesh_shape()
		if trimesh_shape:
			shape = trimesh_shape
			var col_shape = CollisionShape3D.new()
			col_shape.name = "ArchitectureTrimeshShape"
			col_shape.shape = shape
			static_body.add_child(col_shape)
	
	if static_body.get_child_count() > 0:
		mesh_node.add_child(static_body)
		return true
	
	static_body.free()
	return false
