import { describe, it, expect, beforeEach } from 'vitest';
import { NumberTrack, Vector2Track } from '../../src/animation/KeyframeTrack';
import { AnimationClip } from '../../src/animation/AnimationClip';
import { BlendTree1D } from '../../src/animation/BlendTree1D';
import { AnimationStateMachine } from '../../src/animation/AnimationStateMachine';
import { Skeleton } from '../../src/animation/Skeleton';
import { Bone } from '../../src/animation/Bone';

describe('Animation Pipeline: Tracks, Clips, Blend Trees, & State Machines', () => {
  let skel: Skeleton;
  let boneA: Bone;

  beforeEach(() => {
    skel = new Skeleton('test_skel');
    boneA = new Bone('bone_a', 0, 0, 0, 20);
    skel.addBone(boneA);
  });

  describe('Keyframe Tracks & Interpolation', () => {
    it('evaluates linear, hermite, and step number tracks correctly', () => {
      // Empty track
      const emptyTrack = new NumberTrack('empty');
      expect(emptyTrack.evaluate(0.5)).toBe(0);

      // Single keyframe
      const singleTrack = new NumberTrack('single').addKeyframe(0, 10);
      expect(singleTrack.evaluate(0.5)).toBe(10);

      // Linear Track
      const linearTrack = new NumberTrack('linear', 'linear')
        .addKeyframe(0, 0)
        .addKeyframe(1.0, 10);
      expect(linearTrack.evaluate(-0.5)).toBe(0);
      expect(linearTrack.evaluate(0.5)).toBe(5);
      expect(linearTrack.evaluate(1.5)).toBe(10);

      // Step Track
      const stepTrack = new NumberTrack('step', 'step')
        .addKeyframe(0, 0)
        .addKeyframe(1.0, 10);
      expect(stepTrack.evaluate(0.4)).toBe(0);

      // Hermite Track
      const hermiteTrack = new NumberTrack('hermite', 'hermite')
        .addKeyframe(0, 0, 0, 0)
        .addKeyframe(1.0, 10, 0, 0);
      const midVal = hermiteTrack.evaluate(0.5);
      expect(midVal).toBeGreaterThan(0);
      expect(midVal).toBeLessThan(10);
    });

    it('evaluates Vector2Track correctly across keyframe times', () => {
      const vTrack = new Vector2Track('pos')
        .addKeyframe(0, 0, 0)
        .addKeyframe(1.0, 100, 200);

      expect(vTrack.evaluate(0).x).toBe(0);
      expect(vTrack.evaluate(0.5).x).toBe(50);
      expect(vTrack.evaluate(0.5).y).toBe(100);
      expect(vTrack.evaluate(2.0).x).toBe(100);

      const emptyV = new Vector2Track('empty');
      expect(emptyV.evaluate(1).x).toBe(0);
    });
  });

  describe('AnimationClip & Event Triggering', () => {
    it('applies rotation and position tracks with weights and handles looping', () => {
      const clip = new AnimationClip('test_clip', 1.0, true);
      const rTrack = new NumberTrack('bone_a.rotation', 'linear')
        .addKeyframe(0, 0)
        .addKeyframe(0.5, Math.PI * 0.5)
        .addKeyframe(1.0, 0);
      clip.addRotationTrack('bone_a', rTrack);

      const pTrack = new Vector2Track('bone_a.position')
        .addKeyframe(0, 0, 0)
        .addKeyframe(0.5, 20, 30)
        .addKeyframe(1.0, 0, 0);
      clip.addPositionTrack('bone_a', pTrack);

      clip.apply(0.5, skel, 1.0);
      expect(boneA.localTransform.rotation).toBeCloseTo(Math.PI * 0.5, 2);
      expect(boneA.localTransform.position.x).toBeCloseTo(20, 2);

      // Partial blend weight
      clip.apply(0.0, skel, 0.5);
      expect(boneA.localTransform.rotation).toBeLessThan(Math.PI * 0.5);
    });

    it('collects triggered animation events across time intervals', () => {
      const clip = new AnimationClip('events_clip', 1.0, true);
      clip.addEvent(0.25, 'footstep_l', { foot: 'left' });
      clip.addEvent(0.75, 'footstep_r', { foot: 'right' });

      // Between 0.1 and 0.3 -> footstep_l
      const evs1 = clip.getTriggeredEvents(0.1, 0.3);
      expect(evs1.length).toBe(1);
      expect(evs1[0].name).toBe('footstep_l');

      // Loop wrap-around
      const evs2 = clip.getTriggeredEvents(0.9, 0.1);
      expect(evs2.length).toBe(0);
    });
  });

  describe('BlendTree1D Locomotion', () => {
    it('blends clip weights and synchronizes normalized cycle phase', () => {
      const clipIdle = new AnimationClip('idle', 2.0, true);
      const clipWalk = new AnimationClip('walk', 1.0, true);
      const clipRun = new AnimationClip('run', 0.6, true);

      const tree = new BlendTree1D('Locomotion', 'speed');
      tree.addEntry(0.0, clipIdle);
      tree.addEntry(0.5, clipWalk);
      tree.addEntry(1.0, clipRun);

      // Idle weights
      const w0 = tree.getWeights(0.0);
      expect(w0.get(clipIdle)).toBe(1.0);

      // Halfway between Idle and Walk (speed = 0.25)
      const wMid = tree.getWeights(0.25);
      expect(wMid.get(clipIdle)).toBeCloseTo(0.5, 2);
      expect(wMid.get(clipWalk)).toBeCloseTo(0.5, 2);

      // Update advances phase
      tree.setPhase(0.2);
      tree.update(0.1, 0.5, skel, 1.0);
      expect(tree.getPhase()).toBeGreaterThan(0.2);
    });
  });

  describe('AnimationStateMachine', () => {
    it('manages states, transitions, parameters, and smooth cross-fading', () => {
      const clipA = new AnimationClip('clip_a', 1.0, true);
      const clipB = new AnimationClip('clip_b', 0.5, false);

      const asm = new AnimationStateMachine();
      asm.addState('StateA', clipA);
      asm.addState('StateB', clipB);

      asm.addTransition('StateA', 'StateB', 0.2, (p) => p.get('trigger_b') === true);
      asm.addTransition('StateB', 'StateA', 0.1, undefined, true); // exit time

      // Set parameter
      asm.setFloat('test_float', 3.14);
      expect(asm.getFloat('test_float')).toBe(3.14);
      asm.setBool('test_bool', true);
      expect(asm.getBool('test_bool')).toBe(true);

      // Trigger transition
      asm.setTrigger('trigger_b');
      asm.update(0.016, skel);
      expect(asm.currentState?.name).toBe('StateB');
      expect(asm.transitionProgress).toBeLessThan(1.0);

      // Complete transition
      asm.update(0.25, skel);
      expect(asm.transitionProgress).toBe(1.0);

      // Event callback
      let eventFired = false;
      clipB.addEvent(0.1, 'hit');
      asm.onEvent((name) => {
        if (name === 'hit') eventFired = true;
      });

      asm.stateTime = 0.05;
      asm.update(0.1, skel);
      expect(eventFired).toBe(true);
    });
  });
});
