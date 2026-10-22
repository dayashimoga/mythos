# Mythos: Astra & The Seven Realms — Technical Architecture
**Document Version:** 1.0.0-PROD  
**Classification:** Core System Architecture, Component Specifications & Engine Contracts  
**Status:** Approved & Baseline Frozen for Stage 0  

---

## 1. Engine & Framework Selection with Justified Trade-offs

To achieve universal cross-platform reach across **Windows, Linux, macOS, Android, iOS, and Web** with zero platform-specific compilation roadblocks in headless continuous integration (CI), we engineered the **Astra Engine**—a lightweight, modular, hardware-accelerated 2D/2.5D game engine built with modern **TypeScript**.

### Trade-off Analysis Matrix

| Criterion | Astra Engine (Custom TypeScript/Canvas) | Godot 4.x / C# | Unity 2022/2023 | C++ / SDL2 / WebAssembly |
| :--- | :--- | :--- | :--- | :--- |
| **Cross-Platform Reach** | **Universal:** Web, Win, Mac, Linux, Android, iOS. | Desktop/Mobile/Web (large export). | Universal, but heavy runtime. | High performance, complex bindings. |
| **Headless CI Testability** | **Instantaneous:** Full Vitest/JSDOM execution in $<5\text{s}$ with $\ge 90\%$ coverage on any runner without GPU. | Requires display emulator / heavy Docker container. | Requires costly Unity licenses & large runner downloads. | Requires native toolchains (MSVC, GCC, Clang, Emscripten). |
| **Startup Latency** | **Sub-second:** Zero heavy engine boot or shader compilation pause. | $2 - 5\text{s}$ engine cold boot. | $4 - 10\text{s}$ cold boot. | $<1\text{s}$ cold boot. |
| **Memory Footprint** | **$\le 50\text{ MB}$:** Ultra-lean baseline allocation. | $150 - 300\text{ MB}$. | $250 - 500\text{ MB}$. | $<40\text{ MB}$. |
| **Dependency Maintenance** | **Minimal:** Pinned npm packages, zero proprietary binary black-boxes. | Complex mono runtime dependencies. | Proprietary ecosystem lock-in. | Manual build system (CMake/vcpkg/conan). |
| **Decision** | **SELECTED** | Rejected (Heavy CI / Runner overhead) | Rejected (Proprietary / License gate) | Rejected (Excessive compile time & toolchain fragility) |

---

## 2. High-Level System Architecture Diagram

```
+===================================================================================+
|                                APPLICATION SHELL                                  |
|            (index.html / main.ts / PlatformBridge / ErrorBoundary)                |
+===================================================================================+
                                         |
     +-----------------------------------+-----------------------------------+
     |                                   |                                   |
     v                                   v                                   v
+-----------------+             +-----------------+                 +-----------------+
|  INPUT MANAGER  |             |  SCENE MANAGER  |                 | STATE & STORAGE |
| - Keyboard/Mouse|             | - SplashScene   |                 | - Schema v1.0   |
| - Virtual Touch |             | - StoryScene    |                 | - LocalStorage  |
| - Gamepad API   |             | - GameScene     |                 | - Save/Load API |
| - Action Binder |             | - SettingsScene |                 | - Checksums     |
+-----------------+             +-----------------+                 +-----------------+
         |                               |                                   |
         +-------------------------------+-----------------------------------+
                                         |
                                         v
+===================================================================================+
|                             ASTRA GAME LOOP CORE                                  |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   | FIXED TIMESTEP ACCUMULATOR (60 Hz: dt = 16.666 ms)                        |   |
|   |   while (accumulator >= dt) {                                             |   |
|   |       Input.poll();                                                       |   |
|   |       ActiveScene.update(dt);                                             |   |
|   |       PhysicsEngine.step(dt);                                             |   |
|   |       CollisionSystem.resolve();                                          |   |
|   |       ParticleEngine.update(dt);                                          |   |
|   |       accumulator -= dt;                                                  |   |
|   |   }                                                                       |   |
|   |   alpha = accumulator / dt; // Interpolation factor                       |   |
|   |   ActiveScene.render(Renderer, alpha);                                    |   |
|   +---------------------------------------------------------------------------+   |
+===================================================================================+
         |                               |                                   |
         v                               v                                   v
+-----------------+             +-----------------+                 +-----------------+
| PHYSICS/SPATIAL |             | PROCEDURAL AUDIO|                 | RENDER PIPELINE |
| - Vector2D Math |             | - WebAudio API  |                 | - Canvas2D / GL |
| - AABB Colliders|             | - ADSR Synthesizer                 | - Camera2D Lerp |
| - Spatial Hash  |             | - Chiptune / Wave|                | - Particle Batch|
| - Elastic Res.  |             | - Procedural FX |                 | - Sacred Geometry|
+-----------------+             +-----------------+                 | - HUD / Overlay |
                                                                    +-----------------+
                                                                             |
                                                                             v
                                                                    +-----------------+
                                                                    | DIAGNOSTICS F3  |
                                                                    | - Live FPS / ms |
                                                                    | - Entity count  |
                                                                    | - Collision box |
                                                                    | - Memory metric |
                                                                    +-----------------+
```

