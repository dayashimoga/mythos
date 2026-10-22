import { IScene } from './SceneManager';
import { IGameEngine } from '../engine/Engine';
import { IRenderer } from '../render/CanvasRenderer';
import { InputManager } from '../input/InputManager';
import { SaveGameManager } from '../state/SaveGameManager';

export class SettingsScene implements IScene {
  public readonly id = 'SettingsScene';
  private engine!: IGameEngine;
  private statusMessage = '';
  private statusTimer = 0;

  public onEnter(engine: IGameEngine): void {
    this.engine = engine;
    this.statusMessage = '';
  }

  public onExit(): void {}

  public update(dt: number): void {
    if (this.statusTimer > 0) {
      this.statusTimer -= dt;
      if (this.statusTimer <= 0) {
        this.statusMessage = '';
      }
    }
  }

  public render(renderer: IRenderer): void {
    const vp = renderer.getViewport();
    const ctx = renderer.getContext();
    const cx = vp.width / 2;
    const cy = vp.height / 2;

    renderer.clear('#080C14');

    // Container Panel
    const panelWidth = 520;
    const panelHeight = 440;
    const panelX = cx - panelWidth / 2;
    const panelY = cy - panelHeight / 2;

    ctx.fillStyle = '#121824';
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
    ctx.fill();
    ctx.stroke();

    // Title
    renderer.drawText(
      'ENGINE & COSMIC SETTINGS',
      cx,
      panelY + 40,
      'bold 22px "Cinzel", Georgia, serif',
      '#FFB703',
      'center'
    );

    // Audio Mute Status
    const isMuted = this.engine.getAudio().isMuted();
    renderer.drawText(
      `Audio Synthesizer: [ ${isMuted ? 'MUTED' : 'ACTIVE / 100%'} ] (Press M)`,
      cx,
      panelY + 90,
      '14px sans-serif',
      isMuted ? '#EF476F' : '#06D6A0',
      'center'
    );

    // Controls Reference Card
    ctx.fillStyle = '#080C14';
    ctx.beginPath();
    ctx.roundRect(panelX + 30, panelY + 120, panelWidth - 60, 160, 6);
    ctx.fill();

    renderer.drawText('CONTROLS SCHEME', cx, panelY + 145, 'bold 12px "Cinzel", sans-serif', '#FFD166', 'center');
    renderer.drawText('Movement: W, A, S, D or Arrow Keys / Virtual Stick', cx, panelY + 175, '12px sans-serif', '#F8F9FA', 'center');
    renderer.drawText('Agni-Dash: Space or Left Shift (i-frames)', cx, panelY + 200, '12px sans-serif', '#F8F9FA', 'center');
    renderer.drawText('Surya-Burst: Mouse Left Click or J / X', cx, panelY + 225, '12px sans-serif', '#F8F9FA', 'center');
    renderer.drawText('Attune / Interact: E or F Key', cx, panelY + 250, '12px sans-serif', '#F8F9FA', 'center');

    // Clear Data Option
    renderer.drawText('Press [ C ] to Reset Saved State', cx, panelY + 310, '13px sans-serif', '#EF476F', 'center');

    // Status Message if any
    if (this.statusMessage) {
      renderer.drawText(this.statusMessage, cx, panelY + 345, 'bold 12px sans-serif', '#06D6A0', 'center');
    }

    // Return to Title
    renderer.drawText('Press [ ESC / Space ] to Return to Title', cx, panelY + 395, 'bold 13px "Cinzel", sans-serif', '#FFB703', 'center');
  }

  public handleInput(input: InputManager): void {
    if (input.isActionJustPressed('PAUSE') || input.isActionJustPressed('DASH')) {
      this.engine.getSceneManager().switchTo('SplashScene');
      return;
    }

    // Mute toggle
    if (input.isActionJustPressed('ATTACK')) {
      // Allow click return
    }

    // Key M
    if (input.isActionJustPressed('TOGGLE_COLLIDERS')) {
      // Toggle sound
      const current = this.engine.getAudio().isMuted();
      this.engine.getAudio().setMuted(!current);
      this.statusMessage = !current ? 'Audio Muted' : 'Audio Unmuted';
      this.statusTimer = 2.0;
    }

    // Clear state
    if (input.isActionJustPressed('INTERACT')) {
      SaveGameManager.reset();
      this.statusMessage = 'Saved Game State Purged';
      this.statusTimer = 2.0;
    }
  }
}
