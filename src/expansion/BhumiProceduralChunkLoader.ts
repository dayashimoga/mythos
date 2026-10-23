import { AABB } from '../physics/AABB';
import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';

export type BhumiRoomType =
  | 'ENTRANCE'
  | 'SUNKEN_SANCTUM'
  | 'PILLAR_HALL'
  | 'LAVA_TRENCH'
  | 'ASTRA_VAULT'
  | 'BOSS_ARENA';

export interface RoomSpawnPoint {
  position: Vector2D;
  entityType: 'SENTINEL' | 'VANARA_SCOUT' | 'STONE_RAKHASA' | 'VOID_ARCHER' | 'AMRITA_FONT';
}

export interface BhumiRoomChunk {
  chunkX: number;
  chunkY: number;
  worldBounds: AABB;
  roomType: BhumiRoomType;
  walls: AABB[];
  hazards: AABB[];
  spawnPoints: RoomSpawnPoint[];
  brazierPositions: Vector2D[];
  cleared: boolean;
}

export class BhumiProceduralChunkLoader {
  public readonly chunkSize: number;
  public readonly seed: number;
  private loadedChunks = new Map<string, BhumiRoomChunk>();
  private activeChunkCoords: Set<string> = new Set();

  constructor(chunkSize = 600, seed = 108) {
    this.chunkSize = chunkSize;
    this.seed = seed;
  }

  private coordKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  private pseudoRandom(x: number, y: number, offset = 0): number {
    const s = Math.sin(x * 12.9898 + y * 78.233 + (this.seed + offset) * 37.719) * 43758.5453;
    return s - Math.floor(s);
  }

  public generateChunk(cx: number, cy: number): BhumiRoomChunk {
    const key = this.coordKey(cx, cy);
    const existing = this.loadedChunks.get(key);
    if (existing) return existing;

    const originX = cx * this.chunkSize;
    const originY = cy * this.chunkSize;
    const bounds = new AABB(originX, originY, this.chunkSize, this.chunkSize);

    // Pick room type deterministically
    const r = this.pseudoRandom(cx, cy);
    let roomType: BhumiRoomType = 'SUNKEN_SANCTUM';
    if (cx === 0 && cy === 0) {
      roomType = 'ENTRANCE';
    } else if (Math.abs(cx) === 2 && Math.abs(cy) === 2) {
      roomType = 'BOSS_ARENA';
    } else if (r < 0.25) {
      roomType = 'PILLAR_HALL';
    } else if (r < 0.5) {
      roomType = 'LAVA_TRENCH';
    } else if (r < 0.75) {
      roomType = 'ASTRA_VAULT';
    }

    const walls: AABB[] = [];
    const hazards: AABB[] = [];
    const spawnPoints: RoomSpawnPoint[] = [];
    const brazierPositions: Vector2D[] = [];

    // Perimeter pillars/walls with open corridors
    const wallThick = 24;
    const half = this.chunkSize / 2;
    const doorWidth = 120;

    // Top wall with doorway
    walls.push(new AABB(originX, originY, half - doorWidth / 2, wallThick));
    walls.push(new AABB(originX + half + doorWidth / 2, originY, half - doorWidth / 2, wallThick));

    // Bottom wall with doorway
    walls.push(new AABB(originX, originY + this.chunkSize - wallThick, half - doorWidth / 2, wallThick));
    walls.push(new AABB(originX + half + doorWidth / 2, originY + this.chunkSize - wallThick, half - doorWidth / 2, wallThick));

    // Room interior features based on type
    switch (roomType) {
      case 'PILLAR_HALL': {
        const pillarSpacing = 160;
        for (let px = originX + 120; px <= originX + this.chunkSize - 120; px += pillarSpacing) {
          for (let py = originY + 120; py <= originY + this.chunkSize - 120; py += pillarSpacing) {
            walls.push(new AABB(px - 20, py - 20, 40, 40));
            brazierPositions.push(new Vector2D(px, py - 30));
          }
        }
        spawnPoints.push({ position: new Vector2D(originX + half, originY + half), entityType: 'STONE_RAKHASA' });
        spawnPoints.push({ position: new Vector2D(originX + 100, originY + 100), entityType: 'VOID_ARCHER' });
        break;
      }
      case 'LAVA_TRENCH': {
        hazards.push(new AABB(originX + 80, originY + half - 30, this.chunkSize - 160, 60));
        spawnPoints.push({ position: new Vector2D(originX + 120, originY + 100), entityType: 'VANARA_SCOUT' });
        spawnPoints.push({ position: new Vector2D(originX + this.chunkSize - 120, originY + this.chunkSize - 100), entityType: 'VANARA_SCOUT' });
        break;
      }
      case 'ASTRA_VAULT': {
        walls.push(new AABB(originX + half - 60, originY + half - 60, 120, 20));
        spawnPoints.push({ position: new Vector2D(originX + half, originY + half), entityType: 'AMRITA_FONT' });
        spawnPoints.push({ position: new Vector2D(originX + 150, originY + half), entityType: 'SENTINEL' });
        brazierPositions.push(new Vector2D(originX + half - 80, originY + half));
        brazierPositions.push(new Vector2D(originX + half + 80, originY + half));
        break;
      }
      case 'BOSS_ARENA': {
        brazierPositions.push(new Vector2D(originX + 100, originY + 100));
        brazierPositions.push(new Vector2D(originX + this.chunkSize - 100, originY + 100));
        brazierPositions.push(new Vector2D(originX + 100, originY + this.chunkSize - 100));
        brazierPositions.push(new Vector2D(originX + this.chunkSize - 100, originY + this.chunkSize - 100));
        spawnPoints.push({ position: new Vector2D(originX + half, originY + half), entityType: 'STONE_RAKHASA' });
        break;
      }
      default: {
        // ENTRANCE or SUNKEN_SANCTUM
        brazierPositions.push(new Vector2D(originX + half - 100, originY + half));
        brazierPositions.push(new Vector2D(originX + half + 100, originY + half));
        spawnPoints.push({ position: new Vector2D(originX + half, originY + half - 80), entityType: 'SENTINEL' });
        break;
      }
    }

    const chunk: BhumiRoomChunk = {
      chunkX: cx,
      chunkY: cy,
      worldBounds: bounds,
      roomType,
      walls,
      hazards,
      spawnPoints,
      brazierPositions,
      cleared: false,
    };

    this.loadedChunks.set(key, chunk);
    return chunk;
  }

