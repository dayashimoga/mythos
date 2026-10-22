import { IRenderer } from '../render/CanvasRenderer';
import { InputManager } from '../input/InputManager';
import { IGameEngine } from '../engine/Engine';

export interface IScene {
  readonly id: string;
  onEnter(engine: IGameEngine): void;
  onExit(): void;
  update(dt: number): void;
  render(renderer: IRenderer): void;
  handleInput(input: InputManager): void;
}

export class SceneManager {
  private scenes: Map<string, IScene> = new Map();
  private currentScene: IScene | null = null;
  private engine: IGameEngine;

  constructor(engine: IGameEngine) {
    this.engine = engine;
  }

  public register(scene: IScene): void {
    this.scenes.set(scene.id, scene);
  }

  public switchTo(sceneId: string): void {
    const next = this.scenes.get(sceneId);
    if (!next) {
      console.error(`[SceneManager] Scene not found: ${sceneId}`);
      return;
    }

    if (this.currentScene) {
      this.currentScene.onExit();
    }
    this.currentScene = next;
    this.currentScene.onEnter(this.engine);
    this.engine.getDiagnostics().setActiveScene(this.currentScene.id);
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
