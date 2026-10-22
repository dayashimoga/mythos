import { AABB } from '../physics/AABB';
import { Camera } from '../render/Camera';
import { CollisionSystem } from '../physics/CollisionSystem';
import { ChunkManager } from './ChunkManager';
import { LightingEngine } from './LightingEngine';
import { AtmosphericSystem } from './AtmosphericSystem';
import { NavMesh } from './NavMesh';
import { EnvironmentAssets } from './EnvironmentAssets';
import {
  CollisionLayer,
  IEnvironmentObject,
  LandmarkInfo,
} from './EnvironmentTypes';

export class EnvironmentManager {
  public readonly worldMinX = -2000;
  public readonly worldMinY = -1600;
  public readonly worldMaxX = 2000;
  public readonly worldMaxY = 1600;

  public chunkManager: ChunkManager;
  public lightingEngine: LightingEngine;
  public atmosphericSystem: AtmosphericSystem;
  public navMesh: NavMesh;

  public landmarks: LandmarkInfo[] = [];
  public currentZoneName = 'The Grand Vedic Causeway';
  public showNavMeshDebug = false;
  public showCollisionDebug = false;

  private gameTime = 0;
  private collisionSystem: CollisionSystem;

  constructor(collisionSystem: CollisionSystem) {
    this.collisionSystem = collisionSystem;
    this.chunkManager = new ChunkManager(this.worldMinX, this.worldMinY, this.worldMaxX, this.worldMaxY, 500);
    this.lightingEngine = new LightingEngine();
    this.atmosphericSystem = new AtmosphericSystem();
    this.navMesh = new NavMesh(this.worldMinX, this.worldMinY, this.worldMaxX, this.worldMaxY, 40);

    this.buildWorld();
  }

  public buildWorld(): void {
    this.landmarks = [
      {
        id: 'landmark_banyan',
        name: 'The Elder Banyan of Dandaka',
        zone: 'Zone 1: Sacred Forest of Dandaka',
        description: 'An ancient primordial tree whose roots delve into the heart of Bhumi.',
        x: -1200,
        y: -180,
        discovered: false,
      },
      {
        id: 'landmark_shunya',
        name: 'The Shunya Forest Shrine',
        zone: 'Zone 1: Sacred Forest of Dandaka',
        description: 'A moss-covered stone pavilion housing a sacred meditation bell.',
        x: -1500,
        y: 80,
        discovered: false,
      },
      {
        id: 'landmark_torana',
        name: 'The Torana of the Dawn',
        zone: 'Zone 2: Grand Vedic Causeway',
        description: 'Monumental 3-tiered sandstone ceremonial gateway spanning the highway.',
        x: 0,
        y: -300,
        discovered: false,
      },
      {
        id: 'landmark_prayer_wheels',
        name: 'The Pavilion of Sacred Mantras',
        zone: 'Zone 2: Grand Vedic Causeway',
        description: 'Four rotating brass drums inscribed with Vedic hymns.',
        x: 0,
        y: 220,
        discovered: false,
      },
      {
        id: 'landmark_kalyani',
        name: 'The Great Kalyani of Surya',
        zone: 'Zone 3: Sunken Citadel & Kalyani Ghats',
        description: 'Stepped granite reservoir reflecting the celestial firmament.',
        x: 1000,
        y: 200,
        discovered: false,
      },
      {
        id: 'landmark_shikhara',
        name: 'The High Shikhara Sanctum',
        zone: 'Zone 3: Sunken Citadel & Kalyani Ghats',
        description: 'Towering curvilinear temple spire crowned with a golden Kalasha.',
        x: 1300,
        y: -400,
        discovered: false,
      },
      {
        id: 'landmark_bridge',
        name: 'The Suspension Bridge of Rama',
        zone: 'Zone 4: Patala Basalt Chasm',
        description: 'Ancient wooden plank bridge connecting the mortal realm to Patala.',
        x: 0,
        y: 950,
        discovered: false,
      },
      {
        id: 'landmark_chasm',
        name: 'The Patala Abyssal Fissure',
        zone: 'Zone 4: Patala Basalt Chasm',
        description: 'Jagged volcanic gorge where molten magma pulses with Tamasic heat.',
        x: -400,
        y: 850,
        discovered: false,
      },
    ];

    // 1. Populate Zone 1: Dandaka Sacred Forest
    this.buildDandakaForest();

    // 2. Populate Zone 2: Grand Vedic Causeway
    this.buildVedicCauseway();

    // 3. Populate Zone 3: Sunken Citadel & Kalyani Ghats
    this.buildSunkenCitadel();

    // 4. Populate Zone 4: Patala Basalt Chasm
    this.buildPatalaChasm();

    // 5. Populate World Perimeter Boundary Colliders
    this.buildWorldBoundaries();
  }

