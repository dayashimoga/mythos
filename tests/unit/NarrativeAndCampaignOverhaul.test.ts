import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuestManager } from '../../src/narrative/QuestManager';
import { DialogueTree } from '../../src/narrative/DialogueTree';
import { CampaignChapter1 } from '../../src/narrative/CampaignChapter1';
import { Vector2D } from '../../src/physics/Vector2D';
import { IRenderer } from '../../src/render/CanvasRenderer';
import { Engine } from '../../src/engine/Engine';
import { StoryCampaignScene } from '../../src/scenes/StoryCampaignScene';
import { SaveGameManager } from '../../src/state/SaveGameManager';
import { StorageAdapter, MemoryStorage } from '../../src/state/StorageAdapter';
import { Projectile } from '../../src/entities/Projectile';

class MockCanvasRenderer implements IRenderer {
  public ctx: any;
  public camera: any;

  constructor() {
    this.ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      roundRect: vi.fn(),
      quadraticCurveTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      measureText: vi.fn((text: string) => ({ width: text.length * 8 })),
      setLineDash: vi.fn(),
      drawImage: vi.fn(),
      clip: vi.fn(),
    };
    this.camera = {
      position: new Vector2D(640, 360),
      viewportWidth: 1280,
      viewportHeight: 720,
      triggerShake: vi.fn(),
      setTarget: vi.fn(),
    };
  }

  save() {}
  restore() {}
  translate() {}
  scale() {}
  rotate() {}
  getContext() {
    return this.ctx as any;
  }
  getCamera() {
    return this.camera as any;
  }
  getViewport() {
    return { x: 0, y: 0, width: 1280, height: 720 };
  }
  clear() {}
  drawRect() {}
  drawCircle() {}
  drawText() {}
  drawSprite() {}
  drawAABB() {}
  drawMandala() {}
  beginWorldPass() {}
  endWorldPass() {}
}

