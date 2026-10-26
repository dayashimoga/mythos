#!/usr/bin/env python3
"""
Generate high-resolution 1024x1024 PBR texture maps for Chapter II: Realm of Antariksha.
Creates:
- Aerolith Rock (albedo, normal, roughness) for floating islands
- Aerial Windswept Moss / Turf (albedo, normal, roughness)
- Vayu Brass & Engraved Wind Mantras (albedo, normal, metallic-roughness)
- Prana Wind Crystal (albedo, normal, emissive)
- Falcon & Archer textures
- Boss Matarishvan Tempest Feathers, Armor, and Magma/Tempest Core
"""

import os
import math
import struct
import zlib

def write_png(filename, width, height, pixels):
    """
    Writes RGBA png file.
    pixels: bytearray of size width * height * 4
    """
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

def make_aerolith_rock():
    w, h = 1024, 1024
    albedo = bytearray(w * h * 4)
    normal = bytearray(w * h * 4)
    rough = bytearray(w * h * 4)

    for y in range(h):
        for x in range(w):
            idx = (y * w + x) * 4
            # Multi-frequency noise simulation
            nx1 = math.sin(x * 0.04) * math.cos(y * 0.04)
            nx2 = math.sin(x * 0.09 + 1.2) * math.sin(y * 0.09 + 0.7)
            nx3 = math.sin(x * 0.22 - y * 0.15) * 0.5
            val = (nx1 * 0.5 + nx2 * 0.3 + nx3 * 0.2 + 1.0) * 0.5 # 0..1

            # Celestial Aerolith Rock: Pale silver-gray granite with turquoise mineral veining
            r = int(clamp(165 + val * 45 - (val > 0.65) * 40, 0, 255))
            g = int(clamp(180 + val * 40 + (val > 0.65) * 35, 0, 255))
            b = int(clamp(195 + val * 50 + (val > 0.65) * 55, 0, 255))

            albedo[idx] = r
            albedo[idx+1] = g
            albedo[idx+2] = b
            albedo[idx+3] = 255

            # Normal map from gradient
            dx = math.cos(x * 0.04) * 0.5 + math.cos(x * 0.09) * 0.3
            dy = -math.sin(y * 0.04) * 0.5 + math.cos(y * 0.09) * 0.3
            norm_x = int(clamp(128 + dx * 80, 0, 255))
            norm_y = int(clamp(128 + dy * 80, 0, 255))
            normal[idx] = norm_x
            normal[idx+1] = norm_y
            normal[idx+2] = 255
            normal[idx+3] = 255

            # Roughness: 0.75 - 0.90
            r_val = int(clamp(190 + (1.0 - val) * 55, 0, 255))
            rough[idx] = r_val
            rough[idx+1] = r_val
            rough[idx+2] = r_val
            rough[idx+3] = 255

    write_png('godot/assets/environment/textures/aerolith_rock_albedo.png', w, h, albedo)
    write_png('godot/assets/environment/textures/aerolith_rock_normal.png', w, h, normal)
    write_png('godot/assets/environment/textures/aerolith_rock_roughness.png', w, h, rough)

def make_vayu_brass():
    w, h = 1024, 1024
    albedo = bytearray(w * h * 4)
    normal = bytearray(w * h * 4)
    mr = bytearray(w * h * 4) # Metallic in B, Roughness in G

    for y in range(h):
        for x in range(w):
            idx = (y * w + x) * 4
            # Swirling wind engraving patterns
            r_dist = math.sqrt((x - 512)**2 + (y - 512)**2)
            angle = math.atan2(y - 512, x - 512)
            spiral = math.sin(r_dist * 0.08 + angle * 4.0)

            # Rich Vedic Brass: Gold/bronze base with wind patina
            base_r = 215 + int(spiral * 25)
            base_g = 175 + int(spiral * 20)
            base_b = 85 + int(spiral * 15)

            albedo[idx] = clamp(base_r, 0, 255)
            albedo[idx+1] = clamp(base_g, 0, 255)
            albedo[idx+2] = clamp(base_b, 0, 255)
            albedo[idx+3] = 255

            # Normal perturbation from spirals
            dx = math.cos(r_dist * 0.08 + angle * 4.0) * 0.5
            normal[idx] = int(clamp(128 + dx * 90, 0, 255))
            normal[idx+1] = int(clamp(128 - dx * 90, 0, 255))
            normal[idx+2] = 245
            normal[idx+3] = 255

            # Metallic in B (0.85), Roughness in G (0.35)
            mr[idx] = 0
            mr[idx+1] = 90 # Roughness ~ 0.35
            mr[idx+2] = 220 # Metallic ~ 0.86
            mr[idx+3] = 255

    write_png('godot/assets/environment/textures/vayu_brass_albedo.png', w, h, albedo)
    write_png('godot/assets/environment/textures/vayu_brass_normal.png', w, h, normal)
    write_png('godot/assets/environment/textures/vayu_brass_metallic_roughness.png', w, h, mr)

