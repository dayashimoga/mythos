import bpy
import os
import math
import shutil
from mathutils import Vector, Euler

DOCS_DIR = "h:/mythologicalgame/docs/images/bhumi_reference_q20a"
BRAIN_DIR = "C:/Users/dayan/.gemini/antigravity-ide/brain/76f7b200-4c66-4077-80b0-19baeb9535b1"
ASSETS_DIR = "h:/mythologicalgame/godot/assets"

os.makedirs(DOCS_DIR, exist_ok=True)
os.makedirs(BRAIN_DIR, exist_ok=True)

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items else 'BLENDER_EEVEE'
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'

    # World setup: Vedic solar sky
    world = bpy.data.worlds.new("VedicWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.24, 0.48, 0.82, 1.0)
        bg.inputs[1].default_value = 0.90

    # Key directional sunlight: Lord Surya
    sun_data = bpy.data.lights.new(name="LordSuryaSun", type='SUN')
    sun_data.energy = 4.5
    sun_data.color = (1.0, 0.94, 0.82)
    sun_obj = bpy.data.objects.new(name="LordSuryaSun", object_data=sun_data)
    scene.collection.objects.link(sun_obj)
    sun_obj.rotation_euler = (math.radians(50), math.radians(25), math.radians(-35))

    # Ambient fill light
    fill_data = bpy.data.lights.new(name="FillLight", type='SUN')
    fill_data.energy = 1.2
    fill_data.color = (0.6, 0.75, 0.9)
    fill_obj = bpy.data.objects.new(name="FillLight", object_data=fill_data)
    scene.collection.objects.link(fill_obj)
    fill_obj.rotation_euler = (math.radians(-40), math.radians(-15), math.radians(120))

    # Camera
    cam_data = bpy.data.cameras.new(name="MainCamera")
    cam_data.lens = 38.0
    cam_obj = bpy.data.objects.new(name="MainCamera", object_data=cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    return scene, cam_obj

def point_camera_at(cam_obj, target_pos, cam_pos):
    cam_obj.location = cam_pos
    direction = target_pos - cam_pos
    rot_quat = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()

def import_glb(rel_path, location=(0,0,0), scale=(1,1,1), rotation=(0,0,0)):
    full_path = os.path.join(ASSETS_DIR, rel_path)
    if not os.path.exists(full_path):
        print(f"[WARN] GLB not found: {full_path}")
        return None
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=full_path)
    after = set(bpy.data.objects)
    new_objs = list(after - before)
    if not new_objs:
        return None

    empty = bpy.data.objects.new("Imported_" + os.path.basename(rel_path), None)
    bpy.context.scene.collection.objects.link(empty)
    for obj in new_objs:
        if not obj.parent:
            obj.parent = empty

    empty.location = location
    empty.scale = scale
    empty.rotation_euler = rotation
    return empty

def create_ground(color=(0.20, 0.28, 0.16, 1.0), roughness=0.85):
    bpy.ops.mesh.primitive_plane_add(size=120, location=(0, 0, 0))
    ground = bpy.context.active_object
    mat = bpy.data.materials.new("GroundMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = color
        bsdf.inputs['Roughness'].default_value = roughness
    ground.data.materials.append(mat)
    return ground

def render_and_save(shot_name):
    scene = bpy.context.scene
    out_docs_path = os.path.join(DOCS_DIR, shot_name + ".png")
    out_brain_path = os.path.join(BRAIN_DIR, shot_name + ".png")

    scene.render.filepath = out_docs_path
    bpy.ops.render.render(write_still=True)
    print(f"Rendered: {out_docs_path}")

    shutil.copyfile(out_docs_path, out_brain_path)
    print(f"Copied to brain: {out_brain_path}")

# ==============================================================================
# 1. Dandaka Grove Awakening
# ==============================================================================
def render_01():
    print("--- Rendering Shot 01: Dandaka Grove Awakening ---")
    scene, cam = reset_scene()
    create_ground(color=(0.18, 0.26, 0.14, 1.0))

    import_glb("characters/veer/veer.glb", location=(0, 0, 0), scale=(1, 1, 1), rotation=(0, 0, math.radians(20)))
    import_glb("environment/banyan_tree.glb", location=(-4.5, 4.0, 0), scale=(0.85, 0.85, 0.85))
    import_glb("environment/sal_tree.glb", location=(4.8, 3.5, 0), scale=(0.85, 0.85, 0.85))
    import_glb("environment/stone_lantern.glb", location=(2.2, 0.5, 0), scale=(0.7, 0.7, 0.7))
    import_glb("environment/flowering_shrub.glb", location=(-2.4, 1.2, 0), scale=(0.7, 0.7, 0.7))
    import_glb("environment/basalt_boulder.glb", location=(-3.8, 1.0, 0), scale=(0.75, 0.75, 0.75))

    point_camera_at(cam, Vector((0.0, 0.0, 1.0)), Vector((0.0, -4.8, 1.6)))
    render_and_save("01_bhumi_dandaka_grove_awakening_q20a")

# ==============================================================================
# 2. Devi Tara Commune
# ==============================================================================
def render_02():
    print("--- Rendering Shot 02: Devi Tara Commune ---")
    scene, cam = reset_scene()
    create_ground(color=(0.36, 0.34, 0.28, 1.0), roughness=0.6)

    import_glb("characters/veer/veer.glb", location=(-1.2, 0.0, 0), scale=(1, 1, 1), rotation=(0, 0, math.radians(70)))
    import_glb("characters/npcs/devi_tara.glb", location=(1.2, 0.0, 0), scale=(1, 1, 1), rotation=(0, 0, math.radians(-110)))
    import_glb("environment/lotus_pedestal.glb", location=(1.2, 0.0, 0), scale=(0.75, 0.75, 0.75))
    import_glb("environment/champaka_tree.glb", location=(4.5, 3.5, 0), scale=(0.8, 0.8, 0.8))
    import_glb("environment/temple_column.glb", location=(-3.6, 2.5, 0), scale=(0.8, 0.8, 0.8))

    pl_data = bpy.data.lights.new(name="OracleLight", type='POINT')
    pl_data.energy = 50.0
    pl_data.color = (1.0, 0.85, 0.4)
    pl_obj = bpy.data.objects.new(name="OracleLight", object_data=pl_data)
    scene.collection.objects.link(pl_obj)
    pl_obj.location = (1.2, -0.4, 1.8)

    point_camera_at(cam, Vector((0.0, 0.0, 1.1)), Vector((0.0, -4.5, 1.5)))
    render_and_save("02_bhumi_devi_tara_commune_q20a")

# ==============================================================================
# 3. Kalyani Reservoir Shard
# ==============================================================================
def render_03():
    print("--- Rendering Shot 03: Kalyani Reservoir Shard ---")
    scene, cam = reset_scene()

    bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 0, -0.4))
    water = bpy.context.active_object
    mat = bpy.data.materials.new("WaterMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.04, 0.24, 0.36, 1.0)
        bsdf.inputs['Roughness'].default_value = 0.08
        bsdf.inputs['Metallic'].default_value = 0.3
    water.data.materials.append(mat)

    import_glb("environment/water_ghat_stairs.glb", location=(0, 3.0, 0), scale=(1.0, 1.0, 1.0))
    import_glb("characters/veer/veer.glb", location=(-1.8, 0.5, 0.1), scale=(1, 1, 1), rotation=(0, 0, math.radians(45)))
    import_glb("environment/stone_lantern.glb", location=(-3.0, 1.5, 0.1), scale=(0.7, 0.7, 0.7))

    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.35, location=(0.8, 1.5, 0.3))
    shard = bpy.context.active_object
    s_mat = bpy.data.materials.new("ShardGlow")
    s_mat.use_nodes = True
    s_bsdf = s_mat.node_tree.nodes.get("Principled BSDF")
    if s_bsdf:
        s_bsdf.inputs['Emission Color'].default_value = (0.2, 0.85, 1.0, 1.0)
        s_bsdf.inputs['Emission Strength'].default_value = 10.0
    shard.data.materials.append(s_mat)

    pl_data = bpy.data.lights.new(name="ShardLight", type='POINT')
    pl_data.energy = 80.0
    pl_data.color = (0.2, 0.75, 1.0)
    pl_obj = bpy.data.objects.new(name="ShardLight", object_data=pl_data)
    scene.collection.objects.link(pl_obj)
    pl_obj.location = (0.8, 1.5, 0.6)

    point_camera_at(cam, Vector((0.0, 1.2, 0.8)), Vector((0.0, -4.5, 2.0)))
    render_and_save("03_bhumi_kalyani_reservoir_shard_q20a")

