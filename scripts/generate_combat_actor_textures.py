"""
Mythos 3D - Bhumi Combat Actors PBR Texture Pipeline
Generates authentic PBR textures for:
1. Asura Warrior (Charcoal obsidian demonic flesh, spiked dark bronze armor, glowing crimson rune blade)
2. General Kalanemi (Volcanic rock crust with molten magma fissures, forged dark iron plate, pulsating Tamas core, blazing heavy cleavers)
"""

import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

TEXTURE_DIR = r"h:\mythologicalgame\godot\assets\characters\enemies\textures"
os.makedirs(TEXTURE_DIR, exist_ok=True)

def generate_asura_textures():
    size = (1024, 1024)
    # 1. Asura Skin Albedo
    skin_alb = Image.new("RGBA", size, (28, 24, 30, 255))
    draw = ImageDraw.Draw(skin_alb)
    # Dark ash gradients
    for y in range(0, size[1], 8):
        v = int(24 + 10 * math.sin(y * 0.05))
        draw.line([(0, y), (size[0], y)], fill=(v, v-3, v+2, 255), width=4)
    # Glowing crimson demonic veins
    skin_em = Image.new("RGBA", size, (0, 0, 0, 255))
    edraw = ImageDraw.Draw(skin_em)
    for _ in range(40):
        x = np.random.randint(40, size[0] - 40)
        y = np.random.randint(40, size[1] - 40)
        length = np.random.randint(40, 160)
        angle = np.random.uniform(0, math.pi * 2)
        ex = int(x + math.cos(angle) * length)
        ey = int(y + math.sin(angle) * length)
        draw.line([(x, y), (ex, ey)], fill=(160, 20, 30, 220), width=4)
        draw.line([(x, y), (ex, ey)], fill=(255, 70, 50, 255), width=2)
        edraw.line([(x, y), (ex, ey)], fill=(255, 60, 40, 255), width=3)
        edraw.line([(x, y), (ex, ey)], fill=(255, 200, 120, 255), width=1)
    
    # Normal map with muscle striations
    skin_norm = Image.new("RGBA", size, (128, 128, 255, 255))
    ndraw = ImageDraw.Draw(skin_norm)
    for y in range(0, size[1], 24):
        ndraw.line([(0, y), (size[0], y)], fill=(128, 142, 240, 255), width=3)
    
    # Roughness (0.65) / Metallic (0.15) -> G=165, B=38
    skin_mr = Image.new("RGBA", size, (0, 165, 38, 255))

    skin_alb.save(os.path.join(TEXTURE_DIR, "asura_skin_albedo.png"))
    skin_norm.save(os.path.join(TEXTURE_DIR, "asura_skin_normal.png"))
    skin_mr.save(os.path.join(TEXTURE_DIR, "asura_skin_mr.png"))
    skin_em.save(os.path.join(TEXTURE_DIR, "asura_skin_emissive.png"))

    # 2. Asura Spiked Armor
    arm_alb = Image.new("RGBA", size, (52, 42, 38, 255))
    adraw = ImageDraw.Draw(arm_alb)
    for y in range(0, size[1], 32):
        adraw.line([(0, y), (size[0], y)], fill=(40, 32, 28, 255), width=4)
        adraw.line([(0, y+2), (size[0], y+2)], fill=(90, 72, 60, 255), width=1)
    arm_norm = Image.new("RGBA", size, (128, 128, 255, 255))
    an_draw = ImageDraw.Draw(arm_norm)
    for x in range(32, size[0], 64):
        for y in range(32, size[1], 64):
            an_draw.ellipse([x-6, y-6, x+6, y+6], fill=(145, 145, 255, 255))
    # Metallic 0.85, Roughness 0.45 -> G=115, B=217
    arm_mr = Image.new("RGBA", size, (0, 115, 217, 255))
    arm_alb.save(os.path.join(TEXTURE_DIR, "asura_armor_albedo.png"))
    arm_norm.save(os.path.join(TEXTURE_DIR, "asura_armor_normal.png"))
    arm_mr.save(os.path.join(TEXTURE_DIR, "asura_armor_mr.png"))

    # 3. Asura Weapon (Serrated Scythe / Scimitar)
    wep_alb = Image.new("RGBA", size, (30, 28, 34, 255))
    wdraw = ImageDraw.Draw(wep_alb)
    wdraw.rectangle([0, 0, 128, size[1]], fill=(140, 135, 145, 255))
    wdraw.rectangle([size[0]-128, 0, size[0], size[1]], fill=(140, 135, 145, 255))
    wep_em = Image.new("RGBA", size, (0, 0, 0, 255))
    wedraw = ImageDraw.Draw(wep_em)
    for y in range(80, size[1]-80, 100):
        wedraw.polygon([(512, y-30), (512+35, y+30), (512-35, y+30)], fill=(255, 30, 60, 255))
        wedraw.line([(512, y-40), (512, y+50)], fill=(255, 160, 60, 255), width=5)
    wep_norm = Image.new("RGBA", size, (128, 128, 255, 255))
    wep_mr = Image.new("RGBA", size, (0, 60, 230, 255)) # Metallic 0.90, Roughness 0.24
    wep_alb.save(os.path.join(TEXTURE_DIR, "asura_weapon_albedo.png"))
    wep_norm.save(os.path.join(TEXTURE_DIR, "asura_weapon_normal.png"))
    wep_mr.save(os.path.join(TEXTURE_DIR, "asura_weapon_mr.png"))
    wep_em.save(os.path.join(TEXTURE_DIR, "asura_weapon_emissive.png"))
    print("Asura Warrior textures generated successfully.")

