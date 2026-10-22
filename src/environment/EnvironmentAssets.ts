import { Camera } from '../render/Camera';
import { LODLevel, TimeOfDayPreset } from './EnvironmentTypes';
import { TIME_PRESETS } from './LightingEngine';

export class EnvironmentAssets {
  /**
   * Draws a monumental Vedic Torana ceremonial archway gate
   */
  public static drawToranaGate(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width = 240,
    height = 180,
    lod: LODLevel = LODLevel.LOD0_DETAILED
  ): void {
    ctx.save();
    ctx.translate(x, y);

    const halfW = width / 2;
    const colWidth = 24;

    // 1. Dual Columns / Pillars
    ctx.fillStyle = '#8D99AE';
    ctx.fillRect(-halfW, 0, colWidth, height);
    ctx.fillRect(halfW - colWidth, 0, colWidth, height);

    // Column base pedestals
    ctx.fillStyle = '#4A5568';
    ctx.fillRect(-halfW - 6, height - 16, colWidth + 12, 16);
    ctx.fillRect(halfW - colWidth - 6, height - 16, colWidth + 12, 16);

    // 2. Three-tiered curved horizontal architraves (beams)
    const beamY1 = 30;
    const beamY2 = 60;
    const beamY3 = 90;

    const drawBeam = (beamY: number, overhang: number, beamH: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(-halfW - overhang, beamY, width + overhang * 2, beamH, 6);
      ctx.fill();
      ctx.strokeStyle = '#2B2D42';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    drawBeam(beamY1, 24, 18, '#EDF2F4');
    drawBeam(beamY2, 16, 16, '#DFE6E9');
    drawBeam(beamY3, 8, 14, '#D3DCE6');

    if (lod === LODLevel.LOD0_DETAILED) {
      // Golden Sanskrit medallion / Dharma wheel at center top
      ctx.fillStyle = '#FFB703';
      ctx.beginPath();
      ctx.arc(0, beamY1 - 10, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FB8500';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Carved vertical brackets between beams
      ctx.fillStyle = '#A0AAB8';
      [-halfW * 0.45, 0, halfW * 0.45].forEach(bx => {
        ctx.fillRect(bx - 4, beamY1 + 18, 8, beamY2 - (beamY1 + 18));
        ctx.fillRect(bx - 4, beamY2 + 16, 8, beamY3 - (beamY2 + 16));
      });
    }

    ctx.restore();
  }

  /**
   * Draws a sprawling sacred Banyan tree with canopy sway
   */
  public static drawBanyanTree(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    canopyRadius = 140,
    swayPhase = 0,
    lod: LODLevel = LODLevel.LOD0_DETAILED
  ): void {
    ctx.save();
    ctx.translate(x, y);

    const sway = Math.sin(swayPhase) * 6;

    // 1. Sprawling thick wooden trunk and aerial drop-roots
    ctx.fillStyle = '#4A3525';
    ctx.beginPath();
    ctx.moveTo(-35, 0);
    ctx.lineTo(-50, 40);
    ctx.lineTo(50, 40);
    ctx.lineTo(35, 0);
    ctx.closePath();
    ctx.fill();

    // Drop roots flanking trunk
    ctx.strokeStyle = '#3E2A1E';
    ctx.lineWidth = 6;
    [-65, -45, 45, 65].forEach((rx, i) => {
      ctx.beginPath();
      ctx.moveTo(rx * 0.6, -canopyRadius * 0.4);
      ctx.quadraticCurveTo(rx + (i % 2 === 0 ? 8 : -8), 10, rx, 40);
      ctx.stroke();
    });

    // 2. Multi-lobed lush foliage canopy
    ctx.fillStyle = '#1B4332';
    // Back shadow lobe
    ctx.beginPath();
    ctx.arc(sway * 0.5, -canopyRadius * 0.65, canopyRadius * 0.95, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2D6A4F';
    // Main mid lobe
    ctx.beginPath();
    ctx.arc(-canopyRadius * 0.35 + sway, -canopyRadius * 0.7, canopyRadius * 0.65, 0, Math.PI * 2);
    ctx.arc(canopyRadius * 0.35 + sway, -canopyRadius * 0.7, canopyRadius * 0.65, 0, Math.PI * 2);
    ctx.arc(sway, -canopyRadius * 0.9, canopyRadius * 0.7, 0, Math.PI * 2);
    ctx.fill();

    if (lod === LODLevel.LOD0_DETAILED) {
      // Top sunlit leaf highlights
      ctx.fillStyle = '#52B788';
      ctx.beginPath();
      ctx.arc(-canopyRadius * 0.2 + sway, -canopyRadius * 0.95, canopyRadius * 0.45, 0, Math.PI * 2);
      ctx.arc(canopyRadius * 0.25 + sway, -canopyRadius * 0.85, canopyRadius * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Golden solar leaf rim
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sway, -canopyRadius * 0.9, canopyRadius * 0.72, -Math.PI * 0.8, -Math.PI * 0.2);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Draws a concentric stepped Vedic water reservoir (Kalyani)
   */
  public static drawKalyaniGhat(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width = 360,
    height = 240,
    time = 0,
    lod: LODLevel = LODLevel.LOD0_DETAILED
  ): void {
    ctx.save();
    ctx.translate(x, y);

    const stepCount = 5;
    const stepInsetX = (width * 0.28) / stepCount;
    const stepInsetY = (height * 0.28) / stepCount;

    // 1. Concentric stepped stone tiers
    for (let i = 0; i < stepCount; i++) {
      const insetX = i * stepInsetX;
      const insetY = i * stepInsetY;
      const w = width - insetX * 2;
      const h = height - insetY * 2;

      ctx.fillStyle = i % 2 === 0 ? '#4A5568' : '#718096';
      ctx.fillRect(-w / 2, -h / 2, w, h);

      ctx.strokeStyle = '#2D3748';
      ctx.lineWidth = 2;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
    }

    // 2. Central sacred turquoise water pool
    const waterW = width - stepCount * stepInsetX * 2;
    const waterH = height - stepCount * stepInsetY * 2;

    const waterGrad = ctx.createLinearGradient(0, -waterH / 2, 0, waterH / 2);
    waterGrad.addColorStop(0, '#0077B6');
    waterGrad.addColorStop(0.5, '#0096C7');
    waterGrad.addColorStop(1, '#023E8A');

    ctx.fillStyle = waterGrad;
    ctx.fillRect(-waterW / 2, -waterH / 2, waterW, waterH);

    // 3. Specular water ripples
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    for (let r = 0; r < 4; r++) {
      const rippleY = -waterH * 0.35 + r * (waterH * 0.24);
      const waveOffset = Math.sin(time * 3 + r * 1.5) * 8;
      ctx.beginPath();
      ctx.moveTo(-waterW * 0.4 + waveOffset, rippleY);
      ctx.quadraticCurveTo(0, rippleY + Math.cos(time * 2 + r) * 4, waterW * 0.4 + waveOffset, rippleY);
      ctx.stroke();
    }

    // 4. Floating sacred lotus pads
    if (lod !== LODLevel.LOD2_FAR) {
      const lotusPositions = [
        { lx: -waterW * 0.25, ly: -waterH * 0.2 },
        { lx: waterW * 0.2, ly: waterH * 0.15 },
        { lx: -waterW * 0.1, ly: waterH * 0.25 },
      ];
      for (const lotus of lotusPositions) {
        ctx.fillStyle = '#2D6A4F';
        ctx.beginPath();
        ctx.arc(lotus.lx, lotus.ly, 10, 0, Math.PI * 1.85);
        ctx.fill();

        // Pink blooming flower
        ctx.fillStyle = '#FF70A6';
        ctx.beginPath();
        ctx.arc(lotus.lx, lotus.ly, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /**
   * Draws a tiered Hindu Shikhara temple spire
   */
  public static drawShikharaTemple(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width = 280,
    _height = 340,
    _lod: LODLevel = LODLevel.LOD0_DETAILED
  ): void {
    ctx.save();
    ctx.translate(x, y);

    const halfW = width / 2;

    // 1. Plinth / Platform (Jagati)
    ctx.fillStyle = '#374151';
    ctx.fillRect(-halfW - 20, 0, width + 40, 30);
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 2;
    ctx.strokeRect(-halfW - 20, 0, width + 40, 30);

    // 2. Colonnaded Mandapa Base (Sanctuary entrance)
    ctx.fillStyle = '#4B5563';
    ctx.fillRect(-halfW, -90, width, 90);

    // Dark entrance doorway
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.roundRect(-25, -75, 50, 75, [15, 15, 0, 0]);
    ctx.fill();

    // 3. Curvilinear Shikhara Spire Tower
    const tiers = 6;
    const tierH = 32;
    for (let t = 0; t < tiers; t++) {
      const progress = t / tiers;
      const tierW = width * (1.0 - progress * 0.75);
      const tierY = -90 - (t + 1) * tierH;

      ctx.fillStyle = t % 2 === 0 ? '#9CA3AF' : '#D1D5DB';
      ctx.fillRect(-tierW / 2, tierY, tierW, tierH);

      ctx.strokeStyle = '#4B5563';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-tierW / 2, tierY, tierW, tierH);
    }

    // 4. Amalaka (Ribbed stone disc) and Golden Kalasha Finial
    const topY = -90 - tiers * tierH;

    // Amalaka
    ctx.fillStyle = '#E5E7EB';
    ctx.beginPath();
    ctx.ellipse(0, topY - 10, 28, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Kalasha (Gold pot with pointed finial)
    ctx.fillStyle = '#FFB703';
    ctx.beginPath();
    ctx.arc(0, topY - 26, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FB8500';
    ctx.beginPath();
    ctx.moveTo(-4, topY - 36);
    ctx.lineTo(0, topY - 54);
    ctx.lineTo(4, topY - 36);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draws a carved Ashoka prayer pillar
   */
  public static drawAshokaPillar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    height = 160,
    lod: LODLevel = LODLevel.LOD0_DETAILED
  ): void {
    ctx.save();
    ctx.translate(x, y);

    const radius = 10;

    // Base pedestal
    ctx.fillStyle = '#4B5563';
    ctx.fillRect(-radius - 8, 0, (radius + 8) * 2, 20);

    // Pillar shaft
    const shaftGrad = ctx.createLinearGradient(-radius, 0, radius, 0);
    shaftGrad.addColorStop(0, '#6B7280');
    shaftGrad.addColorStop(0.5, '#E5E7EB');
    shaftGrad.addColorStop(1, '#9CA3AF');

    ctx.fillStyle = shaftGrad;
    ctx.fillRect(-radius, -height, radius * 2, height);

    // Bell-lotus capital
    ctx.fillStyle = '#D1D5DB';
    ctx.beginPath();
    ctx.ellipse(0, -height - 8, radius * 1.6, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (lod === LODLevel.LOD0_DETAILED) {
      // Golden Dharma Chakra (wheel) atop capital
      ctx.fillStyle = '#FFB703';
      ctx.beginPath();
      ctx.arc(0, -height - 24, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FB8500';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Draws a brass ceremonial fire brazier
   */
  public static drawBrazier(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isLit = true,
    time = 0,
    _lod: LODLevel = LODLevel.LOD0_DETAILED
  ): void {
    ctx.save();
    ctx.translate(x, y);

    // Stand legs
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-16, 16);
    ctx.lineTo(-10, -6);
    ctx.lineTo(0, -6);
    ctx.lineTo(10, -6);
    ctx.lineTo(16, 16);
    ctx.stroke();

    // Brass bowl
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.ellipse(0, -6, 20, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (isLit) {
      // Burning embers inside bowl
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.ellipse(0, -7, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dancing flame tongues
      const flicker1 = Math.sin(time * 9) * 3;
      const flicker2 = Math.cos(time * 14) * 4;

      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(-10, -8);
      ctx.quadraticCurveTo(-5 + flicker1, -26, 0 + flicker2, -32);
      ctx.quadraticCurveTo(5 + flicker1, -26, 10, -8);
      ctx.closePath();
      ctx.fill();

      // Inner intense core
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.moveTo(-5, -8);
      ctx.quadraticCurveTo(0, -20, 0 + flicker1 * 0.5, -24);
      ctx.quadraticCurveTo(0, -20, 5, -8);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Draws a wooden suspension bridge spanning across a chasm
   */
  public static drawSuspensionBridge(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width = 220,
    height = 70,
    _lod: LODLevel = LODLevel.LOD0_DETAILED
  ): void {
    ctx.save();
    ctx.translate(x, y);

    const halfW = width / 2;
    const halfH = height / 2;

    // 1. Suspension Hemp Ropes
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 4;

    // Top railing ropes
    ctx.beginPath();
    ctx.moveTo(-halfW, -halfH);
    ctx.quadraticCurveTo(0, -halfH + 12, halfW, -halfH);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-halfW, halfH);
    ctx.quadraticCurveTo(0, halfH + 12, halfW, halfH);
    ctx.stroke();

    // 2. Individual Wooden Planks
    const plankCount = 20;
    const plankSpacing = width / plankCount;

    for (let i = 0; i <= plankCount; i++) {
      const px = -halfW + i * plankSpacing;
      // Slight sag downward in the middle
      const sag = Math.sin((i / plankCount) * Math.PI) * 10;
      const py = -halfH + sag;

      ctx.fillStyle = i % 2 === 0 ? '#78350F' : '#9A3412';
      ctx.fillRect(px - 3, py + 8, 6, height - 16);

      ctx.strokeStyle = '#451A03';
      ctx.lineWidth = 1;
      ctx.strokeRect(px - 3, py + 8, 6, height - 16);
    }

    ctx.restore();
  }

  /**
   * Draws a jagged volcanic chasm ravine with glowing magma
   */
  public static drawBasaltChasm(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width = 400,
    height = 90,
    time = 0,
    _lod: LODLevel = LODLevel.LOD0_DETAILED
  ): void {
    ctx.save();
    ctx.translate(x, y);

    const halfW = width / 2;
    const halfH = height / 2;

    // 1. Bottomless dark abyss background
    ctx.fillStyle = '#0F0B15';
    ctx.fillRect(-halfW, -halfH, width, height);

    // 2. Molten lava fissure channel in depth
    const pulse = Math.sin(time * 3) * 0.15 + 0.85;
    ctx.fillStyle = `rgba(255, 69, 0, ${pulse})`;
    ctx.fillRect(-halfW * 0.85, -6, width * 0.7, 12);

    ctx.fillStyle = `rgba(255, 215, 0, ${pulse * 0.9})`;
    ctx.fillRect(-halfW * 0.7, -3, width * 0.5, 6);

    // 3. Jagged basalt rock teeth on north & south rim
    ctx.fillStyle = '#1E1E24';
    const toothCount = 12;
    const toothW = width / toothCount;

    // North jagged edge
    ctx.beginPath();
    ctx.moveTo(-halfW, -halfH);
    for (let i = 0; i <= toothCount; i++) {
      const tx = -halfW + i * toothW;
      const ty = -halfH + ((i % 2 === 0) ? 14 : 4);
      ctx.lineTo(tx, ty);
    }
    ctx.lineTo(halfW, -halfH);
    ctx.closePath();
    ctx.fill();

    // South jagged edge
    ctx.beginPath();
    ctx.moveTo(-halfW, halfH);
    for (let i = 0; i <= toothCount; i++) {
      const tx = -halfW + i * toothW;
      const ty = halfH - ((i % 2 === 0) ? 14 : 4);
      ctx.lineTo(tx, ty);
    }
    ctx.lineTo(halfW, halfH);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draws an interactive rotating brass prayer wheel
   */
  public static drawPrayerWheel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle = 0,
    lod: LODLevel = LODLevel.LOD0_DETAILED
  ): void {
    ctx.save();
    ctx.translate(x, y);

    // Spindle axis
    ctx.fillStyle = '#4B5563';
    ctx.fillRect(-3, -26, 6, 52);

    // Rotating drum
    const drumWidth = 28 * Math.cos(angle);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(-Math.abs(drumWidth) / 2, -18, Math.abs(drumWidth), 36);

    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 2;
    ctx.strokeRect(-Math.abs(drumWidth) / 2, -18, Math.abs(drumWidth), 36);

    // Sacred Om glyph inscribed on surface
    if (Math.abs(drumWidth) > 16 && lod === LODLevel.LOD0_DETAILED) {
      ctx.fillStyle = '#78350F';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ॐ', 0, 4);
    }

    ctx.restore();
  }

  /**
   * Draws multi-layer parallax horizons (Mount Meru, sky citadels, clouds)
   */
  public static drawParallaxBackdrop(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    timeOfDay: TimeOfDayPreset,
    windTime = 0
  ): void {
    const ambient = TIME_PRESETS[timeOfDay];
    const vp = camera.getVisibleBounds();

    ctx.save();

    // 1. Celestial Sun or Moon
    const sunScreenX = vp.x + vp.width * 0.7 - camera.position.x * 0.02;
    const sunScreenY = vp.y + vp.height * 0.25 - camera.position.y * 0.02;

    const sunGlow = ctx.createRadialGradient(sunScreenX, sunScreenY, 0, sunScreenX, sunScreenY, 80);
    sunGlow.addColorStop(0, ambient.skyColor);
    sunGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunScreenX, sunScreenY, 80, 0, Math.PI * 2);
    ctx.fill();

    // 2. Far Mountain Horizon: Mount Meru (Parallax factor: 0.06)
    const p1 = 0.06;
    const meruBaseY = vp.y + vp.height * 0.55 - camera.position.y * p1;
    const meruOffsetX = -camera.position.x * p1;

    ctx.fillStyle = '#222938';
    ctx.beginPath();
    ctx.moveTo(vp.x - 100, vp.y + vp.height);
    for (let mx = vp.x - 100; mx <= vp.x + vp.width + 100; mx += 160) {
      const peakH = 140 + Math.sin((mx + meruOffsetX) * 0.005) * 80 + Math.cos((mx + meruOffsetX) * 0.012) * 50;
      ctx.lineTo(mx, meruBaseY - peakH);
    }
    ctx.lineTo(vp.x + vp.width + 100, vp.y + vp.height);
    ctx.closePath();
    ctx.fill();

    // Snow caps on Meru peaks
    ctx.fillStyle = '#E2E8F0';
    for (let mx = vp.x - 60; mx <= vp.x + vp.width + 60; mx += 320) {
      const peakH = 140 + Math.sin((mx + meruOffsetX) * 0.005) * 80 + Math.cos((mx + meruOffsetX) * 0.012) * 50;
      ctx.beginPath();
      ctx.moveTo(mx, meruBaseY - peakH);
      ctx.lineTo(mx - 35, meruBaseY - peakH + 35);
      ctx.lineTo(mx + 35, meruBaseY - peakH + 35);
      ctx.closePath();
      ctx.fill();
    }

    // 3. Mid-Distance Sky Citadels: Floating Vimanas (Parallax factor: 0.16)
    const p2 = 0.16;
    const citadelOffsetX = -camera.position.x * p2;
    const citadelBaseY = vp.y + vp.height * 0.45 - camera.position.y * p2;

    ctx.fillStyle = '#4A5568';
    for (let cx = vp.x + 80; cx < vp.x + vp.width; cx += 480) {
      const floatBob = Math.sin(windTime + cx * 0.01) * 8;
      const x = cx + (citadelOffsetX % 480);
      const y = citadelBaseY + floatBob;

      // Floating island rock base
      ctx.beginPath();
      ctx.moveTo(x - 50, y);
      ctx.lineTo(x, y + 40);
      ctx.lineTo(x + 50, y);
      ctx.closePath();
      ctx.fill();

      // Golden spire atop rock
      ctx.fillStyle = '#CBD5E1';
      ctx.beginPath();
      ctx.moveTo(x - 20, y);
      ctx.lineTo(x, y - 50);
      ctx.lineTo(x + 20, y);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}
