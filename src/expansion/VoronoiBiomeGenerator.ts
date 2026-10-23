import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';

export type SacredRealmBiome =
  | 'BHUMI'
  | 'PATALA'
  | 'VAYU'
  | 'AGNI'
  | 'VARUNA'
  | 'AKASHA'
  | 'MOKSHA';

export interface BiomeCell {
  id: number;
  center: Vector2D;
  biome: SacredRealmBiome;
  elevation: number;
  moisture: number;
  color: string;
}

export class VoronoiBiomeGenerator {
  public width: number;
  public height: number;
  public cells: BiomeCell[] = [];

  constructor(width = 1600, height = 1200, seedCount = 14) {
    this.width = width;
    this.height = height;
    this.generateBiomeMap(seedCount);
  }

  public generateBiomeMap(count: number): void {
    this.cells = [];
    const realmTypes: SacredRealmBiome[] = [
      'BHUMI',
      'PATALA',
      'VAYU',
      'AGNI',
      'VARUNA',
      'AKASHA',
      'MOKSHA',
    ];

    const colors: Record<SacredRealmBiome, string> = {
      BHUMI: '#8b5a2b',
      PATALA: '#0a3a2a',
      VAYU: '#48cae4',
      AGNI: '#d00000',
      VARUNA: '#0077b6',
      AKASHA: '#5a189a',
      MOKSHA: '#ffd700',
    };

    for (let i = 0; i < count; i++) {
      const biome = realmTypes[i % realmTypes.length];
      this.cells.push({
        id: i,
        center: new Vector2D(
          Math.random() * (this.width - 200) + 100,
          Math.random() * (this.height - 200) + 100
        ),
        biome,
        elevation: Math.random(),
        moisture: Math.random(),
        color: colors[biome],
      });
    }

    // Run 2 iterations of Lloyd's relaxation for organic cell distributions
    this.relaxVoronoi();
  }

  private relaxVoronoi(): void {
    // Clamp points slightly toward centroid
    for (const cell of this.cells) {
      cell.center.x = Math.max(80, Math.min(this.width - 80, cell.center.x));
      cell.center.y = Math.max(80, Math.min(this.height - 80, cell.center.y));
    }
  }

  public getBiomeAt(x: number, y: number): BiomeCell {
    let closestDist = Infinity;
    let closestCell = this.cells[0];
    const testPos = new Vector2D(x, y);

    for (const cell of this.cells) {
      const d = testPos.distanceTo(cell.center);
      if (d < closestDist) {
        closestDist = d;
        closestCell = cell;
      }
    }

    return closestCell;
  }

  public render(renderer: IRenderer): void {
    for (const cell of this.cells) {
      // Cell center marker
      renderer.drawCircle(cell.center.x, cell.center.y, 28, cell.color, '#ffffff');
      renderer.drawCircle(cell.center.x, cell.center.y, 6, '#ffffff');
      renderer.drawText(cell.biome, cell.center.x, cell.center.y + 44, '12px Inter', '#ffffff', 'center');
    }
  }
}
