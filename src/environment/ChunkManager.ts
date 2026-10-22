import { AABB } from '../physics/AABB';
import { Camera } from '../render/Camera';
import { IEnvironmentObject, IWorldChunk, LODLevel } from './EnvironmentTypes';

export class ChunkManager {
  public readonly chunkSize: number;
  public readonly worldMinX: number;
  public readonly worldMinY: number;
  public readonly worldMaxX: number;
  public readonly worldMaxY: number;

  public readonly cols: number;
  public readonly rows: number;

  private chunks: Map<string, IWorldChunk> = new Map();
  private allObjects: Map<string, IEnvironmentObject> = new Map();

  // Instanced decorative elements stored per chunk
  private instancedGrass: Map<string, Array<{ x: number; y: number; height: number; swayOffset: number }>> = new Map();
  private instancedCobbles: Map<string, Array<{ x: number; y: number; radius: number; shade: string }>> = new Map();

  // Telemetry metrics
  public totalChunksCount = 0;
  public visibleChunksCount = 0;
  public totalObjectsCount = 0;
  public renderedObjectsCount = 0;
  public culledObjectsCount = 0;

  constructor(
    worldMinX = -2000,
    worldMinY = -1600,
    worldMaxX = 2000,
    worldMaxY = 1600,
    chunkSize = 500
  ) {
    this.worldMinX = worldMinX;
    this.worldMinY = worldMinY;
    this.worldMaxX = worldMaxX;
    this.worldMaxY = worldMaxY;
    this.chunkSize = chunkSize;

    this.cols = Math.ceil((worldMaxX - worldMinX) / chunkSize);
    this.rows = Math.ceil((worldMaxY - worldMinY) / chunkSize);

    this.initializeChunks();
  }

