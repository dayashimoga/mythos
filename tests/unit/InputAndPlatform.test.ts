import { describe, it, expect } from 'vitest';
import { InputManager } from '../../src/input/InputManager';
import { PlatformBridge } from '../../src/platform/PlatformBridge';
import { VirtualJoystick } from '../../src/input/VirtualJoystick';

describe('InputManager & PlatformBridge Hardware Detection', () => {
  it('detects platform capabilities and performs canvas scaling', () => {
    const bridge = PlatformBridge.getInstance();
    const caps = bridge.getCapabilities();

    expect(caps.platform).toBeDefined();
    expect(caps.dpr).toBeGreaterThanOrEqual(1);

    const canvas = document.createElement('canvas');
    const result = bridge.resizeCanvas(canvas, 1280, 720);
    expect(result.scale).toBeGreaterThan(0);
    expect(canvas.width).toBe(1280);
    expect(canvas.height).toBe(720);
  });

  it('tracks keyboard, mouse, and virtual input actions', () => {
    const input = new InputManager();
    const target = document.createElement('div');
    input.attach(target);

    // Simulate keydown
    target.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
    expect(input.isActionHeld('MOVE_UP')).toBe(true);
    expect(input.isActionJustPressed('MOVE_UP')).toBe(true);

    const move = input.getMovementVector();
    expect(move.y).toBe(-1);

    // Post-update clears just-pressed
    input.postUpdate();
    expect(input.isActionJustPressed('MOVE_UP')).toBe(false);
    expect(input.isActionHeld('MOVE_UP')).toBe(true);

    // Keyup
    target.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
    expect(input.isActionHeld('MOVE_UP')).toBe(false);

    // Mouse movement
    target.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 150 }));
    expect(input.getMousePosition().x).toBe(200);
    expect(input.getMousePosition().y).toBe(150);

    // Virtual action trigger
    input.triggerVirtualAction('DASH');
    expect(input.isActionJustPressed('DASH')).toBe(true);

    input.detach(target);
  });

  it('mounts and unmounts VirtualJoystick with touch controls', () => {
    const input = new InputManager();
    const joystick = new VirtualJoystick(input);
    const root = document.createElement('div');
    document.body.appendChild(root);

    joystick.mount(root);
    const container = root.querySelector('#virtual-controls-container') as HTMLElement;
    const stickZone = root.querySelector('#stick-zone') as HTMLElement;
    expect(container).not.toBeNull();
    expect(stickZone).not.toBeNull();

    // Polyfill PointerEvent in jsdom
    const PointerEv = typeof window.PointerEvent !== 'undefined' ? window.PointerEvent : (window.MouseEvent as unknown as typeof PointerEvent);

    // Mock setPointerCapture and releasePointerCapture
    stickZone.setPointerCapture = () => {};
    stickZone.releasePointerCapture = () => {};

    // Pointer down on stick
    stickZone.dispatchEvent(new PointerEv('pointerdown', { pointerId: 1, clientX: 100, clientY: 100 } as PointerEventInit));
    // Pointer move on stick
    stickZone.dispatchEvent(new PointerEv('pointermove', { pointerId: 1, clientX: 130, clientY: 140 } as PointerEventInit));
    expect(input.getMovementVector().x).not.toBe(0);

    // Pointer up on stick
    stickZone.dispatchEvent(new PointerEv('pointerup', { pointerId: 1 } as PointerEventInit));
    expect(input.getMovementVector().x).toBe(0);

    // Test action buttons: dash, attack, melee, interact
    const btnMelee = root.querySelector('#btn-melee-attack') as HTMLElement;
    const btnDash = root.querySelector('#btn-dash') as HTMLElement;
    const btnAttack = root.querySelector('#btn-attack') as HTMLElement;
    const btnInteract = root.querySelector('#btn-interact') as HTMLElement;

    expect(btnMelee).not.toBeNull();
    expect(btnDash).not.toBeNull();
    expect(btnAttack).not.toBeNull();
    expect(btnInteract).not.toBeNull();

    btnMelee.dispatchEvent(new PointerEv('pointerdown'));
    expect(input.isActionJustPressed('MELEE_ATTACK')).toBe(true);

    btnDash.dispatchEvent(new PointerEv('pointerdown'));
    expect(input.isActionJustPressed('DASH')).toBe(true);

    btnAttack?.dispatchEvent(new PointerEv('pointerdown'));
    expect(input.isActionJustPressed('ATTACK')).toBe(true);

    btnInteract?.dispatchEvent(new PointerEv('pointerdown'));
    expect(input.isActionJustPressed('INTERACT')).toBe(true);

    joystick.unmount();
    expect(root.querySelector('#virtual-controls-container')).toBeNull();
  });
});
