import { IScene } from './SceneManager';
import { IGameEngine } from '../engine/Engine';
import { IRenderer } from '../render/CanvasRenderer';
import { InputManager } from '../input/InputManager';
import { Player, MeleeAttackArc } from '../entities/Player';
import { MahishasuraBoss } from '../entities/MahishasuraBoss';
import { AsuraEliteVanguard } from '../entities/AsuraEliteVanguard';
import { Projectile } from '../entities/Projectile';
import { Shockwave } from '../entities/Shockwave';
import { ParticleSystem } from '../render/ParticleSystem';
import { CollisionSystem } from '../physics/CollisionSystem';
import { AABB } from '../physics/AABB';
import { Vector2D } from '../physics/Vector2D';
import { DamageNumberSystem } from '../render/DamageNumberSystem';
import { CombatSystem, AttackSpec, DefenseSpec } from '../gameplay/CombatSystem';
import { CheckpointManager } from '../gameplay/CheckpointManager';
import { SaveGameManager } from '../state/SaveGameManager';
import { PauseMenuModal } from '../ui/modals/PauseMenuModal';
import { SettingsModal } from '../ui/modals/SettingsModal';
import { ToastManager } from '../ui/components/ToastManager';
import { CelestialVFX } from '../render/CelestialVFX';

export class BossEncounterScene implements IScene {
  public readonly id = 'BossEncounterScene';
  private engine!: IGameEngine;

  public player!: Player;
  public boss!: MahishasuraBoss;
  public vanguards: AsuraEliteVanguard[] = [];
  public shockwaves: Shockwave[] = [];
  public enemyProjectiles: Projectile[] = [];
  public playerProjectiles: Projectile[] = [];

  private particles: ParticleSystem = new ParticleSystem(900);
  private collisionSystem: CollisionSystem = new CollisionSystem(128);
  public damageNumbers: DamageNumberSystem = new DamageNumberSystem(80);
  public combatSystem: CombatSystem = new CombatSystem();
  public checkpointManager: CheckpointManager = new CheckpointManager();

  public isPaused = false;
  public isGameOver = false;
  public isVictory = false;
  public battleTime = 0;
  public damageTakenTotal = 0;
  public parriesPerformed = 0;

  public pauseModal!: PauseMenuModal;
  public settingsModal!: SettingsModal;

  // Arena Bounds
  private arenaBounds: AABB = new AABB(-650, -500, 1300, 1000);

  public onEnter(engine: IGameEngine): void {
    this.engine = engine;
    this.combatSystem.setDamageNumbers(this.damageNumbers);
    this.combatSystem.setCamera(this.engine.getRenderer().getCamera());

    // Register primary checkpoint
    this.checkpointManager.clear();
    this.checkpointManager.register('cp_throne_sanctum', 'Throne Sanctum Gateway', 0, 280);

    // Initialize UI Modals
    this.pauseModal = new PauseMenuModal({
      onResume: () => {
        this.isPaused = false;
      },
      onOpenCodex: () => {
        ToastManager.getInstance().show('Codex sealed during active titan confrontation!', 'warning');
      },
      onOpenSettings: () => {
        const vp = this.engine.getRenderer().getViewport();
        this.settingsModal.open(vp.width, vp.height);
      },
      onRestartRealm: () => {
        this.resetEncounter();
      },
      onExitToTitle: () => {
        this.engine.getSceneManager().switchTo('SplashScene');
      },
    });

    this.settingsModal = new SettingsModal(() => {
      if (this.isPaused) {
        const vp = this.engine.getRenderer().getViewport();
        this.pauseModal.open(vp.width, vp.height);
      }
    });

    this.engine.getAudio().startMusic('MARWA', 0.65);
    this.engine.getAudio().startAmbience('OBSIDIAN_CHASM');

    this.resetEncounter();
  }

