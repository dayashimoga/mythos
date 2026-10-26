"""
Veer 3D Geometry Builder
Models genuine 3D polygonal costume, hair, armor, jewelry, and celestial weapon for Hero Veer.
"""

import bpy
import bmesh
import math
from mathutils import Vector, Matrix, Euler

def create_topknot_and_hair(materials):
    bm = bmesh.new()
    
    # 1. Crown topknot bun (Sculpted high warrior bun)
    # Center around (0, -0.045, 1.78), tapering upward to 1.86m
    n_rings = 10
    n_segs = 16
    r_max = 0.065
    z_base = 1.74
    z_top = 1.86
    
    bun_verts = []
    for r in range(n_rings + 1):
        t = r / n_rings
        z = z_base + (z_top - z_base) * t
        # Teardrop / flame profile
        rad = r_max * math.sin(t * math.pi) * (1.1 - 0.3 * t)
        ring = []
        for s in range(n_segs):
            theta = (s / n_segs) * 2 * math.pi
            # Subtle spiral twist along height
            theta += t * 0.8
            x = math.cos(theta) * rad
            y = -0.045 + math.sin(theta) * rad * 0.95
            v = bm.verts.new((x, y, z))
            ring.append(v)
        bun_verts.append(ring)
    
    for r in range(n_rings):
        for s in range(n_segs):
            s_next = (s + 1) % n_segs
            f = bm.faces.new([bun_verts[r][s], bun_verts[r][s_next], bun_verts[r+1][s_next], bun_verts[r+1][s]])
            f.material_index = 6 # Mat_Veer_Hair
            
    # Cap the top
    top_v = bm.verts.new((0.0, -0.045, z_top + 0.005))
    for s in range(n_segs):
        s_next = (s + 1) % n_segs
        f = bm.faces.new([bun_verts[-1][s], bun_verts[-1][s_next], top_v])
        f.material_index = 6
        
    # 2. Golden Keshbandha Ring binding the topknot base (Z = 1.735 to 1.755)
    r_ring_in = 0.052
    r_ring_out = 0.068
    ring_z_bot = 1.735
    ring_z_top = 1.758
    ring_segs = 16
    
    r_verts_bot_in = []
    r_verts_bot_out = []
    r_verts_top_in = []
    r_verts_top_out = []
    for s in range(ring_segs):
        theta = (s / ring_segs) * 2 * math.pi
        cos_t = math.cos(theta)
        sin_t = math.sin(theta)
        y_c = -0.045
        r_verts_bot_in.append(bm.verts.new((cos_t * r_ring_in, y_c + sin_t * r_ring_in * 0.95, ring_z_bot)))
        r_verts_bot_out.append(bm.verts.new((cos_t * r_ring_out, y_c + sin_t * r_ring_out * 0.95, ring_z_bot)))
        r_verts_top_in.append(bm.verts.new((cos_t * r_ring_in, y_c + sin_t * r_ring_in * 0.95, ring_z_top)))
        r_verts_top_out.append(bm.verts.new((cos_t * r_ring_out, y_c + sin_t * r_ring_out * 0.95, ring_z_top)))
        
    for s in range(ring_segs):
        sn = (s + 1) % ring_segs
        # Outer face
        f_out = bm.faces.new([r_verts_bot_out[s], r_verts_bot_out[sn], r_verts_top_out[sn], r_verts_top_out[s]])
        f_out.material_index = 2 # Mat_Veer_Gold
        # Top face
        f_top = bm.faces.new([r_verts_top_out[s], r_verts_top_out[sn], r_verts_top_in[sn], r_verts_top_in[s]])
        f_top.material_index = 2 # Mat_Veer_Gold
        # Bottom face
        f_bot = bm.faces.new([r_verts_bot_in[s], r_verts_bot_in[sn], r_verts_bot_out[sn], r_verts_bot_out[s]])
        f_bot.material_index = 2 # Mat_Veer_Gold

    # 3. Flowing hair volume framing skull, temples, and nape of neck
    hair_rings = 8
    hair_segs = 16
    h_verts = []
    for r in range(hair_rings + 1):
        t = r / hair_rings
        z = 1.76 - t * 0.28 # Down to 1.48 (nape of neck)
        rad_x = 0.088 + t * 0.025
        rad_y = 0.098 + t * 0.028
        ring = []
        for s in range(hair_segs):
            theta = (s / hair_segs) * 2 * math.pi
            # Only cover back and sides (theta from pi/6 to 11pi/6, avoid covering forehead and face)
            is_face = (theta > 5 * math.pi / 4 and theta < 7 * math.pi / 4)
            flare = 0.015 * math.sin(t * math.pi)
            x = math.cos(theta) * (rad_x + flare)
            y = -0.035 + math.sin(theta) * (rad_y + flare)
            if is_face and t > 0.3:
                # Recede hair back from face
                y = max(y, -0.05)
            v = bm.verts.new((x, y, z))
            ring.append(v)
        h_verts.append(ring)
        
    for r in range(hair_rings):
        for s in range(hair_segs):
            sn = (s + 1) % hair_segs
            theta = (s / hair_segs) * 2 * math.pi
            # Skip open face area in lower rings
            if r > 1 and (theta > 4 * math.pi / 3 and theta < 5 * math.pi / 3):
                continue
            f = bm.faces.new([h_verts[r][s], h_verts[r][sn], h_verts[r+1][sn], h_verts[r+1][s]])
            f.material_index = 6 # Mat_Veer_Hair

    mesh = bpy.data.meshes.new("Veer_Hair_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Veer_Hair", mesh)
    for m in materials:
        obj.data.materials.append(m)
    return obj

