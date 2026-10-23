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
import { AssetManager } from '../assets/AssetManager';
import { LayeredRenderer } from '../render/LayeredRenderer';
import { RenderLayer } from '../render/RenderLayers';

interface PillarInstance {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  colliderBounds: AABB;
}

export class GameScene implements IScene {
  public readonly id = 'GameScene';
  private engine!: IGameEngine;

  public player!: Player;
  public altar!: Altar;
  public shards: AstraShard[] = [];
  public sentinels: EnemySentinel[] = [];
  public projectiles: Projectile[] = [];
  public pillars: PillarInstance[] = [];

  private particles: ParticleSystem = new ParticleSystem(800);
  private collisionSystem: CollisionSystem = new CollisionSystem(128);
  private hud: HUD = new HUD();
  private layeredRenderer: LayeredRenderer = LayeredRenderer.getInstance();

  private isPaused = false;
  private isVictory = false;
  private victoryTimer = 0;
  private sceneTime = 0;
  private objectiveText = 'Gather 3 Astra Shards scattered across the Sanctum';

  // Sanctum Hall Dimensions
  private chamberBounds: AABB = new AABB(-600, -500, 1200, 1000);

  public onEnter(engine: IGameEngine): void {
    this.engine = engine;
    // Preload art assets
    AssetManager.getInstance().loadAll();
    this.resetLevel();
  }

  public onExit(): void {
    this.collisionSystem.clear();
    this.particles.clear();
    this.projectiles = [];
    const camera = this.engine.getRenderer().getCamera();
    camera.reset(0, 0, 1.0);
  }

  public resetLevel(): void {
    this.collisionSystem.clear();
    this.particles.clear();
    this.projectiles = [];
    this.isPaused = false;
    this.isVictory = false;
    this.victoryTimer = 0;
    this.sceneTime = 0;
    this.objectiveText = 'Gather 3 Astra Shards scattered across the Sanctum';

    // 1. Spawn Player Veer
    this.player = new Player('player_veer', 0, 120);
    this.engine.getRenderer().getCamera().setTarget(this.player.position);
    this.engine.getRenderer().getCamera().position.set(0, 120);

    // 2. Spawn Sun Altar (Surya-Peetham)
    this.altar = new Altar('altar_surya', 0, -180);

    // 3. Spawn 3 Shards at sacred cardinal nodes
    this.shards = [
      new AstraShard('shard_1', -340, 160),
      new AstraShard('shard_2', 340, 160),
      new AstraShard('shard_3', 0, 360),
    ];

    // 4. Spawn Corrupted Asura Sentinels patrolling the halls
    this.sentinels = [
      new EnemySentinel('sentinel_1', -280, -80),
      new EnemySentinel('sentinel_2', 280, -80),
    ];

    // 5. Setup 4 Monumental Hoysala Carved Pillars
    this.pillars = [
      {
        id: 'pillar_nw',
        x: -420,
        y: -300,
        width: 64,
        height: 180,
        colliderBounds: new AABB(-445, -240, 50, 50),
      },
      {
        id: 'pillar_ne',
        x: 420,
        y: -300,
        width: 64,
        height: 180,
        colliderBounds: new AABB(395, -240, 50, 50),
      },
      {
        id: 'pillar_sw',
        x: -420,
        y: 280,
        width: 64,
        height: 180,
        colliderBounds: new AABB(-445, 340, 50, 50),
      },
      {
        id: 'pillar_se',
        x: 420,
        y: 280,
        width: 64,
        height: 180,
        colliderBounds: new AABB(395, 340, 50, 50),
      },
    ];

    // Register colliders
    this.registerEntityColliders();
    this.setupWallColliders();
  }

  private registerEntityColliders(): void {
    // Player
    this.collisionSystem.register({
      id: this.player.id,
      bounds: this.player.bounds,
      type: 'solid',
      tag: 'player',
      isStatic: false,
    });

    // Sun Altar
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

    // Pillars Solid Colliders
    this.pillars.forEach((p) => {
      this.collisionSystem.register({
        id: p.id,
        bounds: p.colliderBounds,
        type: 'solid',
        tag: 'obstacle',
        isStatic: true,
      });
    });
  }

