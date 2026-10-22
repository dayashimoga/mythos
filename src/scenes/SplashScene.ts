import { IScene } from './SceneManager';
import { IGameEngine } from '../engine/Engine';
import { IRenderer } from '../render/CanvasRenderer';
import { InputManager } from '../input/InputManager';
import { SacredGeometry } from '../render/SacredGeometry';

export class SplashScene implements IScene {
  public readonly id = 'SplashScene';
  private engine!: IGameEngine;
  private animTimer = 0;
  private pulse = 0;

  public onEnter(engine: IGameEngine): void {
    this.engine = engine;
    this.animTimer = 0;
  }

  public onExit(): void {}

  public update(dt: number): void {
    this.animTimer += dt;
    this.pulse = Math.sin(this.animTimer * 2) * 0.15;
  }

  public render(renderer: IRenderer): void {
    const vp = renderer.getViewport();
    const ctx = renderer.getContext();
    renderer.clear('#080C14');

    const cx = vp.width / 2;
    const cy = vp.height / 2;

    // Ambient background cosmic glow
    const grad = ctx.createRadialGradient(cx, cy - 40, 40, cx, cy - 40, 420);
    grad.addColorStop(0, 'rgba(255, 183, 3, 0.12)');
    grad.addColorStop(0.5, 'rgba(0, 229, 255, 0.05)');
    grad.addColorStop(1, 'rgba(8, 12, 20, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, vp.width, vp.height);

    // Rotating Background Sacred Mandalas
    const radiusMod = 1 + this.pulse;
    SacredGeometry.drawMandala(ctx, cx, cy - 60, 150 * radiusMod, 16, this.animTimer * 0.2, 'rgba(255, 183, 3, 0.25)', 1.5);
    SacredGeometry.drawMandala(ctx, cx, cy - 60, 100 * radiusMod, 12, -this.animTimer * 0.35, 'rgba(0, 229, 255, 0.3)', 1.5);
    SacredGeometry.drawSriYantraCentral(ctx, cx, cy - 60, 50 * radiusMod, '#FFD166', 0.85);

    // Title Typography
    renderer.drawText(
      'M Y T H O S',
      cx,
      cy + 90,
      'bold 42px "Cinzel", Georgia, serif',
      '#FFB703',
      'center'
    );

    renderer.drawText(
      'ASTRA & THE SEVEN REALMS',
      cx,
      cy + 124,
      '600 16px "Cinzel", Georgia, serif',
      '#FFD166',
      'center'
    );

    renderer.drawText(
      'Stage 0 — Production Engine & Sanctum Calibration',
      cx,
      cy + 150,
      '12px sans-serif',
      '#A0AAB8',
      'center'
    );

    // Action Prompts / Buttons
    const btnWidth = 280;
    const btnHeight = 44;
    const btnX = cx - btnWidth / 2;
    const btnY = cy + 180;

    ctx.fillStyle = 'rgba(251, 133, 0, 0.85)';
    ctx.strokeStyle = '#FFD166';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 8);
    ctx.fill();
    ctx.stroke();

    renderer.drawText(
      'ENTER THE SANCTUM [ SPACE / CLICK ]',
      cx,
      btnY + 28,
      'bold 13px "Cinzel", sans-serif',
      '#080C14',
      'center'
    );

    // Stage 1 Vertical Slice Button
    const btn2Y = cy + 235;
    ctx.fillStyle = 'rgba(0, 229, 255, 0.85)';
    ctx.strokeStyle = '#FFD166';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(btnX, btn2Y, btnWidth, 38, 6);
    ctx.fill();
    ctx.stroke();

    renderer.drawText(
      'STAGE 1: BHUMI TEMPLE [ B / 🗡️ ]',
      cx,
      btn2Y + 24,
      'bold 12px "Cinzel", sans-serif',
      '#080C14',
      'center'
    );

    // Settings Prompt
    renderer.drawText(
      'Press [ P ] for Settings  •  [ F3 ] Diagnostics Overlay',
      cx,
      cy + 295,
      '11px sans-serif',
      '#718096',
      'center'
    );
  }

  public handleInput(input: InputManager): void {
    if (input.isActionJustPressed('MELEE_ATTACK')) {
      this.engine.getAudio().playShardPickup();
      this.engine.getSceneManager().switchTo('BhumiTempleScene');
    } else if (input.isActionJustPressed('DASH') || input.isActionJustPressed('ATTACK')) {
      this.engine.getAudio().playShardPickup();
      this.engine.getSceneManager().switchTo('StoryScene');
    } else if (input.isActionJustPressed('PAUSE')) {
      this.engine.getSceneManager().switchTo('SettingsScene');
    }
  }
}
