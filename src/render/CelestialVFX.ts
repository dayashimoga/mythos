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

export interface ElementalParticle {
  id: number;
  position: Vector2D;
  velocity: Vector2D;
  size: number;
  color: string;
  alpha: number;
  lifespan: number;
  maxLifespan: number;
  type: 'SURYA_RAY' | 'AGNI_EMBER' | 'PRANA_GALE' | 'TAMAS_TENDRIL' | 'ATMOSPHERE_DUST';
  phase?: number;
}

export interface ConsecrationPillarVFX {
  id: number;
  center: Vector2D;
  height: number;
  width: number;
  alpha: number;
  lifespan: number;
  maxLifespan: number;
}

export class CelestialVFX {
  private static instance: CelestialVFX | null = null;

  private nextId = 1;
  private shockwaves: ShockwaveRing[] = [];
  private runes: SanskritRuneParticle[] = [];
  private trails: SlashTrail[] = [];
  private debris: ImpactDebris[] = [];
  private elementalParticles: ElementalParticle[] = [];
  private lightPillars: ConsecrationPillarVFX[] = [];

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
    this.elementalParticles = [];
    this.lightPillars = [];
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

  // --- Elemental & Celestial VFX Subsystems ---

  public emitSuryaSolarFlare(center: Vector2D, count = 12): void {
    const isReduced = AccessibilityManager.getInstance().isReducedMotion();
    const spawnCount = isReduced ? Math.min(6, count) : count;

    for (let i = 0; i < spawnCount; i++) {
      const angle = (Math.PI * 2 * i) / spawnCount;
      const speed = 70 + Math.random() * 80;
      const lifespan = 0.45 + Math.random() * 0.25;

      this.elementalParticles.push({
        id: this.nextId++,
        position: center.clone(),
        velocity: new Vector2D(Math.cos(angle) * speed, Math.sin(angle) * speed),
        size: 3 + Math.random() * 4,
        color: '#FFD166',
        alpha: 1.0,
        lifespan,
        maxLifespan: lifespan,
        type: 'SURYA_RAY',
      });
    }
  }

  public emitConsecrationLightPillar(center: Vector2D, height = 650, duration = 2.5): void {
    this.lightPillars.push({
      id: this.nextId++,
      center: center.clone(),
      height,
      width: 72,
      alpha: 1.0,
      lifespan: duration,
      maxLifespan: duration,
    });
  }

