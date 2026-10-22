import { Camera } from '../render/Camera';
import { WeatherPreset } from './EnvironmentTypes';

interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

export class AtmosphericSystem {
  private currentWeather: WeatherPreset = 'SOLAR_CLEAR';
  private particles: WeatherParticle[] = [];
  private maxParticles = 200;
  public isEnabled = true;

  constructor() {
    this.initParticles();
  }

  private initParticles(): void {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        vx: 0,
        vy: 0,
        size: 2,
        alpha: Math.random() * 0.7,
        life: Math.random() * 4,
        maxLife: 4,
        color: '#FFD700',
      });
    }
    this.reconfigureParticles();
  }

  public setWeather(preset: WeatherPreset): void {
    this.currentWeather = preset;
    this.reconfigureParticles();
  }

  public getWeather(): WeatherPreset {
    return this.currentWeather;
  }

  public cycleWeather(): WeatherPreset {
    const list: WeatherPreset[] = ['SOLAR_CLEAR', 'MONSOON_MIST', 'CHASM_EMBERS', 'VALLEY_WIND'];
    const idx = list.indexOf(this.currentWeather);
    const next = list[(idx + 1) % list.length];
    this.setWeather(next);
    return next;
  }

  private reconfigureParticles(): void {
    switch (this.currentWeather) {
      case 'SOLAR_CLEAR':
        // Golden sunlit motes gently floating
        for (const p of this.particles) {
          p.vx = (Math.random() - 0.5) * 15;
          p.vy = -10 - Math.random() * 15;
          p.size = 1.5 + Math.random() * 2;
          p.color = '#FFE066';
        }
        break;

      case 'MONSOON_MIST':
        // Fast diagonal rain streaks
        for (const p of this.particles) {
          p.vx = -120 - Math.random() * 40;
          p.vy = 450 + Math.random() * 150;
          p.size = 1.2;
          p.color = '#80D8FF';
        }
        break;

      case 'CHASM_EMBERS':
        // Rising volcanic sparks
        for (const p of this.particles) {
          p.vx = (Math.random() - 0.5) * 35;
          p.vy = -60 - Math.random() * 80;
          p.size = 2 + Math.random() * 3;
          p.color = Math.random() > 0.5 ? '#FF4500' : '#FFD700';
        }
        break;

      case 'VALLEY_WIND':
        // Floating autumn leaves / petals
        for (const p of this.particles) {
          p.vx = 80 + Math.random() * 60;
          p.vy = 10 + (Math.random() - 0.5) * 30;
          p.size = 3 + Math.random() * 3;
          p.color = Math.random() > 0.4 ? '#FF8C00' : '#4CAF50';
        }
        break;
    }
  }

  public update(dt: number, camera: Camera): void {
    if (!this.isEnabled) return;

    const bounds = camera.getVisibleBounds();
    const pad = 100;

    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;

      // Wrap particles around current camera viewport
      if (p.x < bounds.x - pad) p.x = bounds.x + bounds.width + pad;
      if (p.x > bounds.x + bounds.width + pad) p.x = bounds.x - pad;
      if (p.y < bounds.y - pad) p.y = bounds.y + bounds.height + pad;
      if (p.y > bounds.y + bounds.height + pad) p.y = bounds.y - pad;

      // Sinusoidal opacity oscillation
      p.alpha = 0.3 + 0.4 * Math.sin(p.life * 2);
    }
  }

  public render(ctx: CanvasRenderingContext2D, camera: Camera, time: number): void {
    if (!this.isEnabled) return;

    const bounds = camera.getVisibleBounds();
    ctx.save();

    // 1. Weather specific ambient overlay (e.g. God rays or Mist)
    if (this.currentWeather === 'SOLAR_CLEAR') {
      // Crepuscular Solar God Rays (diagonal light shafts)
      ctx.globalAlpha = 0.08 + 0.04 * Math.sin(time * 0.8);
      ctx.fillStyle = '#FFF8E1';
      for (let i = -2; i < 6; i++) {
        const xOffset = bounds.x + i * 280 + Math.sin(time * 0.5 + i) * 30;
        ctx.beginPath();
        ctx.moveTo(xOffset, bounds.y - 100);
        ctx.lineTo(xOffset + 140, bounds.y - 100);
        ctx.lineTo(xOffset - 100, bounds.y + bounds.height + 100);
        ctx.lineTo(xOffset - 240, bounds.y + bounds.height + 100);
        ctx.closePath();
        ctx.fill();
      }
    } else if (this.currentWeather === 'MONSOON_MIST') {
      // Rolling volumetric ground mist
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#B0BEC5';
      const mistOffset = Math.sin(time * 0.4) * 80;
      ctx.beginPath();
      ctx.ellipse(
        bounds.x + bounds.width / 2 + mistOffset,
        bounds.y + bounds.height * 0.7,
        bounds.width * 0.7,
        bounds.height * 0.35,
        0, 0, Math.PI * 2
      );
      ctx.fill();
    }

    // 2. Weather particles rendering
    for (const p of this.particles) {
      if (
        p.x < bounds.x ||
        p.x > bounds.x + bounds.width ||
        p.y < bounds.y ||
        p.y > bounds.y + bounds.height
      ) {
        continue;
      }

      ctx.globalAlpha = Math.max(0.1, Math.min(1.0, p.alpha));

      if (this.currentWeather === 'MONSOON_MIST') {
        // Render rain streak
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 6, p.y + 16);
        ctx.stroke();
      } else {
        // Render particle dot or leaf
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
