import { CanvasRenderer, IRenderer } from '../render/CanvasRenderer';
import { SceneManager } from '../scenes/SceneManager';
import { InputManager } from '../input/InputManager';
import { AudioEngine } from '../audio/AudioEngine';
import { Diagnostics } from '../core/Diagnostics';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';
import { DiagnosticOverlay } from '../ui/DiagnosticOverlay';
import { GameLoop } from './GameLoop';
import { SplashScene } from '../scenes/SplashScene';
import { StoryScene } from '../scenes/StoryScene';
import { GameScene } from '../scenes/GameScene';
import { SettingsScene } from '../scenes/SettingsScene';

export interface IGameEngine {
  init(canvas: HTMLCanvasElement): void;
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  getRenderer(): IRenderer;
  getSceneManager(): SceneManager;
  getInput(): InputManager;
  getAudio(): AudioEngine;
  getDiagnostics(): Diagnostics;
  getEventBus(): EventBus;
}

export class Engine implements IGameEngine {
  private renderer!: CanvasRenderer;
  private sceneManager!: SceneManager;
  private inputManager: InputManager = new InputManager();
  private audioEngine: AudioEngine = new AudioEngine();
  private diagnostics: Diagnostics = new Diagnostics();
  private eventBus: EventBus = new EventBus();
  private diagnosticOverlay: DiagnosticOverlay = new DiagnosticOverlay();
  private gameLoop!: GameLoop;

  private isInitialized = false;

  public init(canvas: HTMLCanvasElement): void {
    if (this.isInitialized) return;
    this.renderer = new CanvasRenderer(canvas);
    this.sceneManager = new SceneManager(this);

    // Register all Scenes
    this.sceneManager.register(new SplashScene());
    this.sceneManager.register(new StoryScene());
    this.sceneManager.register(new GameScene());
    this.sceneManager.register(new SettingsScene());

    // Attach input
    this.inputManager.attach(window);

    // Setup GameLoop
    this.gameLoop = new GameLoop(
      (dt) => this.update(dt),
      (interpolation) => this.render(interpolation),
      60
    );

    this.isInitialized = true;
    Logger.getInstance().info('Engine', 'Astra Engine Initialized Successfully');
  }

  public start(): void {
    if (!this.isInitialized) {
      throw new Error('Engine must be initialized before start');
    }
    this.sceneManager.switchTo('SplashScene');
    this.gameLoop.start();
    Logger.getInstance().info('Engine', 'Astra Engine Started');
  }

  public pause(): void {
    this.gameLoop.pause();
  }

  public resume(): void {
    this.gameLoop.resume();
  }

  public stop(): void {
    this.gameLoop.stop();
    this.inputManager.detach(window);
  }

  private update(dt: number): void {
    const t0 = performance.now();

    // Check hotkeys (F3 diagnostics, F2 colliders)
    if (this.inputManager.isActionJustPressed('TOGGLE_DIAGNOSTICS')) {
      this.diagnostics.toggleVisible();
    }
    if (this.inputManager.isActionJustPressed('TOGGLE_COLLIDERS')) {
      this.diagnostics.toggleColliders();
    }

    // Process Scene Input & Update
    this.sceneManager.handleInput(this.inputManager);
    this.sceneManager.update(dt);

    // Clear just-pressed inputs
    this.inputManager.postUpdate();

    const t1 = performance.now();
    this.diagnostics.setAudioVoices(this.audioEngine.getActiveVoices());
    this.diagnostics.setTimings(t1 - t0, 0);
  }

  private render(_interpolation: number): void {
    const t0 = performance.now();

    // Render Scene
    this.sceneManager.render(this.renderer);

    // Render Diagnostics if enabled
    this.diagnosticOverlay.render(this.renderer, this.diagnostics);

    const t1 = performance.now();
    this.diagnostics.updateFrame(t1 - t0);
    this.diagnostics.setTimings(this.diagnostics.getMetrics().updateTimeMs, t1 - t0);
  }

  public getRenderer(): IRenderer {
    return this.renderer;
  }

  public getSceneManager(): SceneManager {
    return this.sceneManager;
  }

  public getInput(): InputManager {
    return this.inputManager;
  }

  public getAudio(): AudioEngine {
    return this.audioEngine;
  }

  public getDiagnostics(): Diagnostics {
    return this.diagnostics;
  }

  public getEventBus(): EventBus {
    return this.eventBus;
  }
}
