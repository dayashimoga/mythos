import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';

export interface CloudPuff {
  position: Vector2D;
  radius: number;
  opacity: number;
}

export class AtmosphericScatter {
  public solarElevationAngle = Math.PI / 4; // 45 degrees
  public windVelocity = new Vector2D(28, 6);
  public clouds: CloudPuff[] = [];
  public worldWidth = 1400;
  public worldHeight = 900;
  public enabled = true;

  constructor(cloudCount = 18) {
    this.initClouds(cloudCount);
  }

  private initClouds(count: number): void {
    this.clouds = [];
    for (let i = 0; i < count; i++) {
      this.clouds.push({
        position: new Vector2D(Math.random() * this.worldWidth, Math.random() * this.worldHeight),
        radius: 60 + Math.random() * 80,
        opacity: 0.15 + Math.random() * 0.2,
      });
    }
  }

  public update(dt: number): void {
    if (!this.enabled) return;

    for (const c of this.clouds) {
      c.position = c.position.add(this.windVelocity.multiply(dt));

      // Wrap around world boundary
      if (c.position.x - c.radius > this.worldWidth) {
        c.position.x = -c.radius;
        c.position.y = Math.random() * this.worldHeight;
      }
    }
  }

  public calculateRayleighSkyColor(): { topColor: string; bottomColor: string } {
    // Solar angle [0 (sunset) to PI/2 (noon)]
    const sinElevation = Math.max(0, Math.sin(this.solarElevationAngle));

    if (sinElevation > 0.6) {
      // Clear midday celestial blue
      return { topColor: '#0a1d37', bottomColor: '#1e3d59' };
    } else if (sinElevation > 0.2) {
      // Golden twilight / Vedic amber
      return { topColor: '#2b1b3d', bottomColor: '#f77f00' };
    } else {
      // Deep Brahmic night
      return { topColor: '#03071e', bottomColor: '#10002b' };
    }
  }

  public render(renderer: IRenderer): void {
    if (!this.enabled) return;

    const ctx = renderer.getContext();
    ctx.save();

    // Render projected cloud shadows onto ground terrain
    ctx.globalCompositeOperation = 'source-over';
    for (const c of this.clouds) {
      ctx.fillStyle = `rgba(10, 15, 25, ${c.opacity})`;
      ctx.beginPath();
      // Elliptical shadow projection
      ctx.ellipse(c.position.x, c.position.y, c.radius * 1.3, c.radius * 0.8, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