def create_dhoti(materials):
    bm = bmesh.new()
    
    # 1. Upper Waist Band & Pleated Body wrapping pelvis down to mid-calf (Z = 0.45 to 0.98)
    n_rings = 14
    n_segs = 24
    
    d_verts = []
    for r in range(n_rings + 1):
        t = r / n_rings
        z = 0.98 - t * 0.53 # 0.98 down to 0.45
        
        # Anatomical hip to thigh expansion and tapering
        if t < 0.25: # Waist to hips
            rx = 0.175 + t * 0.07
            ry = 0.145 + t * 0.05
        elif t < 0.6: # Hips to thighs
            rx = 0.195 - (t - 0.25) * 0.04
            ry = 0.160 - (t - 0.25) * 0.03
        else: # Thighs down to mid calf
            rx = 0.180 - (t - 0.6) * 0.05
            ry = 0.150 - (t - 0.6) * 0.04
            
        ring = []
        for s in range(n_segs):
            theta = (s / n_segs) * 2 * math.pi
            # Vertical accordion pleats: subtle ripple on radius
            pleat = 0.008 * math.sin(theta * 16)
            x = math.cos(theta) * (rx + pleat)
            y = 0.01 + math.sin(theta) * (ry + pleat)
            v = bm.verts.new((x, y, z))
            ring.append(v)
        d_verts.append(ring)
        
    for r in range(n_rings):
        for s in range(n_segs):
            sn = (s + 1) % n_segs
            f = bm.faces.new([d_verts[r][s], d_verts[r][sn], d_verts[r+1][sn], d_verts[r+1][s]])
            f.material_index = 3 # Mat_Veer_Dhoti
            
    # 2. Central Front Folded Kashta (Pleated front drape panel)
    # Spans from (X ~ -0.10 to +0.10), Z from 0.96 down to 0.40, hanging in front (Y ~ -0.15 to -0.16)
    k_steps_z = 12
    k_folds_x = 8
    k_verts = []
    for r in range(k_steps_z + 1):
        tz = r / k_steps_z
        z = 0.96 - tz * 0.56 # Down to 0.40
        y = -0.150 - tz * 0.015 # Slants slightly forward
        row = []
        for c in range(k_folds_x + 1):
            tx = c / k_folds_x
            x = -0.10 + tx * 0.20
            # Accordion crease depth
            depth = 0.014 * math.sin(tx * math.pi * 6)
            v = bm.verts.new((x, y - depth, z))
            row.append(v)
        k_verts.append(row)
        
    for r in range(k_steps_z):
        for c in range(k_folds_x):
            f = bm.faces.new([k_verts[r][c], k_verts[r][c+1], k_verts[r+1][c+1], k_verts[r+1][c]])
            f.material_index = 3 # Mat_Veer_Dhoti

    mesh = bpy.data.meshes.new("Veer_Dhoti_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Veer_Dhoti", mesh)
    for m in materials:
        obj.data.materials.append(m)
    return obj