describe('Stage 6: Complete Narrative, Quest & Progression Experience', () => {
  beforeEach(() => {
    StorageAdapter.setCustomStorage(new MemoryStorage());
    SaveGameManager.reset();
  });

  describe('Phase 6.1 & 6.2: Chapter 1 Mission DAG & Script Integrity', () => {
    it('defines 5 strictly ordered canonical missions without circular dependencies', () => {
      const missions = CampaignChapter1.getMissions();
      expect(missions.length).toBe(5);

      const missionIds = missions.map((m) => m.id);
      expect(missionIds).toEqual([
        'M1_SANCTUM_AWAKENING',
        'M2_SANCTUM_CONSECRATION',
        'M3_DANDAKA_INFILTRATION',
        'M4_HARMONIZE_PILLARS',
        'M5_OBSIDIAN_THRONE',
      ]);

      // Verify prerequisite DAG
      const completedIds = new Set<string>();
      missions.forEach((m) => {
        m.prerequisites.forEach((prereq) => {
          expect(completedIds.has(prereq)).toBe(true);
        });
        completedIds.add(m.id);
      });
    });

    it('ensures all missions have valid objectives with non-zero targets', () => {
      const missions = CampaignChapter1.getMissions();
      missions.forEach((m) => {
        expect(m.objectives.length).toBeGreaterThan(0);
        m.objectives.forEach((obj) => {
          expect(obj.id).toBeTruthy();
          expect(obj.description).toBeTruthy();
          expect(obj.targetCount).toBeGreaterThan(0);
        });
      });
    });

    it('defines Sthula optional purification objective in M4 without breaking DAG', () => {
      const missions = CampaignChapter1.getMissions();
      const m4 = missions.find((m) => m.id === 'M4_HARMONIZE_PILLARS');
      expect(m4).toBeDefined();

      const sthulaObj = m4!.objectives.find((o) => o.id === 'obj_subdue_sthula');
      expect(sthulaObj).toBeDefined();
      expect(sthulaObj!.isOptional).toBe(true);
    });
  });

  describe('Phase 6.3 & 6.4: Branching Dialogue, Morality, and Character Encounters', () => {
    let dialogueTree: DialogueTree;
    let voiceCues: string[];

    beforeEach(() => {
      dialogueTree = new DialogueTree();
      dialogueTree.registerNodes(CampaignChapter1.getDialogues());
      voiceCues = [];
      dialogueTree.onPlayVoiceCue = (cue) => {
        if (cue) voiceCues.push(cue);
      };
    });

    it('plays voice cues on dialogue start and branch progression', () => {
      dialogueTree.start('tara_awaken_1');
      expect(voiceCues).toContain('oracle_gentle');

      dialogueTree.start('kapi_standoff_1');
      expect(voiceCues).toContain('scout_chatter');

      dialogueTree.start('sthula_encounter_1');
      expect(voiceCues).toContain('guardian_firm');

      dialogueTree.start('mahisha_manifest_1');
      expect(voiceCues).toContain('titan_rumble');
    });

    it('executes Kapi branching choice: peace amrita vs firm glaive', () => {
      dialogueTree.start('kapi_standoff_1');
      dialogueTree.advance(); // trigger choices awaiting

      expect(dialogueTree.isAwaitingChoice).toBe(true);
      const chosen = dialogueTree.selectChoice(0); // choice 1: [Lower weapons]
      expect(chosen).toBe(true);
      expect(dialogueTree.getCurrentNode()?.id).toBe('kapi_path_peace');
    });

    it('executes Sthula branching choice: purify earth essence vs shatter core', () => {
      // Test Path A: Purify
      dialogueTree.start('sthula_encounter_1');
      dialogueTree.advance(); // await choice
      expect(dialogueTree.isAwaitingChoice).toBe(true);
      const chosenA = dialogueTree.selectChoice(0);
      expect(chosenA).toBe(true);
      expect(dialogueTree.getCurrentNode()?.id).toBe('sthula_path_purify');

      // Reset and test Path B: Shatter
      const dialogueB = new DialogueTree();
      dialogueB.registerNodes(CampaignChapter1.getDialogues());
      dialogueB.start('sthula_encounter_1');
      dialogueB.advance();
      const chosenB = dialogueB.selectChoice(1);
      expect(chosenB).toBe(true);
      expect(dialogueB.getCurrentNode()?.id).toBe('sthula_path_shatter');
    });

    it('supports direct pointer click to choose branching options and advance text', () => {
      dialogueTree.start('kapi_standoff_1');
      dialogueTree.advance(); // await choices

      const vpW = 1280;
      const vpH = 720;
      const boxY = vpH - 150 - 24;
      const choiceStartY = boxY - (2 * 38) - 10;

      // Click option 1 (centerY approx choiceStartY + 15)
      const handled = dialogueTree.handlePointerDown(
        vpW / 2,
        choiceStartY + 15,
        vpW,
        vpH,
        {}
      );
      expect(handled).toBe(true);
      expect(dialogueTree.getCurrentNode()?.id).toBe('kapi_path_peace');
    });

    it('renders dialogue box with portrait and text without crashing', () => {
      const renderer = new MockCanvasRenderer();
      dialogueTree.start('tara_awaken_1');
      dialogueTree.render(renderer);

      expect(renderer.getContext().fillRect).toHaveBeenCalled();
      expect(renderer.getContext().fillText).toHaveBeenCalled();
    });
  });

  describe('Phase 6.5: Versioned Narrative State Persistence & Checkpoints', () => {
    it('serializes and deserializes narrative save state with v2.0.0 schema', () => {
      const qm = new QuestManager();
      qm.registerMissions(CampaignChapter1.getMissions());
      qm.startMission('M1_SANCTUM_AWAKENING');
      qm.updateObjectiveProgress('M1_SANCTUM_AWAKENING', 'obj_practice_slash', 1);

      const exported = qm.exportSaveState();
      expect(exported.version).toBe('2.0.0');
      expect(exported.activeMissionId).toBe('M1_SANCTUM_AWAKENING');
      expect(exported.checksum).toBeTruthy();

      const newQm = new QuestManager();
      newQm.registerMissions(CampaignChapter1.getMissions());
      const loaded = newQm.loadSaveState(exported);
      expect(loaded).toBe(true);
      expect(newQm.getActiveMission()?.id).toBe('M1_SANCTUM_AWAKENING');
    });

    it('detects and rejects tampered narrative save state checksums', () => {
      const qm = new QuestManager();
      qm.registerMissions(CampaignChapter1.getMissions());
      qm.startMission('M1_SANCTUM_AWAKENING');

      const exported = qm.exportSaveState();
      // Tamper with taraAffinity value
      exported.relationships.taraAffinity = 999;

      const newQm = new QuestManager();
      newQm.registerMissions(CampaignChapter1.getMissions());
      const loaded = newQm.loadSaveState(exported);
      expect(loaded).toBe(false);
    });

    it('integrates narrative state with SaveGameManager without checksum failure', () => {
      const qm = new QuestManager();
      qm.registerMissions(CampaignChapter1.getMissions());
      qm.startMission('M1_SANCTUM_AWAKENING');
      const narrativeState = qm.exportSaveState();

      const saveSuccess = SaveGameManager.save({
        shardsCollected: 3,
        currentRealm: 'Realm of Bhumi',
        narrative: narrativeState,
      });
      expect(saveSuccess).toBe(true);

      const loaded = SaveGameManager.load();
      expect(loaded.narrative?.version).toBe('2.0.0');
      expect(loaded.narrative?.activeMissionId).toBe('M1_SANCTUM_AWAKENING');
    });
  });

  describe('Phase 6.6 & 6.7: StoryCampaignScene Production Gameplay Integration', () => {
    let engine: Engine;
    let canvas: HTMLCanvasElement;
    let scene: StoryCampaignScene;

    beforeEach(() => {
      canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      engine = new Engine();
      engine.init(canvas);
      scene = new StoryCampaignScene();
      scene.onEnter(engine);
    });

    it('initializes StoryCampaignScene with full narrative actors, obstacles, and quest graph', () => {
      expect(scene.questManager).toBeDefined();
      expect(scene.player).toBeDefined();
      expect(scene.altar).toBeDefined();
      expect(scene.stoneRakshasa).toBeDefined();
      expect(scene.vanaraScout).toBeDefined();
      expect(scene.pillarOm).toBeDefined();
      expect(scene.pillarKrim).toBeDefined();
      expect(scene.sentinels.length).toBe(2);
      expect(scene.shards.length).toBe(3);

      scene.onExit();
    });

    it('supports player weapon swapping (Agni-Chakram to Prana-Glaive) in story scene', () => {
      scene.cinematicDirector.skip();
      if (scene.dialogueTree.isActive()) scene.dialogueTree.finish();
      const player = scene.player;
      const initialWeapon = player.equipmentManager.getActiveWeapon();

      // Trigger swap weapon key KeyQ
      const input = engine.getInput();
      vi.spyOn(input, 'isKeyJustPressed').mockImplementation((k: string) => k === 'KeyQ');
      scene.handleInput(input);

      expect(player.equipmentManager.getActiveWeapon()).not.toBe(initialWeapon);

      scene.onExit();
    });

    it('deflects enemy projectiles upon player parry window', () => {
      scene.cinematicDirector.skip();
      if (scene.dialogueTree.isActive()) scene.dialogueTree.finish();

      const player = scene.player;
      player.position.set(0, 0);
      player.syncBounds();
      player.isParrying = true;
      player.parryWindowTimer = 0.2; // active parry window

      // Create an enemy projectile flying towards the player at same position to intersect
      const incomingProj = new Projectile(
        'enemy_bullet',
        0,
        0,
        new Vector2D(-1, 0),
        200,
        'enemy_proj'
      );
      incomingProj.syncBounds();

      // Access private enemyProjectiles array
      (scene as any).enemyProjectiles = [incomingProj];

      // Update scene by a small step
      scene.update(0.016);

      // Verify projectile was deflected into playerProjectiles
      const playerProjectiles = (scene as any).playerProjectiles;
      expect(playerProjectiles.length).toBe(1);
      expect(incomingProj.velocity.x).toBeGreaterThan(0); // reversed direction

      scene.onExit();
    });

    it('renders entire world environment pipeline without throwing', () => {
      const renderer = new MockCanvasRenderer();

      expect(() => {
        scene.render(renderer);
      }).not.toThrow();

      scene.onExit();
    });
  });
});
