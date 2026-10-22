import { IRenderer } from './CanvasRenderer';

export interface DamageNumber {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  vy: number;
  active: boolean;
  scale: number;
}

export class DamageNumberSystem {
  private numbers: DamageNumber[];
  private maxNumbers: number;

  constructor(maxNumbers = 60) {
    this.maxNumbers = maxNumbers;
    this.numbers = new Array(maxNumbers);
    for (let i = 0; i < maxNumbers; i++) {
      this.numbers[i] = {
        x: 0,
        y: 0,
        text: '',
        color: '#FFB703',
        alpha: 1,
        life: 0,
        maxLife: 0.8,
        vy: -60,
        active: false,
        scale: 1,
      };
    }
  }

  public spawn(x: number, y: number, text: string, color = '#FFB703', scale = 1): void {
    // Slight random horizontal scatter
    const offsetX = (Math.random() - 0.5) * 16;
    for (let i = 0; i < this.maxNumbers; i++) {
      const d = this.numbers[i];
      if (!d.active) {
        d.x = x + offsetX;
        d.y = y - 10;
        d.text = text;
        d.color = color;
        d.alpha = 1;
        d.life = 0.75;
        d.maxLife = 0.75;
        d.vy = -65;
        d.scale = scale;
        d.active = true;
        return;
      }
    }
  }

  public update(dt: number): void {
    for (let i = 0; i < this.maxNumbers; i++) {
      const d = this.numbers[i];
      if (d.active) {
        d.life -= dt;
        if (d.life <= 0) {
          d.active = false;
        } else {
          d.y += d.vy * dt;
          d.vy += 80 * dt; // Gentle deceleration
          d.alpha = Math.max(0, d.life / d.maxLife);
        }
      }
    }
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    for (let i = 0; i < this.maxNumbers; i++) {
      const d = this.numbers[i];
      if (d.active) {
        ctx.save();
        ctx.globalAlpha = d.alpha;
        ctx.font = `bold ${Math.round(14 * d.scale)}px "Outfit", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = d.color;
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(d.text, d.x, d.y);
        ctx.restore();
      }
    }
  }

  public clear(): void {
    for (let i = 0; i < this.maxNumbers; i++) {
      this.numbers[i].active = false;
    }
  }

  public getActiveCount(): number {
    return this.numbers.filter((n) => n.active).length;
  }
}
