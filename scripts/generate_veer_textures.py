"""
Mythos 3D - Production PBR Texture Generator for Hero Veer (Solar Guardian)
Generates high-resolution PBR textures:
- Mat_Veer_Skin: Rich warm Indian bronze heroic skin tone with subsurface dermal warmth & micro-pore detail
- Mat_Veer_Cuirass: Antique forged bronze with etched Surya flame motifs and beveled borders
- Mat_Veer_Gold: 24k radiant polished gold with lotus petal engravings and ornamental filigree
- Mat_Veer_Dhoti: Deep Saffron silk with accordion pleats, royal crimson zari borders & golden brocade
- Mat_Veer_Sash: Tapovan celestial azure silk with radiant solar runes and emissive bloom
- Mat_Veer_Khadga: Damascus sunsteel blade, golden hilt, glowing fuller rune channel & ruby pommel
- Mat_Veer_Hair: Deep obsidian black warrior locks with anisotropic sheen and strand normal
- Mat_Veer_Eyes: Natural humanoid warrior eyes with off-white sclera, dark amber iris & glossy pupil
- Mat_Veer_Tilak: Sacred white sandalwood ash (Tripundra) with sacred crimson vermilion Kumkum bindu
"""

import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

TEXTURE_DIR = r"h:\mythologicalgame\godot\assets\characters\veer\textures"
os.makedirs(TEXTURE_DIR, exist_ok=True)

def save_image(img: Image.Image, filename: str):
    path = os.path.join(TEXTURE_DIR, filename)
    img.save(path, format="PNG")
    print(f"Saved: {path} ({img.size[0]}x{img.size[1]})")

# 1. Mat_Veer_Skin (1024x1024)
def make_skin_textures():
    size = (1024, 1024)
    # Natural warm heroic Indian bronze skin tone (#A05F36 to #B67240)
    albedo = Image.new("RGBA", size, (160, 95, 54, 255))
    draw = ImageDraw.Draw(albedo)
    
    # Smooth anatomical tonal gradation (warmer reddish undertones)
    for y in range(size[1]):
        t = y / size[1]
        r = int(156 + 22 * math.sin(t * math.pi))
        g = int(92 + 16 * math.sin(t * math.pi))
        b = int(50 + 12 * math.sin(t * math.pi))
        draw.line([(0, y), (size[0], y)], fill=(r, g, b, 255))
    
    # Subtle organic epidermal micro-variation
    np.random.seed(42)
    noise = (np.random.rand(size[1], size[0]) - 0.5) * 5.0
    arr = np.array(albedo, dtype=np.float32)
    for c in range(3):
        arr[:, :, c] = np.clip(arr[:, :, c] + noise, 0, 255)
    albedo = Image.fromarray(arr.astype(np.uint8))
    
    # Normal map with realistic micro-pore & dermal surface
    normal = Image.new("RGB", size, (128, 128, 255))
    narr = np.array(normal, dtype=np.float32)
    pnoise = (np.random.rand(size[1], size[0]) - 0.5) * 3.5
    narr[:, :, 0] = np.clip(narr[:, :, 0] + pnoise, 0, 255)
    narr[:, :, 1] = np.clip(narr[:, :, 1] + pnoise, 0, 255)
    normal = Image.fromarray(narr.astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=0.7))
    
    # MR: Natural skin roughness ~ 0.62 (158), metallic = 0.0 (ELIMINATES PLASTIC SPECULAR SHINE)
    mr_arr = np.zeros((size[1], size[0], 3), dtype=np.uint8)
    mr_arr[:, :, 0] = 255 # Unused/AO
    mr_arr[:, :, 1] = 158 # Roughness = 0.62 (matte skin)
    mr_arr[:, :, 2] = 0   # Metallic = 0.0
    mr = Image.fromarray(mr_arr)
    
    save_image(albedo, "skin_albedo.png")
    save_image(normal, "skin_normal.png")
    save_image(mr, "skin_mr.png")