  private buildDandakaForest(): void {
    // Elder Banyan Tree
    const banyanBounds = new AABB(-1260, -320, 120, 80);
    this.registerSolidProp({
      id: 'prop_elder_banyan',
      layer: CollisionLayer.TERRAIN_SOLID,
      bounds: banyanBounds,
      zoneId: 'Dandaka',
      render: (ctx, _cam, lod, time) => {
        EnvironmentAssets.drawBanyanTree(ctx, -1200, -300, 160, time * 0.8, lod);
      },
    });

    // Secondary Banyan trees
    const trees = [
      { x: -900, y: -600, r: 100 },
      { x: -1600, y: -500, r: 110 },
      { x: -800, y: 100, r: 90 },
      { x: -1400, y: -100, r: 105 },
    ];
    trees.forEach((t, i) => {
      this.registerSolidProp({
        id: `prop_forest_banyan_${i}`,
        layer: CollisionLayer.TERRAIN_SOLID,
        bounds: new AABB(t.x - 30, t.y - 15, 60, 40),
        zoneId: 'Dandaka',
        render: (ctx, _cam, lod, time) => {
          EnvironmentAssets.drawBanyanTree(ctx, t.x, t.y, t.r, time * 0.8 + i, lod);
        },
      });
    });

    // Shunya Bell Shrine (Interactive)
    const shrineBounds = new AABB(-1540, 160, 80, 80);
    this.registerInteractiveProp({
      id: 'prop_shunya_shrine',
      layer: CollisionLayer.INTERACTIVE_PROP,
      bounds: shrineBounds,
      zoneId: 'Dandaka',
      interactionPrompt: 'Press [F] to chime the Shunya Bell of Clarity',
      customData: { chiming: 0 },
      onInteract: () => {
        const obj = this.chunkManager.getAllObjects().find(o => o.id === 'prop_shunya_shrine');
        if (obj && obj.customData) {
          obj.customData.chiming = 1.0;
        }
      },
      render: (ctx, _cam, _lod, _time) => {
        ctx.save();
        ctx.translate(-1500, 200);
        ctx.fillStyle = '#4A5568';
        ctx.fillRect(-35, -35, 70, 70);
        ctx.strokeStyle = '#2D3748';
        ctx.lineWidth = 2;
        ctx.strokeRect(-35, -35, 70, 70);

        // Bell
        ctx.fillStyle = '#D97706';
        ctx.beginPath();
        ctx.arc(0, -10, 16, 0, Math.PI, true);
        ctx.lineTo(-16, 8);
        ctx.lineTo(16, 8);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      },
    });

    // Forest pathways (NavMesh cost 1.1)
    this.navMesh.markPathway(new AABB(-1700, -350, 1600, 70), 1.1);
    this.navMesh.markPathway(new AABB(-1250, -350, 70, 700), 1.1);

    // Instanced grass across Dandaka
    for (let i = 0; i < 80; i++) {
      const gx = -1900 + Math.random() * 1200;
      const gy = -1000 + Math.random() * 1200;
      this.chunkManager.addInstancedGrass(gx, gy, 10 + Math.random() * 6);
    }
  }

