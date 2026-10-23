import { describe, it, expect, beforeEach } from 'vitest';
import { Vector2D } from '../../src/physics/Vector2D';
import { AABB } from '../../src/physics/AABB';
import {
  BhumiProceduralChunkLoader,
  VoidArcher,
  ElementalRuneAttunement,
  KalanemisShadowBoss,
  VolumetricLightShafts,
  FluidDynamics,
  NagaVenomSpitter,
  SerpentineConstrictor,
  ShadowIllusionist,
  VedicHarpoonGrapple,
  SheshaTormentedEchoBoss,
  BasaltSpecularLighting,
  WindDraftSystem,
  WindArcher,
  StormSentry,
  GaleFalcon,
  VayuGliderMechanics,
  MatarishvanCycloneBoss,
  AtmosphericScatter,
} from '../../src/expansion';

describe('Expansion Pipeline Backlog: Stages 1-3 Subsystems', () => {
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

  describe('TASK-101: BhumiProceduralChunkLoader', () => {
    it('generates chunks deterministically based on coordinates and seed', () => {
      const loader = new BhumiProceduralChunkLoader(600, 108);
      const entranceChunk = loader.generateChunk(0, 0);
      expect(entranceChunk.roomType).toBe('ENTRANCE');
      expect(entranceChunk.worldBounds.width).toBe(600);
      expect(entranceChunk.walls.length).toBeGreaterThan(0);

      const bossChunk = loader.generateChunk(2, 2);
      expect(bossChunk.roomType).toBe('BOSS_ARENA');

      const cachedChunk = loader.generateChunk(0, 0);
      expect(cachedChunk).toBe(entranceChunk);
    });

    it('updates chunks based on player position and activates surrounding chunks', () => {
      const loader = new BhumiProceduralChunkLoader(600, 108);
      const active = loader.updatePlayerPosition(new Vector2D(650, 650), 1);
      expect(active.length).toBe(9); // 3x3 grid around (1, 1)
      expect(loader.getLoadedChunkCount()).toBe(9);

      const retrieved = loader.getChunkAt(650, 650);
      expect(retrieved.chunkX).toBe(1);
      expect(retrieved.chunkY).toBe(1);

      expect(() => loader.render(mockRenderer)).not.toThrow();
    });
  });

  describe('TASK-102: VoidArcher Enemy Archetype', () => {
    it('manages chase, aiming, shooting, and panic blink upon damage', () => {
      const archer = new VoidArcher('void_1', 200, 200);
      archer.targetPos = new Vector2D(400, 200);

      // Dist = 200, which is <= attackRange(320), so transitions to AIMING
      archer.update(0.1);
      expect(archer.state).toBe('AIMING');

      // Finish aiming
      archer.update(1.0);
      expect(archer.spawnedProjectiles.length).toBe(1);
      expect(archer.state).toBe('IDLE');

      // Test panic teleport when receiving heavy damage
      const initialPos = new Vector2D(archer.position.x, archer.position.y);
      archer.takeDamage(30);
      expect(archer.position.distanceTo(initialPos)).toBeGreaterThan(50);

      // Fatal damage
      const dead = archer.takeDamage(100);
      expect(dead).toBe(true);
      expect(archer.isActive).toBe(false);

      expect(() => archer.render(mockRenderer)).not.toThrow();
    });
  });

  describe('TASK-103: ElementalRuneAttunement', () => {
    it('creates runes and computes stat modifiers accurately', () => {
      const attunement = new ElementalRuneAttunement();
      expect(attunement.sockets[0].unlocked).toBe(true);
      expect(attunement.sockets[1].unlocked).toBe(false);

      // Attempt unlocking socket 1 without enough essence
      expect(attunement.unlockSocket(1, 100, 50)).toBe(false);
      expect(attunement.unlockSocket(1, 100, 150)).toBe(true);
      expect(attunement.sockets[1].unlocked).toBe(true);

      const agniRune = ElementalRuneAttunement.createRune('AGNI_EMBER', 2);
      expect(agniRune.bonusDamage).toBe(0.3);

      const vayuRune = ElementalRuneAttunement.createRune('VAYU_GALE', 1);
      const pranaRune = ElementalRuneAttunement.createRune('PRANA_BLOOM', 1);
      const suryaRune = ElementalRuneAttunement.createRune('SURYA_RADIANCE', 1);
      const tamasRune = ElementalRuneAttunement.createRune('TAMAS_VOID', 1);
      expect(pranaRune.lifesteal).toBe(0.03);
      expect(suryaRune.critChance).toBe(0.1);
      expect(tamasRune.bonusDamage).toBe(0.2);

      expect(attunement.attuneRune(0, agniRune)).toBe(true);
      expect(attunement.attuneRune(1, vayuRune)).toBe(true);
      // Socket 2 is locked
      expect(attunement.attuneRune(2, suryaRune)).toBe(false);
      expect(attunement.attuneRune(99, suryaRune)).toBe(false);

      const stats = attunement.getComputedStatModifiers();
      expect(stats.damageMultiplier).toBeGreaterThan(1.3);
      expect(stats.speedMultiplier).toBeGreaterThan(1.0);

      const removed = attunement.removeRune(0);
      expect(removed?.type).toBe('AGNI_EMBER');
      expect(attunement.removeRune(99)).toBeNull();
    });
  });

  describe('TASK-104: KalanemisShadowBoss', () => {
    it('progresses through 3 phases with decoys, scythe sweeps, and vortex', () => {
      const boss = new KalanemisShadowBoss('kalanemi_1', 300, 300);
      boss.targetPos = new Vector2D(400, 300);

      // Phase 1 updates and summons decoys
      boss.update(0.1);
      expect(boss.phase).toBe('PHASE_1_MIRAGE');
      expect(boss.decoys.length).toBe(2);

      // Force Phase 2
      boss.health = 350; // < 66%
      boss.update(0.1);
      expect(boss.phase).toBe('PHASE_2_REAPER');

      // Advance timer to trigger Phase 2 scythe projectiles
      boss.attackTimer = 2.0;
      boss.update(0.1);
      expect(boss.spawnedProjectiles.length).toBeGreaterThanOrEqual(4);

      // Force Phase 3 Singularity
      boss.health = 150; // < 33%
      boss.update(0.1);
      expect(boss.phase).toBe('PHASE_3_SINGULARITY');

      boss.attackTimer = 3.0;
      boss.update(0.1);
      expect(boss.vortexActive).toBe(true);

      // Test poise stagger
      boss.takeDamage(10, 200);
      expect(boss.isStaggered).toBe(true);

      boss.takeDamage(500, 0);
      expect(boss.health).toBe(0);
      expect(boss.isActive).toBe(false);

      expect(() => boss.render(mockRenderer)).not.toThrow();
    });
  });

  describe('TASK-105: VolumetricLightShafts', () => {
    it('animates beam angles and drifts dust motes', () => {
      const shafts = new VolumetricLightShafts(3, 10);
      expect(shafts.beams.length).toBe(3);
      expect(shafts.dustMotes.length).toBe(10);

      const initialAngle = shafts.beams[0].angle;
      shafts.update(0.5);
      expect(shafts.beams[0].angle).not.toBe(initialAngle);

      expect(() => shafts.render(mockRenderer)).not.toThrow();
    });
  });

  describe('TASK-201: FluidDynamics', () => {
    it('updates velocity fields, advects particles, and checks toxic contact', () => {
      const fluid = new FluidDynamics(new AABB(100, 200, 300, 100));
      expect(fluid.particles.length).toBe(50);

      fluid.update(0.1);
      expect(fluid.velocityField.length).toBeGreaterThan(0);

      const entityInside = new AABB(150, 220, 30, 30);
      const contact1 = fluid.checkEntityContact(entityInside, 0.5);
      expect(contact1.inVenom).toBe(true);
      expect(contact1.appliedDamage).toBeGreaterThan(0);

      const entityOutside = new AABB(0, 0, 10, 10);
      const contact2 = fluid.checkEntityContact(entityOutside, 0.5);
      expect(contact2.inVenom).toBe(false);

      expect(() => fluid.render(mockRenderer)).not.toThrow();
    });
  });

  describe('TASK-202: Naga Enemy Archetypes', () => {
    it('executes NagaVenomSpitter ranged spitting and puddles', () => {
      const spitter = new NagaVenomSpitter('spitter_1', 100, 100);
      spitter.targetPos = new Vector2D(200, 100);
      spitter.attackTimer = 2.5;
      spitter.update(0.1);

      expect(spitter.spawnedProjectiles.length).toBe(1);
      expect(spitter.venomPuddles.length).toBe(1);
      expect(() => spitter.render(mockRenderer)).not.toThrow();
      expect(spitter.takeDamage(100)).toBe(true);
    });

    it('executes SerpentineConstrictor lunging and constrict hold', () => {
      const constrictor = new SerpentineConstrictor('constrictor_1', 100, 100);
      constrictor.targetPos = new Vector2D(150, 100);

      constrictor.update(0.1);
      expect(constrictor.isLunging).toBe(true);

      constrictor.position.set(140, 100);
      constrictor.targetPos.set(145, 100);
      constrictor.update(0.1);

      expect(() => constrictor.render(mockRenderer)).not.toThrow();
      expect(constrictor.takeDamage(120)).toBe(true);
    });

    it('executes ShadowIllusionist illusions and shadow fissures', () => {
      const illusionist = new ShadowIllusionist('illusionist_1', 200, 200);
      illusionist.targetPos = new Vector2D(250, 200);
      illusionist.castTimer = 4.0;
      illusionist.update(0.1);

      expect(illusionist.isCloaked).toBe(true);
      expect(illusionist.decoyPositions.length).toBe(2);
      expect(illusionist.fissureHazards.length).toBe(1);

      expect(() => illusionist.render(mockRenderer)).not.toThrow();
      expect(illusionist.takeDamage(100)).toBe(true);
    });
  });

  describe('TASK-203: VedicHarpoonGrapple', () => {
    it('handles firing, anchoring, spring tension pull, and release', () => {
      const grapple = new VedicHarpoonGrapple(400);
      grapple.registerAnchor('anchor_1', 300, 100, 16);

      const playerPos = new Vector2D(100, 100);
      const fired = grapple.fire(playerPos, new Vector2D(300, 100));
      expect(fired).toBe(true);
      expect(grapple.state).toBe('FIRING');

      // Update until grapple reaches anchor
      grapple.update(0.3, playerPos);
      expect(grapple.state).toBe('ATTACHED');
      expect(grapple.attachedAnchor?.id).toBe('anchor_1');

      // Attached update produces pull force
      const result = grapple.update(0.1, playerPos);
      expect(result.isAttached).toBe(true);
      expect(result.pullForce.x).toBeGreaterThan(0);

      const exitVel = grapple.release();
      expect(grapple.state).toBe('IDLE');
      expect(exitVel.length()).toBeGreaterThan(0);

      expect(() => grapple.render(mockRenderer)).not.toThrow();
    });
  });

  describe('TASK-204: SheshaTormentedEchoBoss', () => {
    it('manages multi-segment serpent following and 3 combat phases', () => {
      const shesha = new SheshaTormentedEchoBoss('shesha_1', 400, 300);
      shesha.targetPos = new Vector2D(500, 300);
      expect(shesha.segments.length).toBe(6);

      // Phase 1 Burrowing
      shesha.attackTimer = 3.0;
      shesha.update(0.1);
      expect(shesha.isBurrowed).toBe(true);
      expect(shesha.takeDamage(50)).toBe(false); // invulnerable when burrowed

      // Emerge
      shesha.update(1.6);
      expect(shesha.isBurrowed).toBe(false);
      expect(shesha.toxicPools.length).toBe(1);

      // Phase 2 Tsunami
      shesha.health = 500;
      shesha.update(0.1);
      expect(shesha.phase).toBe('PHASE_2_TSUNAMI');
      shesha.attackTimer = 2.5;
      shesha.update(0.1);
      expect(shesha.spawnedProjectiles.length).toBe(5);

      // Phase 3 Maelstrom
      shesha.health = 200;
      shesha.update(0.1);
      expect(shesha.phase).toBe('PHASE_3_MAELSTROM');

      expect(() => shesha.render(mockRenderer)).not.toThrow();
    });
  });

  describe('TASK-205: BasaltSpecularLighting', () => {
    it('calculates diffuse and Blinn-Phong specular reflections', () => {
      const lighting = new BasaltSpecularLighting();
      expect(lighting.blocks.length).toBe(6);

      lighting.addLight(new Vector2D(150, 400), 250, '#00ffaa', 1.0);
      const lightResult = lighting.calculateBlockLighting(lighting.blocks[0]);
      expect(lightResult.diffuse).toBeGreaterThan(0);

      lighting.clearLights();
      expect(lighting.lights.length).toBe(0);

      expect(() => lighting.render(mockRenderer)).not.toThrow();
    });
  });

  describe('TASK-301: WindDraftSystem', () => {
    it('applies directional wind forces and updrafts', () => {
      const wind = new WindDraftSystem();
      expect(wind.zones.length).toBe(2);

      wind.update(0.5);

      // Point inside thermal updraft zone (300, 150, 160, 400)
      const forceUpdraft = wind.calculateWindForceAt(new Vector2D(350, 250));
      expect(forceUpdraft.y).toBeLessThan(0); // Upward negative Y force

      // Point inside horizontal gale corridor (500, 200, 450, 120)
      const forceGale = wind.calculateWindForceAt(new Vector2D(600, 240));
      expect(forceGale.x).toBeGreaterThan(0);

      expect(() => wind.render(mockRenderer)).not.toThrow();
    });
  });

  describe('TASK-302: Aerial Enemy Archetypes', () => {
    it('executes WindArcher squall arrows', () => {
      const archer = new WindArcher('wind_archer_1', 200, 200);
      archer.targetPos = new Vector2D(400, 200);
      archer.attackTimer = 2.5;
      archer.update(0.1);

      expect(archer.spawnedProjectiles.length).toBe(1);
      expect(() => archer.render(mockRenderer)).not.toThrow();
      expect(archer.takeDamage(80)).toBe(true);
    });

    it('executes StormSentry directional shield deflection', () => {
      const sentry = new StormSentry('sentry_1', 200, 200);
      sentry.targetPos = new Vector2D(300, 200);
      sentry.update(0.1);

      // Facing angle is 0 (towards right)
      expect(sentry.shieldAngle).toBeCloseTo(0, 1);

      // Blocked frontal damage
      const blocked = sentry.takeDamage(30, 0);
      expect(blocked).toBe(false);
      expect(sentry.health).toBe(110);

      // Unblocked rear damage
      const hit = sentry.takeDamage(30, Math.PI);
      expect(hit).toBe(false);
      expect(sentry.health).toBe(80);

      expect(() => sentry.render(mockRenderer)).not.toThrow();
    });

    it('executes GaleFalcon circling and diving attack cycle', () => {
      const falcon = new GaleFalcon('falcon_1', 200, 200);
      falcon.targetPos = new Vector2D(200, 300);

      falcon.update(0.1);
      expect(falcon.state).toBe('CIRCLING');

      falcon.timer = 3.0;
      falcon.update(0.1);
      expect(falcon.state).toBe('DIVING');

      expect(() => falcon.render(mockRenderer)).not.toThrow();
      expect(falcon.takeDamage(50)).toBe(true);
    });
  });

  describe('TASK-303: VayuGliderMechanics', () => {
    it('regulates falling speed, consumes stamina, and performs Vayu-Gati dash', () => {
      const glider = new VayuGliderMechanics();

      // Gliding test: falling with jump held
      const fallingVel = new Vector2D(50, 200);
      const resGliding = glider.update(0.1, fallingVel, new Vector2D(1, 0), true);
      expect(glider.isGliding).toBe(true);
      expect(resGliding.modifiedVelocity.y).toBeLessThanOrEqual(glider.gliderMaxFallSpeed);
      expect(glider.stamina).toBeLessThan(100);

      // Vayu-Gati dash
      const dashTriggered = glider.triggerVayuGatiDash(new Vector2D(1, 0));
      expect(dashTriggered).toBe(true);
      expect(glider.isDashing).toBe(true);

      const resDash = glider.update(0.1, new Vector2D(0, 0), new Vector2D(0, 0), false);
      expect(resDash.isInvulnerable).toBe(true);
      expect(resDash.modifiedVelocity.x).toBeGreaterThan(300);

      expect(() => glider.render(mockRenderer, new Vector2D(100, 100))).not.toThrow();
    });
  });

  describe('TASK-304: MatarishvanCycloneBoss', () => {
    it('manages 3 storm phases, mini tornados, and eye of the storm safe zone', () => {
      const boss = new MatarishvanCycloneBoss('cyclone_1', 300, 300);
      boss.targetPos = new Vector2D(400, 300);

      // Phase 1 mini tornados
      boss.attackTimer = 3.0;
      boss.update(0.1);
      expect(boss.tornados.length).toBe(2);

      // Phase 2 Gale blades
      boss.health = 500;
      boss.update(0.1);
      expect(boss.phase).toBe('PHASE_2_GALE_BLADES');
      boss.attackTimer = 2.5;
      boss.update(0.1);
      expect(boss.spawnedProjectiles.length).toBe(4);

      // Phase 3 Eye of the storm
      boss.health = 200;
      boss.update(0.1);
      expect(boss.phase).toBe('PHASE_3_EYE_OF_STORM');

      // Player in peripheral danger zone (dist > 90 and <= 380)
      boss.targetPos = new Vector2D(550, 300); // dist = 250
      boss.attackTimer = 2.0;
      boss.update(0.1);
      expect(boss.spawnedProjectiles.some((p) => p.id.startsWith('lightning'))).toBe(true);

      expect(() => boss.render(mockRenderer)).not.toThrow();
    });
  });

  describe('TASK-305: AtmosphericScatter', () => {
    it('moves projected cloud shadows and computes Rayleigh sky gradients', () => {
      const scatter = new AtmosphericScatter(8);
      expect(scatter.clouds.length).toBe(8);

      scatter.update(0.5);

      scatter.solarElevationAngle = Math.PI / 2;
      const midday = scatter.calculateRayleighSkyColor();
      expect(midday.topColor).toBe('#0a1d37');

      scatter.solarElevationAngle = Math.PI / 8;
      const twilight = scatter.calculateRayleighSkyColor();
      expect(twilight.bottomColor).toBe('#f77f00');

      scatter.solarElevationAngle = 0;
      const night = scatter.calculateRayleighSkyColor();
      expect(night.topColor).toBe('#03071e');

      expect(() => scatter.render(mockRenderer)).not.toThrow();
    });
  });
});
