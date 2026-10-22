import { Entity } from './Entity';
import { IRenderer } from '../render/CanvasRenderer';

export class AmritaFont extends Entity {
  public healAmount = 40;
  public cooldown = 8.0;
  public cooldownTimer = 0;
  private animTimer = 0;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 48, 48, 'font');
  }

  public canDrink(): boolean {
    return this.cooldownTimer <= 0;
  }

  public drink(): number {
    if (this.canDrink()) {
      this.cooldownTimer = this.cooldown;
      return this.healAmount;
    }
    return 0;
  }

  public update(dt: number): void {
    this.animTimer += dt * 3;
    if (this.cooldownTimer > 0) {
      this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);
    }
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    const isReady = this.canDrink();
    const fluidColor = isReady ? '#06D6A0' : '#495057';

    // Stone Basin
    ctx.fillStyle = '#121824';
    ctx.strokeStyle = isReady ? '#06D6A0' : '#2A3447';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Sacred Amrita Water
    ctx.fillStyle = fluidColor;
    const ripple = 12 + Math.sin(this.animTimer) * 2;
    ctx.beginPath();
    ctx.arc(0, 0, ripple, 0, Math.PI * 2);
    ctx.fill();

    // Floating Prompt when ready
    if (isReady) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('[ E ] COMMUNE', 0, -28);
    }

    ctx.restore();
  }
}
