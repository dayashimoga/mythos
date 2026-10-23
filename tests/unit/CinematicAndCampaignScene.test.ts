import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CinematicDirector, CinematicShot } from '../../src/cinematics/CinematicDirector';
import { StoryCampaignScene } from '../../src/scenes/StoryCampaignScene';
import { DialogueTree } from '../../src/narrative/DialogueTree';
import { Engine } from '../../src/engine/Engine';
import { Vector2D } from '../../src/physics/Vector2D';
import { Camera } from '../../src/render/Camera';
import { IRenderer } from '../../src/render/CanvasRenderer';
import { SaveGameManager } from '../../src/state/SaveGameManager';
import { SplashScene } from '../../src/scenes/SplashScene';

class MockRenderer implements IRenderer {
  private ctx: any;
  private camera: Camera;

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
      quadraticCurveTo: vi.fn(),
      roundRect: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      measureText: vi.fn((text: string) => ({ width: text.length * 8 })),
      setLineDash: vi.fn(),
    };
    this.camera = new Camera(1280, 720);
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
    return this.camera;
  }
  getViewport() {
    return { x: 0, y: 0, width: 1280, height: 720 };
  }
  clear() {}
  drawRect() {}
  drawCircle() {}
  drawText() {}
  drawAABB() {}
  drawMandala() {}
  beginWorldPass() {}
  endWorldPass() {}
  render() {}
}

describe('Stage 5: CinematicDirector Choreography System', () => {
  let director: CinematicDirector;
  let camera: Camera;
  let dialogueTree: DialogueTree;
  let renderer: MockRenderer;

  beforeEach(() => {
    camera = new Camera(1280, 720);
    dialogueTree = new DialogueTree();
    director = new CinematicDirector(camera, dialogueTree);
    renderer = new MockRenderer();
  });

  it('starts sequence and transitions between shots with camera tracking and letterbox bars', () => {
    let shot1Started = false;
    let shot1Ended = false;
    let shot2Started = false;

    const shots: CinematicShot[] = [
      {
        duration: 2.0,
        cameraTarget: new Vector2D(100, 200),
        letterboxHeight: 64,
        titleCard: { title: 'ACT I', subtitle: 'The Awakening' },
        onShotStart: () => {
          shot1Started = true;
        },
        onShotEnd: () => {
          shot1Ended = true;
        },
      },
      {
        duration: 1.5,
        cameraTarget: new Vector2D(300, 400),
        letterboxHeight: 64,
        onShotStart: () => {
          shot2Started = true;
        },
      },
    ];

    expect(director.isPlaying()).toBe(false);
    director.playSequence(shots);
    expect(director.isPlaying()).toBe(true);
    expect(shot1Started).toBe(true);

    // Update letterbox transition and shot timer
    director.update(1.0);
    expect(shot1Ended).toBe(false);

    // Complete shot 1 (2.0s total)
    director.update(1.1);
    expect(shot1Ended).toBe(true);
    expect(shot2Started).toBe(true);

    // Complete shot 2 (1.5s total)
    let completed = false;
    director.onSequenceComplete = () => {
      completed = true;
    };
    director.update(1.6);
    expect(director.isPlaying()).toBe(false);
    expect(completed).toBe(true);
  });

  it('skips active sequence immediately and clears letterbox targets', () => {
    let completed = false;
    director.onSequenceComplete = () => {
      completed = true;
    };

    const shots: CinematicShot[] = [
      {
        duration: 10.0,
        titleCard: { title: 'EPIC LORE' },
      },
    ];

    director.playSequence(shots);
    expect(director.isPlaying()).toBe(true);

    director.skip();
    expect(director.isPlaying()).toBe(false);
    expect(completed).toBe(true);
  });

  it('renders letterbox bars, title cards, and skip prompts on canvas context', () => {
    const shots: CinematicShot[] = [
      {
        duration: 5.0,
        letterboxHeight: 64,
        titleCard: { title: 'CHAPTER I', subtitle: 'DANDAKA' },
      },
    ];

    director.playSequence(shots);
    director.update(0.5); // Letterbox interpolates

    director.render(renderer);
    expect(renderer.getContext().fillRect).toHaveBeenCalled();
    expect(renderer.getContext().fillText).toHaveBeenCalled();
  });
});

