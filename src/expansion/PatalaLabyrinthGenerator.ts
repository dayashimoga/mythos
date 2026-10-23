import { AABB } from '../physics/AABB';
import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';

export interface LabyrinthRoom {
  id: number;
  bounds: AABB;
  type: 'CORRIDOR' | 'CHAMBER' | 'VENOM_VAULT' | 'BOSS_SANCTUM';
  connectedTo: number[];
}

export class PatalaLabyrinthGenerator {
  public width: number;
  public height: number;
  public rooms: LabyrinthRoom[] = [];
  public walls: AABB[] = [];
  public venomPools: AABB[] = [];

  constructor(width = 1200, height = 900) {
    this.width = width;
    this.height = height;
    this.generateLabyrinth();
  }

  public generateLabyrinth(): void {
    this.rooms = [];
    this.walls = [];
    this.venomPools = [];

    // Simple BSP 4-quadrant layout with connecting corridors
    const halfW = this.width / 2;
    const halfH = this.height / 2;

    const quadRooms: Array<{ bounds: AABB; type: LabyrinthRoom['type'] }> = [
      { bounds: new AABB(60, 60, halfW - 120, halfH - 120), type: 'CHAMBER' },
      { bounds: new AABB(halfW + 60, 60, halfW - 120, halfH - 120), type: 'VENOM_VAULT' },
      { bounds: new AABB(60, halfH + 60, halfW - 120, halfH - 120), type: 'CHAMBER' },
      { bounds: new AABB(halfW + 60, halfH + 60, halfW - 120, halfH - 120), type: 'BOSS_SANCTUM' },
    ];

    quadRooms.forEach((qr, idx) => {
      this.rooms.push({
        id: idx,
        bounds: qr.bounds,
        type: qr.type,
        connectedTo: [],
      });

      if (qr.type === 'VENOM_VAULT') {
        this.venomPools.push(new AABB(qr.bounds.x + 80, qr.bounds.y + 80, qr.bounds.width - 160, 60));
      }
    });

    // Cross connecting corridors
    const corridorWidth = 70;
    // Horizontal corridor
    this.rooms.push({
      id: 4,
      bounds: new AABB(0, halfH - corridorWidth / 2, this.width, corridorWidth),
      type: 'CORRIDOR',
      connectedTo: [0, 1, 2, 3],
    });
    // Vertical corridor
    this.rooms.push({
      id: 5,
      bounds: new AABB(halfW - corridorWidth / 2, 0, corridorWidth, this.height),
      type: 'CORRIDOR',
      connectedTo: [0, 1, 2, 3],
    });

    // Outer boundary walls
    this.walls.push(new AABB(0, 0, this.width, 24));
    this.walls.push(new AABB(0, this.height - 24, this.width, 24));
    this.walls.push(new AABB(0, 0, 24, this.height));
    this.walls.push(new AABB(this.width - 24, 0, 24, this.height));
  }

  public getSpawnPosition(): Vector2D {
    return new Vector2D(this.rooms[0].bounds.x + 80, this.rooms[0].bounds.y + 80);
  }

  public render(renderer: IRenderer): void {
    // Rooms
    for (const r of this.rooms) {
      const fill = r.type === 'CORRIDOR' ? '#0d151c' : '#142129';
      const border = r.type === 'BOSS_SANCTUM' ? '#ff0055' : '#00a86b';
      renderer.drawRect(r.bounds.x, r.bounds.y, r.bounds.width, r.bounds.height, fill, border);
    }

    // Venom Pools
    for (const vp of this.venomPools) {
      renderer.drawRect(vp.x, vp.y, vp.width, vp.height, 'rgba(0, 255, 100, 0.4)', '#00ff66');
    }

    // Boundary walls
    for (const w of this.walls) {
      renderer.drawRect(w.x, w.y, w.width, w.height, '#080d12', '#2c3e50');
    }
  }
}
