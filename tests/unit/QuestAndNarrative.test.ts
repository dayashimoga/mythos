import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuestManager } from '../../src/narrative/QuestManager';
import { DialogueTree } from '../../src/narrative/DialogueTree';
import { CampaignChapter1 } from '../../src/narrative/CampaignChapter1';
import {
  MissionDefinition,
  NarrativeSaveState,
  DialogueNodeData,
} from '../../src/narrative/NarrativeTypes';
import { Vector2D } from '../../src/physics/Vector2D';
import { IRenderer } from '../../src/render/CanvasRenderer';

class MockRenderer implements IRenderer {
  private ctx: any;
  private camera: any;

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
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      measureText: vi.fn((text: string) => ({ width: text.length * 8 })),
      setLineDash: vi.fn(),
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
  drawAABB() {}
  drawMandala() {}
  beginWorldPass() {}
  endWorldPass() {}
  render() {}
}

describe('Stage 5: Narrative Data Model & QuestManager', () => {
  let questManager: QuestManager;

  const mockMission1: MissionDefinition = {
    id: 'TEST_M1',
    title: 'The First Step',
    chapter: 1,
    act: 1,
    description: 'Awaken and gather initial courage',
    prerequisites: [],
    objectives: [
      {
        id: 'OBJ_SHARDS',
        description: 'Gather 3 solar shards',
        type: 'COLLECT_SHARD',
        targetCount: 3,
        currentCount: 0,
        isCompleted: false,
      },
      {
        id: 'OBJ_ALTAR',
        description: 'Consecrate the sanctum altar',
        type: 'INTERACT_NPC',
        targetTag: 'sun_altar',
        targetCount: 1,
        currentCount: 0,
        isCompleted: false,
      },
    ],
    rewards: {
      essence: 150,
      storyFlags: { test_m1_complete: true },
    },
    onCompleteFlags: { test_m1_done: true },
  };

  const mockMission2: MissionDefinition = {
    id: 'TEST_M2',
    title: 'Into the Wilds',
    chapter: 1,
    act: 1,
    description: 'Travel through the gate',
    prerequisites: ['TEST_M1'],
    objectives: [
      {
        id: 'OBJ_EXPLORE',
        description: 'Reach Dandaka threshold',
        type: 'EXPLORE_LOCATION',
        targetCount: 1,
        currentCount: 0,
        isCompleted: false,
      },
    ],
    rewards: {
      essence: 250,
      storyFlags: { test_m2_complete: true },
    },
  };

  beforeEach(() => {
    questManager = new QuestManager();
  });

  it('registers missions and reports initial locked/available status based on prerequisites', () => {
    questManager.registerMissions([mockMission1, mockMission2]);

    expect(questManager.getAllMissions().length).toBe(2);
    expect(questManager.getMissionStatus('TEST_M1')).toBe('AVAILABLE');
    expect(questManager.getMissionStatus('TEST_M2')).toBe('LOCKED');
    expect(questManager.canActivateMission('TEST_M1')).toBe(true);
    expect(questManager.canActivateMission('TEST_M2')).toBe(false);
  });

  it('activates mission if prerequisites are satisfied and rejects if locked', () => {
    questManager.registerMissions([mockMission1, mockMission2]);

    expect(questManager.startMission('TEST_M2')).toBe(false);
    expect(questManager.startMission('TEST_M1')).toBe(true);
    expect(questManager.getActiveMission()?.id).toBe('TEST_M1');
    expect(questManager.getMissionStatus('TEST_M1')).toBe('ACTIVE');
  });

  it('progresses objectives and completes mission when all required objectives are fulfilled', () => {
    let completed = false;
    questManager.onMissionCompleted = () => {
      completed = true;
    };

    questManager.registerMissions([mockMission1, mockMission2]);
    questManager.startMission('TEST_M1');

    // Progress shards via triggerObjectiveEvent
    questManager.triggerObjectiveEvent('COLLECT_SHARD', undefined, 1);
    let m1 = questManager.getMission('TEST_M1');
    expect(m1?.objectives[0].currentCount).toBe(1);
    expect(m1?.objectives[0].isCompleted).toBe(false);

    // Add remaining 2 shards
    questManager.triggerObjectiveEvent('COLLECT_SHARD', undefined, 2);
    expect(m1?.objectives[0].currentCount).toBe(3);
    expect(m1?.objectives[0].isCompleted).toBe(true);
    expect(questManager.getMissionStatus('TEST_M1')).toBe('ACTIVE');

    // Consecrate altar -> completes mission
    questManager.triggerObjectiveEvent('INTERACT_NPC', 'sun_altar', 1);
    expect(m1?.objectives[1].isCompleted).toBe(true);
    expect(questManager.getMissionStatus('TEST_M1')).toBe('COMPLETED');
    expect(questManager.getActiveMission()).toBeNull();
    expect(completed).toBe(true);

    // On-complete flags applied
    expect(questManager.getFlag('test_m1_done')).toBe(true);

    // TEST_M2 should now be unlocked and available
    expect(questManager.getMissionStatus('TEST_M2')).toBe('AVAILABLE');
    expect(questManager.canActivateMission('TEST_M2')).toBe(true);
  });

  it('handles mission failure callback', () => {
    let failed = false;
    questManager.onMissionFailed = () => {
      failed = true;
    };

    questManager.registerMissions([mockMission1]);
    questManager.startMission('TEST_M1');

    questManager.failMission('TEST_M1');
    expect(questManager.getMissionStatus('TEST_M1')).toBe('FAILED');
    expect(questManager.getActiveMission()).toBeNull();
    expect(failed).toBe(true);
  });

  it('manages story flags and character relationship affinity updates', () => {
    questManager.setFlag('SOLAR_RESONANCE_ACTIVATED', true);
    expect(questManager.getFlag('SOLAR_RESONANCE_ACTIVATED')).toBe(true);
    expect(questManager.getFlag('NON_EXISTENT', false)).toBe(false);

    questManager.modifyAffinity({ tara: 15, vanara: 10, karmic: 5 });
    expect(questManager.relationships.taraAffinity).toBe(15);
    expect(questManager.relationships.vanaraTrust).toBe(10);
    expect(questManager.relationships.karmicBalance).toBe(5);
  });

  it('records dialogue history', () => {
    expect(questManager.dialogueHistory.length).toBe(0);
    questManager.recordDialogue('tara_awaken_1');
    expect(questManager.dialogueHistory).toContain('tara_awaken_1');
  });

  it('serializes state with cryptographic checksum and restores state reliably', () => {
    questManager.registerMissions([mockMission1, mockMission2]);
    questManager.startMission('TEST_M1');
    questManager.triggerObjectiveEvent('COLLECT_SHARD', undefined, 2);
    questManager.setFlag('FLAG_ALPHA', true);
    questManager.modifyAffinity({ tara: 25 });
    questManager.recordDialogue('TARA_GREET');
    questManager.unlockedCutscenes.push('CS_OPENING');

    const serialized: NarrativeSaveState = questManager.exportSaveState();
    expect(serialized.version).toBe('2.0.0');
    expect(serialized.activeMissionId).toBe('TEST_M1');
    expect(serialized.storyFlags['FLAG_ALPHA']).toBe(true);
    expect(serialized.relationships.taraAffinity).toBe(25);
    expect(serialized.checksum).toBeDefined();

    // Deserialize into fresh QuestManager
    const restoredManager = new QuestManager();
    restoredManager.registerMissions([mockMission1, mockMission2]);

    const success = restoredManager.loadSaveState(serialized);
    expect(success).toBe(true);
    expect(restoredManager.getActiveMission()?.id).toBe('TEST_M1');
    expect(restoredManager.getMission('TEST_M1')?.objectives[0].currentCount).toBe(2);
    expect(restoredManager.getFlag('FLAG_ALPHA')).toBe(true);
    expect(restoredManager.relationships.taraAffinity).toBe(25);
    expect(restoredManager.dialogueHistory).toContain('TARA_GREET');
    expect(restoredManager.unlockedCutscenes).toContain('CS_OPENING');
  });

  it('rejects tampered narrative save state when checksum does not match', () => {
    questManager.registerMissions([mockMission1]);
    questManager.startMission('TEST_M1');
    const serialized = questManager.exportSaveState();

    // Tamper with data without recomputing checksum
    serialized.relationships.taraAffinity = 99;

    const restoredManager = new QuestManager();
    restoredManager.registerMissions([mockMission1]);
    const success = restoredManager.loadSaveState(serialized);
    expect(success).toBe(false);
  });
});

