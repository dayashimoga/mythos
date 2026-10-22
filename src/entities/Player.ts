import { Entity } from './Entity';
import { Vector2D } from '../physics/Vector2D';
import { Projectile } from './Projectile';
import { IRenderer } from '../render/CanvasRenderer';

export class Player extends Entity {
  public health = 100;
  public maxHealth = 100;
  public energy = 100;
  public maxEnergy = 100;
  public energyRegenRate = 18; // per second

  public speed = 220;
  public dashSpeed = 520;
  public isDashing = false;
  public dashTimer = 0;
  public dashDuration = 0.18;
  public dashCooldown = 0.55;
  public dashCooldownTimer = 0;

  public shootCooldown = 0.22;
  public shootCooldownTimer = 0;

  public facing: Vector2D = new Vector2D(0, 1);
  public shardsCollected = 0;
  public score = 0;

  private idleBreath = 0;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 32, 40, 'player');
  }

  public move(dir: Vector2D, dt: number): void {
    if (this.isDashing) return;

    if (dir.magnitudeSquared() > 0.001) {
      this.facing = dir.clone().normalize();
      this.velocity.x = dir.x * this.speed;
      this.velocity.y = dir.y * this.speed;
    } else {
      this.velocity.scale(0.85); // Gentle friction
      if (this.velocity.magnitudeSquared() < 1) {
        this.velocity.set(0, 0);
      }
    }

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.syncBounds();
  }

  public triggerDash(): boolean {
    if (this.dashCooldownTimer > 0 || this.energy < 25) return false;

    this.isDashing = true;
    this.dashTimer = this.dashDuration;
    this.dashCooldownTimer = this.dashCooldown;
    this.energy -= 25;

    this.velocity = this.facing.clone().normalize().scale(this.dashSpeed);
    return true;
  }

  public shoot(targetPos?: Vector2D): Projectile | null {
    if (this.shootCooldownTimer > 0 || this.energy < 15) return null;

    let shootDir = this.facing.clone();
    if (targetPos) {
      const dirToTarget = Vector2D.sub(targetPos, this.position);
      if (dirToTarget.magnitudeSquared() > 0.001) {
        shootDir = dirToTarget.normalize();
      }
    }

    this.shootCooldownTimer = this.shootCooldown;
    this.energy -= 15;

    const proj = new Projectile(
      `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      this.position.x + shootDir.x * 20,
      this.position.y + shootDir.y * 20,
      shootDir,
      520
    );

    return proj;
  }

  public update(dt: number): void {
    this.idleBreath += dt * 3;

    // Energy regeneration
    if (this.energy < this.maxEnergy) {
      this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegenRate * dt);
    }

    // Cooldown timers
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - dt);
    }
    if (this.shootCooldownTimer > 0) {
      this.shootCooldownTimer = Math.max(0, this.shootCooldownTimer - dt);
    }

    // Handle dash state
    if (this.isDashing) {
      this.dashTimer -= dt;
      this.position.x += this.velocity.x * dt;
      this.position.y += this.velocity.y * dt;
      this.syncBounds();

      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.velocity.set(0, 0);
      }
    }
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    // Subtle breathing scale
    const breath = 1 + Math.sin(this.idleBreath) * 0.03;
    ctx.scale(breath, breath);

    // Shadow on ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dash trail or aura
    if (this.isDashing) {
      ctx.fillStyle = 'rgba(251, 133, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();
    }

    // Veer's Cuirass Body (Bronze & Obsidian)
    ctx.fillStyle = '#121824';
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-12, -18, 24, 32, 6);
    ctx.fill();
    ctx.stroke();

    // Sacred Saffron Mantle / Scarf
    ctx.fillStyle = '#FB8500';
    const scarfOffset = -this.facing.x * 8;
    ctx.beginPath();
    ctx.moveTo(-6, -14);
    ctx.lineTo(6, -14);
    ctx.lineTo(scarfOffset, 2);
    ctx.closePath();
    ctx.fill();

    // Consecrated Solar Core / Gauntlet
    ctx.fillStyle = '#FFD166';
    const gauntletX = this.facing.x >= 0 ? 12 : -12;
    ctx.beginPath();
    ctx.arc(gauntletX, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }
}