  public onExit(): void {
    this.collisionSystem.clear();
    this.particles.clear();
    CelestialVFX.getInstance().clear();
    this.engine.getAudio().stopMusic();
    this.engine.getAudio().stopAmbience();
  }

  public resetEncounter(): void {
    this.collisionSystem.clear();
    this.particles.clear();
    CelestialVFX.getInstance().clear();
    this.shockwaves = [];
    this.enemyProjectiles = [];
    this.playerProjectiles = [];
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.battleTime = 0;
    this.damageTakenTotal = 0;
    this.parriesPerformed = 0;

    // Initialize Player
    this.player = new Player('player_astra', 0, 280);
    this.checkpointManager.restorePlayer(this.player);

    const camera = this.engine.getRenderer().getCamera();
    camera.setTarget(this.player.position);
    camera.position.set(0, 150);

    // Initialize Boss
    this.boss = new MahishasuraBoss('boss_mahishasura', 0, -180);

    // Initial Elite Flankers
    this.vanguards = [
      new AsuraEliteVanguard('vanguard_alpha', -220, -100, 'Alpha_Left'),
      new AsuraEliteVanguard('vanguard_beta', 220, -100, 'Beta_Right'),
    ];

    // Register collisions
    this.registerEntityColliders();
  }

  private registerEntityColliders(): void {
    this.collisionSystem.register({
      id: this.player.id,
      bounds: this.player.bounds,
      type: 'solid',
      tag: 'player',
      isStatic: false,
    });

    this.collisionSystem.register({
      id: this.boss.id,
      bounds: this.boss.bounds,
      type: 'solid',
      tag: 'boss',
      isStatic: false,
    });
  }

  public handleInput(input: InputManager): void {
    const mousePos = input.getMousePosition();

    if (this.settingsModal && this.settingsModal.isOpen()) {
      this.settingsModal.handlePointerMove(mousePos);
      if (input.isActionJustPressed('ATTACK')) {
        this.settingsModal.handlePointerDown(mousePos);
      } else if (input.isActionJustReleased('ATTACK')) {
        this.settingsModal.handlePointerUp(mousePos);
      }
      if (input.isActionJustPressed('PAUSE')) {
        this.settingsModal.close();
      }
      return;
    }

    if (this.isPaused) {
      if (input.isKeyJustPressed('KeyM') || input.isKeyJustPressed('Backspace')) {
        this.engine.getSceneManager().switchTo('SplashScene');
        return;
      }
      if (input.isActionJustPressed('PAUSE')) {
        this.isPaused = false;
        if (this.pauseModal) this.pauseModal.close();
        return;
      }
    }

    if (this.pauseModal && this.pauseModal.isOpen()) {
      this.pauseModal.handlePointerMove(mousePos);
      if (input.isActionJustPressed('ATTACK')) {
        this.pauseModal.handlePointerDown(mousePos);
      } else if (input.isActionJustReleased('ATTACK')) {
        this.pauseModal.handlePointerUp(mousePos);
      }
      if (input.isActionJustPressed('PAUSE')) {
        this.pauseModal.close();
        this.isPaused = false;
      }
      return;
    }

    if (this.isGameOver || this.isVictory) {
      if (input.isKeyJustPressed('KeyR')) {
        this.resetEncounter();
        return;
      }
      if (input.isKeyJustPressed('KeyM') || input.isActionJustPressed('PAUSE')) {
        this.engine.getSceneManager().switchTo('SplashScene');
        return;
      }
      return;
    }

    if (input.isActionJustPressed('PAUSE')) {
      this.isPaused = true;
      const vp = this.engine.getRenderer().getViewport();
      this.pauseModal.open(vp.width, vp.height);
      return;
    }

    // Movement
    const moveDir = input.getMovementVector();
    this.player.move(moveDir, 1 / 60);

    // Dash
    if (input.isActionJustPressed('DASH')) {
      if (this.player.triggerDash()) {
        this.particles.emitBurst(this.player.position.x, this.player.position.y, 16, '#FB8500', 160);
      }
    }

    // Weapon Swap (Q)
    if (input.isKeyJustPressed('KeyQ')) {
      if (this.player.swapWeapon()) {
        const isGlaive = this.player.equipmentManager.getActiveWeapon() === 'PRANA_GLAIVE';
        this.damageNumbers.spawn(
          this.player.position.x,
          this.player.position.y - 30,
          isGlaive ? 'PRANA-GLAIVE EQUIPPED' : 'AGNI-CHAKRAM EQUIPPED',
          isGlaive ? '#06B6D4' : '#FFB703'
        );
        this.particles.emitBurst(
          this.player.position.x,
          this.player.position.y,
          20,
          isGlaive ? '#06B6D4' : '#FFB703',
          180
        );
      }
    }

    // Defensive Guard / Parry (C or X or Gamepad LB)
    const isGuardingKey = input.isKeyHeld('KeyC') || input.isKeyHeld('KeyX');
    if (isGuardingKey) {
      this.player.startGuard();
    } else {
      this.player.stopGuard();
    }

    // Melee Attack / 3-Hit Combo (J or Left Mouse Click)
    if (input.isActionJustPressed('ATTACK')) {
      const strikeData = this.player.executeComboAttack();
      if (strikeData) {
        this.handlePlayerMeleeStrike(strikeData.arc);
      }
    }

    // Ranged Solar Burst (K or Right Mouse Click)
    if (input.isActionJustPressed('MELEE_ATTACK')) {
      const projs = this.player.shootBurst();
      if (projs.length > 0) {
        this.playerProjectiles.push(...projs);
        this.particles.emitBurst(this.player.position.x, this.player.position.y, 8, '#FFD166', 100);
      }
    }
  }

