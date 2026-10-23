/**
 * Mythos: Astra & The Seven Realms
 * Stage 6 Reusable Accessible UI Tabs Component
 */

import { UIComponent } from './UIComponent';
import { IRenderer } from '../../render/CanvasRenderer';
import { Vector2D } from '../../physics/Vector2D';
import { DesignTokens } from '../design/DesignTokens';
import { AccessibilityManager } from '../accessibility/AccessibilityManager';

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
}

export interface TabsOptions {
  tabs: TabItem[];
  activeTabId?: string;
  tabIndex?: number;
  onTabChange?: (tabId: string, index: number) => void;
}

export class UITabs extends UIComponent {
  public tabs: TabItem[];
  public activeIndex = 0;
  public onTabChange?: (tabId: string, index: number) => void;

  constructor(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    options: TabsOptions
  ) {
    super(id, x, y, width, height, options.tabIndex ?? 0);
    this.tabs = options.tabs;
    this.onTabChange = options.onTabChange;

    if (options.activeTabId) {
      const idx = this.tabs.findIndex((t) => t.id === options.activeTabId);
      if (idx !== -1) this.activeIndex = idx;
    }

    this.onActivate = () => {
      this.selectNextTab();
    };
  }

  public getActiveTab(): TabItem | undefined {
    return this.tabs[this.activeIndex];
  }

  public setActiveTab(tabId: string): void {
    const idx = this.tabs.findIndex((t) => t.id === tabId);
    if (idx !== -1 && idx !== this.activeIndex) {
      this.activeIndex = idx;
      if (this.onTabChange) this.onTabChange(tabId, idx);
    }
  }

  public setActiveIndex(index: number): void {
    if (index >= 0 && index < this.tabs.length && index !== this.activeIndex) {
      this.activeIndex = index;
      if (this.onTabChange) this.onTabChange(this.tabs[index].id, index);
    }
  }

  public selectNextTab(): void {
    const next = (this.activeIndex + 1) % this.tabs.length;
    this.setActiveIndex(next);
  }

  public selectPreviousTab(): void {
    const prev = (this.activeIndex - 1 + this.tabs.length) % this.tabs.length;
    this.setActiveIndex(prev);
  }

  public handleClick(pointerPos: Vector2D): boolean {
    if (!this.isVisible || !this.containsPoint(pointerPos) || this.tabs.length === 0) return false;

    const tabWidth = this.bounds.width / this.tabs.length;
    const clickedIdx = Math.floor((pointerPos.x - this.bounds.x) / tabWidth);
    if (clickedIdx >= 0 && clickedIdx < this.tabs.length) {
      this.setActiveIndex(clickedIdx);
      return true;
    }
    return false;
  }

  public handlePointer(pointerPos: Vector2D): boolean {
    return this.handleClick(pointerPos);
  }

  public update(_dt: number): void {}

  public render(renderer: IRenderer): void {
    if (!this.isVisible || this.tabs.length === 0) return;

    const ctx = renderer.getContext();
    const a11y = AccessibilityManager.getInstance().getSettings();
    const isHighContrast = a11y.highContrast;
    const { x, y, width, height } = this.bounds;
    const tabWidth = width / this.tabs.length;

    ctx.save();

    // Focus Outline
    if (this.isFocused) {
      ctx.strokeStyle = isHighContrast ? '#00FFFF' : DesignTokens.colors.focus.outline;
      ctx.lineWidth = DesignTokens.colors.focus.width;
      ctx.beginPath();
      ctx.roundRect(x - 2, y - 2, width + 4, height + 4, 6);
      ctx.stroke();
    }

    // Bar Background
    ctx.fillStyle = 'rgba(8, 12, 20, 0.7)';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 6);
    ctx.fill();

    // Render each tab
    for (let i = 0; i < this.tabs.length; i++) {
      const tab = this.tabs[i];
      const tabX = x + i * tabWidth;
      const isActive = i === this.activeIndex;

      // Active tab pill background
      if (isActive) {
        ctx.fillStyle = isHighContrast
          ? 'rgba(255, 230, 0, 0.25)'
          : 'rgba(255, 183, 3, 0.16)';
        ctx.beginPath();
        ctx.roundRect(tabX + 4, y + 4, tabWidth - 8, height - 8, 4);
        ctx.fill();

        // Active gold indicator bar at bottom
        ctx.fillStyle = isHighContrast ? '#FFE600' : DesignTokens.colors.solar.primary;
        ctx.fillRect(tabX + 8, y + height - 3, tabWidth - 16, 3);
      }

      // Tab Label Text
      const font = `${isActive ? 'bold' : '500'} 12px ${AccessibilityManager.getInstance().getFontFamily(true)}`;
      ctx.font = font;
      ctx.fillStyle = isActive
        ? isHighContrast
          ? '#FFE600'
          : DesignTokens.colors.solar.glow
        : DesignTokens.colors.text.secondary;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let label = tab.label;
      if (tab.icon) {
        label = `${tab.icon} ${label}`;
      }
      ctx.fillText(label, tabX + tabWidth / 2, y + height / 2);
    }

    ctx.restore();
  }
}
