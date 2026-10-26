#!/usr/bin/env python3
"""
Generate high-resolution 1024x1024 PBR texture maps for Chapter IV: Realm of Svar / Svarga (The Celestial Solar Citadels).
Creates:
- Svar White & Gold Marble (albedo, normal, roughness) for sky bastions and pillars
- Svar Celestial Gold (albedo, normal, metallic_roughness) for shikharas, trims, and sun discs
- Svar Solar Crystal (albedo, normal, emissive) for rotating prisms and light bridges
- Svar Sun Steel (albedo, normal, metallic_roughness) for guardian spears and Surya Avatara greatsword
- Svar Solar Core (albedo, emissive) for the Primal Solar Core and Mahapeetham
- Svar Gryphon Feather & Armor (albedo, normal) for Solar Gryphons
"""

import os
import math
import struct
import zlib

def write_png(filename, width, height, pixels):
    def chunk(tag, data):
        c = bytearray()
        c.extend(tag)
        c.extend(data)
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)

    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    raw_data = bytearray()
    row_bytes = width * 4
    for y in range(height):
        raw_data.append(0)  # Filter type 0
        raw_data.extend(pixels[y * row_bytes : (y + 1) * row_bytes])

    compressed = zlib.compress(raw_data, 9)
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    png.extend(chunk(b'IHDR', ihdr))
    png.extend(chunk(b'IDAT', compressed))
    png.extend(chunk(b'IEND', b''))

    os.makedirs(os.path.dirname(os.path.abspath(filename)), exist_ok=True)
    with open(filename, 'wb') as f:
        f.write(png)
    print(f"Generated {filename} ({len(png)} bytes)")

def make_gold_marble():
    w, h = 1024, 1024
    albedo = bytearray(w * h * 4)
    normal = bytearray(w * h * 4)
    rough = bytearray(w * h * 4)

    for y in range(h):
        for x in range(w):
            idx = (y * w + x) * 4
            # Marble grain and golden veining
            m1 = math.sin(x * 0.02 + y * 0.015 + math.sin(x * 0.04 - y * 0.03) * 2.0)
            m2 = math.cos(x * 0.01 - y * 0.02 + math.cos(x * 0.05 + y * 0.04) * 2.5)
            vein = math.exp(-abs(m1 + m2) * 4.5)

            # Carved flagstone tiles (128x128 repeat)
            tx = x % 128
            ty = y % 128
            edge_dist = min(tx, 128 - tx, ty, 128 - ty)
            grout = 1.0 if edge_dist > 3 else edge_dist / 3.0

            # Base white/cream marble
            base_val = 225 + int(m1 * 15 + m2 * 10)
            r = int(base_val * grout)
            g = int((base_val - 8) * grout)
            b = int((base_val - 22) * grout)

            # Injected liquid gold veins
            if vein > 0.15:
                gold_factor = (vein - 0.15) / 0.85
                r = int(r * (1.0 - gold_factor) + 245 * gold_factor)
                g = int(g * (1.0 - gold_factor) + 195 * gold_factor)
                b = int(b * (1.0 - gold_factor) + 45 * gold_factor)

            albedo[idx] = max(0, min(255, r))
            albedo[idx + 1] = max(0, min(255, g))
            albedo[idx + 2] = max(0, min(255, b))
            albedo[idx + 3] = 255

            # Normal map: grout seams and subtle marble polish
            dx = (1.0 if tx > 64 else -1.0) * (1.0 - grout) * 0.6
            dy = (1.0 if ty > 64 else -1.0) * (1.0 - grout) * 0.6
            normal[idx] = int(128 + dx * 80)
            normal[idx + 1] = int(128 + dy * 80)
            normal[idx + 2] = 255
            normal[idx + 3] = 255

            # Smooth polished marble (low roughness, gold veins slightly reflective)
            roughness_val = int(80 + (1.0 - grout) * 90 - vein * 35)
            rough[idx] = max(0, min(255, roughness_val))
            rough[idx + 1] = max(0, min(255, roughness_val))
            rough[idx + 2] = max(0, min(255, roughness_val))
            rough[idx + 3] = 255

    write_png("godot/assets/environment/textures/svar/svar_gold_marble_albedo.png", w, h, albedo)
    write_png("godot/assets/environment/textures/svar/svar_gold_marble_normal.png", w, h, normal)
    write_png("godot/assets/environment/textures/svar/svar_gold_marble_roughness.png", w, h, rough)

