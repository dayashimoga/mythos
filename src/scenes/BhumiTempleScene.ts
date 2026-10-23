import { IScene } from './SceneManager';
import { IGameEngine } from '../engine/Engine';
import { IRenderer } from '../render/CanvasRenderer';
import { InputManager } from '../input/InputManager';
import { Player } from '../entities/Player';
import { AstraShard } from '../entities/AstraShard';
import { Altar } from '../entities/Altar';
import { VanaraScout } from '../entities/VanaraScout';
import { StoneRakshasa } from '../entities/StoneRakshasa';
import { TamasSpire } from '../entities/TamasSpire';
import { ResonancePillar } from '../entities/ResonancePillar';
import { AmritaFont } from '../entities/AmritaFont';
import { AgniForge } from '../entities/AgniForge';
import { Projectile } from '../entities/Projectile';
import { Shockwave } from '../entities/Shockwave';
import { ParticleSystem } from '../render/ParticleSystem';
import { CollisionSystem } from '../physics/CollisionSystem';
import { AABB } from '../physics/AABB';
import { HUD } from '../ui/HUD';
import { Vector2D } from '../physics/Vector2D';
import { DamageNumberSystem } from '../render/DamageNumberSystem';
import { SaveGameManager } from '../state/SaveGameManager';
import { AssetManager } from '../assets/AssetManager';
import { ASSET_IDS } from '../assets/AssetManifest';

export class BhumiTempleScene implements IScene {
  public readonly id = 'BhumiTempleScene';
  private engine!: IGameEngine;

  // Primary Gameplay Actors & Objectives
  public player!: Player;
  public altar!: Altar;
  public spire!: TamasSpire;
  public forge!: AgniForge;
  public font!: AmritaFont;
  public pillars: ResonancePillar[] = [];
  public scouts: VanaraScout[] = [];
  public rakshasa!: StoneRakshasa;
  public shards: AstraShard[] = [];
  public playerProjectiles: Projectile[] = [];
  public enemyProjectiles: Projectile[] = [];
  public shockwaves: Shockwave[] = [];

  // Subsystems
  private particles: ParticleSystem = new ParticleSystem(800);
  private collisionSystem: CollisionSystem = new CollisionSystem(128);
  public damageNumbers: DamageNumberSystem = new DamageNumberSystem(60);
  private hud: HUD = new HUD();

  // Scene State
  public isPaused = false;
  public isGameOver = false;
  public isVictory = false;

  public gameTime = 0;
  private enemiesDefeated = 0;
  public objectiveText = 'Harmonize the 2 Brahmic Pillars to dissolve the Void Barrier';

  // Map Boundaries & Lava Chasm
  public templeBounds: AABB = new AABB(-750, -650, 1500, 1300);
  public lavaTrench: AABB = new AABB(-550, -40, 1100, 70);

  // Stage 4 Overhaul: Dual Bridges Across Lava Chasm
  public bridges: AABB[] = [
    new AABB(-310, -45, 130, 80), // West Stone Bridge
    new AABB(180, -45, 130, 80),  // East Stepping Stones Pier
  ];

  // Stage 4 Overhaul: Exploration Shrines & Landmarks
  public inscriptionTablet = {
    id: 'tablet_intro',
    x: 0,
    y: 310,
    bounds: new AABB(-40, 290, 80, 40),
    isRead: false,
    prompt: '[ F / E ] Read Ancient Inscription',
  };

  public shunyaShrine = {
    id: 'shrine_shunya',
    x: -540,
    y: 200,
    bounds: new AABB(-580, 160, 80, 80),
    isAttuned: false,
    prompt: '[ F / E ] Commune with Shunya Shrine',
  };

  public braziers = [
    { id: 'brazier_sw', x: -220, y: 260, bounds: new AABB(-236, 244, 32, 32) },
    { id: 'brazier_se', x: 220, y: 260, bounds: new AABB(204, 244, 32, 32) },
    { id: 'brazier_nw', x: -220, y: -260, bounds: new AABB(-236, -276, 32, 32) },
    { id: 'brazier_ne', x: 220, y: -260, bounds: new AABB(204, -276, 32, 32) },
  ];

  public staticColumns = [
    { x: -160, y: 260, bounds: new AABB(-176, 230, 32, 60) },
    { x: 160, y: 260, bounds: new AABB(144, 230, 32, 60) },
  ];

  // Environmental Navigation & Telemetry
  public currentZoneName = 'The South Portico & Dvarapala Gate';
  public discoveryToast = '';
  public toastTimer = 0;
  private speedBuffTimer = 0;

  public onEnter(engine: IGameEngine): void {
    this.engine = engine;
    this.resetLevel();
  }

  public resetLevel(): void {
    this.collisionSystem.clear();
    this.particles.clear();
    this.damageNumbers.clear();
    this.playerProjectiles = [];
    this.enemyProjectiles = [];
    this.shockwaves = [];

    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.gameTime = 0;
    this.enemiesDefeated = 0;
    this.speedBuffTimer = 0;
    this.discoveryToast = '';
    this.toastTimer = 0;
    this.objectiveText = 'Harmonize the 2 Brahmic Pillars to dissolve the Void Barrier';

    // Spawn Hero Veer at Courtyard entrance
    this.player = new Player('player_veer_bhumi', 0, 380);
    this.engine.getRenderer().getCamera().setTarget(this.player.position);
    this.engine.getRenderer().getCamera().position.set(0, 380);

    // Spawn Interactive Temple Props
    this.forge = new AgniForge('forge_agni', -380, -180);
    this.font = new AmritaFont('font_amrita', 380, -180);

    // 2 Brahmic Resonance Pillars (West and East)
    this.pillars = [
      new ResonancePillar('pillar_alpha', -440, 120, 'ॐ'),
      new ResonancePillar('pillar_beta', 440, 120, 'श्रीं'),
    ];

    // North Sanctum Objectives
    this.spire = new TamasSpire('tamas_spire', 0, -420);
    this.altar = new Altar('altar_surya_bhumi', 0, -560);

    // 3 Hidden Astra Shards
    this.shards = [
      new AstraShard('shard_bhumi_1', -480, -220),
      new AstraShard('shard_bhumi_2', 480, -220),
      new AstraShard('shard_bhumi_3', 0, -220),
    ];

    // Enemies
    this.scouts = [
      new VanaraScout('scout_1', -280, 180),
      new VanaraScout('scout_2', 280, 180),
      new VanaraScout('scout_3', 0, -140),
    ];
    this.rakshasa = new StoneRakshasa('rakshasa_enforcer', 0, -320);

    // Register Dynamic Colliders
    this.registerColliders();
  }

