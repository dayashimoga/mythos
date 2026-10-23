/**
 * Mythos: Astra & The Seven Realms
 * Stage 6 Reusable Accessible UI Slider
 */

import { UIComponent } from './UIComponent';
import { IRenderer } from '../../render/CanvasRenderer';
import { Vector2D } from '../../physics/Vector2D';
import { DesignTokens } from '../design/DesignTokens';
import { AccessibilityManager } from '../accessibility/AccessibilityManager';

export interface SliderOptions {
  label: string;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  tabIndex?: number;
  formatValue?: (val: number) => string;
  onChange?: (val: number) => void;
}

export class UISlider extends UIComponent {
  public label: string;
  public min: number;
  public max: number;
  public step: number;
  public value: number;
  public isDragging = false;
  public formatValue: (val: number) => string;
  public onChange?: (val: number) => void;

  constructor(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    options: SliderOptions
  ) {
    super(id, x, y, width, height, options.tabIndex ?? 0);
    this.label = options.label;
    this.min = options.min ?? 0;
    this.max = options.max ?? 1;
    this.step = options.step ?? 0.05;
    this.value = Math.max(this.min, Math.min(this.max, options.value));
    this.formatValue = options.formatValue || ((v: number) => `${Math.round((v / (this.max - this.min)) * 100)}%`);
    this.onChange = options.onChange;

    this.onActivate = () => {
      // Step value up on activation, wrapping back to min if at max
      this.stepValue(this.step);
    };
  }

  public setValue(val: number): void {
    const clamped = Math.max(this.min, Math.min(this.max, val));
    if (this.value !== clamped) {
      this.value = clamped;
      if (this.onChange) this.onChange(this.value);
    }
  }

  public stepValue(delta: number): void {
    let next = this.value + delta;
    if (next > this.max) next = this.min;
    if (next < this.min) next = this.max;
    this.setValue(next);
  }

  public handlePointer(pointerPos: Vector2D, isDown: boolean): void {
    if (!this.isVisible || this.isDisabled) return;

    if (isDown) {
      if (this.containsPoint(pointerPos) || this.isDragging) {
        this.isDragging = true;
        const trackX = this.bounds.x + 140;
        const trackW = this.bounds.width - 200;
        const ratio = Math.max(0, Math.min(1, (pointerPos.x - trackX) / trackW));
        const raw = this.min + ratio * (this.max - this.min);
        const stepped = Math.round(raw / this.step) * this.step;
        this.setValue(stepped);
      }
    } else {
      this.isDragging = false;
    }
  }

  public update(_dt: number): void {}

  public render(renderer: IRenderer): void {
    if (!this.isVisible) return;

    const ctx = renderer.getContext();
    const a11y = AccessibilityManager.getInstance().getSettings();
    const isHighContrast = a11y.highContrast;
    const { x, y, width, height } = this.bounds;

    ctx.save();

    // Focus Ring
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

    // Track Background
    const trackX = x + 150;
    const trackY = y + height / 2 - 3;
    const trackW = width - 215;
    const trackH = 6;

    ctx.fillStyle = 'rgba(8, 12, 20, 0.9)';
    ctx.strokeStyle = isHighContrast ? '#FFFFFF' : DesignTokens.colors.borders.subtleGold;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(trackX, trackY, trackW, trackH, 3);
    ctx.fill();
    ctx.stroke();

    // Filled Active Track
    const progress = Math.max(0, Math.min(1, (this.value - this.min) / (this.max - this.min)));
    const fillW = trackW * progress;
    ctx.fillStyle = isHighContrast ? '#FFE600' : DesignTokens.colors.solar.primary;
    ctx.beginPath();
    ctx.roundRect(trackX, trackY, fillW, trackH, 3);
    ctx.fill();

    // Draggable Handle Thumb
    const thumbX = trackX + fillW;
    const thumbY = trackY + trackH / 2;
    const thumbRadius = this.isFocused || this.isDragging ? 9 : 7;

    ctx.fillStyle = isHighContrast ? '#00FFFF' : DesignTokens.colors.solar.glow;
    ctx.strokeStyle = '#080C14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(thumbX, thumbY, thumbRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Readout Text (Right)
    ctx.fillStyle = DesignTokens.colors.solar.glow;
    ctx.textAlign = 'right';
    ctx.font = `bold 12px ${AccessibilityManager.getInstance().getFontFamily()}`;
    ctx.fillText(this.formatValue(this.value), x + width - 6, y + height / 2);

    ctx.restore();
  }
}
