import { describe, it, expect, beforeEach } from 'vitest';
import { Engine } from '../../src/engine/Engine';
import { BhumiTempleScene } from '../../src/scenes/BhumiTempleScene';
import { CanvasRenderer } from '../../src/render/CanvasRenderer';
import { StorageAdapter, MemoryStorage } from '../../src/state/StorageAdapter';
import { SaveGameManager } from '../../src/state/SaveGameManager';

describe('Stage 1 Vertical Slice Integration: Bhumi Sunken Temple Flow', () => {
  let engine: Engine;
  let canvas: HTMLCanvasElement;
  let scene: BhumiTempleScene;
  let renderer: CanvasRenderer;

  beforeEach(() => {
    StorageAdapter.setCustomStorage(new MemoryStorage());
    SaveGameManager.reset();

    canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    engine = new Engine();
    engine.init(canvas);
    engine.start();

    engine.getSceneManager().switchTo('BhumiTempleScene');
    scene = engine.getSceneManager().getCurrentScene() as BhumiTempleScene;
    renderer = engine.getRenderer() as CanvasRenderer;
  });

  it('initializes temple level with player, props, pillars, spire, and enemies', () => {
    expect(scene.player).toBeDefined();
    expect(scene.forge).toBeDefined();
    expect(scene.font).toBeDefined();
    expect(scene.pillars.length).toBe(2);
    expect(scene.spire).toBeDefined();
    expect(scene.altar).toBeDefined();
    expect(scene.shards.length).toBe(3);
    expect(scene.scouts.length).toBe(3);
    expect(scene.rakshasa).toBeDefined();
  });

  it('executes full progression: pillars -> forge -> spire -> shards -> altar -> victory', () => {
    const input = engine.getInput();

    // 1. Attune both Resonance Pillars
    scene.pillars[0].attune();
    scene.pillars[1].attune();
    scene.update(0.1);
    expect(scene.spire.isShielded).toBe(false); // Shield dissolves

    // 2. Consecrate Blade at Agni-Forge
    scene.player.position.set(scene.forge.position.x, scene.forge.position.y);
    input.triggerVirtualAction('INTERACT');
    scene.handleInput(input);
    input.postUpdate();
    expect(scene.forge.isConsecrated).toBe(true);
    expect(scene.player.stance).toBe('SolarResonantFlare');

    // 3. Fire dual-shot burst
    input.triggerVirtualAction('ATTACK');
    scene.handleInput(input);
    input.postUpdate();
    expect(scene.playerProjectiles.length).toBe(2); // Dual-shot in SolarResonantFlare stance

    // 4. Perform Melee Slash with deflection
    input.triggerVirtualAction('MELEE_ATTACK');
    scene.handleInput(input);
    input.postUpdate();
    expect(scene.player.isMeleeSlashing).toBe(true);

    // 5. Drink from Amrita Font
    scene.player.health = 50;
    scene.player.position.set(scene.font.position.x, scene.font.position.y);
    input.triggerVirtualAction('INTERACT');
    scene.handleInput(input);
    input.postUpdate();
    expect(scene.player.health).toBe(90);

    // 6. Destroy Tamas Spire
    scene.spire.takeDamage(200);
    expect(scene.spire.isActive).toBe(false);

    // 7. Collect 3 Astra Shards
    scene.player.shardsCollected = 3;

    // 8. Consecrate High Altar
    scene.player.position.set(scene.altar.position.x, scene.altar.position.y);
    input.triggerVirtualAction('INTERACT');
    scene.handleInput(input);
    input.postUpdate();

    expect(scene.isVictory).toBe(true);
    expect(scene.altar.state).toBe('consecrated');

    // Verify progression was saved
    const saved = SaveGameManager.load();
    expect(saved.unlockedRealms).toContain('RealmOfPatala');

    // Render Victory overlay
    expect(() => scene.render(renderer)).not.toThrow();
  });

  it('triggers defeat and executes instant restart via RESTART action', () => {
    const input = engine.getInput();

    // Player takes fatal damage
    scene.player.takeDamage(200);
    scene.update(0.1);

    expect(scene.isGameOver).toBe(true);

    // Render Game Over modal
    expect(() => scene.render(renderer)).not.toThrow();

    // Trigger instant restart (Key R)
    input.triggerVirtualAction('RESTART');
    scene.handleInput(input);
    input.postUpdate();

    expect(scene.isGameOver).toBe(false);
    expect(scene.player.health).toBe(100);
  });
});