# ==============================================================================
# 4. Tamas Barrier Tapas Ridge
# ==============================================================================
def render_04():
    print("--- Rendering Shot 04: Tamas Barrier Tapas Ridge ---")
    scene, cam = reset_scene()
    create_ground(color=(0.32, 0.25, 0.20, 1.0), roughness=0.9)

    import_glb("environment/rock_outcrop.glb", location=(-4.5, 3.0, 0), scale=(1.2, 1.2, 1.8))
    import_glb("environment/rock_outcrop.glb", location=(4.5, 3.0, 0), scale=(1.2, 1.2, 1.8), rotation=(0, 0, math.radians(180)))
    import_glb("characters/veer/veer.glb", location=(0, -1.8, 0), scale=(1, 1, 1), rotation=(0, 0, 0))

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 2.5, 1.8))
    barrier = bpy.context.active_object
    barrier.scale = (5.0, 0.3, 3.6)
    b_mat = bpy.data.materials.new("TamasMat")
    b_mat.use_nodes = True
    b_bsdf = b_mat.node_tree.nodes.get("Principled BSDF")
    if b_bsdf:
        b_bsdf.inputs['Base Color'].default_value = (0.10, 0.01, 0.16, 1.0)
        b_bsdf.inputs['Emission Color'].default_value = (0.6, 0.05, 0.85, 1.0)
        b_bsdf.inputs['Emission Strength'].default_value = 6.0
    barrier.data.materials.append(b_mat)

    import_glb("characters/enemies/asura_warrior.glb", location=(0, 5.0, 0), scale=(1.1, 1.1, 1.1), rotation=(0, 0, math.radians(180)))

    point_camera_at(cam, Vector((0, 2.0, 1.5)), Vector((0, -6.0, 2.2)))
    render_and_save("04_bhumi_tamas_barrier_tapas_ridge_q20a")