describe('Stage 5: Branching Dialogue Tree System', () => {
  let dialogueTree: DialogueTree;
  let renderer: MockRenderer;

  const testNode1: DialogueNodeData = {
    id: 'START_NODE',
    speaker: 'Devi Tara',
    speakerRole: 'Celestial Oracle',
    portraitColor: '#00E5FF',
    expression: 'focused',
    text: 'Veer, the Brahmic seal is weakening.',
    choices: [
      {
        id: 'OPT_DEVOTION',
        text: 'I will uphold the cosmic order, Devi.',
        targetNodeId: 'NODE_DEVOTION',
        affinityImpact: { tara: 2, karmic: 1 },
      },
      {
        id: 'OPT_DOUBT',
        text: 'Why was this burden placed on me?',
        targetNodeId: 'NODE_DOUBT',
        affinityImpact: { tara: -1, karmic: -1 },
      },
      {
        id: 'OPT_CONDITIONAL',
        text: 'I found an ancient relic!',
        targetNodeId: 'NODE_RELIC',
        requiredFlag: 'RELIC_FOUND',
        requiredValue: true,
      },
    ],
  };

  const testNodeDevotion: DialogueNodeData = {
    id: 'NODE_DEVOTION',
    speaker: 'Devi Tara',
    speakerRole: 'Celestial Oracle',
    portraitColor: '#00E5FF',
    expression: 'focused',
    text: 'Your faith shall be your armor.',
  };

  const testNodeDoubt: DialogueNodeData = {
    id: 'NODE_DOUBT',
    speaker: 'Devi Tara',
    speakerRole: 'Celestial Oracle',
    portraitColor: '#00E5FF',
    expression: 'sorrowful',
    text: 'Doubt is natural, Veer. But action defines the soul.',
  };

  beforeEach(() => {
    dialogueTree = new DialogueTree();
    renderer = new MockRenderer();
  });

  it('registers dialogue nodes and starts conversation at specified node', () => {
    dialogueTree.registerNodes([testNode1, testNodeDevotion, testNodeDoubt]);

    expect(dialogueTree.isActive()).toBe(false);
    expect(dialogueTree.start('START_NODE')).toBe(true);
    expect(dialogueTree.isActive()).toBe(true);
    expect(dialogueTree.getCurrentNode()?.id).toBe('START_NODE');
  });

  it('animates text with typewriter effect and completes on command', () => {
    dialogueTree.registerNodes([testNode1]);
    dialogueTree.start('START_NODE');

    // Initially displayed length is 0
    dialogueTree.update(0.05); // ~2 characters
    expect(dialogueTree.isWaitingForChoice()).toBe(false);

    // Advance skips typing to completion
    dialogueTree.advance();
    expect(dialogueTree.isWaitingForChoice()).toBe(true);
  });

  it('filters choices based on story flags and branches to target node', () => {
    dialogueTree.registerNodes([testNode1, testNodeDevotion, testNodeDoubt]);
    dialogueTree.start('START_NODE');
    dialogueTree.advance(); // finish text typing

    // RELIC_FOUND is undefined, so only 2 choices available
    let availableChoices = dialogueTree.getAvailableChoices({});
    expect(availableChoices.length).toBe(2);
    expect(availableChoices[0].id).toBe('OPT_DEVOTION');
    expect(availableChoices[1].id).toBe('OPT_DOUBT');

    // Grant relic story flag and check that 3rd choice appears
    availableChoices = dialogueTree.getAvailableChoices({ RELIC_FOUND: true });
    expect(availableChoices.length).toBe(3);

    // Select choice 0 (Devotion)
    let selectedChoiceId = '';
    dialogueTree.onChoiceSelected = (choice) => {
      selectedChoiceId = choice.id;
    };
    const chose = dialogueTree.selectChoice(0, { RELIC_FOUND: true });
    expect(chose).toBe(true);
    expect(selectedChoiceId).toBe('OPT_DEVOTION');
    expect(dialogueTree.getCurrentNode()?.id).toBe('NODE_DEVOTION');
  });

  it('advances through linear nodes and fires onDialogueComplete at terminal node', () => {
    const nodeA: DialogueNodeData = {
      id: 'NODE_A',
      speaker: 'Devi Tara',
      speakerRole: 'Celestial Oracle',
      portraitColor: '#00E5FF',
      text: 'First line.',
      nextNodeId: 'NODE_B',
    };
    const nodeB: DialogueNodeData = {
      id: 'NODE_B',
      speaker: 'Devi Tara',
      speakerRole: 'Celestial Oracle',
      portraitColor: '#00E5FF',
      text: 'Final line.',
    };

    dialogueTree.registerNodes([nodeA, nodeB]);
    dialogueTree.start('NODE_A');

    // Finish Node A typing
    dialogueTree.advance();
    // Advance to Node B
    dialogueTree.advance();
    expect(dialogueTree.getCurrentNode()?.id).toBe('NODE_B');

    // Finish Node B typing
    dialogueTree.advance();

    let completed = false;
    dialogueTree.onDialogueComplete = () => {
      completed = true;
    };
    // Advance past terminal node
    dialogueTree.advance();

    expect(dialogueTree.isActive()).toBe(false);
    expect(completed).toBe(true);
  });

  it('renders dialogue box, speaker portrait, badge, and choices on canvas without errors', () => {
    dialogueTree.registerNodes([testNode1]);
    dialogueTree.start('START_NODE');
    dialogueTree.advance(); // trigger choices awaiting

    dialogueTree.render(renderer);
    expect(renderer.getContext().fillRect).toHaveBeenCalled();
    expect(renderer.getContext().fillText).toHaveBeenCalled();
  });
});

