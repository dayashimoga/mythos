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

export class BhumiTempleScene implements IScene {
  public readonly id = 'BhumiTempleScene';
  private engine!: IGameEngine;

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

  private particles: ParticleSystem = new ParticleSystem(800);
  private collisionSystem: CollisionSystem = new CollisionSystem(128);
  public damageNumbers: DamageNumberSystem = new DamageNumberSystem(60);
  private hud: HUD = new HUD();

  public isPaused = false;
  public isGameOver = false;
  public isVictory = false;

  public gameTime = 0;
  private enemiesDefeated = 0;
  private objectiveText = 'Harmonize the 2 Brahmic Pillars to dissolve the Void Barrier';

  // Map Boundaries & Hazards
  private templeBounds: AABB = new AABB(-750, -650, 1500, 1300);
  private lavaTrench: AABB = new AABB(-550, -40, 1100, 70);

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
    // Player
    this.collisionSystem.register({
      id: this.player.id,
      bounds: this.player.bounds,
      type: 'solid',
      tag: 'player',
      isStatic: false,
    });

    // Shards
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

    // Altar
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

  public onExit(): void {}

  public update(dt: number): void {
    if (this.isPaused) return;

    if (!this.isGameOver && !this.isVictory) {
      this.gameTime += dt;
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

    // Check Lava Trench Hazard
    if (!this.player.isDashing && this.lavaTrench.containsPoint(this.player.position.x, this.player.position.y)) {
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

      // Check collision with Spire
      if (this.spire.isActive && p.bounds.overlaps(this.spire.bounds)) {
        p.destroy();
        const result = this.spire.takeDamage(p.damage);
        if (result.shielded) {
          this.damageNumbers.spawn(this.spire.position.x, this.spire.position.y, 'IMMUNE (SHIELD)', '#C77DFF', 0.9);
          this.engine.getAudio().playEnemyHit();
        } else {
          this.engine.getAudio().playEnemyHit();
          this.damageNumbers.spawn(this.spire.position.x, this.spire.position.y, `-${p.damage}`, '#FFB703', 1.1);
          this.particles.emitBurst(p.position.x, p.position.y, 16, '#EF476F', 40, 160, 2.5, 0.4);

          if (result.killed) {
            this.enemiesDefeated++;
            this.player.score += 2000;
            this.engine.getRenderer().getCamera().triggerShake(9.0, 0.6);
            this.particles.emitBurst(this.spire.position.x, this.spire.position.y, 75, '#EF476F', 80, 320, 4, 1.2);
            this.damageNumbers.spawn(this.spire.position.x, this.spire.position.y, 'SPIRE SHATTERED!', '#FFD166', 1.4);
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

    // 1. Temple Floor & Carved Stone Tiles
    this.renderTempleFloor(ctx);

    // 2. Lava Trench with Heat Flow
    this.renderLavaTrench(ctx);

    // 3. Sacred Interactive Props
    this.forge.render(renderer);
    this.font.render(renderer);
    this.pillars.forEach((p) => p.render(renderer));

    // 4. North Sanctum Objectives
    this.altar.render(renderer);
    if (this.spire.isActive) this.spire.render(renderer);

    // 5. Astra Shards
    for (const shard of this.shards) {
      if (shard.isActive && !shard.isCollected) {
        shard.render(renderer);
      }
    }

    // 6. Enemies
    for (const scout of this.scouts) {
      if (scout.isActive) scout.render(renderer);
    }
    if (this.rakshasa.isActive) this.rakshasa.render(renderer);

    // 7. Shockwaves & Projectiles
    this.shockwaves.forEach((sw) => sw.render(renderer));
    this.playerProjectiles.forEach((p) => p.render(renderer));
    this.enemyProjectiles.forEach((ep) => ep.render(renderer));

    // 8. Player Veer
    this.player.render(renderer);

    // 9. Floating Particles & Combat Numbers
    this.particles.render(ctx, new Vector2D(0, 0));
    this.damageNumbers.render(renderer);

    // 10. Collider Debug (F2)
    if (this.engine.getDiagnostics().getShowColliders()) {
      renderer.drawAABB(this.player.bounds, '#00E5FF');
      renderer.drawAABB(this.lavaTrench, '#FF0000');
      this.pillars.forEach((p) => renderer.drawAABB(p.bounds, '#8338EC'));
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

    // Defeat Overlay
    if (this.isGameOver) {
      this.renderGameOverModal(renderer);
    }

    // Victory Screen
    if (this.isVictory) {
      this.renderVictoryModal(renderer);
    }
  }

  private renderTempleFloor(ctx: CanvasRenderingContext2D): void {
    const minX = this.templeBounds.minX;
    const maxX = this.templeBounds.maxX;
    const minY = this.templeBounds.minY;
    const maxY = this.templeBounds.maxY;

    // Outer Dark Stone Floor
    ctx.fillStyle = '#0F1420';
    ctx.fillRect(minX, minY, this.templeBounds.width, this.templeBounds.height);

    // Carved Temple Tiles
    ctx.strokeStyle = 'rgba(255, 183, 3, 0.08)';
    ctx.lineWidth = 1;
    const tileSize = 64;

    for (let x = minX; x <= maxX; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, minY);
      ctx.lineTo(x, maxY);
      ctx.stroke();
    }
    for (let y = minY; y <= maxY; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(minX, y);
      ctx.lineTo(maxX, y);
      ctx.stroke();
    }

    // Outer Sanctuary Boundary Wall
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 4;
    ctx.strokeRect(minX, minY, this.templeBounds.width, this.templeBounds.height);
  }

  private renderLavaTrench(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    // Lava Glow Gradient
    const lavaGrad = ctx.createLinearGradient(0, this.lavaTrench.minY, 0, this.lavaTrench.maxY);
    lavaGrad.addColorStop(0, '#7F1D1D');
    lavaGrad.addColorStop(0.5, '#EF4444');
    lavaGrad.addColorStop(1, '#B91C1C');

    ctx.fillStyle = lavaGrad;
    ctx.fillRect(this.lavaTrench.x, this.lavaTrench.y, this.lavaTrench.width, this.lavaTrench.height);

    ctx.strokeStyle = '#FB8500';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.lavaTrench.x, this.lavaTrench.y, this.lavaTrench.width, this.lavaTrench.height);

    // Lava Heat Wave
    const wave = Math.sin(this.gameTime * 4) * 8;
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('⚡ LAVA CHANNEL — DASH TO CROSS ⚡', -120 + wave, this.lavaTrench.centerY + 4);

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
    ctx.roundRect(badgeX, badgeY, 190, 32, 6);
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
    if (input.isActionJustPressed('PAUSE')) {
      this.isPaused = !this.isPaused;
      return;
    }

    if (this.isPaused) return;

    if (input.isActionJustPressed('RESTART')) {
      this.resetLevel();
      return;
    }

    if (this.isGameOver) {
      if (input.isActionJustPressed('DASH') || input.isActionJustPressed('ATTACK')) {
        this.resetLevel();
      }
      return;
    }

    if (this.isVictory) {
      if (input.isActionJustPressed('DASH') || input.isActionJustPressed('ATTACK')) {
        this.engine.getSceneManager().switchTo('SplashScene');
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

    // Interact with Props [ E ]
    if (input.isActionJustPressed('INTERACT')) {
      // 1. Check Agni Forge
      if (!this.forge.isConsecrated && this.player.position.distanceTo(this.forge.position) < 80) {
        if (this.forge.consecrate()) {
          this.player.stance = 'SolarResonantFlare';
          this.engine.getAudio().playForgeUpgrade();
          this.engine.getRenderer().getCamera().triggerShake(5.0, 0.3);
          this.particles.emitBurst(this.forge.position.x, this.forge.position.y, 45, '#FFB703', 60, 250, 3.5, 0.8);
          this.damageNumbers.spawn(this.player.position.x, this.player.position.y, 'SOLAR FLARE STANCE!', '#FFB703', 1.3);
        }
      }

      // 2. Check Amrita Font
      if (this.font.canDrink() && this.player.position.distanceTo(this.font.position) < 80) {
        const healed = this.player.heal(this.font.drink());
        if (healed > 0) {
          this.engine.getAudio().playHeal();
          this.particles.emitBurst(this.player.position.x, this.player.position.y, 25, '#06D6A0', 40, 150, 2.5, 0.6);
          this.damageNumbers.spawn(this.player.position.x, this.player.position.y, `+${healed} PRANA`, '#06D6A0', 1.2);
        }
      }

      // 3. Check High Altar
      if (this.player.position.distanceTo(this.altar.position) < 140) {
        this.handleAltarConsecration();
      }
    }
  }
}