  private registerColliders(): void {
    // 1. Player
    this.collisionSystem.register({
      id: this.player.id,
      bounds: this.player.bounds,
      type: 'solid',
      tag: 'player',
      isStatic: false,
    });

    // 2. Shards
    this.shards.forEach((s) => {
      this.collisionSystem.register({
        id: s.id,
        bounds: s.bounds,
        type: 'trigger',
        tag: 'shard',
        isStatic: true,
        onCollide: (other) => {
          if (other.tag === 'player' && !s.isCollected) {
            this.collectShard(s);
          }
        },
      });
    });

    // 3. Altar
    this.collisionSystem.register({
      id: this.altar.id,
      bounds: this.altar.bounds,
      type: 'trigger',
      tag: 'altar',
      isStatic: true,
      onCollide: (other) => {
        if (other.tag === 'player') {
          this.handleAltarConsecration();
        }
      },
    });

    // 4. Perimeter Boundary Obstacles (Solid)
    const minX = this.templeBounds.minX;
    const maxX = this.templeBounds.maxX;
    const minY = this.templeBounds.minY;
    const maxY = this.templeBounds.maxY;

    // North Wall
    this.collisionSystem.register({
      id: 'wall_north',
      bounds: new AABB(minX, minY, this.templeBounds.width, 32),
      type: 'solid',
      tag: 'environment',
      isStatic: true,
    });
    // South Wall
    this.collisionSystem.register({
      id: 'wall_south',
      bounds: new AABB(minX, maxY - 32, this.templeBounds.width, 32),
      type: 'solid',
      tag: 'environment',
      isStatic: true,
    });
    // West Wall
    this.collisionSystem.register({
      id: 'wall_west',
      bounds: new AABB(minX, minY, 32, this.templeBounds.height),
      type: 'solid',
      tag: 'environment',
      isStatic: true,
    });
    // East Wall
    this.collisionSystem.register({
      id: 'wall_east',
      bounds: new AABB(maxX - 32, minY, 32, this.templeBounds.height),
      type: 'solid',
      tag: 'environment',
      isStatic: true,
    });

    // 5. Columns & Braziers (Solid)
    this.braziers.forEach((b) => {
      this.collisionSystem.register({
        id: b.id,
        bounds: b.bounds,
        type: 'solid',
        tag: 'prop',
        isStatic: true,
      });
    });

    this.staticColumns.forEach((c, idx) => {
      this.collisionSystem.register({
        id: `column_${idx}`,
        bounds: c.bounds,
        type: 'solid',
        tag: 'prop',
        isStatic: true,
      });
    });
  }

  private collectShard(shard: AstraShard): void {
    shard.isCollected = true;
    shard.destroy();
    this.collisionSystem.unregister(shard.id);
    this.player.shardsCollected++;
    this.player.score += 500;

    this.engine.getAudio().playShardPickup();
    this.damageNumbers.spawn(shard.position.x, shard.position.y, '+1 ASTRA SHARD', '#FFD166');
    this.particles.emitBurst(shard.position.x, shard.position.y, 25, '#FFD166', 60, 200, 3, 0.8);
    this.engine.getRenderer().getCamera().triggerShake(3.0, 0.15);

    this.showToast('✨ Gathered Sacred Astra Shard!');
    this.checkObjectiveProgress();
  }

  public handleAltarConsecration(): void {
    if (this.player.shardsCollected >= 3 && !this.spire.isActive && this.altar.state !== 'consecrated') {
      while (this.altar.shardsDeposited < 3) {
        this.altar.depositShard();
      }
      this.isVictory = true;
      this.objectiveText = 'Temple Cleansed! Passage to Patala Unlocked';

      this.engine.getAudio().playAltarResonate();
      this.engine.getAudio().playVictoryFanfare();
      this.engine.getRenderer().getCamera().triggerShake(10.0, 0.8);

      this.particles.emitBurst(this.altar.position.x, this.altar.position.y, 100, '#FFB703', 80, 400, 5, 1.5);
      this.particles.emitBurst(this.altar.position.x, this.altar.position.y, 80, '#00E5FF', 60, 320, 4, 1.2);

      // Save progression
      const current = SaveGameManager.load();
      SaveGameManager.save({
        unlockedRealms: Array.from(new Set([...current.unlockedRealms, 'RealmOfBhumi', 'RealmOfPatala'])),
        currentRealm: 'RealmOfBhumi',
        highScore: Math.max(current.highScore, this.player.score + 3500),
      });
    }
  }

  private checkObjectiveProgress(): void {
    const pillarsAttuned = this.pillars.filter((p) => p.state === 'attuned').length;

    if (pillarsAttuned < 2) {
      this.objectiveText = `Harmonize Brahmic Pillars (${pillarsAttuned}/2) to drop Void Shield`;
    } else if (this.spire.isActive) {
      this.spire.setShielded(false);
      this.objectiveText = 'Void Shield Down! Cleanse the Tamas Spire in North Sanctum';
    } else if (this.player.shardsCollected < 3) {
      this.objectiveText = `Gather Temple Astra Shards (${this.player.shardsCollected}/3)`;
    } else {
      this.objectiveText = 'Consecrate the High Sun Altar of Surya-Kund [ E ]';
    }
  }

  public showToast(msg: string): void {
    this.discoveryToast = msg;
    this.toastTimer = 2.8;
  }

  public onExit(): void {
    this.collisionSystem.clear();
    this.particles.clear();
    this.damageNumbers.clear();
    this.playerProjectiles = [];
    this.enemyProjectiles = [];
    this.shockwaves = [];
    const camera = this.engine.getRenderer().getCamera();
    camera.reset(0, 0, 1.0);
  }

  public update(dt: number): void {
    if (this.isPaused) return;

    if (!this.isGameOver && !this.isVictory) {
      this.gameTime += dt;
    }

    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
    }

    if (this.speedBuffTimer > 0) {
      this.speedBuffTimer -= dt;
      if (this.speedBuffTimer <= 0) {
        this.player.speed = 220; // reset
      }
    }

    // Dynamic Zone Tracking
    const py = this.player.position.y;
    if (py > 240) {
      this.currentZoneName = 'The South Portico & Dvarapala Gate';
    } else if (py >= 30) {
      this.currentZoneName = 'The Outer Courtyard of Surya-Kund';
    } else if (py >= -50) {
      this.currentZoneName = 'The Great Molten Chasm of Dandaka';
    } else {
      this.currentZoneName = 'The High Sanctorum of the Sun Altar';
    }

    // Update Player
    this.player.update(dt);

    // Check Player Death
    if (this.player.health <= 0 && !this.isGameOver) {
      this.isGameOver = true;
      this.engine.getAudio().playDefeat();
      this.engine.getRenderer().getCamera().triggerShake(8.0, 0.5);
      this.particles.emitBurst(this.player.position.x, this.player.position.y, 50, '#EF476F', 40, 200, 3, 1.0);
      return;
    }

