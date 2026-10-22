import { describe, it, expect } from 'vitest';
import { Diagnostics } from '../../src/core/Diagnostics';

describe('Diagnostics & Telemetry', () => {
  it('initializes with default metrics and toggles visibility', () => {
    const diag = new Diagnostics();
    expect(diag.getIsVisible()).toBe(false);
    expect(diag.getShowColliders()).toBe(false);

    expect(diag.toggleVisible()).toBe(true);
    expect(diag.getIsVisible()).toBe(true);

    expect(diag.toggleColliders()).toBe(true);
    expect(diag.getShowColliders()).toBe(true);
  });

  it('updates frame delta and calculates metrics correctly', () => {
    const diag = new Diagnostics();
    diag.updateFrame(16.6);
    diag.setTimings(2.5, 5.0);
    diag.setCounts(12, 150, 45);
    diag.setActiveScene('SanctumScene');
    diag.setAudioVoices(3);

    const metrics = diag.getMetrics();
    expect(metrics.frameTimeMs).toBe(16.6);
    expect(metrics.updateTimeMs).toBe(2.5);
    expect(metrics.renderTimeMs).toBe(5.0);
    expect(metrics.entityCount).toBe(12);
    expect(metrics.particleCount).toBe(150);
    expect(metrics.collisionChecks).toBe(45);
    expect(metrics.activeScene).toBe('SanctumScene');
    expect(metrics.audioVoices).toBe(3);
  });
});
