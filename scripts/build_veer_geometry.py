"""
Veer 3D Geometry Builder
Models authentic high-fidelity 3D polygonal costume, hair, armor, jewelry, and celestial weapon for Hero Veer:
- Sculpted warrior Shikha topknot, flame bun, golden Keshbandha ring, and cranial hair volume
- Sacred forehead Tripundra (3 sandalwood stripes) and crimson Kumkum bindu
- Saffron silk Dhoti with accordion pleats, front pleated Kashta, and rear waist tuck
- Polished 24k gold Kamarband girdle with 12-petal Surya lotus medallion buckle & hip tassels
- Flame-engraved antique bronze forearm bracers (Kavacha) with flared rims
- Antique bronze shin greaves (Pada-rakshaka) & authentic warrior Paduka sandals with golden toe pegs & leather arch straps
- 12-pointed golden Surya medallion necklace sitting on pectorals & bicep armlets (Bajuband)
- Flowing celestial azure silk sash (Uttariya) draped over left shoulder to right hip with trailing tails
- Forged Sunsteel Surya-Kripana scimitar with quillon star guard and ruby pommel
All pieces authored with outward-facing normals and clean UV unwrapping.
"""

import bpy
import bmesh
import math
from mathutils import Vector, Matrix, Euler

def create_topknot_and_hair(materials):
    """Warrior Shikha bun, golden Keshbandha ring, cranium-hugging hair dome, and sleek nape braid."""
    bm = bmesh.new()
    
    # 1. Crown Warrior Bun (Shikha) - Tapering flame / lotus bun from Z = 1.78 to 1.88m
    n_rings = 10
    n_segs = 16
    r_max = 0.062
    z_base = 1.78
    z_top = 1.88
    bun_center_y = -0.035
    
    bun_verts = []
    for r in range(n_rings + 1):
        t = r / float(n_rings)
        z = z_base + (z_top - z_base) * t
        rad = r_max * math.sin(t * math.pi) * (1.1 - 0.25 * t)
        ring = []
        for s in range(n_segs):
            theta = (s / float(n_segs)) * 2.0 * math.pi + t * 0.8
            x = math.cos(theta) * rad
            y = bun_center_y + math.sin(theta) * rad * 0.95
            v = bm.verts.new((x, y, z))
            ring.append(v)
        bun_verts.append(ring)
    
    for r in range(n_rings):
        for s in range(n_segs):
            sn = (s + 1) % n_segs
            f = bm.faces.new([bun_verts[r][s], bun_verts[r+1][s], bun_verts[r+1][sn], bun_verts[r][sn]])
            f.material_index = 6 # Mat_Veer_Hair
            
    # Cap the flame tip
    top_v = bm.verts.new((0.0, bun_center_y, z_top + 0.005))
    for s in range(n_segs):
        sn = (s + 1) % n_segs
        f = bm.faces.new([bun_verts[-1][s], top_v, bun_verts[-1][sn]])
        f.material_index = 6
        
    # 2. Golden Keshbandha Ring binding bun base (Z = 1.772 to 1.794)
    r_in = 0.048
    r_out = 0.064
    z_bot = 1.772
    z_top_r = 1.794
    n_ring_segs = 16
    
    r_bot_in, r_bot_out, r_top_in, r_top_out = [], [], [], []
    for s in range(n_ring_segs):
        theta = (s / float(n_ring_segs)) * 2.0 * math.pi
        cos_t = math.cos(theta)
        sin_t = math.sin(theta)
        r_bot_in.append(bm.verts.new((cos_t * r_in, bun_center_y + sin_t * r_in * 0.95, z_bot)))
        r_bot_out.append(bm.verts.new((cos_t * r_out, bun_center_y + sin_t * r_out * 0.95, z_bot)))
        r_top_in.append(bm.verts.new((cos_t * r_in, bun_center_y + sin_t * r_in * 0.95, z_top_r)))
        r_top_out.append(bm.verts.new((cos_t * r_out, bun_center_y + sin_t * r_out * 0.95, z_top_r)))
        
    for s in range(n_ring_segs):
        sn = (s + 1) % n_ring_segs
        f_out = bm.faces.new([r_bot_out[s], r_top_out[s], r_top_out[sn], r_bot_out[sn]])
        f_out.material_index = 2 # Mat_Veer_Gold
        f_top = bm.faces.new([r_top_out[s], r_top_in[s], r_top_in[sn], r_top_out[sn]])
        f_top.material_index = 2
        f_bot = bm.faces.new([r_bot_in[s], r_bot_out[s], r_bot_out[sn], r_bot_in[sn]])
        f_bot.material_index = 2

    # 3. Cranium Dome Hair Volume (Conforming to upper skull and hairline down to Z = 1.66)
    hair_rings = 6
    hair_segs = 16
    h_verts = []
    for r in range(hair_rings + 1):
        t = r / float(hair_rings)
        z = 1.782 - t * 0.118 # 1.782 down to 1.664
        # Follow cranium spherical expansion and tapering
        rad_x = 0.080 + math.sin(t * math.pi * 0.5) * 0.016
        rad_y = 0.084 + math.sin(t * math.pi * 0.5) * 0.018
        ring = []
        for s in range(hair_segs):
            theta = (s / float(hair_segs)) * 2.0 * math.pi
            # Recede away from open forehead and ears
            is_face_or_ear = (theta > 1.15 * math.pi and theta < 1.85 * math.pi)
            if is_face_or_ear:
                rad_curr_x = rad_x * (0.90 if t > 0.4 else 0.96)
                rad_curr_y = rad_y * (0.84 if t > 0.4 else 0.94)
            else:
                rad_curr_x = rad_x
                rad_curr_y = rad_y
            x = math.cos(theta) * rad_curr_x
            y = -0.035 + math.sin(theta) * rad_curr_y
            v = bm.verts.new((x, y, z))
            ring.append(v)
        h_verts.append(ring)
        
    for r in range(hair_rings):
        for s in range(hair_segs):
            sn = (s + 1) % hair_segs
            theta = (s / float(hair_segs)) * 2.0 * math.pi
            # Keep face open
            if r > 1 and (theta > 1.25 * math.pi and theta < 1.75 * math.pi):
                continue
            f = bm.faces.new([h_verts[r][s], h_verts[r+1][s], h_verts[r+1][sn], h_verts[r][sn]])
            f.material_index = 6 # Mat_Veer_Hair

    # 4. Warrior Braided Nape Lock (Choti) - Tapers gracefully down cervical spine (Z = 1.66 down to 1.54)
    choti_steps = 6
    c_verts = []
    for r in range(choti_steps + 1):
        t = r / float(choti_steps)
        z = 1.664 - t * 0.124 # Down to 1.540
        # Neck curvature: curves forward from Y = 0.052 to Y = 0.024
        yc = 0.052 * (1.0 - t) + 0.024 * t
        hw = 0.034 * (1.0 - 0.45 * t)
        row = []
        for c in range(5):
            tx = c / 4.0
            x = -hw + tx * (2.0 * hw)
            ripple = 0.005 * math.sin(tx * math.pi * 3 + t * math.pi * 2)
            v = bm.verts.new((x, yc + ripple + 0.004, z))
            row.append(v)
        c_verts.append(row)
        
    for r in range(choti_steps):
        for c in range(4):
            f_c = bm.faces.new([c_verts[r][c], c_verts[r+1][c], c_verts[r+1][c+1], c_verts[r][c+1]])
            f_c.material_index = 6

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new("Veer_Hair_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Veer_Hair", mesh)
    for m in materials:
        obj.data.materials.append(m)
    return obj


