import { Camera } from './Camera';

export interface BatchStats {
  drawnCount: number;
  culledCount: number;
}

export class RenderBatcher {
  private static instance: RenderBatcher;
  private drawnCount = 0;
  private culledCount = 0;

  private constructor() {}

  public static getInstance(): RenderBatcher {
    if (!RenderBatcher.instance) {
      RenderBatcher.instance = new RenderBatcher();
    }
    return RenderBatcher.instance;
  }

  public resetStats(): void {
    this.drawnCount = 0;
    this.culledCount = 0;
  }

  public getStats(): BatchStats {
    return {
      drawnCount: this.drawnCount,
      culledCount: this.culledCount,
    };
  }

  /**
   * Fast AABB frustum visibility test against camera viewport.
   */
  public isBoxVisible(
    camera: Camera,
    worldX: number,
    worldY: number,
    width: number,
    height: number,
    margin = 100
  ): boolean {
    const camPos = camera.getPosition();
    const halfW = (camera.viewportWidth / 2) + margin;
    const halfH = (camera.viewportHeight / 2) + margin;

    const left = camPos.x - halfW;
    const right = camPos.x + halfW;
    const top = camPos.y - halfH;
    const bottom = camPos.y + halfH;

    const boxRight = worldX + width;
    const boxBottom = worldY + height;

    const isVisible = !(boxRight < left || worldX > right || boxBottom < top || worldY > bottom);

    if (isVisible) {
      this.drawnCount++;
    } else {
      this.culledCount++;
    }

    return isVisible;
  }

  /**
   * Fast point visibility test.
   */
  public isPointVisible(
    camera: Camera,
    worldX: number,
    worldY: number,
    margin = 100
  ): boolean {
    const camPos = camera.getPosition();
    const halfW = (camera.viewportWidth / 2) + margin;
    const halfH = (camera.viewportHeight / 2) + margin;

    const left = camPos.x - halfW;
    const right = camPos.x + halfW;
    const top = camPos.y - halfH;
    const bottom = camPos.y + halfH;

    const isVisible = worldX >= left && worldX <= right && worldY >= top && worldY <= bottom;

    if (isVisible) {
      this.drawnCount++;
    } else {
      this.culledCount++;
    }

    return isVisible;
  }

  /**
   * Batched particle quad drawer that groups particles sharing color and blend mode
   * to reduce context state thrashing.
   */
  public batchDrawParticles(
    ctx: CanvasRenderingContext2D,
    particles: Array<{ x: number; y: number; radius: number; color: string; alpha: number }>
  ): void {
    if (particles.length === 0) return;

    // Group by color
    const groups = new Map<string, Array<{ x: number; y: number; radius: number; alpha: number }>>();

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.alpha <= 0.01) continue;
      let group = groups.get(p.color);
      if (!group) {
        group = [];
        groups.set(p.color, group);
      }
      group.push({ x: p.x, y: p.y, radius: p.radius, alpha: p.alpha });
    }

    // Render group by group
    groups.forEach((items, color) => {
      ctx.fillStyle = color;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        ctx.globalAlpha = item.alpha;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.globalAlpha = 1.0;
  }
}
