import { Camera } from '../render/Camera';
import { ILightSource, TimeOfDayPreset } from './EnvironmentTypes';

export interface AmbientConfig {
  color: string;
  lightFactor: number;
  skyColor: string;
  shadowAngle: number;
  label: string;
}

export const TIME_PRESETS: Record<TimeOfDayPreset, AmbientConfig> = {
  DAWN: {
    color: 'rgba(26, 18, 38, 0.60)',
    lightFactor: 0.40,
    skyColor: '#FFAA55',
    shadowAngle: Math.PI * 0.35,
    label: 'Dawn (Usha)',
  },
  NOON: {
    color: 'rgba(24, 34, 56, 0.15)',
    lightFactor: 0.85,
    skyColor: '#FFFDF0',
    shadowAngle: Math.PI * 0.50,
    label: 'Noon (Surya)',
  },
  SUNSET: {
    color: 'rgba(38, 12, 26, 0.50)',
    lightFactor: 0.50,
    skyColor: '#FF5533',
    shadowAngle: Math.PI * 0.65,
    label: 'Sunset (Sandhya)',
  },
  NIGHT: {
    color: 'rgba(6, 9, 20, 0.85)',
    lightFactor: 0.15,
    skyColor: '#4466AA',
    shadowAngle: 0,
    label: 'Night (Ratri)',
  },
  ECLIPSE: {
    color: 'rgba(18, 3, 10, 0.78)',
    lightFactor: 0.22,
    skyColor: '#EF476F',
    shadowAngle: Math.PI * 0.25,
    label: 'Eclipse (Grahana)',
  },
};

export class LightingEngine {
  private lights: Map<string, ILightSource> = new Map();
  private currentTimeOfDay: TimeOfDayPreset = 'NOON';
  public isEnabled = true;

  constructor() {}

  public setTimeOfDay(preset: TimeOfDayPreset): void {
    this.currentTimeOfDay = preset;
  }

  public getTimeOfDay(): TimeOfDayPreset {
    return this.currentTimeOfDay;
  }

  public getAmbientConfig(): AmbientConfig {
    return TIME_PRESETS[this.currentTimeOfDay];
  }

  public cycleTimeOfDay(): TimeOfDayPreset {
    const sequence: TimeOfDayPreset[] = ['DAWN', 'NOON', 'SUNSET', 'NIGHT', 'ECLIPSE'];
    const idx = sequence.indexOf(this.currentTimeOfDay);
    const next = sequence[(idx + 1) % sequence.length];
    this.setTimeOfDay(next);
    return next;
  }

  public addLight(light: ILightSource): void {
    this.lights.set(light.id, light);
  }

  public removeLight(id: string): void {
    this.lights.delete(id);
  }

  public getLight(id: string): ILightSource | undefined {
    return this.lights.get(id);
  }

  public getAllLights(): ILightSource[] {
    return Array.from(this.lights.values());
  }

  public clearLights(): void {
    this.lights.clear();
  }

  /**
   * Evaluates dynamic flicker scale for flame-based point lights
   */
  public getFlickerScale(light: ILightSource, time: number): number {
    if (!light.flickerSpeed) return 1.0;
    const speed = light.flickerSpeed;
    const amount = light.flickerAmount ?? 0.08;
    // Composite multi-frequency harmonic sinusoidal flicker
    const noise = Math.sin(time * speed) * 0.6 + Math.cos(time * speed * 2.13) * 0.4;
    return 1.0 + noise * amount;
  }

  /**
   * Renders the 2D lighting mask over the world viewport
   */
  public renderLightingPass(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    time: number
  ): void {
    if (!this.isEnabled) return;

    const ambient = this.getAmbientConfig();
    const bounds = camera.getVisibleBounds();

    // In midday, ambient is very bright, but we still apply soft warm sunlight shading
    ctx.save();

    // 1. Fill visible viewport with ambient darkness/tint
    ctx.fillStyle = ambient.color;
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

    // 2. Cut out radial illumination spheres for point lights using 'destination-out'
    ctx.globalCompositeOperation = 'destination-out';

    for (const light of this.lights.values()) {
      const flicker = this.getFlickerScale(light, time);
      const radius = light.radius * flicker;

      // Frustum test for light sphere
      if (
        light.x + radius < bounds.x ||
        light.x - radius > bounds.x + bounds.width ||
        light.y + radius < bounds.y ||
        light.y - radius > bounds.y + bounds.height
      ) {
        continue;
      }

      const grad = ctx.createRadialGradient(
        light.x, light.y, 0,
        light.x, light.y, radius
      );
      // Soft falloff curve
      grad.addColorStop(0, `rgba(0, 0, 0, ${Math.min(1.0, light.intensity)})`);
      grad.addColorStop(0.5, `rgba(0, 0, 0, ${light.intensity * 0.5})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(light.x, light.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Additive warm luminescence overlay
    ctx.globalCompositeOperation = 'lighter';
    for (const light of this.lights.values()) {
      const flicker = this.getFlickerScale(light, time);
      const radius = light.radius * 0.45 * flicker;

      if (
        light.x + radius < bounds.x ||
        light.x - radius > bounds.x + bounds.width ||
        light.y + radius < bounds.y ||
        light.y - radius > bounds.y + bounds.height
      ) {
        continue;
      }

      const glowGrad = ctx.createRadialGradient(
        light.x, light.y, 0,
        light.x, light.y, radius
      );
      glowGrad.addColorStop(0, light.color);
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(light.x, light.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
