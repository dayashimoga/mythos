"""
Mythos 3D - Bhumi PBR Texture Generation Pipeline
Stage Q12: Production Environment, Landscape & Architectural Quality Remaster
Synthesizes high-resolution PBR textures for the Bhumi 3D landscape and environment assets.
"""

import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

def create_terrain_textures(output_dir):
    os.makedirs(output_dir, exist_ok=True)
    size = (1024, 1024)
    print(f"[Terrain Textures] Generating PBR terrain textures in {output_dir}...")

    # 1. Terrain Grass Texture (Lush Emerald Vedic Meadow)
    grass_albedo = Image.new("RGBA", size, (38, 78, 28, 255))
    draw = ImageDraw.Draw(grass_albedo)
    # Layered organic grass blades and moss
    np.random.seed(42)
    for _ in range(12000):
        x = np.random.randint(0, size[0])
        y = np.random.randint(0, size[1])
        length = np.random.randint(8, 22)
        angle = np.random.uniform(-0.5, 0.5)
        ex = int(x + math.sin(angle) * length)
        ey = int(y - math.cos(angle) * length)
        g_val = np.random.randint(80, 155)
        r_val = int(g_val * 0.38)
        b_val = int(g_val * 0.22)
        draw.line([(x, y), (ex, ey)], fill=(r_val, g_val, b_val, 255), width=2)
    
    # Micro-clover accents
    for _ in range(800):
        cx = np.random.randint(0, size[0])
        cy = np.random.randint(0, size[1])
        c_rad = np.random.randint(3, 7)
        for a in range(3):
            ang = a * (2 * math.pi / 3.0)
            px = int(cx + math.cos(ang) * c_rad)
            py = int(cy + math.sin(ang) * c_rad)
            draw.ellipse([px - 2, py - 2, px + 2, py + 2], fill=(65, 145, 45, 230))

    grass_albedo = grass_albedo.filter(ImageFilter.SMOOTH_MORE)
    grass_albedo.save(os.path.join(output_dir, "terrain_grass_albedo.png"), optimize=True)

    # Grass Normal Map
    grass_normal = Image.new("RGBA", size, (128, 128, 255, 255))
    g_arr = np.array(grass_albedo.convert("L"), dtype=np.float32)
    gy, gx = np.gradient(g_arr)
    nx = np.clip(128.0 - gx * 1.5, 0, 255).astype(np.uint8)
    ny = np.clip(128.0 - gy * 1.5, 0, 255).astype(np.uint8)
    nz = np.full_like(nx, 255)
    normal_arr = np.dstack((nx, ny, nz, np.full_like(nx, 255)))
    Image.fromarray(normal_arr).save(os.path.join(output_dir, "terrain_grass_normal.png"), optimize=True)

    # 2. Terrain Stone / Basalt Flagstone (Temple Courtyard & Processional Avenue)
    stone_albedo = Image.new("RGBA", size, (72, 74, 80, 255))
    sdraw = ImageDraw.Draw(stone_albedo)
    # Hexagonal and rectangular chiseled flagstone pavers
    tile_size = 96
    for y in range(0, size[1], tile_size):
        for x in range(0, size[0], tile_size):
            offset = (tile_size // 2) if (y // tile_size) % 2 == 1 else 0
            px = (x + offset) % size[0]
            var = int(np.random.randint(-12, 14))
            sdraw.rectangle([px + 3, y + 3, px + tile_size - 3, y + tile_size - 3], fill=(72 + var, 74 + var, 80 + var, 255))
            # Inset chiseled border
            sdraw.rectangle([px + 8, y + 8, px + tile_size - 8, y + tile_size - 8], outline=(55, 57, 62, 255), width=1)
            # Joint mortar lines
            sdraw.line([(px, y), (px + tile_size, y)], fill=(32, 34, 38, 255), width=3)
            sdraw.line([(px, y), (px, y + tile_size)], fill=(32, 34, 38, 255), width=3)
    
    # Subtle carved lotus medallion in courtyard stones
    for cy in [256, 768]:
        for cx in [256, 768]:
            sdraw.ellipse([cx - 45, cy - 45, cx + 45, cy + 45], outline=(155, 130, 60, 180), width=2)
            sdraw.ellipse([cx - 15, cy - 15, cx + 15, cy + 15], fill=(185, 155, 75, 220))
            for a in range(8):
                ang = a * (math.pi / 4.0)
                ex = int(cx + math.cos(ang) * 40)
                ey = int(cy + math.sin(ang) * 40)
                sdraw.line([(cx, cy), (ex, ey)], fill=(155, 130, 60, 160), width=2)

    stone_albedo.save(os.path.join(output_dir, "terrain_stone_albedo.png"), optimize=True)

    # Stone Normal Map
    s_arr = np.array(stone_albedo.convert("L"), dtype=np.float32)
    sy, sx = np.gradient(s_arr)
    snx = np.clip(128.0 - sx * 2.2, 0, 255).astype(np.uint8)
    sny = np.clip(128.0 - sy * 2.2, 0, 255).astype(np.uint8)
    sn_arr = np.dstack((snx, sny, np.full_like(snx, 255), np.full_like(snx, 255)))
    Image.fromarray(sn_arr).save(os.path.join(output_dir, "terrain_stone_normal.png"), optimize=True)

    # 3. Terrain Soil / Trodden Earth (Forest Trails & Clearings)
    soil_albedo = Image.new("RGBA", size, (110, 85, 62, 255))
    fdraw = ImageDraw.Draw(soil_albedo)
    for _ in range(8000):
        x = np.random.randint(0, size[0])
        y = np.random.randint(0, size[1])
        rad = np.random.randint(2, 6)
        c_var = np.random.randint(-18, 20)
        fdraw.ellipse([x - rad, y - rad, x + rad, y + rad], fill=(110 + c_var, 85 + c_var, 62 + c_var, 255))
    # Fine fallen leaf litter
    for _ in range(500):
        x = np.random.randint(0, size[0])
        y = np.random.randint(0, size[1])
        leaf_len = np.random.randint(5, 10)
        fdraw.polygon([(x, y), (x + leaf_len, y + 3), (x + leaf_len * 2, y), (x + leaf_len, y - 3)], fill=(145, 95, 40, 210))

    soil_albedo.save(os.path.join(output_dir, "terrain_soil_albedo.png"), optimize=True)
    so_arr = np.array(soil_albedo.convert("L"), dtype=np.float32)
    soy, sox = np.gradient(so_arr)
    Image.fromarray(np.dstack((np.clip(128.0 - sox * 1.8, 0, 255).astype(np.uint8), np.clip(128.0 - soy * 1.8, 0, 255).astype(np.uint8), np.full_like(sox, 255, dtype=np.uint8), np.full_like(sox, 255, dtype=np.uint8)))).save(os.path.join(output_dir, "terrain_soil_normal.png"), optimize=True)

    # 4. Terrain Rock / Red Ochre Strata (Tapas Ridge & Perimeter Mountains)
    rock_albedo = Image.new("RGBA", size, (135, 92, 70, 255))
    rdraw = ImageDraw.Draw(rock_albedo)
    for y in range(0, size[1], 18):
        var = int(math.sin(y * 0.08) * 16)
        rdraw.line([(0, y), (size[0], y + int(math.sin(y * 0.04) * 8))], fill=(120 + var, 80 + var, 60 + var, 255), width=4)
        if y % 54 == 0:
            rdraw.line([(0, y), (size[0], y)], fill=(65, 45, 35, 255), width=3)
    rock_albedo.save(os.path.join(output_dir, "terrain_rock_albedo.png"), optimize=True)
    ro_arr = np.array(rock_albedo.convert("L"), dtype=np.float32)
    roy, rox = np.gradient(ro_arr)
    Image.fromarray(np.dstack((np.clip(128.0 - rox * 2.5, 0, 255).astype(np.uint8), np.clip(128.0 - roy * 2.5, 0, 255).astype(np.uint8), np.full_like(rox, 255, dtype=np.uint8), np.full_like(rox, 255, dtype=np.uint8)))).save(os.path.join(output_dir, "terrain_rock_normal.png"), optimize=True)

    # 5. Sacred Kalyani Water Ripple Normal Map (512x512)
    w_size = (512, 512)
    w_norm = np.zeros((w_size[1], w_size[0], 4), dtype=np.uint8)
    for y in range(w_size[1]):
        for x in range(w_size[0]):
            u = x / float(w_size[0]) * 2.0 * math.pi * 6.0
            v = y / float(w_size[1]) * 2.0 * math.pi * 6.0
            wave1 = math.sin(u + math.sin(v * 0.5))
            wave2 = math.cos(v + math.sin(u * 0.5))
            wave3 = math.sin(u * 1.5 - v * 1.5)
            nx = int(128.0 + (wave1 * 0.4 + wave3 * 0.3) * 64.0)
            ny = int(128.0 + (wave2 * 0.4 - wave3 * 0.3) * 64.0)
            w_norm[y, x] = [np.clip(nx, 0, 255), np.clip(ny, 0, 255), 255, 255]
    Image.fromarray(w_norm).save(os.path.join(output_dir, "water_normal.png"), optimize=True)

    print("[Terrain Textures] All 5 PBR terrain textures successfully generated!")

if __name__ == "__main__":
    create_terrain_textures("godot/assets/environment/textures")