# ==============================================================================
# 5. Temple Grand Staircase
# ==============================================================================
def render_05():
    print("--- Rendering Shot 05: Temple Grand Staircase ---")
    scene, cam = reset_scene()
    create_ground(color=(0.35, 0.32, 0.28, 1.0), roughness=0.7)

    import_glb("environment/temple_torana.glb", location=(0, 0, 0), scale=(1.0, 1.0, 1.0))
    import_glb("environment/temple_column.glb", location=(-3.2, 3.5, 0), scale=(1.0, 1.0, 1.0))
    import_glb("environment/temple_column.glb", location=(3.2, 3.5, 0), scale=(1.0, 1.0, 1.0))
    import_glb("environment/temple_shikhara.glb", location=(0, 10.0, 1.5), scale=(1.2, 1.2, 1.2))
    import_glb("characters/veer/veer.glb", location=(0, -2.5, 0), scale=(1, 1, 1), rotation=(0, 0, 0))

    point_camera_at(cam, Vector((0, 3.0, 2.2)), Vector((0, -7.5, 2.4)))
    render_and_save("05_bhumi_temple_grand_staircase_q20a")

# ==============================================================================
# 6. Sanctum Surya Altar
# ==============================================================================
def render_06():
    print("--- Rendering Shot 06: Sanctum Surya Altar ---")
    scene, cam = reset_scene()
    create_ground(color=(0.38, 0.35, 0.30, 1.0), roughness=0.6)

    import_glb("environment/temple_column.glb", location=(-3.5, 2.0, 0), scale=(1.0, 1.0, 1.0))
    import_glb("environment/temple_column.glb", location=(3.5, 2.0, 0), scale=(1.0, 1.0, 1.0))
    import_glb("environment/lotus_pedestal.glb", location=(0, 2.5, 0), scale=(1.2, 1.2, 0.9))
    import_glb("characters/veer/veer.glb", location=(0, -0.8, 0), scale=(1, 1, 1), rotation=(0, 0, 0))

    bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=0.35, location=(0, 2.5, 1.1))
    brazier = bpy.context.active_object
    b_mat = bpy.data.materials.new("GoldAltar")
    b_mat.use_nodes = True
    b_bsdf = b_mat.node_tree.nodes.get("Principled BSDF")
    if b_bsdf:
        b_bsdf.inputs['Base Color'].default_value = (0.9, 0.72, 0.18, 1.0)
        b_bsdf.inputs['Metallic'].default_value = 0.9
        b_bsdf.inputs['Roughness'].default_value = 0.2
    brazier.data.materials.append(b_mat)

    al_data = bpy.data.lights.new(name="AltarBeacon", type='POINT')
    al_data.energy = 140.0
    al_data.color = (1.0, 0.88, 0.35)
    al_obj = bpy.data.objects.new(name="AltarBeacon", object_data=al_data)
    scene.collection.objects.link(al_obj)
    al_obj.location = (0, 2.5, 1.8)

    point_camera_at(cam, Vector((0, 1.8, 1.3)), Vector((0, -4.6, 1.8)))
    render_and_save("06_bhumi_sanctum_surya_altar_q20a")

