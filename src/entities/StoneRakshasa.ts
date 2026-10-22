import { Entity } from './Entity';
import { Vector2D } from '../physics/Vector2D';
import { Shockwave } from './Shockwave';
import { IRenderer } from '../render/CanvasRenderer';

export class StoneRakshasa extends Entity {
  public health = 140;
  public maxHealth = 140;
  public speed = 80;

  private attackCooldown = 3.2;
  private attackTimer = 1.5;
  public isWindingUp = false;
  private windupTimer = 0;
  private hitFlashTimer = 0;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 48, 48, 'enemy_rakshasa');
  }

  public takeDamage(amount: number): boolean {
    this.health -= amount;
    this.hitFlashTimer = 0.12;
    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  public updateAI(targetPos: Vector2D, dt: number): Shockwave | null {
    if (!this.isActive) return null;

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    const dist = this.position.distanceTo(targetPos);

    // Windup Slam State
    if (this.isWindingUp) {
      this.windupTimer -= dt;
      if (this.windupTimer <= 0) {
        this.isWindingUp = false;
        this.attackTimer = this.attackCooldown;

        // Produce Ground Slam Shockwave!
        return new Shockwave(
          `shock_${Date.now()}`,
          this.position.x,
          this.position.y,
          180,
          35
        );
      }
      return null;
    }

    // Approach Veer
    if (dist > 75) {
      const dir = Vector2D.sub(targetPos, this.position).normalize();
      this.position.x += dir.x * this.speed * dt;
      this.position.y += dir.y * this.speed * dt;
      this.syncBounds();
    }

    // Trigger Windup if within attack range
    this.attackTimer -= dt;
    if (dist <= 110 && this.attackTimer <= 0) {
      this.isWindingUp = true;
      this.windupTimer = 1.0;
    }

    return null;
  }

  public update(dt: number): void {
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }
  }

  public render(renderer: IRenderer): void {
    if (!this.isActive) return;
    const ctx = renderer.getContext();
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    const isFlashing = this.hitFlashTimer > 0;

    // Ground Slam Telegraph Ring
    if (this.isWindingUp) {
      const progress = 1 - this.windupTimer / 1.0;
      ctx.strokeStyle = '#EF476F';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 110 * progress, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(239, 71, 111, 0.15)';
      ctx.fill();
    }

    // Massive Stone Rakshasa Chassis (Basalt & Crimson Horns)
    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#1F1A24';
    ctx.strokeStyle = '#EF476F';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-22, -22, 44, 44, 8);
    ctx.fill();
    ctx.stroke();

    // Crimson Core Eye
    ctx.fillStyle = this.isWindingUp ? '#FF0055' : '#FB8500';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Horns
    ctx.fillStyle = '#EF476F';
    ctx.beginPath();
    ctx.moveTo(-16, -22);
    ctx.lineTo(-24, -36);
    ctx.lineTo(-10, -22);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(16, -22);
    ctx.lineTo(24, -36);
    ctx.lineTo(10, -22);
    ctx.fill();

    // Health Bar
    if (this.health < this.maxHealth) {
      ctx.fillStyle = '#080C14';
      ctx.fillRect(-22, -44, 44, 5);
      ctx.fillStyle = '#EF476F';
      ctx.fillRect(-22, -44, (44 * this.health) / this.maxHealth, 5);
    }

    ctx.restore();
  }
}