  public updatePlayerPosition(playerPos: Vector2D, viewRadius = 1): BhumiRoomChunk[] {
    const centerCX = Math.floor(playerPos.x / this.chunkSize);
    const centerCY = Math.floor(playerPos.y / this.chunkSize);

    const neededKeys = new Set<string>();
    const activeList: BhumiRoomChunk[] = [];

    for (let dx = -viewRadius; dx <= viewRadius; dx++) {
      for (let dy = -viewRadius; dy <= viewRadius; dy++) {
        const cx = centerCX + dx;
        const cy = centerCY + dy;
        const key = this.coordKey(cx, cy);
        neededKeys.add(key);

        const chunk = this.generateChunk(cx, cy);
        activeList.push(chunk);
      }
    }

    this.activeChunkCoords = neededKeys;
    return activeList;
  }

  public getActiveChunks(): BhumiRoomChunk[] {
    const chunks: BhumiRoomChunk[] = [];
    for (const key of this.activeChunkCoords) {
      const c = this.loadedChunks.get(key);
      if (c) chunks.push(c);
    }
    return chunks;
  }

  public getChunkAt(worldX: number, worldY: number): BhumiRoomChunk {
    const cx = Math.floor(worldX / this.chunkSize);
    const cy = Math.floor(worldY / this.chunkSize);
    return this.generateChunk(cx, cy);
  }

  public getLoadedChunkCount(): number {
    return this.loadedChunks.size;
  }

  public render(renderer: IRenderer): void {
    for (const chunk of this.getActiveChunks()) {
      const b = chunk.worldBounds;
      // Floor pattern
      renderer.drawRect(b.x, b.y, b.width, b.height, '#120d0a');

      // Hazards
      for (const h of chunk.hazards) {
        renderer.drawRect(h.x, h.y, h.width, h.height, 'rgba(235, 94, 40, 0.45)', '#FF5E00');
      }

      // Walls
      for (const w of chunk.walls) {
        renderer.drawRect(w.x, w.y, w.width, w.height, '#2a1e16', '#d4a373');
      }

      // Braziers
      for (const bz of chunk.brazierPositions) {
        renderer.drawCircle(bz.x, bz.y, 8, '#FFAA33', '#FF4400');
      }
    }
  }
}