def make_celestial_gold():
    w, h = 1024, 1024
    albedo = bytearray(w * h * 4)
    normal = bytearray(w * h * 4)
    mr = bytearray(w * h * 4)

    for y in range(h):
        for x in range(w):
            idx = (y * w + x) * 4
            # Surya sun-disc motif & radiating mantras
            cx = (x % 256) - 128
            cy = (y % 256) - 128
            dist = math.sqrt(cx * cx + cy * cy)
            angle = math.atan2(cy, cx)
            rays = math.sin(angle * 12.0)

            # Concentric stepped rings
            ring = math.sin(dist * 0.15)
            engrave = 1.0
            if abs(dist - 60) < 4 or abs(dist - 100) < 5 or (dist < 85 and rays > 0.7):
                engrave = 0.82

            # 24K Radiant gold
            r = int(255 * engrave)
            g = int(205 * engrave)
            b = int(48 * engrave)

            albedo[idx] = max(0, min(255, r))
            albedo[idx + 1] = max(0, min(255, g))
            albedo[idx + 2] = max(0, min(255, b))
            albedo[idx + 3] = 255

            # Embossed bevels
            ndx = math.cos(angle) * (1.0 - engrave) * 0.8
            ndy = math.sin(angle) * (1.0 - engrave) * 0.8
            normal[idx] = int(128 + ndx * 90)
            normal[idx + 1] = int(128 + ndy * 90)
            normal[idx + 2] = 255
            normal[idx + 3] = 255

            # PBR Metallic / Roughness (G = Roughness, B = Metallic)
            mr[idx] = 0
            mr[idx + 1] = 65    # Smooth polished gold
            mr[idx + 2] = 235   # High metallic
            mr[idx + 3] = 255

    write_png("godot/assets/environment/textures/svar/svar_celestial_gold_albedo.png", w, h, albedo)
    write_png("godot/assets/environment/textures/svar/svar_celestial_gold_normal.png", w, h, normal)
    write_png("godot/assets/environment/textures/svar/svar_celestial_gold_mr.png", w, h, mr)

def make_solar_crystal():
    w, h = 1024, 1024
    albedo = bytearray(w * h * 4)
    normal = bytearray(w * h * 4)
    emissive = bytearray(w * h * 4)

    for y in range(h):
        for x in range(w):
            idx = (y * w + x) * 4
            # Prismatic crystalline facet grid
            fx = (x * 0.05 + y * 0.03) % 1.0
            fy = (x * 0.03 - y * 0.05) % 1.0
            facet = math.sin(fx * math.pi * 2) * math.cos(fy * math.pi * 2)

            # Photonic refraction (cyan-amber split)
            r = int(210 + facet * 35)
            g = int(235 + facet * 15)
            b = int(255 - facet * 40)

            albedo[idx] = max(0, min(255, r))
            albedo[idx + 1] = max(0, min(255, g))
            albedo[idx + 2] = max(0, min(255, b))
            albedo[idx + 3] = 220 # Semi-translucent feel

            # Sharp crystal normal facets
            normal[idx] = int(128 + math.cos(fx * math.pi * 2) * 50)
            normal[idx + 1] = int(128 + math.sin(fy * math.pi * 2) * 50)
            normal[idx + 2] = 255
            normal[idx + 3] = 255

            # Glowing inner core
            glow = max(0.0, facet)
            emissive[idx] = int(255 * glow)
            emissive[idx + 1] = int(210 * glow)
            emissive[idx + 2] = int(90 * glow)
            emissive[idx + 3] = 255

    write_png("godot/assets/environment/textures/svar/svar_solar_crystal_albedo.png", w, h, albedo)
    write_png("godot/assets/environment/textures/svar/svar_solar_crystal_normal.png", w, h, normal)
    write_png("godot/assets/environment/textures/svar/svar_solar_crystal_emissive.png", w, h, emissive)

