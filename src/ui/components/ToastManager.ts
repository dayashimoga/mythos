/**
 * Mythos: Astra & The Seven Realms
 * Stage 6 Accessible Toast Notification System
 *
 * Provides non-intrusive, auto-dismissing, animated feedback toasts
 * with accessible screen-reader live announcements.
 */

import { IRenderer } from '../../render/CanvasRenderer';
import { DesignTokens } from '../design/DesignTokens';
import { AccessibilityManager } from '../accessibility/AccessibilityManager';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number; // in seconds
  elapsed: number;
  alpha: number;
}

export class ToastManager {
  private static instance: ToastManager;
  private toasts: ToastItem[] = [];
  private nextId = 1;

  public static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  public show(message: string, type: ToastType = 'info', duration = 3.0): void {
    const item: ToastItem = {
      id: `toast_${this.nextId++}`,
      message,
      type,
      duration,
      elapsed: 0,
      alpha: 0,
    };

    // Keep max 3 toasts visible at once
    if (this.toasts.length >= 3) {
      this.toasts.shift();
    }
    this.toasts.push(item);

    // Assistive announcement
    const priority = type === 'error' ? 'assertive' : 'polite';
    AccessibilityManager.getInstance().announce(message, priority);
  }

  public getActiveToasts(): ReadonlyArray<ToastItem> {
    return this.toasts;
  }

  public clear(): void {
    this.toasts = [];
  }

  public update(dt: number): void {
    const reducedMotion = AccessibilityManager.getInstance().getSettings().reducedMotion;

    for (let i = this.toasts.length - 1; i >= 0; i--) {
      const toast = this.toasts[i];
      toast.elapsed += dt;

      // Enter animation
      if (toast.elapsed < 0.25) {
        toast.alpha = reducedMotion ? 1 : Math.min(1, toast.elapsed / 0.25);
      } else if (toast.elapsed > toast.duration - 0.25) {
        // Exit animation
        const remaining = toast.duration - toast.elapsed;
        toast.alpha = reducedMotion ? 0 : Math.max(0, remaining / 0.25);
      } else {
        toast.alpha = 1;
      }

      if (toast.elapsed >= toast.duration) {
        this.toasts.splice(i, 1);
      }
    }
  }

  public render(renderer: IRenderer): void {
    if (this.toasts.length === 0) return;

    const ctx = renderer.getContext();
    const viewport = renderer.getViewport();
    const a11y = AccessibilityManager.getInstance().getSettings();
    const isHighContrast = a11y.highContrast;

    const toastW = 320;
    const toastH = 44;
    const startX = viewport.x + viewport.width - toastW - 20;
    let currentY = viewport.y + 24;

    ctx.save();

    for (const toast of this.toasts) {
      ctx.globalAlpha = toast.alpha;

      let border = DesignTokens.colors.borders.gold;
      let bg = DesignTokens.colors.bgSurface;
      let icon = 'ℹ️';

      switch (toast.type) {
        case 'success':
          border = isHighContrast ? '#00FF00' : DesignTokens.colors.prana.primary;
          icon = '✓';
          break;
        case 'warning':
          border = isHighContrast ? '#FFFF00' : DesignTokens.colors.solar.primary;
          icon = '⚠';
          break;
        case 'error':
          border = isHighContrast ? '#FF0000' : DesignTokens.colors.tamas.primary;
          icon = '✕';
          break;
        case 'info':
        default:
          border = isHighContrast ? '#FFFFFF' : DesignTokens.colors.astral.primary;
          icon = '✦';
          break;
      }

      // Backdrop card
      ctx.fillStyle = isHighContrast ? '#05070D' : bg;
      ctx.strokeStyle = border;
      ctx.lineWidth = isHighContrast ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.roundRect(startX, currentY, toastW, toastH, 6);
      ctx.fill();
      ctx.stroke();

      // Icon
      ctx.font = `bold 14px ${AccessibilityManager.getInstance().getFontFamily()}`;
      ctx.fillStyle = border;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, startX + 22, currentY + toastH / 2);

      // Message
      ctx.font = `500 12px ${AccessibilityManager.getInstance().getFontFamily()}`;
      ctx.fillStyle = DesignTokens.colors.text.primary;
      ctx.textAlign = 'left';
      ctx.fillText(toast.message, startX + 42, currentY + toastH / 2);

      currentY += toastH + 10;
    }

    ctx.restore();
  }
}
