import { describe, it, expect, beforeEach } from 'vitest';
import { Vector2D } from '../../src/physics/Vector2D';
import {
  VoronoiBiomeGenerator,
  DynamicWeatherTransition,
  PatalaLabyrinthGenerator,
  FlockingSystem,
  SettlementEconomy,
  CloudSaveAdapter,
  SpeedrunTelemetry,
  ModdingSchema,
  CommunityQuestEditor,
  GhostRunner,
  KarmicChallengeMutator,
  GameTelemetryPipeline,
  ACT2_PATALA_MISSIONS,
  ACT2_DIALOGUES,
} from '../../src/expansion';

describe('Expansion Pipeline Backlog: Stages 6-10 Subsystems', () => {
  let mockRenderer: any;
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      arc: () => {},
      ellipse: () => {},
      fillRect: () => {},
      closePath: () => {},
      setLineDash: () => {},
      translate: () => {},
      rotate: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      globalCompositeOperation: 'source-over',
      globalAlpha: 1.0,
      strokeStyle: '#000',
      fillStyle: '#000',
      lineWidth: 1,
      shadowColor: '#000',
      shadowBlur: 0,
    };

    mockRenderer = {
      clear: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      drawRect: () => {},
      drawCircle: () => {},
      drawText: () => {},
      drawAABB: () => {},
      drawMandala: () => {},
      getCamera: () => ({}),
      getViewport: () => ({ x: 0, y: 0, width: 800, height: 600 }),
      getContext: () => mockCtx,
      beginWorldPass: () => {},
      endWorldPass: () => {},
    };
  });

  describe('TASK-601: VoronoiBiomeGenerator', () => {
    it('partitions space into 7 Sacred Realm biomes with Lloyd relaxation', () => {
      const gen = new VoronoiBiomeGenerator(1200, 800, 14);
      expect(gen.cells.length).toBe(14);

      const sample = gen.getBiomeAt(400, 300);
      expect(sample).toBeDefined();
      expect(['BHUMI', 'PATALA', 'VAYU', 'AGNI', 'VARUNA', 'AKASHA', 'MOKSHA']).toContain(sample.biome);

      expect(() => gen.render(mockRenderer)).not.toThrow();
    });
  });

  describe('TASK-602: DynamicWeatherTransition', () => {
    it('blends weather transitions, renders fog, and generates fork lightning', () => {
      const weather = new DynamicWeatherTransition('CLEAR');
      expect(weather.currentState).toBe('CLEAR');

      weather.transitionTo('MONSOON_RAIN', 2.0);
      expect(weather.targetState).toBe('MONSOON_RAIN');
      expect(weather.transitionProgress).toBe(0);

      weather.update(1.0);
      expect(weather.transitionProgress).toBeCloseTo(0.5, 1);

      weather.update(1.2);
      expect(weather.currentState).toBe('MONSOON_RAIN');

      weather.triggerLightning(new Vector2D(100, 0), new Vector2D(100, 400));
      expect(weather.lightningStrikes.length).toBeGreaterThanOrEqual(1);
      expect(weather.screenFlashAlpha).toBeGreaterThan(0);

      expect(() => weather.render(mockRenderer)).not.toThrow();
    });
  });

  describe('TASK-603: PatalaLabyrinthGenerator', () => {
    it('generates interconnected BSP chambers, corridors, and venom channels', () => {
      const lab = new PatalaLabyrinthGenerator(1000, 800);
      expect(lab.rooms.length).toBe(6); // 4 chambers + 2 cross corridors
      expect(lab.venomPools.length).toBeGreaterThan(0);
      expect(lab.walls.length).toBe(4);

      const spawn = lab.getSpawnPosition();
      expect(spawn.x).toBeGreaterThan(0);
      expect(spawn.y).toBeGreaterThan(0);

      expect(() => lab.render(mockRenderer)).not.toThrow();
    });
  });

  describe('TASK-604: FlockingSystem', () => {
    it('executes Reynolds boid separation, alignment, cohesion, and predator avoidance', () => {
      const flock = new FlockingSystem(12, 600, 400);
      expect(flock.boids.length).toBe(12);

      const boid0Initial = new Vector2D(flock.boids[0].position.x, flock.boids[0].position.y);
      flock.update(0.1);
      expect(flock.boids[0].position.distanceTo(boid0Initial)).toBeGreaterThan(0);

      // Threat avoidance
      const threat = new Vector2D(flock.boids[0].position.x + 20, flock.boids[0].position.y);
      flock.update(0.1, threat);

      expect(() => flock.render(mockRenderer)).not.toThrow();
    });
  });

  describe('TASK-605: SettlementEconomy', () => {
    it('calculates karma discounts, manages merchant barter, and crafts artisan recipes', () => {
      const economy = new SettlementEconomy();
      const ingot = economy.merchantInventory.find((i) => i.id === 'item_brahma_ingot')!;

      // Neutral karma price
      const priceNeutral = economy.getAdjustedPrice(ingot, 0);
      expect(priceNeutral).toBe(100);

      // Positive karma discount (+100 gives 25% discount)
      const priceGood = economy.getAdjustedPrice(ingot, 100);
      expect(priceGood).toBe(75);

      // Negative karma penalty
      const priceBad = economy.getAdjustedPrice(ingot, -100);
      expect(priceBad).toBe(125);

      // Successful purchase
      const res = economy.purchaseItem('item_brahma_ingot', 200, 100);
      expect(res.success).toBe(true);
      expect(res.costPaid).toBe(75);
      expect(res.remainingCurrency).toBe(125);

      // Failed purchase due to low currency
      const resFail = economy.purchaseItem('item_dharma_talisman', 10, 0);
      expect(resFail.success).toBe(false);

      // Artisan crafting
      const inventory = new Map<string, number>();
      inventory.set('item_brahma_ingot', 2);
      inventory.set('item_surya_incense', 2);

      const craftRes = economy.craftArtisanRecipe('recipe_consecrated_blade', inventory, 200);
      expect(craftRes.success).toBe(true);
      expect(craftRes.craftedName).toContain('Consecrated Agni Chakram');
      expect(inventory.get('item_brahma_ingot')).toBe(1);
    });
  });

  describe('TASK-803 & TASK-1001: CloudSaveAdapter', () => {
    it('handles remote sync, conflict resolution, and offline queueing', async () => {
      const cloud = new CloudSaveAdapter('WEBDAV', 'https://save.mythos.internal', 'LATEST_TIMESTAMP');

      const save1 = {
        slotId: 'slot_1',
        revision: 1,
        timestamp: 1000,
        checksum: 'abc1',
        data: { level: 2 },
      };

      const res1 = await cloud.syncSave(save1);
      expect(res1.status).toBe('SYNCED');

      // Conflict: remote has revision 1 timestamp 1000, local has revision 2 timestamp 2000
      const save2 = {
        slotId: 'slot_1',
        revision: 2,
        timestamp: 2000,
        checksum: 'abc2',
        data: { level: 4 },
      };
      const resConflict = await cloud.syncSave(save2);
      expect(resConflict.status).toBe('CONFLICT_RESOLVED');
      expect(resConflict.resolvedPayload?.data).toEqual({ level: 4 });

      // Offline queueing
      cloud.isOnline = false;
      const saveOffline = {
        slotId: 'slot_2',
        revision: 1,
        timestamp: 3000,
        checksum: 'abc3',
        data: { level: 1 },
      };
      const resOffline = await cloud.syncSave(saveOffline);
      expect(resOffline.status).toBe('OFFLINE_QUEUED');
      expect(cloud.offlineQueue.length).toBe(1);

      // Reconnect and flush
      cloud.isOnline = true;
      const flushed = await cloud.flushOfflineQueue();
      expect(flushed).toBe(1);
      expect(cloud.offlineQueue.length).toBe(0);
      expect(cloud.getRemoteSave('slot_2')).toBeDefined();
    });
  });

  describe('TASK-804 & TASK-1002: SpeedrunTelemetry', () => {
    it('tracks IGT, calculates deltas, formats clock, and generates validated anti-cheat payload', () => {
      const speedrun = new SpeedrunTelemetry();
      speedrun.startTimer();
      expect(speedrun.isRunning).toBe(true);

      speedrun.update(1.5);
      expect(speedrun.elapsedTimeMs).toBeCloseTo(1500, 10);

      const split1 = speedrun.triggerSplit('split_bhumi_sanctum', 1400);
      expect(split1).toBeDefined();
      expect(split1?.deltaMs).toBe(100); // 1500 - 1400 = +100ms delta

      speedrun.update(2.0);
      const splitFinal = speedrun.triggerSplit('split_titan_defeat', 4000);
      expect(splitFinal).toBeDefined();
      expect(speedrun.isRunning).toBe(false); // Finished run
      expect(speedrun.personalBestMs).toBeDefined();

      const formatted = speedrun.formatTime(72450); // 1 min 12.45 sec
      expect(formatted).toBe('01:12.45');

      const payload = speedrun.generateTelemetryPayload('VeerRunner', 'ANY_PERCENT');
      expect(payload.runnerTag).toBe('VeerRunner');
      expect(payload.validationHash.startsWith('VALID_')).toBe(true);
      expect(payload.splits.length).toBe(2);
    });
  });

  describe('TASK-901: ModdingSchema', () => {
    it('validates custom Astra weapon mod declarations and reports validation errors', () => {
      const validMod = {
        modId: 'mod_brahma_bow',
        modName: 'Brahmastra Solar Longbow',
        version: '1.0.0',
        author: 'AstraModder',
        weapon: {
          name: 'Solar Longbow',
          description: 'A bow infused with pure solar radiance.',
          damageType: 'CELESTIAL',
          baseDamage: 85,
          attackSpeedMultiplier: 1.2,
          comboHits: 3,
          specialAbility: 'Surya Piercing Volley',
        },
        visuals: {
          primaryColor: '#ffd700',
          secondaryColor: '#ff6600',
          particleCount: 20,
        },
      };

      const validReport = ModdingSchema.validateMod(validMod);
      expect(validReport.isValid).toBe(true);
      expect(validReport.errors.length).toBe(0);

      const loadRes = ModdingSchema.loadMod(JSON.stringify(validMod));
      expect(loadRes.success).toBe(true);
      expect(loadRes.mod?.modId).toBe('mod_brahma_bow');

      // Invalid mod tests
      const invalidMod = {
        modId: '',
        weapon: {
          damageType: 'UNKNOWN_TYPE',
          baseDamage: -50,
          comboHits: 99,
        },
      };
      const invalidReport = ModdingSchema.validateMod(invalidMod);
      expect(invalidReport.isValid).toBe(false);
      expect(invalidReport.errors.length).toBeGreaterThan(0);

      const badJsonRes = ModdingSchema.loadMod('{ bad json');
      expect(badJsonRes.success).toBe(false);
    });
  });

  describe('TASK-902: CommunityQuestEditor', () => {
    it('constructs narrative DAGs, validates acyclicity, and exports/imports graphs', () => {
      const editor = new CommunityQuestEditor('quest_01', 'Sanctum Pilgrimage', 'Designer');

      editor.addNode({
        id: 'node_start',
        type: 'START',
        title: 'Begin Journey',
        description: 'Speak with Devi Tara',
        nextNodes: [],
      });

      editor.addNode({
        id: 'node_obj',
        type: 'OBJECTIVE',
        title: 'Purify Shrine',
        description: 'Cleanse 3 corrupted pillars',
        nextNodes: [],
      });

      editor.addNode({
        id: 'node_end',
        type: 'REWARD_TERMINUS',
        title: 'Consecration',
        description: 'Receive Surya blessing',
        nextNodes: [],
      });

      editor.connectNodes('node_start', 'node_obj');
      editor.connectNodes('node_obj', 'node_end');

      expect(editor.detectCycles()).toBe(false);

      const exported = editor.exportGraph();
      expect(exported).not.toBeNull();
      expect(exported?.nodes.length).toBe(3);

      // Test cycle detection
      editor.connectNodes('node_end', 'node_start'); // Creates cycle!
      expect(editor.detectCycles()).toBe(true);
      expect(editor.exportGraph()).toBeNull();

      // Test import
      const editor2 = new CommunityQuestEditor();
      const imported = editor2.importGraph(exported!);
      expect(imported).toBe(true);
      expect(editor2.nodes.size).toBe(3);
    });
  });

  describe('TASK-903: GhostRunner', () => {
    it('records frames, stops to create ghost data, and interpolates playback positions', () => {
      const ghost = new GhostRunner();
      ghost.startRecording();
      expect(ghost.isRecording).toBe(true);

      ghost.recordFrame(0, new Vector2D(100, 100), 'RUN');
      ghost.recordFrame(100, new Vector2D(200, 100), 'RUN');
      ghost.recordFrame(200, new Vector2D(300, 100), 'SLASH');

      const data = ghost.stopRecording('VeerSpeed', 200);
      expect(data.frames.length).toBe(3);

      ghost.loadGhost(data);
      expect(ghost.isPlaying).toBe(true);

      // Playback at 50ms: midpoint between (100,100) and (200,100) -> (150, 100)
      ghost.playbackTimeMs = 50;
      const sample = ghost.getGhostPositionAtCurrentTime();
      expect(sample?.position.x).toBeCloseTo(150, 1);
      expect(sample?.position.y).toBe(100);

      expect(() => ghost.render(mockRenderer)).not.toThrow();
    });
  });

  describe('TASK-904: KarmicChallengeMutator', () => {
    it('retrieves mutator configurations and computes seasonal challenge score multipliers', () => {
      const mEclipse = KarmicChallengeMutator.getMutator('ECLIPSE_DARKNESS');
      expect(mEclipse.scoreMultiplier).toBe(1.8);
      expect(mEclipse.enemyDamageModifier).toBe(1.3);

      const season = KarmicChallengeMutator.getWeeklySeason(1);
      expect(season.activeMutators.length).toBe(2);
      expect(season.combinedMultiplier).toBeGreaterThan(1.5);

      const baseScore = 1000;
      const score = KarmicChallengeMutator.computeFinalKarmicScore(baseScore, season, false);
      expect(score).toBeGreaterThan(1500);

      const noHitScore = KarmicChallengeMutator.computeFinalKarmicScore(baseScore, season, true);
      expect(noHitScore).toBe(Math.round(score * 1.5));
    });
  });

  describe('TASK-905: GameTelemetryPipeline', () => {
    it('buffers events, handles memory eviction, and dispatches batches', () => {
      const telem = new GameTelemetryPipeline('https://telemetry.test', 15, 5);

      // Record 12 events
      for (let i = 0; i < 12; i++) {
        telem.recordEvent('COMBO_CHAIN_COMPLETED', { hitCount: 3, damage: 120 });
      }

      // Batch size = 5, so 10 events should have been dispatched in 2 batches of 5, leaving 2 in queue
      expect(telem.getDispatchedBatchCount()).toBe(2);
      expect(telem.getPendingEventCount()).toBe(2);

      const manualBatch = telem.flushBatch();
      expect(manualBatch.length).toBe(2);
      expect(telem.getPendingEventCount()).toBe(0);
    });
  });

  describe('TASK-1003: Act II Patala Narrative Campaign Content', () => {
    it('defines 5 canonical Act II missions and validated dialogue trees', () => {
      expect(ACT2_PATALA_MISSIONS.length).toBe(5);

      const m1 = ACT2_PATALA_MISSIONS[0];
      expect(m1.id).toBe('M2_1_DESCENT_TO_PATALA');
      expect(m1.act).toBe(2);
      expect(m1.objectives.length).toBeGreaterThan(0);

      const finalMission = ACT2_PATALA_MISSIONS[4];
      expect(finalMission.id).toBe('M2_5_SHESHAS_ECHO');
      expect(finalMission.title).toContain('Tormented');

      expect(ACT2_DIALOGUES.length).toBe(3);
      const greeting = ACT2_DIALOGUES[0];
      expect(greeting.speaker).toBe('King Vasuki');
      expect(greeting.choices?.length).toBe(2);
    });
  });
});