  private buildVedicCauseway(): void {
    // Central Highway (Paved stone flagstones, cost 1.0)
    const highwayBounds = new AABB(-120, -1200, 240, 2000);
    this.navMesh.markPathway(highwayBounds, 1.0);

    // Monumental Torana Gate at (0, -400)
    // Archway visual
    this.chunkManager.addObject({
      id: 'prop_torana_dawn',
      layer: CollisionLayer.NONE,
      bounds: new AABB(-130, -400, 260, 30),
      zoneId: 'Causeway',
      render: (ctx, _cam, lod) => {
        EnvironmentAssets.drawToranaGate(ctx, 0, -400, 240, 180, lod);
      },
    });

    // Left and Right Torana Solid Posts (central archway is open and traversable)
    [-120, 96].forEach((colX, i) => {
      const colBounds = new AABB(colX, -400, 24, 30);
      this.collisionSystem.register({
        id: `torana_col_${i}`,
        bounds: colBounds,
        type: 'solid',
        tag: 'environment_solid',
        isStatic: true,
      });
      this.navMesh.markObstacle(colBounds);
    });

    // Twin Ashoka Pillars flanking the Torana
    [-180, 180].forEach((px, i) => {
      this.registerSolidProp({
        id: `prop_ashoka_pillar_${i}`,
        layer: CollisionLayer.TERRAIN_SOLID,
        bounds: new AABB(px - 14, -390, 28, 28),
        zoneId: 'Causeway',
        render: (ctx, _cam, lod) => {
          EnvironmentAssets.drawAshokaPillar(ctx, px, -380, 140, lod);
        },
      });
    });

    // Four Rotating Prayer Wheels Pavilion at (0, 300)
    [-60, -20, 20, 60].forEach((wx, i) => {
      this.registerInteractiveProp({
        id: `prop_prayer_wheel_${i}`,
        layer: CollisionLayer.INTERACTIVE_PROP,
        bounds: new AABB(wx - 14, 285, 28, 30),
        zoneId: 'Causeway',
        angle: 0,
        interactionPrompt: 'Press [F] to spin the Sacred Prayer Wheel',
        onInteract: () => {
          const obj = this.chunkManager.getAllObjects().find(o => o.id === `prop_prayer_wheel_${i}`);
          if (obj) {
            obj.customData = { spinVelocity: 12.0 };
          }
        },
        render: (ctx, _cam, lod, time) => {
          const obj = this.chunkManager.getAllObjects().find(o => o.id === `prop_prayer_wheel_${i}`);
          let ang = time * 0.8;
          if (obj && obj.customData && typeof obj.customData.spinVelocity === 'number') {
            obj.customData.spinVelocity *= 0.96;
            ang += obj.customData.spinVelocity;
          }
          EnvironmentAssets.drawPrayerWheel(ctx, wx, 300, ang, lod);
        },
      });
    });

    // Roadside Cobbles and stone lanterns
    for (let cy = -1100; cy < 800; cy += 80) {
      this.chunkManager.addInstancedCobble(-90 + (Math.random() - 0.5) * 30, cy, 5 + Math.random() * 4);
      this.chunkManager.addInstancedCobble(90 + (Math.random() - 0.5) * 30, cy, 5 + Math.random() * 4);
    }
  }

