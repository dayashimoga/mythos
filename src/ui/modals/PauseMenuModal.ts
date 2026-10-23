/**
 * Mythos: Astra & The Seven Realms
 * Stage 6 Production Pause Menu Modal
 *
 * Full in-game pause overlay with navigation to resume, codex,
 * settings modal, realm restart, and main menu.
 */

import { UIModal } from '../components/UIModal';
import { UIButton } from '../components/UIButton';
import { IRenderer } from '../../render/CanvasRenderer';
import { Vector2D } from '../../physics/Vector2D';
import { DesignTokens } from '../design/DesignTokens';
import { AccessibilityManager } from '../accessibility/AccessibilityManager';

export interface PauseMenuCallbacks {
  onResume: () => void;
  onOpenCodex: () => void;
  onOpenSettings: () => void;
  onRestartRealm: () => void;
  onExitToTitle: () => void;
}

export class PauseMenuModal {
  public modal: UIModal;
  private btnResume!: UIButton;
  private btnCodex!: UIButton;
  private btnSettings!: UIButton;
  private btnRestart!: UIButton;
  private btnExit!: UIButton;

  private callbacks: PauseMenuCallbacks;
  public realmName = 'Sanctum of Astra';
  public shardsCount = 0;
  public healthRatio = 1.0;

  constructor(callbacks: PauseMenuCallbacks) {
    this.callbacks = callbacks;

    this.modal = new UIModal({
      title: 'Cosmic Meditation & Pause',
      subtitle: 'Time stilled within the celestial slipstream.',
      width: 480,
      height: 480,
      onClose: () => this.callbacks.onResume(),
    });

    this.buildButtons();
  }

  private buildButtons(): void {
    const btnW = 320;
    const btnH = 40;

    this.btnResume = new UIButton('pause_btn_resume', 0, 0, btnW, btnH, {
      text: 'Resume Journey',
      variant: 'solar',
      icon: '▶',
      hotkey: 'ESC',
      onClick: () => {
        this.close();
      },
    });

    this.btnCodex = new UIButton('pause_btn_codex', 0, 0, btnW, btnH, {
      text: 'Quest Codex & Vedic Lore',
      variant: 'astral',
      icon: '📖',
      hotkey: 'O',
      onClick: () => {
        this.close();
        this.callbacks.onOpenCodex();
      },
    });

    this.btnSettings = new UIButton('pause_btn_settings', 0, 0, btnW, btnH, {
      text: 'Cosmic Settings & Audio',
      variant: 'surface',
      icon: '⚙️',
      onClick: () => {
        this.close();
        this.callbacks.onOpenSettings();
      },
    });

    this.btnRestart = new UIButton('pause_btn_restart', 0, 0, btnW, btnH, {
      text: 'Restart Realm Challenge',
      variant: 'surface',
      icon: '🔄',
      onClick: () => {
        this.close();
        this.callbacks.onRestartRealm();
      },
    });

    this.btnExit = new UIButton('pause_btn_exit', 0, 0, btnW, btnH, {
      text: 'Return to Celestial Title',
      variant: 'tamas',
      icon: '🚪',
      onClick: () => {
        this.close();
        this.callbacks.onExitToTitle();
      },
    });

    this.modal.addChild(this.btnResume);
    this.modal.addChild(this.btnCodex);
    this.modal.addChild(this.btnSettings);
    this.modal.addChild(this.btnRestart);
    this.modal.addChild(this.btnExit);
  }

  public open(viewportWidth: number, viewportHeight: number): void {
    this.modal.open(viewportWidth, viewportHeight);

    const btnX = this.modal.bounds.x + (this.modal.bounds.width - 320) / 2;
    let currentY = this.modal.bounds.y + 140;
    const spacing = 52;

    const buttons = [this.btnResume, this.btnCodex, this.btnSettings, this.btnRestart, this.btnExit];
    for (const btn of buttons) {
      btn.bounds.x = btnX;
      btn.bounds.y = currentY;
      currentY += spacing;
    }
  }

  public close(): void {
    this.modal.close();
  }

  public isOpen(): boolean {
    return this.modal.isOpen;
  }

  public update(dt: number): void {
    if (!this.modal.isOpen) return;
    this.modal.update(dt);
  }

  public handlePointerMove(point: Vector2D): boolean {
    if (!this.modal.isOpen) return false;
    return this.modal.handlePointerMove(point);
  }

  public handlePointerDown(point: Vector2D): boolean {
    if (!this.modal.isOpen) return false;
    return this.modal.handlePointerDown(point);
  }

  public handlePointerUp(point: Vector2D): boolean {
    if (!this.modal.isOpen) return false;
    return this.modal.handlePointerUp(point);
  }

  public handleKeyDown(key: string, shiftKey = false): boolean {
    if (!this.modal.isOpen) return false;

    if (key === 'Escape') {
      this.close();
      return true;
    }

    if (key === 'o' || key === 'O') {
      this.close();
      this.callbacks.onOpenCodex();
      return true;
    }

    return this.modal.handleKeyDown(key, shiftKey);
  }

  public render(renderer: IRenderer): void {
    if (!this.modal.isOpen) return;

    this.modal.render(renderer);

    // Realm info header badge
    const ctx = renderer.getContext();
    const x = this.modal.bounds.x + 24;
    const y = this.modal.bounds.y + 80;

    ctx.save();
    ctx.font = `600 13px ${AccessibilityManager.getInstance().getFontFamily()}`;
    ctx.fillStyle = DesignTokens.colors.solar.glow;
    ctx.textAlign = 'left';
    ctx.fillText(`Realm: ${this.realmName}  ✦  Shards Purified: ${this.shardsCount}/3`, x, y);
    ctx.restore();
  }
}
