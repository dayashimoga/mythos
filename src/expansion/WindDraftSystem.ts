import { Vector2D } from '../physics/Vector2D';
import { AABB } from '../physics/AABB';
import { IRenderer } from '../render/CanvasRenderer';

export type DraftZoneType = 'HORIZONTAL_GALE' | 'THERMAL_UPDRAFT' | 'VORTEX_SINK';

export interface WindZone {
  id: string;
  bounds: AABB;
  type: DraftZoneType;
  baseForce: Vector2D;
  turbulenceFreq: number;
}

export class WindDraftSystem {
  public zones: WindZone[] = [];
  private time = 0;

  constructor() {
    this.initDefaultZones();
  }

  private initDefaultZones(): void {
    // Updraft elevator zone
    this.zones.push({
      id: 'updraft_central_chasm',
      bounds: new AABB(300, 150, 160, 400),
      type: 'THERMAL_UPDRAFT',
      baseForce: new Vector2D(0, -320),
      turbulenceFreq: 3.2,
    });

    // Horizontal crosswind corridor
    this.zones.push({
      id: 'crosswind_sky_bridge',
      bounds: new AABB(500, 200, 450, 120),
      type: 'HORIZONTAL_GALE',
      baseForce: new Vector2D(220, 0),
      turbulenceFreq: 2.5,
    });
  }

  public addZone(zone: WindZone): void {
    this.zones.push(zone);
  }

  public update(dt: number): void {
    this.time += dt;
  }

  public calculateWindForceAt(pos: Vector2D): Vector2D {
    let totalForce = new Vector2D(0, 0);

    for (const z of this.zones) {
      if (z.bounds.containsPoint(pos.x, pos.y)) {
        const turbulence = Math.sin(this.time * z.turbulenceFreq + pos.x * 0.02) * 0.25;
        const currentForce = z.baseForce.multiply(1 + turbulence);
        totalForce = totalForce.add(currentForce);
      }
    }

    return totalForce;
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    ctx.save();

    for (const z of this.zones) {
      if (z.type === 'THERMAL_UPDRAFT') {
        renderer.drawRect(
          z.bounds.x,
          z.bounds.y,
          z.bounds.width,
          z.bounds.height,
          'rgba(180, 240, 255, 0.12)',
          'rgba(120, 210, 255, 0.4)'
        );

        // Animated updraft arrows
        ctx.strokeStyle = 'rgba(200, 245, 255, 0.6)';
        ctx.lineWidth = 1.5;
        const lineCount = 4;
        for (let i = 0; i < lineCount; i++) {
          const lx = z.bounds.x + ((i + 0.5) / lineCount) * z.bounds.width;
          const phase = (this.time * 200 + i * 80) % z.bounds.height;
          const ly = z.bounds.y + z.bounds.height - phase;

          ctx.beginPath();
          ctx.moveTo(lx, ly);
          ctx.lineTo(lx, Math.max(z.bounds.y, ly - 35));
          ctx.stroke();
        }
      } else if (z.type === 'HORIZONTAL_GALE') {
        renderer.drawRect(
          z.bounds.x,
          z.bounds.y,
          z.bounds.width,
          z.bounds.height,
          'rgba(230, 250, 255, 0.1)',
          'rgba(180, 230, 255, 0.35)'
        );
      }
    }

    ctx.restore();
  }
}