# 2. Mat_Veer_Dhoti (1024x1024)
def make_dhoti_textures():
    size = (1024, 1024)
    # Deep Saffron Orange Silk (#DE6012)
    albedo = Image.new("RGBA", size, (222, 96, 18, 255))
    draw = ImageDraw.Draw(albedo)
    
    # Fine pleated silk fabric shading (vertical accordion pleats)
    n_pleats = 48
    pleat_w = size[0] / n_pleats
    for i in range(n_pleats):
        x0 = int(i * pleat_w)
        x1 = int((i + 1) * pleat_w)
        t = math.sin((i / n_pleats) * math.pi * 12)
        r = int(222 + t * 16)
        g = int(96 + t * 12)
        b = int(18 + t * 8)
        draw.rectangle([x0, 0, x1, size[1]], fill=(r, g, b, 255))
        
    # Royal Crimson silk border band at bottom (Zari hem)
    border_h = 180
    draw.rectangle([0, size[1] - border_h, size[0], size[1]], fill=(138, 20, 28, 255))
    
    # Golden zari brocade embroidery band (#F5B014)
    zari_y = size[1] - border_h + 25
    draw.rectangle([0, zari_y, size[0], zari_y + 28], fill=(248, 188, 32, 255))
    draw.rectangle([0, size[1] - 30, size[0], size[1] - 12], fill=(248, 188, 32, 255))
    
    # Diamond / Floral Zari motifs along border
    step = 42
    for x in range(0, size[0], step):
        cy = zari_y + 65
        draw.polygon([(x, cy - 20), (x + 20, cy), (x, cy + 20), (x - 20, cy)], fill=(255, 218, 65, 255), outline=(175, 105, 12, 255))
    
    # Normal map with crisp accordion pleat ripples
    normal = Image.new("RGB", size, (128, 128, 255))
    ndraw = ImageDraw.Draw(normal)
    for i in range(n_pleats):
        x = int(i * pleat_w)
        ndraw.line([(x, 0), (x, size[1])], fill=(155, 128, 245), width=2)
        ndraw.line([(x + int(pleat_w*0.5), 0), (x + int(pleat_w*0.5), size[1])], fill=(100, 128, 245), width=2)
    normal = normal.filter(ImageFilter.GaussianBlur(radius=1.5))
    
    # MR: Silk Roughness ~ 0.65 (165), Metallic = 0; Zari gold has Roughness 0.22, Metallic 0.70
    mr = Image.new("RGB", size, (255, 165, 0))
    mr_draw = ImageDraw.Draw(mr)
    mr_draw.rectangle([0, zari_y, size[0], zari_y + 28], fill=(255, 56, 178))
    mr_draw.rectangle([0, size[1] - 30, size[0], size[1] - 12], fill=(255, 56, 178))
    
    save_image(albedo, "dhoti_albedo.png")
    save_image(normal, "dhoti_normal.png")
    save_image(mr, "dhoti_mr.png")

