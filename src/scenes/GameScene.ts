import { IScene } from './SceneManager';
import { IGameEngine } from '../engine/Engine';
import { IRenderer } from '../render/CanvasRenderer';
import { InputManager } from '../input/InputManager';
import { Player } from '../entities/Player';
import { AstraShard } from '../entities/AstraShard';
import { Altar } from '../entities/Altar';
import { EnemySentinel } from '../entities/EnemySentinel';
import { Projectile } from '../entities/Projectile';
import { ParticleSystem } from '../render/ParticleSystem';
import { CollisionSystem } from '../physics/CollisionSystem';
import { AABB } from '../physics/AABB';
import { HUD } from '../ui/HUD';
import { Vector2D } from '../physics/Vector2D';
import { SaveGameManager } from '../state/SaveGameManager';

export class GameScene implements IScene {
  public readonly id = 'GameScene';
  private engine!: IGameEngine;

  public player!: Player;
  public altar!: Altar;
  public shards: AstraShard[] = [];
  public sentinels: EnemySentinel[] = [];
  public projectiles: Projectile[] = [];

  private particles: ParticleSystem = new ParticleSystem(800);
  private collisionSystem: CollisionSystem = new CollisionSystem(128);
  private hud: HUD = new HUD();

  private isPaused = false;
  private isVictory = false;
  private victoryTimer = 0;
  private objectiveText = 'Gather 3 Astra Shards scattered across the Sanctum';

  // Boundaries
  private chamberBounds: AABB = new AABB(-600, -500, 1200, 1000);

  public onEnter(engine: IGameEngine): void {
    this.engine = engine;
    this.resetLevel();
  }

  public resetLevel(): void {
    this.collisionSystem.clear();
    this.particles.clear();
    this.projectiles = [];
    this.isPaused = false;
    this.isVictory = false;
    this.victoryTimer = 0;
    this.objectiveText = 'Gather 3 Astra Shards scattered across the Sanctum';

    // Spawn Player
    this.player = new Player('player_veer', 0, 80);
    this.engine.getRenderer().getCamera().setTarget(this.player.position);
    this.engine.getRenderer().getCamera().position.set(0, 80);

    // Spawn Sun Altar
    this.altar = new Altar('altar_surya', 0, -200);

    // Spawn 3 Shards
    this.shards = [
      new AstraShard('shard_1', -340, 160),
      new AstraShard('shard_2', 340, 160),
      new AstraShard('shard_3', 0, 360),
    ];

    // Spawn Corrupted Sentinels
    this.sentinels = [
      new EnemySentinel('sentinel_1', -280, -100),
      new EnemySentinel('sentinel_2', 280, -100),
    ];

    // Register colliders
    this.registerEntityColliders();
    this.setupWallColliders();
  }

  private registerEntityColliders(): void {
    // Player Collider
    this.collisionSystem.register({
      id: this.player.id,
      bounds: this.player.bounds,
      type: 'solid',
      tag: 'player',
      isStatic: false,
    });

    // Altar Collider (trigger for consecration)
    this.collisionSystem.register({
      id: this.altar.id,
      bounds: this.altar.bounds,
      type: 'trigger',
      tag: 'altar',
      isStatic: true,
      onCollide: (other) => {
        if (other.tag === 'player') {
          this.handleAltarInteraction();
        }
      },
    });

    // Shards
    this.shards.forEach((shard) => {
      this.collisionSystem.register({
        id: shard.id,
        bounds: shard.bounds,
        type: 'trigger',
        tag: 'shard',
        isStatic: true,
        onCollide: (other) => {
          if (other.tag === 'player' && !shard.isCollected) {
            this.collectShard(shard);
          }
        },
      });
    });

    // Sentinels
    this.sentinels.forEach((s) => {
      this.collisionSystem.register({
        id: s.id,
        bounds: s.bounds,
        type: 'solid',
        tag: 'enemy',
        isStatic: false,
      });
    });
  }