describe('Stage 5: StoryCampaignScene Playable Integration', () => {
  let engine: Engine;
  let campaignScene: StoryCampaignScene;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    engine = new Engine();
    engine.init(canvas);
    campaignScene = new StoryCampaignScene();
    campaignScene.onEnter(engine);
  });

  it('initializes player, sanctum altar, shards, sentinels, and active M1 quest', () => {
    expect(campaignScene.player).toBeDefined();
    expect(campaignScene.altar).toBeDefined();
    expect(campaignScene.shards.length).toBe(3);
    expect(campaignScene.sentinels.length).toBe(2);
    expect(campaignScene.vanaraScout).toBeDefined();
    expect(campaignScene.pillarOm).toBeDefined();
    expect(campaignScene.pillarKrim).toBeDefined();

    expect(campaignScene.questManager.getActiveMission()?.id).toBe('M1_SANCTUM_AWAKENING');
  });

  it('handles pause toggle and quest log modal toggles', () => {
    const input = engine.getInput();

    // Toggle Quest Log with KeyO
    vi.spyOn(input, 'isKeyJustPressed').mockImplementation((key: string) => key === 'KeyO');
    expect(campaignScene.showQuestLog).toBe(false);
    campaignScene.handleInput(input);
    expect(campaignScene.showQuestLog).toBe(true);

    // Toggle off
    campaignScene.handleInput(input);
    expect(campaignScene.showQuestLog).toBe(false);

    // Skip cinematic if playing
    if (campaignScene.cinematicDirector.isPlaying()) {
      campaignScene.cinematicDirector.skip();
    }

    // Toggle pause with PAUSE action
    vi.spyOn(input, 'isActionJustPressed').mockImplementation((action: string) => action === 'PAUSE');
    campaignScene.handleInput(input);
    expect(campaignScene.isPaused).toBe(true);

    campaignScene.handleInput(input);
    expect(campaignScene.isPaused).toBe(false);
  });

  it('advances dialogue and selects branching choices via number keys', () => {
    const input = engine.getInput();

    // Skip opening cinematic and start Devi Tara dialogue
    campaignScene.cinematicDirector.skip();
    campaignScene.dialogueTree.start('tara_awaken_2');

    // Finish typewriter typing
    campaignScene.dialogueTree.advance();
    expect(campaignScene.dialogueTree.isWaitingForChoice()).toBe(true);

    // Press Digit1 to choose wisdom
    vi.spyOn(input, 'isKeyJustPressed').mockImplementation((key: string) => key === 'Digit1');
    campaignScene.handleInput(input);

    expect(campaignScene.questManager.relationships.taraAffinity).toBeGreaterThan(0);
    expect(campaignScene.dialogueTree.getCurrentNode()?.id).toBe('tara_path_wisdom');
  });

  it('collects shards, interacts with altar, and completes M1 and M2 missions', () => {
    campaignScene.cinematicDirector.skip();
    if (campaignScene.dialogueTree.isActive()) {
      campaignScene.dialogueTree.finish();
    }

    // Progress M1 objectives
    campaignScene.questManager.triggerObjectiveEvent('INTERACT_NPC', 'devi_tara', 1);
    campaignScene.questManager.triggerObjectiveEvent('DEFEAT_TARGET', 'training_strike', 3);
    expect(campaignScene.questManager.getMissionStatus('M1_SANCTUM_AWAKENING')).toBe('COMPLETED');

    // Activate M2
    campaignScene.questManager.startMission('M2_SANCTUM_CONSECRATION');
    expect(campaignScene.questManager.getActiveMission()?.id).toBe('M2_SANCTUM_CONSECRATION');

    // Collect all 3 shards by moving player close and syncing bounds
    for (const shard of campaignScene.shards) {
      shard.position.set(campaignScene.player.position.x, campaignScene.player.position.y);
      shard.syncBounds();
    }
    campaignScene.update(1 / 60);
    expect(campaignScene.shards.every((s) => s.isCollected)).toBe(true);

    // Defeat sentinels
    for (const sentinel of campaignScene.sentinels) {
      sentinel.takeDamage(100);
    }
    campaignScene.questManager.triggerObjectiveEvent('DEFEAT_TARGET', 'corrupted_sentinel', 2);

    // Consecrate Altar
    campaignScene.altar.position.set(campaignScene.player.position.x, campaignScene.player.position.y);
    campaignScene.altar.syncBounds();
    const input = engine.getInput();
    vi.spyOn(input, 'isKeyJustPressed').mockImplementation((key: string) => key === 'KeyE');
    campaignScene.handleInput(input);

    expect(campaignScene.questManager.getMissionStatus('M2_SANCTUM_CONSECRATION')).toBe('COMPLETED');
  });

  it('harmonizes resonance pillars and transitions to Caldera boss battle', () => {
    campaignScene.cinematicDirector.skip();
    if (campaignScene.dialogueTree.isActive()) campaignScene.dialogueTree.finish();

    // Satisfy prerequisites M1 -> M2 -> M3 and advance to Act II
    campaignScene.questManager.completeMission('M1_SANCTUM_AWAKENING');
    campaignScene.questManager.startMission('M2_SANCTUM_CONSECRATION');
    campaignScene.questManager.completeMission('M2_SANCTUM_CONSECRATION');
    campaignScene.questManager.startMission('M3_DANDAKA_INFILTRATION');
    campaignScene.questManager.completeMission('M3_DANDAKA_INFILTRATION');
    (campaignScene as any).currentAct = 2;

    // Start M4
    expect(campaignScene.questManager.getMissionStatus('M4_HARMONIZE_PILLARS')).toBe('AVAILABLE');
    campaignScene.questManager.startMission('M4_HARMONIZE_PILLARS');

    // Strike Pillar Om
    campaignScene.pillarOm.position.set(campaignScene.player.position.x, campaignScene.player.position.y);
    campaignScene.pillarOm.attune();
    campaignScene.questManager.triggerObjectiveEvent('CONSECRATE_ALTAR', 'pillar_om', 1);

    // Strike Pillar Krim
    campaignScene.pillarKrim.position.set(campaignScene.player.position.x, campaignScene.player.position.y);
    campaignScene.pillarKrim.attune();
    campaignScene.questManager.triggerObjectiveEvent('CONSECRATE_ALTAR', 'pillar_krim', 1);

    expect(campaignScene.questManager.getMissionStatus('M4_HARMONIZE_PILLARS')).toBe('COMPLETED');

    // Enter M5: Caldera Boss
    campaignScene.questManager.startMission('M5_OBSIDIAN_THRONE');
    campaignScene.update(1 / 60);

    // Boss spawns
    expect(campaignScene.boss).toBeDefined();
    expect(campaignScene.boss?.isActive).toBe(true);
  });

  it('handles player death and checkpoint restart [KeyR]', () => {
    campaignScene.cinematicDirector.skip();
    campaignScene.player.takeDamage(9999);
    campaignScene.update(1 / 60);

    expect(campaignScene.isGameOver).toBe(true);

    const input = engine.getInput();
    vi.spyOn(input, 'isKeyJustPressed').mockImplementation((key: string) => key === 'KeyR');
    campaignScene.handleInput(input);

    expect(campaignScene.isGameOver).toBe(false);
    expect(campaignScene.player.health).toBeGreaterThan(0);
  });

  it('persists narrative progress into SaveGameManager without checksum errors', () => {
    campaignScene.questManager.setFlag('TEST_FLAG', true);
    campaignScene.questManager.modifyAffinity({ tara: 30 });

    const narrativeSave = campaignScene.questManager.exportSaveState();
    const saveSuccess = SaveGameManager.save({
      shardsCollected: 3,
      currentRealm: 'Realm of Bhumi',
      narrative: narrativeSave,
    });
    expect(saveSuccess).toBe(true);

    const loaded = SaveGameManager.load();
    expect(loaded.narrative?.version).toBe('2.0.0');
    expect(loaded.narrative?.storyFlags['TEST_FLAG']).toBe(true);
    expect(loaded.narrative?.relationships.taraAffinity).toBe(30);
  });

  it('renders arena, quest tracker HUD, quest log modal, and boss health bar cleanly', () => {
    const mockRenderer = new MockRenderer();
    campaignScene.showQuestLog = true;
    campaignScene.render(mockRenderer);

    expect(mockRenderer.getContext().fillRect).toHaveBeenCalled();
    expect(mockRenderer.getContext().fillText).toHaveBeenCalled();
  });

  it('handles player combat actions: dash, guard, weapon swap, combo melee, and ranged burst', () => {
    campaignScene.cinematicDirector.skip();
    if (campaignScene.dialogueTree.isActive()) campaignScene.dialogueTree.finish();

    const input = engine.getInput();

    // Dash
    vi.spyOn(input, 'isActionJustPressed').mockImplementation((a: string) => a === 'DASH');
    campaignScene.handleInput(input);
    expect(campaignScene.player.isDashing).toBe(true);

    // Guard
    vi.spyOn(input, 'isKeyHeld').mockImplementation((k: string) => k === 'KeyC');
    campaignScene.handleInput(input);
    expect(campaignScene.player.isGuarding).toBe(true);
    vi.spyOn(input, 'isKeyHeld').mockReturnValue(false);

    // Weapon Swap
    const prevWeapon = campaignScene.player.equipmentManager.getActiveWeapon();
    vi.spyOn(input, 'isKeyJustPressed').mockImplementation((k: string) => k === 'KeyQ');
    campaignScene.handleInput(input);
    expect(campaignScene.player.equipmentManager.getActiveWeapon()).not.toBe(prevWeapon);
    vi.spyOn(input, 'isKeyJustPressed').mockReturnValue(false);

    // Melee attack combo strike
    vi.spyOn(input, 'isActionJustPressed').mockImplementation((a: string) => a === 'ATTACK');
    campaignScene.handleInput(input);
    expect(campaignScene.player.isMeleeSlashing).toBe(true);

    // Ranged attack burst
    vi.spyOn(input, 'isActionJustPressed').mockImplementation((a: string) => a === 'MELEE_ATTACK');
    campaignScene.handleInput(input);
    expect(campaignScene.playerProjectiles.length).toBeGreaterThan(0);
  });

  it('handles player melee hitting sentinels, pillars, and boss', () => {
    campaignScene.cinematicDirector.skip();
    if (campaignScene.dialogueTree.isActive()) campaignScene.dialogueTree.finish();

    // Position player next to sentinel
    campaignScene.sentinels[0].position.set(campaignScene.player.position.x + 20, campaignScene.player.position.y);
    campaignScene.sentinels[0].syncBounds();

    const input = engine.getInput();
    vi.spyOn(input, 'isActionJustPressed').mockImplementation((a: string) => a === 'ATTACK');
    campaignScene.handleInput(input);

    expect(campaignScene.sentinels[0].health).toBeLessThan(100);

    // Position player next to Vanara Scout and interact with KeyE
    campaignScene.vanaraScout.position.set(campaignScene.player.position.x + 30, campaignScene.player.position.y);
    vi.spyOn(input, 'isKeyJustPressed').mockImplementation((k: string) => k === 'KeyE');
    vi.spyOn(input, 'isActionJustPressed').mockImplementation(() => false);
    campaignScene.handleInput(input);
    expect(campaignScene.cinematicDirector.isPlaying()).toBe(true);
    campaignScene.cinematicDirector.skip();

    // Transition to boss and hit boss with melee
    (campaignScene as any).transitionToAct3();
    campaignScene.cinematicDirector.skip();
    expect(campaignScene.boss).toBeDefined();

    campaignScene.player.meleeCooldownTimer = 0;
    campaignScene.boss!.position.set(campaignScene.player.position.x + 30, campaignScene.player.position.y);
    vi.spyOn(input, 'isActionJustPressed').mockImplementation((a: string) => a === 'ATTACK');
    vi.spyOn(input, 'isKeyJustPressed').mockImplementation(() => false);
    campaignScene.handleInput(input);
    expect(campaignScene.boss!.health).toBeLessThan(campaignScene.boss!.maxHealth);

    // Defeat boss -> triggers chapter victory
    campaignScene.boss!.takeDamage(99999);
    campaignScene.player.meleeCooldownTimer = 0;
    campaignScene.handleInput(input);
    expect(campaignScene.isChapterComplete).toBe(true);
  });

  it('handles menu navigation shortcuts when paused and game over', () => {
    const input = engine.getInput();
    const sceneManager = engine.getSceneManager();
    const switchSpy = vi.spyOn(sceneManager, 'switchTo');

    // Paused state KeyM
    campaignScene.isPaused = true;
    vi.spyOn(input, 'isKeyJustPressed').mockImplementation((k: string) => k === 'KeyM');
    campaignScene.handleInput(input);
    expect(switchSpy).toHaveBeenCalledWith('SplashScene');

    // Game over state KeyM
    campaignScene.isPaused = false;
    campaignScene.isGameOver = true;
    campaignScene.handleInput(input);
    expect(switchSpy).toHaveBeenCalledWith('SplashScene');
  });

  it('covers SplashScene button clicks and keyboard shortcuts', () => {
    const splashScene = new SplashScene();
    splashScene.onEnter(engine);
    expect(splashScene).toBeDefined();

    const input = engine.getInput();
    const sceneManager = engine.getSceneManager();
    const switchSpy = vi.spyOn(sceneManager, 'switchTo');

    // Keys
    const keys = [
      { key: 'KeyS', scene: 'StoryCampaignScene' },
      { key: 'KeyX', scene: 'BossEncounterScene' },
      { key: 'KeyE', scene: 'WorldExplorationScene' },
      { key: 'KeyC', scene: 'CharacterShowcaseScene' },
      { key: 'KeyB', scene: 'BhumiTempleScene' },
      { key: 'Space', scene: 'StoryScene' },
    ];

    for (const { key, scene } of keys) {
      vi.spyOn(input, 'isKeyJustPressed').mockImplementation((k: string) => k === key);
      vi.spyOn(input, 'isActionJustPressed').mockImplementation(() => false);
      vi.spyOn(input, 'isMouseButtonJustPressed').mockReturnValue(false);
      splashScene.handleInput(input);
      expect(switchSpy).toHaveBeenCalledWith(scene);
    }

    // Pause key
    vi.spyOn(input, 'isKeyJustPressed').mockReturnValue(false);
    vi.spyOn(input, 'isActionJustPressed').mockImplementation((a: string) => a === 'PAUSE');
    splashScene.handleInput(input);
    expect(switchSpy).toHaveBeenCalledWith('SettingsScene');

    // Mouse clicks on buttons
    const cx = 640;
    const cy = 360;
    const clickTargets = [
      { y: cy + 155, scene: 'StoryCampaignScene' },
      { y: cy + 195, scene: 'StoryScene' },
      { y: cy + 230, scene: 'BhumiTempleScene' },
      { y: cy + 265, scene: 'CharacterShowcaseScene' },
      { y: cy + 300, scene: 'WorldExplorationScene' },
      { y: cy + 338, scene: 'BossEncounterScene' },
    ];

    vi.spyOn(input, 'isActionJustPressed').mockReturnValue(false);
    vi.spyOn(input, 'isMouseButtonJustPressed').mockReturnValue(true);

    for (const target of clickTargets) {
      vi.spyOn(input, 'getMousePosition').mockReturnValue(new Vector2D(cx, target.y));
      splashScene.handleInput(input);
      expect(switchSpy).toHaveBeenCalledWith(target.scene);
    }
  });

  it('covers DialogueTree edge cases and choice action handlers', () => {
    const dt = new DialogueTree();
    expect(dt.start('invalid_node_id')).toBe(false);
    expect(dt.selectChoice(-1)).toBe(false);
    expect(dt.selectChoice(50)).toBe(false);

    let actionExecuted = false;
    dt.addNode({
      id: 'NODE_TEST',
      speaker: 'Test',
      speakerRole: 'Tester',
      portraitColor: '#00E5FF',
      text: 'Testing',
      choices: [
        {
          id: 'CH_1',
          text: 'Choice 1',
          targetNodeId: 'NODE_TEST_2',
          onSelectAction: () => {
            actionExecuted = true;
          },
        },
      ],
    });
    dt.addNode({
      id: 'NODE_TEST_2',
      speaker: 'Test',
      speakerRole: 'Tester',
      portraitColor: '#00E5FF',
      text: 'Target reached',
    });

    dt.start('NODE_TEST');
    dt.advance(); // finish text
    expect(dt.advance()).toBe(false); // cannot advance while waiting for choice

    dt.selectChoice(0);
    expect(actionExecuted).toBe(true);
    expect(dt.getCurrentNode()?.id).toBe('NODE_TEST_2');
  });
});