def generate_kalanemi_textures():
    size = (1024, 1024)
    # 1. Kalanemi Volcanic Body Albedo & Emissive (Molten Tamas)
    body_alb = Image.new("RGBA", size, (20, 16, 18, 255))
    bdraw = ImageDraw.Draw(body_alb)
    body_em = Image.new("RGBA", size, (0, 0, 0, 255))
    edraw = ImageDraw.Draw(body_em)

    for _ in range(50):
        x = np.random.randint(0, size[0])
        y = np.random.randint(0, size[1])
        steps = np.random.randint(8, 20)
        curr_x, curr_y = x, y
        for _s in range(steps):
            nx = int(curr_x + np.random.randint(-40, 41))
            ny = int(curr_y + np.random.randint(-40, 41))
            nx = max(0, min(size[0]-1, nx))
            ny = max(0, min(size[1]-1, ny))
            bdraw.line([(curr_x, curr_y), (nx, ny)], fill=(255, 70, 20, 255), width=6)
            edraw.line([(curr_x, curr_y), (nx, ny)], fill=(255, 100, 30, 255), width=7)
            edraw.line([(curr_x, curr_y), (nx, ny)], fill=(255, 230, 90, 255), width=2)
            curr_x, curr_y = nx, ny

    body_norm = Image.new("RGBA", size, (128, 128, 255, 255))
    bndraw = ImageDraw.Draw(body_norm)
    for y in range(0, size[1], 16):
        bndraw.line([(0, y), (size[0], y)], fill=(128, 145, 245, 255), width=2)
    # Roughness 0.60, Metallic 0.40 -> G=153, B=102
    body_mr = Image.new("RGBA", size, (0, 153, 102, 255))

    body_alb.save(os.path.join(TEXTURE_DIR, "kalanemi_body_albedo.png"))
    body_norm.save(os.path.join(TEXTURE_DIR, "kalanemi_body_normal.png"))
    body_mr.save(os.path.join(TEXTURE_DIR, "kalanemi_body_mr.png"))
    body_em.save(os.path.join(TEXTURE_DIR, "kalanemi_body_emissive.png"))

    # 2. Kalanemi Heavy Warlord Armor (Dark Forged Iron with Brass Trim)
    arm_alb = Image.new("RGBA", size, (32, 30, 36, 255))
    adraw = ImageDraw.Draw(arm_alb)
    # Brass border
    adraw.rectangle([0, 0, size[0], 48], fill=(180, 135, 45, 255))
    adraw.rectangle([0, size[1]-48, size[0], size[1]], fill=(180, 135, 45, 255))
    for x in range(48, size[0], 64):
        adraw.ellipse([x-8, 16, x+8, 32], fill=(240, 200, 80, 255))
        adraw.ellipse([x-8, size[1]-32, x+8, size[1]-16], fill=(240, 200, 80, 255))
    arm_norm = Image.new("RGBA", size, (128, 128, 255, 255))
    arm_mr = Image.new("RGBA", size, (0, 90, 230, 255)) # Metallic 0.90, Roughness 0.35
    arm_alb.save(os.path.join(TEXTURE_DIR, "kalanemi_armor_albedo.png"))
    arm_norm.save(os.path.join(TEXTURE_DIR, "kalanemi_armor_normal.png"))
    arm_mr.save(os.path.join(TEXTURE_DIR, "kalanemi_armor_mr.png"))

    # 3. Kalanemi Core Light
    core_alb = Image.new("RGBA", size, (255, 60, 20, 255))
    cdraw = ImageDraw.Draw(core_alb)
    cdraw.ellipse([256, 256, 768, 768], fill=(255, 220, 100, 255))
    core_em = core_alb.copy()
    core_mr = Image.new("RGBA", size, (0, 30, 50, 255))
    core_norm = Image.new("RGBA", size, (128, 128, 255, 255))
    core_alb.save(os.path.join(TEXTURE_DIR, "kalanemi_core_albedo.png"))
    core_norm.save(os.path.join(TEXTURE_DIR, "kalanemi_core_normal.png"))
    core_mr.save(os.path.join(TEXTURE_DIR, "kalanemi_core_mr.png"))
    core_em.save(os.path.join(TEXTURE_DIR, "kalanemi_core_emissive.png"))

    # 4. Kalanemi Twin Heavy Void Cleavers
    cleave_alb = Image.new("RGBA", size, (22, 20, 26, 255))
    cldraw = ImageDraw.Draw(cleave_alb)
    # Beveled cutting blade edges
    cldraw.polygon([(0, 0), (256, 0), (128, size[1]), (0, size[1])], fill=(155, 145, 160, 255))
    cldraw.polygon([(size[0]-256, 0), (size[0], 0), (size[0], size[1]), (size[0]-128, size[1])], fill=(155, 145, 160, 255))
    cleave_em = Image.new("RGBA", size, (0, 0, 0, 255))
    cledraw = ImageDraw.Draw(cleave_em)
    for y in range(60, size[1]-60, 80):
        cledraw.polygon([(512, y-25), (512+40, y+25), (512-40, y+25)], fill=(255, 40, 20, 255))
        cledraw.line([(512, y-35), (512, y+45)], fill=(255, 180, 50, 255), width=6)
    cleave_norm = Image.new("RGBA", size, (128, 128, 255, 255))
    cleave_mr = Image.new("RGBA", size, (0, 70, 240, 255)) # Metallic 0.94, Roughness 0.28
    cleave_alb.save(os.path.join(TEXTURE_DIR, "kalanemi_cleaver_albedo.png"))
    cleave_norm.save(os.path.join(TEXTURE_DIR, "kalanemi_cleaver_normal.png"))
    cleave_mr.save(os.path.join(TEXTURE_DIR, "kalanemi_cleaver_mr.png"))
    cleave_em.save(os.path.join(TEXTURE_DIR, "kalanemi_cleaver_emissive.png"))
    print("General Kalanemi textures generated successfully.")

if __name__ == "__main__":
    generate_asura_textures()
    generate_kalanemi_textures()
    print("All Bhumi combat actor textures complete!")