  private handlePlayerMeleeStrike(arc: MeleeAttackArc): void {
    const isGlaive = this.player.equipmentManager.getActiveWeapon() === 'PRANA_GLAIVE';
    const burstColor = isGlaive ? '#06B6D4' : '#FFD166';
    this.particles.emitBurst(
      this.player.position.x + this.player.facing.x * 25,
      this.player.position.y + this.player.facing.y * 25,
      12,
      burstColor,
      140
    );

    const facingAngle = Math.atan2(this.player.facing.y, this.player.facing.x || 1);
    CelestialVFX.getInstance().emitSlashTrail(this.player.position, facingAngle, burstColor);
    this.engine.getAudio().playFoleyImpact('CELESTIAL_GOLD', 'SLASH');

    // 1. Check Hit Against Boss
    if (this.boss.isActive) {
      const distToBoss = Vector2D.distance(this.player.position, this.boss.position);
      if (distToBoss <= arc.radius + 40) {
        const attackSpec: AttackSpec = {
          attackerId: this.player.id,
          damage: arc.damage,
          poiseDamage: arc.poiseDamage || 25,
          isShieldBreak: arc.isShieldBreak,
          origin: this.player.position.clone(),
        };

        const bossDefense: DefenseSpec = {
          defenderId: this.boss.id,
          position: this.boss.position.clone(),
          facing: this.boss.facing.clone(),
          isGuarding: false,
          parryWindowTimer: 0,
          poise: this.boss.poise,
        };

        const res = this.combatSystem.resolveAttack(attackSpec, bossDefense);
        this.boss.takeDamage(res.damageDealt);
        this.player.score += res.damageDealt * 10;

        if (this.boss.health <= 0) {
          this.handleBossDefeated();
        }
      }
    }

    // 2. Check Hit Against Elite Vanguards
    for (let i = this.vanguards.length - 1; i >= 0; i--) {
      const v = this.vanguards[i];
      if (!v.isActive) continue;

      const dist = Vector2D.distance(this.player.position, v.position);
      if (dist <= arc.radius + 30) {
        const attackSpec: AttackSpec = {
          attackerId: this.player.id,
          damage: arc.damage,
          poiseDamage: arc.poiseDamage || 25,
          isShieldBreak: arc.isShieldBreak,
          origin: this.player.position.clone(),
        };

        const vDefense: DefenseSpec = {
          defenderId: v.id,
          position: v.position.clone(),
          facing: v.facing.clone(),
          isGuarding: v.isGuarding,
          parryWindowTimer: 0,
          poise: v.poise,
        };

        const res = this.combatSystem.resolveAttack(attackSpec, vDefense);
        v.health -= res.damageDealt;

        if (v.health <= 0) {
          v.destroy();
          this.vanguards.splice(i, 1);
          this.player.score += 350;
          this.player.equipmentManager.addEssence(50);
          this.particles.emitBurst(v.position.x, v.position.y, 25, '#B45309', 160);
          this.damageNumbers.spawn(v.position.x, v.position.y - 25, '+50 ESSENCE', '#F59E0B');
        }
      }
    }
  }

