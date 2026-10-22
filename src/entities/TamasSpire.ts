import { Entity } from './Entity';
import { IRenderer } from '../render/CanvasRenderer';
import { SacredGeometry } from '../render/SacredGeometry';

export class TamasSpire extends Entity {
  public health = 200;
  public maxHealth = 200;
  public isShielded = true;
  private hitFlashTimer = 0;
  private rotationAngle = 0;
  private shieldPulse = 0;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 64, 80, 'enemy_spire');
  }

  public setShielded(shielded: boolean): void {
    this.isShielded = shielded;
  }

  public takeDamage(amount: number): { killed: boolean; shielded: boolean } {
    if (this.isShielded) {
      this.hitFlashTimer = 0.08;
      return { killed: false, shielded: true };
    }

    this.health -= amount;
    this.hitFlashTimer = 0.15;
    if (this.health <= 0) {
      this.destroy();
      return { killed: true, shielded: false };
    }
    return { killed: false, shielded: false };
  }

  public update(dt: number): void {
    if (!this.isActive) return;

    this.rotationAngle += dt * 0.8;
    this.shieldPulse = Math.sin(this.rotationAngle * 3) * 6;

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

    // Void Shield Barrier
    if (this.isShielded) {
      ctx.strokeStyle = '#8338EC';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 52 + this.shieldPulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(131, 56, 236, 0.12)';
      ctx.fill();

      // Shield warning prompt
      ctx.fillStyle = '#C77DFF';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('VOID SHIELD ACTIVE (HARMONIZE PILLARS)', 0, -62);
    }

    // Monolithic Obsidian Spire Body
    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#140F1E';
    ctx.strokeStyle = '#EF476F';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.lineTo(24, 32);
    ctx.lineTo(-24, 32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Corrupted Heart Mandala
    SacredGeometry.drawMandala(ctx, 0, 0, 20, 6, this.rotationAngle, '#EF476F', 2);

    // Health Bar
    if (this.health < this.maxHealth) {
      ctx.fillStyle = '#080C14';
      ctx.fillRect(-30, -52, 60, 6);
      ctx.fillStyle = '#EF476F';
      ctx.fillRect(-30, -52, (60 * this.health) / this.maxHealth, 6);
    }

    ctx.restore();
  }
}
