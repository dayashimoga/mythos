import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from './CanvasRenderer';
import { AccessibilityManager } from '../ui/accessibility/AccessibilityManager';

export interface ShockwaveRing {
  id: number;
  center: Vector2D;
  currentRadius: number;
  maxRadius: number;
  speed: number;
  color: string;
  accentColor: string;
  alpha: number;
  lineWidth: number;
}

export interface SanskritRuneParticle {
  id: number;
  glyph: string;
  position: Vector2D;
  velocity: Vector2D;
  phase: number;
  scale: number;
  alpha: number;
  lifespan: number;
  maxLifespan: number;
  color: string;
}

export interface SlashTrailPoint {
  position: Vector2D;
  alpha: number;
  width: number;
}

export interface SlashTrail {
  id: number;
  points: SlashTrailPoint[];
  color: string;
  accentColor: string;
  lifespan: number;
  maxLifespan: number;
}

export interface ImpactDebris {
  id: number;
  position: Vector2D;
  velocity: Vector2D;
  size: number;
  alpha: number;
  lifespan: number;
  color: string;
}

export class CelestialVFX {
  private static instance: CelestialVFX | null = null;

  private nextId = 1;
  private shockwaves: ShockwaveRing[] = [];
  private runes: SanskritRuneParticle[] = [];
  private trails: SlashTrail[] = [];
  private debris: ImpactDebris[] = [];

  // Radial screen-space distortion pulse
  private radialDistortion: { center: Vector2D; radius: number; intensity: number; maxIntensity: number } | null = null;

  public static SANSKRIT_GLYPHS = ['ॐ', 'क्रीं', 'ह्रीं', 'श्रीं', 'स्वाहा', 'नमः'];

  public static getInstance(): CelestialVFX {
    if (!CelestialVFX.instance) {
      CelestialVFX.instance = new CelestialVFX();
    }
    return CelestialVFX.instance;
  }

  public clear(): void {
    this.shockwaves = [];
    this.runes = [];
    this.trails = [];
    this.debris = [];
    this.radialDistortion = null;
  }

  public emitShockwave(
    center: Vector2D,
    maxRadius = 240,
    color = '#FFB703',
    accentColor = '#00E5FF',
    speed = 480
  ): void {
    const isReduced = AccessibilityManager.getInstance().isReducedMotion();
    const effectiveRadius = isReduced ? maxRadius * 0.6 : maxRadius;

    this.shockwaves.push({
      id: this.nextId++,
      center: center.clone(),
      currentRadius: 10,
      maxRadius: effectiveRadius,
      speed,
      color,
      accentColor,
      alpha: 1.0,
      lineWidth: 4,
    });
  }

  public emitSanskritRunes(center: Vector2D, count = 5, color = '#FFD166'): void {
    const isReduced = AccessibilityManager.getInstance().isReducedMotion();
    const spawnCount = isReduced ? Math.min(3, count) : count;

    for (let i = 0; i < spawnCount; i++) {
      const glyph = CelestialVFX.SANSKRIT_GLYPHS[Math.floor(Math.random() * CelestialVFX.SANSKRIT_GLYPHS.length)];
      const angle = (Math.PI * 2 * i) / spawnCount;
      const speed = 25 + Math.random() * 35;
      const lifespan = 1.2 + Math.random() * 0.8;

      this.runes.push({
        id: this.nextId++,
        glyph,
        position: new Vector2D(center.x + Math.cos(angle) * 15, center.y + Math.sin(angle) * 15),
        velocity: new Vector2D(Math.cos(angle) * 10, -speed),
        phase: Math.random() * Math.PI * 2,
        scale: 14 + Math.random() * 6,
        alpha: 1.0,
        lifespan,
        maxLifespan: lifespan,
      color,
      });
    }
  }

  public emitSlashTrail(
    arcCenter: Vector2D,
    facingAngle: number,
    color = '#FFB703',
    accentColor = '#FFD166',
    radius = 55
  ): void {
    const points: SlashTrailPoint[] = [];
    const segments = 8;
    const arcSpan = Math.PI * 0.65;

    for (let i = 0; i < segments; i++) {
      const angle = facingAngle - arcSpan / 2 + (arcSpan * i) / (segments - 1);
      const px = arcCenter.x + Math.cos(angle) * radius;
      const py = arcCenter.y + Math.sin(angle) * radius;
      points.push({
        position: new Vector2D(px, py),
        alpha: 1.0,
        width: 3 + (i / segments) * 6,
      });
    }

    this.trails.push({
      id: this.nextId++,
      points,
      color,
      accentColor,
      lifespan: 0.18,
      maxLifespan: 0.18,
    });
  }

  public emitMaterialDebris(
    origin: Vector2D,
    direction: Vector2D,
    count = 8,
    color = '#D97706'
  ): void {
    const isReduced = AccessibilityManager.getInstance().isReducedMotion();
    const spawnCount = isReduced ? Math.min(4, count) : count;

    for (let i = 0; i < spawnCount; i++) {
      const spreadAngle = (Math.random() - 0.5) * Math.PI * 0.8;
      const baseAngle = Math.atan2(direction.y, direction.x) + spreadAngle;
      const speed = 60 + Math.random() * 120;
      const lifespan = 0.35 + Math.random() * 0.25;

      this.debris.push({
        id: this.nextId++,
        position: origin.clone(),
        velocity: new Vector2D(Math.cos(baseAngle) * speed, Math.sin(baseAngle) * speed),
        size: 2 + Math.random() * 3,
        alpha: 1.0,
        lifespan,
        color,
      });
    }
  }