def create_kamarband_and_buckle(materials):
    bm = bmesh.new()
    
    # 1. Waist Girdle (Wide golden band at Z = 0.94 to 1.02)
    n_segs = 24
    z_bot = 0.94
    z_top = 1.02
    rx = 0.178
    ry = 0.148
    thick = 0.012
    
    b_bot_in = []
    b_bot_out = []
    b_top_in = []
    b_top_out = []
    for s in range(n_segs):
        theta = (s / n_segs) * 2 * math.pi
        cos_t = math.cos(theta)
        sin_t = math.sin(theta)
        y_c = 0.005
        b_bot_in.append(bm.verts.new((cos_t * rx, y_c + sin_t * ry, z_bot)))
        b_bot_out.append(bm.verts.new((cos_t * (rx + thick), y_c + sin_t * (ry + thick), z_bot)))
        b_top_in.append(bm.verts.new((cos_t * rx, y_c + sin_t * ry, z_top)))
        b_top_out.append(bm.verts.new((cos_t * (rx + thick), y_c + sin_t * (ry + thick), z_top)))
        
    for s in range(n_segs):
        sn = (s + 1) % n_segs
        f_out = bm.faces.new([b_bot_out[s], b_bot_out[sn], b_top_out[sn], b_top_out[s]])
        f_out.material_index = 2 # Mat_Veer_Gold
        f_top = bm.faces.new([b_top_out[s], b_top_out[sn], b_top_in[sn], b_top_in[s]])
        f_top.material_index = 2
        f_bot = bm.faces.new([b_bot_in[s], b_bot_in[sn], b_bot_out[sn], b_bot_out[s]])
        f_bot.material_index = 2

    # 2. Central 12-Petal Surya Lotus Medallion Buckle (Front Center)
    # Center at (0.0, -0.165, 0.98), facing forward (-Y)
    center = Vector((0.0, -0.165, 0.98))
    r_disc = 0.065
    n_petals = 12
    
    c_vert = bm.verts.new(center)
    p_verts = []
    p_tips = []
    for i in range(n_petals):
        angle = (i / n_petals) * 2 * math.pi
        x = math.cos(angle) * r_disc
        z = math.sin(angle) * r_disc
        v = bm.verts.new((center.x + x, center.y - 0.005, center.z + z))
        p_verts.append(v)
        
        # Radiating petal tips
        x_tip = math.cos(angle) * (r_disc + 0.020)
        z_tip = math.sin(angle) * (r_disc + 0.020)
        vt = bm.verts.new((center.x + x_tip, center.y - 0.008, center.z + z_tip))
        p_tips.append(vt)
        
    for i in range(n_petals):
        i_next = (i + 1) % n_petals
        f_disc = bm.faces.new([c_vert, p_verts[i], p_verts[i_next]])
        f_disc.material_index = 2 # Mat_Veer_Gold
        
        # Petal triangle
        f_tip = bm.faces.new([p_verts[i], p_tips[i], p_verts[i_next]])
        f_tip.material_index = 2
        
    # Raised center ruby jewel
    c_ruby = bm.verts.new((center.x, center.y - 0.015, center.z))
    r_ruby = 0.025
    ruby_ring = []
    for s in range(8):
        angle = (s / 8) * 2 * math.pi
        v = bm.verts.new((center.x + math.cos(angle) * r_ruby, center.y - 0.008, center.z + math.sin(angle) * r_ruby))
        ruby_ring.append(v)
    for s in range(8):
        sn = (s + 1) % 8
        f_rub = bm.faces.new([c_ruby, ruby_ring[s], ruby_ring[sn]])
        f_rub.material_index = 2 # Mat_Veer_Gold with ruby texture

    # 3. Hanging Side Tassels (Left Hip)
    t_start = Vector((0.17, -0.06, 0.95))
    t_end = Vector((0.19, -0.05, 0.70))
    n_t_segs = 6
    t_verts = []
    for i in range(n_t_segs + 1):
        t = i / n_t_segs
        pos = t_start.lerp(t_end, t)
        rad = 0.014 * (1.0 + t * 0.5)
        ring = []
        for s in range(6):
            a = (s / 6) * 2 * math.pi
            v = bm.verts.new((pos.x + math.cos(a) * rad, pos.y + math.sin(a) * rad, pos.z))
            ring.append(v)
        t_verts.append(ring)
    for i in range(n_t_segs):
        for s in range(6):
            sn = (s + 1) % 6
            f_t = bm.faces.new([t_verts[i][s], t_verts[i][sn], t_verts[i+1][sn], t_verts[i+1][s]])
            f_t.material_index = 2

    mesh = bpy.data.meshes.new("Veer_Kamarband_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Veer_Kamarband", mesh)
    for m in materials:
        obj.data.materials.append(m)
    return obj

