import { IScene } from './SceneManager';
import { IGameEngine } from '../engine/Engine';
import { IRenderer } from '../render/CanvasRenderer';
import { InputManager } from '../input/InputManager';
import { Player } from '../entities/Player';
import { CollisionSystem } from '../physics/CollisionSystem';
import { EnvironmentManager } from '../environment/EnvironmentManager';
import { Vector2D } from '../physics/Vector2D';
import { NavPath } from '../environment/EnvironmentTypes';

export class WorldExplorationScene implements IScene {
  public readonly id = 'WorldExplorationScene';
  private engine!: IGameEngine;

  public player!: Player;
  public environment!: EnvironmentManager;
  public collisionSystem!: CollisionSystem;

  public activeNavPath: NavPath | null = null;
  public showMiniMap = true;
  private interactionNotice = '';
  private noticeTimer = 0;

  public onEnter(engine: IGameEngine): void {
    this.engine = engine;
    this.collisionSystem = new CollisionSystem(128);
    this.environment = new EnvironmentManager(this.collisionSystem);

    // Spawn Hero Veer on the Grand Vedic Causeway near the Torana Gate
    this.player = new Player('player_veer_world', 0, -200);

    // Register Player in CollisionSystem as dynamic solid
    this.collisionSystem.register({
      id: this.player.id,
      bounds: this.player.bounds,
      type: 'solid',
      tag: 'player',
      isStatic: false,
    });

    // Configure camera
    const camera = this.engine.getRenderer().getCamera();
    camera.setTarget(this.player.position);
    camera.position.set(0, -200);
    camera.zoom = 1.0;
    camera.setWorldBounds(
      this.environment.worldMinX,
      this.environment.worldMinY,
      this.environment.worldMaxX,
      this.environment.worldMaxY
    );
  }

  public onExit(): void {
    this.collisionSystem.clear();
  }

  public handleInput(input: InputManager): void {
    const camera = this.engine.getRenderer().getCamera();

    // 1. Scene Navigation & Return to Title
    if (input.isActionJustPressed('PAUSE')) {
      this.engine.getSceneManager().switchTo('SplashScene');
      return;
    }

    // Toggle Time-of-Day [L]
    if (input.isKeyJustPressed('KeyL')) {
      const nextTime = this.environment.lightingEngine.cycleTimeOfDay();
      this.showNotice(`Time of Day: ${nextTime}`);
    }

    // Toggle Weather [W]
    if (input.isKeyJustPressed('KeyW')) {
      const nextWeather = this.environment.atmosphericSystem.cycleWeather();
      this.showNotice(`Weather: ${nextWeather}`);
    }

    // Toggle NavMesh overlay [N]
    if (input.isKeyJustPressed('KeyN')) {
      this.environment.showNavMeshDebug = !this.environment.showNavMeshDebug;
      this.showNotice(`NavMesh Debug: ${this.environment.showNavMeshDebug ? 'ON' : 'OFF'}`);
    }

    // Toggle Collision debug [B]
    if (input.isKeyJustPressed('KeyB')) {
      this.environment.showCollisionDebug = !this.environment.showCollisionDebug;
      this.showNotice(`Collision Overlay: ${this.environment.showCollisionDebug ? 'ON' : 'OFF'}`);
    }

    // Toggle Mini-Map [M]
    if (input.isKeyJustPressed('KeyM')) {
      this.showMiniMap = !this.showMiniMap;
    }

    // Toggle Lighting pass [F2]
    if (input.isKeyJustPressed('F2') || input.isActionJustPressed('TOGGLE_COLLIDERS')) {
      this.environment.lightingEngine.isEnabled = !this.environment.lightingEngine.isEnabled;
      this.showNotice(`Lighting Pass: ${this.environment.lightingEngine.isEnabled ? 'ON' : 'OFF'}`);
    }

    // Zoom In / Out (+ / -)
    if (input.isKeyJustPressed('Equal') || input.isKeyJustPressed('NumpadAdd')) {
      camera.zoom = Math.min(1.8, camera.zoom + 0.15);
    }
    if (input.isKeyJustPressed('Minus') || input.isKeyJustPressed('NumpadSubtract')) {
      camera.zoom = Math.max(0.4, camera.zoom - 0.15);
    }

    // Interactive Prop Interaction [F]
    if (input.isKeyJustPressed('KeyF') || input.isActionJustPressed('INTERACT')) {
      const interacted = this.environment.interact(this.player.position);
      if (interacted) {
        this.engine.getAudio().playPillarHarmonic();
        this.showNotice('Interacted with prop!');
      }
    }

    // Player dash [Space / Shift]
    if (input.isActionJustPressed('DASH')) {
      if (this.player.triggerDash()) {
        this.engine.getAudio().playDash();
      }
    }

    // Mouse click pathfinding navigation request
    if (input.isMouseButtonJustPressed(0)) {
      const mouseScreen = input.getMousePosition();
      const worldPos = camera.screenToWorld(new Vector2D(mouseScreen.x, mouseScreen.y));
      const path = this.environment.navMesh.findPath(
        this.player.position.x,
        this.player.position.y,
        worldPos.x,
        worldPos.y
      );
      if (path.isValid) {
        this.activeNavPath = path;
        this.showNotice(`Nav Path calculated (${path.points.length} waypoints)`);
      } else {
        this.showNotice('Destination unreachable or blocked!');
      }
    }
  }

