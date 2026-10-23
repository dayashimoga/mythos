import { describe, it, expect, beforeEach } from 'vitest';
import { Engine } from '../../src/engine/Engine';
import { CanvasRenderer } from '../../src/render/CanvasRenderer';
import { CharacterDefinitions } from '../../src/animation/CharacterDefinitions';
import { CharacterShowcaseScene } from '../../src/scenes/CharacterShowcaseScene';
import { Vector2D } from '../../src/physics/Vector2D';
import { InputManager } from '../../src/input/InputManager';

describe('CharacterRig & CharacterShowcaseScene Studio', () => {
  let engine: Engine;
  let renderer: CanvasRenderer;
  let input: InputManager;

  beforeEach(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    engine = new Engine();
    engine.init(canvas);
    renderer = engine.getRenderer() as CanvasRenderer;
    input = engine.getInput();
  });

  describe('CharacterDefinitions Authoritative Roster', () => {
    it('creates Veer rig with 21 bones, weapons socket, and locomotion blend tree', () => {
      const veer = CharacterDefinitions.createVeerRig();
      expect(veer.id).toBe('veer');
      expect(veer.skeleton.getBoneCount()).toBe(21);
      expect(veer.skeleton.getSocketTransform('socket_right_hand')).not.toBeNull();
      expect(veer.skeleton.getSocketTransform('socket_forehead')).not.toBeNull();

      // Update and render
      veer.update(0.016);
      expect(() => veer.render(renderer)).not.toThrow();

      // Trigger slash
      veer.stateMachine.setTrigger('trigger_slash');
      veer.update(0.016);
      expect(veer.stateMachine.currentState?.name).toBe('MeleeSlash');
    });

    it('creates Devi Tara rig with 18 bones, celestial floating robes, and blessing mudra', () => {
      const tara = CharacterDefinitions.createDeviTaraRig();
      expect(tara.id).toBe('devi_tara');
      expect(tara.skeleton.getBoneCount()).toBe(18);
      expect(tara.skeleton.getSocketTransform('socket_bindi')).not.toBeNull();

      tara.update(0.016);
      expect(() => tara.render(renderer)).not.toThrow();

      tara.stateMachine.setTrigger('trigger_blessing');
      tara.update(0.016);
      expect(tara.stateMachine.currentState?.name).toBe('BlessingMudra');
    });

    it('creates Stone Rakshasa rig with 15 bones and ground slam state', () => {
      const rak = CharacterDefinitions.createRakshasaRig();
      expect(rak.id).toBe('stone_rakshasa');
      expect(rak.skeleton.getBoneCount()).toBe(15);

      rak.update(0.016);
      expect(() => rak.render(renderer)).not.toThrow();

      rak.stateMachine.setTrigger('trigger_slam');
      rak.update(0.016);
      expect(rak.stateMachine.currentState?.name).toBe('Slam');
    });

    it('creates Vanara Void-Scout rig with 16 bones and 3-bone tail chain', () => {
      const scout = CharacterDefinitions.createVanaraScoutRig();
      expect(scout.id).toBe('vanara_scout');
      expect(scout.skeleton.getBoneCount()).toBe(16);

      scout.update(0.016);
      expect(() => scout.render(renderer)).not.toThrow();
    });

    it('creates Mahishasura rig with 21 bones, buffalo horns, void gada socket, and enrage state', () => {
      const boss = CharacterDefinitions.createMahishasuraRig();
      expect(boss.id).toBe('mahishasura');
      expect(boss.skeleton.getBoneCount()).toBe(21);
      expect(boss.skeleton.getSocketTransform('socket_right_hand')).not.toBeNull();
      expect(boss.skeleton.getSocketTransform('socket_crown')).not.toBeNull();

      boss.update(0.016);
      expect(() => boss.render(renderer)).not.toThrow();

      // Trigger overhead slam
      boss.stateMachine.setTrigger('trigger_slam');
      boss.update(0.016);
      expect(boss.stateMachine.currentState?.name).toBe('Slam');

      // Reset to locomotion to test charge
      boss.stateMachine.transitionProgress = 1.0;
      boss.stateMachine.transitionTo('Locomotion');
      boss.stateMachine.transitionProgress = 1.0;

      // Trigger buffalo charge
      boss.stateMachine.setTrigger('trigger_charge');
      boss.update(0.016);
      expect(boss.stateMachine.currentState?.name).toBe('Charge');

      // Reset to locomotion to test enrage
      boss.stateMachine.transitionProgress = 1.0;
      boss.stateMachine.transitionTo('Locomotion');
      boss.stateMachine.transitionProgress = 1.0;

      // Trigger eclipse enrage
      boss.stateMachine.setTrigger('trigger_enrage');
      boss.update(0.016);
      expect(boss.stateMachine.currentState?.name).toBe('Enrage');
    });
  });

  describe('CharacterRig Features & Inverse Kinematics', () => {
    it('applies Aim IK towards world target position when enabled', () => {
      const veer = CharacterDefinitions.createVeerRig();
      veer.isAimIKEnabled = true;
      veer.aimTarget = new Vector2D(100, -50);

      const armR = veer.skeleton.getBone('arm_r');
      const prevRot = armR?.localTransform.rotation;

      veer.update(0.016);
      expect(armR?.localTransform.rotation).not.toBe(prevRot);
    });

    it('applies Foot Ground Planting IK when enabled', () => {
      const veer = CharacterDefinitions.createVeerRig();
      veer.isFootIKEnabled = true;
      veer.groundY = 10;

      expect(() => veer.update(0.016)).not.toThrow();
      expect(() => veer.render(renderer)).not.toThrow();
    });

    it('toggles debug bones and renders skeletal overlay', () => {
      const veer = CharacterDefinitions.createVeerRig();
      veer.showDebugBones = true;
      veer.isAimIKEnabled = true;
      veer.aimTarget = new Vector2D(120, 0);

      expect(() => veer.render(renderer)).not.toThrow();
    });
  });

  describe('CharacterShowcaseScene Studio Lifecycle & UI', () => {
    it('initializes rigs, handles character selection, speed, and time scale', () => {
      const scene = new CharacterShowcaseScene();
      scene.onEnter(engine);

      expect(scene.rigs.length).toBe(5);
      expect(scene.getActiveRig().id).toBe('veer');

      // Switch to Devi Tara
      scene.selectCharacter(1);
      expect(scene.getActiveRig().id).toBe('devi_tara');

      // Switch to Rakshasa
      scene.selectCharacter(2);
      expect(scene.getActiveRig().id).toBe('stone_rakshasa');

      // Switch to Scout
      scene.selectCharacter(3);
      expect(scene.getActiveRig().id).toBe('vanara_scout');

      // Switch to Mahishasura
      scene.selectCharacter(4);
      expect(scene.getActiveRig().id).toBe('mahishasura');

      // Toggles
      const bones = scene.toggleBones();
      expect(bones).toBe(true);

      const aimIK = scene.toggleAimIK();
      expect(aimIK).toBe(true);

      const footIK = scene.toggleFootIK();
      expect(footIK).toBe(true);

      const sockets = scene.toggleSockets();
      expect(sockets).toBe(true);

      const light = scene.cycleLighting();
      expect(light).toBe(1);

      // Camera
      scene.panX = 50;
      scene.panY = -30;
      scene.zoom = 1.4;
      scene.resetCamera();
      expect(scene.panX).toBe(0);
      expect(scene.zoom).toBe(1.0);

      // Render
      expect(() => scene.render(renderer)).not.toThrow();
    });

    it('handles input for movement speed, melee attack, dash, and slam triggers', () => {
      const scene = new CharacterShowcaseScene();
      scene.onEnter(engine);

      // Speed up
      input.triggerVirtualAction('MOVE_UP');
      scene.handleInput(input);
      expect(scene.locomotionSpeed).toBeGreaterThan(0);

      // Melee attack trigger
      input.triggerVirtualAction('MELEE_ATTACK');
      scene.handleInput(input);
      expect(scene.getActiveRig().stateMachine.parameters.get('trigger_slash')).toBe(true);

      // Dash trigger
      input.triggerVirtualAction('DASH');
      scene.handleInput(input);
      expect(scene.getActiveRig().stateMachine.parameters.get('trigger_dash')).toBe(true);

      // Attack / Slam trigger
      input.triggerVirtualAction('ATTACK');
      scene.handleInput(input);
      expect(scene.getActiveRig().stateMachine.parameters.get('trigger_slam')).toBe(true);

      // Pause / Return to splash
      input.triggerVirtualAction('PAUSE');
      scene.handleInput(input);
      expect(engine.getSceneManager().getCurrentScene()?.id).toBe('SplashScene');
    });
  });
});
