/**
 * Mythos: Astra & The Seven Realms
 * Stage 7 Production HUD & Player Experience Subsystem
 *
 * Responsive, accessible in-game heads-up display supporting desktop, tablet,
 * mobile safe areas, fluid health/energy easing, weapon status, contextual
 * interaction prompts, mini-compass, combo meters, and 1-click modal openers.
 */

import { IRenderer } from '../render/CanvasRenderer';
import { Player } from '../entities/Player';
import { DesignTokens } from './design/DesignTokens';
import { AccessibilityManager } from './accessibility/AccessibilityManager';
import { Vector2D } from '../physics/Vector2D';

export interface ProductionHUDOptions {
  onPauseClick?: () => void;
  onCodexClick?: () => void;
  hudScale?: number;
  hudOpacity?: number;
}

export class ProductionHUD {
  private onPauseClick?: () => void;
  private onCodexClick?: () => void;

  // Configurable Display Properties
  public hudScale = 1.0;
  public hudOpacity = 0.9;
  public showContextualPrompt = true;

  // Fluid Eased Values
  public displayedHealth = 100;
  public displayedEnergy = 100;
  private animTimer = 0;

  // Contextual Prompts & Compass
  public activeContextualPrompt: string | null = null;
  public compassTargetAngle: number | null = null; // Radians

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
    if (options?.hudScale) this.hudScale = options.hudScale;
    if (options?.hudOpacity) this.hudOpacity = options.hudOpacity;
  }

  public setContextualPrompt(prompt: string | null): void {
    this.activeContextualPrompt = prompt;
  }

  public setCompassAngle(angle: number | null): void {
    this.compassTargetAngle = angle;
  }

  public update(dt: number, player?: Player): void {
    this.animTimer += dt;

    if (player) {
      // Smooth exponential easing for vitals bars
      this.displayedHealth += (player.health - this.displayedHealth) * Math.min(1.0, dt * 8);
      this.displayedEnergy += (player.energy - this.displayedEnergy) * Math.min(1.0, dt * 10);
    }

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

    // Synchronize displayed values with player
    this.displayedHealth += (player.health - this.displayedHealth) * 0.2;
    this.displayedEnergy += (player.energy - this.displayedEnergy) * 0.25;

    ctx.save();
    ctx.globalAlpha = Math.max(0.4, Math.min(1.0, this.hudOpacity));

    const isMobile = vp.width < 640;
    const panelX = isMobile ? 12 : 20;
    const panelY = isMobile ? 12 : 20;
    const barWidth = isMobile ? 110 : 160;
    const barHeight = 11;

    // -------------------------------------------------------------------------
    // 1. TOP-LEFT PLAYER VITALS CARD
    // -------------------------------------------------------------------------
    const cardWidth = barWidth + 120;
    const cardHeight = 84;

    ctx.fillStyle = isHighContrast ? '#05070D' : 'rgba(10, 16, 28, 0.88)';
    ctx.strokeStyle = isHighContrast ? '#FFFFFF' : DesignTokens.colors.borders.gold;
    ctx.lineWidth = isHighContrast ? 2 : 1.5;
    ctx.beginPath();
    ctx.roundRect(panelX - 8, panelY - 8, cardWidth, cardHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Subtle inner trim line
    if (!isHighContrast) {
      ctx.strokeStyle = 'rgba(255, 183, 3, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(panelX - 4, panelY - 4, cardWidth - 8, cardHeight - 8);
    }

    // Prana (Health)
    ctx.font = `bold 10px ${AccessibilityManager.getInstance().getFontFamily()}`;
    ctx.fillStyle = isHighContrast ? '#00FF00' : DesignTokens.colors.prana.primary;
    ctx.textAlign = 'left';
    ctx.fillText('PRANA', panelX, panelY + 10);

    // Prana Bar Background & Lag Fill
    ctx.fillStyle = '#080C14';
    ctx.fillRect(panelX + 46, panelY, barWidth, barHeight);

    const targetHpRatio = Math.max(0, Math.min(1.0, player.health / player.maxHealth));
    const easeHpRatio = Math.max(0, Math.min(1.0, this.displayedHealth / player.maxHealth));

    // Eased trail
    if (easeHpRatio > targetHpRatio && !isHighContrast) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.fillRect(panelX + 46, panelY, barWidth * easeHpRatio, barHeight);
    }

    // Active Health Fill
    ctx.fillStyle = isHighContrast ? '#00FF00' : DesignTokens.colors.prana.primary;
    ctx.fillRect(panelX + 46, panelY, barWidth * targetHpRatio, barHeight);

    // Health Number
    ctx.font = '9px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(player.health)}/${player.maxHealth}`, panelX + 46 + barWidth - 4, panelY + 9);

    // Agni (Energy)
    ctx.font = `bold 10px ${AccessibilityManager.getInstance().getFontFamily()}`;
    ctx.fillStyle = isHighContrast ? '#FFE600' : DesignTokens.colors.solar.primary;
    ctx.textAlign = 'left';
    ctx.fillText('AGNI', panelX, panelY + 28);

    ctx.fillStyle = '#080C14';
    ctx.fillRect(panelX + 46, panelY + 18, barWidth, barHeight);

    const epRatio = Math.max(0, Math.min(1.0, player.energy / player.maxEnergy));
    ctx.fillStyle = isHighContrast ? '#FFE600' : DesignTokens.colors.solar.primary;
    ctx.fillRect(panelX + 46, panelY + 18, barWidth * epRatio, barHeight);

    ctx.font = '9px monospace';
    ctx.fillStyle = '#080C14';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(player.energy)}/${player.maxEnergy}`, panelX + 46 + barWidth - 4, panelY + 27);

    // Active Weapon Badge Pill (Below Energy Bar)
    const activeWeapon = (player as any).weaponType || (player.equipmentManager ? player.equipmentManager.getActiveWeapon() : 'AgniChakram');
    const isGlaive = String(activeWeapon).toLowerCase().includes('glaive');
    const weaponName = isGlaive ? 'PRANA-GLAIVE' : 'AGNI-CHAKRAM';
    const weaponIcon = isGlaive ? '🗡️' : '☀️';

    const wepX = panelX;
    const wepY = panelY + 36;
    const wepW = barWidth + 46;
    const wepH = 18;

    ctx.fillStyle = isGlaive ? 'rgba(0, 229, 255, 0.15)' : 'rgba(251, 133, 0, 0.18)';
    ctx.strokeStyle = isGlaive ? '#00E5FF' : '#FFB703';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(wepX, wepY, wepW, wepH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = isGlaive ? '#00E5FF' : '#FFD166';
    ctx.textAlign = 'left';
    ctx.fillText(`${weaponIcon} ${weaponName}`, wepX + 6, wepY + 12);

    ctx.font = '8px monospace';
    ctx.fillStyle = '#94A3B8';
    ctx.textAlign = 'right';
    ctx.fillText('[ Q ] SWAP', wepX + wepW - 6, wepY + 12);

    // Shard Counter
    const shardX = panelX + barWidth + 58;
    ctx.fillStyle = isHighContrast ? '#FFE600' : DesignTokens.colors.solar.glow;
    ctx.beginPath();
    ctx.arc(shardX + 6, panelY + 14, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `bold 13px ${AccessibilityManager.getInstance().getFontFamily(true)}`;
    ctx.fillStyle = isHighContrast ? '#FFFFFF' : DesignTokens.colors.solar.primary;
    ctx.textAlign = 'left';
    ctx.fillText(`${player.shardsCollected}/3`, shardX + 18, panelY + 18);

    ctx.font = `9px ${AccessibilityManager.getInstance().getFontFamily()}`;
    ctx.fillStyle = DesignTokens.colors.text.secondary;
    ctx.fillText('SHARDS', shardX + 4, panelY + 36);

    // -------------------------------------------------------------------------
    // 2. COMBO MULTIPLIER BADGE
    // -------------------------------------------------------------------------
    if (this.comboCount > 0) {
      const comboX = panelX - 8;
      const comboY = panelY + cardHeight + 4;
      const comboW = 130;
      const comboH = 22;

      ctx.fillStyle = isHighContrast ? '#111111' : 'rgba(251, 133, 0, 0.3)';
      ctx.strokeStyle = isHighContrast ? '#FFE600' : DesignTokens.colors.solar.primary;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(comboX, comboY, comboW, comboH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.font = `bold 10px ${AccessibilityManager.getInstance().getFontFamily()}`;
      ctx.fillStyle = isHighContrast ? '#FFE600' : DesignTokens.colors.solar.glow;
      ctx.textAlign = 'center';
      ctx.fillText(`${this.comboCount}x COMBO (${this.comboMultiplier.toFixed(1)}x)`, comboX + comboW / 2, comboY + 15);
    }

    // -------------------------------------------------------------------------
    // 3. TOP-CENTER OBJECTIVE BANNER & COMPASS
    // -------------------------------------------------------------------------
    const objBannerW = Math.min(440, vp.width - 240);
    const objX = (vp.width - objBannerW) / 2;
    const objY = 16;
    const objH = 38;

    ctx.fillStyle = isHighContrast ? '#05070D' : 'rgba(10, 16, 28, 0.9)';
    ctx.strokeStyle = isHighContrast ? '#FFE600' : DesignTokens.colors.borders.gold;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(objX, objY, objBannerW, objH, 6);
    ctx.fill();
    ctx.stroke();

    // Compass Arrow Indicator (if target angle set)
    if (this.compassTargetAngle !== null) {
      const compX = objX + 22;
      const compY = objY + objH / 2;
      ctx.save();
      ctx.translate(compX, compY);
      ctx.rotate(this.compassTargetAngle);
      ctx.fillStyle = '#00E5FF';
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(5, 5);
      ctx.lineTo(0, 3);
      ctx.lineTo(-5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    const subtitleSize = AccessibilityManager.getInstance().getSubtitleFontSize(11);
    ctx.font = `bold ${subtitleSize}px ${AccessibilityManager.getInstance().getFontFamily(true)}`;
    ctx.fillStyle = isHighContrast ? '#FFE600' : DesignTokens.colors.solar.glow;
    ctx.textAlign = 'center';
    ctx.fillText(`✦ ${objective.toUpperCase()} ✦`, vp.width / 2, objY + 24);

    // -------------------------------------------------------------------------
    // 4. CONTEXTUAL INTERACTION BADGE (FLOAT BOTTOM-CENTER)
    // -------------------------------------------------------------------------
    if (this.activeContextualPrompt && this.showContextualPrompt) {
      const promptW = Math.min(380, vp.width - 60);
      const promptH = 34;
      const promptX = (vp.width - promptW) / 2;
      const promptY = vp.height - (isMobile ? 110 : 80);

      // Subtle breathing glow
      const breathe = Math.sin(this.animTimer * 4) * 0.15 + 0.85;

      ctx.fillStyle = isHighContrast ? '#05070D' : 'rgba(15, 23, 42, 0.94)';
      ctx.strokeStyle = isHighContrast ? '#00FFFF' : `rgba(255, 183, 3, ${breathe})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(promptX, promptY, promptW, promptH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = `bold 12px "Cinzel", ${AccessibilityManager.getInstance().getFontFamily()}`;
      ctx.fillStyle = isHighContrast ? '#00FFFF' : '#FFD166';
      ctx.textAlign = 'center';
      ctx.fillText(this.activeContextualPrompt, vp.width / 2, promptY + 22);
    }

    // -------------------------------------------------------------------------
    // 5. TOP-RIGHT FAST-ACCESS BUTTONS (CODEX & PAUSE)
    // -------------------------------------------------------------------------
    const rightMargin = isMobile ? 12 : 20;
    this.pauseButtonBounds = {
      x: vp.width - rightMargin - 80,
      y: panelY,
      width: 80,
      height: 32,
    };
    this.codexButtonBounds = {
      x: vp.width - rightMargin - 170,
      y: panelY,
      width: 80,
      height: 32,
    };

    // Codex Button
    ctx.fillStyle = isHighContrast ? '#111111' : 'rgba(18, 24, 36, 0.88)';
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
    ctx.fillStyle = isHighContrast ? '#111111' : 'rgba(18, 24, 36, 0.88)';
    ctx.strokeStyle = isHighContrast ? '#FFE600' : DesignTokens.colors.solar.primary;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(this.pauseButtonBounds.x, this.pauseButtonBounds.y, this.pauseButtonBounds.width, this.pauseButtonBounds.height, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isHighContrast ? '#FFE600' : DesignTokens.colors.solar.glow;
    ctx.fillText('⏸ PAUSE', this.pauseButtonBounds.x + 40, this.pauseButtonBounds.y + 20);

    // -------------------------------------------------------------------------
    // 6. BOTTOM CONTROLS HINT STRIP (DESKTOP)
    // -------------------------------------------------------------------------
    if (!isMobile && !this.activeContextualPrompt) {
      const barW = Math.min(580, vp.width - 40);
      const barBottomY = vp.height - 36;
      const barBottomX = (vp.width - barW) / 2;

      ctx.fillStyle = 'rgba(8, 12, 20, 0.72)';
      ctx.strokeStyle = 'rgba(255, 183, 3, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(barBottomX, barBottomY, barW, 24, 4);
      ctx.fill();
      ctx.stroke();

      ctx.font = `10px ${AccessibilityManager.getInstance().getFontFamily()}`;
      ctx.fillStyle = DesignTokens.colors.text.secondary;
      ctx.textAlign = 'center';
      ctx.fillText(
        '[WASD] Move  •  [SPACE] Dash  •  [J / L-Click] Attack  •  [Q] Swap Weapon  •  [E] Special  •  [C] Guard  •  [ESC] Pause',
        vp.width / 2,
        barBottomY + 16
      );
    }

    ctx.restore();
  }
}
