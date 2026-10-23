/**
 * Mythos: Astra & The Seven Realms
 * Stage 6 Production HUD Subsystem
 *
 * Responsive, accessible in-game heads-up display supporting desktop, tablet,
 * and mobile safe areas, touch overlays, combo meters, and 1-click modal openers.
 */

import { IRenderer } from '../render/CanvasRenderer';
import { Player } from '../entities/Player';
import { DesignTokens } from './design/DesignTokens';
import { AccessibilityManager } from './accessibility/AccessibilityManager';
import { Vector2D } from '../physics/Vector2D';

export interface ProductionHUDOptions {
  onPauseClick?: () => void;
  onCodexClick?: () => void;
}

export class ProductionHUD {
  private onPauseClick?: () => void;
  private onCodexClick?: () => void;

  // Button Bounds for touch/mouse 1-click access
  public pauseButtonBounds = { x: -999, y: -999, width: 90, height: 32 };
  public codexButtonBounds = { x: -999, y: -999, width: 90, height: 32 };

  // Combo state
  public comboCount = 0;
  public comboMultiplier = 1.0;
  public comboTimer = 0;

  // Touch controls support
  public showTouchControls = false;
  public touchStickCenter = { x: 90, y: 0 };
  public touchStickRadius = 50;

  constructor(options?: ProductionHUDOptions) {
    this.onPauseClick = options?.onPauseClick;
    this.onCodexClick = options?.onCodexClick;
  }