    // Check Lava Trench Hazard (Safe on Bridges or during Dash)
    const onBridge = this.bridges.some((b) => b.containsPoint(this.player.position.x, this.player.position.y));
    if (!onBridge && !this.player.isDashing && this.lavaTrench.containsPoint(this.player.position.x, this.player.position.y)) {
      if (this.player.takeDamage(12 * dt)) {
        this.engine.getRenderer().getCamera().triggerShake(1.5, 0.05);
        this.damageNumbers.spawn(this.player.position.x, this.player.position.y, '-LAVA', '#FF4D4D', 0.8);
        this.particles.emitBurst(this.player.position.x, this.player.position.y, 4, '#FB8500', 20, 60, 2, 0.2);
      }
    }

    // Update Props
    this.forge.update(dt);
    this.font.update(dt);
    this.pillars.forEach((p) => p.update(dt));
    this.spire.update(dt);
    this.altar.update(dt);
    this.checkObjectiveProgress();

    // Update Shards
    for (const shard of this.shards) {
      if (shard.isActive && !shard.isCollected) {
        shard.attractTowards(this.player.position, dt);
        shard.update(dt);
      }
    }

    // Update Enemy AI: Vanara Scouts
    for (const scout of this.scouts) {
      if (scout.isActive) {
        const spawned = scout.updateAI(this.player.position, dt);
        if (spawned) {
          this.enemyProjectiles.push(...spawned);
          this.engine.getAudio().playShoot();
        }
      }
    }

    // Update Enemy AI: Stone Rakshasa
    if (this.rakshasa.isActive) {
      const shock = this.rakshasa.updateAI(this.player.position, dt);
      if (shock) {
        this.shockwaves.push(shock);
        this.engine.getAudio().playShockwave();
        this.engine.getRenderer().getCamera().triggerShake(7.0, 0.35);
        this.particles.emitBurst(shock.position.x, shock.position.y, 35, '#EF476F', 80, 260, 3.5, 0.6);
      }
    }

    // Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.update(dt);

      if (sw.checkPlayerHit(this.player.position, this.player.isDashing)) {
        const hit = this.player.takeDamage(sw.damage, Vector2D.sub(this.player.position, sw.position).normalize());
        if (hit) {
          this.engine.getAudio().playEnemyHit();
          this.engine.getRenderer().getCamera().triggerShake(6.0, 0.25);
          this.damageNumbers.spawn(this.player.position.x, this.player.position.y, `-${sw.damage}`, '#EF476F', 1.2);
        }
      }

      if (!sw.isActive) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Update Player Projectiles & Collision with Enemies / Pillars
    for (let i = this.playerProjectiles.length - 1; i >= 0; i--) {
      const p = this.playerProjectiles[i];
      p.update(dt);

      if (!p.isActive) {
        this.playerProjectiles.splice(i, 1);
        continue;
      }

      // Check collision with Pillars
      for (const pillar of this.pillars) {
        if (pillar.state === 'dormant' && p.bounds.overlaps(pillar.bounds)) {
          p.destroy();
          pillar.attune();
          this.engine.getAudio().playPillarHarmonic();
          this.particles.emitBurst(pillar.position.x, pillar.position.y, 40, '#FFD166', 60, 220, 3, 0.8);
          this.damageNumbers.spawn(pillar.position.x, pillar.position.y, 'ATTUNED!', '#FFD166', 1.1);
          this.checkObjectiveProgress();
          break;
        }
      }
      if (!p.isActive) continue;

      // Check collision with Tamas Spire
      if (this.spire.isActive && p.bounds.overlaps(this.spire.bounds)) {
        p.destroy();
        if (this.spire.isShielded) {
          this.engine.getAudio().playParryFoley();
          this.damageNumbers.spawn(this.spire.position.x, this.spire.position.y, 'SHIELDED', '#8338EC', 0.9);
          this.particles.emitBurst(p.position.x, p.position.y, 10, '#8338EC', 30, 100, 2, 0.2);
        } else {
          const destroyed = this.spire.takeDamage(p.damage);
          this.engine.getAudio().playEnemyHit();
          this.damageNumbers.spawn(this.spire.position.x, this.spire.position.y, `-${p.damage}`, '#FFB703');
          this.particles.emitBurst(p.position.x, p.position.y, 15, '#EF476F', 40, 150, 2, 0.3);

          if (destroyed) {
            this.player.score += 2500;
            this.engine.getRenderer().getCamera().triggerShake(8.0, 0.5);
            this.particles.emitBurst(this.spire.position.x, this.spire.position.y, 80, '#8338EC', 80, 300, 4, 1.2);
            this.checkObjectiveProgress();
          }
        }
        continue;
      }

      // Check collision with Vanara Scouts
      for (const scout of this.scouts) {
        if (scout.isActive && p.bounds.overlaps(scout.bounds)) {
          p.destroy();
          const killed = scout.takeDamage(p.damage);
          this.engine.getAudio().playEnemyHit();
          this.damageNumbers.spawn(scout.position.x, scout.position.y, `-${p.damage}`, '#FFB703');
          this.particles.emitBurst(p.position.x, p.position.y, 14, '#4CC9F0', 40, 140, 2, 0.3);

          if (killed) {
            this.enemiesDefeated++;
            this.player.score += 450;
            this.particles.emitBurst(scout.position.x, scout.position.y, 35, '#8338EC', 60, 200, 3, 0.8);
          }
          break;
        }
      }

      // Check collision with Stone Rakshasa
      if (this.rakshasa.isActive && p.bounds.overlaps(this.rakshasa.bounds)) {
        p.destroy();
        const killed = this.rakshasa.takeDamage(p.damage);
        this.engine.getAudio().playEnemyHit();
        this.damageNumbers.spawn(this.rakshasa.position.x, this.rakshasa.position.y, `-${p.damage}`, '#FFB703');
        this.particles.emitBurst(p.position.x, p.position.y, 18, '#EF476F', 40, 160, 2.5, 0.4);

        if (killed) {
          this.enemiesDefeated++;
          this.player.score += 1500;
          this.engine.getRenderer().getCamera().triggerShake(7.0, 0.4);
          this.particles.emitBurst(this.rakshasa.position.x, this.rakshasa.position.y, 60, '#EF476F', 80, 280, 4, 1.0);
        }
      }
    }

    // Update Enemy Projectiles
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const ep = this.enemyProjectiles[i];
      ep.update(dt);

      if (!ep.isActive) {
        this.enemyProjectiles.splice(i, 1);
        continue;
      }

