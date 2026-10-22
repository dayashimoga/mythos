import { Entity } from './Entity';
import { IRenderer } from '../render/CanvasRenderer';
import { SacredGeometry } from '../render/SacredGeometry';

export type PillarState = 'dormant' | 'attuned';

export class ResonancePillar extends Entity {
  public state: PillarState = 'dormant';
  public runeSymbol: string;
  private glowTimer = 0;
  private pulseRadius = 0;

  constructor(id: string, x: number, y: number, runeSymbol = 'ॐ') {
    super(id, x, y, 40, 60, 'pillar');
    this.runeSymbol = runeSymbol;
  }

  public attune(): boolean {
    if (this.state === 'dormant') {
      this.state = 'attuned';
      this.pulseRadius = 60;
      return true;
    }
    return false;
  }

  public update(dt: number): void {
    this.glowTimer += dt * 2;
    if (this.pulseRadius > 0) {
      this.pulseRadius = Math.max(0, this.pulseRadius - dt * 40);
    }
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    const isAttuned = this.state === 'attuned';
    const mainColor = isAttuned ? '#FFB703' : '#8338EC';
    const glowColor = isAttuned ? '#FFD166' : '#C77DFF';

    // Stone Pillar Pedestal
    ctx.fillStyle = '#121824';
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-16, -28, 32, 56, 4);
    ctx.fill();
    ctx.stroke();

    // Sacred Inscribed Rune
    SacredGeometry.drawRuneInscription(ctx, this.runeSymbol, 0, 0, glowColor, mainColor);

    // Rotating Harmonic Capstone
    const capAngle = isAttuned ? this.glowTimer : 0;
    SacredGeometry.drawMandala(ctx, 0, -28, 14, 6, capAngle, mainColor, 1.5);

    // Harmonic Attunement Wave
    if (this.pulseRadius > 0) {
      ctx.strokeStyle = '#FFD166';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.pulseRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