  public emitAgniEmbers(center: Vector2D, count = 12): void {
    const isReduced = AccessibilityManager.getInstance().isReducedMotion();
    const spawnCount = isReduced ? Math.min(6, count) : count;

    for (let i = 0; i < spawnCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 20;
      const upwardSpeed = 40 + Math.random() * 60;
      const lifespan = 0.8 + Math.random() * 0.7;

      this.elementalParticles.push({
        id: this.nextId++,
        position: new Vector2D(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius),
        velocity: new Vector2D((Math.random() - 0.5) * 25, -upwardSpeed),
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.4 ? '#EF4444' : '#F59E0B',
        alpha: 1.0,
        lifespan,
        maxLifespan: lifespan,
        type: 'AGNI_EMBER',
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  public emitFlamingChakramTrail(arcCenter: Vector2D, facingAngle: number, radius = 55): void {
    this.emitSlashTrail(arcCenter, facingAngle, '#EF4444', '#FDE047', radius);
    this.emitAgniEmbers(arcCenter, 6);
  }

  public emitPranaWindVortex(center: Vector2D, radius = 60): void {
    const isReduced = AccessibilityManager.getInstance().isReducedMotion();
    const count = isReduced ? 6 : 12;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const lifespan = 0.5 + Math.random() * 0.3;

      this.elementalParticles.push({
        id: this.nextId++,
        position: new Vector2D(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius),
        velocity: new Vector2D(-Math.sin(angle) * 80, Math.cos(angle) * 80),
        size: 3 + Math.random() * 3,
        color: '#38BDF8',
        alpha: 1.0,
        lifespan,
        maxLifespan: lifespan,
        type: 'PRANA_GALE',
        phase: angle,
      });
    }
  }

  public emitPranaShieldSpark(center: Vector2D, normal?: Vector2D): void {
    const baseAngle = normal ? Math.atan2(normal.y, normal.x) : Math.random() * Math.PI * 2;
    for (let i = 0; i < 8; i++) {
      const spread = (Math.random() - 0.5) * Math.PI * 0.7;
      const speed = 60 + Math.random() * 90;
      const lifespan = 0.25 + Math.random() * 0.2;

      this.elementalParticles.push({
        id: this.nextId++,
        position: center.clone(),
        velocity: new Vector2D(Math.cos(baseAngle + spread) * speed, Math.sin(baseAngle + spread) * speed),
        size: 2 + Math.random() * 3,
        color: '#00E5FF',
        alpha: 1.0,
        lifespan,
        maxLifespan: lifespan,
        type: 'PRANA_GALE',
      });
    }
  }

  public emitTamasTendrils(center: Vector2D, count = 8): void {
    const isReduced = AccessibilityManager.getInstance().isReducedMotion();
    const spawnCount = isReduced ? Math.min(4, count) : count;

    for (let i = 0; i < spawnCount; i++) {
      const angle = (Math.PI * 2 * i) / spawnCount;
      const speed = 20 + Math.random() * 35;
      const lifespan = 0.6 + Math.random() * 0.4;

      this.elementalParticles.push({
        id: this.nextId++,
        position: center.clone(),
        velocity: new Vector2D(Math.cos(angle) * speed, Math.sin(angle) * speed),
        size: 4 + Math.random() * 4,
        color: '#581C87',
        alpha: 0.9,
        lifespan,
        maxLifespan: lifespan,
        type: 'TAMAS_TENDRIL',
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  public emitVoidMiasmaCloud(center: Vector2D, radius = 45): void {
    for (let i = 0; i < 4; i++) {
      const offset = new Vector2D((Math.random() - 0.5) * radius, (Math.random() - 0.5) * radius);
      this.emitTamasTendrils(center.add(offset), 3);
    }
  }

  public emitAtmosphericScintillation(
    bounds: { x: number; y: number; width: number; height: number },
    count = 15,
    type: 'TEMPLE_DUST' | 'VOLCANIC_EMBERS' = 'TEMPLE_DUST'
  ): void {
    const isReduced = AccessibilityManager.getInstance().isReducedMotion();
    const spawnCount = isReduced ? Math.min(6, count) : count;

    for (let i = 0; i < spawnCount; i++) {
      const px = bounds.x + Math.random() * bounds.width;
      const py = bounds.y + Math.random() * bounds.height;
      const lifespan = 1.5 + Math.random() * 1.5;

      this.elementalParticles.push({
        id: this.nextId++,
        position: new Vector2D(px, py),
        velocity: new Vector2D((Math.random() - 0.5) * 15, type === 'VOLCANIC_EMBERS' ? -25 - Math.random() * 20 : (Math.random() - 0.5) * 10),
        size: type === 'VOLCANIC_EMBERS' ? 2 + Math.random() * 2 : 1 + Math.random() * 2,
        color: type === 'VOLCANIC_EMBERS' ? '#F97316' : '#FFD166',
        alpha: 0.7,
        lifespan,
        maxLifespan: lifespan,
        type: 'ATMOSPHERE_DUST',
        phase: Math.random() * Math.PI * 2,
      });
    }
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

    // 6. Update Light Pillars
    for (let i = this.lightPillars.length - 1; i >= 0; i--) {
      const p = this.lightPillars[i];
      p.lifespan -= dt;
      p.alpha = Math.max(0, p.lifespan / p.maxLifespan);
      if (p.lifespan <= 0) {
        this.lightPillars.splice(i, 1);
      }
    }

    // 7. Update Elemental Particles
    for (let i = this.elementalParticles.length - 1; i >= 0; i--) {
      const ep = this.elementalParticles[i];
      ep.lifespan -= dt;
      ep.position.x += ep.velocity.x * dt;
      ep.position.y += ep.velocity.y * dt;

      if (ep.type === 'AGNI_EMBER') {
        ep.phase = (ep.phase ?? 0) + dt * 4.0;
        ep.position.x += Math.sin(ep.phase) * 15 * dt;
        ep.velocity.y -= 15 * dt; // Fire buoyancy
      } else if (ep.type === 'PRANA_GALE') {
        ep.phase = (ep.phase ?? 0) + dt * 3.0;
        ep.position.x += Math.cos(ep.phase) * 20 * dt;
      } else if (ep.type === 'TAMAS_TENDRIL') {
        ep.phase = (ep.phase ?? 0) + dt * 5.0;
        ep.position.x += (Math.random() - 0.5) * 20 * dt;
      }

      ep.alpha = Math.max(0, ep.lifespan / ep.maxLifespan);
      if (ep.lifespan <= 0) {
        this.elementalParticles.splice(i, 1);
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

    // 5. Render Consecration Light Pillars
    for (const p of this.lightPillars) {
      ctx.save();
      const grad = ctx.createLinearGradient(p.center.x, p.center.y, p.center.x, p.center.y - p.height);
      grad.addColorStop(0, `rgba(255, 209, 102, ${p.alpha * 0.85})`);
      grad.addColorStop(0.3, `rgba(255, 235, 150, ${p.alpha * 0.65})`);
      grad.addColorStop(1, 'rgba(255, 209, 102, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(p.center.x - p.width / 2, p.center.y - p.height, p.width, p.height);

      // Core intense beam
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.9})`;
      ctx.fillRect(p.center.x - p.width * 0.15, p.center.y - p.height, p.width * 0.3, p.height);
      ctx.restore();
    }

    // 6. Render Elemental Particles
    for (const ep of this.elementalParticles) {
      ctx.save();
      ctx.globalAlpha = ep.alpha;
      ctx.fillStyle = ep.color;
      ctx.beginPath();
      ctx.arc(ep.position.x, ep.position.y, ep.size, 0, Math.PI * 2);
      ctx.fill();

      // Outer glow for flame/prana/light
      if (ep.type === 'AGNI_EMBER' || ep.type === 'PRANA_GALE' || ep.type === 'SURYA_RAY') {
        ctx.beginPath();
        ctx.arc(ep.position.x, ep.position.y, ep.size * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = ep.color;
        ctx.globalAlpha = ep.alpha * 0.3;
        ctx.fill();
      }
      ctx.restore();
    }

    // 7. Render Radial Distortion Ring (screen effect)
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

  public getActiveCount(): { shockwaves: number; runes: number; trails: number; debris: number; elemental: number; pillars: number } {
    return {
      shockwaves: this.shockwaves.length,
      runes: this.runes.length,
      trails: this.trails.length,
      debris: this.debris.length,
      elemental: this.elementalParticles.length,
      pillars: this.lightPillars.length,
    };
  }
}