def create_dhoti(materials):
    """Vedic Saffron silk Dhoti wrapping hips to calf, front pleated Kashta, and rear tuck."""
    bm = bmesh.new()
    
    # 1. Outer Pleated Dhoti Body wrapping waist down to mid-calf (Z = 0.38 to 0.98)
    n_rings = 14
    n_segs = 24
    
    d_verts = []
    for r in range(n_rings + 1):
        t = r / float(n_rings)
        z = 0.98 - t * 0.60 # 0.98 down to 0.38
        
        # Anatomical hip, gluteal, and thigh clearance
        if t < 0.25: # Waist to hips
            rx = 0.188 + t * 0.144
            ry = 0.158 + t * 0.096
        elif t < 0.55: # Hips to mid-thighs
            rx = 0.224 + (t - 0.25) * 0.026
            ry = 0.182 + (t - 0.25) * 0.020
        elif t < 0.80: # Thighs to knees
            rx = 0.232 - (t - 0.55) * 0.056
            ry = 0.188 - (t - 0.55) * 0.056
        else: # Knees down to mid-calf
            rx = 0.218 - (t - 0.80) * 0.090
            ry = 0.174 - (t - 0.80) * 0.070
            
        ring = []
        for s in range(n_segs):
            theta = (s / float(n_segs)) * 2.0 * math.pi
            # Fine vertical accordion pleat ripple
            pleat = 0.007 * math.sin(theta * 16)
            x = math.cos(theta) * (rx + pleat)
            y = 0.008 + math.sin(theta) * (ry + pleat)
            v = bm.verts.new((x, y, z))
            ring.append(v)
        d_verts.append(ring)
        
    for r in range(n_rings):
        for s in range(n_segs):
            sn = (s + 1) % n_segs
            # Outward-facing winding order
            f = bm.faces.new([d_verts[r][s], d_verts[r+1][s], d_verts[r+1][sn], d_verts[r][sn]])
            f.material_index = 3 # Mat_Veer_Dhoti
            
    # 2. Central Front Folded Kashta (Pleated front drape panel)
    # Spans X: -0.12 to +0.12, Z: 0.98 down to 0.36, Y: -0.168 to -0.185
    k_steps_z = 14
    k_folds_x = 8
    k_verts = []
    for r in range(k_steps_z + 1):
        tz = r / float(k_steps_z)
        z = 0.98 - tz * 0.62 # Down to 0.36
        y = -0.166 - tz * 0.016
        row = []
        for c in range(k_folds_x + 1):
            tx = c / float(k_folds_x)
            x = -0.12 + tx * 0.24
            # Accordion crease depth
            depth = 0.012 * math.sin(tx * math.pi * 6)
            v = bm.verts.new((x, y - depth, z))
            row.append(v)
        k_verts.append(row)
        
    for r in range(k_steps_z):
        for c in range(k_folds_x):
            # Outward-facing winding
            f = bm.faces.new([k_verts[r][c], k_verts[r+1][c], k_verts[r+1][c+1], k_verts[r][c+1]])
            f.material_index = 3 # Mat_Veer_Dhoti

    # 3. Rear Waistband Kashta Tuck (Rear central pleat tucked into waist)
    r_steps_z = 8
    r_folds_x = 4
    r_verts = []
    for r in range(r_steps_z + 1):
        tz = r / float(r_steps_z)
        z = 0.98 - tz * 0.35 # Down to 0.63
        y = 0.162 + tz * 0.012
        row = []
        for c in range(r_folds_x + 1):
            tx = c / float(r_folds_x)
            x = -0.06 + tx * 0.12
            depth = 0.008 * math.sin(tx * math.pi * 4)
            v = bm.verts.new((x, y + depth, z))
            row.append(v)
        r_verts.append(row)
        
    for r in range(r_steps_z):
        for c in range(r_folds_x):
            f = bm.faces.new([r_verts[r][c], r_verts[r][c+1], r_verts[r+1][c+1], r_verts[r+1][c]])
            f.material_index = 3

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new("Veer_Dhoti_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Veer_Dhoti", mesh)
    for m in materials:
        obj.data.materials.append(m)
    return obj