def create_kavacha_bracers(materials):
    """Antique bronze forearm bracers with beveled rims and relief flame motifs."""
    bm = bmesh.new()
    
    # Left and Right Forearms
    # In base mesh:
    # Left elbow: (0.29, 0, 1.13) to wrist: (0.42, -0.08, 0.85)
    # Right elbow: (-0.29, 0, 1.13) to wrist: (-0.42, -0.08, 0.85)
    arms = [
        (Vector((0.29, 0.0, 1.13)), Vector((0.41, -0.07, 0.87)), 1.0),
        (Vector((-0.29, 0.0, 1.13)), Vector((-0.41, -0.07, 0.87)), -1.0)
    ]
    
    for p_elbow, p_wrist, side in arms:
        n_rings = 8
        n_segs = 12
        r_elbow = 0.054
        r_wrist = 0.042
        
        b_rings = []
        for r in range(n_rings + 1):
            t = r / n_rings
            center = p_elbow.lerp(p_wrist, t)
            rad = r_elbow * (1.0 - t) + r_wrist * t
            
            # Flared elbow rim and beveled wrist rim
            if t < 0.15:
                rad += 0.008
            elif t > 0.85:
                rad += 0.006
                
            ring = []
            dir_vec = (p_wrist - p_elbow).normalized()
            up_vec = Vector((0, 0, 1))
            side_vec = dir_vec.cross(up_vec).normalized()
            norm_up = side_vec.cross(dir_vec).normalized()
            
            for s in range(n_segs):
                theta = (s / n_segs) * 2 * math.pi
                # Relief flame ridge on outer face
                flare = 0.006 * math.cos(theta) if (side * math.cos(theta) > 0) else 0.0
                offset = (side_vec * math.cos(theta) + norm_up * math.sin(theta)) * (rad + flare)
                v = bm.verts.new(center + offset)
                ring.append(v)
            b_rings.append(ring)
            
        for r in range(n_rings):
            for s in range(n_segs):
                sn = (s + 1) % n_segs
                f = bm.faces.new([b_rings[r][s], b_rings[r][sn], b_rings[r+1][sn], b_rings[r+1][s]])
                f.material_index = 1 # Mat_Veer_Cuirass

    mesh = bpy.data.meshes.new("Veer_Bracers_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Veer_Bracers", mesh)
    for m in materials:
        obj.data.materials.append(m)
    return obj

