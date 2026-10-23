/**
 * Mythos: Astra & The Seven Realms
 * Stage 6 Reusable Accessible UI Toggle Switch
 */

import { UIComponent } from './UIComponent';
import { IRenderer } from '../../render/CanvasRenderer';
import { DesignTokens } from '../design/DesignTokens';
import { AccessibilityManager } from '../accessibility/AccessibilityManager';

export interface ToggleOptions {
  label: string;
  checked?: boolean;
  value?: boolean;
  tabIndex?: number;
  isDisabled?: boolean;
  onToggle?: (checked: boolean) => void;
  onChange?: (checked: boolean) => void;
}

export class UIToggle extends UIComponent {
  public label: string;
  public isChecked: boolean;
  public onToggle?: (checked: boolean) => void;

  private animProgress = 0; // 0 (off) to 1 (on)

  constructor(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    options: ToggleOptions
  ) {
    super(id, x, y, width, height, options.tabIndex ?? 0);
    this.label = options.label;
    this.isChecked = options.checked ?? options.value ?? false;
    this.animProgress = this.isChecked ? 1 : 0;
    this.isDisabled = options.isDisabled ?? false;
    this.onToggle = options.onToggle ?? options.onChange;

    this.onActivate = () => {
      this.toggle();
    };
  }

  public toggle(): void {
    if (this.isDisabled || !this.isVisible) return;
    this.isChecked = !this.isChecked;
    if (this.onToggle) {
      this.onToggle(this.isChecked);
    }
  }

  public setChecked(checked: boolean): void {
    if (this.isChecked !== checked) {
      this.isChecked = checked;
      if (this.onToggle) this.onToggle(this.isChecked);
    }
  }

  public setValue(checked: boolean): void {
    this.setChecked(checked);
  }

  public update(dt: number): void {
    const a11y = AccessibilityManager.getInstance().getSettings();
    if (a11y.reducedMotion) {
      this.animProgress = this.isChecked ? 1 : 0;
      return;
    }

    const target = this.isChecked ? 1 : 0;
    const speed = 8;
    if (this.animProgress < target) {
      this.animProgress = Math.min(target, this.animProgress + dt * speed);
    } else if (this.animProgress > target) {
      this.animProgress = Math.max(target, this.animProgress - dt * speed);
    }
  }

  public render(renderer: IRenderer): void {
    if (!this.isVisible) return;

    const ctx = renderer.getContext();
    const a11y = AccessibilityManager.getInstance().getSettings();
    const isHighContrast = a11y.highContrast;
    const { x, y, width, height } = this.bounds;

    ctx.save();

    // Focus Outline
    if (this.isFocused) {
      ctx.strokeStyle = isHighContrast ? '#00FFFF' : DesignTokens.colors.focus.outline;
      ctx.lineWidth = DesignTokens.colors.focus.width;
      ctx.beginPath();
      ctx.roundRect(x - 2, y - 2, width + 4, height + 4, 6);
      ctx.stroke();
    }

    // Label Text (Left)
    ctx.font = `600 12px ${AccessibilityManager.getInstance().getFontFamily()}`;
    ctx.fillStyle = this.isFocused ? DesignTokens.colors.solar.glow : DesignTokens.colors.text.primary;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.label, x + 6, y + height / 2);

    // Switch Track Pill (Right)
    const pillW = 44;
    const pillH = 22;
    const pillX = x + width - pillW - 6;
    const pillY = y + (height - pillH) / 2;

    const trackColor = this.isChecked
      ? isHighContrast
        ? '#FFE600'
        : DesignTokens.colors.solar.primary
      : 'rgba(30, 41, 59, 0.8)';
    const borderColor = isHighContrast
      ? '#FFFFFF'
      : this.isChecked
      ? DesignTokens.colors.solar.glow
      : DesignTokens.colors.borders.divider;

    ctx.fillStyle = trackColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.stroke();

    // Knob Circle
    const knobRadius = (pillH - 6) / 2;
    const knobMinX = pillX + 3 + knobRadius;
    const knobMaxX = pillX + pillW - 3 - knobRadius;
    const knobX = knobMinX + (knobMaxX - knobMinX) * this.animProgress;
    const knobY = pillY + pillH / 2;

    ctx.fillStyle = isHighContrast
      ? this.isChecked
        ? '#000000'
        : '#FFFFFF'
      : this.isChecked
      ? '#080C14'
      : '#E2E8F0';
    ctx.beginPath();
    ctx.arc(knobX, knobY, knobRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