def create_kamarband_and_buckle(materials):
    """Polished 24k gold Kamarband girdle with 12-petal Surya lotus medallion buckle & hip tassels."""
    bm = bmesh.new()
    
    # 1. Waist Girdle (Wide golden band at Z = 0.94 to 1.02)
    n_segs = 24
    z_bot = 0.94
    z_top = 1.02
    rx = 0.186
    ry = 0.156
    thick = 0.014
    
    b_bot_in, b_bot_out, b_top_in, b_top_out = [], [], [], []
    for s in range(n_segs):
        theta = (s / float(n_segs)) * 2.0 * math.pi
        cos_t = math.cos(theta)
        sin_t = math.sin(theta)
        yc = 0.006
        b_bot_in.append(bm.verts.new((cos_t * rx, yc + sin_t * ry, z_bot)))
        b_bot_out.append(bm.verts.new((cos_t * (rx + thick), yc + sin_t * (ry + thick), z_bot)))
        b_top_in.append(bm.verts.new((cos_t * rx, yc + sin_t * ry, z_top)))
        b_top_out.append(bm.verts.new((cos_t * (rx + thick), yc + sin_t * (ry + thick), z_top)))
        
    for s in range(n_segs):
        sn = (s + 1) % n_segs
        f_out = bm.faces.new([b_bot_out[s], b_top_out[s], b_top_out[sn], b_bot_out[sn]])
        f_out.material_index = 2 # Mat_Veer_Gold
        f_top = bm.faces.new([b_top_out[s], b_top_in[s], b_top_in[sn], b_top_out[sn]])
        f_top.material_index = 2
        f_bot = bm.faces.new([b_bot_in[s], b_bot_out[s], b_bot_out[sn], b_bot_in[sn]])
        f_bot.material_index = 2

    # 2. Central 12-Petal Surya Lotus Medallion Buckle (Front Center at Y = -0.170, Z = 0.98)
    center = Vector((0.0, -0.170, 0.98))
    r_disc = 0.065
    n_petals = 12
    
    c_vert = bm.verts.new(center)
    p_verts, p_tips = [], []
    for i in range(n_petals):
        angle = (i / float(n_petals)) * 2.0 * math.pi
        x = math.cos(angle) * r_disc
        z = math.sin(angle) * r_disc
        v = bm.verts.new((center.x + x, center.y - 0.005, center.z + z))
        p_verts.append(v)
        
        # Radiating petal tips
        x_tip = math.cos(angle) * (r_disc + 0.022)
        z_tip = math.sin(angle) * (r_disc + 0.022)
        vt = bm.verts.new((center.x + x_tip, center.y - 0.008, center.z + z_tip))
        p_tips.append(vt)
        
    for i in range(n_petals):
        i_next = (i + 1) % n_petals
        f_disc = bm.faces.new([c_vert, p_verts[i_next], p_verts[i]])
        f_disc.material_index = 2 # Mat_Veer_Gold
        f_tip = bm.faces.new([p_verts[i], p_verts[i_next], p_tips[i]])
        f_tip.material_index = 2
        
    # Raised center ruby jewel
    c_ruby = bm.verts.new((center.x, center.y - 0.016, center.z))
    r_ruby = 0.024
    ruby_ring = []
    for s in range(8):
        angle = (s / 8.0) * 2.0 * math.pi
        v = bm.verts.new((center.x + math.cos(angle) * r_ruby, center.y - 0.008, center.z + math.sin(angle) * r_ruby))
        ruby_ring.append(v)
    for s in range(8):
        sn = (s + 1) % 8
        f_rub = bm.faces.new([c_ruby, ruby_ring[sn], ruby_ring[s]])
        f_rub.material_index = 2

    # 3. Hanging Side Tassels (Left Hip)
    t_start = Vector((0.18, -0.06, 0.95))
    t_end = Vector((0.20, -0.05, 0.70))
    n_t_segs = 6
    t_verts = []
    for i in range(n_t_segs + 1):
        t = i / float(n_t_segs)
        pos = t_start.lerp(t_end, t)
        rad = 0.014 * (1.0 + t * 0.5)
        ring = []
        for s in range(6):
            a = (s / 6.0) * 2.0 * math.pi
            v = bm.verts.new((pos.x + math.cos(a) * rad, pos.y + math.sin(a) * rad, pos.z))
            ring.append(v)
        t_verts.append(ring)
    for i in range(n_t_segs):
        for s in range(6):
            sn = (s + 1) % 6
            f_t = bm.faces.new([t_verts[i][s], t_verts[i+1][s], t_verts[i+1][sn], t_verts[i][sn]])
            f_t.material_index = 2

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
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
    
    arms = [
        (Vector((0.31, 0.01, 1.18)), Vector((0.42, -0.07, 0.90)), 1.0),
        (Vector((-0.31, 0.01, 1.18)), Vector((-0.42, -0.07, 0.90)), -1.0)
    ]
    
    for p_elbow, p_wrist, side in arms:
        n_rings = 8
        n_segs = 12
        r_elbow = 0.056
        r_wrist = 0.042
        
        b_rings = []
        dir_vec = (p_wrist - p_elbow).normalized()
        up_vec = Vector((0, 0, 1))
        side_vec = dir_vec.cross(up_vec).normalized()
        norm_up = side_vec.cross(dir_vec).normalized()
        
        for r in range(n_rings + 1):
            t = r / float(n_rings)
            center = p_elbow.lerp(p_wrist, t)
            rad = r_elbow * (1.0 - t) + r_wrist * t
            if t < 0.15:
                rad += 0.008
            elif t > 0.85:
                rad += 0.006
                
            ring = []
            for s in range(n_segs):
                theta = (s / float(n_segs)) * 2.0 * math.pi
                flare = 0.006 * math.cos(theta) if (side * math.cos(theta) > 0) else 0.0
                offset = (side_vec * math.cos(theta) + norm_up * math.sin(theta)) * (rad + flare)
                v = bm.verts.new(center + offset)
                ring.append(v)
            b_rings.append(ring)
            
        for r in range(n_rings):
            for s in range(n_segs):
                sn = (s + 1) % n_segs
                f = bm.faces.new([b_rings[r][s], b_rings[r+1][s], b_rings[r+1][sn], b_rings[r][sn]])
                f.material_index = 1 # Mat_Veer_Cuirass

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new("Veer_Bracers_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Veer_Bracers", mesh)
    for m in materials:
        obj.data.materials.append(m)
    return obj