# 3. Mat_Veer_Cuirass / Armor (1024x1024)
def make_armor_textures():
    size = (1024, 1024)
    # Antique forged bronze (#9A5E2E) with engraved solar flames
    albedo = Image.new("RGBA", size, (154, 94, 46, 255))
    draw = ImageDraw.Draw(albedo)
    
    # Brushed metal lines
    for y in range(0, size[1], 4):
        tint = (y * 17) % 24 - 12
        r = max(0, min(255, 154 + tint))
        g = max(0, min(255, 94 + tint))
        b = max(0, min(255, 46 + tint))
        draw.line([(0, y), (size[0], y)], fill=(r, g, b, 255), width=2)
    
    # Beveled bronze border trims with gold filigree
    draw.rectangle([16, 16, size[0] - 16, size[1] - 16], outline=(215, 158, 68, 255), width=20)
    draw.rectangle([44, 44, size[0] - 44, size[1] - 44], outline=(96, 54, 20, 255), width=8)
    
    # Central radiant Surya disc & flames
    cx, cy = size[0] // 2, size[1] // 2
    draw.ellipse([cx - 140, cy - 140, cx + 140, cy + 140], fill=(182, 126, 58, 255), outline=(242, 190, 82, 255), width=10)
    for i in range(12):
        angle = (i / 12) * math.pi * 2
        p_tip = (cx + int(240 * math.cos(angle)), cy + int(240 * math.sin(angle)))
        p_left = (cx + int(150 * math.cos(angle - 0.15)), cy + int(150 * math.sin(angle - 0.15)))
        p_right = (cx + int(150 * math.cos(angle + 0.15)), cy + int(150 * math.sin(angle + 0.15)))
        draw.polygon([p_left, p_tip, p_right], fill=(232, 172, 70, 255), outline=(115, 65, 25, 255))
    
    normal = Image.new("RGB", size, (128, 128, 255))
    ndraw = ImageDraw.Draw(normal)
    ndraw.rectangle([16, 16, size[0] - 16, size[1] - 16], outline=(155, 155, 240), width=20)
    ndraw.ellipse([cx - 140, cy - 140, cx + 140, cy + 140], outline=(160, 160, 245), width=12)
    normal = normal.filter(ImageFilter.GaussianBlur(radius=2))
    
    # MR: Antique Bronze Roughness ~ 0.35 (89), Metallic ~ 0.88 (224)
    mr = Image.new("RGB", size, (255, 89, 224))
    save_image(albedo, "armor_albedo.png")
    save_image(normal, "armor_normal.png")
    save_image(mr, "armor_mr.png")

# 4. Mat_Veer_Gold (1024x1024)
def make_gold_textures():
    size = (1024, 1024)
    # 24k Radiant Polished Gold (#F6BA22)
    albedo = Image.new("RGBA", size, (246, 186, 34, 255))
    draw = ImageDraw.Draw(albedo)
    
    cx, cy = size[0] // 2, size[1] // 2
    for r in range(400, 0, -8):
        factor = r / 400.0
        gold_val = int(255 - factor * 30)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(gold_val, int(gold_val*0.82), 22, 255), width=8)
    
    # Lotus petals engraving pattern
    n_petals = 16
    for i in range(n_petals):
        angle = (i / n_petals) * math.pi * 2
        px = cx + int(220 * math.cos(angle))
        py = cy + int(220 * math.sin(angle))
        draw.ellipse([px - 45, py - 45, px + 45, py + 45], outline=(255, 238, 125, 255), width=6)
    
    normal = Image.new("RGB", size, (128, 128, 255))
    ndraw = ImageDraw.Draw(normal)
    for i in range(n_petals):
        angle = (i / n_petals) * math.pi * 2
        px = cx + int(220 * math.cos(angle))
        py = cy + int(220 * math.sin(angle))
        ndraw.ellipse([px - 45, py - 45, px + 45, py + 45], outline=(155, 155, 245), width=6)
    normal = normal.filter(ImageFilter.GaussianBlur(radius=2))
    
    # MR: Polished Gold Roughness ~ 0.20 (51), Metallic ~ 0.96 (245)
    mr = Image.new("RGB", size, (255, 51, 245))
    save_image(albedo, "gold_albedo.png")
    save_image(normal, "gold_normal.png")
    save_image(mr, "gold_mr.png")