  private initializeChunks(): void {
    this.chunks.clear();
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = this.worldMinX + c * this.chunkSize;
        const y = this.worldMinY + r * this.chunkSize;
        const id = `chunk_${c}_${r}`;
        const bounds = new AABB(x, y, this.chunkSize, this.chunkSize);

        this.chunks.set(id, {
          id,
          gridX: c,
          gridY: r,
          bounds,
          objects: [],
          isVisible: false,
          lodLevel: LODLevel.LOD2_FAR,
        });

        this.instancedGrass.set(id, []);
        this.instancedCobbles.set(id, []);
      }
    }
    this.totalChunksCount = this.chunks.size;
  }

  public getChunkKey(c: number, r: number): string {
    return `chunk_${c}_${r}`;
  }

  public getChunkAtPosition(x: number, y: number): IWorldChunk | null {
    if (x < this.worldMinX || x >= this.worldMaxX || y < this.worldMinY || y >= this.worldMaxY) {
      return null;
    }
    const c = Math.floor((x - this.worldMinX) / this.chunkSize);
    const r = Math.floor((y - this.worldMinY) / this.chunkSize);
    return this.chunks.get(this.getChunkKey(c, r)) || null;
  }

  public addObject(obj: IEnvironmentObject): void {
    if (this.allObjects.has(obj.id)) {
      this.removeObject(obj.id);
    }

    this.allObjects.set(obj.id, obj);
    this.totalObjectsCount = this.allObjects.size;

    // Determine all intersecting chunks
    const minC = Math.max(0, Math.floor((obj.bounds.x - this.worldMinX) / this.chunkSize));
    const maxC = Math.min(this.cols - 1, Math.floor((obj.bounds.x + obj.bounds.width - this.worldMinX) / this.chunkSize));
    const minR = Math.max(0, Math.floor((obj.bounds.y - this.worldMinY) / this.chunkSize));
    const maxR = Math.min(this.rows - 1, Math.floor((obj.bounds.y + obj.bounds.height - this.worldMinY) / this.chunkSize));

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const chunk = this.chunks.get(this.getChunkKey(c, r));
        if (chunk && !chunk.objects.some(o => o.id === obj.id)) {
          chunk.objects.push(obj);
        }
      }
    }
  }

  public removeObject(id: string): void {
    const obj = this.allObjects.get(id);
    if (!obj) return;

    this.allObjects.delete(id);
    this.totalObjectsCount = this.allObjects.size;

    for (const chunk of this.chunks.values()) {
      const idx = chunk.objects.findIndex(o => o.id === id);
      if (idx !== -1) {
        chunk.objects.splice(idx, 1);
      }
    }
  }

  public addInstancedGrass(x: number, y: number, height = 12): void {
    const chunk = this.getChunkAtPosition(x, y);
    if (chunk) {
      const list = this.instancedGrass.get(chunk.id);
      if (list) {
        list.push({ x, y, height, swayOffset: Math.random() * Math.PI * 2 });
      }
    }
  }

  public addInstancedCobble(x: number, y: number, radius = 6, shade = '#3A4454'): void {
    const chunk = this.getChunkAtPosition(x, y);
    if (chunk) {
      const list = this.instancedCobbles.get(chunk.id);
      if (list) {
        list.push({ x, y, radius, shade });
      }
    }
  }

  public updateCullingAndLOD(camera: Camera): IWorldChunk[] {
    const visibleBounds = camera.getVisibleBounds();
    // Expand visible bounds by half-chunk padding for smooth pop-free streaming
    const pad = this.chunkSize * 0.5;
    const viewAABB = new AABB(
      visibleBounds.x - pad,
      visibleBounds.y - pad,
      visibleBounds.width + pad * 2,
      visibleBounds.height + pad * 2
    );

    const visibleChunks: IWorldChunk[] = [];
    const camPos = camera.position;

    this.visibleChunksCount = 0;
    this.renderedObjectsCount = 0;
    const seenObjects = new Set<string>();

    for (const chunk of this.chunks.values()) {
      if (chunk.bounds.intersects(viewAABB)) {
        chunk.isVisible = true;

        // Calculate distance from camera to chunk center
        const chunkCenterX = chunk.bounds.x + chunk.bounds.width / 2;
        const chunkCenterY = chunk.bounds.y + chunk.bounds.height / 2;
        const dist = Math.hypot(chunkCenterX - camPos.x, chunkCenterY - camPos.y);

        if (dist < 600) {
          chunk.lodLevel = LODLevel.LOD0_DETAILED;
        } else if (dist < 1400) {
          chunk.lodLevel = LODLevel.LOD1_MEDIUM;
        } else {
          chunk.lodLevel = LODLevel.LOD2_FAR;
        }

        visibleChunks.push(chunk);
        this.visibleChunksCount++;

        for (const obj of chunk.objects) {
          if (!seenObjects.has(obj.id)) {
            seenObjects.add(obj.id);
            this.renderedObjectsCount++;
          }
        }
      } else {
        chunk.isVisible = false;
        chunk.lodLevel = LODLevel.LOD2_FAR;
      }
    }

    this.culledObjectsCount = Math.max(0, this.totalObjectsCount - this.renderedObjectsCount);
    return visibleChunks;
  }

  public getObjectsInAABB(queryAABB: AABB): IEnvironmentObject[] {
    const minC = Math.max(0, Math.floor((queryAABB.x - this.worldMinX) / this.chunkSize));
    const maxC = Math.min(this.cols - 1, Math.floor((queryAABB.x + queryAABB.width - this.worldMinX) / this.chunkSize));
    const minR = Math.max(0, Math.floor((queryAABB.y - this.worldMinY) / this.chunkSize));
    const maxR = Math.min(this.rows - 1, Math.floor((queryAABB.y + queryAABB.height - this.worldMinY) / this.chunkSize));

    const matched = new Map<string, IEnvironmentObject>();
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const chunk = this.chunks.get(this.getChunkKey(c, r));
        if (chunk) {
          for (const obj of chunk.objects) {
            if (obj.bounds.intersects(queryAABB)) {
              matched.set(obj.id, obj);
            }
          }
        }
      }
    }
    return Array.from(matched.values());
  }

  public renderInstancedDecorations(
    ctx: CanvasRenderingContext2D,
    visibleChunks: IWorldChunk[],
    time: number
  ): void {
    for (const chunk of visibleChunks) {
      if (chunk.lodLevel === LODLevel.LOD2_FAR) continue;

      // 1. Cobblestones batch
      const cobbles = this.instancedCobbles.get(chunk.id);
      if (cobbles && cobbles.length > 0) {
        for (const cobble of cobbles) {
          ctx.fillStyle = cobble.shade;
          ctx.beginPath();
          ctx.arc(cobble.x, cobble.y, cobble.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Swaying grass tufts batch
      const grassList = this.instancedGrass.get(chunk.id);
      if (grassList && grassList.length > 0) {
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 1.5;
        for (const g of grassList) {
          const sway = Math.sin(time * 2.5 + g.swayOffset) * 4;
          ctx.beginPath();
          ctx.moveTo(g.x, g.y);
          ctx.quadraticCurveTo(g.x + sway * 0.5, g.y - g.height * 0.6, g.x + sway, g.y - g.height);
          ctx.stroke();
        }
      }
    }
  }

  public getAllObjects(): IEnvironmentObject[] {
    return Array.from(this.allObjects.values());
  }

  public getChunkList(): IWorldChunk[] {
    return Array.from(this.chunks.values());
  }
}