  private buildSunkenCitadel(): void {
    // 1. Great Kalyani Stepped Water Reservoir at (1200, 200)
    const kalyaniBounds = new AABB(1020, 80, 360, 240);
    this.chunkManager.addObject({
      id: 'prop_kalyani_ghat',
      layer: CollisionLayer.WATER_SHALLOW,
      bounds: kalyaniBounds,
      zoneId: 'Citadel',
      render: (ctx, _cam, lod, time) => {
        EnvironmentAssets.drawKalyaniGhat(ctx, 1200, 200, 360, 240, time, lod);
      },
    });
    // Mark water navmesh cost 2.0
    this.navMesh.markPathway(kalyaniBounds, 2.0);

    // 2. High Shikhara Temple Sanctum at (1300, -500)
    const templeBounds = new AABB(1160, -500, 280, 60);
    this.registerSolidProp({
      id: 'prop_shikhara_temple',
      layer: CollisionLayer.TERRAIN_SOLID,
      bounds: templeBounds,
      zoneId: 'Citadel',
      render: (ctx, _cam, lod) => {
        EnvironmentAssets.drawShikharaTemple(ctx, 1300, -500, 280, 340, lod);
      },
    });

    // 3. Colonnaded Mandapa Pillars
    const pillars = [
      { x: 950, y: -350 },
      { x: 1100, y: -350 },
      { x: 1500, y: -350 },
      { x: 1650, y: -350 },
      { x: 950, y: -150 },
      { x: 1650, y: -150 },
    ];
    pillars.forEach((p, i) => {
      this.registerSolidProp({
        id: `prop_mandapa_pillar_${i}`,
        layer: CollisionLayer.TERRAIN_SOLID,
        bounds: new AABB(p.x - 15, p.y - 15, 30, 30),
        zoneId: 'Citadel',
        render: (ctx, _cam, lod) => {
          EnvironmentAssets.drawAshokaPillar(ctx, p.x, p.y, 110, lod);
        },
      });
    });

    // 4. Six Brass Fire Braziers with Dynamic Point Lighting
    const braziers = [
      { id: 'brazier_1', x: 1050, y: 50 },
      { id: 'brazier_2', x: 1350, y: 50 },
      { id: 'brazier_3', x: 1050, y: 350 },
      { id: 'brazier_4', x: 1350, y: 350 },
      { id: 'brazier_5', x: 1200, y: -320 },
      { id: 'brazier_6', x: 1400, y: -320 },
    ];
    braziers.forEach(b => {
      this.registerInteractiveProp({
        id: b.id,
        layer: CollisionLayer.INTERACTIVE_PROP,
        bounds: new AABB(b.x - 18, b.y - 18, 36, 36),
        zoneId: 'Citadel',
        isLit: true,
        interactionPrompt: 'Press [F] to toggle Sacred Fire Brazier',
        onInteract: () => {
          const obj = this.chunkManager.getAllObjects().find(o => o.id === b.id);
          if (obj) {
            obj.isLit = !obj.isLit;
            const light = this.lightingEngine.getLight(b.id);
            if (light) {
              light.intensity = obj.isLit ? 0.9 : 0.0;
            }
          }
        },
        render: (ctx, _cam, lod, time) => {
          const obj = this.chunkManager.getAllObjects().find(o => o.id === b.id);
          const isLit = obj ? obj.isLit ?? true : true;
          EnvironmentAssets.drawBrazier(ctx, b.x, b.y, isLit, time, lod);
        },
      });

      // Register Point Light
      this.lightingEngine.addLight({
        id: b.id,
        x: b.x,
        y: b.y,
        radius: 240,
        color: '#FFA500',
        intensity: 0.9,
        flickerSpeed: 7,
        flickerAmount: 0.12,
        isDynamic: true,
      });
    });

    // Connect Causeway to Citadel with wide terrace pathway (cost 1.0)
    this.navMesh.markPathway(new AABB(100, -140, 950, 200), 1.0);
    this.navMesh.markPathway(new AABB(950, -450, 600, 800), 1.0);
  }

  private buildPatalaChasm(): void {
    // 1. Jagged Basalt Chasm Ravine spanning across Y: [900, 1000]
    // Western chasm segment: X in [-1600, -110]
    this.registerSolidProp({
      id: 'prop_chasm_west',
      layer: CollisionLayer.CHASM_ABYSS,
      bounds: new AABB(-1600, 900, 1490, 100),
      zoneId: 'Patala',
      render: (ctx, _cam, lod, time) => {
        EnvironmentAssets.drawBasaltChasm(ctx, -855, 950, 1490, 100, time, lod);
      },
    });

    // Eastern chasm segment: X in [110, 1600]
    this.registerSolidProp({
      id: 'prop_chasm_east',
      layer: CollisionLayer.CHASM_ABYSS,
      bounds: new AABB(110, 900, 1490, 100),
      zoneId: 'Patala',
      render: (ctx, _cam, lod, time) => {
        EnvironmentAssets.drawBasaltChasm(ctx, 855, 950, 1490, 100, time, lod);
      },
    });

    // 2. Suspension Bridge of Rama spanning across the gap at (0, 950)
    const bridgeBounds = new AABB(-110, 915, 220, 70);
    this.chunkManager.addObject({
      id: 'prop_suspension_bridge',
      layer: CollisionLayer.NONE,
      bounds: bridgeBounds,
      zoneId: 'Patala',
      render: (ctx, _cam, lod) => {
        EnvironmentAssets.drawSuspensionBridge(ctx, 0, 950, 220, 70, lod);
      },
    });

    // Bridge walkway is fully traversable across the chasm!
    this.navMesh.markPathway(bridgeBounds, 1.05);

    // Glowing Lava Fissure Light in Chasm Depth
    this.lightingEngine.addLight({
      id: 'light_chasm_magma_west',
      x: -600,
      y: 950,
      radius: 350,
      color: '#FF4500',
      intensity: 0.8,
      flickerSpeed: 4,
      flickerAmount: 0.15,
      isDynamic: true,
    });

    this.lightingEngine.addLight({
      id: 'light_chasm_magma_east',
      x: 600,
      y: 950,
      radius: 350,
      color: '#FF4500',
      intensity: 0.8,
      flickerSpeed: 4,
      flickerAmount: 0.15,
      isDynamic: true,
    });
  }

