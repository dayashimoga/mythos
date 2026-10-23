import { IScene } from './SceneManager';
import { IGameEngine } from '../engine/Engine';
import { IRenderer } from '../render/CanvasRenderer';
import { InputManager } from '../input/InputManager';
import { SettingsModal } from '../ui/modals/SettingsModal';
import { ToastManager } from '../ui/components/ToastManager';

export class SettingsScene implements IScene {
  public readonly id = 'SettingsScene';
  private engine!: IGameEngine;
  private settingsModal!: SettingsModal;

  public onEnter(engine: IGameEngine): void {
    this.engine = engine;
    const vp = this.engine.getRenderer().getViewport();

    this.settingsModal = new SettingsModal(() => {
      this.engine.getSceneManager().switchTo('SplashScene');
    });

    this.settingsModal.open(vp.width, vp.height);
  }

  public onExit(): void {
    this.settingsModal.close();
  }

  public update(dt: number): void {
    this.settingsModal.update(dt);
    ToastManager.getInstance().update(dt);
  }

  public render(renderer: IRenderer): void {
    renderer.clear('#080C14');
    this.settingsModal.render(renderer);
    ToastManager.getInstance().render(renderer);
  }

  public handleInput(input: InputManager): void {
    const mousePos = input.getMousePosition();

    // Mouse pointer events
    this.settingsModal.handlePointerMove(mousePos);

    if (input.isActionJustPressed('ATTACK')) {
      this.settingsModal.handlePointerDown(mousePos);
    } else if (input.isActionJustReleased('ATTACK')) {
      this.settingsModal.handlePointerUp(mousePos);
    }

    if (input.isActionJustPressed('PAUSE')) {
      this.settingsModal.handleKeyDown('Escape');
      return;
    }

    if (input.isActionJustPressed('MOVE_UP')) {
      this.settingsModal.handleKeyDown('ArrowUp');
    } else if (input.isActionJustPressed('MOVE_DOWN')) {
      this.settingsModal.handleKeyDown('ArrowDown');
    } else if (input.isActionJustPressed('MOVE_LEFT')) {
      this.settingsModal.handleKeyDown('ArrowLeft');
    } else if (input.isActionJustPressed('MOVE_RIGHT')) {
      this.settingsModal.handleKeyDown('ArrowRight');
    } else if (input.isActionJustPressed('INTERACT')) {
      this.settingsModal.handleKeyDown('Enter');
    }
  }
}
