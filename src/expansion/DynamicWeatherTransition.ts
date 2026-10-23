import { IRenderer } from '../render/CanvasRenderer';
import { Vector2D } from '../physics/Vector2D';

export type WeatherState =
  | 'CLEAR'
  | 'MONSOON_RAIN'
  | 'VOLCANIC_FALLOUT'
  | 'ABYSSAL_MIST'
  | 'CELESTIAL_SOLAR_STORM';

export interface LightningStrike {
  start: Vector2D;
  end: Vector2D;
  branches: Array<{ start: Vector2D; end: Vector2D }>;
  life: number;
  maxLife: number;
}

export class DynamicWeatherTransition {
  public currentState: WeatherState = 'CLEAR';
  public targetState: WeatherState = 'CLEAR';
  public transitionProgress = 1.0; // 0 to 1
  public transitionDuration = 3.0; // Seconds to blend

  public fogDensity = 0.1;
  public fogOffset = 0;
  public lightningStrikes: LightningStrike[] = [];
  public screenFlashAlpha = 0;

  constructor(initialState: WeatherState = 'CLEAR') {
    this.currentState = initialState;
    this.targetState = initialState;
  }

  public transitionTo(newWeather: WeatherState, duration = 3.0): void {
    if (newWeather === this.currentState && this.transitionProgress >= 1.0) return;
    this.targetState = newWeather;
    this.transitionDuration = duration;
    this.transitionProgress = 0.0;
  }

  public update(dt: number): void {
    if (this.transitionProgress < 1.0) {
      this.transitionProgress = Math.min(1.0, this.transitionProgress + dt / this.transitionDuration);
      if (this.transitionProgress >= 1.0) {
        this.currentState = this.targetState;
      }
    }

    this.fogOffset += dt * 25;

    // Fade screen flash
    if (this.screenFlashAlpha > 0) {
      this.screenFlashAlpha = Math.max(0, this.screenFlashAlpha - dt * 2.5);
    }

    // Update lightning
    for (let i = this.lightningStrikes.length - 1; i >= 0; i--) {
      const ls = this.lightningStrikes[i];
      ls.life -= dt;
      if (ls.life <= 0) {
        this.lightningStrikes.splice(i, 1);
      }
    }

    // Random lightning trigger during storms
    if (
      (this.currentState === 'CELESTIAL_SOLAR_STORM' || this.currentState === 'MONSOON_RAIN') &&
      Math.random() < 0.02
    ) {
      this.triggerLightning(new Vector2D(Math.random() * 800, 20), new Vector2D(Math.random() * 800, 500));
    }
  }

  public triggerLightning(start: Vector2D, end: Vector2D): void {
    const branches: Array<{ start: Vector2D; end: Vector2D }> = [];
    const midX = (start.x + end.x) / 2 + (Math.random() - 0.5) * 80;
    const midY = (start.y + end.y) / 2;
    const mid = new Vector2D(midX, midY);

    branches.push({ start, end: mid });
    branches.push({ start: mid, end });

    // Side fork
    const forkEnd = new Vector2D(mid.x + (Math.random() - 0.5) * 60, mid.y + 40);
    branches.push({ start: mid, end: forkEnd });

    this.lightningStrikes.push({
      start,
      end,
      branches,
      life: 0.16,
      maxLife: 0.16,
    });

    this.screenFlashAlpha = 0.35;
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    const vp = renderer.getViewport();

    // Render Volumetric Fog layer
    if (this.currentState === 'ABYSSAL_MIST' || this.targetState === 'ABYSSAL_MIST') {
      const fogAlpha = 0.3 * (this.currentState === 'ABYSSAL_MIST' ? 1.0 : this.transitionProgress);
      ctx.save();
      ctx.fillStyle = `rgba(10, 40, 25, ${fogAlpha})`;
      ctx.fillRect(vp.x, vp.y, vp.width, vp.height);
      ctx.restore();
    }

    // Render Lightning
    if (this.lightningStrikes.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00f5d4';
      ctx.shadowBlur = 12;

      for (const ls of this.lightningStrikes) {
        for (const b of ls.branches) {
          ctx.beginPath();
          ctx.moveTo(b.start.x, b.start.y);
          ctx.lineTo(b.end.x, b.end.y);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Screen flash
    if (this.screenFlashAlpha > 0.01) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${this.screenFlashAlpha})`;
      ctx.fillRect(vp.x, vp.y, vp.width, vp.height);
      ctx.restore();
    }
  }
}
