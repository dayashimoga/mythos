import { Entity } from './Entity';
import { Vector2D } from '../physics/Vector2D';
import { Projectile } from './Projectile';
import { IRenderer } from '../render/CanvasRenderer';

export class VanaraScout extends Entity {
  public health = 45;
  public maxHealth = 45;
  public speed = 150;

  private shootCooldown = 2.4;
  private shootTimer = 1.0;
  public isTelegraphing = false;
  public telegraphTimer = 0;
  private hitFlashTimer = 0;
  private circleAngle = Math.random() * Math.PI * 2;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 28, 28, 'enemy_scout');
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

  public updateAI(targetPos: Vector2D, dt: number): Projectile[] | null {
    if (!this.isActive) return null;

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    const dist = this.position.distanceTo(targetPos);
    this.circleAngle += dt * 1.2;

    // Movement: Maintain standoff distance (~200px) while circling
    const targetDistance = 200;
    const dirToTarget = Vector2D.sub(targetPos, this.position).normalize();
    const tangentDir = new Vector2D(-dirToTarget.y, dirToTarget.x);

    let moveDir = new Vector2D(0, 0);
    if (dist < targetDistance - 30) {
      // Back away
      moveDir.add(dirToTarget.clone().scale(-1));
    } else if (dist > targetDistance + 40) {
      // Approach
      moveDir.add(dirToTarget);
    }
    // Add circular orbit
    moveDir.add(tangentDir.scale(0.8)).normalize();

    this.position.x += moveDir.x * this.speed * dt;
    this.position.y += moveDir.y * this.speed * dt;
    this.syncBounds();

    // Shooting AI cycle
    this.shootTimer -= dt;
    if (this.shootTimer <= 0.6 && !this.isTelegraphing) {
      this.isTelegraphing = true;
      this.telegraphTimer = 0.6;
    }

    if (this.isTelegraphing) {
      this.telegraphTimer -= dt;
      if (this.telegraphTimer <= 0) {
        this.isTelegraphing = false;
        this.shootTimer = this.shootCooldown;

        // Spawn void projectile
        const shootDir = Vector2D.sub(targetPos, this.position).normalize();
        const p = new Projectile(
          `void_${Date.now()}_${Math.random()}`,
          this.position.x + shootDir.x * 16,
          this.position.y + shootDir.y * 16,
          shootDir,
          320
        );
        p.tag = 'enemy_projectile';
        return [p];
      }
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

    // Telegraphing charge ring
    if (this.isTelegraphing) {
      ctx.strokeStyle = '#8338EC';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 20 + this.telegraphTimer * 20, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Agile Scout Body (Shadow Violet)
    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#3A0CA3';
    ctx.strokeStyle = '#4CC9F0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(12, 12);
    ctx.lineTo(0, 6);
    ctx.lineTo(-12, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Health Bar
    if (this.health < this.maxHealth) {
      ctx.fillStyle = '#080C14';
      ctx.fillRect(-14, -20, 28, 3);
      ctx.fillStyle = '#EF476F';
      ctx.fillRect(-14, -20, (28 * this.health) / this.maxHealth, 3);
    }

    ctx.restore();
  }
}
