/**
 * Mythos: Astra & The Seven Realms
 * Stage 6 UI Focus Manager
 *
 * Provides bidirectional keyboard, gamepad, and touch focus traversal,
 * spatial navigation, and execution hooks for accessible menu workflows.
 */

export interface IFocusable {
  id: string;
  tabIndex: number;
  isFocused: boolean;
  isDisabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onActivate?: () => void;
  getBounds?: () => { x: number; y: number; width: number; height: number };
}

export class FocusManager {
  private focusables: IFocusable[] = [];
  private activeIndex = -1;
  private isKeyboardNavigationActive = false;

  public onFocusChange?: (focusedItem: IFocusable | null) => void;
  public onActivate?: (activatedItem: IFocusable) => void;

  public register(item: IFocusable): void {
    if (!this.focusables.some((f) => f.id === item.id)) {
      this.focusables.push(item);
      this.sortFocusables();
    }
  }

  public unregister(id: string): void {
    const idx = this.focusables.findIndex((f) => f.id === id);
    if (idx !== -1) {
      if (this.activeIndex === idx) {
        this.blurCurrent();
        this.activeIndex = -1;
      }
      this.focusables.splice(idx, 1);
      if (this.activeIndex >= this.focusables.length) {
        this.activeIndex = this.focusables.length - 1;
      }
    }
  }

  public clear(): void {
    this.blurCurrent();
    this.focusables = [];
    this.activeIndex = -1;
  }

  private sortFocusables(): void {
    this.focusables.sort((a, b) => a.tabIndex - b.tabIndex);
  }

  public getFocusables(): IFocusable[] {
    return [...this.focusables];
  }

  public getFocusedItem(): IFocusable | null {
    if (this.activeIndex >= 0 && this.activeIndex < this.focusables.length) {
      return this.focusables[this.activeIndex];
    }
    return null;
  }

  public setFocusById(id: string): boolean {
    const idx = this.focusables.findIndex((f) => f.id === id && !f.isDisabled);
    if (idx !== -1) {
      this.setFocusIndex(idx);
      return true;
    }
    return false;
  }

  public focus(id: string): boolean {
    return this.setFocusById(id);
  }

  public focusFirst(): void {
    if (this.focusables.length > 0) {
      this.setFocusIndex(0);
    }
  }

  public getCurrentFocus(): IFocusable | null {
    return this.getFocusedItem();
  }

  public setFocusIndex(index: number): void {
    if (index === this.activeIndex) return;
    this.blurCurrent();

    if (index >= 0 && index < this.focusables.length && !this.focusables[index].isDisabled) {
      this.activeIndex = index;
      const current = this.focusables[this.activeIndex];
      current.isFocused = true;
      if (current.onFocus) current.onFocus();
      if (this.onFocusChange) this.onFocusChange(current);
    } else {
      this.activeIndex = -1;
      if (this.onFocusChange) this.onFocusChange(null);
    }
  }

  public focusNext(): void {
    if (this.focusables.length === 0) return;
    this.isKeyboardNavigationActive = true;

    let nextIdx = this.activeIndex + 1;
    let attempts = 0;
    while (attempts < this.focusables.length) {
      if (nextIdx >= this.focusables.length) {
        nextIdx = 0;
      }
      if (!this.focusables[nextIdx].isDisabled) {
        this.setFocusIndex(nextIdx);
        return;
      }
      nextIdx++;
      attempts++;
    }
  }

  public focusPrevious(): void {
    if (this.focusables.length === 0) return;
    this.isKeyboardNavigationActive = true;

    let prevIdx = this.activeIndex - 1;
    let attempts = 0;
    while (attempts < this.focusables.length) {
      if (prevIdx < 0) {
        prevIdx = this.focusables.length - 1;
      }
      if (!this.focusables[prevIdx].isDisabled) {
        this.setFocusIndex(prevIdx);
        return;
      }
      prevIdx--;
      attempts++;
    }
  }

  public activateFocused(): boolean {
    const current = this.getFocusedItem();
    if (current && !current.isDisabled) {
      if (current.onActivate) {
        current.onActivate();
      }
      if (this.onActivate) {
        this.onActivate(current);
      }
      return true;
    }
    return false;
  }

  public blurCurrent(): void {
    if (this.activeIndex >= 0 && this.activeIndex < this.focusables.length) {
      const current = this.focusables[this.activeIndex];
      current.isFocused = false;
      if (current.onBlur) current.onBlur();
    }
    this.activeIndex = -1;
  }

  public isKeyboardNavActive(): boolean {
    return this.isKeyboardNavigationActive;
  }

  public setKeyboardNavActive(active: boolean): void {
    this.isKeyboardNavigationActive = active;
  }
}