  public triggerRadialDistortion(center: Vector2D, maxIntensity = 1.0): void {
    const isReduced = AccessibilityManager.getInstance().isReducedMotion();
    if (isReduced) return;

    const shakeFactor = AccessibilityManager.getInstance().getScreenShakeFactor();
    const intensity = maxIntensity * shakeFactor;
    if (intensity <= 0.05) return;

    this.radialDistortion = {
      center: center.clone(),
      radius: 40,
      intensity,
      maxIntensity: intensity,
    };
  }

  public update(dt: number): void {
    // 1. Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.currentRadius += sw.speed * dt;
      sw.alpha = Math.max(0, 1.0 - sw.currentRadius / sw.maxRadius);
      if (sw.currentRadius >= sw.maxRadius || sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // 2. Update Sanskrit Runes
    for (let i = this.runes.length - 1; i >= 0; i--) {
      const r = this.runes[i];
      r.lifespan -= dt;
      r.phase += dt * 3.0;
      r.position.x += Math.cos(r.phase) * 18 * dt;
      r.position.y += r.velocity.y * dt;
      r.alpha = Math.max(0, r.lifespan / r.maxLifespan);
      if (r.lifespan <= 0) {
        this.runes.splice(i, 1);
      }
    }

    // 3. Update Slash Trails
    for (let i = this.trails.length - 1; i >= 0; i--) {
      const tr = this.trails[i];
      tr.lifespan -= dt;
      const alphaRatio = Math.max(0, tr.lifespan / tr.maxLifespan);
      for (const p of tr.points) {
        p.alpha = alphaRatio;
      }
      if (tr.lifespan <= 0) {
        this.trails.splice(i, 1);
      }
    }

    // 4. Update Debris
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.lifespan -= dt;
      d.position.x += d.velocity.x * dt;
      d.position.y += d.velocity.y * dt;
      d.velocity.y += 200 * dt; // Gravity
      d.alpha = Math.max(0, d.lifespan / 0.6);
      if (d.lifespan <= 0) {
        this.debris.splice(i, 1);
      }
    }

    // 5. Update Radial Distortion Pulse
    if (this.radialDistortion) {
      this.radialDistortion.radius += 350 * dt;
      this.radialDistortion.intensity -= dt * 3.0;
      if (this.radialDistortion.intensity <= 0) {
        this.radialDistortion = null;
      }
    }
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();

    // 1. Render Shockwaves
    for (const sw of this.shockwaves) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.center.x, sw.center.y, sw.currentRadius, 0, Math.PI * 2);
      ctx.lineWidth = sw.lineWidth;
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = sw.alpha * 0.85;
      ctx.stroke();

      // Outer accent refraction halo
      ctx.beginPath();
      ctx.arc(sw.center.x, sw.center.y, Math.max(0, sw.currentRadius - 3), 0, Math.PI * 2);
      ctx.lineWidth = sw.lineWidth * 0.5;
      ctx.strokeStyle = sw.accentColor;
      ctx.globalAlpha = sw.alpha * 0.45;
      ctx.stroke();
      ctx.restore();
    }

    // 2. Render Sanskrit Runes
    for (const r of this.runes) {
      ctx.save();
      ctx.globalAlpha = r.alpha;
      ctx.font = `bold ${Math.round(r.scale)}px sans-serif`;
      ctx.fillStyle = r.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(r.glyph, r.position.x, r.position.y);
      ctx.restore();
    }

    // 3. Render Slash Trails
    for (const tr of this.trails) {
      if (tr.points.length < 2) continue;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(tr.points[0].position.x, tr.points[0].position.y);
      for (let i = 1; i < tr.points.length; i++) {
        ctx.lineTo(tr.points[i].position.x, tr.points[i].position.y);
      }
      ctx.strokeStyle = tr.color;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = tr.points[0].alpha * 0.8;
      ctx.stroke();

      // Inner bright core
      ctx.beginPath();
      ctx.moveTo(tr.points[0].position.x, tr.points[0].position.y);
      for (let i = 1; i < tr.points.length; i++) {
        ctx.lineTo(tr.points[i].position.x, tr.points[i].position.y);
      }
      ctx.strokeStyle = tr.accentColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = tr.points[0].alpha;
      ctx.stroke();
      ctx.restore();
    }

    // 4. Render Material Debris
    for (const d of this.debris) {
      ctx.save();
      ctx.globalAlpha = d.alpha;
      ctx.fillStyle = d.color;
      ctx.fillRect(d.position.x - d.size / 2, d.position.y - d.size / 2, d.size, d.size);
      ctx.restore();
    }

    // 5. Render Radial Distortion Ring (screen effect)
    if (this.radialDistortion && this.radialDistortion.intensity > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.radialDistortion.center.x, this.radialDistortion.center.y, this.radialDistortion.radius, 0, Math.PI * 2);
      ctx.lineWidth = 6 * this.radialDistortion.intensity;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 * this.radialDistortion.intensity})`;
      ctx.stroke();
      ctx.restore();
    }
  }

  public getActiveCount(): { shockwaves: number; runes: number; trails: number; debris: number } {
    return {
      shockwaves: this.shockwaves.length,
      runes: this.runes.length,
      trails: this.trails.length,
      debris: this.debris.length,
    };
  }
}
