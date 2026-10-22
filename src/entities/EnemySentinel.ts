import { Entity } from './Entity';
import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';

export class EnemySentinel extends Entity {
  public health = 50;
  public maxHealth = 50;
  private patrolOrigin: Vector2D;
  private patrolRadius = 80;
  private patrolAngle = 0;
  private patrolSpeed = 1.2;
  private hitFlashTimer = 0;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 32, 32, 'enemy');
    this.patrolOrigin = new Vector2D(x, y);
  }

  public takeDamage(amount: number): boolean {
    this.health -= amount;
    this.hitFlashTimer = 0.12;
    if (this.health <= 0) {
      this.destroy();
      return true; // was killed
    }
    return false;
  }

  public update(dt: number): void {
    if (!this.isActive) return;

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    this.patrolAngle += dt * this.patrolSpeed;
    this.position.x = this.patrolOrigin.x + Math.cos(this.patrolAngle) * this.patrolRadius;
    this.position.y = this.patrolOrigin.y + Math.sin(this.patrolAngle) * this.patrolRadius;
    this.syncBounds();
  }

  public render(renderer: IRenderer): void {
    if (!this.isActive) return;
    const ctx = renderer.getContext();
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    const isFlashing = this.hitFlashTimer > 0;

    // Obsidian outer chassis
    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#1F1A24';
    ctx.strokeStyle = '#EF476F';
    ctx.lineWidth = 2;

    ctx.beginPath();
    // Diamond hull
    ctx.moveTo(0, -16);
    ctx.lineTo(16, 0);
    ctx.lineTo(0, 16);
    ctx.lineTo(-16, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Pulsing Corrupted Tamas Eye
    ctx.fillStyle = isFlashing ? '#FF0000' : '#EF476F';
    ctx.beginPath();
    ctx.arc(0, 0, 5 + Math.sin(this.patrolAngle * 4) * 2, 0, Math.PI * 2);
    ctx.fill();

    // Mini health bar above
    if (this.health < this.maxHealth) {
      const barWidth = 32;
      const barHeight = 4;
      const healthRatio = Math.max(0, this.health / this.maxHealth);

      ctx.fillStyle = '#080C14';
      ctx.fillRect(-barWidth / 2, -24, barWidth, barHeight);

      ctx.fillStyle = '#EF476F';
      ctx.fillRect(-barWidth / 2, -24, barWidth * healthRatio, barHeight);
    }

    ctx.restore();
  }
}
