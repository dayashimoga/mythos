import { Vector2D } from '../physics/Vector2D';
import { AABB } from '../physics/AABB';
import { IRenderer } from '../render/CanvasRenderer';

export interface FluidParticle {
  position: Vector2D;
  velocity: Vector2D;
  density: number;
  life: number;
  maxLife: number;
}

export class FluidDynamics {
  public bounds: AABB;
  public gridResolution: number;
  public cols: number;
  public rows: number;
  public flowSpeed: number;
  public viscosity: number;

  public velocityField: Vector2D[][];
  public particles: FluidParticle[] = [];
  public toxicDamagePerSecond = 15;
  private time = 0;

  constructor(bounds = new AABB(100, 300, 600, 120), gridResolution = 30, flowSpeed = 60, viscosity = 0.85) {
    this.bounds = bounds;
    this.gridResolution = gridResolution;
    this.flowSpeed = flowSpeed;
    this.viscosity = viscosity;

    this.cols = Math.ceil(bounds.width / gridResolution);
    this.rows = Math.ceil(bounds.height / gridResolution);

    this.velocityField = [];
    this.initVelocityField();
    this.spawnParticles(50);
  }

  private initVelocityField(): void {
    this.velocityField = [];
    for (let c = 0; c < this.cols; c++) {
      const colVecs: Vector2D[] = [];
      for (let r = 0; r < this.rows; r++) {
        // Horizontal laminar flow with sinusoidal turbulence
        const wave = Math.sin((c / this.cols) * Math.PI * 4);
        colVecs.push(new Vector2D(this.flowSpeed, wave * 15));
      }
      this.velocityField.push(colVecs);
    }
  }

  public spawnParticles(count: number): void {
    for (let i = 0; i < count; i++) {
      const x = this.bounds.x + Math.random() * this.bounds.width;
      const y = this.bounds.y + Math.random() * this.bounds.height;
      this.particles.push({
        position: new Vector2D(x, y),
        velocity: new Vector2D(this.flowSpeed, (Math.random() - 0.5) * 10),
        density: 0.6 + Math.random() * 0.4,
        life: 0,
        maxLife: 4 + Math.random() * 3,
      });
    }
  }

  public update(dt: number): void {
    this.time += dt;

    // Evolve velocity field
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        const angle = this.time * 2 + (c * 0.3) + (r * 0.5);
        this.velocityField[c][r].x = this.flowSpeed + Math.sin(angle) * 10;
        this.velocityField[c][r].y = Math.cos(angle) * 18 * this.viscosity;
      }
    }

    // Advect particles
    for (const p of this.particles) {
      p.life += dt;

      // Sample local velocity
      const relX = p.position.x - this.bounds.x;
      const relY = p.position.y - this.bounds.y;
      const c = Math.floor(relX / this.gridResolution);
      const r = Math.floor(relY / this.gridResolution);

      if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
        const fieldV = this.velocityField[c][r];
        p.velocity.x = p.velocity.x * 0.9 + fieldV.x * 0.1;
        p.velocity.y = p.velocity.y * 0.9 + fieldV.y * 0.1;
      }

      p.position = p.position.add(p.velocity.multiply(dt));

      // Recycle particles leaving the bounds
      if (p.position.x > this.bounds.x + this.bounds.width || p.life >= p.maxLife) {
        p.position.x = this.bounds.x;
        p.position.y = this.bounds.y + Math.random() * this.bounds.height;
        p.life = 0;
        p.velocity.set(this.flowSpeed, 0);
      }
    }
  }

  public checkEntityContact(entityBounds: AABB, dt: number): { inVenom: boolean; appliedDamage: number } {
    if (this.bounds.intersects(entityBounds)) {
      const dmg = this.toxicDamagePerSecond * dt;
      return { inVenom: true, appliedDamage: dmg };
    }
    return { inVenom: false, appliedDamage: 0 };
  }

  public render(renderer: IRenderer): void {
    // Venom river channel bed
    renderer.drawRect(
      this.bounds.x,
      this.bounds.y,
      this.bounds.width,
      this.bounds.height,
      '#051f0f',
      '#00ff66'
    );

    const ctx = renderer.getContext();
    ctx.save();

    // Render advected fluid globules
    for (const p of this.particles) {
      const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.7;
      ctx.fillStyle = `rgba(32, 224, 96, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, 4 * p.density, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dynamic wave ripples on surface
    ctx.strokeStyle = 'rgba(72, 255, 144, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const wx = this.bounds.x + (i / steps) * this.bounds.width;
      const wy = this.bounds.y + Math.sin(this.time * 4 + i * 0.6) * 5;
      if (i === 0) ctx.moveTo(wx, wy);
      else ctx.lineTo(wx, wy);
    }
    ctx.stroke();

    ctx.restore();
  }
}
