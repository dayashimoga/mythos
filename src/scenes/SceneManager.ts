import { IRenderer } from '../render/CanvasRenderer';
import { InputManager } from '../input/InputManager';
import { IGameEngine } from '../engine/Engine';

export interface IScene {
  readonly id: string;
  onEnter(engine: IGameEngine): void;
  onExit(): void;
  onSuspend?(): void;
  onResume?(): void;
  onDispose?(): void;
  update(dt: number): void;
  render(renderer: IRenderer): void;
  handleInput(input: InputManager): void;
}

export class SceneManager {
  private scenes: Map<string, IScene> = new Map();
  private currentScene: IScene | null = null;
  private navigationStack: string[] = [];
  private engine: IGameEngine;

  constructor(engine: IGameEngine) {
    this.engine = engine;
  }

  public register(scene: IScene): void {
    this.scenes.set(scene.id, scene);
  }

  public getScene(id: string): IScene | undefined {
    return this.scenes.get(id);
  }

  public getAllSceneIds(): string[] {
    return Array.from(this.scenes.keys());
  }

  public switchTo(sceneId: string, trackHistory = true): void {
    const next = this.scenes.get(sceneId);
    if (!next) {
      console.error(`[SceneManager] Scene not found: ${sceneId}`);
      return;
    }

    if (this.currentScene) {
      if (trackHistory && this.currentScene.id !== sceneId) {
        this.navigationStack.push(this.currentScene.id);
      }
      try {
        this.currentScene.onExit();
      } catch (err) {
        console.error(`[SceneManager] Error in onExit for ${this.currentScene.id}:`, err);
      }
    }

    // Reset camera transforms and isolate render state between scene transitions
    try {
      const camera = this.engine.getRenderer().getCamera();
      camera.reset(0, 0, 1.0);
    } catch {
      // In case renderer/camera is mocked or not yet initialized
    }

    this.currentScene = next;
    try {
      this.currentScene.onEnter(this.engine);
    } catch (err) {
      console.error(`[SceneManager] Error in onEnter for ${this.currentScene.id}:`, err);
    }

    this.engine.getDiagnostics().setActiveScene(this.currentScene.id);
  }

  public pushScene(sceneId: string): void {
    const next = this.scenes.get(sceneId);
    if (!next) {
      console.error(`[SceneManager] Scene not found: ${sceneId}`);
      return;
    }

    if (this.currentScene) {
      this.navigationStack.push(this.currentScene.id);
      if (typeof this.currentScene.onSuspend === 'function') {
        try {
          this.currentScene.onSuspend();
        } catch (err) {
          console.error(`[SceneManager] Error in onSuspend for ${this.currentScene.id}:`, err);
        }
      }
    }

    try {
      const camera = this.engine.getRenderer().getCamera();
      camera.reset(0, 0, 1.0);
    } catch {
      // Mocked or non-initialized renderer
    }

    this.currentScene = next;
    try {
      this.currentScene.onEnter(this.engine);
    } catch (err) {
      console.error(`[SceneManager] Error in onEnter for ${this.currentScene.id}:`, err);
    }

    this.engine.getDiagnostics().setActiveScene(this.currentScene.id);
  }

  public popScene(): boolean {
    if (this.navigationStack.length === 0) return false;
    const prevId = this.navigationStack.pop()!;
    const prev = this.scenes.get(prevId);
    if (!prev) return false;

    if (this.currentScene) {
      try {
        this.currentScene.onExit();
      } catch (err) {
        console.error(`[SceneManager] Error in onExit for ${this.currentScene.id}:`, err);
      }
    }

    this.currentScene = prev;
    try {
      const camera = this.engine.getRenderer().getCamera();
      camera.reset(0, 0, 1.0);
    } catch {
      // Mocked or non-initialized renderer
    }

    if (typeof this.currentScene.onResume === 'function') {
      try {
        this.currentScene.onResume();
      } catch (err) {
        console.error(`[SceneManager] Error in onResume for ${this.currentScene.id}:`, err);
      }
    }

    this.engine.getDiagnostics().setActiveScene(this.currentScene.id);
    return true;
  }

  public navigateBack(fallbackSceneId?: string): boolean {
    const prev = this.navigationStack.pop();
    if (prev && this.scenes.has(prev)) {
      this.switchTo(prev, false);
      return true;
    } else if (fallbackSceneId && this.scenes.has(fallbackSceneId)) {
      this.switchTo(fallbackSceneId, false);
      return true;
    }
    return false;
  }

  public getPreviousScene(): IScene | null {
    if (this.navigationStack.length === 0) return null;
    const prevId = this.navigationStack[this.navigationStack.length - 1];
    return this.scenes.get(prevId) || null;
  }

  public dispose(): void {
    for (const scene of this.scenes.values()) {
      if (typeof scene.onDispose === 'function') {
        try {
          scene.onDispose();
        } catch (err) {
          console.error(`[SceneManager] Error in onDispose for ${scene.id}:`, err);
        }
      }
    }
    this.scenes.clear();
    this.currentScene = null;
    this.navigationStack = [];
  }

  public clearHistory(): void {
    this.navigationStack = [];
  }

  public getCurrentScene(): IScene | null {
    return this.currentScene;
  }

  public update(dt: number): void {
    if (this.currentScene) {
      this.currentScene.update(dt);
    }
  }

  public render(renderer: IRenderer): void {
    if (this.currentScene) {
      this.currentScene.render(renderer);
    }
  }

  public handleInput(input: InputManager): void {
    if (this.currentScene) {
      this.currentScene.handleInput(input);
    }
  }
}
