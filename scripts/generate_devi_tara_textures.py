"""
Mythos 3D - Production PBR Texture Generator for Devi Tara (Celestial Oracle of Tapas)
Generates high-resolution PBR textures:
1. Mat_Tara_Skin: Serene, radiant ethereal divine skin with delicate bindi and soft gold accents.
2. Mat_Tara_Silk: Ethereal celestial teal/cyan sari silk with intricate golden lotus zari borders.
3. Mat_Tara_Gold: 24k polished temple gold for Mukuta crown, waist belt (Kamarbandh), necklaces and bangles.
4. Mat_Tara_Aura: Radiant prana mandala halo with celestial glyphs and emissive glow.
5. Mat_Tara_Hair: Flowing midnight black tresses adorned with white jasmine blossoms.
"""

import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

TEXTURE_DIR = r"h:\mythologicalgame\godot\assets\textures\devi_tara"
os.makedirs(TEXTURE_DIR, exist_ok=True)

def save_image(img: Image.Image, filename: str):
    path = os.path.join(TEXTURE_DIR, filename)
    img.save(path, format="PNG")
    print(f"Saved: {path} ({img.size[0]}x{img.size[1]})")

# 1. Mat_Tara_Skin (1024x1024)
def make_skin_textures():
    size = (1024, 1024)
    # Divine glowing ivory-bronze complexion (#F5DBC2 / #E8C4A0)
    albedo = Image.new("RGBA", size, (238, 202, 172, 255))
    draw = ImageDraw.Draw(albedo)
    
    # Soft vertical warmth gradient
    for y in range(size[1]):
        t = y / size[1]
        r = int(235 + 15 * math.sin(t * math.pi))
        g = int(195 + 12 * math.sin(t * math.pi))
        b = int(165 + 10 * math.sin(t * math.pi))
        draw.line([(0, y), (size[0], y)], fill=(r, g, b, 255))
    
    # Subtle divine bindi and forehead tilaka pattern on top face region (UV coords y: [700, 950])
    draw.ellipse([500, 800, 524, 824], fill=(210, 25, 30, 255)) # Kumkum Red Bindi
    draw.ellipse([507, 807, 517, 817], fill=(255, 235, 120, 255)) # Gold center
    
    # Soft cheeks blush
    draw.ellipse([420, 840, 470, 870], fill=(245, 175, 160, 140))
    draw.ellipse([554, 840, 604, 870], fill=(245, 175, 160, 140))
    
    # Micro dermal texture
    np.random.seed(108)
    noise = (np.random.rand(size[1], size[0]) - 0.5) * 5.0
    arr = np.array(albedo, dtype=np.float32)
    for c in range(3):
        arr[:, :, c] = np.clip(arr[:, :, c] + noise, 0, 255)
    albedo = Image.fromarray(arr.astype(np.uint8))
    
    normal = Image.new("RGB", size, (128, 128, 255))
    # MR: Divine skin roughness ~ 0.45 (115), metallic = 0.05 (12)
    mr = Image.new("RGB", size, (255, 115, 12))
    # Subtle divine skin emission glow
    emission = Image.new("RGB", size, (35, 25, 20))
    
    save_image(albedo, "tara_skin_albedo.png")
    save_image(normal, "tara_skin_normal.png")
    save_image(mr, "tara_skin_mr.png")
    save_image(emission, "tara_skin_emission.png")

# 2. Mat_Tara_Silk (1024x1024)
def make_silk_textures():
    size = (1024, 1024)
    # Luminous peacock teal / celestial cyan (#148596 / #1EB8C8)
    albedo = Image.new("RGBA", size, (24, 145, 165, 255))
    draw = ImageDraw.Draw(albedo)
    
    # Silk weave subtle diagonals
    for x in range(0, size[0], 16):
        draw.line([(x, 0), (x + 256, size[1])], fill=(30, 165, 185, 255), width=2)
        draw.line([(x + 256, 0), (x, size[1])], fill=(20, 130, 150, 255), width=2)
    
    # Golden zari brocade border along bottom (y: 800 to 1024)
    draw.rectangle([0, 860, size[0], 1024], fill=(225, 185, 55, 255))
    draw.rectangle([0, 880, size[0], 900], fill=(255, 230, 120, 255))
    draw.rectangle([0, 980, size[0], 1000], fill=(255, 230, 120, 255))
    
    # Lotus petals motif along border
    for x in range(20, size[0], 64):
        draw.polygon([(x, 940), (x + 16, 910), (x + 32, 940), (x + 16, 960)], fill=(255, 245, 180, 255))
        draw.ellipse([x + 10, 928, x + 22, 944], fill=(210, 40, 50, 255))
    
    # Normal map for silk weave and embossed embroidery
    normal = Image.new("RGB", size, (128, 128, 255))
    norm_draw = ImageDraw.Draw(normal)
    norm_draw.rectangle([0, 860, size[0], 1024], fill=(128, 145, 250))
    
    # MR: Silk roughness ~ 0.32 (82), metallic = 0.22 (56) on silk; zari is roughness 0.2, metallic 0.9
    mr = Image.new("RGB", size, (255, 82, 56))
    mr_draw = ImageDraw.Draw(mr)
    mr_draw.rectangle([0, 860, size[0], 1024], fill=(255, 50, 230))
    
    # Emission on glowing lotus threads
    emission = Image.new("RGB", size, (12, 45, 55))
    em_draw = ImageDraw.Draw(emission)
    for x in range(20, size[0], 64):
        em_draw.ellipse([x + 8, 926, x + 24, 946], fill=(120, 25, 25))
    
    save_image(albedo, "tara_silk_albedo.png")
    save_image(normal, "tara_silk_normal.png")
    save_image(mr, "tara_silk_mr.png")
    save_image(emission, "tara_silk_emission.png")