  private handleBossDefeated(): void {
    this.boss.destroy();
    this.isVictory = true;
    this.player.equipmentManager.addEssence(500);

    // Save progression
    SaveGameManager.save({
      shardsCollected: this.player.shardsCollected,
      highScore: this.player.score + 5000,
      currentRealm: 'ThroneSanctum',
    });

    this.particles.emitBurst(this.boss.position.x, this.boss.position.y, 80, '#FFD700', 300);
    this.engine.getRenderer().getCamera().triggerShake(12, 0.45);
  }

  public update(dt: number): void {
    ToastManager.getInstance().update(dt);

    if (this.settingsModal && this.settingsModal.isOpen()) {
      this.settingsModal.update(dt);
      return;
    }
    if (this.pauseModal && this.pauseModal.isOpen()) {
      this.pauseModal.update(dt);
      return;
    }

    if (this.isPaused) return;

    this.particles.update(dt);
    CelestialVFX.getInstance().update(dt);
    this.damageNumbers.update(dt);
    this.engine.getAudio().update(dt);
    this.engine.getAudio().spatial.setListener(this.player.position, this.player.velocity);

    const tension = this.boss.phase === 3 ? 1.0 : (this.boss.phase === 2 ? 0.85 : 0.65);
    this.engine.getAudio().setCombatTension(tension);

    if (this.isGameOver || this.isVictory) return;

    this.battleTime += dt;

    // 1. Update Player
    this.player.update(dt);

    // Keep Player inside arena boundaries
    this.player.position.x = Math.max(this.arenaBounds.x + 24, Math.min(this.arenaBounds.x + this.arenaBounds.width - 24, this.player.position.x));
    this.player.position.y = Math.max(this.arenaBounds.y + 24, Math.min(this.arenaBounds.y + this.arenaBounds.height - 24, this.player.position.y));
    this.player.syncBounds();

    // 2. Update Boss
    if (this.boss.isActive) {
      this.boss.updateAI(this.player.position, dt);
      this.boss.update(dt);

      // Keep Boss inside arena boundaries
      this.boss.position.x = Math.max(this.arenaBounds.x + 40, Math.min(this.arenaBounds.x + this.arenaBounds.width - 40, this.boss.position.x));
      this.boss.position.y = Math.max(this.arenaBounds.y + 40, Math.min(this.arenaBounds.y + this.arenaBounds.height - 40, this.boss.position.y));
      this.boss.syncBounds();

      // Harvest Boss Pending Events (Shockwaves, Orbs, Summons)
      while (this.boss.pendingEvents.length > 0) {
        const ev = this.boss.pendingEvents.shift()!;
        if (ev.type === 'SHOCKWAVE' && ev.shockwaves) {
          this.shockwaves.push(...ev.shockwaves);
          this.engine.getRenderer().getCamera().triggerShake(8, 0.25);
        } else if (ev.type === 'PROJECTILE_BURST' && ev.projectiles) {
          this.enemyProjectiles.push(...ev.projectiles);
          if (ev.shockwaves) this.shockwaves.push(...ev.shockwaves);
        } else if (ev.type === 'SUMMON_MINIONS' && ev.minions) {
          this.vanguards.push(...ev.minions);
          this.damageNumbers.spawn(this.boss.position.x, this.boss.position.y - 50, 'ELITE REINFORCEMENTS!', '#DC2626');
        }
      }

      // Check Boss Charge Impact with Player
      if (this.boss.isCharging && this.boss.chargeWindupTimer <= 0) {
        if (this.boss.bounds.intersects(this.player.bounds)) {
          this.resolveBossDirectHit(35, 45, this.boss.chargeDir);
        }
      }
    }

    // 3. Update Vanguards
    for (const v of this.vanguards) {
      if (!v.isActive) continue;
      v.updateAI(this.player.position, dt);
      v.update(dt);

      // Cleave Attack Check
      if (v.isAttacking && v.attackWindupTimer <= 0.05 && v.attackWindupTimer > 0) {
        const dist = Vector2D.distance(v.position, this.player.position);
        if (dist <= 75) {
          const toPlayer = Vector2D.sub(this.player.position, v.position).normalize();
          this.resolveBossDirectHit(24, 30, toPlayer);
        }
      }

      // Leap Slam Landing Check
      if (v.isLeaping && v.leapTimer <= 0.05 && v.leapTimer > 0) {
        const dist = Vector2D.distance(v.position, this.player.position);
        if (dist <= 85) {
          const wave = new Shockwave(`vanguard_wave_${Date.now()}`, v.position.x, v.position.y, 110, 20);
          this.shockwaves.push(wave);
        }
      }
    }

    // 4. Update Shockwaves & Collision
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.update(dt);

      if (sw.checkPlayerHit(this.player.position, this.player.isDashing)) {
        const knockDir = Vector2D.sub(this.player.position, sw.position).normalize();
        this.resolveBossDirectHit(sw.damage, 35, knockDir);
      }

      if (!sw.isActive) {
        this.shockwaves.splice(i, 1);
      }
    }

