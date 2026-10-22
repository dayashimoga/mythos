import { describe, it, expect } from 'vitest';
import { Camera } from '../../src/render/Camera';
import { Vector2D } from '../../src/physics/Vector2D';

describe('Camera 2D Viewport & Tracking', () => {
  it('smoothly follows target using lerp factor', () => {
    const cam = new Camera(1280, 720);
    cam.position.set(0, 0);

    const target = new Vector2D(100, 200);
    cam.setTarget(target);

    // Update with dt = 0.1s
    cam.update(0.1);
    expect(cam.position.x).toBeGreaterThan(0);
    expect(cam.position.x).toBeLessThan(100);
    expect(cam.position.y).toBeGreaterThan(0);
    expect(cam.position.y).toBeLessThan(200);
  });

  it('transforms world to screen coordinates and inverse', () => {
    const cam = new Camera(1280, 720);
    cam.position.set(0, 0);

    const worldPoint = new Vector2D(100, 50);
    const screenPoint = cam.worldToScreen(worldPoint);

    // Center of screen is (640, 360) -> (740, 410)
    expect(screenPoint.x).toBe(640 + 100);
    expect(screenPoint.y).toBe(360 + 50);

    const convertedBack = cam.screenToWorld(screenPoint);
    expect(convertedBack.x).toBeCloseTo(100);
    expect(convertedBack.y).toBeCloseTo(50);
  });

  it('triggers screen shake and decays over time', () => {
    const cam = new Camera(1280, 720);
    cam.triggerShake(10, 0.2);

    cam.update(0.05);
    expect(cam.shakeOffset.magnitude()).toBeGreaterThan(0);

    cam.update(0.2); // Expired
    expect(cam.shakeOffset.magnitude()).toBe(0);
  });

  it('calculates visible bounding box', () => {
    const cam = new Camera(1000, 600);
    cam.position.set(200, 300);

    const bounds = cam.getVisibleBounds();
    expect(bounds.x).toBe(200 - 500);
    expect(bounds.y).toBe(300 - 300);
    expect(bounds.width).toBe(1000);
    expect(bounds.height).toBe(600);
  });
});