  private setupWallColliders(): void {
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

  public update(dt: number): void {
    if (this.isPaused) return;

    this.sceneTime += dt;

    if (this.isVictory) {
      this.victoryTimer += dt;
      this.particles.update(dt);
      return;
    }

    // Update Player
    this.player.update(dt);

    // Clamp player inside chamber boundaries
    this.player.position.x = Math.max(
      this.chamberBounds.minX + 24,
      Math.min(this.chamberBounds.maxX - 24, this.player.position.x)
    );
    this.player.position.y = Math.max(
      this.chamberBounds.minY + 24,
      Math.min(this.chamberBounds.maxY - 24, this.player.position.y)
    );
    this.player.syncBounds();

    // Update Altar
    this.altar.update(dt);

    // Update Shards & magnetic attraction
    for (const shard of this.shards) {
      shard.update(dt);
      shard.attractTowards(this.player.position, dt);
    }

    // Update Sentinels
    for (const sentinel of this.sentinels) {
      sentinel.update(dt);
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);
      if (!p.isActive) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with Sentinels
      for (const sentinel of this.sentinels) {
        if (sentinel.isActive && p.bounds.intersects(sentinel.bounds)) {
          p.destroy();
          const killed = sentinel.takeDamage(p.damage);
          this.engine.getAudio().playSfx('PARRY');
          this.engine.getRenderer().getCamera().shake(8, 0.2);

          // Burst particles
          this.particles.burst(sentinel.position.x, sentinel.position.y, 16, '#EF476F');

          if (killed) {
            this.player.score += 250;
            this.engine.getAudio().playSfx('VICTORY');
            this.particles.burst(sentinel.position.x, sentinel.position.y, 40, '#FFD166');
          }
          break;
        }
      }
    }

    // Physics collision resolution step
    this.collisionSystem.update();

    // Spawn ambient celestial dust motes
    if (Math.random() < 0.3) {
      const px = this.chamberBounds.minX + Math.random() * this.chamberBounds.width;
      const py = this.chamberBounds.minY + Math.random() * this.chamberBounds.height;
      this.particles.burst(px, py, 1, Math.random() > 0.5 ? '#FFB703' : '#00E5FF');
    }

    // Update Particles
    this.particles.update(dt);

    // Check Victory Consecration
    if (this.altar.state === 'consecrated' && !this.isVictory) {
      this.isVictory = true;
      this.victoryTimer = 0;
      this.objectiveText = 'Sanctum Calibrated! The Astral Gate Awakens';
      this.engine.getAudio().playSfx('VICTORY');
      this.engine.getRenderer().getCamera().shake(12, 0.5);

      SaveGameManager.save({
        altarConsecrated: true,
        highScore: Math.max(this.player.score, SaveGameManager.load().highScore),
        shardsCollected: 3,
        unlockedRealms: ['SanctumOfAstra', 'RealmOfBhumi'],
      });
    }
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    const camera = renderer.getCamera();
    const vp = renderer.getViewport();

    // 1. Render Far Parallax Celestial Backdrop
    this.layeredRenderer.drawParallaxBackground(
      ctx,
      'TEX_SANCTUM_SKY',
      camera.position.x,
      camera.position.y,
      vp.width,
      vp.height,
      0.1
    );

    // Begin Camera World Space Pass
    renderer.beginWorldPass();

    // 2. Render Layer: Terrain & Floor Paving
    this.renderChamberFloor(ctx);

    // 3. Render Layer: Monumental Torana Archway Gate at North Exit
    this.renderToranaGate(ctx);

    // 4. Enqueue Y-Sorted Entities & Architecture into LayeredRenderer
    // Enqueue Pillars
    for (const p of this.pillars) {
      this.layeredRenderer.enqueue(RenderLayer.ARCHITECTURE, p.y + p.height / 2, (c) => {
        this.renderPillar(c, p);
      });

      // Register brazier point light at pillar capital
      this.layeredRenderer.addLight({
        id: `light_${p.id}`,
        x: p.x,
        y: p.y - 70,
        radius: 180,
        color: '#FFB703',
        intensity: 0.6,
        flicker: true,
      });
    }

    // Enqueue Sun Altar
    this.layeredRenderer.enqueue(RenderLayer.ARCHITECTURE, this.altar.position.y + 40, () => {
      this.altar.render(renderer);
    });

    // Register Sun Altar Point Light
    this.layeredRenderer.addLight({
      id: 'light_altar',
      x: this.altar.position.x,
      y: this.altar.position.y,
      radius: this.altar.state === 'consecrated' ? 320 : 200,
      color: this.altar.state === 'consecrated' ? '#FFD166' : '#FFB703',
      intensity: this.altar.state === 'consecrated' ? 0.9 : 0.65,
      flicker: true,
    });

    // Enqueue Shards
    for (const shard of this.shards) {
      if (shard.isActive && !shard.isCollected) {
        this.layeredRenderer.enqueue(RenderLayer.ACTORS, shard.position.y, () => {
          shard.render(renderer);
        });

        // Register Shard Cyan Light
        this.layeredRenderer.addLight({
          id: `light_${shard.id}`,
          x: shard.position.x,
          y: shard.position.y,
          radius: 120,
          color: '#00E5FF',
          intensity: 0.5,
          flicker: false,
        });
      }
    }

    // Enqueue Sentinels
    for (const sentinel of this.sentinels) {
      if (sentinel.isActive) {
        this.layeredRenderer.enqueue(RenderLayer.ACTORS, sentinel.position.y + 16, () => {
          sentinel.render(renderer);
        });

        // Register Red Optic Light
        this.layeredRenderer.addLight({
          id: `light_${sentinel.id}`,
          x: sentinel.position.x,
          y: sentinel.position.y,
          radius: 100,
          color: '#EF476F',
          intensity: 0.55,
          flicker: true,
        });
      }
    }

    // Enqueue Projectiles
    for (const p of this.projectiles) {
      this.layeredRenderer.enqueue(RenderLayer.ACTORS, p.position.y, () => {
        p.render(renderer);
      });
    }

    // Enqueue Player Veer
    this.layeredRenderer.enqueue(RenderLayer.ACTORS, this.player.position.y + 18, () => {
      this.player.render(renderer);
    });

    // Register Player Solar Aura Light
    this.layeredRenderer.addLight({
      id: 'light_player',
      x: this.player.position.x,
      y: this.player.position.y,
      radius: 160,
      color: '#FFB703',
      intensity: 0.5,
      flicker: true,
    });

    // Enqueue Particles
    this.layeredRenderer.enqueue(RenderLayer.VFX, 9999, (c) => {
      this.particles.render(c, new Vector2D(0, 0));
    });

    // Enqueue Volumetric Light Shafts
    this.layeredRenderer.enqueue(RenderLayer.VFX, 10000, (c) => {
      this.layeredRenderer.drawLightShafts(c, this.sceneTime, 0, -100, 1000, 800);
    });

    // Flush and render all layers in deterministic Z-order
    this.layeredRenderer.flush(ctx);

    // Chamber Perimeter Decorative Walls
    this.renderChamberWalls(ctx);

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
      for (const p of this.pillars) {
        renderer.drawAABB(p.colliderBounds, '#F59E0B');
      }
    }

