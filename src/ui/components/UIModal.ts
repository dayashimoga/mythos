/**
 * Mythos: Astra & The Seven Realms
 * Stage 6 Accessible Modal Container
 *
 * Provides a focus-trapped, backdrop-dimming, glassmorphism modal container
 * with title bar, close action, and responsive child layout.
 */

import { UIComponent } from './UIComponent';
import { UIButton } from './UIButton';
import { IRenderer } from '../../render/CanvasRenderer';
import { Vector2D } from '../../physics/Vector2D';
import { DesignTokens } from '../design/DesignTokens';
import { AccessibilityManager } from '../accessibility/AccessibilityManager';
import { FocusManager } from '../design/FocusManager';

export interface UIModalOptions {
  title: string;
  subtitle?: string;
  width?: number;
  height?: number;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export class UIModal {
  public title: string;
  public subtitle?: string;
  public isOpen = false;
  public bounds = { x: 0, y: 0, width: 640, height: 460 };
  public onClose?: () => void;

  public children: UIComponent[] = [];
  public closeButton?: UIButton;
  private animAlpha = 0;
  private focusManager: FocusManager;

  constructor(options: UIModalOptions) {
    this.title = options.title;
    this.subtitle = options.subtitle;
    this.bounds.width = options.width ?? 640;
    this.bounds.height = options.height ?? 460;
    this.onClose = options.onClose;
    this.focusManager = new FocusManager();

    if (options.showCloseButton !== false) {
      this.closeButton = new UIButton('modal_close_btn', 0, 0, 32, 32, {
        text: '✕',
        variant: 'surface',
        onClick: () => this.close(),
      });
    }
  }

  public addChild(component: UIComponent): void {
    this.children.push(component);
    this.focusManager.register(component);
  }

  public removeChild(componentId: string): void {
    this.children = this.children.filter((c) => c.id !== componentId);
    this.focusManager.unregister(componentId);
  }

  public clearChildren(): void {
    for (const child of this.children) {
      this.focusManager.unregister(child.id);
    }
    this.children = [];
  }

  public open(viewportWidth: number, viewportHeight: number): void {
    this.isOpen = true;
    this.animAlpha = AccessibilityManager.getInstance().getSettings().reducedMotion ? 1 : 0;

    // Center in viewport with safe margin
    const w = Math.min(this.bounds.width, viewportWidth - 40);
    const h = Math.min(this.bounds.height, viewportHeight - 40);
    this.bounds.width = w;
    this.bounds.height = h;
    this.bounds.x = Math.floor((viewportWidth - w) / 2);
    this.bounds.y = Math.floor((viewportHeight - h) / 2);

    if (this.closeButton) {
      this.closeButton.bounds.x = this.bounds.x + this.bounds.width - 42;
      this.closeButton.bounds.y = this.bounds.y + 14;
    }

    if (this.children.length > 0) {
      this.focusManager.focusFirst();
    }

    AccessibilityManager.getInstance().announce(`Modal opened: ${this.title}`);
  }

  public close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    AccessibilityManager.getInstance().announce(`Modal closed: ${this.title}`);
    if (this.onClose) {
      this.onClose();
    }
  }

  public update(dt: number): void {
    if (!this.isOpen) return;

    if (this.animAlpha < 1) {
      this.animAlpha = Math.min(1, this.animAlpha + dt * 6);
    }

    if (this.closeButton) {
      this.closeButton.update(dt);
    }

    for (const child of this.children) {
      if (child.isVisible) {
        child.update(dt);
      }
    }
  }

  public handlePointerMove(point: Vector2D): boolean {
    if (!this.isOpen) return false;

    if (this.closeButton) {
      this.closeButton.updateHover(point);
    }

    for (const child of this.children) {
      if (child.isVisible) {
        child.updateHover(point);
      }
    }
    return true; // Backdrop catches all pointer events
  }

