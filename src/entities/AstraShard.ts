import { Entity } from './Entity';
import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';

export class AstraShard extends Entity {
  public basePositionY: number;
  private floatTime = 0;
  public isCollected = false;
  private glowColor = '#00E5FF';
  private magneticRadius = 140;
  private magneticSpeed = 280;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 20, 20, 'shard');
    this.basePositionY = y;
  }

  public update(dt: number): void {
    if (!this.isActive || this.isCollected) return;

    this.floatTime += dt;
    this.position.y = this.basePositionY + Math.sin(this.floatTime * 4) * 6;
    this.syncBounds();
  }

  public attractTowards(target: Vector2D, dt: number): void {
    if (this.isCollected) return;

    const dist = this.position.distanceTo(target);
    if (dist < this.magneticRadius && dist > 5) {
      const dir = Vector2D.sub(target, this.position).normalize();
      this.position.x += dir.x * this.magneticSpeed * dt;
      this.position.y += dir.y * this.magneticSpeed * dt;
      this.basePositionY = this.position.y;
      this.syncBounds();
    }
  }

  public render(renderer: IRenderer): void {
    if (!this.isActive || this.isCollected) return;

    const ctx = renderer.getContext();
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    // Outer pulsing ring
    const pulse = 10 + Math.sin(this.floatTime * 6) * 3;
    ctx.strokeStyle = this.glowColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Octahedral Crystal Diamond
    ctx.fillStyle = '#FFD166';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 9);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();

    // Central core sparkle
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
