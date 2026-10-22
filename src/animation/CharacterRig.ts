import { Skeleton } from './Skeleton';
import { AnimationStateMachine } from './AnimationStateMachine';
import { Transform2D } from './Transform2D';
import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';
import { TwoBoneIK } from './TwoBoneIK';

export interface RigRenderDelegate {
  (renderer: IRenderer, rig: CharacterRig): void;
}

export class CharacterRig {
  public id: string;
  public skeleton: Skeleton;
  public stateMachine: AnimationStateMachine;
  public renderDelegate: RigRenderDelegate;

  public position: Vector2D = new Vector2D(0, 0);
  public facing = 1; // 1 for right, -1 for left
  public scale = 1.0;
  public expression: 'neutral' | 'combat' | 'hurt' | 'serene' = 'neutral';

  public aimTarget: Vector2D | null = null;
  public isAimIKEnabled = false;
  public isFootIKEnabled = false;
  public groundY = 0;

  public showDebugBones = false;
  public timeScale = 1.0;

  constructor(
    id: string,
    skeleton: Skeleton,
    stateMachine: AnimationStateMachine,
    renderDelegate: RigRenderDelegate
  ) {
    this.id = id;
    this.skeleton = skeleton;
    this.stateMachine = stateMachine;
    this.renderDelegate = renderDelegate;
  }

  public update(dt: number): void {
    const effectiveDt = dt * this.timeScale;

    // 1. Reset to base rest pose
    this.skeleton.resetToRestPose();

    // 2. Advance and apply animation state machine
    this.stateMachine.update(effectiveDt, this.skeleton);

    // 3. Apply root transformation
    const rootTransform = new Transform2D(
      this.position.x,
      this.position.y,
      0,
      this.facing * this.scale,
      this.scale
    );

    // 4. Update world transforms
    this.skeleton.updateWorldTransforms(rootTransform);

    // 5. Apply Two-Bone Aim IK if target is present
    if (this.isAimIKEnabled && this.aimTarget) {
      const armR = this.skeleton.getBone('arm_r');
      const forearmR = this.skeleton.getBone('forearm_r');
      if (armR && forearmR) {
        TwoBoneIK.solve(armR, forearmR, this.aimTarget, this.facing > 0, true);
        this.skeleton.updateWorldTransforms(rootTransform);
      }
    }

    // 6. Apply Foot Ground-Planting IK if enabled
    if (this.isFootIKEnabled) {
      const thighL = this.skeleton.getBone('thigh_l');
      const shinL = this.skeleton.getBone('shin_l');
      const thighR = this.skeleton.getBone('thigh_r');
      const shinR = this.skeleton.getBone('shin_r');

      if (thighL && shinL) {
        const footLTarget = new Vector2D(thighL.worldTransform.position.x, this.position.y + this.groundY);
        TwoBoneIK.solve(thighL, shinL, footLTarget, true, true);
      }
      if (thighR && shinR) {
        const footRTarget = new Vector2D(thighR.worldTransform.position.x, this.position.y + this.groundY);
        TwoBoneIK.solve(thighR, shinR, footRTarget, true, true);
      }
      this.skeleton.updateWorldTransforms(rootTransform);
    }
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    ctx.save();

    // Call customized character mesh/part renderer
    this.renderDelegate(renderer, this);

    // Render debug skeletal lines if enabled
    if (this.showDebugBones) {
      this.skeleton.renderDebug(renderer);

      if (this.aimTarget && this.isAimIKEnabled) {
        ctx.strokeStyle = '#EF476F';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.aimTarget.x, this.aimTarget.y, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
