import { Entity } from './Entity';
import { IRenderer } from '../render/CanvasRenderer';
import { SacredGeometry } from '../render/SacredGeometry';

export type AltarState = 'dormant' | 'attuning' | 'consecrated';

export class Altar extends Entity {
  public state: AltarState = 'dormant';
  public shardsDeposited = 0;
  public totalRequired = 3;
  private rotationAngle = 0;
  private bloomRadius = 0;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 96, 96, 'altar');
  }

  public depositShard(): boolean {
    if (this.shardsDeposited < this.totalRequired) {
      this.shardsDeposited++;
      if (this.shardsDeposited >= this.totalRequired) {
        this.state = 'consecrated';
      } else {
        this.state = 'attuning';
      }
      return true;
    }
    return false;
  }

  public update(dt: number): void {
    if (this.state === 'attuning') {
      this.rotationAngle += dt * 0.8;
    } else if (this.state === 'consecrated') {
      this.rotationAngle += dt * 2.2;
      this.bloomRadius = Math.min(140, this.bloomRadius + dt * 100);
    }
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    // Stone base platform
    ctx.fillStyle = '#121824';
    ctx.strokeStyle = '#1F1A24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Sacred concentric rings
    const ringColor =
      this.state === 'consecrated' ? '#FFB703' : this.state === 'attuning' ? '#00E5FF' : '#495057';

    SacredGeometry.drawMandala(ctx, 0, 0, 44, 8, this.rotationAngle, ringColor, 1.5);

    if (this.state === 'consecrated') {
      // Counter rotating inner ring
      SacredGeometry.drawMandala(ctx, 0, 0, 28, 6, -this.rotationAngle * 1.5, '#FFD166', 2);
      // Expanding aura
      ctx.strokeStyle = 'rgba(255, 183, 3, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.bloomRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3 Shard Slots / Nodes
    for (let i = 0; i < this.totalRequired; i++) {
      const angle = (i * Math.PI * 2) / this.totalRequired - Math.PI / 2;
      const nx = Math.cos(angle) * 32;
      const ny = Math.sin(angle) * 32;

      ctx.beginPath();
      ctx.arc(nx, ny, 6, 0, Math.PI * 2);
      if (i < this.shardsDeposited) {
        ctx.fillStyle = '#FFB703';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
      } else {
        ctx.fillStyle = '#080C14';
        ctx.fill();
        ctx.strokeStyle = '#495057';
      }
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Center Core Gem
    ctx.fillStyle = this.state === 'consecrated' ? '#FFFFFF' : ringColor;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