    // 5. Update Enemy Projectiles & Collision
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const proj = this.enemyProjectiles[i];
      proj.update(dt);

      if (proj.bounds.intersects(this.player.bounds)) {
        proj.destroy();
        this.enemyProjectiles.splice(i, 1);
        const knockDir = proj.velocity.clone().normalize();
        this.resolveBossDirectHit(proj.damage, 20, knockDir);
        continue;
      }

      if (!proj.isActive) {
        this.enemyProjectiles.splice(i, 1);
      }
    }

    // 6. Update Player Projectiles & Collision with Boss / Vanguards
    for (let i = this.playerProjectiles.length - 1; i >= 0; i--) {
      const proj = this.playerProjectiles[i];
      proj.update(dt);

      if (this.boss.isActive && proj.bounds.intersects(this.boss.bounds)) {
        proj.destroy();
        this.playerProjectiles.splice(i, 1);
        this.boss.takeDamage(proj.damage);
        this.damageNumbers.spawn(this.boss.position.x, this.boss.position.y - 20, proj.damage.toString(), '#FFD166');
        this.particles.emitBurst(proj.position.x, proj.position.y, 6, '#FFB703', 100);
        if (this.boss.health <= 0) {
          this.handleBossDefeated();
        }
        continue;
      }

      for (const v of this.vanguards) {
        if (v.isActive && proj.bounds.intersects(v.bounds)) {
          proj.destroy();
          this.playerProjectiles.splice(i, 1);
          v.health -= proj.damage;
          this.damageNumbers.spawn(v.position.x, v.position.y - 20, proj.damage.toString(), '#FFD166');
          if (v.health <= 0) {
            v.destroy();
            this.particles.emitBurst(v.position.x, v.position.y, 20, '#B45309', 140);
          }
          break;
        }
      }

      if (!proj.isActive) {
        this.playerProjectiles.splice(i, 1);
      }
    }

    // Camera tracks player
    this.engine.getRenderer().getCamera().setTarget(this.player.position);
  }

  private resolveBossDirectHit(damage: number, poiseDmg: number, attackDir: Vector2D): void {
    const attack: AttackSpec = {
      attackerId: 'boss_attack',
      damage,
      poiseDamage: poiseDmg,
      origin: Vector2D.sub(this.player.position, attackDir.clone().scale(30)),
    };

    const playerDef: DefenseSpec = {
      defenderId: this.player.id,
      position: this.player.position.clone(),
      facing: this.player.facing.clone(),
      isGuarding: this.player.isGuarding,
      parryWindowTimer: this.player.parryWindowTimer,
      poise: this.player.poise,
    };

    const res = this.combatSystem.resolveAttack(attack, playerDef);

    if (res.wasParried) {
      this.parriesPerformed++;
      this.particles.emitBurst(this.player.position.x, this.player.position.y, 25, '#00E5FF', 220);
      return;
    }

    if (res.damageDealt > 0) {
      this.damageTakenTotal += res.damageDealt;
      this.player.takeDamage(res.damageDealt, attackDir);
      this.particles.emitBurst(this.player.position.x, this.player.position.y, 14, '#EF4444', 160);

      if (this.player.health <= 0) {
        this.isGameOver = true;
      }
    }
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();

    // 1. Draw Obsidian Arena Floor & Molten Fissures
    this.renderArena(ctx);

    // 2. Render Checkpoint Pillar
    this.renderCheckpointPillar(ctx);

    // 3. Render Shockwaves & Projectiles
    for (const sw of this.shockwaves) sw.render(renderer);
    for (const proj of this.enemyProjectiles) proj.render(renderer);
    for (const proj of this.playerProjectiles) proj.render(renderer);

    // 4. Render Entities
    for (const v of this.vanguards) {
      if (v.isActive) v.render(renderer);
    }

    if (this.boss.isActive) {
      this.boss.render(renderer);
    }

    this.player.render(renderer);

    // 5. Particles, CelestialVFX & Damage Numbers
    this.particles.render(ctx, new Vector2D(0, 0));
    CelestialVFX.getInstance().render(renderer);
    this.damageNumbers.render(renderer);

    // 6. Boss HUD & Overlays
    this.renderBossHUD(ctx);

    if (this.isVictory) {
      this.renderVictoryOverlay(ctx);
    } else if (this.isGameOver) {
      this.renderDefeatOverlay(ctx);
    }

    if (this.pauseModal && this.pauseModal.isOpen()) {
      this.pauseModal.render(renderer);
    }
    if (this.settingsModal && this.settingsModal.isOpen()) {
      this.settingsModal.render(renderer);
    }

    ToastManager.getInstance().render(renderer);
  }

  private renderArena(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    // Dark Obsidian Arena Base
    ctx.fillStyle = '#0F0F14';
    ctx.fillRect(this.arenaBounds.x, this.arenaBounds.y, this.arenaBounds.width, this.arenaBounds.height);

    // Perimeter Wall Border
    ctx.strokeStyle = '#312E81';
    ctx.lineWidth = 6;
    ctx.strokeRect(this.arenaBounds.x, this.arenaBounds.y, this.arenaBounds.width, this.arenaBounds.height);

    // Molten Lava Channels (Cracks across floor)
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.arenaBounds.x + 100, -250);
    ctx.lineTo(0, -100);
    ctx.lineTo(this.arenaBounds.x + this.arenaBounds.width - 100, -250);
    ctx.moveTo(-300, 200);
    ctx.lineTo(0, 50);
    ctx.lineTo(300, 200);
    ctx.stroke();

    // Sacred Brahmic Circle in Center
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 220, 0, Math.PI * 2);
    ctx.arc(0, 0, 140, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private renderCheckpointPillar(ctx: CanvasRenderingContext2D): void {
    const cp = this.checkpointManager.getActiveCheckpoint();
    if (!cp) return;

    ctx.save();
    ctx.translate(cp.position.x, cp.position.y);

    // Glowing base
    ctx.fillStyle = '#065F46';
    ctx.beginPath();
    ctx.ellipse(0, 12, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stone Monolith
    ctx.fillStyle = '#10B981';
    ctx.fillRect(-8, -32, 16, 40);

    // Radiant Rune
    ctx.fillStyle = '#34D399';
    ctx.beginPath();
    ctx.arc(0, -18, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = '#A7F3D0';
    ctx.textAlign = 'center';
    ctx.fillText('SANCTUM CHECKPOINT', 0, -38);

    ctx.restore();
  }

  private renderBossHUD(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    // Fixed screen coordinates (cancel camera transform for UI)
    const cam = this.engine.getRenderer().getCamera();
    ctx.translate(cam.position.x - cam.viewportWidth / 2, cam.position.y - cam.viewportHeight / 2);

    // --- Top Boss Bar ---
    const barWidth = 620;
    const barHeight = 20;
    const barX = (cam.viewportWidth - barWidth) / 2;
    const barY = 28;

    // Boss Title & Phase Name
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.fillStyle = '#F87171';
    ctx.textAlign = 'center';
    const phaseName =
      this.boss.getPhase() === 3
        ? 'PHASE 3: ECLIPSE CATACLYSM (BERSERK)'
        : this.boss.getPhase() === 2
        ? 'PHASE 2: TAMAS SORCERY & REINFORCEMENTS'
        : 'PHASE 1: BUFFALO TITAN WRATH';

    ctx.fillText(`MAHISHASURA — TITAN OF THE VOID ECLIPSE [ ${phaseName} ]`, cam.viewportWidth / 2, barY - 8);

    // Background Container
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8);
    ctx.strokeStyle = '#B91C1C';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8);

    // Boss Health Fill
    const hpRatio = Math.max(0, this.boss.health / this.boss.maxHealth);
    const hpFill = barWidth * hpRatio;
    ctx.fillStyle = this.boss.getPhase() === 3 ? '#9333EA' : '#DC2626';
    ctx.fillRect(barX, barY, hpFill, barHeight);

    // Phase threshold notches (70% and 30%)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(barX + barWidth * 0.70 - 1, barY - 4, 2, barHeight + 8);
    ctx.fillRect(barX + barWidth * 0.30 - 1, barY - 4, 2, barHeight + 8);

    // Boss Poise Sub-bar
    const poiseBarY = barY + barHeight + 4;
    const poiseRatio = Math.max(0, this.boss.poise.current / this.boss.poise.max);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.75)';
    ctx.fillRect(barX, poiseBarY, barWidth, 6);
    ctx.fillStyle = this.boss.poise.isStaggered ? '#EF4444' : '#F59E0B';
    ctx.fillRect(barX, poiseBarY, barWidth * poiseRatio, 6);

    // --- Bottom Player Combat HUD ---
    const hudY = cam.viewportHeight - 65;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(20, hudY, 460, 52);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(20, hudY, 460, 52);

    // Player Health
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = '#E2E8F0';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${Math.round(this.player.health)}/${this.player.maxHealth}`, 32, hudY + 18);
    ctx.fillStyle = '#10B981';
    ctx.fillRect(95, hudY + 8, 120 * (this.player.health / this.player.maxHealth), 12);

    // Player Energy
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText(`EP: ${Math.round(this.player.energy)}/${this.player.maxEnergy}`, 32, hudY + 38);
    ctx.fillStyle = '#06B6D4';
    ctx.fillRect(95, hudY + 28, 120 * (this.player.energy / this.player.maxEnergy), 10);

    // Active Weapon & Combo Status
    const weaponStats = this.player.getActiveWeaponStats();
    ctx.fillStyle = '#FDE047';
    ctx.fillText(`WEAPON: [Q] ${weaponStats.name}`, 235, hudY + 18);

    const comboText =
      this.player.comboIndex === 0
        ? 'READY (HIT 1)'
        : this.player.comboIndex === 1
        ? 'CHAINING (HIT 2)'
        : 'FINISHER READY!';
    ctx.fillStyle = this.player.comboIndex === 2 ? '#F59E0B' : '#94A3B8';
    ctx.fillText(`COMBO: ${comboText}`, 235, hudY + 38);

    // Guard & Parry Status
    const parryActive = this.player.parryWindowTimer > 0;
    ctx.fillStyle = parryActive ? '#00E5FF' : this.player.isGuarding ? '#F59E0B' : '#64748B';
    ctx.fillText(parryActive ? 'PERFECT PARRY [ACTIVE]' : 'GUARD [C / X]', 365, hudY + 28);

    ctx.restore();
  }

  private renderVictoryOverlay(ctx: CanvasRenderingContext2D): void {
    const cam = this.engine.getRenderer().getCamera();
    ctx.save();
    ctx.translate(cam.position.x - cam.viewportWidth / 2, cam.position.y - cam.viewportHeight / 2);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(0, 0, cam.viewportWidth, cam.viewportHeight);

    ctx.font = 'bold 36px Outfit, sans-serif';
    ctx.fillStyle = '#F59E0B';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY — MAHISHASURA VANQUISHED', cam.viewportWidth / 2, cam.viewportHeight / 2 - 80);

    ctx.font = '16px Inter, sans-serif';
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText(`Encounter Duration: ${this.battleTime.toFixed(1)}s`, cam.viewportWidth / 2, cam.viewportHeight / 2 - 30);
    ctx.fillText(`Damage Taken: ${this.damageTakenTotal}`, cam.viewportWidth / 2, cam.viewportHeight / 2 - 5);
    ctx.fillText(`Parries Executed: ${this.parriesPerformed}`, cam.viewportWidth / 2, cam.viewportHeight / 2 + 20);

    const rank = this.damageTakenTotal < 80 ? 'S - DIVINE GUARDIAN' : this.damageTakenTotal < 180 ? 'A - WARRIOR OF SURYA' : 'B - SURVIVOR';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.fillStyle = '#34D399';
    ctx.fillText(`Battle Rank: ${rank}`, cam.viewportWidth / 2, cam.viewportHeight / 2 + 65);

    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Press [R] to Refight Boss  |  Press [ESC] to Return to Menu', cam.viewportWidth / 2, cam.viewportHeight / 2 + 115);

    ctx.restore();
  }

  private renderDefeatOverlay(ctx: CanvasRenderingContext2D): void {
    const cam = this.engine.getRenderer().getCamera();
    ctx.save();
    ctx.translate(cam.position.x - cam.viewportWidth / 2, cam.position.y - cam.viewportHeight / 2);

    ctx.fillStyle = 'rgba(69, 10, 10, 0.88)';
    ctx.fillRect(0, 0, cam.viewportWidth, cam.viewportHeight);

    ctx.font = 'bold 36px Outfit, sans-serif';
    ctx.fillStyle = '#EF4444';
    ctx.textAlign = 'center';
    ctx.fillText('FALLEN IN BATTLE', cam.viewportWidth / 2, cam.viewportHeight / 2 - 40);

    ctx.font = '16px Inter, sans-serif';
    ctx.fillStyle = '#FCA5A5';
    ctx.fillText('The Tamas corruption overwhelmed your life force.', cam.viewportWidth / 2, cam.viewportHeight / 2);

    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Press [R] to Respawn at Sanctum Checkpoint  |  [ESC] Return to Menu', cam.viewportWidth / 2, cam.viewportHeight / 2 + 50);

    ctx.restore();
  }
}