# ==============================================================================
# 7. Boss General Kalanemi Encounter
# ==============================================================================
def render_07():
    print("--- Rendering Shot 07: Boss General Kalanemi Encounter ---")
    scene, cam = reset_scene()
    create_ground(color=(0.30, 0.26, 0.22, 1.0), roughness=0.85)

    import_glb("environment/ruined_watchtower.glb", location=(6.5, 6.0, 0), scale=(1.0, 1.0, 1.0))
    import_glb("environment/rock_outcrop.glb", location=(-5.5, 4.0, 0), scale=(1.4, 1.4, 1.6))
    import_glb("characters/veer/veer.glb", location=(-1.8, -0.5, 0), scale=(1, 1, 1), rotation=(0, 0, math.radians(45)))
    import_glb("characters/enemies/boss_kalanemi.glb", location=(1.8, 1.5, 0), scale=(1.25, 1.25, 1.25), rotation=(0, 0, math.radians(-135)))

    bl_data = bpy.data.lights.new(name="BossAura", type='POINT')
    bl_data.energy = 110.0
    bl_data.color = (1.0, 0.15, 0.05)
    bl_obj = bpy.data.objects.new(name="BossAura", object_data=bl_data)
    scene.collection.objects.link(bl_obj)
    bl_obj.location = (1.8, 1.5, 2.2)

    point_camera_at(cam, Vector((0.0, 0.6, 1.3)), Vector((0.0, -5.2, 1.9)))
    render_and_save("07_bhumi_boss_kalanemi_encounter_q20a")

# ==============================================================================
# 8. Antariksha Portal Consecration
# ==============================================================================
def render_08():
    print("--- Rendering Shot 08: Antariksha Portal Consecration ---")
    scene, cam = reset_scene()
    create_ground(color=(0.36, 0.34, 0.30, 1.0), roughness=0.6)

    import_glb("environment/temple_column.glb", location=(-3.8, 2.0, 0), scale=(1.1, 1.1, 1.1))
    import_glb("environment/temple_column.glb", location=(3.8, 2.0, 0), scale=(1.1, 1.1, 1.1))
    import_glb("characters/veer/veer.glb", location=(0, -2.0, 0), scale=(1, 1, 1), rotation=(0, 0, 0))

    bpy.ops.mesh.primitive_torus_add(major_radius=2.0, minor_radius=0.18, location=(0, 2.5, 2.8), rotation=(math.radians(90), 0, 0))
    portal = bpy.context.active_object
    p_mat = bpy.data.materials.new("SkyPortalMat")
    p_mat.use_nodes = True
    p_bsdf = p_mat.node_tree.nodes.get("Principled BSDF")
    if p_bsdf:
        p_bsdf.inputs['Emission Color'].default_value = (0.3, 0.85, 1.0, 1.0)
        p_bsdf.inputs['Emission Strength'].default_value = 10.0
    portal.data.materials.append(p_mat)

    bpy.ops.mesh.primitive_cylinder_add(radius=1.8, depth=14.0, location=(0, 2.5, 7.0))
    beam = bpy.context.active_object
    beam_mat = bpy.data.materials.new("BeamMat")
    beam_mat.use_nodes = True
    beam_bsdf = beam_mat.node_tree.nodes.get("Principled BSDF")
    if beam_bsdf:
        beam_bsdf.inputs['Emission Color'].default_value = (0.9, 0.95, 1.0, 1.0)
        beam_bsdf.inputs['Emission Strength'].default_value = 6.0
    beam.data.materials.append(beam_mat)

    point_camera_at(cam, Vector((0, 2.0, 2.5)), Vector((0, -6.0, 2.2)))
    render_and_save("08_bhumi_antariksha_portal_consecration_q20a")

if __name__ == "__main__":
    render_01()
    render_02()
    render_03()
    render_04()
    render_05()
    render_06()
    render_07()
    render_08()
    print("ALL 8 BHUMI REFERENCE RENDERS COMPLETED SUCCESSFULLY.")
