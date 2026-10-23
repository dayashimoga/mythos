import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// --- PNG ENCODER ---
function createCrcTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCrcTable();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  typeBuf.copy(chunk, 4);
  data.copy(chunk, 8);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

export function encodePNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdr);

  const rowStride = width * 4;
  const rawData = Buffer.alloc(height * (1 + rowStride));
  for (let y = 0; y < height; y++) {
    const rawPos = y * (1 + rowStride);
    rawData[rawPos] = 0; // Filter None
    rgbaBuffer.copy(rawData, rawPos + 1, y * rowStride, (y + 1) * rowStride);
  }

  const compressed = zlib.deflateSync(rawData, { level: 8 });
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// --- PIXEL BUFFER CANVAS EMULATION ---
class PixelCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.buffer = Buffer.alloc(width * height * 4);
  }

  setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (y * this.width + x) * 4;
    if (a >= 255) {
      this.buffer[idx] = r;
      this.buffer[idx + 1] = g;
      this.buffer[idx + 2] = b;
      this.buffer[idx + 3] = 255;
    } else {
      const alpha = a / 255;
      const invAlpha = 1 - alpha;
      this.buffer[idx] = Math.round(r * alpha + this.buffer[idx] * invAlpha);
      this.buffer[idx + 1] = Math.round(g * alpha + this.buffer[idx + 1] * invAlpha);
      this.buffer[idx + 2] = Math.round(b * alpha + this.buffer[idx + 2] * invAlpha);
      this.buffer[idx + 3] = Math.min(255, Math.round(a + this.buffer[idx + 3] * invAlpha));
    }
  }

  fillRect(rx, ry, rw, rh, r, g, b, a = 255) {
    const x0 = Math.max(0, rx);
    const y0 = Math.max(0, ry);
    const x1 = Math.min(this.width, rx + rw);
    const y1 = Math.min(this.height, ry + rh);
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        this.setPixel(x, y, r, g, b, a);
      }
    }
  }

  fillCircle(cx, cy, radius, r, g, b, a = 255) {
    const x0 = Math.max(0, Math.floor(cx - radius));
    const y0 = Math.max(0, Math.floor(cy - radius));
    const x1 = Math.min(this.width, Math.ceil(cx + radius));
    const y1 = Math.min(this.height, Math.ceil(cy + radius));
    const r2 = radius * radius;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 <= r2) {
          const edge = Math.max(0, Math.min(1, (r2 - d2) / (radius * 1.5)));
          this.setPixel(x, y, r, g, b, Math.round(a * edge));
        }
      }
    }
  }

  drawRadialGlow(cx, cy, radius, r, g, b, maxAlpha = 255) {
    const x0 = Math.max(0, Math.floor(cx - radius));
    const y0 = Math.max(0, Math.floor(cy - radius));
    const x1 = Math.min(this.width, Math.ceil(cx + radius));
    const y1 = Math.min(this.height, Math.ceil(cy + radius));
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) {
          const falloff = 1 - dist / radius;
          const a = Math.round(maxAlpha * falloff * falloff);
          this.setPixel(x, y, r, g, b, a);
        }
      }
    }
  }

  toPNG() {
    return encodePNG(this.width, this.height, this.buffer);
  }
}

