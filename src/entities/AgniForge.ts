import { Entity } from './Entity';
import { IRenderer } from '../render/CanvasRenderer';
import { SacredGeometry } from '../render/SacredGeometry';

export class AgniForge extends Entity {
  public isConsecrated = false;
  private glowAngle = 0;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 44, 44, 'forge');
  }

  public consecrate(): boolean {
    if (!this.isConsecrated) {
      this.isConsecrated = true;
      return true;
    }
    return false;
  }

  public update(dt: number): void {
    this.glowAngle += dt * 2.5;
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    const forgeColor = this.isConsecrated ? '#FFB703' : '#FB8500';

    // Sacred Anvil Base
    ctx.fillStyle = '#121824';
    ctx.strokeStyle = forgeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-18, -14, 36, 28, 4);
    ctx.fill();
    ctx.stroke();

    // Flaming Core Anvil
    SacredGeometry.drawSriYantraCentral(ctx, 0, 0, 14, forgeColor, 0.9);

    if (!this.isConsecrated) {
      ctx.fillStyle = '#FFD166';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('[ E ] FORGE STANCE', 0, -22);
    } else {
      ctx.fillStyle = '#06D6A0';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('STANCE CONSECRATED', 0, -22);
    }

    ctx.restore();
  }
}
