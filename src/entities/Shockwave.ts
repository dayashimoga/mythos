import { Entity } from './Entity';
import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';

export class Shockwave extends Entity {
  public radius = 10;
  public maxRadius = 160;
  public expansionSpeed = 220; // px/sec
  public damage = 30;
  public hasHitPlayer = false;
  private ringColor = '#EF476F';

  constructor(id: string, x: number, y: number, maxRadius = 160, damage = 30) {
    super(id, x, y, 20, 20, 'shockwave');
    this.maxRadius = maxRadius;
    this.damage = damage;
  }

  public update(dt: number): void {
    if (!this.isActive) return;

    this.radius += this.expansionSpeed * dt;
    this.bounds.width = this.radius * 2;
    this.bounds.height = this.radius * 2;
    this.syncBounds();

    if (this.radius >= this.maxRadius) {
      this.destroy();
    }
  }

  public checkPlayerHit(playerPos: Vector2D, isDashing: boolean): boolean {
    if (!this.isActive || this.hasHitPlayer || isDashing) return false;

    const dist = this.position.distanceTo(playerPos);
    // Hit if player is within the expanding ring perimeter (ring thickness ~ 18px)
    if (Math.abs(dist - this.radius) < 22) {
      this.hasHitPlayer = true;
      return true;
    }
    return false;
  }

  public render(renderer: IRenderer): void {
    if (!this.isActive) return;
    const ctx = renderer.getContext();
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    const progress = this.radius / this.maxRadius;
    const alpha = Math.max(0, 1 - progress);

    ctx.strokeStyle = this.ringColor;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 4 * (1 - progress * 0.5);

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner glow accent
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1, this.radius - 6), 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}
