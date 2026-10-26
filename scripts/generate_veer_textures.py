"""
Mythos 3D - Production PBR Texture Generator for Hero Veer (Solar Guardian)
Generates high-resolution PBR textures:
- Mat_Veer_Skin: Clean, radiant warm bronze skin tone with subsurface shading and pore variation
- Mat_Veer_Cuirass: Antique forged bronze with etched Surya flame motifs and bevel borders
- Mat_Veer_Gold: 24k polished gold for jewelry, buckles, rings, and medallions
- Mat_Veer_Dhoti: Rich Saffron orange silk with royal crimson trim and golden zari brocade embroidery
- Mat_Veer_Sash: Tapovan celestial azure silk with radiant solar runes and emissive bloom
- Mat_Veer_Khadga: Damascus sunsteel blade, golden hilt, glowing fuller rune channel
- Mat_Veer_Hair: Deep black warrior locks with anisotropic sheen and strand normal
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
    # Warm radiant Indian bronze skin tone (#B8703E / #C27D48)
    albedo = Image.new("RGBA", size, (190, 122, 74, 255))
    draw = ImageDraw.Draw(albedo)
    
    # Smooth vertical shading gradient for anatomical warmth
    for y in range(size[1]):
        t = y / size[1]
        r = int(185 + 16 * math.sin(t * math.pi))
        g = int(116 + 14 * math.sin(t * math.pi))
        b = int(68 + 10 * math.sin(t * math.pi))
        draw.line([(0, y), (size[0], y)], fill=(r, g, b, 255))
    
    # Subtle skin pore and dermal noise
    np.random.seed(42)
    noise = (np.random.rand(size[1], size[0]) - 0.5) * 8.0
    arr = np.array(albedo, dtype=np.float32)
    for c in range(3):
        arr[:, :, c] = np.clip(arr[:, :, c] + noise, 0, 255)
    albedo = Image.fromarray(arr.astype(np.uint8))
    
    # Normal map (smooth tangent space base)
    normal = Image.new("RGB", size, (128, 128, 255))
    # MR: Skin roughness ~ 0.52 (132), metallic = 0
    mr = Image.new("RGB", size, (255, 132, 0))
    
    save_image(albedo, "skin_albedo.png")
    save_image(normal, "skin_normal.png")
    save_image(mr, "skin_mr.png")

# 2. Mat_Veer_Dhoti (1024x1024)
def make_dhoti_textures():
    size = (1024, 1024)
    # Deep Saffron Orange Silk (#DE6818) with gold zari brocade and royal crimson trim
    albedo = Image.new("RGBA", size, (224, 106, 26, 255))
    draw = ImageDraw.Draw(albedo)
    
    # Fine pleated silk fabric shading (vertical stripes)
    n_pleats = 48
    pleat_w = size[0] / n_pleats
    for i in range(n_pleats):
        x0 = int(i * pleat_w)
        x1 = int((i + 1) * pleat_w)
        t = math.sin((i / n_pleats) * math.pi * 12)
        r = int(224 + t * 18)
        g = int(106 + t * 14)
        b = int(26 + t * 8)
        draw.rectangle([x0, 0, x1, size[1]], fill=(r, g, b, 255))
        
    # Royal Crimson silk border band at bottom (Zari hem)
    border_h = 180
    draw.rectangle([0, size[1] - border_h, size[0], size[1]], fill=(142, 24, 32, 255))
    
    # Golden zari brocade embroidery band (#F5B014)
    zari_y = size[1] - border_h + 25
    draw.rectangle([0, zari_y, size[0], zari_y + 30], fill=(248, 192, 36, 255))
    draw.rectangle([0, size[1] - 32, size[0], size[1] - 14], fill=(248, 192, 36, 255))
    
    # Diamond / Floral Zari motifs along border
    step = 42
    for x in range(0, size[0], step):
        cy = zari_y + 65
        draw.polygon([(x, cy - 20), (x + 20, cy), (x, cy + 20), (x - 20, cy)], fill=(255, 222, 70, 255), outline=(180, 110, 15, 255))
    
    normal = Image.new("RGB", size, (128, 128, 255))
    ndraw = ImageDraw.Draw(normal)
    for i in range(n_pleats):
        x = int(i * pleat_w)
        ndraw.line([(x, 0), (x, size[1])], fill=(155, 128, 245), width=2)
        ndraw.line([(x + int(pleat_w*0.5), 0), (x + int(pleat_w*0.5), size[1])], fill=(100, 128, 245), width=2)
    normal = normal.filter(ImageFilter.GaussianBlur(radius=1.5))
    
    mr = Image.new("RGB", size, (255, 165, 12))
    mr_draw = ImageDraw.Draw(mr)
    mr_draw.rectangle([0, size[1] - border_h, size[0], size[1]], fill=(255, 110, 180))
    
    save_image(albedo, "dhoti_albedo.png")
    save_image(normal, "dhoti_normal.png")
    save_image(mr, "dhoti_mr.png")

# 3. Mat_Veer_Cuirass / Armor (1024x1024)
def make_armor_textures():
    size = (1024, 1024)
    # Antique forged bronze (#9E6834) with engraved solar flames
    albedo = Image.new("RGBA", size, (158, 104, 52, 255))
    draw = ImageDraw.Draw(albedo)
    
    # Brushed metal lines
    for y in range(0, size[1], 4):
        tint = (y * 17) % 30 - 15
        r = max(0, min(255, 158 + tint))
        g = max(0, min(255, 104 + tint))
        b = max(0, min(255, 52 + tint))
        draw.line([(0, y), (size[0], y)], fill=(r, g, b, 255), width=2)
    
    # Beveled bronze border trims
    draw.rectangle([16, 16, size[0] - 16, size[1] - 16], outline=(215, 160, 75, 255), width=20)
    draw.rectangle([44, 44, size[0] - 44, size[1] - 44], outline=(100, 60, 25, 255), width=8)
    
    # Central radiant Surya disc & flames
    cx, cy = size[0] // 2, size[1] // 2
    draw.ellipse([cx - 140, cy - 140, cx + 140, cy + 140], fill=(185, 130, 65, 255), outline=(245, 195, 90, 255), width=10)
    for i in range(12):
        angle = (i / 12) * math.pi * 2
        p_tip = (cx + int(240 * math.cos(angle)), cy + int(240 * math.sin(angle)))
        p_left = (cx + int(150 * math.cos(angle - 0.15)), cy + int(150 * math.sin(angle - 0.15)))
        p_right = (cx + int(150 * math.cos(angle + 0.15)), cy + int(150 * math.sin(angle + 0.15)))
        draw.polygon([p_left, p_tip, p_right], fill=(235, 175, 75, 255), outline=(120, 70, 30, 255))
    
    normal = Image.new("RGB", size, (128, 128, 255))
    ndraw = ImageDraw.Draw(normal)
    ndraw.rectangle([16, 16, size[0] - 16, size[1] - 16], outline=(155, 155, 240), width=20)
    ndraw.ellipse([cx - 140, cy - 140, cx + 140, cy + 140], outline=(160, 160, 245), width=12)
    normal = normal.filter(ImageFilter.GaussianBlur(radius=2))
    
    mr = Image.new("RGB", size, (255, 89, 217))
    save_image(albedo, "armor_albedo.png")
    save_image(normal, "armor_normal.png")
    save_image(mr, "armor_mr.png")

# 4. Mat_Veer_Gold (1024x1024)
def make_gold_textures():
    size = (1024, 1024)
    # 24k Polished Gold (#F5BA24)
    albedo = Image.new("RGBA", size, (246, 188, 38, 255))
    draw = ImageDraw.Draw(albedo)
    
    cx, cy = size[0] // 2, size[1] // 2
    for r in range(400, 0, -8):
        factor = r / 400.0
        gold_val = int(255 - factor * 35)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(gold_val, int(gold_val*0.8), 25, 255), width=8)
    
    # Lotus petals engraving pattern
    n_petals = 16
    for i in range(n_petals):
        angle = (i / n_petals) * math.pi * 2
        px = cx + int(220 * math.cos(angle))
        py = cy + int(220 * math.sin(angle))
        draw.ellipse([px - 45, py - 45, px + 45, py + 45], outline=(255, 235, 120, 255), width=6)
    
    # Raised center jewel / ruby eye
    draw.ellipse([cx - 80, cy - 80, cx + 80, cy + 80], fill=(220, 35, 30, 255), outline=(255, 240, 160, 255), width=8)
    
    normal = Image.new("RGB", size, (128, 128, 255))
    ndraw = ImageDraw.Draw(normal)
    ndraw.ellipse([cx - 80, cy - 80, cx + 80, cy + 80], outline=(160, 160, 245), width=10)
    normal = normal.filter(ImageFilter.GaussianBlur(radius=2))
    
    mr = Image.new("RGB", size, (255, 51, 245))
    save_image(albedo, "gold_albedo.png")
    save_image(normal, "gold_normal.png")
    save_image(mr, "gold_mr.png")

# 5. Mat_Veer_Sash (1024x1024)
def make_sash_textures():
    size = (1024, 1024)
    # Tapovan Celestial Azure Silk (#1976D2) with golden runes
    albedo = Image.new("RGBA", size, (24, 118, 210, 255))
    draw = ImageDraw.Draw(albedo)
    
    for y in range(0, size[1], 8):
        draw.line([(0, y), (size[0], y)], fill=(32, 136, 238, 255), width=4)
    draw.rectangle([0, 0, size[0], 40], fill=(245, 195, 45, 255))
    draw.rectangle([0, size[1] - 40, size[0], size[1]], fill=(245, 195, 45, 255))
    
    emissive = Image.new("RGB", size, (0, 0, 0))
    edraw = ImageDraw.Draw(emissive)
    for x in range(80, size[0], 140):
        cy = size[1] // 2
        draw.ellipse([x - 28, cy - 28, x + 28, cy + 28], fill=(255, 220, 60, 255), outline=(255, 255, 200, 255), width=3)
        draw.line([(x - 40, cy), (x + 40, cy)], fill=(255, 240, 100, 255), width=4)
        draw.line([(x, cy - 40), (x, cy + 40)], fill=(255, 240, 100, 255), width=4)
        edraw.ellipse([x - 28, cy - 28, x + 28, cy + 28], fill=(120, 220, 255))
        edraw.line([(x - 40, cy), (x + 40, cy)], fill=(180, 240, 255), width=4)
        edraw.line([(x, cy - 40), (x, cy + 40)], fill=(180, 240, 255), width=4)
    
    normal = Image.new("RGB", size, (128, 128, 255))
    mr = Image.new("RGB", size, (255, 150, 10))
    save_image(albedo, "sash_albedo.png")
    save_image(normal, "sash_normal.png")
    save_image(mr, "sash_mr.png")
    save_image(emissive, "sash_emissive.png")

# 6. Mat_Veer_Khadga (1024x1024)
def make_khadga_textures():
    size = (1024, 1024)
    albedo = Image.new("RGBA", size, (220, 228, 238, 255))
    draw = ImageDraw.Draw(albedo)
    
    # Damascus steel waves
    for y in range(0, size[1], 12):
        for x in range(0, size[0], 4):
            wave = int(math.sin(x * 0.04 + y * 0.06) * 18)
            val = max(180, min(245, 215 + wave))
            draw.point((x, y), fill=(val, val + 5, val + 15, 255))
    
    draw.rectangle([0, size[1] - 256, size[0], size[1]], fill=(245, 185, 35, 255))
    draw.ellipse([size[0]//2 - 60, size[1] - 80, size[0]//2 + 60, size[1] - 10], fill=(225, 25, 30, 255), outline=(255, 240, 150, 255), width=6)
    
    emissive = Image.new("RGB", size, (0, 0, 0))
    edraw = ImageDraw.Draw(emissive)
    cx = size[0] // 2
    edraw.rectangle([cx - 16, 40, cx + 16, size[1] - 300], fill=(255, 180, 20))
    edraw.rectangle([cx - 8, 50, cx + 8, size[1] - 310], fill=(255, 245, 150))
    draw.rectangle([cx - 16, 40, cx + 16, size[1] - 300], fill=(255, 210, 80, 255))
    
    normal = Image.new("RGB", size, (128, 128, 255))
    mr = Image.new("RGB", size, (255, 46, 250))
    save_image(albedo, "khadga_albedo.png")
    save_image(normal, "khadga_normal.png")
    save_image(mr, "khadga_mr.png")
    save_image(emissive, "khadga_emissive.png")

# 7. Mat_Veer_Hair (1024x1024)
def make_hair_textures():
    size = (1024, 1024)
    albedo = Image.new("RGBA", size, (20, 20, 22, 255))
    draw = ImageDraw.Draw(albedo)
    for x in range(0, size[0], 2):
        strand_tone = int(18 + (math.sin(x * 0.12) * 12 + 12))
        draw.line([(x, 0), (x, size[1])], fill=(strand_tone, strand_tone - 2, strand_tone - 4, 255), width=2)
    cy = size[1] // 2
    for y in range(cy - 60, cy + 60):
        dist = abs(y - cy) / 60.0
        highlight = int((1.0 - dist) * 35)
        draw.line([(0, y), (size[0], y)], fill=(30 + highlight, 26 + highlight, 22 + highlight, 180), width=1)
    
    normal = Image.new("RGB", size, (128, 128, 255))
    mr = Image.new("RGB", size, (255, 107, 0))
    save_image(albedo, "hair_albedo.png")
    save_image(normal, "hair_normal.png")
    save_image(mr, "hair_mr.png")

if __name__ == "__main__":
    print("Regenerating refined Veer PBR textures...")
    make_skin_textures()
    make_dhoti_textures()
    make_armor_textures()
    make_gold_textures()
    make_sash_textures()
    make_khadga_textures()
    make_hair_textures()
    print("Refined PBR textures ready!")
