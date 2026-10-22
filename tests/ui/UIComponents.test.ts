import { describe, it, expect, vi } from 'vitest';
import { DialogueBox } from '../../src/ui/DialogueBox';
import { HUD } from '../../src/ui/HUD';
import { DiagnosticOverlay } from '../../src/ui/DiagnosticOverlay';
import { Diagnostics } from '../../src/core/Diagnostics';
import { Player } from '../../src/entities/Player';
import { CanvasRenderer } from '../../src/render/CanvasRenderer';

describe('UI Subsystems & Overlays', () => {
  it('advances dialogue typewriter characters and invokes completion callback', () => {
    const box = new DialogueBox();
    const onComplete = vi.fn();

    box.start(
      [
        {
          speaker: 'Tara',
          speakerRole: 'Oracle',
          portraitColor: '#00E5FF',
          text: 'Awaken, Veer.',
        },
      ],
      onComplete
    );

    expect(box.isActive()).toBe(true);

    // Update to simulate time passing for characters
    box.update(1.0);

    // Advance to complete
    box.advance();

    expect(onComplete).toHaveBeenCalled();
    expect(box.isActive()).toBe(false);
  });

  it('renders HUD without crashing', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const renderer = new CanvasRenderer(canvas);
    const hud = new HUD();
    const player = new Player('p', 0, 0);

    expect(() => {
      hud.render(renderer, player, 'Test Objective');
    }).not.toThrow();
  });

  it('renders DiagnosticOverlay only when visible', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const renderer = new CanvasRenderer(canvas);
    const diag = new Diagnostics();
    const overlay = new DiagnosticOverlay();

    // Default invisible -> no render
    expect(() => overlay.render(renderer, diag)).not.toThrow();

    // Toggle visible
    diag.toggleVisible();
    expect(() => overlay.render(renderer, diag)).not.toThrow();
  });
});