def create_greaves_and_sandals(materials):
    """Antique bronze shin greaves (Pada-rakshaka) & warrior sandals."""
    bm = bmesh.new()
    
    # Left and Right Shins
    # Z from 0.12 (above ankle) to 0.46 (below knee), with knee flange at 0.48
    legs = [
        (0.13, 1.0),
        (-0.13, -1.0)
    ]
    
    for x_center, side in legs:
        n_rings = 10
        n_segs = 12
        g_rings = []
        for r in range(n_rings + 1):
            t = r / n_rings
            z = 0.12 + t * 0.35 # Up to 0.47
            y = 0.02 + t * 0.015
            
            # Ankle to calf width
            rad_x = 0.046 + t * 0.016
            rad_y = 0.052 + t * 0.018
            if t > 0.85: # Flared knee guard
                rad_x += 0.012
                rad_y += 0.016
                
            ring = []
            for s in range(n_segs):
                theta = (s / n_segs) * 2 * math.pi
                # Front spine ridge
                is_front = (math.sin(theta) < -0.5)
                ridge = 0.008 if is_front else 0.0
                vx = x_center + math.cos(theta) * rad_x
                vy = y + math.sin(theta) * (rad_y + ridge)
                v = bm.verts.new((vx, vy, z))
                ring.append(v)
            g_rings.append(ring)
            
        for r in range(n_rings):
            for s in range(n_segs):
                sn = (s + 1) % n_segs
                f = bm.faces.new([g_rings[r][s], g_rings[r][sn], g_rings[r+1][sn], g_rings[r+1][s]])
                f.material_index = 1 # Mat_Veer_Cuirass
                
        # Warrior Sandals (Paduka sole at Z = 0.0 to 0.025, and golden toe peg)
        sole_verts_bot = []
        sole_verts_top = []
        for s in range(12):
            theta = (s / 12) * 2 * math.pi
            rx = 0.055
            ry = 0.130
            y_foot = 0.04
            sole_verts_bot.append(bm.verts.new((x_center + math.cos(theta) * rx, y_foot + math.sin(theta) * ry, 0.002)))
            sole_verts_top.append(bm.verts.new((x_center + math.cos(theta) * rx, y_foot + math.sin(theta) * ry, 0.024)))
            
        for s in range(12):
            sn = (s + 1) % 12
            f_sole_side = bm.faces.new([sole_verts_bot[s], sole_verts_bot[sn], sole_verts_top[sn], sole_verts_top[s]])
            f_sole_side.material_index = 1 # Mat_Veer_Cuirass (leather/bronze)
            
        # Golden Toe Peg
        peg_c = Vector((x_center, -0.045, 0.024))
        p_top = bm.verts.new((peg_c.x, peg_c.y, peg_c.z + 0.035))
        p_ring = []
        for s in range(6):
            a = (s / 6) * 2 * math.pi
            p_ring.append(bm.verts.new((peg_c.x + math.cos(a) * 0.012, peg_c.y + math.sin(a) * 0.012, peg_c.z + 0.025)))
        for s in range(6):
            sn = (s + 1) % 6
            f_peg = bm.faces.new([p_top, p_ring[s], p_ring[sn]])
            f_peg.material_index = 2 # Mat_Veer_Gold

    mesh = bpy.data.meshes.new("Veer_Greaves_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Veer_Greaves", mesh)
    for m in materials:
        obj.data.materials.append(m)
    return obj