  private buildWorldBoundaries(): void {
    const wallThick = 60;
    const w = this.worldMaxX - this.worldMinX;
    const h = this.worldMaxY - this.worldMinY;

    // North Wall
    this.registerSolidProp({
      id: 'bound_north',
      layer: CollisionLayer.TERRAIN_SOLID,
      bounds: new AABB(this.worldMinX, this.worldMinY, w, wallThick),
      zoneId: 'Boundary',
      render: (ctx) => {
        ctx.fillStyle = '#1A1E24';
        ctx.fillRect(this.worldMinX, this.worldMinY, w, wallThick);
      },
    });

    // South Wall
    this.registerSolidProp({
      id: 'bound_south',
      layer: CollisionLayer.TERRAIN_SOLID,
      bounds: new AABB(this.worldMinX, this.worldMaxY - wallThick, w, wallThick),
      zoneId: 'Boundary',
      render: (ctx) => {
        ctx.fillStyle = '#1A1E24';
        ctx.fillRect(this.worldMinX, this.worldMaxY - wallThick, w, wallThick);
      },
    });

    // West Wall
    this.registerSolidProp({
      id: 'bound_west',
      layer: CollisionLayer.TERRAIN_SOLID,
      bounds: new AABB(this.worldMinX, this.worldMinY, wallThick, h),
      zoneId: 'Boundary',
      render: (ctx) => {
        ctx.fillStyle = '#1A1E24';
        ctx.fillRect(this.worldMinX, this.worldMinY, wallThick, h);
      },
    });

    // East Wall
    this.registerSolidProp({
      id: 'bound_east',
      layer: CollisionLayer.TERRAIN_SOLID,
      bounds: new AABB(this.worldMaxX - wallThick, this.worldMinY, wallThick, h),
      zoneId: 'Boundary',
      render: (ctx) => {
        ctx.fillStyle = '#1A1E24';
        ctx.fillRect(this.worldMaxX - wallThick, this.worldMinY, wallThick, h);
      },
    });
  }

  public registerSolidProp(prop: IEnvironmentObject): void {
    this.chunkManager.addObject(prop);
    this.collisionSystem.register({
      id: prop.id,
      bounds: prop.bounds,
      type: 'solid',
      tag: 'environment_solid',
      isStatic: true,
    });
    this.navMesh.markObstacle(prop.bounds);
  }

  public registerInteractiveProp(prop: IEnvironmentObject): void {
    prop.isInteractive = true;
    this.chunkManager.addObject(prop);
    this.collisionSystem.register({
      id: prop.id,
      bounds: prop.bounds,
      type: 'trigger',
      tag: 'environment_interactive',
      isStatic: true,
    });
    this.navMesh.markObstacle(prop.bounds);
  }

  public update(dt: number, camera: Camera, playerPos?: { x: number; y: number }): void {
    this.gameTime += dt;

    // Update chunk culling & LOD based on camera viewport
    this.chunkManager.updateCullingAndLOD(camera);

    // Update weather particles
    this.atmosphericSystem.update(dt, camera);

    // Update discovery of landmarks
    if (playerPos) {
      for (const lm of this.landmarks) {
        if (!lm.discovered) {
          const dist = Math.hypot(lm.x - playerPos.x, lm.y - playerPos.y);
          if (dist < 260) {
            lm.discovered = true;
          }
        }
      }
      this.currentZoneName = this.getZoneAt(playerPos);
    }
  }

  public getZoneAt(pos: { x: number; y: number }): string {
    if (pos.y > 800) {
      return 'Zone 4: The Patala Basalt Chasm';
    }
    if (pos.x < -600) {
      return 'Zone 1: The Sacred Forest of Dandaka';
    }
    if (pos.x > 600) {
      return 'Zone 3: The Sunken Citadel & Kalyani Ghats';
    }
    return 'Zone 2: The Grand Vedic Causeway';
  }