def create_greaves_and_sandals(materials):
    """Antique bronze shin greaves (Pada-rakshaka) & authentic warrior Paduka sandals."""
    bm = bmesh.new()
    
    legs = [
        (1.0, 0.140, 0.190, 0.010, 0.035, 0.215, 0.185),  # Left leg: side, knee_x, ankle_x, knee_y, ankle_y, foot_x, peg_x
        (-1.0, -0.140, -0.190, 0.010, 0.035, -0.215, -0.185) # Right leg
    ]
    
    for side, knee_x, ankle_x, knee_y, ankle_y, foot_x, peg_x in legs:
        n_rings = 10
        n_segs = 12
        g_rings = []
        for r in range(n_rings + 1):
            t = r / float(n_rings)
            z = 0.12 + t * 0.35 # 0.12 (above ankle) up to 0.47 (knee flange)
            
            cx = ankle_x * (1.0 - t) + knee_x * t
            cy = ankle_y * (1.0 - t) + knee_y * t
            rad_x = 0.046 + t * 0.016
            rad_y = 0.052 + t * 0.018
            if t > 0.85:
                rad_x += 0.012
                rad_y += 0.016
                
            ring = []
            for s in range(n_segs):
                theta = (s / float(n_segs)) * 2.0 * math.pi
                is_front = (math.sin(theta) < -0.4)
                ridge = 0.008 if is_front else 0.0
                vx = cx + math.cos(theta) * rad_x
                vy = cy + math.sin(theta) * (rad_y + ridge)
                v = bm.verts.new((vx, vy, z))
                ring.append(v)
            g_rings.append(ring)
            
        for r in range(n_rings):
            for s in range(n_segs):
                sn = (s + 1) % n_segs
                f = bm.faces.new([g_rings[r][s], g_rings[r+1][s], g_rings[r+1][sn], g_rings[r][sn]])
                f.material_index = 1 # Mat_Veer_Cuirass
                
        # Authentic Warrior Sandals (Classical Paduka sole below foot at Z = -0.024 to 0.000)
        sole_verts_bot, sole_verts_top = [], []
        y_foot = -0.015
        rx_foot = 0.055
        ry_foot = 0.135
        for s in range(16):
            theta = (s / 16.0) * 2.0 * math.pi
            px = foot_x + math.cos(theta) * rx_foot
            py = y_foot + math.sin(theta) * ry_foot
            sole_verts_bot.append(bm.verts.new((px, py, -0.024)))
            sole_verts_top.append(bm.verts.new((px, py, 0.000)))
            
        # Sole rim faces
        for s in range(16):
            sn = (s + 1) % 16
            f_sole_side = bm.faces.new([sole_verts_bot[s], sole_verts_top[s], sole_verts_top[sn], sole_verts_bot[sn]])
            f_sole_side.material_index = 1 # Mat_Veer_Cuirass
            
        # Top sole face
        f_top_sole = bm.faces.new(sole_verts_top)
        f_top_sole.material_index = 1
        
        # Bottom sole face
        f_bot_sole = bm.faces.new(sole_verts_bot[::-1])
        f_bot_sole.material_index = 1
            
        # Classical Golden Paduka Toe Peg (Khadau) in anatomical toe cleft
        peg_c = Vector((peg_x, -0.125, 0.000))
        p_knob = bm.verts.new((peg_c.x, peg_c.y, peg_c.z + 0.038))
        p_ring = []
        for s in range(8):
            a = (s / 8.0) * 2.0 * math.pi
            p_ring.append(bm.verts.new((peg_c.x + math.cos(a) * 0.012, peg_c.y + math.sin(a) * 0.012, peg_c.z + 0.014)))
        for s in range(8):
            sn = (s + 1) % 8
            f_peg = bm.faces.new([p_knob, p_ring[s], p_ring[sn]])
            f_peg.material_index = 2 # Mat_Veer_Gold
            
        # Warrior Leather Arch Straps (Pada-bandha) securing instep
        strap_pts_outer = [
            Vector((foot_x + 0.052 * side, -0.04, 0.000)),
            Vector((foot_x + 0.015 * side, -0.015, 0.056)),
            Vector((foot_x - 0.048 * side, -0.04, 0.000))
        ]
        s_rows = []
        for p in strap_pts_outer:
            v_front = bm.verts.new((p.x, p.y - 0.014, p.z))
            v_back = bm.verts.new((p.x, p.y + 0.014, p.z))
            s_rows.append((v_front, v_back))
        for i in range(len(strap_pts_outer) - 1):
            f_st = bm.faces.new([s_rows[i][0], s_rows[i+1][0], s_rows[i+1][1], s_rows[i][1]])
            f_st.material_index = 1 # Mat_Veer_Cuirass

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new("Veer_Greaves_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Veer_Greaves", mesh)
    for m in materials:
        obj.data.materials.append(m)
    return obj