def create_surya_necklace_and_armlets(materials):
    """12-pointed golden Surya medallion necklace on chest & bicep armlets (Bajuband)."""
    bm = bmesh.new()
    
    # 1. 12-Pointed Golden Surya Medallion on Chest
    # Center at (0.0, -0.135, 1.28), radius 0.055m
    center = Vector((0.0, -0.135, 1.28))
    r_med = 0.055
    n_rays = 12
    
    c_vert = bm.verts.new(center)
    r_verts = []
    t_verts = []
    for i in range(n_rays):
        angle = (i / n_rays) * 2 * math.pi
        x = math.cos(angle) * r_med
        z = math.sin(angle) * r_med
        v = bm.verts.new((center.x + x, center.y - 0.004, center.z + z))
        r_verts.append(v)
        
        # Ray tip
        x_tip = math.cos(angle) * (r_med + 0.022)
        z_tip = math.sin(angle) * (r_med + 0.022)
        vt = bm.verts.new((center.x + x_tip, center.y - 0.006, center.z + z_tip))
        t_verts.append(vt)
        
    for i in range(n_rays):
        i_next = (i + 1) % n_rays
        f_disc = bm.faces.new([c_vert, r_verts[i], r_verts[i_next]])
        f_disc.material_index = 2 # Mat_Veer_Gold
        f_ray = bm.faces.new([r_verts[i], t_verts[i], r_verts[i_next]])
        f_ray.material_index = 2
        
    # Dual Golden Chain looping around neck
    # From medallion (0.0, -0.135, 1.28) up over clavicles (±0.09, -0.06, 1.40) to back of neck (0, 0.06, 1.48)
    for side in [1.0, -1.0]:
        n_chain_segs = 10
        ch_verts = []
        for i in range(n_chain_segs + 1):
            t = i / n_chain_segs
            if t < 0.5:
                # Medallion to clavicle
                st = t * 2.0
                cx = side * (st * 0.09)
                cy = -0.135 + st * 0.075
                cz = 1.28 + st * 0.12
            else:
                # Clavicle to nape of neck
                st = (t - 0.5) * 2.0
                cx = side * (0.09 * (1.0 - st))
                cy = -0.06 + st * 0.12
                cz = 1.40 + st * 0.08
                
            ring = []
            for s in range(5):
                a = (s / 5) * 2 * math.pi
                v = bm.verts.new((cx + math.cos(a) * 0.007, cy, cz + math.sin(a) * 0.007))
                ring.append(v)
            ch_verts.append(ring)
            
        for i in range(n_chain_segs):
            for s in range(5):
                sn = (s + 1) % 5
                f_ch = bm.faces.new([ch_verts[i][s], ch_verts[i][sn], ch_verts[i+1][sn], ch_verts[i+1][s]])
                f_ch.material_index = 2

    # 2. Bicep Armlets (Bajuband)
    # Cylindrical bands on both upper arms at Z = 1.26
    arms = [
        (Vector((0.23, 0.0, 1.26)), 1.0),
        (Vector((-0.23, 0.0, 1.26)), -1.0)
    ]
    for p_arm, side in arms:
        n_segs = 16
        rad = 0.062
        thick = 0.010
        h = 0.040
        b_bot = []
        b_top = []
        for s in range(n_segs):
            theta = (s / n_segs) * 2 * math.pi
            x = math.cos(theta) * rad
            y = math.sin(theta) * rad
            b_bot.append(bm.verts.new((p_arm.x + x, p_arm.y + y, p_arm.z - h*0.5)))
            b_top.append(bm.verts.new((p_arm.x + x, p_arm.y + y, p_arm.z + h*0.5)))
        for s in range(n_segs):
            sn = (s + 1) % n_segs
            f_arm = bm.faces.new([b_bot[s], b_bot[sn], b_top[sn], b_top[s]])
            f_arm.material_index = 2 # Mat_Veer_Gold

    mesh = bpy.data.meshes.new("Veer_Necklace_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Veer_Necklace", mesh)
    for m in materials:
        obj.data.materials.append(m)
    return obj

def create_uttariya(materials):
    """Flowing celestial azure sash draped over left shoulder to right hip."""
    bm = bmesh.new()
    
    # 1. Torso Drape (Draped across left shoulder down to right hip)
    # Points: Left shoulder (0.18, 0.0, 1.45) -> chest center (0.02, -0.16, 1.18) -> right hip (-0.16, -0.12, 0.96)
    pts = [
        Vector((0.17, 0.04, 1.46)),
        Vector((0.16, -0.06, 1.42)),
        Vector((0.10, -0.14, 1.30)),
        Vector((0.01, -0.16, 1.18)),
        Vector((-0.08, -0.15, 1.06)),
        Vector((-0.16, -0.12, 0.96)),
        Vector((-0.18, -0.02, 0.94)),
        Vector((-0.14, 0.08, 0.95)),
        Vector((0.0, 0.12, 1.02)),
        Vector((0.12, 0.10, 1.22)),
        Vector((0.17, 0.04, 1.46)), # loops back
    ]
    
    n_pts = len(pts) - 1
    width = 0.09
    ribbon_rows = []
    for i, p in enumerate(pts):
        dir_next = (pts[(i+1)%len(pts)] - pts[i-1]).normalized()
        norm_plane = Vector((0, 0, 1)).cross(dir_next).normalized()
        v_left = bm.verts.new(p + norm_plane * (width * 0.5))
        v_right = bm.verts.new(p - norm_plane * (width * 0.5))
        ribbon_rows.append((v_left, v_right))
        
    for i in range(n_pts):
        f = bm.faces.new([ribbon_rows[i][0], ribbon_rows[i][1], ribbon_rows[i+1][1], ribbon_rows[i+1][0]])
        f.material_index = 4 # Mat_Veer_Sash
        
    # 2. Dynamic Trailing Sash Tails (Trailing down from right hip)
    # Tail 1: from (-0.16, -0.12, 0.96) curving down and backward to (-0.22, 0.14, 0.40)
    tail_pts_1 = [
        Vector((-0.16, -0.12, 0.96)),
        Vector((-0.19, -0.06, 0.82)),
        Vector((-0.21, 0.02, 0.68)),
        Vector((-0.22, 0.10, 0.54)),
        Vector((-0.20, 0.18, 0.38)),
    ]
    t1_rows = []
    for i, p in enumerate(tail_pts_1):
        w = width * (1.0 - i * 0.12)
        v_l = bm.verts.new((p.x - w*0.5, p.y, p.z))
        v_r = bm.verts.new((p.x + w*0.5, p.y, p.z))
        t1_rows.append((v_l, v_r))
    for i in range(len(tail_pts_1) - 1):
        f = bm.faces.new([t1_rows[i][0], t1_rows[i][1], t1_rows[i+1][1], t1_rows[i+1][0]])
        f.material_index = 4 # Mat_Veer_Sash

    mesh = bpy.data.meshes.new("Veer_Sash_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Veer_Sash", mesh)
    for m in materials:
        obj.data.materials.append(m)
    return obj

