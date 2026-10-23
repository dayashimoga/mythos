import { describe, it, expect, beforeEach } from 'vitest';
import { Vector2D } from '../../src/physics/Vector2D';
import {
  VoidArcher,
  VayuGliderMechanics,
  VedicHarpoonGrapple,
  NagaVenomSpitter,
  SerpentineConstrictor,
  ShadowIllusionist,
  SettlementEconomy,
  CloudSaveAdapter,
  SpeedrunTelemetry,
  WindArcher,
  StormSentry,
  GaleFalcon,
  DynamicWeatherTransition,
  MatarishvanCycloneBoss,
  SheshaTormentedEchoBoss,
  KalanemisShadowBoss,
  BasaltSpecularLighting,
  BhumiProceduralChunkLoader,
  KarmicChallengeMutator,
  ModdingSchema,
  GhostRunner,
} from '../../src/expansion';

describe('Expansion Subsystems Targeted Branch Coverage', () => {
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

  it('covers all VoidArcher branches: idle without target, kiting, panic blink, aiming laser render', () => {
    const archer = new VoidArcher('void_2', 100, 100);

    // Inactive guard
    archer.isActive = false;
    archer.update(0.1);
    archer.render(mockRenderer);
    archer.isActive = true;

    // Target is null
    archer.targetPos = null;
    archer.update(0.1);
    expect(archer.state).toBe('IDLE');

    // Shoot without target
    archer.shootArrow();
    expect(archer.spawnedProjectiles.length).toBe(0);

    // Execute teleport without target
    archer.executeTeleport();

    // Far target: distance > attackRange (approach target)
    archer.targetPos = new Vector2D(500, 100);
    archer.cooldownTimer = 1.0;
    archer.update(0.1);
    expect(archer.state).toBe('CHASE');

    // In attack range but on cooldown (maintains distance)
    archer.targetPos = new Vector2D(250, 100);
    archer.update(0.1);

    // Aiming state render laser line
    archer.cooldownTimer = 0;
    archer.update(0.1);
    expect(archer.state).toBe('AIMING');
    archer.render(mockRenderer);

    // Moderate damage without panic teleport
    archer.takeDamage(10);

    // Heavy damage with teleport on cooldown
    archer.teleportTimer = 3.0;
    archer.takeDamage(35);
  });

  it('covers all VayuGliderMechanics branches: horizontal glide velocity, dash cooldown, zero vector fallback, render', () => {
    const glider = new VayuGliderMechanics();

    // Gliding with zero horizontal input preserves velocity.x
    const res = glider.update(0.1, new Vector2D(40, 100), new Vector2D(0, 0), true);
    expect(res.modifiedVelocity.x).toBe(40);

    // Gliding with exhausted stamina
    glider.stamina = 2;
    glider.update(0.1, new Vector2D(0, 100), new Vector2D(1, 0), true);
    expect(glider.isGliding).toBe(false);

    // Dash triggers
    const d1 = glider.triggerVayuGatiDash(new Vector2D(0, 0)); // zero vector fallback to (1, 0)
    expect(d1).toBe(true);

    // Dash attempt while already dashing
    const d2 = glider.triggerVayuGatiDash(new Vector2D(1, 0));
    expect(d2).toBe(false);

    // Dash render
    glider.render(mockRenderer, new Vector2D(200, 200));

    // Finish dash timer
    glider.update(0.3, new Vector2D(0, 0), new Vector2D(0, 0), false);
    expect(glider.isDashing).toBe(false);

    // Attempt dash while on cooldown
    expect(glider.triggerVayuGatiDash(new Vector2D(1, 0))).toBe(false);
  });

  it('covers all VedicHarpoonGrapple branches: max range retracting, attached rest length delta <= 0, idle fire guard', () => {
    const grapple = new VedicHarpoonGrapple(100);

    // Fire without anchors in range -> hits maxRange and retracts
    grapple.fire(new Vector2D(0, 0), new Vector2D(1, 0));
    grapple.update(0.2, new Vector2D(0, 0)); // 0.2 * 850 = 170 > 100
    expect(grapple.state).toBe('RETRACTING');

    // Fully retract to IDLE
    grapple.update(0.2, new Vector2D(0, 0));
    expect(grapple.state).toBe('IDLE');

    // Cannot fire while already active
    grapple.state = 'FIRING';
    expect(grapple.fire(new Vector2D(0, 0), new Vector2D(1, 0))).toBe(false);

    // Attached state with distance already under restLength (delta <= 0)
    grapple.state = 'ATTACHED';
    grapple.attachedAnchor = { id: 'anc', position: new Vector2D(50, 0), radius: 10 };
    grapple.restLength = 80;
    const pull = grapple.update(0.1, new Vector2D(0, 0)); // dist = 50 <= restLength (80 - 26 = 54)
    expect(pull.pullForce.x).toBe(0);

    // Render when idle
    grapple.state = 'IDLE';
    grapple.render(mockRenderer);
  });

  it('covers all NagaEnemies branches: null target guards, max pools, constrict/lunge timers, cloak rendering', () => {
    // Spitter
    const spitter = new NagaVenomSpitter('s', 0, 0);
    spitter.targetPos = null;
    spitter.update(0.1);
    spitter.spitVenom();

    // Cap venom puddles at 5
    for (let i = 0; i < 7; i++) {
      spitter.targetPos = new Vector2D(50, 50);
      spitter.spitVenom();
    }
    expect(spitter.venomPuddles.length).toBe(5);

    // Constrictor
    const constrictor = new SerpentineConstrictor('c', 0, 0);
    constrictor.targetPos = null;
    constrictor.update(0.1);

    constrictor.isLunging = true;
    constrictor.lungeTimer = 0.05;
    constrictor.update(0.1);
    expect(constrictor.isLunging).toBe(false);

    constrictor.isConstricting = true;
    constrictor.constrictTimer = 0.05;
    constrictor.update(0.1);
    expect(constrictor.isConstricting).toBe(false);

    // Illusionist
    const illusionist = new ShadowIllusionist('ill', 0, 0);
    illusionist.targetPos = null;
    illusionist.update(0.1);
    illusionist.castShadowFissure();

    // Shift oldest fissures when > 3
    for (let i = 0; i < 5; i++) {
      illusionist.targetPos = new Vector2D(10, 10);
      illusionist.castShadowFissure();
    }
    expect(illusionist.fissureHazards.length).toBe(3);

    // Cloak timeout
    illusionist.isCloaked = true;
    illusionist.cloakTimer = 0.05;
    illusionist.update(0.1);
    expect(illusionist.isCloaked).toBe(false);
  });

  it('covers all SettlementEconomy branches: invalid purchases, artisan recipes missing materials or karma', () => {
    const econ = new SettlementEconomy();

    // Purchase nonexistent item
    const r1 = econ.purchaseItem('nonexistent_item', 1000);
    expect(r1.success).toBe(false);

    // Craft nonexistent recipe
    const inv = new Map<string, number>();
    const c1 = econ.craftArtisanRecipe('fake_recipe', inv, 1000);
    expect(c1.success).toBe(false);

    // Craft with insufficient karma
    const c2 = econ.craftArtisanRecipe('recipe_consecrated_blade', inv, 10);
    expect(c2.success).toBe(false);

    // Craft with insufficient materials
    inv.set('item_brahma_ingot', 0);
    const c3 = econ.craftArtisanRecipe('recipe_consecrated_blade', inv, 500);
    expect(c3.success).toBe(false);
  });

  it('covers all CloudSaveAdapter branches: LOCAL_WINS, REMOTE_WINS, identical revisions, empty offline queue', async () => {
    const cloud = new CloudSaveAdapter('FIREBASE', 'https://firebase.mythos.internal', 'LOCAL_WINS');

    const saveA = { slotId: 'slot_x', revision: 1, timestamp: 100, checksum: '1', data: {} };
    await cloud.syncSave(saveA);

    // Same revision update
    const saveA_Updated = { slotId: 'slot_x', revision: 1, timestamp: 120, checksum: '2', data: { v: 2 } };
    const rSame = await cloud.syncSave(saveA_Updated);
    expect(rSame.status).toBe('SYNCED');

    // Conflict with LOCAL_WINS
    const saveConflict = { slotId: 'slot_x', revision: 3, timestamp: 50, checksum: '3', data: { local: true } };
    const rLocal = await cloud.syncSave(saveConflict);
    expect(rLocal.status).toBe('CONFLICT_RESOLVED');

    // Conflict with REMOTE_WINS
    cloud.strategy = 'REMOTE_WINS';
    const saveRemoteWins = { slotId: 'slot_x', revision: 5, timestamp: 300, checksum: '4', data: {} };
    const rRemote = await cloud.syncSave(saveRemoteWins);
    expect(rRemote.status).toBe('CONFLICT_RESOLVED');

    // Flush empty queue
    expect(await cloud.flushOfflineQueue()).toBe(0);
  });

  it('covers all SpeedrunTelemetry branches: pause, resume, non-running split, custom split', () => {
    const sr = new SpeedrunTelemetry();
    sr.pauseTimer();
    expect(sr.isRunning).toBe(false);
    sr.resumeTimer();
    expect(sr.isRunning).toBe(true);

    sr.isRunning = false;
    expect(sr.triggerSplit('split_bhumi_sanctum')).toBeNull();

    sr.isRunning = true;
    const customSplit = sr.triggerSplit('custom_secret_room');
    expect(customSplit?.splitName).toBe('custom_secret_room');
    expect(customSplit?.deltaMs).toBe(0);
  });

  it('covers all AerialEnemies branches: inactive guards, null targets, shield blocks', () => {
    // WindArcher
    const wa = new WindArcher('wa', 0, 0);
    wa.isActive = false;
    wa.update(0.1);
    wa.render(mockRenderer);
    wa.isActive = true;
    wa.targetPos = null;
    wa.fireSquallArrow();

    // StormSentry
    const ss = new StormSentry('ss', 0, 0);
    ss.isActive = false;
    ss.update(0.1);
    ss.render(mockRenderer);
    ss.isActive = true;
    ss.targetPos = null;
    ss.update(0.1);
    ss.shieldActive = false;
    expect(ss.checkShieldBlock(0)).toBe(false);

    // GaleFalcon
    const gf = new GaleFalcon('gf', 0, 0);
    gf.isActive = false;
    gf.update(0.1);
    gf.render(mockRenderer);
    gf.isActive = true;
    gf.targetPos = null;
    gf.update(0.1);
  });

  it('covers DynamicWeatherTransition, MatarishvanCycloneBoss, SheshaTormentedEchoBoss, and KalanemisShadowBoss edge branches', () => {
    // Weather no-op transition
    const dwt = new DynamicWeatherTransition('CLEAR');
    dwt.transitionTo('CLEAR');

    // Cyclone inactive
    const cyclone = new MatarishvanCycloneBoss('cyc', 0, 0);
    cyclone.isActive = false;
    cyclone.update(0.1);
    cyclone.render(mockRenderer);
    cyclone.isActive = true;
    cyclone.targetPos = null;
    cyclone.update(0.1);

    // Shesha inactive
    const shesha = new SheshaTormentedEchoBoss('she', 0, 0);
    shesha.isActive = false;
    shesha.update(0.1);
    shesha.render(mockRenderer);
    shesha.isActive = true;
    shesha.targetPos = null;
    shesha.update(0.1);

    // Kalanemi inactive
    const kalanemi = new KalanemisShadowBoss('kal', 0, 0);
    kalanemi.isActive = false;
    kalanemi.update(0.1);
    kalanemi.render(mockRenderer);
    kalanemi.isActive = true;
    kalanemi.targetPos = null;
    kalanemi.update(0.1);
  });

  it('covers BasaltSpecularLighting, BhumiChunkLoader room types, KarmicChallengeMutator, ModdingSchema, and GhostRunner edge cases', () => {
    // Basalt block without light
    const basalt = new BasaltSpecularLighting();
    basalt.clearLights();
    const noLight = basalt.calculateBlockLighting(basalt.blocks[0]);
    expect(noLight.diffuse).toBe(0);
    expect(noLight.specular).toBe(0);
    basalt.render(mockRenderer);

    // BhumiChunkLoader room types: PILLAR_HALL, LAVA_TRENCH, ASTRA_VAULT
    const loader = new BhumiProceduralChunkLoader(600, 42);
    loader.generateChunk(1, 0); // pseudoRandom yields various types
    loader.generateChunk(0, 1);
    loader.generateChunk(1, 1);
    loader.render(mockRenderer);

    // Karmic mutators all 4
    KarmicChallengeMutator.getMutator('AGNI_OVERHEAT');
    KarmicChallengeMutator.getMutator('VAYU_TURBULENCE');
    KarmicChallengeMutator.getMutator('VOID_VAMPIRISM');

    // Modding schema edge cases
    expect(ModdingSchema.validateMod(null).isValid).toBe(false);
    expect(ModdingSchema.validateMod({ modId: 'id', modName: 123 as any }).isValid).toBe(false);
    expect(ModdingSchema.validateMod({ modId: 'id', modName: 'n', version: 1 as any }).isValid).toBe(false);
    expect(ModdingSchema.validateMod({ modId: 'id', modName: 'n', version: '1.0' }).isValid).toBe(false);

    // GhostRunner without playback data
    const gr = new GhostRunner();
    expect(gr.getGhostPositionAtCurrentTime()).toBeNull();
    gr.render(mockRenderer);
  });
});