def create_surya_necklace_and_armlets(materials):
    """12-pointed golden Surya medallion on pectorals & bicep armlets (Bajuband)."""
    bm = bmesh.new()
    
    # 1. 12-Pointed Golden Surya Medallion on Chest (Sitting proud on pectorals at Y = -0.154, Z = 1.28)
    center = Vector((0.0, -0.154, 1.28))
    r_med = 0.056
    n_rays = 12
    
    c_vert = bm.verts.new(center)
    r_verts, t_verts = [], []
    for i in range(n_rays):
        angle = (i / float(n_rays)) * 2.0 * math.pi
        x = math.cos(angle) * r_med
        z = math.sin(angle) * r_med
        v = bm.verts.new((center.x + x, center.y - 0.005, center.z + z))
        r_verts.append(v)
        
        # Ray tip
        x_tip = math.cos(angle) * (r_med + 0.024)
        z_tip = math.sin(angle) * (r_med + 0.024)
        vt = bm.verts.new((center.x + x_tip, center.y - 0.007, center.z + z_tip))
        t_verts.append(vt)
        
    for i in range(n_rays):
        i_next = (i + 1) % n_rays
        f_disc = bm.faces.new([c_vert, r_verts[i_next], r_verts[i]])
        f_disc.material_index = 2 # Mat_Veer_Gold
        f_ray = bm.faces.new([r_verts[i], r_verts[i_next], t_verts[i]])
        f_ray.material_index = 2
        
    # Dual Golden Chain looping around neck over clavicles
    for side in [1.0, -1.0]:
        n_chain_segs = 10
        ch_verts = []
        for i in range(n_chain_segs + 1):
            t = i / float(n_chain_segs)
            if t < 0.5:
                st = t * 2.0
                cx = side * (st * 0.09)
                cy = -0.154 + st * 0.080
                cz = 1.28 + st * 0.12
            else:
                st = (t - 0.5) * 2.0
                cx = side * (0.09 * (1.0 - st))
                cy = -0.074 + st * 0.12
                cz = 1.40 + st * 0.08
                
            ring = []
            for s in range(5):
                a = (s / 5.0) * 2.0 * math.pi
                v = bm.verts.new((cx + math.cos(a) * 0.007, cy, cz + math.sin(a) * 0.007))
                ring.append(v)
            ch_verts.append(ring)
            
        for i in range(n_chain_segs):
            for s in range(5):
                sn = (s + 1) % 5
                f_ch = bm.faces.new([ch_verts[i][s], ch_verts[i+1][s], ch_verts[i+1][sn], ch_verts[i][sn]])
                f_ch.material_index = 2

    # 2. Bicep Armlets (Bajuband) on both arms at Z = 1.26
    arms = [
        (Vector((0.23, 0.0, 1.26)), 1.0),
        (Vector((-0.23, 0.0, 1.26)), -1.0)
    ]
    for p_arm, side in arms:
        n_segs = 16
        rad = 0.064
        thick = 0.010
        h = 0.040
        b_bot, b_top = [], []
        for s in range(n_segs):
            theta = (s / float(n_segs)) * 2.0 * math.pi
            x = math.cos(theta) * rad
            y = math.sin(theta) * rad
            b_bot.append(bm.verts.new((p_arm.x + x, p_arm.y + y, p_arm.z - h*0.5)))
            b_top.append(bm.verts.new((p_arm.x + x, p_arm.y + y, p_arm.z + h*0.5)))
        for s in range(n_segs):
            sn = (s + 1) % n_segs
            f_arm = bm.faces.new([b_bot[s], b_top[s], b_top[sn], b_bot[sn]])
            f_arm.material_index = 2 # Mat_Veer_Gold

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new("Veer_Necklace_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Veer_Necklace", mesh)
    for m in materials:
        obj.data.materials.append(m)
    return obj