    renderer.endWorldPass();

    // 5. Render Foreground Screen-Space HUD
    this.hud.render(renderer, this.player, this.objectiveText);

    // 6. Render Victory Overlay if consecrated
    if (this.isVictory) {
      this.renderVictoryOverlay(renderer);
    }

    // 7. Render Pause Modal
    if (this.isPaused) {
      this.renderPauseModal(renderer);
    }
  }

  private renderChamberFloor(ctx: CanvasRenderingContext2D): void {
    const minX = this.chamberBounds.minX;
    const maxX = this.chamberBounds.maxX;
    const minY = this.chamberBounds.minY;
    const maxY = this.chamberBounds.maxY;
    const w = this.chamberBounds.width;
    const h = this.chamberBounds.height;

    // Base background tone
    ctx.fillStyle = '#080C14';
    ctx.fillRect(minX, minY, w, h);

    // 1. Tiled Carved Vedic Granite Tiles with Gold Surya Mandalas
    const floorTex = AssetManager.getInstance().getTexture('TEX_SANCTUM_FLOOR');
    if (floorTex) {
      const tileSize = 256;
      ctx.save();
      for (let x = minX; x < maxX; x += tileSize) {
        for (let y = minY; y < maxY; y += tileSize) {
          const drawW = Math.min(tileSize, maxX - x);
          const drawH = Math.min(tileSize, maxY - y);
          try {
            ctx.drawImage(floorTex as CanvasImageSource, 0, 0, 512, 512, x, y, drawW, drawH);
          } catch (e) {
            // fallback
          }
        }
      }
      ctx.restore();
    } else {
      // Procedural stone floor fallback
      ctx.fillStyle = '#0D1424';
      ctx.fillRect(minX, minY, w, h);
    }

    // 2. Central Sanctuary Sacred Grand Mandala Inlay
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const floorGrad = ctx.createRadialGradient(0, 0, 40, 0, 0, 360);
    floorGrad.addColorStop(0, 'rgba(255, 183, 3, 0.22)');
    floorGrad.addColorStop(0.5, 'rgba(251, 133, 0, 0.08)');
    floorGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = floorGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 360, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Subtle grid lines for movement alignment
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.04)';
    ctx.lineWidth = 1;
    const step = 64;
    for (let x = minX; x <= maxX; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, minY);
      ctx.lineTo(x, maxY);
      ctx.stroke();
    }
    for (let y = minY; y <= maxY; y += step) {
      ctx.beginPath();
      ctx.moveTo(minX, y);
      ctx.lineTo(maxX, y);
      ctx.stroke();
    }
  }

  private renderPillar(ctx: CanvasRenderingContext2D, pillar: PillarInstance): void {
    ctx.save();
    ctx.translate(pillar.x, pillar.y);

    // 1. Pillar Contact Shadow at base
    this.layeredRenderer.drawContactShadow(ctx, 0, 60, 40, 18, 0.7);

    // 2. Render Illustrated Pillar Sprite
    const pillarTex = AssetManager.getInstance().getTexture('TEX_SANCTUM_PILLAR');
    if (pillarTex) {
      try {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(-pillar.width / 2 + 4, -pillar.height / 2, pillar.width - 8, pillar.height, [16, 16, 6, 6]);
        ctx.clip();
        ctx.drawImage(pillarTex as CanvasImageSource, -pillar.width / 2, -pillar.height / 2, pillar.width, pillar.height);
        ctx.restore();
      } catch (e) {
        this.renderProceduralPillar(ctx, pillar);
      }
    } else {
      this.renderProceduralPillar(ctx, pillar);
    }

    // 3. Animated Brazier Flame Light
    const flameY = -pillar.height / 2 + 10;
    const flameFlicker = Math.sin(this.sceneTime * 8 + pillar.x) * 3;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const flameGrad = ctx.createRadialGradient(0, flameY, 0, 0, flameY, 28 + flameFlicker);
    flameGrad.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
    flameGrad.addColorStop(0.4, 'rgba(255, 183, 3, 0.6)');
    flameGrad.addColorStop(1, 'rgba(251, 133, 0, 0)');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.arc(0, flameY, 28 + flameFlicker, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  private renderProceduralPillar(ctx: CanvasRenderingContext2D, pillar: PillarInstance): void {
    ctx.fillStyle = '#4A5568';
    ctx.fillRect(-pillar.width / 2, -pillar.height / 2, pillar.width, pillar.height);
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 2;
    ctx.strokeRect(-pillar.width / 2, -pillar.height / 2, pillar.width, pillar.height);
  }

  private renderToranaGate(ctx: CanvasRenderingContext2D): void {
    const toranaTex = AssetManager.getInstance().getTexture('TEX_SANCTUM_TORANA');
    const gx = 0;
    const gy = -470;
    const gw = 180;
    const gh = 140;

    ctx.save();
    // Shadow under gate
    this.layeredRenderer.drawContactShadow(ctx, gx, gy + 50, 90, 24, 0.65);

    if (toranaTex) {
      try {
        ctx.drawImage(toranaTex as CanvasImageSource, gx - gw / 2, gy - gh / 2, gw, gh);
      } catch (e) {
        // fallback
      }
    }

    // Consecration Portal Gateway Beam
    if (this.isVictory) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const portalGrad = ctx.createRadialGradient(gx, gy + 10, 0, gx, gy + 10, 80);
      portalGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      portalGrad.addColorStop(0.4, 'rgba(0, 229, 255, 0.7)');
      portalGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
      ctx.fillStyle = portalGrad;
      ctx.beginPath();
      ctx.arc(gx, gy + 10, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  private renderChamberWalls(ctx: CanvasRenderingContext2D): void {
    const b = this.chamberBounds;

    ctx.save();
    // Heavy carved stone boundary curb
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 6;
    ctx.strokeRect(b.x, b.y, b.width, b.height);

    // Inner golden accent trim
    ctx.strokeStyle = 'rgba(255, 183, 3, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x + 8, b.y + 8, b.width - 16, b.height - 16);

    // 4 Corner Brahmic Knot Medallions
    const corners = [
      { x: b.minX, y: b.minY },
      { x: b.maxX, y: b.minY },
      { x: b.minX, y: b.maxY },
      { x: b.maxX, y: b.maxY },
    ];

    for (const c of corners) {
      ctx.fillStyle = '#FB8500';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderVictoryOverlay(renderer: IRenderer): void {
    const vp = renderer.getViewport();
    const ctx = renderer.getContext();
    const cx = vp.width / 2;
    const cy = vp.height / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(5, 7, 13, 0.88)';
    ctx.fillRect(0, 0, vp.width, vp.height);

    renderer.drawMandala(cx, cy - 60, 130, 16, this.victoryTimer * 0.5, 'rgba(255, 183, 3, 0.5)');

    renderer.drawText('SANCTUM RECLAIMED', cx, cy - 20, 'bold 36px "Cinzel", Georgia, serif', '#FFB703', 'center');
    renderer.drawText('The Solar Astra has been calibrated — The Astral Gate is open', cx, cy + 20, '15px sans-serif', '#FFD166', 'center');
    renderer.drawText(`Final Sanctum Score: ${this.player.score}`, cx, cy + 50, 'bold 16px monospace', '#00E5FF', 'center');

    const btnWidth = 260;
    const btnHeight = 46;
    ctx.fillStyle = '#FB8500';
    ctx.beginPath();
    ctx.roundRect(cx - btnWidth / 2, cy + 90, btnWidth, btnHeight, 8);
    ctx.fill();
    ctx.strokeStyle = '#FFD166';
    ctx.lineWidth = 2;
    ctx.stroke();

    renderer.drawText('CONTINUE TO TITLE [ SPACE ]', cx, cy + 119, 'bold 13px "Cinzel", sans-serif', '#05070D', 'center');
    ctx.restore();
  }

  private renderPauseModal(renderer: IRenderer): void {
    const vp = renderer.getViewport();
    const ctx = renderer.getContext();
    const cx = vp.width / 2;
    const cy = vp.height / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(5, 7, 13, 0.8)';
    ctx.fillRect(0, 0, vp.width, vp.height);

    ctx.fillStyle = '#0B101D';
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx - 160, cy - 120, 320, 240, 12);
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
    // Space, Dash, or click on Continue when victory -> next realm BhumiTempleScene
    if (this.isVictory) {
      if (
        input.isActionJustPressed('DASH') ||
        input.isActionJustPressed('ATTACK') ||
        input.isKeyJustPressed('Space') ||
        input.isMouseButtonJustPressed(0)
      ) {
        this.engine.getSceneManager().switchTo('BhumiTempleScene');
        return;
      }
      return;
    }

    // Toggle Pause Modal
    if (input.isActionJustPressed('PAUSE') || input.isKeyJustPressed('Escape') || input.isKeyJustPressed('KeyP')) {
      this.isPaused = !this.isPaused;
      return;
    }

    if (this.isPaused) {
      if (input.isKeyJustPressed('KeyR')) {
        this.resetLevel();
        return;
      }
      if (input.isKeyJustPressed('KeyM')) {
        this.engine.getAudio().toggleMute();
        return;
      }
      if (input.isKeyJustPressed('KeyQ') || input.isKeyJustPressed('Backspace')) {
        this.engine.getSceneManager().switchTo('SplashScene');
        return;
      }
      if (input.isMouseButtonJustPressed(0)) {
        this.handlePauseModalClick(input.getMousePosition());
        return;
      }
      return;
    }

    // Diagnostics F3
    if (input.isKeyJustPressed('F3')) {
      this.engine.getDiagnostics().toggle();
    }

    // Move Input
    const move = input.getMovementVector();
    this.player.setMovement(move.x, move.y);

    // Aim Facing towards Mouse
    const mouseWorld = this.engine.getRenderer().getCamera().screenToWorld(input.getMousePosition());
    this.player.setFacingTowards(mouseWorld);

    // Dash
    if (input.isActionJustPressed('DASH')) {
      const dashed = this.player.dash();
      if (dashed) {
        this.engine.getAudio().playSfx('DASH');
        this.particles.burst(this.player.position.x, this.player.position.y, 12, '#FB8500');
      }
    }

    // Melee Attack
    if (input.isActionJustPressed('MELEE')) {
      const arc = this.player.meleeAttack();
      if (arc) {
        this.engine.getAudio().playSfx('SLASH');
        this.checkMeleeHits(arc);
      }
    }

    // Ranged Shoot
    if (input.isActionJustPressed('SHOOT') || input.isMouseButtonJustPressed(0)) {
      const proj = this.player.shoot();
      if (proj) {
        this.projectiles.push(proj);
        this.engine.getAudio().playSfx('SHOOT');
      }
    }

    // Guard Shield
    this.player.isGuarding = input.isActionActive('GUARD');
  }

  private handlePauseModalClick(mousePos: { x: number; y: number }): void {
    const vp = this.engine.getRenderer().getViewport();
    const cx = vp.width / 2;
    const cy = vp.height / 2;

    if (mousePos.x >= cx - 140 && mousePos.x <= cx + 140) {
      if (mousePos.y >= cy - 35 && mousePos.y <= cy - 5) {
        this.isPaused = false;
      } else if (mousePos.y >= cy && mousePos.y <= cy + 30) {
        this.resetLevel();
      } else if (mousePos.y >= cy + 35 && mousePos.y <= cy + 65) {
        this.engine.getAudio().toggleMute();
      } else if (mousePos.y >= cy + 70 && mousePos.y <= cy + 105) {
        this.engine.getSceneManager().switchTo('SplashScene');
      }
    }
  }

  private checkMeleeHits(arc: { origin: Vector2D; direction: Vector2D; radius: number; arcAngle: number; damage: number }): void {
    for (const sentinel of this.sentinels) {
      if (!sentinel.isActive) continue;

      const toTarget = Vector2D.sub(sentinel.position, arc.origin);
      const dist = toTarget.length();
      if (dist <= arc.radius) {
        const dot = toTarget.normalize().dot(arc.direction);
        const threshold = Math.cos(arc.arcAngle / 2);
        if (dot >= threshold) {
          const killed = sentinel.takeDamage(arc.damage);
          this.engine.getAudio().playSfx('HIT');
          this.engine.getRenderer().getCamera().shake(6, 0.15);
          this.particles.burst(sentinel.position.x, sentinel.position.y, 14, '#EF476F');

          if (killed) {
            this.player.score += 250;
            this.engine.getAudio().playSfx('VICTORY');
            this.particles.burst(sentinel.position.x, sentinel.position.y, 35, '#FFD166');
          }
        }
      }
    }
  }

  private collectShard(shard: AstraShard): void {
    shard.isCollected = true;
    shard.destroy();
    this.player.score += 100;

    this.engine.getAudio().playSfx('SHARD_COLLECT');
    this.particles.burst(shard.position.x, shard.position.y, 24, '#00E5FF');

    const remaining = this.shards.filter((s) => !s.isCollected).length;
    if (remaining > 0) {
      this.objectiveText = `Bring the remaining ${remaining} Astra Shard${remaining > 1 ? 's' : ''} to the Sun Altar`;
    } else {
      this.objectiveText = 'All Shards Collected! Consecrate the Sun Altar to awaken the Astral Gate';
    }
  }

  public handleAltarInteraction(): void {
    const uncollectedCount = this.shards.filter((s) => !s.isCollected).length;
    if ((uncollectedCount === 0 || this.player.shardsCollected >= this.altar.totalRequired) && this.altar.state !== 'consecrated') {
      while (this.altar.shardsDeposited < this.altar.totalRequired) {
        this.altar.depositShard();
      }
      this.isVictory = true;
      this.victoryTimer = 0;
      this.objectiveText = 'Sanctum Calibrated! The Astral Gate Awakens';

      SaveGameManager.save({
        altarConsecrated: true,
        shardsCollected: this.player.shardsCollected,
        currentRealm: 'Bhumi',
        highScore: Math.max(this.player.score, SaveGameManager.load().highScore),
      });

      this.engine.getAudio().playSfx('ALTAR_CONSECRATE');
      this.particles.burst(this.altar.position.x, this.altar.position.y, 50, '#FFB703');
    }
  }
}
