#!/usr/bin/env python3
"""
Generate high-resolution 1024x1024 PBR texture maps for Chapter III: Realm of Patala (Subterranean Serpent Vaults).
Creates:
- Patala Obsidian Rock (albedo, normal, roughness) for cavern chambers and stalagmites
- Patala Venom Slime / Moss (albedo, normal, emissive) for toxic waterways and cavern banks
- Patala Serpent Scales (albedo, normal, roughness, metallic) for Naga warriors and Boss Shesha
- Patala Bioluminescent Fungus (albedo, normal, emissive) for mushroom springboards
- Patala Vasuki Vedic Brass (albedo, normal, roughness, metallic) for ancient serpent shrines and pedestals
- Patala Nagamani Crystal (albedo, normal, emissive) for divine serpent jewels
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

def make_obsidian_rock():
    w, h = 1024, 1024
    albedo = bytearray(w * h * 4)
    normal = bytearray(w * h * 4)
    rough = bytearray(w * h * 4)

    for y in range(h):
        for x in range(w):
            idx = (y * w + x) * 4
            # Volcanic basalt noise & cracked fissures
            nx1 = math.sin(x * 0.035) * math.cos(y * 0.035)
            nx2 = math.sin(x * 0.08 + 1.5) * math.sin(y * 0.08 + 0.9)
            nx3 = math.sin(x * 0.18 - y * 0.12) * 0.5
            cracks = math.sin(x * 0.06 + math.cos(y * 0.05) * 3.0) * math.cos(y * 0.06 + math.sin(x * 0.05) * 3.0)
            
            n = (nx1 * 0.5 + nx2 * 0.3 + nx3 * 0.2 + 1.0) * 0.5
            crack_val = 1.0 - math.exp(-abs(cracks) * 6.0)

            # Deep subterranean obsidian with emerald vein undertones
            base_r = int(24 + n * 26 * crack_val)
            base_g = int(32 + n * 35 * crack_val + (1.0 - crack_val) * 20)
            base_b = int(36 + n * 40 * crack_val)

            albedo[idx] = max(0, min(255, base_r))
            albedo[idx + 1] = max(0, min(255, base_g))
            albedo[idx + 2] = max(0, min(255, base_b))
            albedo[idx + 3] = 255

            # Normal map from gradient of noise
            dx = math.cos(x * 0.035) * math.cos(y * 0.035) * 0.5 + math.cos(x * 0.08 + 1.5) * 0.3
            dy = -math.sin(x * 0.035) * math.sin(y * 0.035) * 0.5 + math.cos(y * 0.08 + 0.9) * 0.3
            norm_x = int(128 + dx * 60)
            norm_y = int(128 + dy * 60)
            normal[idx] = max(0, min(255, norm_x))
            normal[idx + 1] = max(0, min(255, norm_y))
            normal[idx + 2] = 240
            normal[idx + 3] = 255

            # Roughness: slick polished obsidian in some zones, rough fracture elsewhere
            r_val = int(80 + (1.0 - n) * 110 + (1.0 - crack_val) * 50)
            rough[idx] = max(0, min(255, r_val))
            rough[idx + 1] = max(0, min(255, r_val))
            rough[idx + 2] = max(0, min(255, r_val))
            rough[idx + 3] = 255

    write_png("godot/assets/textures/patala_obsidian_albedo.png", w, h, albedo)
    write_png("godot/assets/textures/patala_obsidian_normal.png", w, h, normal)
    write_png("godot/assets/textures/patala_obsidian_roughness.png", w, h, rough)

def make_venom_moss():
    w, h = 1024, 1024
    albedo = bytearray(w * h * 4)
    normal = bytearray(w * h * 4)
    emissive = bytearray(w * h * 4)

    for y in range(h):
        for x in range(w):
            idx = (y * w + x) * 4
            # Cellular toxic bioluminescent slime patterns
            cx = (x % 64) - 32
            cy = (y % 64) - 32
            dist = math.sqrt(cx*cx + cy*cy) / 32.0
            blob = math.sin(x * 0.05 + math.sin(y * 0.05) * 2.0) * math.cos(y * 0.05)
            glow_intensity = math.exp(-dist * 2.2) * 0.6 + max(0.0, blob) * 0.4

            # Vivid bioluminescent jade/emerald
            albedo[idx] = int(18 + glow_intensity * 30)
            albedo[idx + 1] = int(120 + glow_intensity * 130)
            albedo[idx + 2] = int(60 + glow_intensity * 110)
            albedo[idx + 3] = 255

            # Normal
            normal[idx] = int(128 + math.sin(x * 0.1) * 35)
            normal[idx + 1] = int(128 + math.cos(y * 0.1) * 35)
            normal[idx + 2] = 240
            normal[idx + 3] = 255

            # Emissive map
            em_val = int(glow_intensity * 230)
            emissive[idx] = int(em_val * 0.15)
            emissive[idx + 1] = em_val
            emissive[idx + 2] = int(em_val * 0.65)
            emissive[idx + 3] = 255

    write_png("godot/assets/textures/patala_venom_moss_albedo.png", w, h, albedo)
    write_png("godot/assets/textures/patala_venom_moss_normal.png", w, h, normal)
    write_png("godot/assets/textures/patala_venom_moss_emissive.png", w, h, emissive)

def make_serpent_scales():
    w, h = 1024, 1024
    albedo = bytearray(w * h * 4)
    normal = bytearray(w * h * 4)
    metallic_rough = bytearray(w * h * 4)

    scale_size = 32
    for y in range(h):
        # Hexagonal grid stagger
        row = y // scale_size
        x_offset = (scale_size // 2) if (row % 2 == 1) else 0
        for x in range(w):
            idx = (y * w + x) * 4
            sx = (x + x_offset) % scale_size - (scale_size // 2)
            sy = y % scale_size - (scale_size // 2)
            r = math.sqrt(sx*sx + sy*sy) / (scale_size // 2)
            keel = max(0.0, 1.0 - abs(sx) / (scale_size // 2)) * math.cos(sy * 0.1)

            # Iridescent dark serpent green with amethyst edge
            spec = max(0.0, 1.0 - r)
            r_c = int(25 + spec * 45 + keel * 30)
            g_c = int(65 + spec * 120 + keel * 60)
            b_c = int(45 + spec * 80 + (1.0 - spec) * 40)

            albedo[idx] = max(0, min(255, r_c))
            albedo[idx + 1] = max(0, min(255, g_c))
            albedo[idx + 2] = max(0, min(255, b_c))
            albedo[idx + 3] = 255

            # Normal with scale ridge/keel
            nx = int(128 - (sx / (scale_size // 2)) * 80)
            ny = int(128 - (sy / (scale_size // 2)) * 80 + keel * 30)
            normal[idx] = max(0, min(255, nx))
            normal[idx + 1] = max(0, min(255, ny))
            normal[idx + 2] = 230
            normal[idx + 3] = 255

            # Metallic / Roughness: G = Roughness, B = Metallic
            metallic_rough[idx] = 0
            metallic_rough[idx + 1] = int(60 + (1.0 - spec) * 120)  # Roughness
            metallic_rough[idx + 2] = int(80 + spec * 110)          # Metallic
            metallic_rough[idx + 3] = 255

    write_png("godot/assets/textures/patala_serpent_scales_albedo.png", w, h, albedo)
    write_png("godot/assets/textures/patala_serpent_scales_normal.png", w, h, normal)
    write_png("godot/assets/textures/patala_serpent_scales_mr.png", w, h, metallic_rough)

def make_fungus_textures():
    w, h = 512, 512
    albedo = bytearray(w * h * 4)
    normal = bytearray(w * h * 4)
    emissive = bytearray(w * h * 4)

    for y in range(h):
        for x in range(w):
            idx = (y * w + x) * 4
            # Radial mushroom cap pattern
            dx = x - 256
            dy = y - 256
            r = math.sqrt(dx*dx + dy*dy) / 256.0
            angle = math.atan2(dy, dx)
            gills = math.sin(angle * 48.0) * 0.5 + 0.5

            # Bioluminescent turquoise cap
            glow = max(0.0, 1.0 - r * 0.9) * (0.6 + gills * 0.4)
            albedo[idx] = int(10 + glow * 40)
            albedo[idx + 1] = int(80 + glow * 140)
            albedo[idx + 2] = int(90 + glow * 155)
            albedo[idx + 3] = 255

            normal[idx] = int(128 + math.cos(angle) * (1.0 - r) * 50)
            normal[idx + 1] = int(128 + math.sin(angle) * (1.0 - r) * 50)
            normal[idx + 2] = 240
            normal[idx + 3] = 255

            em_val = int(glow * 220)
            emissive[idx] = int(em_val * 0.1)
            emissive[idx + 1] = em_val
            emissive[idx + 2] = int(em_val * 0.9)
            emissive[idx + 3] = 255

    write_png("godot/assets/textures/patala_fungus_albedo.png", w, h, albedo)
    write_png("godot/assets/textures/patala_fungus_normal.png", w, h, normal)
    write_png("godot/assets/textures/patala_fungus_emissive.png", w, h, emissive)

def make_vasuki_brass():
    w, h = 1024, 1024
    albedo = bytearray(w * h * 4)
    normal = bytearray(w * h * 4)
    metallic_rough = bytearray(w * h * 4)

    for y in range(h):
        for x in range(w):
            idx = (y * w + x) * 4
            # Vedic serpent knot filigree
            knot1 = math.sin(x * 0.04 + math.sin(y * 0.04) * 2.5)
            knot2 = math.cos(y * 0.04 + math.cos(x * 0.04) * 2.5)
            filigree = math.exp(-abs(knot1 * knot2) * 4.0)

            # Antique weathered subterranean bronze / brass with patina
            patina = math.sin(x * 0.02) * math.cos(y * 0.02) * 0.5 + 0.5
            albedo[idx] = int(170 * (1.0 - filigree * 0.3) - patina * 50)
            albedo[idx + 1] = int(130 * (1.0 - filigree * 0.2) + patina * 20)
            albedo[idx + 2] = int(60 + filigree * 50 + patina * 30)
            albedo[idx + 3] = 255

            normal[idx] = int(128 + knot1 * filigree * 60)
            normal[idx + 1] = int(128 + knot2 * filigree * 60)
            normal[idx + 2] = 230
            normal[idx + 3] = 255

            # G = Roughness, B = Metallic
            metallic_rough[idx] = 0
            metallic_rough[idx + 1] = int(70 + patina * 90)   # Roughness
            metallic_rough[idx + 2] = int(210 - patina * 80)  # Metallic
            metallic_rough[idx + 3] = 255

    write_png("godot/assets/textures/patala_vasuki_brass_albedo.png", w, h, albedo)
    write_png("godot/assets/textures/patala_vasuki_brass_normal.png", w, h, normal)
    write_png("godot/assets/textures/patala_vasuki_brass_mr.png", w, h, metallic_rough)

def make_nagamani_crystal():
    w, h = 512, 512
    albedo = bytearray(w * h * 4)
    normal = bytearray(w * h * 4)
    emissive = bytearray(w * h * 4)

    for y in range(h):
        for x in range(w):
            idx = (y * w + x) * 4
            dx = x - 256
            dy = y - 256
            r = math.sqrt(dx*dx + dy*dy) / 256.0
            facet = math.sin(math.atan2(dy, dx) * 12.0) * 0.5 + 0.5
            core = max(0.0, 1.0 - r * 1.2)

            albedo[idx] = max(0, min(255, int(30 + core * 50 + facet * 30)))
            albedo[idx + 1] = max(0, min(255, int(190 + core * 65)))
            albedo[idx + 2] = max(0, min(255, int(120 + core * 95 + facet * 35)))
            albedo[idx + 3] = 255

            normal[idx] = max(0, min(255, int(128 + math.cos(math.atan2(dy, dx) * 12.0) * 45)))
            normal[idx + 1] = max(0, min(255, int(128 + math.sin(math.atan2(dy, dx) * 12.0) * 45)))
            normal[idx + 2] = 235
            normal[idx + 3] = 255

            em_val = int(core * 220 + facet * 35)
            emissive[idx] = max(0, min(255, int(em_val * 0.2)))
            emissive[idx + 1] = max(0, min(255, em_val))
            emissive[idx + 2] = max(0, min(255, int(em_val * 0.75)))
            emissive[idx + 3] = 255

    write_png("godot/assets/textures/patala_nagamani_albedo.png", w, h, albedo)
    write_png("godot/assets/textures/patala_nagamani_normal.png", w, h, normal)
    write_png("godot/assets/textures/patala_nagamani_emissive.png", w, h, emissive)

def main():
    print("Generating PBR texture maps for Chapter III: Patala Underworld...")
    make_obsidian_rock()
    make_venom_moss()
    make_serpent_scales()
    make_fungus_textures()
    make_vasuki_brass()
    make_nagamani_crystal()
    print("All Patala PBR textures generated successfully!")

if __name__ == "__main__":
    main()
