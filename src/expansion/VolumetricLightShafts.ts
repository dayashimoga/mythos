import { IRenderer } from '../render/CanvasRenderer';
import { Vector2D } from '../physics/Vector2D';

export interface LightShaftBeam {
  origin: Vector2D;
  angle: number;
  length: number;
  width: number;
  color: string;
  intensity: number;
  decay: number;
}

export interface DustMote {
  position: Vector2D;
  velocity: Vector2D;
  radius: number;
  alpha: number;
  pulseSpeed: number;
}

export class VolumetricLightShafts {
  public beams: LightShaftBeam[] = [];
  public dustMotes: DustMote[] = [];
  public enabled = true;
  private time = 0;

  constructor(beamCount = 4, moteCount = 30) {
    this.initBeams(beamCount);
    this.initDustMotes(moteCount);
  }

  private initBeams(count: number): void {
    this.beams = [];
    for (let i = 0; i < count; i++) {
      this.beams.push({
        origin: new Vector2D(150 + i * 220, 0),
        angle: (Math.PI / 3) + (i % 2 === 0 ? 0.08 : -0.05),
        length: 700,
        width: 65 + (i % 3) * 20,
        color: 'rgba(255, 230, 160, 0.18)',
        intensity: 0.8,
        decay: 0.0015,
      });
    }
  }

  private initDustMotes(count: number): void {
    this.dustMotes = [];
    for (let i = 0; i < count; i++) {
      this.dustMotes.push({
        position: new Vector2D(Math.random() * 1200, Math.random() * 800),
        velocity: new Vector2D((Math.random() - 0.5) * 8, 10 + Math.random() * 15),
        radius: 1 + Math.random() * 2,
        alpha: 0.2 + Math.random() * 0.6,
        pulseSpeed: 1 + Math.random() * 3,
      });
    }
  }

  public update(dt: number): void {
    if (!this.enabled) return;
    this.time += dt;

    // Animate subtle swaying angles
    for (let i = 0; i < this.beams.length; i++) {
      const b = this.beams[i];
      b.angle += Math.sin(this.time * 0.5 + i) * 0.0008;
    }

    // Drift dust motes through beams
    for (const mote of this.dustMotes) {
      mote.position = mote.position.add(mote.velocity.multiply(dt));
      mote.alpha = 0.3 + 0.3 * Math.sin(this.time * mote.pulseSpeed);

      if (mote.position.y > 900) {
        mote.position.y = -10;
        mote.position.x = Math.random() * 1200;
      }
    }
  }

  public render(renderer: IRenderer): void {
    if (!this.enabled) return;
    const ctx = renderer.getContext();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const b of this.beams) {
      const endX = b.origin.x + Math.cos(b.angle) * b.length;
      const endY = b.origin.y + Math.sin(b.angle) * b.length;

      // Polygonal beam frustum
      const perpX = -Math.sin(b.angle);
      const perpY = Math.cos(b.angle);

      const topHalf = b.width * 0.3;
      const bottomHalf = b.width * 1.6;

      ctx.beginPath();
      ctx.moveTo(b.origin.x - perpX * topHalf, b.origin.y - perpY * topHalf);
      ctx.lineTo(b.origin.x + perpX * topHalf, b.origin.y + perpY * topHalf);
      ctx.lineTo(endX + perpX * bottomHalf, endY + perpY * bottomHalf);
      ctx.lineTo(endX - perpX * bottomHalf, endY - perpY * bottomHalf);
      ctx.closePath();

      const grad = ctx.createLinearGradient(b.origin.x, b.origin.y, endX, endY);
      grad.addColorStop(0, 'rgba(255, 235, 170, 0.35)');
      grad.addColorStop(0.5, 'rgba(255, 215, 130, 0.15)');
      grad.addColorStop(1, 'rgba(255, 200, 100, 0.0)');

      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Render illuminated dust motes
    for (const mote of this.dustMotes) {
      ctx.fillStyle = `rgba(255, 245, 200, ${mote.alpha})`;
      ctx.beginPath();
      ctx.arc(mote.position.x, mote.position.y, mote.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
