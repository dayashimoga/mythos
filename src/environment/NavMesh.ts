import { AABB } from '../physics/AABB';
import { Camera } from '../render/Camera';
import { NavNode, NavPath } from './EnvironmentTypes';

export class NavMesh {
  public readonly cellSize: number;
  public readonly worldMinX: number;
  public readonly worldMinY: number;
  public readonly worldMaxX: number;
  public readonly worldMaxY: number;

  public readonly cols: number;
  public readonly rows: number;

  private grid: NavNode[][];

  constructor(
    worldMinX = -2000,
    worldMinY = -1600,
    worldMaxX = 2000,
    worldMaxY = 1600,
    cellSize = 40
  ) {
    this.worldMinX = worldMinX;
    this.worldMinY = worldMinY;
    this.worldMaxX = worldMaxX;
    this.worldMaxY = worldMaxY;
    this.cellSize = cellSize;

    this.cols = Math.ceil((worldMaxX - worldMinX) / cellSize);
    this.rows = Math.ceil((worldMaxY - worldMinY) / cellSize);

    this.grid = [];
    this.initializeGrid();
  }

  private initializeGrid(): void {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const row: NavNode[] = [];
      for (let c = 0; c < this.cols; c++) {
        const x = this.worldMinX + c * this.cellSize + this.cellSize / 2;
        const y = this.worldMinY + r * this.cellSize + this.cellSize / 2;
        row.push({
          x,
          y,
          gridX: c,
          gridY: r,
          traversable: true,
          cost: 1.4, // Default meadow traversal cost
          gScore: Infinity,
          fScore: Infinity,
          parent: null,
        });
      }
      this.grid.push(row);
    }
  }

  public getGridCoords(worldX: number, worldY: number): { c: number; r: number } | null {
    if (
      worldX < this.worldMinX ||
      worldX >= this.worldMaxX ||
      worldY < this.worldMinY ||
      worldY >= this.worldMaxY
    ) {
      return null;
    }
    const c = Math.floor((worldX - this.worldMinX) / this.cellSize);
    const r = Math.floor((worldY - this.worldMinY) / this.cellSize);
    return { c: Math.min(this.cols - 1, Math.max(0, c)), r: Math.min(this.rows - 1, Math.max(0, r)) };
  }

  public getNode(c: number, r: number): NavNode | null {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) {
      return null;
    }
    return this.grid[r][c];
  }

  public getNodeAtWorld(worldX: number, worldY: number): NavNode | null {
    const coords = this.getGridCoords(worldX, worldY);
    if (!coords) return null;
    return this.getNode(coords.c, coords.r);
  }

  public isTraversable(worldX: number, worldY: number): boolean {
    const node = this.getNodeAtWorld(worldX, worldY);
    return node !== null && node.traversable;
  }

  public getCostAt(worldX: number, worldY: number): number {
    const node = this.getNodeAtWorld(worldX, worldY);
    return node ? node.cost : Infinity;
  }

  /**
   * Stamps a solid obstacle (e.g. wall, pillar, banyan trunk, chasm)
   */
  public markObstacle(bounds: AABB): void {
    const minC = Math.max(0, Math.floor((bounds.x - this.worldMinX) / this.cellSize));
    const maxC = Math.min(this.cols - 1, Math.floor((bounds.x + bounds.width - this.worldMinX) / this.cellSize));
    const minR = Math.max(0, Math.floor((bounds.y - this.worldMinY) / this.cellSize));
    const maxR = Math.min(this.rows - 1, Math.floor((bounds.y + bounds.height - this.worldMinY) / this.cellSize));

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const node = this.grid[r][c];
        node.traversable = false;
        node.cost = Infinity;
      }
    }
  }

  /**
   * Stamps a traversable pathway or road with specific movement cost
   */
  public markPathway(bounds: AABB, cost: number): void {
    const minC = Math.max(0, Math.floor((bounds.x - this.worldMinX) / this.cellSize));
    const maxC = Math.min(this.cols - 1, Math.floor((bounds.x + bounds.width - this.worldMinX) / this.cellSize));
    const minR = Math.max(0, Math.floor((bounds.y - this.worldMinY) / this.cellSize));
    const maxR = Math.min(this.rows - 1, Math.floor((bounds.y + bounds.height - this.worldMinY) / this.cellSize));

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const node = this.grid[r][c];
        if (node.traversable) {
          node.cost = Math.min(node.cost, cost);
        }
      }
    }
  }

  /**
   * Executes A* search from start to goal coordinates
   */
  public findPath(startX: number, startY: number, goalX: number, goalY: number): NavPath {
    const startNode = this.getNodeAtWorld(startX, startY);
    const goalNode = this.getNodeAtWorld(goalX, goalY);

    if (!startNode || !goalNode || !goalNode.traversable) {
      return { points: [], totalCost: Infinity, isValid: false };
    }

    // Reset search state
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c].gScore = Infinity;
        this.grid[r][c].fScore = Infinity;
        this.grid[r][c].parent = null;
      }
    }

    const openSet: NavNode[] = [startNode];
    const closedSet: Set<NavNode> = new Set();

    startNode.gScore = 0;
    startNode.fScore = this.heuristic(startNode, goalNode);

    const neighborOffsets = [
      { dc: 0, dr: -1, cost: 1.0 },
      { dc: 1, dr: 0, cost: 1.0 },
      { dc: 0, dr: 1, cost: 1.0 },
      { dc: -1, dr: 0, cost: 1.0 },
      { dc: 1, dr: -1, cost: 1.414 },
      { dc: 1, dr: 1, cost: 1.414 },
      { dc: -1, dr: 1, cost: 1.414 },
      { dc: -1, dr: -1, cost: 1.414 },
    ];

    while (openSet.length > 0) {
      // Find node with lowest fScore
      let bestIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].fScore < openSet[bestIndex].fScore) {
          bestIndex = i;
        }
      }
      const current = openSet.splice(bestIndex, 1)[0];

      if (current === goalNode) {
        return this.reconstructPath(goalNode);
      }

      closedSet.add(current);

      for (const off of neighborOffsets) {
        const neighbor = this.getNode(current.gridX + off.dc, current.gridY + off.dr);
        if (!neighbor || !neighbor.traversable || closedSet.has(neighbor)) {
          continue;
        }

        const tentativeG = current.gScore + off.cost * neighbor.cost;
        if (tentativeG < neighbor.gScore) {
          neighbor.parent = current;
          neighbor.gScore = tentativeG;
          neighbor.fScore = tentativeG + this.heuristic(neighbor, goalNode);

          if (!openSet.includes(neighbor)) {
            openSet.push(neighbor);
          }
        }
      }
    }

    // No path found
    return { points: [], totalCost: Infinity, isValid: false };
  }

  private heuristic(a: NavNode, b: NavNode): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  private reconstructPath(goal: NavNode): NavPath {
    const rawPoints: { x: number; y: number }[] = [];
    let curr: NavNode | null = goal;
    let totalCost = goal.gScore;

    while (curr) {
      rawPoints.push({ x: curr.x, y: curr.y });
      curr = curr.parent;
    }
    rawPoints.reverse();

    // Path smoothing / string pulling
    const smoothed = this.smoothPath(rawPoints);
    return { points: smoothed, totalCost, isValid: true };
  }

  /**
   * Line-of-sight shortcutting to eliminate zig-zag stepping
   */
  public smoothPath(points: { x: number; y: number }[]): { x: number; y: number }[] {
    if (points.length <= 2) return points;

    const result: { x: number; y: number }[] = [points[0]];
    let currentIdx = 0;

    while (currentIdx < points.length - 1) {
      let furthestIdx = points.length - 1;
      for (let testIdx = points.length - 1; testIdx > currentIdx; testIdx--) {
        if (this.hasLineOfSight(points[currentIdx], points[testIdx])) {
          furthestIdx = testIdx;
          break;
        }
      }
      result.push(points[furthestIdx]);
      currentIdx = furthestIdx;
    }

    return result;
  }

  public hasLineOfSight(p1: { x: number; y: number }, p2: { x: number; y: number }): boolean {
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const steps = Math.ceil(dist / (this.cellSize * 0.5));
    if (steps <= 1) return true;

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = p1.x + (p2.x - p1.x) * t;
      const y = p1.y + (p2.y - p1.y) * t;
      if (!this.isTraversable(x, y)) {
        return false;
      }
    }
    return true;
  }

  public renderDebugNavMesh(ctx: CanvasRenderingContext2D, camera: Camera, activePath?: NavPath): void {
    const bounds = camera.getVisibleBounds();
    const minC = Math.max(0, Math.floor((bounds.x - this.worldMinX) / this.cellSize));
    const maxC = Math.min(this.cols - 1, Math.floor((bounds.x + bounds.width - this.worldMinX) / this.cellSize));
    const minR = Math.max(0, Math.floor((bounds.y - this.worldMinY) / this.cellSize));
    const maxR = Math.min(this.rows - 1, Math.floor((bounds.y + bounds.height - this.worldMinY) / this.cellSize));

    ctx.save();
    ctx.lineWidth = 1;

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const node = this.grid[r][c];
        const nx = node.x - this.cellSize / 2;
        const ny = node.y - this.cellSize / 2;

        if (!node.traversable) {
          // Impassable obstacle
          ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.fillRect(nx, ny, this.cellSize, this.cellSize);
        } else if (node.cost <= 1.05) {
          // Paved highway
          ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
          ctx.fillRect(nx, ny, this.cellSize, this.cellSize);
        } else if (node.cost >= 1.8) {
          // Water
          ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
          ctx.fillRect(nx, ny, this.cellSize, this.cellSize);
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.strokeRect(nx, ny, this.cellSize, this.cellSize);
      }
    }

    // Render active A* path if present
    if (activePath && activePath.isValid && activePath.points.length > 1) {
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(activePath.points[0].x, activePath.points[0].y);
      for (let i = 1; i < activePath.points.length; i++) {
        ctx.lineTo(activePath.points[i].x, activePath.points[i].y);
      }
      ctx.stroke();

      // Waypoint dots
      ctx.fillStyle = '#EF4444';
      for (const p of activePath.points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