// Pseudo-random noise helper
function pseudoNoise(x, y, seed = 1337) {
  let n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

// Smooth noise
function smoothNoise(x, y, scale = 32, seed = 1337) {
  const sx = x / scale;
  const sy = y / scale;
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const fx = sx - x0;
  const fy = sy - y0;
  const wx = fx * fx * (3 - 2 * fx);
  const wy = fy * fy * (3 - 2 * fy);

  const v00 = pseudoNoise(x0, y0, seed);
  const v10 = pseudoNoise(x0 + 1, y0, seed);
  const v01 = pseudoNoise(x0, y0 + 1, seed);
  const v11 = pseudoNoise(x0 + 1, y0 + 1, seed);

  const top = v00 * (1 - wx) + v10 * wx;
  const bottom = v01 * (1 - wx) + v11 * wx;
  return top * (1 - wy) + bottom * wy;
}

// --- 1. BHUMI TEMPLE FLOOR (1024x1024) ---
export function generateBhumiTempleFloor() {
  const canvas = new PixelCanvas(1024, 1024);
  const cx = 512, cy = 512;

  // Base basalt stone color with grain
  for (let y = 0; y < 1024; y++) {
    for (let x = 0; x < 1024; x++) {
      const n1 = smoothNoise(x, y, 24, 42);
      const n2 = smoothNoise(x, y, 6, 88);
      const stoneTone = Math.round(18 + n1 * 14 + n2 * 8); // Dark volcanic charcoal
      canvas.setPixel(x, y, stoneTone + 2, stoneTone + 3, stoneTone + 6, 255);
    }
  }

  // 128x128 chiseled tile grid with beveled mortar seams
  const tileSize = 128;
  for (let y = 0; y < 1024; y++) {
    for (let x = 0; x < 1024; x++) {
      const tx = x % tileSize;
      const ty = y % tileSize;
      const isEdge = (tx <= 3 || tx >= tileSize - 4 || ty <= 3 || ty >= tileSize - 4);
      if (isEdge) {
        // Deep carved joint
        canvas.setPixel(x, y, 10, 12, 16, 255);
      } else if (tx === 4 || ty === 4) {
        // Bevel highlight
        canvas.setPixel(x, y, 45, 50, 60, 180);
      } else if (tx === tileSize - 5 || ty === tileSize - 5) {
        // Bevel shadow
        canvas.setPixel(x, y, 12, 14, 18, 200);
      }
    }
  }

  // Glowing Magma Fissures in certain stone joints
  for (let y = 0; y < 1024; y++) {
    for (let x = 0; x < 1024; x++) {
      const nMagma = smoothNoise(x, y, 64, 999);
      if (nMagma > 0.68) {
        const tx = x % tileSize;
        const ty = y % tileSize;
        if (tx <= 4 || ty <= 4) {
          const intensity = (nMagma - 0.68) / 0.32;
          canvas.setPixel(x, y, 255, Math.round(140 * intensity + 60), 20, 240);
        }
      }
    }
  }

  // Grand Concentric Hoysala Surya Mandala at Center
  const maxR = 380;
  for (let y = 0; y < 1024; y++) {
    for (let x = 0; x < 1024; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      if (dist <= maxR) {
        // Outer decorative ring
        if (dist >= 350 && dist <= 365) {
          canvas.setPixel(x, y, 255, 183, 3, 220); // Golden inlay
        } else if (dist >= 320 && dist <= 335) {
          canvas.setPixel(x, y, 218, 165, 32, 200);
        } else if (dist >= 240 && dist <= 250) {
          canvas.setPixel(x, y, 255, 200, 50, 240);
        } else if (dist >= 140 && dist <= 148) {
          canvas.setPixel(x, y, 251, 133, 0, 230);
        } else if (dist <= 60) {
          // Inner Sun core
          const coreGlow = (60 - dist) / 60;
          canvas.setPixel(x, y, 255, Math.round(200 + coreGlow * 55), Math.round(50 + coreGlow * 100), 255);
        }

        // 16-Ray Sun Spokes
        const spokeAngle = (angle + Math.PI) / (Math.PI * 2) * 16;
        const spokeFrac = Math.abs((spokeAngle % 1) - 0.5);
        if (spokeFrac < 0.08 && dist > 70 && dist < 320) {
          canvas.setPixel(x, y, 255, 175, 20, 220);
        }

        // 8-Fold Lotus Petals between 150 and 240
        const petalAngle = (angle + Math.PI) / (Math.PI * 2) * 8;
        const petalFrac = Math.sin((petalAngle % 1) * Math.PI);
        const petalR = 150 + petalFrac * 80;
        if (Math.abs(dist - petalR) < 4) {
          canvas.setPixel(x, y, 255, 215, 0, 240);
        }
      }
    }
  }

  // Outer Decorative Temple Border
  for (let y = 0; y < 1024; y++) {
    for (let x = 0; x < 1024; x++) {
      const nearBorder = (x < 36 || x > 1024 - 36 || y < 36 || y > 1024 - 36);
      const innerBorder = (x >= 36 && x <= 48) || (x >= 1024 - 48 && x <= 1024 - 36) ||
                          (y >= 36 && y <= 48) || (y >= 1024 - 48 && y <= 1024 - 36);
      if (innerBorder) {
        canvas.setPixel(x, y, 255, 183, 3, 240); // Gold border trim
      } else if (nearBorder) {
        canvas.setPixel(x, y, 14, 16, 22, 255); // Dark granite perimeter
      }
    }
  }

  return canvas.toPNG();
}

// --- 2. BHUMI LAVA CRUST (1024x1024) ---
export function generateBhumiLavaCrust() {
  const canvas = new PixelCanvas(1024, 1024);

  for (let y = 0; y < 1024; y++) {
    for (let x = 0; x < 1024; x++) {
      // Multi-octave molten flow turbulence
      const n1 = smoothNoise(x, y, 90, 77);
      const n2 = smoothNoise(x * 2, y * 2, 45, 123);
      const n3 = smoothNoise(x * 4, y * 4, 18, 456);
      const heat = n1 * 0.6 + n2 * 0.3 + n3 * 0.1;

      // Base: Incandescent core vs cooling dark crust
      if (heat > 0.62) {
        // Bright molten magma core
        const hNorm = (heat - 0.62) / 0.38;
        const r = 255;
        const g = Math.min(255, Math.round(120 + hNorm * 135));
        const b = Math.min(255, Math.round(15 + hNorm * 120));
        canvas.setPixel(x, y, r, g, b, 255);
      } else if (heat > 0.44) {
        // Deep vermillion / crimson molten edge
        const hNorm = (heat - 0.44) / 0.18;
        const r = Math.round(180 + hNorm * 75);
        const g = Math.round(20 + hNorm * 90);
        const b = 10;
        canvas.setPixel(x, y, r, g, b, 255);
      } else {
        // Hardened volcanic basalt crust plate
        const cNorm = heat / 0.44;
        const r = Math.round(25 + cNorm * 30);
        const g = Math.round(20 + cNorm * 15);
        const b = Math.round(25 + cNorm * 15);
        canvas.setPixel(x, y, r, g, b, 255);
      }
    }
  }

  // Add glowing volcanic thermal fracture cracks across crust
  for (let y = 0; y < 1024; y++) {
    for (let x = 0; x < 1024; x++) {
      const crack = Math.abs(smoothNoise(x, y, 40, 555) - 0.5) * 2;
      const crack2 = Math.abs(smoothNoise(x, y, 20, 888) - 0.5) * 2;
      if (crack < 0.06 && crack2 < 0.4) {
        canvas.setPixel(x, y, 255, 200, 40, 230);
      }
    }
  }

  return canvas.toPNG();
}

// --- 3. BHUMI VOLCANIC BACKDROP (1792x1024) ---
export function generateBhumiVolcanicBackdrop() {
  const canvas = new PixelCanvas(1792, 1024);

  // Gradient: Deep dark cavern vault top -> fiery subterranean basin bottom
  for (let y = 0; y < 1024; y++) {
    const yRatio = y / 1024;
    for (let x = 0; x < 1792; x++) {
      const nx = smoothNoise(x, y, 64, 111);
      const smoke = smoothNoise(x * 1.5, y * 0.8, 120, 222);

      let r, g, b;
      if (yRatio < 0.35) {
        // Cavern roof: obsidian rock & stalactites
        r = Math.round(10 + smoke * 12);
        g = Math.round(12 + smoke * 10);
        b = Math.round(18 + smoke * 16);
      } else if (yRatio < 0.70) {
        // Mid-cavern: ambient crimson haze & volcanic smoke
        const m = (yRatio - 0.35) / 0.35;
        r = Math.round(25 + m * 80 + smoke * 30);
        g = Math.round(14 + m * 20 + smoke * 15);
        b = Math.round(20 + m * 15);
      } else {
        // Lower cavern: radiant lava basin & incandescent reflection
        const bNorm = (yRatio - 0.70) / 0.30;
        r = Math.round(120 + bNorm * 135 + nx * 30);
        g = Math.round(30 + bNorm * 110 + nx * 20);
        b = Math.round(15 + bNorm * 25);
      }

      canvas.setPixel(x, y, r, g, b, 255);
    }
  }

  // 3 Distant Cascading Lava Waterfalls
  const lavaFalls = [450, 920, 1400];
  for (const fallX of lavaFalls) {
    for (let y = 200; y < 900; y++) {
      const sway = Math.sin(y * 0.05) * 8;
      const width = 16 + (y - 200) * 0.03;
      for (let x = Math.floor(fallX + sway - width); x <= Math.ceil(fallX + sway + width); x++) {
        const d = Math.abs(x - (fallX + sway)) / width;
        if (d <= 1) {
          const core = 1 - d;
          canvas.setPixel(x, y, 255, Math.round(140 + core * 115), Math.round(20 + core * 80), Math.round(240 * core));
        }
      }
    }
  }

  // Cavern Stalactites hanging from top
  for (let x = 0; x < 1792; x++) {
    const stalLen = Math.abs(Math.sin(x * 0.03) * 120 + Math.sin(x * 0.008) * 80);
    for (let y = 0; y < Math.floor(stalLen); y++) {
      canvas.setPixel(x, y, 8, 10, 14, 255);
    }
  }

  return canvas.toPNG();
}

// --- 4. BHUMI CLIFF WALL (1024x1024) ---
export function generateBhumiCliffWall() {
  const canvas = new PixelCanvas(1024, 1024);

  // Basalt rock-cut masonry with strata
  for (let y = 0; y < 1024; y++) {
    for (let x = 0; x < 1024; x++) {
      const strata = Math.sin(y * 0.1) * 8 + smoothNoise(x, y, 16, 333) * 12;
      const rockTone = Math.round(22 + strata);
      canvas.setPixel(x, y, rockTone + 2, rockTone + 3, rockTone + 6, 255);
    }
  }

  // 4 Tiered Relief Carving Bands
  const bands = [160, 380, 620, 860];
  for (const by of bands) {
    canvas.fillRect(0, by - 20, 1024, 40, 14, 16, 22, 255);
    canvas.fillRect(0, by - 4, 1024, 8, 255, 183, 3, 200); // Gold inlay frieze
  }

  // Twin Flaming Wall Sconces at (280, 500) and (744, 500)
  canvas.drawRadialGlow(280, 500, 180, 255, 120, 20, 180);
  canvas.drawRadialGlow(744, 500, 180, 255, 120, 20, 180);

  // Carved bronze sconce bowl
  canvas.fillRect(256, 490, 48, 24, 200, 130, 20, 255);
  canvas.fillRect(720, 490, 48, 24, 200, 130, 20, 255);

  return canvas.toPNG();
}

// --- 5. BHUMI STONE BRIDGE (1024x512) ---
export function generateBhumiStoneBridge() {
  const canvas = new PixelCanvas(1024, 512);

  // Base background transparent
  canvas.fillRect(0, 0, 1024, 512, 0, 0, 0, 0);

  // Main Carved Stone Deck (Y: 160 to 352)
  for (let y = 160; y < 352; y++) {
    for (let x = 64; x < 960; x++) {
      const n = smoothNoise(x, y, 16, 444);
      const tone = Math.round(45 + n * 18);
      canvas.setPixel(x, y, tone + 4, tone + 5, tone + 8, 255);
    }
  }

  // Large interlocking flagstone joints on deck
  for (let x = 64; x < 960; x += 64) {
    canvas.fillRect(x - 2, 160, 4, 192, 18, 20, 26, 255);
  }

  // Top & Bottom Balustrades with carved lotus pillars
  canvas.fillRect(64, 140, 896, 22, 80, 85, 95, 255);
  canvas.fillRect(64, 350, 896, 22, 80, 85, 95, 255);
  for (let x = 80; x < 960; x += 48) {
    canvas.fillCircle(x, 140, 10, 255, 183, 3, 240); // Lotus finials
    canvas.fillCircle(x, 372, 10, 255, 183, 3, 240);
  }

  // Glowing Heat Reflection on Underside
  for (let y = 372; y < 450; y++) {
    const fade = (450 - y) / 78;
    for (let x = 64; x < 960; x++) {
      canvas.setPixel(x, y, 255, 100, 20, Math.round(160 * fade * fade));
    }
  }

  return canvas.toPNG();
}

// --- 6. BHUMI SHRINE PAVILION (1024x1024) ---
export function generateBhumiShrinePavilion() {
  const canvas = new PixelCanvas(1024, 1024);

  // Stepped Plinth Foundation (Y: 780 to 940)
  canvas.fillRect(160, 880, 704, 60, 35, 40, 50, 255);
  canvas.fillRect(200, 820, 624, 60, 48, 54, 66, 255);
  canvas.fillRect(240, 780, 544, 40, 60, 68, 80, 255);

  // 4 Chiseled Granite Columns (Y: 380 to 780)
  const colX = [260, 420, 604, 764];
  for (const cx of colX) {
    canvas.fillRect(cx - 20, 380, 40, 400, 75, 82, 95, 255);
    // Gold carved capitals
    canvas.fillRect(cx - 28, 380, 56, 24, 255, 183, 3, 255);
    canvas.fillRect(cx - 28, 756, 56, 24, 255, 183, 3, 255);
  }

  // Tiered Curvilinear Shikhara Roof (Y: 100 to 380)
  for (let y = 140; y < 380; y++) {
    const progress = (y - 140) / 240;
    const halfWidth = 60 + Math.pow(progress, 1.4) * 340;
    const x0 = Math.round(512 - halfWidth);
    const x1 = Math.round(512 + halfWidth);
    for (let x = x0; x <= x1; x++) {
      canvas.setPixel(x, y, 50, 56, 68, 255);
    }
  }

  // Golden Amalaka & Kalasha Finial at Pinnacle (Y: 60 to 140)
  canvas.fillCircle(512, 120, 36, 255, 183, 3, 255);
  canvas.fillRect(504, 60, 16, 60, 255, 215, 0, 255);
  canvas.fillCircle(512, 56, 12, 255, 235, 100, 255);

  // Central Sacred Flame Basin Glow inside pavilion
  canvas.drawRadialGlow(512, 700, 160, 255, 140, 20, 220);
  canvas.fillRect(472, 730, 80, 40, 180, 110, 20, 255);

  return canvas.toPNG();
}

// --- MAIN RUNNER ---
function main() {
  console.log('[Environment Asset Pipeline] Generating 6 authentic high-resolution environment assets...');
  const outDir = path.resolve('public/assets/art');
  fs.mkdirSync(outDir, { recursive: true });

  const tasks = [
    { name: 'bhumi_temple_floor.png', fn: generateBhumiTempleFloor },
    { name: 'bhumi_lava_crust.png', fn: generateBhumiLavaCrust },
    { name: 'bhumi_volcanic_backdrop.png', fn: generateBhumiVolcanicBackdrop },
    { name: 'bhumi_cliff_wall.png', fn: generateBhumiCliffWall },
    { name: 'bhumi_bridge_stone.png', fn: generateBhumiStoneBridge },
    { name: 'bhumi_shrine_pavilion.png', fn: generateBhumiShrinePavilion },
  ];

  for (const t of tasks) {
    const tStart = Date.now();
    const pngBuf = t.fn();
    const dest = path.join(outDir, t.name);
    fs.writeFileSync(dest, pngBuf);
    console.log(`  ✓ Generated ${t.name} (${Math.round(pngBuf.length / 1024)} KB) in ${Date.now() - tStart}ms`);
  }

  console.log('[Environment Asset Pipeline] All 6 environment assets generated successfully in public/assets/art/');
}

main();