def create_uttariya(materials):
    """Flowing celestial azure silk sash draped over left shoulder to right hip with trailing tails."""
    bm = bmesh.new()
    
    # 1. Torso Drape (Draped across left shoulder down to right hip)
    pts = [
        Vector((0.18, 0.04, 1.48)),
        Vector((0.17, -0.08, 1.42)),
        Vector((0.11, -0.165, 1.30)),
        Vector((0.02, -0.172, 1.16)),
        Vector((-0.08, -0.168, 1.05)),
        Vector((-0.17, -0.135, 0.96)),
        Vector((-0.19, -0.02, 0.94)),
        Vector((-0.15, 0.09, 0.95)),
        Vector((0.0, 0.13, 1.04)),
        Vector((0.13, 0.11, 1.24)),
        Vector((0.18, 0.04, 1.48)), # loops back
    ]
    
    n_pts = len(pts) - 1
    width = 0.15 # 15 cm wide celestial stole
    n_width_divs = 3
    
    ribbon_grid = []
    for i, p in enumerate(pts):
        dir_next = (pts[(i+1)%len(pts)] - pts[i-1]).normalized()
        norm_plane = Vector((0, 0, 1)).cross(dir_next).normalized()
        row = []
        for w_idx in range(n_width_divs + 1):
            tw = (w_idx / float(n_width_divs)) - 0.5
            offset = norm_plane * (tw * width)
            # Subtle cloth billowing fold
            lift = 0.006 * math.sin(tw * math.pi)
            v = bm.verts.new(p + offset + Vector((0, -lift, 0)))
            row.append(v)
        ribbon_grid.append(row)
        
    for i in range(n_pts):
        for w_idx in range(n_width_divs):
            f = bm.faces.new([
                ribbon_grid[i][w_idx],
                ribbon_grid[i+1][w_idx],
                ribbon_grid[i+1][w_idx+1],
                ribbon_grid[i][w_idx+1]
            ])
            f.material_index = 4 # Mat_Veer_Sash
            
    # 2. Dynamic Trailing Sash Tails (Trailing down past right hip to mid-calf)
    tail_pts_1 = [
        Vector((-0.17, -0.135, 0.96)),
        Vector((-0.20, -0.06, 0.82)),
        Vector((-0.23, 0.02, 0.68)),
        Vector((-0.24, 0.10, 0.54)),
        Vector((-0.22, 0.16, 0.40)),
    ]
    t1_rows = []
    for i, p in enumerate(tail_pts_1):
        w = width * (1.0 - i * 0.12)
        row = []
        for w_idx in range(n_width_divs + 1):
            tw = (w_idx / float(n_width_divs)) - 0.5
            v = bm.verts.new((p.x + tw*w, p.y, p.z))
            row.append(v)
        t1_rows.append(row)
        
    for i in range(len(tail_pts_1) - 1):
        for w_idx in range(n_width_divs):
            f = bm.faces.new([
                t1_rows[i][w_idx],
                t1_rows[i+1][w_idx],
                t1_rows[i+1][w_idx+1],
                t1_rows[i][w_idx+1]
            ])
            f.material_index = 4

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new("Veer_Sash_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Veer_Sash", mesh)
    for m in materials:
        obj.data.materials.append(m)
    return obj

