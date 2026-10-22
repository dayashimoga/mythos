import { Vector2D } from '../physics/Vector2D';
import { AABB } from '../physics/AABB';
import { IRenderer } from '../render/CanvasRenderer';

export abstract class Entity {
  public readonly id: string;
  public position: Vector2D;
  public velocity: Vector2D;
  public bounds: AABB;
  public isActive = true;
  public tag: string;

  constructor(id: string, x = 0, y = 0, width = 32, height = 32, tag = 'entity') {
    this.id = id;
    this.position = new Vector2D(x, y);
    this.velocity = new Vector2D(0, 0);
    this.bounds = new AABB(x - width / 2, y - height / 2, width, height);
    this.tag = tag;
  }

  public syncBounds(): void {
    this.bounds.x = this.position.x - this.bounds.width / 2;
    this.bounds.y = this.position.y - this.bounds.height / 2;
  }

  public abstract update(dt: number): void;
  public abstract render(renderer: IRenderer): void;

  public destroy(): void {
    this.isActive = false;
  }
}