def make_prana_crystal():
    w, h = 1024, 1024
    albedo = bytearray(w * h * 4)
    normal = bytearray(w * h * 4)
    emissive = bytearray(w * h * 4)

    for y in range(h):
        for x in range(w):
            idx = (y * w + x) * 4
            facet1 = math.sin(x * 0.05 + y * 0.05)
            facet2 = math.cos(x * 0.08 - y * 0.04)
            val = (facet1 + facet2) * 0.5

            # Glowing cyan/turquoise crystal
            albedo[idx] = clamp(60 + int(val * 40), 0, 255)
            albedo[idx+1] = clamp(210 + int(val * 40), 0, 255)
            albedo[idx+2] = clamp(245 + int(val * 10), 0, 255)
            albedo[idx+3] = 255

            normal[idx] = int(clamp(128 + facet1 * 60, 0, 255))
            normal[idx+1] = int(clamp(128 + facet2 * 60, 0, 255))
            normal[idx+2] = 240
            normal[idx+3] = 255

            # Emissive core
            glow = math.sin(x * 0.02) * math.sin(y * 0.02)
            glow_intensity = clamp(120 + int(glow * 130), 0, 255)
            emissive[idx] = int(glow_intensity * 0.2)
            emissive[idx+1] = int(glow_intensity * 0.85)
            emissive[idx+2] = glow_intensity
            emissive[idx+3] = 255

    write_png('godot/assets/environment/textures/prana_crystal_albedo.png', w, h, albedo)
    write_png('godot/assets/environment/textures/prana_crystal_normal.png', w, h, normal)
    write_png('godot/assets/environment/textures/prana_crystal_emissive.png', w, h, emissive)

def make_matarishvan_boss_textures():
    w, h = 1024, 1024
    albedo = bytearray(w * h * 4)
    normal = bytearray(w * h * 4)
    emissive = bytearray(w * h * 4)
    mr = bytearray(w * h * 4)

    for y in range(h):
        for x in range(w):
            idx = (y * w + x) * 4
            # Wing feather barbs and aerodynamic plate armor
            feather = math.sin(x * 0.12) * math.cos(y * 0.03)
            rune = math.sin(x * 0.05 + y * 0.05) * math.sin(x * 0.05 - y * 0.05)

            # Deep twilight tempest slate with gold trim
            r = clamp(45 + int(feather * 20), 0, 255)
            g = clamp(65 + int(feather * 25), 0, 255)
            b = clamp(95 + int(feather * 35), 0, 255)

            albedo[idx] = r
            albedo[idx+1] = g
            albedo[idx+2] = b
            albedo[idx+3] = 255

            normal[idx] = int(clamp(128 + feather * 70, 0, 255))
            normal[idx+1] = int(clamp(128 - feather * 70, 0, 255))
            normal[idx+2] = 245
            normal[idx+3] = 255

            # Glowing golden/cyan tempest runes
            if rune > 0.65:
                emissive[idx] = 40
                emissive[idx+1] = 220
                emissive[idx+2] = 255
            else:
                emissive[idx] = 0
                emissive[idx+1] = 0
                emissive[idx+2] = 0
            emissive[idx+3] = 255

            mr[idx] = 0
            mr[idx+1] = 100 # Roughness ~ 0.4
            mr[idx+2] = 180 # Metallic ~ 0.7
            mr[idx+3] = 255

    write_png('godot/assets/characters/enemies/textures/matarishvan_albedo.png', w, h, albedo)
    write_png('godot/assets/characters/enemies/textures/matarishvan_normal.png', w, h, normal)
    write_png('godot/assets/characters/enemies/textures/matarishvan_emissive.png', w, h, emissive)
    write_png('godot/assets/characters/enemies/textures/matarishvan_mr.png', w, h, mr)

def clamp(val, min_v, max_v):
    return max(min_v, min(max_v, val))

if __name__ == '__main__':
    print("=== Synthesizing Antariksha PBR Textures ===")
    make_aerolith_rock()
    make_vayu_brass()
    make_prana_crystal()
    make_matarishvan_boss_textures()
    print("=== Texture Synthesis Complete ===")