  public handlePointerDown(point: Vector2D): boolean {
    if (!this.isOpen) return false;

    if (this.closeButton && this.closeButton.containsPoint(point)) {
      this.closeButton.setPressed(true);
      return true;
    }

    for (const child of this.children) {
      if (child.isVisible && child.containsPoint(point)) {
        child.setPressed(true);
        this.focusManager.focus(child.id);
        return true;
      }
    }

    // Clicking outside modal content area closes modal if clicked on dark backdrop
    const insideModal =
      point.x >= this.bounds.x &&
      point.x <= this.bounds.x + this.bounds.width &&
      point.y >= this.bounds.y &&
      point.y <= this.bounds.y + this.bounds.height;

    if (!insideModal) {
      this.close();
    }

    return true;
  }

  public handlePointerUp(point: Vector2D): boolean {
    if (!this.isOpen) return false;

    if (this.closeButton) {
      if (this.closeButton.isPressed && this.closeButton.containsPoint(point)) {
        this.closeButton.onActivate?.();
      }
      this.closeButton.setPressed(false);
    }

    for (const child of this.children) {
      if (child.isVisible) {
        if (child.isPressed && child.containsPoint(point)) {
          child.onActivate?.();
        }
        child.setPressed(false);
      }
    }

    return true;
  }

  public handleKeyDown(key: string, shiftKey = false): boolean {
    if (!this.isOpen) return false;

    if (key === 'Escape') {
      this.close();
      return true;
    }

    if (key === 'Tab') {
      if (shiftKey) {
        this.focusManager.focusPrevious();
      } else {
        this.focusManager.focusNext();
      }
      return true;
    }

    if (key === 'ArrowUp' || key === 'ArrowLeft') {
      this.focusManager.focusPrevious();
      return true;
    }

    if (key === 'ArrowDown' || key === 'ArrowRight') {
      this.focusManager.focusNext();
      return true;
    }

    if (key === 'Enter' || key === ' ') {
      const focused = this.focusManager.getCurrentFocus();
      if (focused && focused.onActivate) {
        focused.onActivate();
        return true;
      }
    }

    return true; // Modal traps all keyboard focus
  }

  public render(renderer: IRenderer): void {
    if (!this.isOpen) return;

    const ctx = renderer.getContext();
    const viewport = renderer.getViewport();
    const a11y = AccessibilityManager.getInstance().getSettings();
    const isHighContrast = a11y.highContrast;

    ctx.save();
    ctx.globalAlpha = this.animAlpha;

    // Dim Backdrop
    ctx.fillStyle = isHighContrast ? 'rgba(0, 0, 0, 0.85)' : 'rgba(5, 8, 15, 0.75)';
    ctx.fillRect(viewport.x, viewport.y, viewport.width, viewport.height);

    const { x, y, width, height } = this.bounds;

    // Modal Card Shadow
    if (!a11y.reducedMotion) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 8;
    }

    // Modal Background
    ctx.fillStyle = isHighContrast ? '#0B0F19' : DesignTokens.colors.bgSurface;
    ctx.strokeStyle = isHighContrast ? '#FFFFFF' : DesignTokens.colors.borders.gold;
    ctx.lineWidth = isHighContrast ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 12);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Header separator line
    ctx.strokeStyle = isHighContrast ? '#555555' : DesignTokens.colors.borders.subtleGold;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 60);
    ctx.lineTo(x + width - 20, y + 60);
    ctx.stroke();

    // Title
    ctx.font = `bold 20px ${AccessibilityManager.getInstance().getFontFamily(true)}`;
    ctx.fillStyle = isHighContrast ? '#FFE600' : DesignTokens.colors.solar.glow;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.title.toUpperCase(), x + 24, y + 34);

    // Subtitle
    if (this.subtitle) {
      ctx.font = `12px ${AccessibilityManager.getInstance().getFontFamily()}`;
      ctx.fillStyle = DesignTokens.colors.text.secondary;
      ctx.fillText(this.subtitle, x + 24, y + 50);
    }

    // Close Button
    if (this.closeButton) {
      this.closeButton.render(renderer);
    }

    // Children Components
    for (const child of this.children) {
      if (child.isVisible) {
        child.render(renderer);
      }
    }

    ctx.restore();
  }
}