def make_sun_steel():
    w, h = 1024, 1024
    albedo = bytearray(w * h * 4)
    normal = bytearray(w * h * 4)
    mr = bytearray(w * h * 4)

    for y in range(h):
        for x in range(w):
            idx = (y * w + x) * 4
            # Damascus wavy folds in steel
            d1 = math.sin(x * 0.08 + math.sin(y * 0.04) * 3.0)
            d2 = math.cos(y * 0.06 + math.cos(x * 0.03) * 2.0)
            damascus = (d1 * 0.6 + d2 * 0.4 + 1.0) * 0.5

            # Golden-bronze tint tempered with sun steel
            base = int(160 + damascus * 55)
            albedo[idx] = max(0, min(255, int(base * 1.15)))
            albedo[idx + 1] = max(0, min(255, int(base * 1.02)))
            albedo[idx + 2] = max(0, min(255, int(base * 0.72)))
            albedo[idx + 3] = 255

            normal[idx] = int(128 + d1 * 30)
            normal[idx + 1] = int(128 + d2 * 30)
            normal[idx + 2] = 255
            normal[idx + 3] = 255

            mr[idx] = 0
            mr[idx + 1] = 50   # Keen sharp reflection
            mr[idx + 2] = 240  # Heavy forged steel
            mr[idx + 3] = 255

    write_png("godot/assets/environment/textures/svar/svar_sun_steel_albedo.png", w, h, albedo)
    write_png("godot/assets/environment/textures/svar/svar_sun_steel_normal.png", w, h, normal)
    write_png("godot/assets/environment/textures/svar/svar_sun_steel_mr.png", w, h, mr)

def make_solar_core():
    w, h = 1024, 1024
    albedo = bytearray(w * h * 4)
    emissive = bytearray(w * h * 4)

    cx, cy = w // 2, h // 2
    for y in range(h):
        for x in range(w):
            idx = (y * w + x) * 4
            dx = x - cx
            dy = y - cy
            dist = math.sqrt(dx * dx + dy * dy)
            angle = math.atan2(dy, dx)

            # 12-fold solar corona prominence flares
            flares = math.sin(angle * 12.0 + math.sin(dist * 0.05) * 2.0) * 0.5 + 0.5
            core_falloff = max(0.0, 1.0 - dist / (w * 0.45))
            intensity = math.pow(core_falloff, 1.5) * (0.7 + 0.3 * flares)

            albedo[idx] = int(255 * intensity)
            albedo[idx + 1] = int(220 * intensity)
            albedo[idx + 2] = int(90 * intensity)
            albedo[idx + 3] = int(255 * min(1.0, core_falloff * 2.0))

            emissive[idx] = int(255 * intensity)
            emissive[idx + 1] = int(195 * intensity)
            emissive[idx + 2] = int(50 * intensity)
            emissive[idx + 3] = 255

    write_png("godot/assets/environment/textures/svar/svar_solar_core_albedo.png", w, h, albedo)
    write_png("godot/assets/environment/textures/svar/svar_solar_core_emissive.png", w, h, emissive)

def make_gryphon_textures():
    w, h = 1024, 1024
    albedo = bytearray(w * h * 4)
    normal = bytearray(w * h * 4)

    for y in range(h):
        for x in range(w):
            idx = (y * w + x) * 4
            # Layered plumage feathers
            fx = (x * 0.08) % 1.0
            fy = (y * 0.04) % 1.0
            feather = math.sin(fx * math.pi) * math.sin(fy * math.pi)

            # Warm amber/golden celestial plumage
            r = int(235 + feather * 20)
            g = int(185 + feather * 35)
            b = int(60 + feather * 40)

            albedo[idx] = max(0, min(255, r))
            albedo[idx + 1] = max(0, min(255, g))
            albedo[idx + 2] = max(0, min(255, b))
            albedo[idx + 3] = 255

            normal[idx] = int(128 + math.cos(fx * math.pi) * 60)
            normal[idx + 1] = int(128 + math.sin(fy * math.pi) * 60)
            normal[idx + 2] = 255
            normal[idx + 3] = 255

    write_png("godot/assets/characters/enemies/textures/svar_gryphon_albedo.png", w, h, albedo)
    write_png("godot/assets/characters/enemies/textures/svar_gryphon_normal.png", w, h, normal)

if __name__ == "__main__":
    print("Synthesizing Chapter IV (Svar) PBR Textures...")
    make_gold_marble()
    make_celestial_gold()
    make_solar_crystal()
    make_sun_steel()
    make_solar_core()
    make_gryphon_textures()
    print("Chapter IV Svar PBR Textures Complete!")
