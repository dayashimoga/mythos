/**
 * Mythos: Astra & The Seven Realms
 * Stage 6 Base UI Component
 */

import { IRenderer } from '../../render/CanvasRenderer';
import { Vector2D } from '../../physics/Vector2D';
import { IFocusable } from '../design/FocusManager';

export interface UIComponentBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export abstract class UIComponent implements IFocusable {
  public id: string;
  public tabIndex: number;
  public isFocused = false;
  public isHovered = false;
  public isPressed = false;
  public isDisabled = false;
  public isVisible = true;

  public bounds: UIComponentBounds;

  public onFocus?: () => void;
  public onBlur?: () => void;
  public onActivate?: () => void;

  constructor(id: string, x: number, y: number, width: number, height: number, tabIndex = 0) {
    this.id = id;
    this.bounds = { x, y, width, height };
    this.tabIndex = tabIndex;
  }

  public getBounds(): UIComponentBounds {
    return { ...this.bounds };
  }

  public containsPoint(point: Vector2D): boolean {
    return (
      point.x >= this.bounds.x &&
      point.x <= this.bounds.x + this.bounds.width &&
      point.y >= this.bounds.y &&
      point.y <= this.bounds.y + this.bounds.height
    );
  }

  public updateHover(mousePos: Vector2D): boolean {
    if (this.isDisabled || !this.isVisible) {
      this.isHovered = false;
      return false;
    }
    this.isHovered = this.containsPoint(mousePos);
    return this.isHovered;
  }

  public setPressed(pressed: boolean): void {
    if (this.isDisabled || !this.isVisible) return;
    this.isPressed = pressed;
  }

  public abstract update(dt: number): void;
  public abstract render(renderer: IRenderer): void;
}
