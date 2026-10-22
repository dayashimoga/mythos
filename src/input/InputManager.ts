import { Vector2D } from '../physics/Vector2D';
import { Camera } from '../render/Camera';

export type GameAction =
  | 'MOVE_UP'
  | 'MOVE_DOWN'
  | 'MOVE_LEFT'
  | 'MOVE_RIGHT'
  | 'DASH'
  | 'ATTACK'
  | 'MELEE_ATTACK'
  | 'INTERACT'
  | 'PAUSE'
  | 'RESTART'
  | 'TOGGLE_DIAGNOSTICS'
  | 'TOGGLE_COLLIDERS';

export class InputManager {
  private keysHeld: Set<string> = new Set();
  private keysJustPressed: Set<string> = new Set();
  private keysJustReleased: Set<string> = new Set();

  private mousePosition: Vector2D = new Vector2D(0, 0);
  private mouseButtonsHeld: Set<number> = new Set();
  private mouseButtonsJustPressed: Set<number> = new Set();

  private virtualAxis: Vector2D = new Vector2D(0, 0);
  private virtualActionJustPressed: Set<GameAction> = new Set();

  private actionKeyMap: Record<GameAction, string[]> = {
    MOVE_UP: ['KeyW', 'ArrowUp'],
    MOVE_DOWN: ['KeyS', 'ArrowDown'],
    MOVE_LEFT: ['KeyA', 'ArrowLeft'],
    MOVE_RIGHT: ['KeyD', 'ArrowRight'],
    DASH: ['Space', 'ShiftLeft'],
    ATTACK: ['KeyJ', 'Enter'],
    MELEE_ATTACK: ['KeyK', 'KeyX', 'KeyB'],
    INTERACT: ['KeyE', 'KeyF'],
    PAUSE: ['Escape', 'KeyP'],
    RESTART: ['KeyR'],
    TOGGLE_DIAGNOSTICS: ['F3', 'Backquote'],
    TOGGLE_COLLIDERS: ['F2', 'KeyC'],
  };

  private boundKeyDown = this.handleKeyDown.bind(this);
  private boundKeyUp = this.handleKeyUp.bind(this);
  private boundMouseMove = this.handleMouseMove.bind(this);
  private boundMouseDown = this.handleMouseDown.bind(this);
  private boundMouseUp = this.handleMouseUp.bind(this);

  public attach(target: Window | HTMLElement): void {
    target.addEventListener('keydown', this.boundKeyDown as EventListener);
    target.addEventListener('keyup', this.boundKeyUp as EventListener);
    target.addEventListener('mousemove', this.boundMouseMove as EventListener);
    target.addEventListener('mousedown', this.boundMouseDown as EventListener);
    target.addEventListener('mouseup', this.boundMouseUp as EventListener);
  }

  public detach(target: Window | HTMLElement): void {
    target.removeEventListener('keydown', this.boundKeyDown as EventListener);
    target.removeEventListener('keyup', this.boundKeyUp as EventListener);
    target.removeEventListener('mousemove', this.boundMouseMove as EventListener);
    target.removeEventListener('mousedown', this.boundMouseDown as EventListener);
    target.removeEventListener('mouseup', this.boundMouseUp as EventListener);
    this.clear();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.keysHeld.has(e.code)) {
      this.keysJustPressed.add(e.code);
    }
    this.keysHeld.add(e.code);
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keysHeld.delete(e.code);
    this.keysJustReleased.add(e.code);
  }

  private handleMouseMove(e: MouseEvent): void {
    this.mousePosition.set(e.clientX, e.clientY);
  }

  private handleMouseDown(e: MouseEvent): void {
    if (!this.mouseButtonsHeld.has(e.button)) {
      this.mouseButtonsJustPressed.add(e.button);
    }
    this.mouseButtonsHeld.add(e.button);
  }

  private handleMouseUp(e: MouseEvent): void {
    this.mouseButtonsHeld.delete(e.button);
  }

  public setVirtualMovement(x: number, y: number): void {
    this.virtualAxis.set(x, y);
  }

  public triggerVirtualAction(action: GameAction): void {
    this.virtualActionJustPressed.add(action);
  }

  public isActionHeld(action: GameAction): boolean {
    const keys = this.actionKeyMap[action];
    for (const k of keys) {
      if (this.keysHeld.has(k)) return true;
    }
    if (action === 'ATTACK' && this.mouseButtonsHeld.has(0)) return true;
    if (action === 'MELEE_ATTACK' && this.mouseButtonsHeld.has(2)) return true;
    return false;
  }

  public isActionJustPressed(action: GameAction): boolean {
    if (this.virtualActionJustPressed.has(action)) return true;

    const keys = this.actionKeyMap[action];
    for (const k of keys) {
      if (this.keysJustPressed.has(k)) return true;
    }
    if (action === 'ATTACK' && this.mouseButtonsJustPressed.has(0)) return true;
    if (action === 'MELEE_ATTACK' && this.mouseButtonsJustPressed.has(2)) return true;
    return false;
  }

  public isKeyHeld(code: string): boolean {
    return this.keysHeld.has(code);
  }

  public isKeyJustPressed(code: string): boolean {
    return this.keysJustPressed.has(code);
  }

  public isMouseButtonHeld(button: number): boolean {
    return this.mouseButtonsHeld.has(button);
  }

  public isMouseButtonJustPressed(button: number): boolean {
    return this.mouseButtonsJustPressed.has(button);
  }

  public getMovementVector(): Vector2D {
    const move = new Vector2D(0, 0);

    if (this.isActionHeld('MOVE_UP')) move.y -= 1;
    if (this.isActionHeld('MOVE_DOWN')) move.y += 1;
    if (this.isActionHeld('MOVE_LEFT')) move.x -= 1;
    if (this.isActionHeld('MOVE_RIGHT')) move.x += 1;

    // Combine with virtual stick if active
    if (this.virtualAxis.magnitudeSquared() > 0.05) {
      move.x += this.virtualAxis.x;
      move.y += this.virtualAxis.y;
    }

    if (move.magnitudeSquared() > 1) {
      move.normalize();
    }
    return move;
  }

  public getMousePosition(): Vector2D {
    return this.mousePosition.clone();
  }

  public getMouseWorldPosition(camera: Camera): Vector2D {
    return camera.screenToWorld(this.mousePosition);
  }

  public postUpdate(): void {
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
    this.mouseButtonsJustPressed.clear();
    this.virtualActionJustPressed.clear();
  }

  public clear(): void {
    this.keysHeld.clear();
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
    this.mouseButtonsHeld.clear();
    this.mouseButtonsJustPressed.clear();
    this.virtualAxis.set(0, 0);
    this.virtualActionJustPressed.clear();
  }
}