def create_surya_kripana(materials):
    """Curved celestial Sunsteel scimitar with quillon guard and ruby pommel."""
    bm = bmesh.new()
    
    # Hand grip position on right hand:
    # Grip center at (-0.44, -0.09, 0.76)
    grip_base = Vector((-0.44, -0.09, 0.68))
    grip_top = Vector((-0.44, -0.09, 0.84))
    r_grip = 0.016
    n_segs = 10
    
    # 1. Hilt Grip
    g_rings = []
    for r in range(6):
        t = r / 5.0
        p = grip_base.lerp(grip_top, t)
        ring = []
        for s in range(n_segs):
            a = (s / n_segs) * 2 * math.pi
            v = bm.verts.new((p.x + math.cos(a) * r_grip, p.y + math.sin(a) * r_grip, p.z))
            ring.append(v)
        g_rings.append(ring)
    for r in range(5):
        for s in range(n_segs):
            sn = (s + 1) % n_segs
            f = bm.faces.new([g_rings[r][s], g_rings[r][sn], g_rings[r+1][sn], g_rings[r+1][s]])
            f.material_index = 5 # Mat_Veer_Khadga (golden wire wrap)
            
    # 2. Ruby Pommel at base
    p_center = grip_base - Vector((0, 0, 0.025))
    p_vert = bm.verts.new(p_center)
    for s in range(n_segs):
        sn = (s + 1) % n_segs
        f_pom = bm.faces.new([p_vert, g_rings[0][s], g_rings[0][sn]])
        f_pom.material_index = 5
        
    # 3. 8-Pointed Sunburst Quillon Guard Disc at top of grip
    guard_center = grip_top
    r_guard = 0.052
    c_guard = bm.verts.new(guard_center)
    g_disc = []
    g_tips = []
    for s in range(8):
        a = (s / 8) * 2 * math.pi
        v = bm.verts.new((guard_center.x + math.cos(a) * r_guard, guard_center.y + math.sin(a) * r_guard, guard_center.z))
        g_disc.append(v)
        vt = bm.verts.new((guard_center.x + math.cos(a) * (r_guard + 0.022), guard_center.y + math.sin(a) * (r_guard + 0.022), guard_center.z))
        g_tips.append(vt)
    for s in range(8):
        sn = (s + 1) % 8
        f_d = bm.faces.new([c_guard, g_disc[s], g_disc[sn]])
        f_d.material_index = 5 # Mat_Veer_Khadga
        f_t = bm.faces.new([g_disc[s], g_tips[s], g_disc[sn]])
        f_t.material_index = 5
        
    # 4. Curved Scimitar Blade extending forward and upward
    # Length 0.82m, with curved spine, cutting edge, and central fuller groove
    n_blade_segs = 16
    b_verts = []
    for r in range(n_blade_segs + 1):
        t = r / n_blade_segs
        # Curved arc: sweeping forward (-Y) and upward (+Z)
        z = guard_center.z + t * 0.72
        curve_y = -t * 0.28 - (t**2) * 0.12 # Sweeps forward
        curve_x = guard_center.x - t * 0.04
        
        # Blade cross section (Spine thickness 0.008, width 0.052, razor cutting edge)
        w = 0.055 * (1.0 - t * 0.4) if t < 0.85 else 0.055 * (1.0 - (t - 0.85)/0.15)
        thick = 0.008 * (1.0 - t * 0.5)
        
        # 4 vertices per cross section: Spine back, Spine front, Left fuller, Right fuller, Cutting edge
        v_spine = bm.verts.new((curve_x, curve_y + w*0.4, z))
        v_edge = bm.verts.new((curve_x, curve_y - w*0.6, z))
        v_left = bm.verts.new((curve_x + thick, curve_y, z))
        v_right = bm.verts.new((curve_x - thick, curve_y, z))
        b_verts.append((v_spine, v_edge, v_left, v_right))
        
    for r in range(n_blade_segs):
        s0, e0, l0, r0 = b_verts[r]
        s1, e1, l1, r1 = b_verts[r+1]
        
        # Left side
        f_l1 = bm.faces.new([s0, l0, l1, s1])
        f_l1.material_index = 5 # Mat_Veer_Khadga
        f_l2 = bm.faces.new([l0, e0, e1, l1])
        f_l2.material_index = 5
        
        # Right side
        f_r1 = bm.faces.new([s1, r1, r0, s0])
        f_r1.material_index = 5
        f_r2 = bm.faces.new([r1, e1, e0, r0])
        f_r2.material_index = 5

    mesh = bpy.data.meshes.new("Veer_Scimitar_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Veer_Scimitar", mesh)
    for m in materials:
        obj.data.materials.append(m)
    return obj

