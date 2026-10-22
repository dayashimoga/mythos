import { Entity } from './Entity';
import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';

export class Projectile extends Entity {
  public damage = 25;
  private life = 1.8;
  private color = '#FFB703';

  constructor(id: string, x: number, y: number, direction: Vector2D, speed = 500, tag = 'projectile') {
    super(id, x, y, 12, 12, tag);
    const dir = direction.clone().normalize();
    this.velocity = dir.scale(speed);
  }

  public update(dt: number): void {
    if (!this.isActive) return;

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.syncBounds();

    this.life -= dt;
    if (this.life <= 0) {
      this.destroy();
    }
  }

  public render(renderer: IRenderer): void {
    if (!this.isActive) return;
    const ctx = renderer.getContext();
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    // Glowing core
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Outer flame halo
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}