  public getNearbyInteractive(playerPos: { x: number; y: number }, radius = 90): IEnvironmentObject | null {
    const query = new AABB(playerPos.x - radius, playerPos.y - radius, radius * 2, radius * 2);
    const objects = this.chunkManager.getObjectsInAABB(query);

    let closest: IEnvironmentObject | null = null;
    let minDist = Infinity;

    for (const obj of objects) {
      if (obj.isInteractive) {
        const objCenterX = obj.bounds.x + obj.bounds.width / 2;
        const objCenterY = obj.bounds.y + obj.bounds.height / 2;
        const dist = Math.hypot(objCenterX - playerPos.x, objCenterY - playerPos.y);
        if (dist <= radius && dist < minDist) {
          minDist = dist;
          closest = obj;
        }
      }
    }
    return closest;
  }

  public interact(playerPos: { x: number; y: number }): boolean {
    const prop = this.getNearbyInteractive(playerPos, 90);
    if (prop && prop.onInteract) {
      prop.onInteract(playerPos);
      return true;
    }
    return false;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    activeNavPath?: { points: { x: number; y: number }[]; isValid: boolean }
  ): void {
    const visibleChunks = this.chunkManager.updateCullingAndLOD(camera);

    // 1. Draw Parallax Distant Backdrop (Mount Meru, Vimanas, sky dome)
    EnvironmentAssets.drawParallaxBackdrop(ctx, camera, this.lightingEngine.getTimeOfDay(), this.gameTime * 0.5);

    // 2. Draw Floor Terrain Canvas (Grass meadows, dirt roads, stone causeway)
    this.renderFloorCanvas(ctx, camera);

    // 3. Draw Instanced Cobbles and Grass Batches
    this.chunkManager.renderInstancedDecorations(ctx, visibleChunks, this.gameTime);

    // 4. Render Active Environment Objects in Visible Chunks
    const renderedIds = new Set<string>();
    for (const chunk of visibleChunks) {
      for (const obj of chunk.objects) {
        if (!renderedIds.has(obj.id)) {
          renderedIds.add(obj.id);
          obj.render(ctx, camera, chunk.lodLevel, this.gameTime);
        }
      }
    }

    // 5. Dynamic Lighting & Shadows Pass
    this.lightingEngine.renderLightingPass(ctx, camera, this.gameTime);

    // 6. Atmospheric Weather Pass (Sunbeams, Rain, Embers, Mist)
    this.atmosphericSystem.render(ctx, camera, this.gameTime);

    // 7. Optional Debug Visualizations
    if (this.showNavMeshDebug) {
      this.navMesh.renderDebugNavMesh(ctx, camera, activeNavPath as any);
    }

    if (this.showCollisionDebug) {
      ctx.save();
      ctx.strokeStyle = '#22C55E';
      ctx.lineWidth = 1.5;
      for (const chunk of visibleChunks) {
        for (const obj of chunk.objects) {
          ctx.strokeRect(obj.bounds.x, obj.bounds.y, obj.bounds.width, obj.bounds.height);
        }
      }
      ctx.restore();
    }
  }

  private renderFloorCanvas(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const bounds = camera.getVisibleBounds();

    ctx.save();
    // Default world terrain base (dark soil/meadow)
    ctx.fillStyle = '#1B261D';
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

    // Paved stone causeway highway strip (X in [-120, 120])
    if (bounds.x < 120 && bounds.x + bounds.width > -120) {
      const hx = Math.max(bounds.x, -120);
      const hw = Math.min(bounds.x + bounds.width, 120) - hx;
      const hy = Math.max(bounds.y, -1200);
      const hh = Math.min(bounds.y + bounds.height, 900) - hy;

      if (hw > 0 && hh > 0) {
        ctx.fillStyle = '#374151';
        ctx.fillRect(hx, hy, hw, hh);

        // Center gold line
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, hy);
        ctx.lineTo(0, hy + hh);
        ctx.stroke();
      }
    }

    // Patala southern basalt terrain (Y > 800)
    if (bounds.y + bounds.height > 800) {
      const py = Math.max(bounds.y, 800);
      const ph = (bounds.y + bounds.height) - py;
      ctx.fillStyle = '#1A1820';
      ctx.fillRect(bounds.x, py, bounds.width, ph);
    }

    ctx.restore();
  }
}