# 5. Mat_Veer_Sash (1024x1024)
def make_sash_textures():
    size = (1024, 1024)
    # Royal Lapis Lazuli / Tapovan Celestial Azure Silk (#122B4A to #1A3B66)
    albedo = Image.new("RGBA", size, (18, 43, 74, 255))
    draw = ImageDraw.Draw(albedo)
    
    # Fine woven silk warp/weft striations
    for y in range(0, size[1], 4):
        tint = (y * 7) % 16 - 8
        draw.line([(0, y), (size[0], y)], fill=(18 + tint, 43 + tint, 74 + tint + 6, 255), width=2)
        
    # Rich Golden Zari borders along both edges of the sash (Y in [0, 90] and [size[1]-90, size[1]])
    zari_gold = (246, 186, 34, 255)
    zari_dark = (168, 108, 18, 255)
    border_w = 75
    draw.rectangle([0, 0, size[0], border_w], fill=zari_gold)
    draw.rectangle([0, size[1] - border_w, size[0], size[1]], fill=zari_gold)
    draw.line([(0, border_w), (size[0], border_w)], fill=zari_dark, width=4)
    draw.line([(0, size[1] - border_w), (size[0], size[1] - border_w)], fill=zari_dark, width=4)
    
    # Intricate geometric Zari embroidery diamonds along borders
    for x in range(0, size[0], 36):
        # Top border diamonds
        draw.polygon([(x, 15), (x + 18, 38), (x, 60), (x - 18, 38)], fill=(255, 235, 120, 255), outline=zari_dark)
        # Bottom border diamonds
        by = size[1] - border_w + 15
        draw.polygon([(x, by), (x + 18, by + 23), (x, by + 45), (x - 18, by + 23)], fill=(255, 235, 120, 255), outline=zari_dark)
        
    # Central radiant solar medallions (Surya-Padma) along the sash body
    emissive = Image.new("RGB", size, (0, 0, 0))
    edraw = ImageDraw.Draw(emissive)
    step_x = 128
    cy = size[1] // 2
    for x in range(step_x // 2, size[0], step_x):
        # Golden floral rosette
        draw.ellipse([x - 28, cy - 28, x + 28, cy + 28], fill=(245, 195, 45, 255), outline=(255, 240, 160, 255), width=3)
        draw.ellipse([x - 14, cy - 14, x + 14, cy + 14], fill=(215, 25, 30, 255)) # Ruby core
        # 8 radiant rays
        for a_deg in range(0, 360, 45):
            rad = math.radians(a_deg)
            x1 = x + int(math.cos(rad) * 44)
            y1 = cy + int(math.sin(rad) * 44)
            draw.line([(x, cy), (x1, y1)], fill=(255, 225, 75, 255), width=3)
            edraw.line([(x, cy), (x1, y1)], fill=(120, 200, 255), width=2)
        edraw.ellipse([x - 12, cy - 12, x + 12, cy + 12], fill=(255, 160, 30))
    
    # Normal map with woven silk ribbing
    normal = Image.new("RGB", size, (128, 128, 255))
    ndraw = ImageDraw.Draw(normal)
    ndraw.line([(0, border_w), (size[0], border_w)], fill=(155, 155, 245), width=4)
    ndraw.line([(0, size[1] - border_w), (size[0], size[1] - border_w)], fill=(100, 100, 245), width=4)
    normal = normal.filter(ImageFilter.GaussianBlur(radius=1.2))
    
    # MR: Silk Roughness ~ 0.45 (115), Metallic = 0.05 (13); Zari borders Roughness 0.22, Metallic 0.85
    mr_arr = np.zeros((size[1], size[0], 3), dtype=np.uint8)
    mr_arr[:, :, 0] = 255
    mr_arr[:, :, 1] = 115 # Silk roughness
    mr_arr[:, :, 2] = 13  # Low metallic
    # Zari gold borders
    mr_arr[:border_w, :, 1] = 56
    mr_arr[:border_w, :, 2] = 216
    mr_arr[size[1]-border_w:, :, 1] = 56
    mr_arr[size[1]-border_w:, :, 2] = 216
    mr = Image.fromarray(mr_arr)
    
    save_image(albedo, "sash_albedo.png")
    save_image(normal, "sash_normal.png")
    save_image(mr, "sash_mr.png")
    save_image(emissive, "sash_emissive.png")

# 6. Mat_Veer_Khadga (1024x1024)
def make_khadga_textures():
    size = (1024, 1024)
    # Damascus Sunsteel blade
    albedo = Image.new("RGBA", size, (218, 226, 236, 255))
    draw = ImageDraw.Draw(albedo)
    
    # Damascus steel waves
    for y in range(0, size[1], 10):
        for x in range(0, size[0], 4):
            wave = int(math.sin(x * 0.04 + y * 0.06) * 18)
            val = max(175, min(245, 215 + wave))
            draw.point((x, y), fill=(val, val + 4, val + 14, 255))
    
    # Golden Hilt and Guard
    draw.rectangle([0, size[1] - 256, size[0], size[1]], fill=(245, 182, 32, 255))
    # Ruby Pommel
    draw.ellipse([size[0]//2 - 60, size[1] - 80, size[0]//2 + 60, size[1] - 10], fill=(225, 22, 28, 255), outline=(255, 238, 145, 255), width=6)
    
    # Glowing Fuller Rune Channel
    emissive = Image.new("RGB", size, (0, 0, 0))
    edraw = ImageDraw.Draw(emissive)
    cx = size[0] // 2
    edraw.rectangle([cx - 16, 40, cx + 16, size[1] - 300], fill=(255, 175, 18))
    edraw.rectangle([cx - 8, 50, cx + 8, size[1] - 310], fill=(255, 242, 145))
    draw.rectangle([cx - 16, 40, cx + 16, size[1] - 300], fill=(255, 205, 75, 255))
    
    normal = Image.new("RGB", size, (128, 128, 255))
    mr = Image.new("RGB", size, (255, 42, 248))
    save_image(albedo, "khadga_albedo.png")
    save_image(normal, "khadga_normal.png")
    save_image(mr, "khadga_mr.png")
    save_image(emissive, "khadga_emissive.png")

# 7. Mat_Veer_Hair (1024x1024)
def make_hair_textures():
    size = (1024, 1024)
    # Deep obsidian black hair (#141416) with subtle dark brown tones
    albedo = Image.new("RGBA", size, (20, 20, 22, 255))
    draw = ImageDraw.Draw(albedo)
    for x in range(0, size[0], 2):
        strand_tone = int(18 + (math.sin(x * 0.12) * 10 + 10))
        draw.line([(x, 0), (x, size[1])], fill=(strand_tone, strand_tone - 2, strand_tone - 4, 255), width=2)
    cy = size[1] // 2
    for y in range(cy - 60, cy + 60):
        dist = abs(y - cy) / 60.0
        highlight = int((1.0 - dist) * 32)
        draw.line([(0, y), (size[0], y)], fill=(28 + highlight, 24 + highlight, 20 + highlight, 180), width=1)
    
    normal = Image.new("RGB", size, (128, 128, 255))
    # Roughness ~ 0.38 (97), Metallic = 0
    mr = Image.new("RGB", size, (255, 97, 0))
    save_image(albedo, "hair_albedo.png")
    save_image(normal, "hair_normal.png")
    save_image(mr, "hair_mr.png")

# 8. Mat_Veer_Eyes (512x512)
def make_eyes_textures():
    size = (512, 512)
    # Off-white warm sclera with subtle realistic edge shadow
    albedo = Image.new("RGBA", size, (240, 237, 232, 255))
    draw = ImageDraw.Draw(albedo)
    
    cx, cy = size[0] // 2, size[1] // 2
    # Deep limbal ring (#1A0E04)
    r_iris = 160
    draw.ellipse([cx - r_iris, cy - r_iris, cx + r_iris, cy + r_iris], fill=(42, 20, 8, 255), outline=(18, 8, 4, 255), width=10)
    
    # Outer dark amber ring
    r_outer = 150
    draw.ellipse([cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer], fill=(136, 68, 16, 255))
    
    # Radiant solar golden-amber iris body (#E89B16)
    r_mid = 125
    draw.ellipse([cx - r_mid, cy - r_mid, cx + r_mid, cy + r_mid], fill=(228, 152, 22, 255))
    
    # Radial solar striations (Surya Netra rays)
    for a_deg in range(0, 360, 6):
        rad = math.radians(a_deg)
        x0 = cx + math.cos(rad) * 65
        y0 = cy + math.sin(rad) * 65
        x1 = cx + math.cos(rad) * (145 + 5 * math.sin(rad * 8))
        y1 = cy + math.sin(rad) * (145 + 5 * math.sin(rad * 8))
        ray_c = (255, 205, 50, 255) if (a_deg % 12 == 0) else (185, 95, 15, 255)
        draw.line([(x0, y0), (x1, y1)], fill=ray_c, width=2)
        
    # Deep black pupil
    r_pupil = 62
    draw.ellipse([cx - r_pupil, cy - r_pupil, cx + r_pupil, cy + r_pupil], fill=(10, 8, 10, 255), outline=(35, 20, 10, 255), width=3)
    
    # Subtle corneal highlight glint
    draw.ellipse([cx - 40, cy - 40, cx - 18, cy - 18], fill=(255, 255, 255, 140))
    
    # Cornea normal map (spherical dome over iris)
    normal = Image.new("RGB", size, (128, 128, 255))
    narr = np.array(normal, dtype=np.float32)
    y_grid, x_grid = np.ogrid[:size[1], :size[0]]
    dist_sq = (x_grid - cx)**2 + (y_grid - cy)**2
    mask = dist_sq < (r_iris**2)
    dist = np.sqrt(np.maximum(dist_sq, 1e-6))
    nx = np.where(mask, 128.0 + (x_grid - cx) / r_iris * 55.0, 128.0)
    ny = np.where(mask, 128.0 + (y_grid - cy) / r_iris * 55.0, 128.0)
    narr[:, :, 0] = np.clip(nx, 0, 255)
    narr[:, :, 1] = np.clip(ny, 0, 255)
    normal = Image.fromarray(narr.astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=1.2))
    
    # High glossy finish: Roughness ~ 0.06 (15), Metallic = 0.0
    mr = Image.new("RGB", size, (255, 15, 0))
    save_image(albedo, "eyes_albedo.png")
    save_image(normal, "eyes_normal.png")
    save_image(mr, "eyes_mr.png")

# 9. Mat_Veer_Tilak (512x512)
def make_tilak_textures():
    size = (512, 512)
    # Sacred white sandalwood ash with sacred crimson Kumkum bindu
    albedo = Image.new("RGBA", size, (244, 240, 234, 255))
    draw = ImageDraw.Draw(albedo)
    
    # Sandalwood ash texture
    for y in range(0, size[1], 12):
        draw.line([(0, y), (size[0], y)], fill=(232, 226, 218, 255), width=3)
        
    # Crimson Kumkum bindu (center spot)
    cx, cy = size[0] // 2, size[1] // 2
    draw.ellipse([cx - 80, cy - 80, cx + 80, cy + 80], fill=(214, 24, 34, 255), outline=(160, 15, 22, 255), width=6)
    
    normal = Image.new("RGB", size, (128, 128, 255))
    mr = Image.new("RGB", size, (255, 175, 0)) # Sandalwood paste roughness 0.68
    save_image(albedo, "tilak_albedo.png")
    save_image(normal, "tilak_normal.png")
    save_image(mr, "tilak_mr.png")

if __name__ == "__main__":
    print("Regenerating refined Veer PBR textures...")
    make_skin_textures()
    make_dhoti_textures()
    make_armor_textures()
    make_gold_textures()
    make_sash_textures()
    make_khadga_textures()
    make_hair_textures()
    make_eyes_textures()
    make_tilak_textures()
    print("All 9 refined PBR texture sets ready!")
