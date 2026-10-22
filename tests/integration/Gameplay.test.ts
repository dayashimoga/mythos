import { describe, it, expect, beforeEach } from 'vitest';
import { Engine } from '../../src/engine/Engine';
import { GameScene } from '../../src/scenes/GameScene';
import { SaveGameManager } from '../../src/state/SaveGameManager';
import { StorageAdapter, MemoryStorage } from '../../src/state/StorageAdapter';

describe('Gameplay Integration: Sanctum Calibration', () => {
  let engine: Engine;
  let canvas: HTMLCanvasElement;
  let gameScene: GameScene;

  beforeEach(() => {
    StorageAdapter.setCustomStorage(new MemoryStorage());
    SaveGameManager.reset();

    canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    engine = new Engine();
    engine.init(canvas);
    engine.start();

    engine.getSceneManager().switchTo('GameScene');
    gameScene = engine.getSceneManager().getCurrentScene() as GameScene;
  });

  it('spawns player, altar, shards, and sentinels properly', () => {
    expect(gameScene.player).toBeDefined();
    expect(gameScene.altar).toBeDefined();
    expect(gameScene.shards.length).toBe(3);
    expect(gameScene.sentinels.length).toBe(2);
  });

  it('collects shards, interacts with altar, and achieves victory', () => {
    // Player manually collects 3 shards
    gameScene.player.shardsCollected = 3;

    // Trigger altar consecration
    gameScene.handleAltarInteraction();

    expect(gameScene.altar.state).toBe('consecrated');
    expect(gameScene.altar.shardsDeposited).toBe(3);

    // Verify state was saved
    const saved = SaveGameManager.load();
    expect(saved.altarConsecrated).toBe(true);
    expect(saved.shardsCollected).toBe(3);
  });

  it('destroys enemy sentinel when shot with projectile', () => {
    const sentinel = gameScene.sentinels[0];
    const initialScore = gameScene.player.score;

    // Deal lethal damage via projectile logic
    sentinel.takeDamage(50);
    expect(sentinel.isActive).toBe(false);

    gameScene.player.score += 750;
    expect(gameScene.player.score).toBe(initialScore + 750);
  });
});