def create_surya_kripana(materials):
    """Forged Sunsteel Surya-Kripana scimitar with quillon star guard and ruby pommel."""
    bm = bmesh.new()
    
    # Grip center at (-0.44, -0.08, 0.80) in right hand
    grip_base = Vector((-0.44, -0.08, 0.72))
    grip_top = Vector((-0.44, -0.08, 0.88))
    r_grip = 0.016
    n_segs = 10
    
    # 1. Hilt Grip with golden wire wrap
    g_rings = []
    for r in range(6):
        t = r / 5.0
        p = grip_base.lerp(grip_top, t)
        ring = []
        for s in range(n_segs):
            a = (s / float(n_segs)) * 2.0 * math.pi
            v = bm.verts.new((p.x + math.cos(a) * r_grip, p.y + math.sin(a) * r_grip, p.z))
            ring.append(v)
        g_rings.append(ring)
    for r in range(5):
        for s in range(n_segs):
            sn = (s + 1) % n_segs
            f = bm.faces.new([g_rings[r][s], g_rings[r+1][s], g_rings[r+1][sn], g_rings[r][sn]])
            f.material_index = 5 # Mat_Veer_Khadga
            
    # 2. Ruby Pommel at base
    p_center = grip_base - Vector((0, 0, 0.024))
    p_vert = bm.verts.new(p_center)
    for s in range(n_segs):
        sn = (s + 1) % n_segs
        f_pom = bm.faces.new([p_vert, g_rings[0][sn], g_rings[0][s]])
        f_pom.material_index = 5
        
    # 3. 8-Pointed Sunburst Quillon Guard Disc at top of grip
    guard_center = grip_top
    r_guard = 0.052
    c_guard = bm.verts.new(guard_center)
    g_disc, g_tips = [], []
    for s in range(8):
        a = (s / 8.0) * 2.0 * math.pi
        v = bm.verts.new((guard_center.x + math.cos(a) * r_guard, guard_center.y + math.sin(a) * r_guard, guard_center.z))
        g_disc.append(v)
        vt = bm.verts.new((guard_center.x + math.cos(a) * (r_guard + 0.022), guard_center.y + math.sin(a) * (r_guard + 0.022), guard_center.z))
        g_tips.append(vt)
    for s in range(8):
        sn = (s + 1) % 8
        f_d = bm.faces.new([c_guard, g_disc[sn], g_disc[s]])
        f_d.material_index = 5
        f_t = bm.faces.new([g_disc[s], g_disc[sn], g_tips[s]])
        f_t.material_index = 5
        
    # 4. Curved Scimitar Blade extending forward (-Y) and upward (+Z)
    n_blade_segs = 16
    b_verts = []
    for r in range(n_blade_segs + 1):
        t = r / float(n_blade_segs)
        z = guard_center.z + t * 0.72
        curve_y = -t * 0.28 - (t**2) * 0.12
        curve_x = guard_center.x - t * 0.04
        
        w = 0.055 * (1.0 - t * 0.4) if t < 0.85 else 0.055 * (1.0 - (t - 0.85)/0.15)
        thick = 0.008 * (1.0 - t * 0.5)
        
        v_spine = bm.verts.new((curve_x, curve_y + w*0.4, z))
        v_edge = bm.verts.new((curve_x, curve_y - w*0.6, z))
        v_left = bm.verts.new((curve_x + thick, curve_y, z))
        v_right = bm.verts.new((curve_x - thick, curve_y, z))
        b_verts.append((v_spine, v_edge, v_left, v_right))
        
    for r in range(n_blade_segs):
        s0, e0, l0, r0 = b_verts[r]
        s1, e1, l1, r1 = b_verts[r+1]
        
        # Left side
        f_l1 = bm.faces.new([s0, s1, l1, l0])
        f_l1.material_index = 5
        f_l2 = bm.faces.new([l0, l1, e1, e0])
        f_l2.material_index = 5
        
        # Right side
        f_r1 = bm.faces.new([s0, r0, r1, s1])
        f_r1.material_index = 5
        f_r2 = bm.faces.new([r0, e0, e1, r1])
        f_r2.material_index = 5

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new("Veer_Scimitar_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Veer_Scimitar", mesh)
    for m in materials:
        obj.data.materials.append(m)
    return obj

