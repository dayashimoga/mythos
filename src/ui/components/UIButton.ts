/**
 * Mythos: Astra & The Seven Realms
 * Stage 6 Reusable Accessible UI Button
 */

import { UIComponent } from './UIComponent';
import { IRenderer } from '../../render/CanvasRenderer';
import { DesignTokens } from '../design/DesignTokens';
import { AccessibilityManager } from '../accessibility/AccessibilityManager';

export type ButtonVariant = 'solar' | 'astral' | 'prana' | 'tamas' | 'surface';

export interface ButtonOptions {
  text: string;
  variant?: ButtonVariant;
  icon?: string;
  hotkey?: string;
  tabIndex?: number;
  isDisabled?: boolean;
  onClick?: () => void;
}

export class UIButton extends UIComponent {
  public text: string;
  public variant: ButtonVariant;
  public icon?: string;
  public hotkey?: string;
  public onClick?: () => void;

  private pulse = 0;

  constructor(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    options: ButtonOptions
  ) {
    super(id, x, y, width, height, options.tabIndex ?? 0);
    this.text = options.text;
    this.variant = options.variant || 'solar';
    this.icon = options.icon;
    this.hotkey = options.hotkey;
    this.isDisabled = options.isDisabled ?? false;
    this.onClick = options.onClick;

    this.onActivate = () => {
      if (!this.isDisabled && this.onClick) {
        this.onClick();
      }
    };
  }

  public update(dt: number): void {
    if (this.isHovered || this.isFocused) {
      this.pulse = (this.pulse + dt * 4) % (Math.PI * 2);
    } else {
      this.pulse = 0;
    }
  }

  public render(renderer: IRenderer): void {
    if (!this.isVisible) return;

    const ctx = renderer.getContext();
    const a11y = AccessibilityManager.getInstance().getSettings();
    const isHighContrast = a11y.highContrast;
    const { x, y, width, height } = this.bounds;

    ctx.save();

    // Determine colors based on state & variant
    let bg = DesignTokens.colors.bgSurface;
    let border = DesignTokens.colors.borders.gold;
    let textColor = DesignTokens.colors.text.primary;
    let glow = 'rgba(255, 183, 3, 0.3)';

    if (this.isDisabled) {
      bg = 'rgba(18, 24, 36, 0.4)';
      border = 'rgba(148, 163, 184, 0.2)';
      textColor = DesignTokens.colors.text.muted;
    } else {
      switch (this.variant) {
        case 'solar':
          bg = this.isPressed
            ? DesignTokens.colors.solar.secondary
            : this.isHovered || this.isFocused
            ? DesignTokens.colors.solar.primary
            : 'rgba(251, 133, 0, 0.85)';
          border = DesignTokens.colors.solar.glow;
          textColor = DesignTokens.colors.solar.contrastText;
          glow = 'rgba(255, 183, 3, 0.6)';
          break;
        case 'astral':
          bg = this.isPressed
            ? DesignTokens.colors.astral.secondary
            : this.isHovered || this.isFocused
            ? DesignTokens.colors.astral.primary
            : 'rgba(2, 132, 199, 0.85)';
          border = DesignTokens.colors.astral.glow;
          textColor = '#FFFFFF';
          glow = 'rgba(0, 229, 255, 0.6)';
          break;
        case 'prana':
          bg = this.isPressed
            ? DesignTokens.colors.prana.secondary
            : this.isHovered || this.isFocused
            ? DesignTokens.colors.prana.primary
            : 'rgba(6, 214, 160, 0.85)';
          border = DesignTokens.colors.prana.glow;
          textColor = DesignTokens.colors.prana.contrastText;
          glow = 'rgba(6, 214, 160, 0.6)';
          break;
        case 'tamas':
          bg = this.isPressed
            ? DesignTokens.colors.tamas.primary
            : this.isHovered || this.isFocused
            ? DesignTokens.colors.tamas.secondary
            : 'rgba(220, 38, 38, 0.85)';
          border = DesignTokens.colors.tamas.glow;
          textColor = '#FFFFFF';
          glow = 'rgba(239, 68, 68, 0.6)';
          break;
        case 'surface':
        default:
          bg = this.isPressed
            ? DesignTokens.colors.bgElevated
            : this.isHovered || this.isFocused
            ? 'rgba(30, 41, 59, 0.95)'
            : 'rgba(18, 24, 36, 0.85)';
          border = this.isHovered || this.isFocused
            ? DesignTokens.colors.solar.primary
            : DesignTokens.colors.borders.subtleGold;
          textColor = DesignTokens.colors.text.primary;
          glow = 'rgba(255, 183, 3, 0.4)';
          break;
      }
    }

    if (isHighContrast) {
      if (this.isDisabled) {
        bg = '#111111';
        border = '#555555';
        textColor = '#888888';
      } else {
        border = '#FFFFFF';
        if (this.isHovered || this.isFocused) {
          bg = '#FFE600';
          textColor = '#000000';
        }
      }
    }

    // Outer Focus Ring
    if (this.isFocused && !this.isDisabled) {
      ctx.strokeStyle = isHighContrast ? '#00FFFF' : DesignTokens.colors.focus.outline;
      ctx.lineWidth = DesignTokens.colors.focus.width;
      ctx.beginPath();
      ctx.roundRect(x - 3, y - 3, width + 6, height + 6, 8);
      ctx.stroke();
    }

    // Glow Effect
    if ((this.isHovered || this.isFocused) && !this.isDisabled && !a11y.reducedMotion) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 12 + Math.sin(this.pulse) * 4;
    }

    // Button Body
    ctx.fillStyle = bg;
    ctx.strokeStyle = border;
    ctx.lineWidth = isHighContrast ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 6);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0; // Reset shadow

    // Text & Icons
    const font = `${this.variant === 'solar' || this.variant === 'tamas' ? 'bold' : '600'} 12px ${AccessibilityManager.getInstance().getFontFamily(true)}`;
    ctx.font = font;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let label = this.text;
    if (this.icon) {
      label = `${this.icon}  ${label}`;
    }
    if (this.hotkey) {
      label = `${label}  [ ${this.hotkey} ]`;
    }

    ctx.fillText(label, x + width / 2, y + height / 2);

    ctx.restore();
  }
}