      // Check collision with Player
      if (ep.bounds.overlaps(this.player.bounds)) {
        ep.destroy();
        const hit = this.player.takeDamage(ep.damage, ep.velocity.clone().normalize());
        if (hit) {
          this.engine.getAudio().playEnemyHit();
          this.engine.getRenderer().getCamera().triggerShake(3.5, 0.15);
          this.damageNumbers.spawn(this.player.position.x, this.player.position.y, `-${ep.damage}`, '#EF476F');
          this.particles.emitBurst(ep.position.x, ep.position.y, 16, '#8338EC', 30, 120, 2, 0.3);
        }
      }
    }

    // Update Collision System & Camera
    const checks = this.collisionSystem.update();
    this.particles.update(dt);
    this.damageNumbers.update(dt);
    this.engine.getRenderer().getCamera().update(dt);

    // Telemetry Diagnostics
    this.engine.getDiagnostics().setCounts(
      1 + 1 + 1 + this.shards.filter((s) => !s.isCollected).length + this.scouts.filter((s) => s.isActive).length + (this.rakshasa.isActive ? 1 : 0),
      this.particles.getActiveCount(),
      checks
    );
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    renderer.clear('#080C14');

    renderer.beginWorldPass();

    // 0. Deep Subterranean Volcanic Parallax Backdrop
    this.renderSubterraneanBackdrop(ctx, renderer.getCamera());

    // 1. Temple Floor & Carved Basalt Stone Paving
    this.renderTempleFloor(ctx);

    // 2. Lava Trench with Boiling Molten Crust & Stone Bridges
    this.renderLavaTrench(ctx);

    // 3. Contact Shadows beneath static architecture and props
    this.renderContactShadows(ctx);

    // 4. Sacred Architecture & Shrines
    this.renderArchitectureAndShrines(ctx, renderer);

    // 5. Sacred Interactive Props
    this.forge.render(renderer);
    this.font.render(renderer);
    this.pillars.forEach((p) => p.render(renderer));

    // 6. North Sanctum Objectives
    this.altar.render(renderer);
    if (this.spire.isActive) this.spire.render(renderer);

    // 7. Astra Shards
    for (const shard of this.shards) {
      if (shard.isActive && !shard.isCollected) {
        shard.render(renderer);
      }
    }

    // 8. Enemies
    for (const scout of this.scouts) {
      if (scout.isActive) scout.render(renderer);
    }
    if (this.rakshasa.isActive) this.rakshasa.render(renderer);

    // 9. Shockwaves & Projectiles
    this.shockwaves.forEach((sw) => sw.render(renderer));
    this.playerProjectiles.forEach((p) => p.render(renderer));
    this.enemyProjectiles.forEach((ep) => ep.render(renderer));

    // 10. Player Veer (with Rig & Dynamic Trails)
    this.player.render(renderer);

    // 11. Volcanic Heat Distortion & Crepuscular Rays
    this.renderVolcanicAtmosphere(ctx);

    // 12. Floating Particles & Combat Numbers
    this.particles.render(ctx, new Vector2D(0, 0));
    this.damageNumbers.render(renderer);

    // 13. Collider Debug (F2)
    if (this.engine.getDiagnostics().getShowColliders()) {
      renderer.drawAABB(this.player.bounds, '#00E5FF');
      renderer.drawAABB(this.lavaTrench, '#FF0000');
      this.bridges.forEach((b) => renderer.drawAABB(b, '#00FF66'));
      renderer.drawAABB(this.inscriptionTablet.bounds, '#FFD166');
      renderer.drawAABB(this.shunyaShrine.bounds, '#00E5FF');
      this.pillars.forEach((p) => renderer.drawAABB(p.bounds, '#8338EC'));
      this.braziers.forEach((b) => renderer.drawAABB(b.bounds, '#FB8500'));
      this.scouts.forEach((s) => {
        if (s.isActive) renderer.drawAABB(s.bounds, '#EF476F');
      });
      if (this.rakshasa.isActive) renderer.drawAABB(this.rakshasa.bounds, '#EF476F');
    }

    renderer.endWorldPass();

    // Foreground HUD & Objective
    this.hud.render(renderer, this.player, this.objectiveText);

    // Stance Indicator & Mini-Map Badge
    this.renderStanceBadge(renderer);

    // Exploration Toast Banner
    if (this.toastTimer > 0) {
      this.renderToastBanner(renderer);
    }

    // Defeat Overlay
    if (this.isGameOver) {
      this.renderGameOverModal(renderer);
    }

    // Victory Screen
    if (this.isVictory) {
      this.renderVictoryModal(renderer);
    }

    // Pause Modal
    if (this.isPaused) {
      this.renderPauseModal(renderer);
    }
  }

  // --- RENDERING SUBSYSTEMS ---

  private renderSubterraneanBackdrop(ctx: CanvasRenderingContext2D, camera: any): void {
    ctx.save();
    const texBackdrop = AssetManager.getInstance().getTexture(ASSET_IDS.BHUMI_BACKDROP);
    const camPos = camera.position || { x: 0, y: 0 };
    const pX = -camPos.x * 0.12;
    const pY = -camPos.y * 0.08 - 200;

    if (texBackdrop && typeof ctx.drawImage === 'function') {
      ctx.globalAlpha = 0.85;
      ctx.drawImage(texBackdrop, -896 + pX, -512 + pY, 1792, 1024);
      ctx.globalAlpha = 1.0;
    } else {
      // Procedural Subterranean Horizon Fallback
      const grad = ctx.createLinearGradient(0, -700, 0, 700);
      grad.addColorStop(0, '#070A10');
      grad.addColorStop(0.5, '#1A0808');
      grad.addColorStop(1, '#3D0A0A');
      ctx.fillStyle = grad;
      ctx.fillRect(-1000, -800, 2000, 1600);
    }

    // Atmospheric volcanic ember glow at base
    const lavaGlow = ctx.createRadialGradient(0, 0, 100, 0, 0, 600);
    lavaGlow.addColorStop(0, 'rgba(251, 133, 0, 0.12)');
    lavaGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = lavaGlow;
    ctx.fillRect(-800, -700, 1600, 1400);

    ctx.restore();
  }

  private renderTempleFloor(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const minX = this.templeBounds.minX;
    const minY = this.templeBounds.minY;
    const w = this.templeBounds.width;
    const h = this.templeBounds.height;

    const texFloor = AssetManager.getInstance().getTexture(ASSET_IDS.BHUMI_FLOOR) ||
                     AssetManager.getInstance().getTexture(ASSET_IDS.SANCTUM_FLOOR);

    if (texFloor && typeof ctx.drawImage === 'function') {
      // Tile 512x512 floor paving across temple area
      const tSize = 512;
      for (let x = minX; x < minX + w; x += tSize) {
        for (let y = minY; y < minY + h; y += tSize) {
          ctx.drawImage(texFloor, x, y, tSize, tSize);
        }
      }
    } else {
      // Procedural Chiseled Granite & Basalt Floor Fallback
      ctx.fillStyle = '#0F1420';
      ctx.fillRect(minX, minY, w, h);

      ctx.strokeStyle = 'rgba(255, 183, 3, 0.08)';
      ctx.lineWidth = 1;
      const tileSize = 64;
      for (let x = minX; x <= minX + w; x += tileSize) {
        ctx.beginPath();
        ctx.moveTo(x, minY);
        ctx.lineTo(x, minY + h);
        ctx.stroke();
      }
      for (let y = minY; y <= minY + h; y += tileSize) {
        ctx.beginPath();
        ctx.moveTo(minX, y);
        ctx.lineTo(minX + w, y);
        ctx.stroke();
      }
    }

    // Hoysala Golden Surya Mandala at Courtyard Center (0, 180)
    ctx.save();
    ctx.translate(0, 180);
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 110, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(251, 133, 0, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 130, 0, Math.PI * 2);
    ctx.stroke();

    // 8-Ray Star
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 + this.gameTime * 0.05;
      const rx = Math.cos(angle) * 110;
      const ry = Math.sin(angle) * 110;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(rx, ry);
      ctx.stroke();
    }
    ctx.restore();

    // Outer Sanctuary Perimeter Balustrade Wall
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 4;
    ctx.strokeRect(minX, minY, w, h);

    // Inner Gold Accent Trim Line
    ctx.strokeStyle = 'rgba(251, 133, 0, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(minX + 8, minY + 8, w - 16, h - 16);

    ctx.restore();
  }

  private renderLavaTrench(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const lx = this.lavaTrench.x;
    const ly = this.lavaTrench.y;
    const lw = this.lavaTrench.width;
    const lh = this.lavaTrench.height;

    const texLava = AssetManager.getInstance().getTexture(ASSET_IDS.BHUMI_LAVA);

    if (texLava && typeof ctx.drawImage === 'function') {
      ctx.drawImage(texLava, lx, ly, lw, lh);
    } else {
      // Lava Glow Gradient Fallback
      const lavaGrad = ctx.createLinearGradient(0, ly, 0, ly + lh);
      lavaGrad.addColorStop(0, '#7F1D1D');
      lavaGrad.addColorStop(0.5, '#EF4444');
      lavaGrad.addColorStop(1, '#B91C1C');
      ctx.fillStyle = lavaGrad;
      ctx.fillRect(lx, ly, lw, lh);
    }

    // Molten Fissure Glow Border
    ctx.strokeStyle = '#FB8500';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(lx, ly, lw, lh);

    // Animated Boiling Lava Bubble Rings
    for (let i = 0; i < 5; i++) {
      const bx = lx + 120 + i * 210 + Math.sin(this.gameTime * 2 + i) * 30;
      const by = ly + 35 + Math.cos(this.gameTime * 3 + i) * 18;
      const br = 6 + Math.abs(Math.sin(this.gameTime * 4 + i)) * 8;
      ctx.fillStyle = '#FFF3B0';
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }

    // Safe Stone Bridges Spanning the Chasm
    const texBridge = AssetManager.getInstance().getTexture(ASSET_IDS.BHUMI_BRIDGE);
    this.bridges.forEach((b, idx) => {
      if (texBridge && typeof ctx.drawImage === 'function') {
        ctx.drawImage(texBridge, b.x, b.y - 10, b.width, b.height + 20);
      } else {
        // Procedural Stone Bridge Fallback
        ctx.fillStyle = '#334155';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        // Interlocking paving joints
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 1;
        for (let bx = b.x; bx <= b.maxX; bx += 24) {
          ctx.beginPath();
          ctx.moveTo(bx, b.y);
          ctx.lineTo(bx, b.maxY);
          ctx.stroke();
        }
        // Guard rails
        ctx.fillStyle = '#475569';
        ctx.fillRect(b.x, b.y - 6, b.width, 6);
        ctx.fillRect(b.x, b.maxY, b.width, 6);
      }

      // Bridge Rune Medallion
      ctx.fillStyle = '#FFB703';
      ctx.font = 'bold 10px "Cinzel", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(idx === 0 ? 'STONE BRIDGE' : 'STEPPING PIER', b.centerX, b.centerY + 4);
    });

    ctx.restore();
  }

  private renderContactShadows(ctx: CanvasRenderingContext2D): void {
    const drawShadow = (x: number, y: number, rx: number, ry: number) => {
      ctx.save();
      ctx.fillStyle = 'rgba(6, 8, 14, 0.45)';
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // Props & Shrines shadows
    drawShadow(this.forge.position.x, this.forge.position.y + 24, 48, 18);
    drawShadow(this.font.position.x, this.font.position.y + 24, 48, 18);
    this.pillars.forEach((p) => drawShadow(p.position.x, p.position.y + 36, 36, 14));
    drawShadow(this.altar.position.x, this.altar.position.y + 44, 90, 28);
    if (this.spire.isActive) drawShadow(this.spire.position.x, this.spire.position.y + 40, 50, 16);
    this.braziers.forEach((b) => drawShadow(b.x, b.y + 16, 20, 8));
    this.staticColumns.forEach((c) => drawShadow(c.x, c.y + 28, 22, 10));
    drawShadow(this.inscriptionTablet.x, this.inscriptionTablet.y + 18, 36, 12);
    drawShadow(this.shunyaShrine.x, this.shunyaShrine.y + 36, 54, 18);
  }

  private renderArchitectureAndShrines(ctx: CanvasRenderingContext2D, renderer: IRenderer): void {
    ctx.save();

    // 1. South Portico Sanchi Torana Gateway (0, 370)
    const texTorana = AssetManager.getInstance().getTexture(ASSET_IDS.SANCTUM_TORANA);
    if (texTorana && typeof ctx.drawImage === 'function') {
      ctx.drawImage(texTorana, -150, 270, 300, 140);
    } else {
      // Procedural Torana Pillars
      ctx.fillStyle = '#64748B';
      ctx.fillRect(-120, 320, 24, 90);
      ctx.fillRect(96, 320, 24, 90);
      // Curved Torana Beams
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(-140, 310, 280, 14);
      ctx.fillRect(-130, 290, 260, 12);
    }

    // 2. North Monolithic Temple Cliff Walls
    const texCliff = AssetManager.getInstance().getTexture(ASSET_IDS.BHUMI_CLIFF);
    if (texCliff && typeof ctx.drawImage === 'function') {
      ctx.drawImage(texCliff, -750, -650, 520, 120);
      ctx.drawImage(texCliff, 230, -650, 520, 120);
    }

    // 3. Sacred Shrine Pavilions at Forge and Font
    const texShrine = AssetManager.getInstance().getTexture(ASSET_IDS.BHUMI_SHRINE);
    if (texShrine && typeof ctx.drawImage === 'function') {
      ctx.drawImage(texShrine, -460, -280, 160, 160);
      ctx.drawImage(texShrine, 300, -280, 160, 160);
    }

    // 4. Carved Hoysala Stone Columns
    const texPillar = AssetManager.getInstance().getTexture(ASSET_IDS.SANCTUM_PILLAR);
    this.staticColumns.forEach((c) => {
      if (texPillar && typeof ctx.drawImage === 'function') {
        ctx.drawImage(texPillar, c.x - 24, c.y - 48, 48, 80);
      } else {
        ctx.fillStyle = '#475569';
        ctx.fillRect(c.x - 14, c.y - 40, 28, 70);
        ctx.fillStyle = '#FFB703';
        ctx.fillRect(c.x - 18, c.y - 44, 36, 6);
      }
    });

    // 5. 4 Sacred Fire Braziers with dynamic flame
    this.braziers.forEach((b) => {
      // Pedestal
      ctx.fillStyle = '#334155';
      ctx.fillRect(b.x - 14, b.y - 8, 28, 24);
      ctx.fillStyle = '#FFB703';
      ctx.fillRect(b.x - 18, b.y - 12, 36, 4);

      // Flickering Flame
      const flameH = 16 + Math.sin(this.gameTime * 8 + b.x) * 4;
      const flameGrad = ctx.createRadialGradient(b.x, b.y - 16, 2, b.x, b.y - 16, flameH);
      flameGrad.addColorStop(0, '#FFF3B0');
      flameGrad.addColorStop(0.4, '#FB8500');
      flameGrad.addColorStop(1, 'rgba(239, 71, 111, 0)');
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.arc(b.x, b.y - 16, flameH, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Ancient Inscription Tablet at (0, 310)
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 1.5;
    ctx.fillRect(this.inscriptionTablet.bounds.x, this.inscriptionTablet.bounds.y, this.inscriptionTablet.bounds.width, this.inscriptionTablet.bounds.height);
    ctx.strokeRect(this.inscriptionTablet.bounds.x, this.inscriptionTablet.bounds.y, this.inscriptionTablet.bounds.width, this.inscriptionTablet.bounds.height);
    renderer.drawText('📜 VEDIC TABLET', this.inscriptionTablet.x, this.inscriptionTablet.y + 5, 'bold 9px "Cinzel", sans-serif', '#FFD166', 'center');

    // 7. Shunya Meditation Shrine at (-540, 200)
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.shunyaShrine.x, this.shunyaShrine.y, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    renderer.drawText('🕉️ SHUNYA', this.shunyaShrine.x, this.shunyaShrine.y + 4, 'bold 10px "Cinzel", sans-serif', '#00E5FF', 'center');

    // Interactive Proximity Prompts
    const distTablet = this.player.position.distanceTo(new Vector2D(this.inscriptionTablet.x, this.inscriptionTablet.y));
    if (distTablet < 75) {
      this.drawInteractionPrompt(ctx, this.inscriptionTablet.x, this.inscriptionTablet.y - 35, this.inscriptionTablet.prompt);
    }

    const distShrine = this.player.position.distanceTo(new Vector2D(this.shunyaShrine.x, this.shunyaShrine.y));
    if (distShrine < 85) {
      this.drawInteractionPrompt(ctx, this.shunyaShrine.x, this.shunyaShrine.y - 48, this.shunyaShrine.prompt);
    }

    ctx.restore();
  }

  private drawInteractionPrompt(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - 110, y - 14, 220, 24, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFD166';
    ctx.font = 'bold 11px "Cinzel", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y + 3);
    ctx.restore();
  }

  private renderVolcanicAtmosphere(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    // Subtle crepuscular rays from top-left
    const rayGrad = ctx.createLinearGradient(-400, -600, 300, 400);
    rayGrad.addColorStop(0, 'rgba(255, 183, 3, 0.06)');
    rayGrad.addColorStop(0.5, 'rgba(251, 133, 0, 0.03)');
    rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = rayGrad;
    ctx.fillRect(-750, -650, 1500, 1300);

    // Warm radial light blooms around braziers
    this.braziers.forEach((b) => {
      const bloom = ctx.createRadialGradient(b.x, b.y - 16, 10, b.x, b.y - 16, 120);
      bloom.addColorStop(0, 'rgba(251, 133, 0, 0.15)');
      bloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bloom;
      ctx.fillRect(b.x - 120, b.y - 136, 240, 240);
    });

    ctx.restore();
  }

  private renderToastBanner(renderer: IRenderer): void {
    const vp = renderer.getViewport();
    const ctx = renderer.getContext();
    const cx = vp.width / 2;
    const cy = 76;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx - 240, cy - 16, 480, 32, 6);
    ctx.fill();
    ctx.stroke();

    renderer.drawText(this.discoveryToast, cx, cy + 5, 'bold 12px "Cinzel", sans-serif', '#FFD166', 'center');
    ctx.restore();
  }

  private renderStanceBadge(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    const badgeX = 24;
    const badgeY = 110;

    ctx.save();
    ctx.fillStyle = 'rgba(18, 24, 36, 0.8)';
    ctx.strokeStyle = this.player.stance === 'SolarResonantFlare' ? '#FFB703' : '#A0AAB8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, 210, 52, 6);
    ctx.fill();
    ctx.stroke();

    const stanceLabel = this.player.stance === 'SolarResonantFlare' ? 'STANCE: SOLAR FLARE' : 'STANCE: STANDARD';
    renderer.drawText(
      stanceLabel,
      badgeX + 12,
      badgeY + 20,
      'bold 11px "Cinzel", sans-serif',
      this.player.stance === 'SolarResonantFlare' ? '#FFD166' : '#A0AAB8'
    );

    // Zone Badge
    renderer.drawText(
      `📍 ${this.currentZoneName}`,
      badgeX + 12,
      badgeY + 40,
      '10px sans-serif',
      '#94A3B8'
    );
    ctx.restore();
  }

  private renderPauseModal(renderer: IRenderer): void {
    const vp = renderer.getViewport();
    const ctx = renderer.getContext();
    const cx = vp.width / 2;
    const cy = vp.height / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(8, 12, 20, 0.85)';
    ctx.fillRect(0, 0, vp.width, vp.height);

    ctx.fillStyle = '#121824';
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx - 180, cy - 130, 360, 260, 10);
    ctx.fill();
    ctx.stroke();

    renderer.drawText('BHUMI TEMPLE PAUSED', cx, cy - 80, 'bold 22px "Cinzel", serif', '#FFB703', 'center');
    renderer.drawText('Press [ ESC / P ] to Resume', cx, cy - 30, '14px sans-serif', '#F8F9FA', 'center');
    renderer.drawText('Press [ R ] to Restart Level', cx, cy + 10, '14px sans-serif', '#A0AAB8', 'center');
    renderer.drawText('Press [ M ] to Toggle Sound', cx, cy + 45, '14px sans-serif', '#00E5FF', 'center');
    renderer.drawText('Press [ Q ] to Return to Menu', cx, cy + 80, '14px sans-serif', '#EF476F', 'center');

    ctx.restore();
  }

  private renderGameOverModal(renderer: IRenderer): void {
    const vp = renderer.getViewport();
    const ctx = renderer.getContext();
    const cx = vp.width / 2;
    const cy = vp.height / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(8, 12, 20, 0.88)';
    ctx.fillRect(0, 0, vp.width, vp.height);

    renderer.drawText('PRANA DEPLETED', cx, cy - 40, 'bold 36px "Cinzel", Georgia, serif', '#EF476F', 'center');
    renderer.drawText('The solar flame of Veer has faltered in the Sunken Temple', cx, cy + 5, '14px sans-serif', '#A0AAB8', 'center');

    const btnWidth = 220;
    const btnHeight = 44;
    ctx.fillStyle = '#FB8500';
    ctx.beginPath();
    ctx.roundRect(cx - btnWidth / 2, cy + 45, btnWidth, btnHeight, 8);
    ctx.fill();

    renderer.drawText('INSTANT RETRY [ R ]', cx, cy + 72, 'bold 13px "Cinzel", sans-serif', '#080C14', 'center');
    renderer.drawText('Press [ Q ] to Return to Menu', cx, cy + 120, '12px sans-serif', '#718096', 'center');
    ctx.restore();
  }

  private renderVictoryModal(renderer: IRenderer): void {
    const vp = renderer.getViewport();
    const ctx = renderer.getContext();
    const cx = vp.width / 2;
    const cy = vp.height / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(8, 12, 20, 0.9)';
    ctx.fillRect(0, 0, vp.width, vp.height);

    renderer.drawMandala(cx, cy - 70, 120, 16, this.gameTime * 0.5, 'rgba(255, 183, 3, 0.5)');

    renderer.drawText('TEMPLE PURIFIED — VICTORY', cx, cy - 20, 'bold 34px "Cinzel", serif', '#FFB703', 'center');
    renderer.drawText('The Sunken Fire Temple of Surya-Kund has been consecrated!', cx, cy + 15, '14px sans-serif', '#FFD166', 'center');

    const minutes = Math.floor(this.gameTime / 60);
    const seconds = Math.floor(this.gameTime % 60);
    const rank = this.gameTime < 90 ? 'RANK S' : this.gameTime < 150 ? 'RANK A' : 'RANK B';

    renderer.drawText(
      `Time: ${minutes}m ${seconds}s  •  Enemies Cleansed: ${this.enemiesDefeated}  •  Score: ${this.player.score}`,
      cx,
      cy + 45,
      '14px monospace',
      '#F8F9FA',
      'center'
    );
    renderer.drawText(`Evaluation: ${rank}`, cx, cy + 75, 'bold 20px "Cinzel", monospace', '#00E5FF', 'center');

    const btnWidth = 260;
    const btnHeight = 44;
    ctx.fillStyle = '#FB8500';
    ctx.beginPath();
    ctx.roundRect(cx - btnWidth / 2, cy + 105, btnWidth, btnHeight, 8);
    ctx.fill();

    renderer.drawText('CONTINUE TO TITLE [ SPACE ]', cx, cy + 132, 'bold 12px "Cinzel", sans-serif', '#080C14', 'center');
    ctx.restore();
  }

  public handleInput(input: InputManager): void {
    // 1. Pause handling
    if (this.isPaused) {
      if (input.isActionJustPressed('PAUSE')) {
        this.isPaused = false;
        return;
      }
      if (input.isKeyJustPressed('KeyR') || input.isActionJustPressed('RESTART')) {
        this.resetLevel();
        return;
      }
      if (input.isKeyJustPressed('KeyM')) {
        const audio = this.engine.getAudio();
        audio.setMuted(!audio.isMuted());
        return;
      }
      if (input.isKeyJustPressed('KeyQ') || input.isKeyJustPressed('Backspace')) {
        this.engine.getSceneManager().switchTo('SplashScene');
        return;
      }
      if (input.isMouseButtonJustPressed(0)) {
        const mouse = input.getMousePosition();
        const vp = this.engine.getRenderer().getViewport();
        const cx = vp.width / 2;
        const cy = vp.height / 2;
        if (mouse.x >= cx - 140 && mouse.x <= cx + 140) {
          if (mouse.y >= cy - 45 && mouse.y <= cy - 15) {
            this.isPaused = false;
            return;
          }
          if (mouse.y >= cy - 5 && mouse.y <= cy + 25) {
            this.resetLevel();
            return;
          }
          if (mouse.y >= cy + 30 && mouse.y <= cy + 60) {
            const audio = this.engine.getAudio();
            audio.setMuted(!audio.isMuted());
            return;
          }
          if (mouse.y >= cy + 65 && mouse.y <= cy + 95) {
            this.engine.getSceneManager().switchTo('SplashScene');
            return;
          }
        }
      }
      return;
    }

    if (input.isActionJustPressed('PAUSE')) {
      this.isPaused = true;
      return;
    }

    // 2. Game Over handling
    if (this.isGameOver) {
      if (
        input.isKeyJustPressed('KeyR') ||
        input.isActionJustPressed('RESTART') ||
        input.isActionJustPressed('DASH') ||
        input.isActionJustPressed('ATTACK')
      ) {
        this.resetLevel();
        return;
      }
      if (input.isKeyJustPressed('KeyQ') || input.isKeyJustPressed('Escape') || input.isKeyJustPressed('Backspace')) {
        this.engine.getSceneManager().switchTo('SplashScene');
        return;
      }
      if (input.isMouseButtonJustPressed(0)) {
        const mouse = input.getMousePosition();
        const vp = this.engine.getRenderer().getViewport();
        const cx = vp.width / 2;
        const cy = vp.height / 2;
        if (mouse.x >= cx - 110 && mouse.x <= cx + 110 && mouse.y >= cy + 45 && mouse.y <= cy + 89) {
          this.resetLevel();
          return;
        }
        if (mouse.x >= cx - 110 && mouse.x <= cx + 110 && mouse.y >= cy + 105 && mouse.y <= cy + 135) {
          this.engine.getSceneManager().switchTo('SplashScene');
          return;
        }
      }
      return;
    }

    // 3. Victory handling
    if (this.isVictory) {
      if (
        input.isActionJustPressed('DASH') ||
        input.isActionJustPressed('ATTACK') ||
        input.isKeyJustPressed('Space') ||
        input.isKeyJustPressed('KeyQ') ||
        input.isKeyJustPressed('Escape')
      ) {
        this.engine.getSceneManager().switchTo('SplashScene');
        return;
      }
      if (input.isMouseButtonJustPressed(0)) {
        this.engine.getSceneManager().switchTo('SplashScene');
        return;
      }
      return;
    }

    // Movement
    const move = input.getMovementVector();
    this.player.move(move, 1 / 60);

    // Agni-Dash
    if (input.isActionJustPressed('DASH')) {
      if (this.player.triggerDash()) {
        this.engine.getAudio().playDash();
        this.engine.getRenderer().getCamera().triggerShake(2.0, 0.12);
        this.particles.emitBurst(this.player.position.x, this.player.position.y, 14, '#FB8500', 30, 120, 2.5, 0.35);
      }
    }

    // Ranged Surya-Burst (Left Click / J)
    if (input.isActionJustPressed('ATTACK')) {
      const mouseWorldPos = input.getMouseWorldPosition(this.engine.getRenderer().getCamera());
      const burst = this.player.shootBurst(mouseWorldPos);
      if (burst.length > 0) {
        this.playerProjectiles.push(...burst);
        this.engine.getAudio().playShoot();
        this.engine.getRenderer().getCamera().triggerShake(2.5, 0.1);
        this.particles.emitBurst(this.player.position.x, this.player.position.y, 6, '#FFD166', 20, 80, 2, 0.2);
      }
    }

    // Melee Agni-Slash (Right Click / K)
    if (input.isActionJustPressed('MELEE_ATTACK')) {
      const meleeArc = this.player.performMeleeSlash();
      if (meleeArc) {
        this.engine.getAudio().playMeleeSlash();
        this.engine.getRenderer().getCamera().triggerShake(3.0, 0.12);
        this.particles.emitBurst(this.player.position.x, this.player.position.y, 10, '#FB8500', 40, 140, 2, 0.25);

        // Check melee hit on Enemy Projectiles (Deflection / Destruction)
        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
          const ep = this.enemyProjectiles[i];
          if (this.player.position.distanceTo(ep.position) <= meleeArc.radius + 20) {
            ep.destroy();
            this.engine.getAudio().playEnemyHit();
            this.particles.emitBurst(ep.position.x, ep.position.y, 12, '#00E5FF', 50, 180, 2, 0.3);
            this.damageNumbers.spawn(ep.position.x, ep.position.y, 'DEFLECTED!', '#00E5FF', 0.9);
          }
        }

        // Check melee hit on Scouts
        for (const scout of this.scouts) {
          if (scout.isActive && this.player.position.distanceTo(scout.position) <= meleeArc.radius + 20) {
            const killed = scout.takeDamage(meleeArc.damage);
            this.engine.getAudio().playEnemyHit();
            this.damageNumbers.spawn(scout.position.x, scout.position.y, `-${meleeArc.damage}`, '#FFB703', 1.2);
            this.particles.emitBurst(scout.position.x, scout.position.y, 20, '#FFD166', 60, 200, 3, 0.4);

            if (killed) {
              this.enemiesDefeated++;
              this.player.score += 450;
            }
          }
        }

        // Check melee hit on Rakshasa
        if (this.rakshasa.isActive && this.player.position.distanceTo(this.rakshasa.position) <= meleeArc.radius + 30) {
          const killed = this.rakshasa.takeDamage(meleeArc.damage);
          this.engine.getAudio().playEnemyHit();
          this.damageNumbers.spawn(this.rakshasa.position.x, this.rakshasa.position.y, `-${meleeArc.damage}`, '#FFB703', 1.2);
          this.particles.emitBurst(this.rakshasa.position.x, this.rakshasa.position.y, 25, '#EF476F', 60, 220, 3, 0.4);

          if (killed) {
            this.enemiesDefeated++;
            this.player.score += 1500;
          }
        }

        // Check melee hit on Pillars
        for (const pillar of this.pillars) {
          if (pillar.state === 'dormant' && this.player.position.distanceTo(pillar.position) <= meleeArc.radius + 20) {
            pillar.attune();
            this.engine.getAudio().playPillarHarmonic();
            this.particles.emitBurst(pillar.position.x, pillar.position.y, 40, '#FFD166', 60, 220, 3, 0.8);
            this.damageNumbers.spawn(pillar.position.x, pillar.position.y, 'ATTUNED!', '#FFD166', 1.1);
            this.checkObjectiveProgress();
          }
        }
      }
    }

    // Interact with Props [ E / F ]
    if (input.isActionJustPressed('INTERACT') || input.isKeyJustPressed('KeyF') || input.isKeyJustPressed('KeyE')) {
      // 1. Check Ancient Inscription Tablet
      const distTablet = this.player.position.distanceTo(new Vector2D(this.inscriptionTablet.x, this.inscriptionTablet.y));
      if (distTablet < 75) {
        this.inscriptionTablet.isRead = true;
        this.engine.getAudio().playPillarHarmonic();
        this.showToast('📜 Ancient Tablet: "Attune pillars ॐ and श्रीं to drop the Void Shield!"');
        this.damageNumbers.spawn(this.inscriptionTablet.x, this.inscriptionTablet.y - 20, 'LORE DISCOVERED', '#FFD166', 1.2);
        return;
      }

      // 2. Check Shunya Meditation Shrine
      const distShrine = this.player.position.distanceTo(new Vector2D(this.shunyaShrine.x, this.shunyaShrine.y));
      if (distShrine < 85) {
        this.shunyaShrine.isAttuned = true;
        this.speedBuffTimer = 10;
        this.player.speed = 280; // +27% speed buff
        this.player.heal(25);
        this.engine.getAudio().playAltarResonate();
        this.particles.emitBurst(this.shunyaShrine.x, this.shunyaShrine.y, 40, '#00E5FF', 50, 180, 2.5, 0.7);
        this.showToast('🕉️ Shunya Blessing: +25% Speed & Prana Restored!');
        this.damageNumbers.spawn(this.player.position.x, this.player.position.y, '+SURYA RADIANCE', '#00E5FF', 1.3);
        return;
      }

      // 3. Check Agni Forge
      if (!this.forge.isConsecrated && this.player.position.distanceTo(this.forge.position) < 80) {
        if (this.forge.consecrate()) {
          this.player.stance = 'SolarResonantFlare';
          this.engine.getAudio().playForgeUpgrade();
          this.engine.getRenderer().getCamera().triggerShake(5.0, 0.3);
          this.particles.emitBurst(this.forge.position.x, this.forge.position.y, 45, '#FFB703', 60, 250, 3.5, 0.8);
          this.damageNumbers.spawn(this.player.position.x, this.player.position.y, 'SOLAR FLARE STANCE!', '#FFB703', 1.3);
          this.showToast('🔥 Agni Forge: Blade consecrated to Solar Flare Stance!');
          return;
        }
      }

      // 4. Check Amrita Font
      if (this.font.canDrink() && this.player.position.distanceTo(this.font.position) < 80) {
        const healed = this.player.heal(this.font.drink());
        if (healed > 0) {
          this.engine.getAudio().playHeal();
          this.particles.emitBurst(this.player.position.x, this.player.position.y, 25, '#06D6A0', 40, 150, 2.5, 0.6);
          this.damageNumbers.spawn(this.player.position.x, this.player.position.y, `+${healed} PRANA`, '#06D6A0', 1.2);
          this.showToast('💧 Amrita Font: Drank celestial healing nectar!');
          return;
        }
      }

      // 5. Check High Altar
      if (this.player.position.distanceTo(this.altar.position) < 140) {
        this.handleAltarConsecration();
        return;
      }
    }
  }
}
