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
    expect(root.querySelector('#virtual-controls-container')).not.toBeNull();
    expect(root.querySelector('#stick-zone')).not.toBeNull();

    joystick.unmount();
    expect(root.querySelector('#virtual-controls-container')).toBeNull();
  });
});
