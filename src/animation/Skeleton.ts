import { Bone } from './Bone';
import { Transform2D } from './Transform2D';
import { IRenderer } from '../render/CanvasRenderer';

export interface Socket {
  name: string;
  boneName: string;
  offset: Transform2D;
}

export class Skeleton {
  public name: string;
  private bones: Map<string, Bone> = new Map();
  private rootBones: Bone[] = [];
  private sockets: Map<string, Socket> = new Map();

  constructor(name: string) {
    this.name = name;
  }

  public addBone(bone: Bone, parentName?: string): this {
    if (this.bones.has(bone.name)) {
      throw new Error(`Bone with name "${bone.name}" already exists in skeleton "${this.name}"`);
    }

    if (parentName) {
      const parent = this.bones.get(parentName);
      if (!parent) {
        throw new Error(`Parent bone "${parentName}" not found when adding "${bone.name}"`);
      }
      parent.addChild(bone);
    } else {
      this.rootBones.push(bone);
    }

    this.bones.set(bone.name, bone);
    return this;
  }

  public getBone(name: string): Bone | undefined {
    return this.bones.get(name);
  }

  public getAllBones(): Bone[] {
    return Array.from(this.bones.values());
  }

  public getBoneCount(): number {
    return this.bones.size;
  }

  public updateWorldTransforms(rootTransform?: Transform2D): void {
    for (const root of this.rootBones) {
      root.updateWorldTransform(rootTransform);
    }
  }

  public resetToRestPose(): void {
    for (const root of this.rootBones) {
      root.resetToRestPose();
    }
  }

  public registerSocket(socketName: string, boneName: string, offset = new Transform2D()): void {
    if (!this.bones.has(boneName)) {
      throw new Error(`Cannot attach socket "${socketName}" to nonexistent bone "${boneName}"`);
    }
    this.sockets.set(socketName, { name: socketName, boneName, offset });
  }

  public getSocketTransform(socketName: string): Transform2D | null {
    const socket = this.sockets.get(socketName);
    if (!socket) return null;

    const bone = this.bones.get(socket.boneName);
    if (!bone) return null;

    return Transform2D.combine(bone.worldTransform, socket.offset);
  }

  /**
   * Renders skeletal debug hierarchy showing joints, bones, and sockets.
   */
  public renderDebug(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    ctx.save();

    for (const bone of this.bones.values()) {
      const wx = bone.worldTransform.position.x;
      const wy = bone.worldTransform.position.y;

      // Draw bone line to children
      for (const child of bone.children) {
        const cx = child.worldTransform.position.x;
        const cy = child.worldTransform.position.y;

        ctx.strokeStyle = '#00E5FF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(cx, cy);
        ctx.stroke();
      }

      // Draw joint
      ctx.fillStyle = '#FFD166';
      ctx.beginPath();
      ctx.arc(wx, wy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Sockets
    for (const socket of this.sockets.values()) {
      const st = this.getSocketTransform(socket.name);
      if (st) {
        ctx.fillStyle = '#EF476F';
        ctx.beginPath();
        ctx.arc(st.position.x, st.position.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '9px monospace';
        ctx.fillText(socket.name, st.position.x + 6, st.position.y - 4);
      }
    }

    ctx.restore();
  }
}
