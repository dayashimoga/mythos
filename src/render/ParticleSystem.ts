import { Vector2D } from '../physics/Vector2D';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  initialSize: number;
  alpha: number;
  life: number;
  maxLife: number;
  active: boolean;
}

export class ParticleSystem {
  private particles: Particle[];
  private maxParticles: number;
  private activeCount = 0;

  constructor(maxParticles = 800) {
    this.maxParticles = maxParticles;
    this.particles = new Array(maxParticles);
    for (let i = 0; i < maxParticles; i++) {
      this.particles[i] = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        color: '#FFFFFF',
        size: 2,
        initialSize: 2,
        alpha: 1,
        life: 0,
        maxLife: 1,
        active: false,
      };
    }
  }

  public emit(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: string,
    size: number,
    lifeSeconds: number
  ): void {
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.x = x;
        p.y = y;
        p.vx = vx;
        p.vy = vy;
        p.color = color;
        p.size = size;
        p.initialSize = size;
        p.alpha = 1;
        p.life = lifeSeconds;
        p.maxLife = lifeSeconds;
        p.active = true;
        this.activeCount++;
        return;
      }
    }
  }

  public emitBurst(
    x: number,
    y: number,
    count: number,
    color: string,
    speedMin = 40,
    speedMax = 160,
    size = 3,
    life = 0.6
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = speedMin + Math.random() * (speedMax - speedMin);
      this.emit(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        size,
        life * (0.8 + Math.random() * 0.4)
      );
    }
  }

  public burst(
    x: number,
    y: number,
    count = 8,
    color = '#FFB703',
    speedMin = 40,
    speedMax = 160,
    size = 3,
    life = 0.6
  ): void {
    this.emitBurst(x, y, count, color, speedMin, speedMax, size, life);
  }

  public update(dt: number): void {
    this.activeCount = 0;
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (p.active) {
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
        } else {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          // Apply gentle drag
          p.vx *= 0.96;
          p.vy *= 0.96;

          const progress = 1 - p.life / p.maxLife;
          p.alpha = Math.max(0, 1 - progress);
          p.size = p.initialSize * (1 - progress * 0.5);
          this.activeCount++;
        }
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, cameraOffset: Vector2D): void {
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (p.active) {
        const renderX = p.x - cameraOffset.x;
        const renderY = p.y - cameraOffset.y;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(renderX, renderY, Math.max(0.5, p.size), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  public getActiveCount(): number {
    return this.activeCount;
  }

  public clear(): void {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles[i].active = false;
    }
    this.activeCount = 0;
  }
}