  public update(dt: number): void {
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.comboMultiplier = 1.0;
      }
    }
  }

  public registerHit(_damage?: number): void {
    this.comboCount++;
    this.comboMultiplier = Math.min(3.0, 1.0 + Math.floor(this.comboCount / 3) * 0.25);
    this.comboTimer = 3.5;
  }

  public resetCombo(): void {
    this.comboCount = 0;
    this.comboMultiplier = 1.0;
    this.comboTimer = 0;
  }

  public handlePointerDown(point: Vector2D): boolean {
    if (point.x <= 0 && point.y <= 0) return false;
    if (this.contains(this.pauseButtonBounds, point)) {
      this.onPauseClick?.();
      return true;
    }
    if (this.contains(this.codexButtonBounds, point)) {
      this.onCodexClick?.();
      return true;
    }
    return false;
  }

  private contains(rect: { x: number; y: number; width: number; height: number }, pt: Vector2D): boolean {
    return (
      pt.x >= rect.x &&
      pt.x <= rect.x + rect.width &&
      pt.y >= rect.y &&
      pt.y <= rect.y + rect.height
    );
  }

  public render(renderer: IRenderer, player: Player, objective: string): void {
    const ctx = renderer.getContext();
    const vp = renderer.getViewport();
    const a11y = AccessibilityManager.getInstance().getSettings();
    const isHighContrast = a11y.highContrast;

    ctx.save();

    // 1. Top-Left Player Vitals Panel
    const isMobile = vp.width < 640;
    const panelX = 20;
    const panelY = 20;
    const barWidth = isMobile ? 120 : 180;
    const barHeight = 12;

    // Vitals Glass Card
    ctx.fillStyle = isHighContrast ? '#05070D' : 'rgba(12, 18, 30, 0.85)';
    ctx.strokeStyle = isHighContrast ? '#FFFFFF' : DesignTokens.colors.borders.gold;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(panelX - 10, panelY - 10, barWidth + 140, 76, 8);
    ctx.fill();
    ctx.stroke();

    // Prana (Health)
    ctx.font = `bold 10px ${AccessibilityManager.getInstance().getFontFamily()}`;
    ctx.fillStyle = isHighContrast ? '#00FF00' : DesignTokens.colors.prana.primary;
    ctx.textAlign = 'left';
    ctx.fillText('PRANA', panelX, panelY + 10);

    ctx.fillStyle = '#080C14';
    ctx.fillRect(panelX + 50, panelY, barWidth, barHeight);
    const hpRatio = Math.max(0, player.health / player.maxHealth);
    ctx.fillStyle = isHighContrast ? '#00FF00' : DesignTokens.colors.prana.primary;
    ctx.fillRect(panelX + 50, panelY, barWidth * hpRatio, barHeight);

    // Agni (Energy)
    ctx.fillStyle = isHighContrast ? '#FFE600' : DesignTokens.colors.solar.primary;
    ctx.fillText('AGNI', panelX, panelY + 32);

    ctx.fillStyle = '#080C14';
    ctx.fillRect(panelX + 50, panelY + 22, barWidth, barHeight);
    const epRatio = Math.max(0, player.energy / player.maxEnergy);
    ctx.fillStyle = isHighContrast ? '#FFE600' : DesignTokens.colors.solar.primary;
    ctx.fillRect(panelX + 50, panelY + 22, barWidth * epRatio, barHeight);

    // Shard Counter
    const shardX = panelX + barWidth + 65;
    ctx.fillStyle = isHighContrast ? '#FFE600' : DesignTokens.colors.solar.glow;
    ctx.beginPath();
    ctx.arc(shardX, panelY + 16, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `bold 14px ${AccessibilityManager.getInstance().getFontFamily(true)}`;
    ctx.fillStyle = isHighContrast ? '#FFFFFF' : DesignTokens.colors.solar.primary;
    ctx.fillText(`${player.shardsCollected}/3`, shardX + 16, panelY + 21);

    ctx.font = `9px ${AccessibilityManager.getInstance().getFontFamily()}`;
    ctx.fillStyle = DesignTokens.colors.text.secondary;
    ctx.fillText('SHARDS', shardX - 4, panelY + 42);

    // 2. Combo Multiplier Badge (if combo active)
    if (this.comboCount > 0) {
      const comboX = panelX - 10;
      const comboY = panelY + 74;
      const comboW = 120;
      const comboH = 24;

      ctx.fillStyle = isHighContrast ? '#111111' : 'rgba(251, 133, 0, 0.25)';
      ctx.strokeStyle = isHighContrast ? '#FFE600' : DesignTokens.colors.solar.primary;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(comboX, comboY, comboW, comboH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.font = `bold 11px ${AccessibilityManager.getInstance().getFontFamily()}`;
      ctx.fillStyle = isHighContrast ? '#FFE600' : DesignTokens.colors.solar.glow;
      ctx.textAlign = 'center';
      ctx.fillText(`${this.comboCount}x COMBO (${this.comboMultiplier.toFixed(1)}x)`, comboX + comboW / 2, comboY + 16);
    }

    // 3. Top-Center Objective Banner
    const objBannerW = Math.min(420, vp.width - 240);
    const objX = (vp.width - objBannerW) / 2;
    const objY = 20;

    ctx.fillStyle = isHighContrast ? '#05070D' : 'rgba(12, 18, 30, 0.85)';
    ctx.strokeStyle = isHighContrast ? '#FFE600' : DesignTokens.colors.borders.gold;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(objX, objY, objBannerW, 36, 6);
    ctx.fill();
    ctx.stroke();

    const subtitleSize = AccessibilityManager.getInstance().getSubtitleFontSize(12);
    ctx.font = `bold ${subtitleSize}px ${AccessibilityManager.getInstance().getFontFamily(true)}`;
    ctx.fillStyle = isHighContrast ? '#FFE600' : DesignTokens.colors.solar.glow;
    ctx.textAlign = 'center';
    ctx.fillText(`✦ ${objective.toUpperCase()} ✦`, vp.width / 2, objY + 23);

    // 4. Top-Right Fast-Access Action Buttons (Pause & Codex)
    const rightMargin = 20;
    this.pauseButtonBounds = {
      x: vp.width - rightMargin - 80,
      y: 20,
      width: 80,
      height: 32,
    };
    this.codexButtonBounds = {
      x: vp.width - rightMargin - 170,
      y: 20,
      width: 80,
      height: 32,
    };

    // Codex Button
    ctx.fillStyle = isHighContrast ? '#111111' : 'rgba(18, 24, 36, 0.85)';
    ctx.strokeStyle = isHighContrast ? '#00FFFF' : DesignTokens.colors.astral.primary;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(this.codexButtonBounds.x, this.codexButtonBounds.y, this.codexButtonBounds.width, this.codexButtonBounds.height, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `600 11px ${AccessibilityManager.getInstance().getFontFamily()}`;
    ctx.fillStyle = isHighContrast ? '#00FFFF' : DesignTokens.colors.astral.glow;
    ctx.textAlign = 'center';
    ctx.fillText('📖 CODEX', this.codexButtonBounds.x + 40, this.codexButtonBounds.y + 20);

    // Pause Button
    ctx.fillStyle = isHighContrast ? '#111111' : 'rgba(18, 24, 36, 0.85)';
    ctx.strokeStyle = isHighContrast ? '#FFE600' : DesignTokens.colors.solar.primary;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(this.pauseButtonBounds.x, this.pauseButtonBounds.y, this.pauseButtonBounds.width, this.pauseButtonBounds.height, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isHighContrast ? '#FFE600' : DesignTokens.colors.solar.glow;
    ctx.fillText('⏸ PAUSE', this.pauseButtonBounds.x + 40, this.pauseButtonBounds.y + 20);

    // 5. Bottom Controls Bar (Keyboard / Gamepad cues)
    if (!isMobile) {
      const barW = Math.min(540, vp.width - 40);
      const barBottomY = vp.height - 44;
      const barBottomX = (vp.width - barW) / 2;

      ctx.fillStyle = 'rgba(8, 12, 20, 0.7)';
      ctx.strokeStyle = 'rgba(255, 183, 3, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(barBottomX, barBottomY, barW, 28, 4);
      ctx.fill();
      ctx.stroke();

      ctx.font = `11px ${AccessibilityManager.getInstance().getFontFamily()}`;
      ctx.fillStyle = DesignTokens.colors.text.secondary;
      ctx.textAlign = 'center';
      ctx.fillText(
        '[WASD] Move  •  [SPACE] Agni-Dash  •  [L-CLICK] Surya-Burst  •  [E] Attune / Consecrate  •  [O] Codex  •  [ESC] Pause',
        vp.width / 2,
        barBottomY + 18
      );
    }

    ctx.restore();
  }
}
