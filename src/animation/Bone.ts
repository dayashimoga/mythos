import { Transform2D } from './Transform2D';
import { Vector2D } from '../physics/Vector2D';

export class Bone {
  public name: string;
  public parent: Bone | null = null;
  public children: Bone[] = [];
  public length: number;

  public localTransform: Transform2D;
  public worldTransform: Transform2D;
  public restPose: Transform2D;

  constructor(name: string, x = 0, y = 0, rotation = 0, length = 20) {
    this.name = name;
    this.length = length;
    this.localTransform = new Transform2D(x, y, rotation, 1, 1);
    this.worldTransform = this.localTransform.clone();
    this.restPose = this.localTransform.clone();
  }

  public addChild(child: Bone): this {
    child.parent = this;
    this.children.push(child);
    return this;
  }

  public resetToRestPose(): void {
    this.localTransform.copyFrom(this.restPose);
    for (const child of this.children) {
      child.resetToRestPose();
    }
  }

  public updateWorldTransform(parentWorldTransform?: Transform2D): void {
    if (parentWorldTransform) {
      this.worldTransform = Transform2D.combine(parentWorldTransform, this.localTransform);
    } else {
      this.worldTransform.copyFrom(this.localTransform);
    }

    for (const child of this.children) {
      child.updateWorldTransform(this.worldTransform);
    }
  }

  /**
   * Returns the world position of the tip of this bone based on its length and rotation.
   */
  public getTipWorldPosition(): Vector2D {
    const tipLocal = new Vector2D(this.length, 0);
    return this.worldTransform.transformPoint(tipLocal);
  }
}
