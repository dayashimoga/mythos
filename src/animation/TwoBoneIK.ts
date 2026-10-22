import { Bone } from './Bone';
import { Vector2D } from '../physics/Vector2D';

export interface IKSolveResult {
  success: boolean;
  rootAngle: number;
  midAngle: number;
}

export class TwoBoneIK {
  /**
   * Solves a 2-bone chain (Root -> Mid -> End) to reach targetPos.
   * Modifies rootBone and midBone local rotations directly if apply = true.
   */
  public static solve(
    rootBone: Bone,
    midBone: Bone,
    targetPos: Vector2D,
    bendPositive = true,
    apply = true
  ): IKSolveResult {
    const rootPos = rootBone.worldTransform.position;
    const l1 = rootBone.length > 0 ? rootBone.length : rootBone.worldTransform.position.distanceTo(midBone.worldTransform.position);
    const l2 = midBone.length > 0 ? midBone.length : midBone.worldTransform.position.distanceTo(midBone.children[0]?.worldTransform.position || rootPos);

    // Vector from root to target
    const dx = targetPos.x - rootPos.x;
    const dy = targetPos.y - rootPos.y;
    let dist = Math.sqrt(dx * dx + dy * dy);

    // Clamp distance within reachable domain to prevent NaN from acos
    const minReach = Math.abs(l1 - l2) + 0.001;
    const maxReach = l1 + l2 - 0.001;
    dist = Math.max(minReach, Math.min(maxReach, dist));

    // Base angle to target
    const baseAngle = Math.atan2(dy, dx);

    // Law of Cosines for Mid Bone angle: l1^2 + l2^2 - 2*l1*l2*cos(mid) = dist^2
    const cosMid = (l1 * l1 + l2 * l2 - dist * dist) / (2 * l1 * l2);
    const clampedCosMid = Math.max(-1, Math.min(1, cosMid));
    const interiorMidAngle = Math.acos(clampedCosMid);

    // Law of Cosines for Root Bone angle offset: l1^2 + dist^2 - 2*l1*dist*cos(root) = l2^2
    const cosRoot = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist);
    const clampedCosRoot = Math.max(-1, Math.min(1, cosRoot));
    const rootAngleOffset = Math.acos(clampedCosRoot);

    const sign = bendPositive ? 1 : -1;
    const solvedRootWorldAngle = baseAngle + sign * rootAngleOffset;
    const solvedMidLocalAngle = sign * (Math.PI - interiorMidAngle);

    // Convert root world angle to local rotation
    const parentRot = rootBone.parent ? rootBone.parent.worldTransform.rotation : 0;
    const solvedRootLocalRotation = solvedRootWorldAngle - parentRot;

    if (apply) {
      rootBone.localTransform.rotation = solvedRootLocalRotation;
      midBone.localTransform.rotation = solvedMidLocalAngle;
    }

    return {
      success: true,
      rootAngle: solvedRootLocalRotation,
      midAngle: solvedMidLocalAngle,
    };
  }
}