  private setupWallColliders(): void {
    // 4 enclosing chamber walls
    const t = 40;
    const minX = this.chamberBounds.minX;
    const maxX = this.chamberBounds.maxX;
    const minY = this.chamberBounds.minY;
    const maxY = this.chamberBounds.maxY;
    const w = this.chamberBounds.width;
    const h = this.chamberBounds.height;

    const walls = [
      { id: 'wall_top', bounds: new AABB(minX, minY - t, w, t) },
      { id: 'wall_bottom', bounds: new AABB(minX, maxY, w, t) },
      { id: 'wall_left', bounds: new AABB(minX - t, minY, t, h) },
      { id: 'wall_right', bounds: new AABB(maxX, minY, t, h) },
    ];

    walls.forEach((wall) => {
      this.collisionSystem.register({
        id: wall.id,
        bounds: wall.bounds,
        type: 'solid',
        tag: 'wall',
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
    this.particles.emitBurst(shard.position.x, shard.position.y, 25, '#FFD166', 60, 200, 3, 0.8);
    this.engine.getRenderer().getCamera().triggerShake(3.0, 0.15);

    if (this.player.shardsCollected >= 3) {
      this.objectiveText = 'Approach the Sun Altar and press [ E ] to consecrate the seal';
    } else {
      this.objectiveText = `Gather ${3 - this.player.shardsCollected} more Astra Shards`;
    }
  }

  public handleAltarInteraction(): void {
    if (this.player.shardsCollected >= 3 && this.altar.state !== 'consecrated') {
      while (this.altar.shardsDeposited < 3) {
        this.altar.depositShard();
      }
      this.isVictory = true;
      this.objectiveText = 'Sanctum Calibrated! The Astral Gate Awakens';
      this.engine.getAudio().playAltarResonate();
      this.engine.getAudio().playVictoryFanfare();
      this.engine.getRenderer().getCamera().triggerShake(8.0, 0.7);

      this.particles.emitBurst(this.altar.position.x, this.altar.position.y, 80, '#FFB703', 80, 350, 4, 1.4);
      this.particles.emitBurst(this.altar.position.x, this.altar.position.y, 60, '#00E5FF', 50, 280, 3, 1.2);

      // Save game progress
      SaveGameManager.save({
        shardsCollected: 3,
        altarConsecrated: true,
        highScore: Math.max(SaveGameManager.load().highScore, this.player.score + 2000),
      });
    }
  }

  public onExit(): void {}

  public update(dt: number): void {
    if (this.isPaused) return;

    if (this.isVictory) {
      this.victoryTimer += dt;
    }

    // Update Player
    this.player.update(dt);

    // Dynamic projectile spawning trail
    if (this.player.isDashing) {
      this.particles.emitBurst(this.player.position.x, this.player.position.y, 3, '#FB8500', 10, 40, 2.5, 0.3);
    }

    // Update Altar
    this.altar.update(dt);

    // Update Shards & magnetic pull
    for (const shard of this.shards) {
      if (shard.isActive && !shard.isCollected) {
        shard.attractTowards(this.player.position, dt);
        shard.update(dt);
      }
    }

    // Update Sentinels
    for (const sentinel of this.sentinels) {
      if (sentinel.isActive) {
        sentinel.update(dt);
      }
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);

      if (!p.isActive) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with sentinels
      for (const sentinel of this.sentinels) {
        if (sentinel.isActive && p.bounds.overlaps(sentinel.bounds)) {
          p.destroy();
          const killed = sentinel.takeDamage(p.damage);
          this.engine.getRenderer().getCamera().triggerShake(3.5, 0.15);
          this.particles.emitBurst(p.position.x, p.position.y, 16, '#FFB703', 50, 180, 2.5, 0.4);

          if (killed) {
            this.collisionSystem.unregister(sentinel.id);
            this.player.score += 750;
            this.particles.emitBurst(sentinel.position.x, sentinel.position.y, 45, '#EF476F', 80, 240, 4, 0.9);
            this.engine.getRenderer().getCamera().triggerShake(5.0, 0.25);
          }
          break;
        }
      }
    }

    // Collision Resolution Step
    const checks = this.collisionSystem.update();

    // Update Particle System
    this.particles.update(dt);

    // Update Camera
    const camera = this.engine.getRenderer().getCamera();
    camera.update(dt);

    // Update Diagnostics
    this.engine.getDiagnostics().setCounts(
      1 + 1 + this.shards.filter((s) => !s.isCollected).length + this.sentinels.filter((s) => s.isActive).length + this.projectiles.length,
      this.particles.getActiveCount(),
      checks
    );
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    renderer.clear('#080C14');

    renderer.beginWorldPass();

    // Draw Floor Grid & Sacred Mandala Tile Inlays
    this.renderChamberFloor(ctx);

    // Render Chamber Walls
    this.renderChamberWalls(ctx);

    // Render Altar
    this.altar.render(renderer);

    // Render Shards
    for (const shard of this.shards) {
      if (shard.isActive && !shard.isCollected) {
        shard.render(renderer);
      }
    }

    // Render Sentinels
    for (const sentinel of this.sentinels) {
      if (sentinel.isActive) {
        sentinel.render(renderer);
      }
    }

    // Render Projectiles
    for (const p of this.projectiles) {
      p.render(renderer);
    }

    // Render Player Veer
    this.player.render(renderer);

    // Render Particles
    this.particles.render(ctx, new Vector2D(0, 0));

    // Debug Colliders if F2 toggled
    if (this.engine.getDiagnostics().getShowColliders()) {
      renderer.drawAABB(this.player.bounds, '#00E5FF');
      renderer.drawAABB(this.altar.bounds, '#FFB703');
      for (const s of this.shards) {
        if (!s.isCollected) renderer.drawAABB(s.bounds, '#FFD166');
      }
      for (const sen of this.sentinels) {
        if (sen.isActive) renderer.drawAABB(sen.bounds, '#EF476F');
      }
    }

    renderer.endWorldPass();

    // Render Foreground HUD
    this.hud.render(renderer, this.player, this.objectiveText);

    // Render Victory Overlay if consecrated
    if (this.isVictory) {
      this.renderVictoryOverlay(renderer);
    }

    // Render Pause Modal
    if (this.isPaused) {
      this.renderPauseModal(renderer);
    }
  }

  private renderChamberFloor(ctx: CanvasRenderingContext2D): void {
    const minX = this.chamberBounds.minX;
    const maxX = this.chamberBounds.maxX;
    const minY = this.chamberBounds.minY;
    const maxY = this.chamberBounds.maxY;

    // Floor Base
    ctx.fillStyle = '#0B101D';
    ctx.fillRect(minX, minY, this.chamberBounds.width, this.chamberBounds.height);

    // Stone Grid Lines
    ctx.strokeStyle = 'rgba(255, 183, 3, 0.05)';
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
  }

  private renderChamberWalls(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 4;
    ctx.strokeRect(
      this.chamberBounds.x,
      this.chamberBounds.y,
      this.chamberBounds.width,
      this.chamberBounds.height
    );
  }

  private renderVictoryOverlay(renderer: IRenderer): void {
    const vp = renderer.getViewport();
    const ctx = renderer.getContext();
    const cx = vp.width / 2;
    const cy = vp.height / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(8, 12, 20, 0.85)';
    ctx.fillRect(0, 0, vp.width, vp.height);

    renderer.drawMandala(cx, cy - 60, 120, 16, this.victoryTimer * 0.5, 'rgba(255, 183, 3, 0.4)');

    renderer.drawText('SANCTUM RECLAIMED', cx, cy - 20, 'bold 36px "Cinzel", Georgia, serif', '#FFB703', 'center');
    renderer.drawText('The Solar Astra has been calibrated for Stage 0', cx, cy + 20, '14px sans-serif', '#FFD166', 'center');
    renderer.drawText(`Final Sanctum Score: ${this.player.score}`, cx, cy + 50, 'bold 16px monospace', '#00E5FF', 'center');

    const btnWidth = 240;
    const btnHeight = 44;
    ctx.fillStyle = '#FB8500';
    ctx.beginPath();
    ctx.roundRect(cx - btnWidth / 2, cy + 90, btnWidth, btnHeight, 8);
    ctx.fill();

    renderer.drawText('CONTINUE TO TITLE [ SPACE ]', cx, cy + 118, 'bold 12px "Cinzel", sans-serif', '#080C14', 'center');
    ctx.restore();
  }

  private renderPauseModal(renderer: IRenderer): void {
    const vp = renderer.getViewport();
    const ctx = renderer.getContext();
    const cx = vp.width / 2;
    const cy = vp.height / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(8, 12, 20, 0.8)';
    ctx.fillRect(0, 0, vp.width, vp.height);

    ctx.fillStyle = '#121824';
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx - 160, cy - 120, 320, 240, 10);
    ctx.fill();
    ctx.stroke();

    renderer.drawText('SANCTUM PAUSED', cx, cy - 70, 'bold 22px "Cinzel", serif', '#FFB703', 'center');
    renderer.drawText('Press [ ESC / P ] to Resume', cx, cy - 20, '14px sans-serif', '#F8F9FA', 'center');
    renderer.drawText('Press [ R ] to Restart Level', cx, cy + 15, '14px sans-serif', '#A0AAB8', 'center');
    renderer.drawText('Press [ M ] to Toggle Sound', cx, cy + 50, '14px sans-serif', '#00E5FF', 'center');
    renderer.drawText('Press [ Q ] to Return to Menu', cx, cy + 85, '14px sans-serif', '#EF476F', 'center');

    ctx.restore();
  }

  public handleInput(input: InputManager): void {
    // Pause toggle
    if (input.isActionJustPressed('PAUSE')) {
      this.isPaused = !this.isPaused;
      return;
    }

    if (this.isPaused) {
      if (input.isActionJustPressed('ATTACK') || input.isActionHeld('MOVE_UP')) {
        // Can add quick shortcuts
      }
      return;
    }

    if (this.isVictory) {
      if (input.isActionJustPressed('DASH') || input.isActionJustPressed('ATTACK')) {
        this.engine.getSceneManager().switchTo('BhumiTempleScene');
      }
      return;
    }

    // Movement
    const move = input.getMovementVector();
    this.player.move(move, 1 / 60);

    // Dash
    if (input.isActionJustPressed('DASH')) {
      if (this.player.triggerDash()) {
        this.engine.getAudio().playDash();
        this.engine.getRenderer().getCamera().triggerShake(2.0, 0.12);
        this.particles.emitBurst(this.player.position.x, this.player.position.y, 14, '#FB8500', 30, 120, 2.5, 0.35);
      }
    }

    // Shoot / Surya-Burst
    if (input.isActionJustPressed('ATTACK')) {
      const mouseWorldPos = input.getMouseWorldPosition(this.engine.getRenderer().getCamera());
      const proj = this.player.shoot(mouseWorldPos);
      if (proj) {
        this.projectiles.push(proj);
        this.engine.getAudio().playShoot();
        this.engine.getRenderer().getCamera().triggerShake(2.5, 0.1);
        this.particles.emitBurst(this.player.position.x, this.player.position.y, 6, '#FFD166', 20, 80, 2, 0.2);
      }
    }

    // Manual interact with altar
    if (input.isActionJustPressed('INTERACT')) {
      const distToAltar = this.player.position.distanceTo(this.altar.position);
      if (distToAltar < 140) {
        this.handleAltarInteraction();
      }
    }
  }
}
