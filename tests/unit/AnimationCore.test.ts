import { describe, it, expect } from 'vitest';
import { Transform2D } from '../../src/animation/Transform2D';
import { Bone } from '../../src/animation/Bone';
import { Skeleton } from '../../src/animation/Skeleton';
import { TwoBoneIK } from '../../src/animation/TwoBoneIK';
import { Vector2D } from '../../src/physics/Vector2D';
import { CanvasRenderer } from '../../src/render/CanvasRenderer';

describe('Animation Core: Transform2D, Bone, Skeleton, & TwoBoneIK', () => {
  it('Transform2D handles cloning, copying, lerping, and point transforms', () => {
    const t1 = new Transform2D(10, 20, 0, 1, 1);
    const t2 = t1.clone();
    expect(t2.position.x).toBe(10);
    expect(t2.position.y).toBe(20);

    // Lerp
    const target = new Transform2D(20, 40, Math.PI, 2, 2);
    const mid = t1.lerp(target, 0.5);
    expect(mid.position.x).toBe(15);
    expect(mid.position.y).toBe(30);
    expect(mid.scale.x).toBe(1.5);

    // Point transforms
    const localPt = new Vector2D(5, 0);
    const worldPt = t1.transformPoint(localPt);
    expect(worldPt.x).toBe(15);
    expect(worldPt.y).toBe(20);

    const invPt = t1.inverseTransformPoint(worldPt);
    expect(Math.round(invPt.x)).toBe(5);
    expect(Math.round(invPt.y)).toBe(0);

    // Combine parent and child
    const parent = new Transform2D(100, 100, Math.PI * 0.5, 1, 1);
    const child = new Transform2D(10, 0, 0, 1, 1);
    const combined = Transform2D.combine(parent, child);
    expect(Math.round(combined.position.x)).toBe(100);
    expect(Math.round(combined.position.y)).toBe(110);
  });

  it('Bone maintains hierarchy, propagates world transforms, and resets rest pose', () => {
    const parent = new Bone('parent_bone', 10, 10, 0, 20);
    const child = new Bone('child_bone', 20, 0, 0, 15);
    parent.addChild(child);

    expect(child.parent).toBe(parent);
    expect(parent.children.length).toBe(1);

    // Update transforms
    parent.updateWorldTransform();
    expect(child.worldTransform.position.x).toBe(30);
    expect(child.worldTransform.position.y).toBe(10);

    // Tip position
    const tip = parent.getTipWorldPosition();
    expect(tip.x).toBe(30);
    expect(tip.y).toBe(10);

    // Modify local and reset
    parent.localTransform.position.set(50, 50);
    parent.resetToRestPose();
    expect(parent.localTransform.position.x).toBe(10);
    expect(parent.localTransform.position.y).toBe(10);
  });

  it('Skeleton manages bones, registers sockets, and handles transform updates', () => {
    const skel = new Skeleton('test_skel');
    const root = new Bone('root', 0, 0, 0, 10);
    const arm = new Bone('arm', 10, 0, 0, 15);

    skel.addBone(root);
    skel.addBone(arm, 'root');

    expect(skel.getBoneCount()).toBe(2);
    expect(skel.getBone('root')).toBe(root);
    expect(skel.getBone('arm')).toBe(arm);
    expect(skel.getAllBones().length).toBe(2);

    // Duplicate bone error
    expect(() => skel.addBone(new Bone('root', 0, 0))).toThrow();
    // Nonexistent parent error
    expect(() => skel.addBone(new Bone('limb', 0, 0), 'nonexistent')).toThrow();

    // Sockets
    skel.registerSocket('socket_hand', 'arm', new Transform2D(15, 0, 0));
    expect(() => skel.registerSocket('bad', 'unknown')).toThrow();

    skel.updateWorldTransforms(new Transform2D(100, 200));
    const socketTransform = skel.getSocketTransform('socket_hand');
    expect(socketTransform).not.toBeNull();
    expect(socketTransform!.position.x).toBe(125);
    expect(socketTransform!.position.y).toBe(200);

    expect(skel.getSocketTransform('unknown')).toBeNull();

    // Debug rendering
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const renderer = new CanvasRenderer(canvas);
    expect(() => skel.renderDebug(renderer)).not.toThrow();
  });

  it('TwoBoneIK solves analytical 2-bone chain for reachable, overextended, and folded targets', () => {
    const root = new Bone('thigh', 0, 0, 0, 20);
    const mid = new Bone('shin', 20, 0, 0, 20);
    root.addChild(mid);
    root.updateWorldTransform();

    // 1. Target directly reachable within distance 30 (length = 20 + 20 = 40)
    const target1 = new Vector2D(30, 0);
    const res1 = TwoBoneIK.solve(root, mid, target1, true, true);
    expect(res1.success).toBe(true);
    expect(Number.isFinite(res1.rootAngle)).toBe(true);
    expect(Number.isFinite(res1.midAngle)).toBe(true);

    // 2. Target overextended (distance 60 > 40) -> clamps to max length safely
    const target2 = new Vector2D(60, 0);
    const res2 = TwoBoneIK.solve(root, mid, target2, true, true);
    expect(res2.success).toBe(true);
    expect(Number.isFinite(res2.rootAngle)).toBe(true);

    // 3. Target folded (distance 0 < min reach) -> clamps to min reach safely
    const target3 = new Vector2D(0, 0);
    const res3 = TwoBoneIK.solve(root, mid, target3, false, false);
    expect(res3.success).toBe(true);
  });
});