describe('Stage 5: CampaignChapter1 Canonical Script & Progression', () => {
  it('builds full Chapter 1 mission graph with all 5 canonical missions', () => {
    const missions = CampaignChapter1.getMissions();
    expect(missions.length).toBe(5);

    const ids = missions.map((m) => m.id);
    expect(ids).toEqual([
      'M1_SANCTUM_AWAKENING',
      'M2_SANCTUM_CONSECRATION',
      'M3_DANDAKA_INFILTRATION',
      'M4_HARMONIZE_PILLARS',
      'M5_OBSIDIAN_THRONE',
    ]);

    // Check DAG continuity
    expect(missions[0].prerequisites).toEqual([]);
    expect(missions[1].prerequisites).toEqual(['M1_SANCTUM_AWAKENING']);
    expect(missions[2].prerequisites).toEqual(['M2_SANCTUM_CONSECRATION']);
    expect(missions[3].prerequisites).toEqual(['M3_DANDAKA_INFILTRATION']);
    expect(missions[4].prerequisites).toEqual(['M4_HARMONIZE_PILLARS']);
  });

  it('builds canonical dialogue nodes for Devi Tara, Vanara Kapi, and Mahishasura', () => {
    const dialogues = CampaignChapter1.getDialogues();
    expect(dialogues.length).toBeGreaterThanOrEqual(10);

    const speakers = new Set(dialogues.map((d) => d.speaker));
    expect(speakers.has('Devi Tara')).toBe(true);
    expect(speakers.has('Kapi')).toBe(true);
    expect(speakers.has('Mahishasura')).toBe(true);
  });

  it('integrates CampaignChapter1 into QuestManager and plays through all 5 missions sequentially', () => {
    const questManager = new QuestManager(CampaignChapter1.getMissions());

    // Initial state: M1 is AVAILABLE
    expect(questManager.getMissionStatus('M1_SANCTUM_AWAKENING')).toBe('AVAILABLE');
    expect(questManager.startMission('M1_SANCTUM_AWAKENING')).toBe(true);
    expect(questManager.getActiveMission()?.id).toBe('M1_SANCTUM_AWAKENING');

    // M1 objectives: INTERACT_NPC (devi_tara), DEFEAT_TARGET (training_strike x3)
    questManager.triggerObjectiveEvent('INTERACT_NPC', 'devi_tara', 1);
    questManager.triggerObjectiveEvent('DEFEAT_TARGET', 'training_strike', 3);
    expect(questManager.getMissionStatus('M1_SANCTUM_AWAKENING')).toBe('COMPLETED');
    expect(questManager.getFlag('sanctum_awakened')).toBe(true);

    // M2 unlocked: COLLECT_SHARD x3, DEFEAT_TARGET (corrupted_sentinel x2), CONSECRATE_ALTAR (sun_altar)
    expect(questManager.getMissionStatus('M2_SANCTUM_CONSECRATION')).toBe('AVAILABLE');
    questManager.startMission('M2_SANCTUM_CONSECRATION');
    questManager.triggerObjectiveEvent('COLLECT_SHARD', undefined, 3);
    questManager.triggerObjectiveEvent('DEFEAT_TARGET', 'corrupted_sentinel', 2);
    questManager.triggerObjectiveEvent('CONSECRATE_ALTAR', 'sun_altar', 1);
    expect(questManager.getMissionStatus('M2_SANCTUM_CONSECRATION')).toBe('COMPLETED');
    expect(questManager.getFlag('altar_consecrated')).toBe(true);

    // M3 unlocked: EXPLORE_LOCATION (torana_gate), CHOOSE_DIALOGUE (vanara_kapi)
    expect(questManager.getMissionStatus('M3_DANDAKA_INFILTRATION')).toBe('AVAILABLE');
    questManager.startMission('M3_DANDAKA_INFILTRATION');
    questManager.triggerObjectiveEvent('EXPLORE_LOCATION', undefined, 1);
    questManager.triggerObjectiveEvent('CHOOSE_DIALOGUE', 'vanara_kapi', 1);
    expect(questManager.getMissionStatus('M3_DANDAKA_INFILTRATION')).toBe('COMPLETED');
    expect(questManager.getFlag('vanara_contact_made')).toBe(true);

    // M4 unlocked: CONSECRATE_ALTAR (pillar_om), CONSECRATE_ALTAR (pillar_krim)
    expect(questManager.getMissionStatus('M4_HARMONIZE_PILLARS')).toBe('AVAILABLE');
    questManager.startMission('M4_HARMONIZE_PILLARS');
    questManager.triggerObjectiveEvent('CONSECRATE_ALTAR', 'pillar_om', 1);
    questManager.triggerObjectiveEvent('CONSECRATE_ALTAR', 'pillar_krim', 1);
    expect(questManager.getMissionStatus('M4_HARMONIZE_PILLARS')).toBe('COMPLETED');
    expect(questManager.getFlag('chasm_bridge_accessible')).toBe(true);

    // M5 unlocked: EXPLORE_LOCATION, DEFEAT_TARGET (boss_stagger), DEFEAT_TARGET (boss_mahishasura)
    expect(questManager.getMissionStatus('M5_OBSIDIAN_THRONE')).toBe('AVAILABLE');
    questManager.startMission('M5_OBSIDIAN_THRONE');
    questManager.triggerObjectiveEvent('EXPLORE_LOCATION', undefined, 1);
    questManager.triggerObjectiveEvent('DEFEAT_TARGET', 'boss_stagger', 1);
    questManager.triggerObjectiveEvent('DEFEAT_TARGET', 'boss_mahishasura', 1);
    expect(questManager.getMissionStatus('M5_OBSIDIAN_THRONE')).toBe('COMPLETED');
    expect(questManager.getFlag('campaign_chapter_1_done')).toBe(true);

    // Full 5 missions done
    expect(questManager.getAllMissions().every((m) => questManager.getMissionStatus(m.id) === 'COMPLETED')).toBe(true);
  });
});