---

## 3. Component Contracts & Interfaces

### 3.1 Core Engine Contracts
```typescript
export interface IGameEngine {
  init(canvas: HTMLCanvasElement): Promise<void>;
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  isRunning(): boolean;
  getDiagnostics(): DiagnosticMetrics;
}

export interface IScene {
  readonly id: string;
  onEnter(engine: IGameEngine): void;
  onExit(): void;
  update(dt: number): void;
  render(renderer: IRenderer, interpolation: number): void;
  handleInput(input: IInputManager): void;
}

export interface IRenderer {
  clear(color: string): void;
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  scale(sx: number, sy: number): void;
  rotate(angle: number): void;
  drawRect(x: number, y: number, w: number, h: number, fill?: string, stroke?: string): void;
  drawCircle(x: number, y: number, radius: number, fill?: string, stroke?: string): void;
  drawText(text: string, x: number, y: number, font: string, color: string, align?: CanvasTextAlign): void;
  drawMandala(x: number, y: number, radius: number, petals: number, angle: number, color: string): void;
  getCamera(): ICamera;
  getViewport(): ViewportBounds;
}
```

### 3.2 Physics & Spatial Partitioning
```typescript
export interface ICollider {
  readonly id: string;
  readonly type: 'box' | 'circle';
  bounds: AABB;
  isTrigger: boolean;
  onCollision(other: ICollider): void;
}

export interface ISpatialHashGrid {
  clear(): void;
  insert(collider: ICollider): void;
  retrieveNearby(collider: ICollider): ICollider[];
}
```

### 3.3 Audio Engine Contract
```typescript
export interface IAudioEngine {
  init(): void;
  playDash(): void;
  playShoot(): void;
  playShardPickup(): void;
  playAltarResonate(): void;
  playVictoryFanfare(): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
}
```

---

## 4. Lifecycle & State Machine Diagrams

### 4.1 Application & Scene Flow
```
[Application Boot]
       │
       ▼
[SplashScene] ────(User clicks 'ENTER THE REALM' / Press Space)────► [StoryScene (Prologue)]
                                                                             │
                                              (Click 'BEGIN TRIAL' / Space) ─▼
                                                                     [GameScene (Sanctum)]
                                                                       │       ▲
                                                               (ESC/P) │       │ (Resume)
                                                                       ▼       │
                                                                 [Pause Modal] │
                                                                       │       │
                                    (All 3 Shards + Altar Consecrated) │       │
                                                                       ▼       │
                                                                 [Victory Scene]
```

### 4.2 Fixed Timestep Accumulator Lifecycle
```
RAF Frame Trigger (Window.requestAnimationFrame)
       │
       ▼
Compute delta = min(now - lastTime, 250ms)  // Guard against tab-out spiral of death
       │
       ▼
accumulator += delta
       │
       ├──► while (accumulator >= 16.666ms) ───► Scene.update(16.666ms)
       │                                     ► Physics.step(16.666ms)
       │                                     ► Collision.resolve()
       │                                     ► Particles.update(16.666ms)
       │                                     ► accumulator -= 16.666ms
       │
       ▼
interpolation = accumulator / 16.666ms
       │
       ▼
Scene.render(Renderer, interpolation)
       │
       ▼
Diagnostics.recordFrame()
```

---

## 5. Dependency Map & Modular Boundaries

The codebase enforces strict, unidirectional dependency layers:

```
[src/main.ts]
   ├── [src/core/] (Logger, EventBus, Diagnostics, ErrorBoundary)
   ├── [src/platform/] (PlatformBridge)
   └── [src/engine/] (Engine, GameLoop)
          ├── [src/render/] (Renderer, Camera, ParticleSystem, Geometry)
          ├── [src/physics/] (Vector2D, AABB, SpatialHash, CollisionSystem)
          ├── [src/input/] (InputManager, VirtualJoystick)
          ├── [src/audio/] (AudioEngine, SoundFX)
          ├── [src/state/] (SaveGameManager, StorageAdapter)
          └── [src/scenes/] (SceneManager, SplashScene, StoryScene, GameScene)
                 └── [src/entities/] (Player, AstraShard, Altar, Sentinel, Projectile)
```

No circular dependencies are permitted. `core` and `physics` have zero dependencies on rendering or DOM elements, ensuring 100% headless testability.