  public update(dt: number): void {
    const input = this.engine.getInput();
    const camera = this.engine.getRenderer().getCamera();

    // 1. Move Player
    const moveDir = input.getMovementVector();
    this.player.move(moveDir, dt);
    this.player.update(dt);

    // 2. Resolve Physics & Static Collisions
    this.player.syncBounds();
    this.collisionSystem.update();
    // Synchronize player position with bounds in case physics pushed player back
    this.player.position.x = this.player.bounds.x + this.player.bounds.width / 2;
    this.player.position.y = this.player.bounds.y + this.player.bounds.height / 2;

    // 3. Update Environment Subsystem
    this.environment.update(dt, camera, this.player.position);

    // 4. Update Camera Lerp
    camera.update(dt);

    if (this.noticeTimer > 0) {
      this.noticeTimer -= dt;
    }
  }

  public showNotice(text: string): void {
    this.interactionNotice = text;
    this.noticeTimer = 2.5;
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    const camera = renderer.getCamera();

    // Clear background
    renderer.clear('#0B0F19');

    // 1. World Rendering Pass
    renderer.beginWorldPass();

    // Render Environment (Parallax, terrain, props, lighting, weather, debug)
    this.environment.render(ctx, camera, this.activeNavPath ?? undefined);

    // Render Player Veer (with Phase 2 skeletal rig)
    this.player.render(renderer);

    // Interaction Prompt on nearby prop
    const nearbyProp = this.environment.getNearbyInteractive(this.player.position, 90);
    if (nearbyProp && nearbyProp.interactionPrompt) {
      ctx.save();
      ctx.fillStyle = '#FFB703';
      ctx.font = 'bold 14px Outfit, Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(nearbyProp.interactionPrompt, this.player.position.x, this.player.position.y - 65);
      ctx.restore();
    }

    renderer.endWorldPass();

    // 2. Screen Space HUD & Mini-Map
    this.renderHUD(ctx, renderer.getViewport());
  }

  private renderHUD(ctx: CanvasRenderingContext2D, vp: { width: number; height: number }): void {
    ctx.save();

    // Top Header: Zone Name & Environment Status
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.roundRect(vp.width / 2 - 280, 16, 560, 48, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 16px Outfit, Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.environment.currentZoneName, vp.width / 2, 38);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#94A3B8';
    const timeLabel = this.environment.lightingEngine.getAmbientConfig().label;
    const weather = this.environment.atmosphericSystem.getWeather();
    ctx.fillText(`Time: ${timeLabel}  |  Weather: ${weather}  |  Zoom: ${this.engine.getRenderer().getCamera().zoom.toFixed(2)}x`, vp.width / 2, 54);

    // Discovery Tracker
    const discoveredCount = this.environment.landmarks.filter(l => l.discovered).length;
    const totalCount = this.environment.landmarks.length;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.roundRect(16, 16, 220, 52, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🏛️ Landmarks: ${discoveredCount} / ${totalCount}`, 26, 36);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px sans-serif';
    ctx.fillText('Explore to discover all regions', 26, 54);

    // Bottom Controls Bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.roundRect(vp.width / 2 - 340, vp.height - 42, 680, 32, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('[WASD/Arrows] Move  |  [F] Interact  |  [L] Time-of-Day  |  [W] Weather  |  [N] NavMesh  |  [M] Map  |  [Esc] Title', vp.width / 2, vp.height - 22);

    // In-game temporary toast notice
    if (this.noticeTimer > 0) {
      ctx.fillStyle = 'rgba(217, 119, 6, 0.9)';
      ctx.roundRect(vp.width / 2 - 180, 75, 360, 28, 6);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.interactionNotice, vp.width / 2, 93);
    }

    // Mini-Map Radar (Top Right)
    if (this.showMiniMap) {
      this.renderMiniMap(ctx, vp.width - 160, 16, 144, 115);
    }

    ctx.restore();
  }

  private renderMiniMap(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    ctx.save();

    // Map container
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1.5;
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();

    // Map title
    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('MAP [M]', x + 6, y + 12);

    // Map coordinate mapping
    const mapMinX = this.environment.worldMinX;
    const mapMaxX = this.environment.worldMaxX;
    const mapMinY = this.environment.worldMinY;
    const mapMaxY = this.environment.worldMaxY;

    const toMapX = (wx: number) => x + 8 + ((wx - mapMinX) / (mapMaxX - mapMinX)) * (w - 16);
    const toMapY = (wy: number) => y + 18 + ((wy - mapMinY) / (mapMaxY - mapMinY)) * (h - 26);

    // Draw central highway
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(toMapX(0), toMapY(-1200));
    ctx.lineTo(toMapX(0), toMapY(800));
    ctx.stroke();

    // Draw Chasm line
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toMapX(-1600), toMapY(950));
    ctx.lineTo(toMapX(1600), toMapY(950));
    ctx.stroke();

    // Draw Landmarks
    for (const lm of this.environment.landmarks) {
      ctx.fillStyle = lm.discovered ? '#FBBF24' : '#64748B';
      ctx.beginPath();
      ctx.arc(toMapX(lm.x), toMapY(lm.y), 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Player marker
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(toMapX(this.player.position.x), toMapY(this.player.position.y), 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }
}