def create_forehead_tripundra(materials):
    """3D modeled forehead Tripundra (3 sandalwood stripes) with sacred Kumkum bindu."""
    bm = bmesh.new()
    
    # 3 horizontal curved sandalwood ash stripes conforming to forehead
    # Z around 1.62 - 1.645, Y ~ -0.156
    stripes = [
        (1.642, 0.004, 0.034),
        (1.632, 0.004, 0.038),
        (1.622, 0.004, 0.034)
    ]
    for z_center, h, hw in stripes:
        n_pts = 8
        row_bot = []
        row_top = []
        for i in range(n_pts + 1):
            t = i / float(n_pts)
            x = -hw + t * (2.0 * hw)
            # Forehead curvature in Y
            y = -0.154 - 0.012 * ((x / hw) ** 2)
            row_bot.append(bm.verts.new((x, y, z_center - h*0.5)))
            row_top.append(bm.verts.new((x, y, z_center + h*0.5)))
        for i in range(n_pts):
            f = bm.faces.new([row_bot[i], row_bot[i+1], row_top[i+1], row_top[i]])
            f.material_index = 2 # Mat_Veer_Gold / Sandalwood

    # Sacred crimson Kumkum bindu at third-eye center (0, -0.158, 1.632)
    c_bindu = Vector((0.0, -0.158, 1.632))
    r_bindu = 0.008
    c_v = bm.verts.new(c_bindu - Vector((0, 0.003, 0)))
    ring = []
    for s in range(8):
        a = (s / 8.0) * 2 * math.pi
        ring.append(bm.verts.new((c_bindu.x + math.cos(a)*r_bindu, c_bindu.y, c_bindu.z + math.sin(a)*r_bindu)))
    for s in range(8):
        sn = (s + 1) % 8
        f_b = bm.faces.new([c_v, ring[s], ring[sn]])
        f_b.material_index = 2 # Mat_Veer_Gold with ruby kumkum center

    mesh = bpy.data.meshes.new("Veer_Tripundra_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Veer_Tripundra", mesh)
    for m in materials:
        obj.data.materials.append(m)
    return obj

print("Geometry creation functions defined.")

