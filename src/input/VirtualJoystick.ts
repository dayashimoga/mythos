import { InputManager } from './InputManager';

export class VirtualJoystick {
  private container: HTMLElement | null = null;
  private inputManager: InputManager;
  private isPointerDown = false;
  private startX = 0;
  private startY = 0;
  private maxRadius = 45;

  private stickElement: HTMLElement | null = null;

  constructor(inputManager: InputManager) {
    this.inputManager = inputManager;
  }

  public mount(rootElement: HTMLElement): void {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'virtual-controls-container';
    this.container.style.cssText = `
      position: absolute; inset: 0; pointer-events: none; z-index: 800;
      display: flex; justify-content: space-between; align-items: flex-end;
      padding: 24px; box-sizing: border-box; user-select: none;
    `;

    // Left joystick zone
    const stickZone = document.createElement('div');
    stickZone.id = 'stick-zone';
    stickZone.style.cssText = `
      width: 140px; height: 140px; position: relative; pointer-events: auto;
      touch-action: none; display: flex; align-items: center; justify-content: center;
    `;

    const stickBase = document.createElement('div');
    stickBase.style.cssText = `
      width: 120px; height: 120px; border-radius: 50%;
      background: rgba(18, 24, 36, 0.6); border: 2px solid rgba(255, 183, 3, 0.4);
      position: relative; display: flex; align-items: center; justify-content: center;
    `;

    const stickThumb = document.createElement('div');
    stickThumb.style.cssText = `
      width: 50px; height: 50px; border-radius: 50%;
      background: radial-gradient(circle, #FFB703, #FB8500);
      box-shadow: 0 0 12px rgba(251, 133, 0, 0.6);
      position: absolute; transform: translate(0px, 0px);
    `;

    stickBase.appendChild(stickThumb);
    stickZone.appendChild(stickBase);
    this.container.appendChild(stickZone);

    this.stickElement = stickThumb;

    // Right Action Buttons Zone
    const actionZone = document.createElement('div');
    actionZone.style.cssText = `
      display: flex; gap: 16px; pointer-events: auto; touch-action: none;
    `;

    const attackBtn = this.createActionButton('⚔️', 'ATTACK', '#FB8500');
    const dashBtn = this.createActionButton('⚡', 'DASH', '#00E5FF');
    const interactBtn = this.createActionButton('✨', 'INTERACT', '#FFB703');

    actionZone.appendChild(dashBtn);
    actionZone.appendChild(interactBtn);
    actionZone.appendChild(attackBtn);

    this.container.appendChild(actionZone);
    rootElement.appendChild(this.container);

    this.setupTouchListeners(stickZone);
  }

  private createActionButton(label: string, action: 'ATTACK' | 'DASH' | 'INTERACT', color: string): HTMLElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText = `
      width: 60px; height: 60px; border-radius: 50%; border: 2px solid ${color};
      background: rgba(18, 24, 36, 0.85); color: #FFF; font-size: 22px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5); -webkit-tap-highlight-color: transparent;
    `;

    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.inputManager.triggerVirtualAction(action);
      btn.style.transform = 'scale(0.92)';
    });

    const reset = () => {
      btn.style.transform = 'scale(1)';
    };
    btn.addEventListener('pointerup', reset);
    btn.addEventListener('pointercancel', reset);

    return btn;
  }

  private setupTouchListeners(zone: HTMLElement): void {
    zone.addEventListener('pointerdown', (e) => {
      this.isPointerDown = true;
      const rect = zone.getBoundingClientRect();
      this.startX = rect.left + rect.width / 2;
      this.startY = rect.top + rect.height / 2;
      this.handlePointerMove(e);
      zone.setPointerCapture(e.pointerId);
    });

    zone.addEventListener('pointermove', (e) => {
      if (!this.isPointerDown) return;
      this.handlePointerMove(e);
    });

    const end = (e: PointerEvent) => {
      this.isPointerDown = false;
      if (this.stickElement) {
        this.stickElement.style.transform = 'translate(0px, 0px)';
      }
      this.inputManager.setVirtualMovement(0, 0);
      try {
        zone.releasePointerCapture(e.pointerId);
      } catch {
        // Safe ignore
      }
    };

    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
  }

  private handlePointerMove(e: PointerEvent): void {
    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let normX = dx;
    let normY = dy;
    if (dist > this.maxRadius) {
      normX = (dx / dist) * this.maxRadius;
      normY = (dy / dist) * this.maxRadius;
    }

    if (this.stickElement) {
      this.stickElement.style.transform = `translate(${normX}px, ${normY}px)`;
    }

    const axisX = normX / this.maxRadius;
    const axisY = normY / this.maxRadius;
    this.inputManager.setVirtualMovement(axisX, axisY);
  }

  public unmount(): void {
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
      this.container = null;
    }
  }
}