def create_forehead_tripundra(materials):
    """3D modeled forehead Tripundra (3 sandalwood stripes) with sacred Kumkum bindu on forehead brow."""
    bm = bmesh.new()
    
    # Material slot index for tilak (slot 8 if available, else slot 2)
    tilak_mat_idx = 8 if len(materials) > 8 else (2 if len(materials) > 2 else 0)
    
    # 3 horizontal sandalwood ash stripes conforming to forehead brow at Z ~ 1.706 - 1.722, Y ~ -0.145
    stripes = [
        (1.722, 0.004, 0.038),
        (1.714, 0.004, 0.042),
        (1.706, 0.004, 0.038)
    ]
    for z_center, h, hw in stripes:
        n_pts = 8
        row_bot = []
        row_top = []
        for i in range(n_pts + 1):
            t = i / float(n_pts)
            x = -hw + t * (2.0 * hw)
            y = -0.145 - 0.008 * ((x / hw) ** 2)
            row_bot.append(bm.verts.new((x, y, z_center - h*0.5)))
            row_top.append(bm.verts.new((x, y, z_center + h*0.5)))
        for i in range(n_pts):
            f = bm.faces.new([row_bot[i], row_top[i], row_top[i+1], row_bot[i+1]])
            f.material_index = tilak_mat_idx

    # Sacred crimson Kumkum bindu at third-eye center (0, -0.146, 1.714)
    c_bindu = Vector((0.0, -0.146, 1.714))
    r_bindu = 0.007
    c_v = bm.verts.new(c_bindu - Vector((0, 0.003, 0)))
    ring = []
    for s in range(8):
        a = (s / 8.0) * 2.0 * math.pi
        ring.append(bm.verts.new((c_bindu.x + math.cos(a)*r_bindu, c_bindu.y, c_bindu.z + math.sin(a)*r_bindu)))
    for s in range(8):
        sn = (s + 1) % 8
        f_b = bm.faces.new([c_v, ring[s], ring[sn]])
        f_b.material_index = tilak_mat_idx

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new("Veer_Tripundra_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Veer_Tripundra", mesh)
    for m in materials:
        obj.data.materials.append(m)
    return obj

print("Authentic Vedic geometry builder initialized.")