# 3. Mat_Tara_Gold (1024x1024)
def make_gold_textures():
    size = (1024, 1024)
    # Royal Vedic temple gold (#F7D046)
    albedo = Image.new("RGBA", size, (247, 208, 70, 255))
    draw = ImageDraw.Draw(albedo)
    
    # Ornate relief carvings and jewel insets
    for y in range(0, size[1], 128):
        draw.line([(0, y), (size[0], y)], fill=(215, 165, 30, 255), width=8)
        draw.line([(0, y + 16), (size[0], y + 16)], fill=(255, 235, 140, 255), width=4)
        for x in range(32, size[0], 128):
            draw.ellipse([x - 16, y + 40, x + 16, y + 72], fill=(255, 245, 180, 255))
            draw.ellipse([x - 8, y + 48, x + 8, y + 64], fill=(30, 180, 190, 255)) # Turquoise cabochon gem
    
    normal = Image.new("RGB", size, (128, 128, 255))
    mr = Image.new("RGB", size, (255, 45, 240)) # Roughness 0.18, Metallic 0.94
    emission = Image.new("RGB", size, (60, 45, 10))
    
    save_image(albedo, "tara_gold_albedo.png")
    save_image(normal, "tara_gold_normal.png")
    save_image(mr, "tara_gold_mr.png")
    save_image(emission, "tara_gold_emission.png")

# 4. Mat_Tara_Aura (1024x1024)
def make_aura_textures():
    size = (1024, 1024)
    # Cyan-White radiant prana mandala
    albedo = Image.new("RGBA", size, (40, 210, 240, 220))
    draw = ImageDraw.Draw(albedo)
    
    center = (512, 512)
    # Concentric sacred geometric rings
    for r in [480, 420, 360, 300, 240, 180, 120]:
        draw.ellipse([center[0] - r, center[1] - r, center[0] + r, center[1] + r], outline=(240, 255, 255, 255), width=6)
    
    # 16-petal cosmic mandala rays
    for i in range(16):
        angle = i * (math.pi * 2 / 16)
        x2 = int(center[0] + math.cos(angle) * 490)
        y2 = int(center[1] + math.sin(angle) * 490)
        draw.line([center, (x2, y2)], fill=(255, 255, 255, 240), width=4)
        
        # Outer flame tip
        tip_x = int(center[0] + math.cos(angle) * 505)
        tip_y = int(center[1] + math.sin(angle) * 505)
        draw.ellipse([tip_x - 12, tip_y - 12, tip_x + 12, tip_y + 12], fill=(255, 240, 150, 255))
    
    normal = Image.new("RGB", size, (128, 128, 255))
    mr = Image.new("RGB", size, (255, 30, 20)) # Very glossy, dielectric
    emission = Image.new("RGB", size, (70, 215, 255))
    
    save_image(albedo, "tara_aura_albedo.png")
    save_image(normal, "tara_aura_normal.png")
    save_image(mr, "tara_aura_mr.png")
    save_image(emission, "tara_aura_emission.png")

# 5. Mat_Tara_Hair (1024x1024)
def make_hair_textures():
    size = (1024, 1024)
    # Deep raven hair with jasmine blossom accents
    albedo = Image.new("RGBA", size, (22, 20, 26, 255))
    draw = ImageDraw.Draw(albedo)
    
    for x in range(0, size[0], 8):
        draw.line([(x, 0), (x, size[1])], fill=(38, 36, 44, 255), width=2)
    
    # Jasmine flower garlands (gajra)
    for y in range(40, size[1], 120):
        for x in range(40, size[0], 80):
            draw.ellipse([x - 14, y - 14, x + 14, y + 14], fill=(255, 255, 250, 255))
            draw.ellipse([x - 4, y - 4, x + 4, y + 4], fill=(255, 220, 80, 255))
    
    normal = Image.new("RGB", size, (128, 128, 255))
    mr = Image.new("RGB", size, (255, 120, 10)) # Roughness 0.47
    
    save_image(albedo, "tara_hair_albedo.png")
    save_image(normal, "tara_hair_normal.png")
    save_image(mr, "tara_hair_mr.png")

if __name__ == "__main__":
    print("Generating Devi Tara PBR Textures...")
    make_skin_textures()
    make_silk_textures()
    make_gold_textures()
    make_aura_textures()
    make_hair_textures()
    print("All Devi Tara textures generated successfully!")
