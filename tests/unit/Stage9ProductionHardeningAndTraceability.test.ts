import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Engine } from '../../src/engine/Engine';
import { CanvasRenderer } from '../../src/render/CanvasRenderer';
import { PlatformBridge } from '../../src/platform/PlatformBridge';
import { StoryCampaignScene } from '../../src/scenes/StoryCampaignScene';
import { BossEncounterScene } from '../../src/scenes/BossEncounterScene';
import { SplashScene } from '../../src/scenes/SplashScene';
import { BhumiTempleScene } from '../../src/scenes/BhumiTempleScene';
import { StoryScene } from '../../src/scenes/StoryScene';
import { DialogueTree } from '../../src/narrative/DialogueTree';
import { InputManager } from '../../src/input/InputManager';
import { Vector2D } from '../../src/physics/Vector2D';
import { AssetManager } from '../../src/assets/AssetManager';
import { StorageAdapter, MemoryStorage } from '../../src/state/StorageAdapter';
import { SaveGameManager } from '../../src/state/SaveGameManager';
import { ProductionHUD } from '../../src/ui/ProductionHUD';
import { DialogueBox } from '../../src/ui/DialogueBox';
import { VirtualJoystick } from '../../src/input/VirtualJoystick';
import { AccessibilityManager } from '../../src/ui/accessibility/AccessibilityManager';
import { Projectile } from '../../src/entities/Projectile';
import { Camera } from '../../src/render/Camera';
import { FocusManager } from '../../src/ui/design/FocusManager';

describe('Stage 9 — Performance, Release Certification & Production Hardening', () => {
  let engine: Engine;
  let renderer: CanvasRenderer;
  let input: InputManager;

  beforeEach(() => {
    StorageAdapter.setCustomStorage(new MemoryStorage());
    SaveGameManager.reset();

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    engine = new Engine();
    engine.init(canvas);
    renderer = engine.getRenderer() as CanvasRenderer;
    input = engine.getInput();
  });

  describe('9.1 & 9.4 — PlatformBridge Hardware & Device Capabilities', () => {
    it('detects platform capabilities, handles resize, network, and battery events', async () => {
      const bridge = PlatformBridge.getInstance();
      const caps = bridge.getCapabilities();
      expect(caps).toBeDefined();
      expect(caps.platform).toBeDefined();
      expect(caps.deviceType).toBeDefined();

      // Trigger resize event
      window.innerWidth = 1920;
      window.innerHeight = 1080;
      window.dispatchEvent(new Event('resize'));
      expect(bridge.getCapabilities().viewportWidth).toBe(1920);

      // Trigger online and offline events
      window.dispatchEvent(new Event('offline'));
      expect(bridge.getCapabilities().isOnline).toBe(false);
      window.dispatchEvent(new Event('online'));
      expect(bridge.getCapabilities().isOnline).toBe(true);

      // Trigger visibility and lifecycle events
      let receivedState = '';
      const unsubscribe = bridge.onLifecycleChange((state) => {
        receivedState = state;
      });

      bridge.setLifecycleState('suspended');
      expect(receivedState).toBe('suspended');
      expect(bridge.getLifecycleState()).toBe('suspended');

      window.dispatchEvent(new Event('resume'));
      expect(bridge.getLifecycleState()).toBe('active');

      window.dispatchEvent(new Event('pagehide'));
      expect(bridge.getLifecycleState()).toBe('suspended');

      window.dispatchEvent(new Event('freeze'));
      expect(bridge.getLifecycleState()).toBe('suspended');

      unsubscribe();

      // Test triggerHaptic
      (navigator as any).vibrate = vi.fn().mockReturnValue(true);
      expect(bridge.triggerHaptic(50)).toBe(true);
      expect((navigator as any).vibrate).toHaveBeenCalledWith(50);

      // Test resizeCanvas
      const mockCanvas = document.createElement('canvas');
      const resizeResult = bridge.resizeCanvas(mockCanvas, 1280, 720);
      expect(resizeResult.scale).toBeGreaterThan(0);
      expect(mockCanvas.width).toBe(1280);
      expect(mockCanvas.height).toBe(720);

      // Test toggleFullscreen enter and exit
      document.documentElement.requestFullscreen = vi.fn().mockResolvedValue(undefined);
      (document as any).exitFullscreen = vi.fn().mockResolvedValue(undefined);

      (document as any).fullscreenElement = null;
      const enterRes = await bridge.toggleFullscreen();
      expect(enterRes).toBe(true);

      (document as any).fullscreenElement = document.documentElement;
      const exitRes = await bridge.toggleFullscreen();
      expect(exitRes).toBe(false);
    });

    it('detects different OS userAgents, handles battery monitoring and edge cases', async () => {
      const testCases = [
        { ua: 'Mozilla/5.0 (Android 12; Mobile)', width: 400, touch: true, expectedPlatform: 'android', expectedDevice: 'mobile' },
        { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', width: 390, touch: true, expectedPlatform: 'ios', expectedDevice: 'mobile' },
        { ua: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)', width: 820, touch: true, expectedPlatform: 'ios', expectedDevice: 'tablet' },
        { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', width: 1920, touch: false, expectedPlatform: 'windows', expectedDevice: 'desktop' },
        { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', width: 1440, touch: false, expectedPlatform: 'macos', expectedDevice: 'desktop' },
        { ua: 'Mozilla/5.0 (X11; Linux x86_64)', width: 1280, touch: false, expectedPlatform: 'linux', expectedDevice: 'desktop' },
      ];

      for (const tc of testCases) {
        Object.defineProperty(navigator, 'userAgent', { value: tc.ua, configurable: true });
        window.innerWidth = tc.width;
        if (tc.touch) {
          (window as any).ontouchstart = null;
        } else {
          delete (window as any).ontouchstart;
        }
        (PlatformBridge as any).instance = undefined;
        const b = PlatformBridge.getInstance();
        const caps = b.getCapabilities();
        expect(caps.platform).toBe(tc.expectedPlatform);
        expect(caps.deviceType).toBe(tc.expectedDevice);
      }

      // Battery API monitoring
      let levelCallback: (() => void) | null = null;
      let chargeCallback: (() => void) | null = null;
      const mockBattery = {
        level: 0.15,
        isCharging: false,
        addEventListener: vi.fn((event: string, cb: () => void) => {
          if (event === 'levelchange') levelCallback = cb;
          if (event === 'chargingchange') chargeCallback = cb;
        }),
      };
      (navigator as any).getBattery = vi.fn().mockResolvedValue(mockBattery);

      (PlatformBridge as any).instance = undefined;
      const batteryBridge = PlatformBridge.getInstance();
      await Promise.resolve(); // flush microtasks

      expect(mockBattery.addEventListener).toHaveBeenCalledWith('levelchange', expect.any(Function));
      expect(mockBattery.addEventListener).toHaveBeenCalledWith('chargingchange', expect.any(Function));

      if (levelCallback) (levelCallback as any)();
      if (chargeCallback) (chargeCallback as any)();
      expect(batteryBridge.getCapabilities().battery.isLowPowerMode).toBe(true);

      // Battery API rejection
      (navigator as any).getBattery = vi.fn().mockRejectedValue(new Error('unsupported'));
      (PlatformBridge as any).instance = undefined;
      expect(() => PlatformBridge.getInstance()).not.toThrow();

      // Lifecycle listener error isolation
      const errBridge = PlatformBridge.getInstance();
      errBridge.onLifecycleChange(() => {
        throw new Error('Listener error test');
      });
      expect(() => errBridge.setLifecycleState('hidden')).not.toThrow();
      expect(errBridge.getLifecycleState()).toBe('hidden');

      // Fullscreen edge cases: target element without requestFullscreen
      const dummyElem = document.createElement('div');
      (dummyElem as any).requestFullscreen = undefined;
      const fsRes = await errBridge.toggleFullscreen(dummyElem);
      expect(fsRes).toBe(false);

      // Fullscreen error handling
      dummyElem.requestFullscreen = vi.fn().mockRejectedValue(new Error('Fullscreen rejected'));
      const fsErrRes = await errBridge.toggleFullscreen(dummyElem);
      expect(fsErrRes).toBe(false);

      // exitFullscreen throw branch (line 223)
      (document as any).fullscreenElement = document.documentElement;
      (document as any).exitFullscreen = vi.fn().mockRejectedValue(new Error('exit fullscreen failure'));
      const exitThrowRes = await errBridge.toggleFullscreen();
      expect(exitThrowRes).toBe(false);

      // visibilitychange hidden branches (lines 137-138)
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
      expect(errBridge.getLifecycleState()).toBe('hidden');

      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
      expect(errBridge.getLifecycleState()).toBe('active');

      // Haptic missing vibrate
      const origVibrate = (navigator as any).vibrate;
      delete (navigator as any).vibrate;
      expect(errBridge.triggerHaptic(20)).toBe(false);
      (navigator as any).vibrate = origVibrate;
    });
  });

  describe('9.2 & 9.4 — CanvasRenderer Geometry, Sprites & Fallbacks', () => {
    it('exercises drawImage, drawSprite, and drawContactShadow branches', () => {
      const mockImage = document.createElement('canvas');
      
      // drawImage 3 args and 5 args
      expect(() => renderer.drawImage(mockImage, 10, 20)).not.toThrow();
      expect(() => renderer.drawImage(mockImage, 10, 20, 100, 200)).not.toThrow();

      // drawImage exception fallback
      const brokenImage: any = null;
      expect(() => renderer.drawImage(brokenImage, 0, 0)).not.toThrow();

      // drawSprite missing texture branch
      expect(() => renderer.drawSprite('NON_EXISTENT_TEXTURE_KEY', 100, 100, 64, 64)).not.toThrow();

      // drawSprite with valid mock texture
      const testCanvas = document.createElement('canvas');
      testCanvas.width = 32;
      testCanvas.height = 32;
      (AssetManager.getInstance() as any).textures.set('TEST_SPRITE', testCanvas);

      expect(() => renderer.drawSprite('TEST_SPRITE', 150, 150, 64, 64, Math.PI / 4, 0.8)).not.toThrow();
      expect(() => renderer.drawSprite('TEST_SPRITE', 150, 150, 64, 64, 0, 1.0)).not.toThrow();

      // drawContactShadow
      expect(() => renderer.drawContactShadow(200, 300, 40, 20, 0.6)).not.toThrow();
      expect(() => renderer.drawMandala(200, 300, 50, 8, 0, '#FFD166')).not.toThrow();
    });
  });

  describe('9.2, 9.3 & 9.5 — StoryCampaignScene Deep Execution & Branch Coverage', () => {
    it('executes the full StoryCampaignScene lifecycle, combat, interaction, and act transitions', () => {
      const scene = new StoryCampaignScene();
      scene.onEnter(engine);
      expect(scene.id).toBe('StoryCampaignScene');

      // 1. Initial State & Render
      scene.update(0.1);
      expect(() => scene.render(renderer)).not.toThrow();

      // 2. Modals toggling: Skip opening cinematic first, then open Pause modal
      input.triggerVirtualAction('PAUSE');
      scene.handleInput(input);

      input.postUpdate();
      input.triggerVirtualAction('PAUSE');
      scene.handleInput(input);
      expect(scene.pauseModal.isOpen()).toBe(true);

      // Close pause modal and reset isPaused
      scene.pauseModal.close();
      scene.isPaused = false;
      input.postUpdate();

      // Open codex modal
      (input as any).keysJustPressed = new Set(['KeyO']);
      scene.handleInput(input);
      expect(scene.codexModal.isOpen()).toBe(true);
      scene.codexModal.close();
      input.postUpdate();

      // 3. Proximity Prompts & Objectives
      // Near Sun Altar
      scene.player.position = new Vector2D(scene.altar.position.x + 10, scene.altar.position.y);
      scene.update(0.1);
      expect(scene.productionHUD).toBeDefined();

      // Near Vanara Scout Kapi
      scene.player.position = new Vector2D(scene.vanaraScout.position.x + 10, scene.vanaraScout.position.y);
      scene.update(0.1);

      // Near Resonance Pillar Om
      scene.player.position = new Vector2D(scene.pillarOm.position.x + 10, scene.pillarOm.position.y);
      scene.update(0.1);

      // 4. Combat mechanics: Weapon Swap, Dash, Guard, Melee
      input.triggerVirtualAction('SWAP_WEAPON');
      scene.handleInput(input);
      expect(scene.player.getActiveWeaponStats().type).toBe('PRANA_GLAIVE');

      scene.update(0.25);
      input.postUpdate();
      input.triggerVirtualAction('SWAP_WEAPON');
      scene.handleInput(input);
      expect(scene.player.getActiveWeaponStats().type).toBe('AGNI_CHAKRAM');

      // Dash
      input.postUpdate();
      input.triggerVirtualAction('DASH');
      scene.handleInput(input);

      // Guard
      input.postUpdate();
      (input as any).keysHeld = new Set(['KeyC']);
      scene.handleInput(input);
      expect(scene.player.isGuarding).toBe(true);

      (input as any).keysHeld = new Set();
      scene.handleInput(input);
      expect(scene.player.isGuarding).toBe(false);

      // Melee attack hitting Sentinel and defeating it
      input.postUpdate();
      scene.player.position = new Vector2D(scene.sentinels[0].position.x - 30, scene.sentinels[0].position.y);
      scene.sentinels[0].health = 10;
      input.triggerVirtualAction('ATTACK');
      scene.handleInput(input);
      expect(scene.sentinels[0].isActive).toBe(false);

      // Melee attack hitting Stone Rakshasa Sthula (stagger & defeat)
      if (scene.stoneRakshasa) {
        scene.update(0.35);
        scene.player.position = new Vector2D(scene.stoneRakshasa.position.x - 30, scene.stoneRakshasa.position.y);
        scene.stoneRakshasa.poise.current = 10;
        input.postUpdate();
        input.triggerVirtualAction('ATTACK');
        scene.handleInput(input);

        // Finish cinematic/dialogue triggered by encounter
        if (scene.cinematicDirector.isPlaying()) {
          scene.cinematicDirector.finishSequence();
        }
        if (scene.dialogueTree.isActive()) {
          scene.dialogueTree.finish();
        }

        // Lethal hit to Sthula
        scene.player.meleeCooldownTimer = 0;
        scene.player.attackState = 'IDLE';
        scene.player.energy = 100;
        scene.stoneRakshasa.health = 5;
        scene.player.position = new Vector2D(scene.stoneRakshasa.position.x - 20, scene.stoneRakshasa.position.y);
        input.postUpdate();
        input.triggerVirtualAction('ATTACK');
        scene.handleInput(input);
        expect(scene.stoneRakshasa.isActive).toBe(false);
      }

      // Melee attack hitting Pillar Om
      scene.update(0.35);
      scene.player.position = new Vector2D(scene.pillarOm.position.x - 20, scene.pillarOm.position.y);
      input.postUpdate();
      input.triggerVirtualAction('ATTACK');
      scene.handleInput(input);
      expect(scene.pillarOm.state).toBe('attuned');

      // Melee attack hitting Pillar Krim
      scene.update(0.35);
      scene.player.position = new Vector2D(scene.pillarKrim.position.x - 20, scene.pillarKrim.position.y);
      input.postUpdate();
      input.triggerVirtualAction('ATTACK');
      scene.handleInput(input);
      expect(scene.pillarKrim.state).toBe('attuned');

      // Special Attack (Digit1 / SPECIAL_ATTACK)
      scene.player.energy = 60;
      input.postUpdate();
      input.triggerVirtualAction('SPECIAL_ATTACK');
      scene.handleInput(input);

      // Ranged Attack (MELEE_ATTACK / shootBurst)
      input.postUpdate();
      input.triggerVirtualAction('MELEE_ATTACK');
      scene.handleInput(input);
      expect((scene as any).playerProjectiles.length).toBeGreaterThan(0);

      // Interact with altar when shards < 3 (checkCanInteract returns false)
      scene.player.position = new Vector2D(scene.altar.position.x, scene.altar.position.y + 20);
      (input as any).keysJustPressed = new Set(['KeyE']);
      scene.handleInput(input);
      expect(scene.altar.state).not.toBe('consecrated');

      // Direct handleInteract invocation when player near altar with < 3 shards
      (scene as any).handleInteract();

      // Direct handleInteract invocation when player near Kapi
      scene.player.position = new Vector2D(scene.vanaraScout.position.x, scene.vanaraScout.position.y + 30);
      (scene as any).handleInteract();
      if (scene.cinematicDirector.isPlaying()) {
        scene.cinematicDirector.finishSequence();
      }

      // Direct handleInteract invocation when player near Sthula
      if (scene.stoneRakshasa) {
        scene.stoneRakshasa.isActive = true;
        scene.player.position = new Vector2D(scene.stoneRakshasa.position.x, scene.stoneRakshasa.position.y + 30);
        (scene as any).handleInteract();
        if (scene.cinematicDirector.isPlaying()) {
          scene.cinematicDirector.finishSequence();
        }
      }

      // 5. Collect all 3 Astra Shards
      for (const shard of scene.shards) {
        scene.player.position = shard.position.clone();
        scene.player.syncBounds();
        scene.update(0.1);
        expect(shard.isCollected).toBe(true);
      }
      expect(scene.player.shardsCollected).toBe(3);

      // Consecrate Altar -> Transition to Act 2
      scene.player.position = new Vector2D(scene.altar.position.x, scene.altar.position.y + 40);
      (input as any).keysJustPressed = new Set(['KeyE']);
      scene.handleInput(input);
      expect(scene.altar.state).toBe('consecrated');

      // 6. Dialogue interaction with Vanara Scout Kapi
      scene.player.position = new Vector2D(scene.vanaraScout.position.x, scene.vanaraScout.position.y + 50);
      (input as any).keysJustPressed = new Set(['KeyE']);
      scene.handleInput(input);

      // Advance dialogue with Space key
      (input as any).keysJustPressed = new Set(['Space']);
      scene.handleInput(input);

      // 7. Sthula encounter interaction
      if (scene.stoneRakshasa) {
        scene.player.position = new Vector2D(scene.stoneRakshasa.position.x, scene.stoneRakshasa.position.y + 50);
        (input as any).keysJustPressed = new Set(['KeyE']);
        scene.handleInput(input);
      }

      // 8. Transition to Act 3 and defeat Chapter
      (scene as any).transitionToAct3();
      expect(scene.boss).toBeDefined();
      expect(scene.boss?.isActive).toBe(true);

      // Finish awakening cinematic sequence to unpause gameplay simulation
      if (scene.cinematicDirector.isPlaying()) {
        scene.cinematicDirector.finishSequence();
      }

      // Boss charge impact against guarding and unguarding player
      if (scene.boss) {
        scene.boss.isCharging = true;
        scene.boss.chargeWindupTimer = 0;
        scene.boss.bounds = scene.player.bounds;
        scene.player.isGuarding = true;
        scene.update(0.016);
        scene.player.isGuarding = false;
        scene.update(0.016);

        // Melee hit against staggered boss
        scene.player.position = new Vector2D(scene.boss.position.x - 20, scene.boss.position.y);
        scene.boss.poise.isStaggered = true;
        input.postUpdate();
        input.triggerVirtualAction('ATTACK');
        scene.handleInput(input);
      }

      // Enemy projectile deflect (parry window active)
      const pDeflect = new Projectile('ep_deflect', scene.player.position.x, scene.player.position.y, new Vector2D(0, 1), 20, 'ENEMY');
      pDeflect.damage = 10;
      (scene as any).enemyProjectiles.push(pDeflect);
      scene.player.parryWindowTimer = 0.2;
      scene.update(0.016);

      // Enemy projectile block with guard
      const pBlock = new Projectile('ep_block', scene.player.position.x, scene.player.position.y, new Vector2D(0, 1), 20, 'ENEMY');
      pBlock.damage = 10;
      (scene as any).enemyProjectiles.push(pBlock);
      scene.player.parryWindowTimer = 0;
      scene.player.isGuarding = true;
      scene.update(0.016);

      // Enemy projectile unshielded hit
      const pHit = new Projectile('ep_hit', scene.player.position.x, scene.player.position.y, new Vector2D(0, 1), 20, 'ENEMY');
      pHit.damage = 10;
      (scene as any).enemyProjectiles.push(pHit);
      scene.player.isGuarding = false;
      scene.update(0.016);

      // Player projectile hitting Sentinel (lethal)
      scene.sentinels[0].isActive = true;
      scene.sentinels[0].health = 5;
      const pSen = new Projectile('pp_sen', scene.sentinels[0].bounds.x + 5, scene.sentinels[0].bounds.y + 5, new Vector2D(0, 1), 0);
      pSen.damage = 25;
      (scene as any).playerProjectiles.push(pSen);
      scene.update(0.016);

      // Player projectile hitting Sthula (lethal)
      if (scene.stoneRakshasa) {
        scene.stoneRakshasa.isActive = true;
        scene.stoneRakshasa.health = 5;
        const pSthula = new Projectile('pp_sthula', scene.stoneRakshasa.bounds.x + 5, scene.stoneRakshasa.bounds.y + 5, new Vector2D(0, 1), 0);
        pSthula.damage = 25;
        (scene as any).playerProjectiles.push(pSthula);
        scene.update(0.016);
      }

      // Player projectile hitting Boss (lethal -> victory)
      if (scene.boss) {
        scene.boss.isActive = true;
        scene.boss.health = 5;
        const pBoss = new Projectile('pp_boss', scene.boss.bounds.x + 5, scene.boss.bounds.y + 5, new Vector2D(0, 1), 0);
        pBoss.damage = 25;
        (scene as any).playerProjectiles.push(pBoss);
        scene.update(0.016);
        expect((scene as any).isChapterComplete).toBe(true);
      }

      // Render with all Act 3 entities and boss
      scene.update(0.1);
      expect(() => scene.render(renderer)).not.toThrow();

      // Render quest log modal
      (scene as any).showQuestLog = true;
      expect(() => scene.render(renderer)).not.toThrow();
      (scene as any).showQuestLog = false;

      // Trigger chapter victory
      (scene as any).handleChapterVictory();
      expect((scene as any).isChapterComplete).toBe(true);

      // Verify save state persistence
      const savedState = SaveGameManager.load();
      expect(savedState.unlockedRealms).toContain('RealmOfBhumi');

      // 9. Player lethal damage & Game Over
      scene.cinematicDirector.finishSequence();
      scene.dialogueTree.finish();
      (scene as any).isChapterComplete = false;
      scene.player.health = 0;
      scene.update(0.1);
      expect((scene as any).isGameOver).toBe(true);
      expect(() => scene.render(renderer)).not.toThrow();

      // 10. Direct invocation of StoryCampaign overlays & HUDs
      (scene as any).isGameOver = false;
      (scene as any).isChapterComplete = false;
      scene.isPaused = false;
      const ctx = renderer.getContext();
      (scene as any).renderVictoryOverlay(ctx);
      (scene as any).renderDefeatOverlay(ctx);
      (scene as any).renderCheckpoint(ctx);
      (scene as any).renderQuestHUD(ctx);

      // 11. Modal pointer interactions and dismissal in StoryCampaignScene
      const vp = engine.getRenderer().getViewport();
      scene.settingsModal.open(vp.width, vp.height);
      (input as any).mousePosition = new Vector2D(vp.width / 2, vp.height / 2);
      (input as any).virtualActionJustPressed = new Set(['ATTACK']);
      scene.handleInput(input);
      (input as any).virtualActionJustReleased = new Set(['ATTACK']);
      scene.handleInput(input);
      (input as any).virtualActionJustPressed = new Set(['PAUSE']);
      scene.handleInput(input);
      expect(scene.settingsModal.isOpen()).toBe(false);

      scene.codexModal.open(vp.width, vp.height);
      (input as any).virtualActionJustPressed = new Set(['ATTACK']);
      scene.handleInput(input);
      (input as any).virtualActionJustReleased = new Set(['ATTACK']);
      scene.handleInput(input);
      (input as any).keysJustPressed = new Set(['KeyO']);
      scene.handleInput(input);
      expect(scene.codexModal.isOpen()).toBe(false);

      scene.pauseModal.open(vp.width, vp.height);
      (input as any).virtualActionJustPressed = new Set(['ATTACK']);
      scene.handleInput(input);
      (input as any).virtualActionJustReleased = new Set(['ATTACK']);
      scene.handleInput(input);
      (input as any).virtualActionJustPressed = new Set(['PAUSE']);
      scene.handleInput(input);
      expect(scene.pauseModal.isOpen()).toBe(false);

      // 12. Dialogue tree choice keys (1, 2, 3) and pointer
      input.postUpdate();
      scene.dialogueTree.isWaitingForChoice = vi.fn().mockReturnValue(true);
      scene.dialogueTree.selectChoice = vi.fn();
      scene.dialogueTree.handlePointerDown = vi.fn().mockReturnValue(true);

      (input as any).mouseButtonsJustPressed = new Set([0]);
      scene.handleInput(input);
      expect(scene.dialogueTree.handlePointerDown).toHaveBeenCalled();

      input.postUpdate();
      (input as any).keysJustPressed = new Set(['Digit1']);
      scene.handleInput(input);
      expect(scene.dialogueTree.selectChoice).toHaveBeenCalledWith(0);

      input.postUpdate();
      (input as any).keysJustPressed = new Set(['Digit2']);
      scene.handleInput(input);
      expect(scene.dialogueTree.selectChoice).toHaveBeenCalledWith(1);

      input.postUpdate();
      (input as any).keysJustPressed = new Set(['Digit3']);
      scene.handleInput(input);
      expect(scene.dialogueTree.selectChoice).toHaveBeenCalledWith(2);

      // 13. Campaign victory and gameover restart / menu navigation
      input.postUpdate();
      (scene as any).isChapterComplete = true;
      (input as any).keysJustPressed = new Set(['KeyR']);
      scene.handleInput(input);
      expect((scene as any).isChapterComplete).toBe(false);

      (scene as any).isChapterComplete = true;
      (input as any).keysJustPressed = new Set(['KeyM']);
      scene.handleInput(input);
      expect(engine.getSceneManager().getCurrentScene()?.id).toBe('SplashScene');

      // 14. Paused state navigation to Splash
      scene.isPaused = true;
      (input as any).keysJustPressed = new Set(['KeyM']);
      scene.handleInput(input);
      expect(engine.getSceneManager().getCurrentScene()?.id).toBe('SplashScene');

      // Clean exit
      scene.onExit();
    });
  });

  describe('9.2 & 9.5 — BhumiTempleScene Melee, Resonance & Overlays', () => {
    it('exercises BhumiTempleScene combat arcs, pillars, and lifecycle', () => {
      const temple = new BhumiTempleScene();
      temple.onEnter(engine);
      expect(temple.id).toBe('BhumiTempleScene');

      temple.update(0.1);
      expect(() => temple.render(renderer)).not.toThrow();

      // Pause toggle
      input.triggerVirtualAction('PAUSE');
      temple.handleInput(input);
      expect(temple.isPaused).toBe(true);

      input.postUpdate();
      input.triggerVirtualAction('PAUSE');
      temple.handleInput(input);
      expect(temple.isPaused).toBe(false);

      // Melee attack hitting scout
      if (temple.scouts.length > 0) {
        temple.player.position = temple.scouts[0].position.clone();
        input.triggerVirtualAction('ATTACK');
        temple.handleInput(input);
      }

      // Melee attack hitting rakshasa
      if (temple.rakshasa) {
        temple.player.position = temple.rakshasa.position.clone();
        input.postUpdate();
        input.triggerVirtualAction('ATTACK');
        temple.handleInput(input);
      }

      // Melee attack hitting pillar
      if (temple.pillars.length > 0) {
        temple.player.position = temple.pillars[0].position.clone();
        input.postUpdate();
        input.triggerVirtualAction('ATTACK');
        temple.handleInput(input);
      }

      // Player projectile collisions against dormant pillar
      if (temple.pillars.length > 0) {
        const pPillar = new Projectile('p_pillar', temple.pillars[0].bounds.x + 5, temple.pillars[0].bounds.y + 5, new Vector2D(0, 1), 0);
        (temple as any).playerProjectiles.push(pPillar);
        temple.update(0.016);
      }

      // Player projectile against shielded and unshielded spire
      (temple as any).spire.isShielded = true;
      const pSpireShield = new Projectile('p_sp1', (temple as any).spire.bounds.x + 5, (temple as any).spire.bounds.y + 5, new Vector2D(0, 1), 0);
      (temple as any).playerProjectiles.push(pSpireShield);
      temple.update(0.016);

      (temple as any).spire.isShielded = false;
      (temple as any).spire.health = 5;
      const pSpireKill = new Projectile('p_sp2', (temple as any).spire.bounds.x + 5, (temple as any).spire.bounds.y + 5, new Vector2D(0, 1), 0);
      pSpireKill.damage = 25;
      (temple as any).playerProjectiles.push(pSpireKill);
      temple.update(0.016);

      // Player projectile hitting scout (lethal)
      if (temple.scouts.length > 0) {
        temple.scouts[0].health = 5;
        const pScout = new Projectile('p_sc', temple.scouts[0].bounds.x + 5, temple.scouts[0].bounds.y + 5, new Vector2D(0, 1), 0);
        pScout.damage = 25;
        (temple as any).playerProjectiles.push(pScout);
        temple.update(0.016);
      }

      // Player projectile hitting rakshasa (lethal)
      if (temple.rakshasa) {
        temple.rakshasa.health = 5;
        const pRak = new Projectile('p_rk', temple.rakshasa.bounds.x + 5, temple.rakshasa.bounds.y + 5, new Vector2D(0, 1), 0);
        pRak.damage = 25;
        (temple as any).playerProjectiles.push(pRak);
        temple.update(0.016);
      }

      // Enemy projectile hitting player
      const pEp = new Projectile('p_ep', temple.player.position.x, temple.player.position.y, new Vector2D(0, 1), 20, 'ENEMY');
      pEp.damage = 10;
      (temple as any).enemyProjectiles.push(pEp);
      temple.update(0.016);

      // Victory and Defeat renders
      temple.isVictory = true;
      expect(() => temple.render(renderer)).not.toThrow();

      temple.isVictory = false;
      temple.isGameOver = true;
      expect(() => temple.render(renderer)).not.toThrow();

      temple.onExit();
    });
  });

  describe('9.2 & 9.5 — BossEncounterScene Full Phases, HUD & Deflection Flow', () => {
    it('exercises BossEncounterScene phases, roars, and transitions', () => {
      const bossScene = new BossEncounterScene();
      bossScene.onEnter(engine);
      expect(bossScene.id).toBe('BossEncounterScene');

      // Update and render
      bossScene.update(0.1);
      expect(() => bossScene.render(renderer)).not.toThrow();

      // Pause toggle
      input.triggerVirtualAction('PAUSE');
      bossScene.handleInput(input);
      expect((bossScene as any).isPaused).toBe(true);

      // Unpause
      input.postUpdate();
      input.triggerVirtualAction('PAUSE');
      bossScene.handleInput(input);
      expect((bossScene as any).isPaused).toBe(false);

      // Damage boss into Phase 2 (70% HP)
      const boss = (bossScene as any).boss;
      if (boss) {
        boss.takeDamage(boss.maxHealth * 0.35);
        bossScene.update(0.2);
        expect(boss.phase).toBe(2);

        // Damage boss into Phase 3 (30% HP)
        boss.takeDamage(boss.maxHealth * 0.45);
        bossScene.update(0.2);
        expect(boss.phase).toBe(3);

        // Lethal damage to boss
        (bossScene as any).handleBossDefeated();
        expect(boss.isActive).toBe(false);
        expect((bossScene as any).isVictory).toBe(true);

        expect(() => bossScene.render(renderer)).not.toThrow();
      }

      bossScene.onExit();
    });

    it('exercises BossEncounterScene combos, parries, projectile deflections, and overlays', () => {
      const bossScene = new BossEncounterScene();
      bossScene.onEnter(engine);

      // 1. Combo Status branches in renderBossHUD: hit 0, hit 1, hit 2
      const ctx = renderer.getContext();
      (bossScene as any).player.comboIndex = 0;
      (bossScene as any).player.energy = 50;
      (bossScene as any).renderBossHUD(ctx);

      (bossScene as any).player.comboIndex = 1;
      (bossScene as any).player.energy = 10; // EP < 30 (Special not ready)
      (bossScene as any).renderBossHUD(ctx);

      (bossScene as any).player.comboIndex = 2; // Finisher ready
      (bossScene as any).player.parryWindowTimer = 0.2; // Perfect parry active
      (bossScene as any).renderBossHUD(ctx);

      (bossScene as any).player.parryWindowTimer = 0;
      (bossScene as any).player.isGuarding = true;
      (bossScene as any).renderBossHUD(ctx);

      // 2. Victory Overlays with different ranks (S, A, B)
      (bossScene as any).damageTakenTotal = 40;
      (bossScene as any).renderVictoryOverlay(ctx);

      (bossScene as any).damageTakenTotal = 120;
      (bossScene as any).renderVictoryOverlay(ctx);

      (bossScene as any).damageTakenTotal = 250;
      (bossScene as any).renderVictoryOverlay(ctx);

      // 3. Victory input handling: KeyR resets encounter, KeyM switches to SplashScene
      (bossScene as any).isVictory = true;
      (input as any).keysJustPressed = new Set(['KeyR']);
      bossScene.handleInput(input);
      expect((bossScene as any).isVictory).toBe(false);

      (bossScene as any).isVictory = true;
      (input as any).keysJustPressed = new Set(['KeyM']);
      bossScene.handleInput(input);
      expect(engine.getSceneManager().getCurrentScene()?.id).toBe('SplashScene');

      // 4. Defeat Overlay & Handling
      bossScene.onEnter(engine);
      (bossScene as any).isGameOver = true;
      (bossScene as any).renderDefeatOverlay(ctx);

      (input as any).keysJustPressed = new Set(['KeyR']);
      bossScene.handleInput(input);
      expect((bossScene as any).isGameOver).toBe(false);

      // 5. Projectile deflection with Perfect Parry
      const proj = new Projectile(
        'enemy_proj',
        bossScene.player.position.x,
        bossScene.player.position.y,
        new Vector2D(1, 0),
        100,
        'ENEMY'
      );
      (bossScene as any).enemyProjectiles.push(proj);
      bossScene.player.parryWindowTimer = 0.3;
      bossScene.update(0.016);
      expect((bossScene as any).parriesPerformed).toBeGreaterThan(0);

      // 6. Direct hit while dodging vs hit
      bossScene.player.parryWindowTimer = 0;
      bossScene.player.isGuarding = false;
      const sw = {
        position: new Vector2D(bossScene.player.position.x - 5, bossScene.player.position.y),
        damage: 30,
        isActive: true,
        update: vi.fn(),
        checkPlayerHit: vi.fn((_pos: Vector2D, isDashing: boolean) => !isDashing),
      };
      (bossScene as any).shockwaves.push(sw);
      bossScene.player.isDashing = false;
      bossScene.update(0.016);
      expect((bossScene as any).damageTakenTotal).toBeGreaterThan(0);

      // 7. Melee strike hitting Vanguards
      const vanguard = (bossScene as any).vanguards[0];
      if (vanguard) {
        vanguard.position = new Vector2D(bossScene.player.position.x + 20, bossScene.player.position.y);
        vanguard.health = 10;
        const meleeArc = {
          center: bossScene.player.position.clone(),
          radius: 80,
          angle: 0,
          spread: Math.PI,
          damage: 50,
          poiseDamage: 50,
          isShieldBreak: true,
        };
        (bossScene as any).handlePlayerMeleeStrike(meleeArc, true);
        expect(vanguard.health).toBeLessThanOrEqual(0);
      }

      bossScene.onExit();
    });
  });

  describe('9.2 & 9.5 — SplashScene Navigation & SceneManager Stack', () => {
    it('exercises SplashScene keyboard navigation and SceneManager navigation stack', () => {
      const splash = new SplashScene();
      splash.onEnter(engine);

      // Keyboard menu navigation
      (input as any).keysJustPressed = new Set(['ArrowDown']);
      splash.handleInput(input);

      (input as any).keysJustPressed = new Set(['ArrowUp']);
      splash.handleInput(input);

      // Toggle dev workspace drawer
      (input as any).keysJustPressed = new Set(['F1']);
      splash.handleInput(input);
      expect((splash as any).isDevModeOpen).toBe(true);

      (input as any).keysJustPressed = new Set(['F1']);
      splash.handleInput(input);
      expect((splash as any).isDevModeOpen).toBe(false);

      // Open codex modal from Splash
      (input as any).keysJustPressed = new Set(['KeyO']);
      splash.handleInput(input);
      expect((splash as any).codexModal.isOpen()).toBe(true);
      (splash as any).codexModal.close();

      splash.onExit();

      // SceneManager stack operations
      const sm = engine.getSceneManager();
      const initialSceneCount = sm.getAllSceneIds().length;
      expect(initialSceneCount).toBeGreaterThan(0);

      // Push and pop navigation stack
      sm.switchTo('SplashScene');
      expect(sm.getCurrentScene()?.id).toBe('SplashScene');

      sm.pushScene('SettingsScene');
      expect(sm.getCurrentScene()?.id).toBe('SettingsScene');

      sm.popScene();
      expect(sm.getCurrentScene()?.id).toBe('SplashScene');
    });

    it('exercises SplashScene dev drawer interactions and main menu clicks', () => {
      const splash = new SplashScene();
      splash.onEnter(engine);

      const vp = engine.getRenderer().getViewport();

      // Click Dev Mode toggle button (top right)
      (input as any).mouseButtonsJustPressed = new Set([0]);
      (input as any).mousePosition = new Vector2D(vp.width - 50, 25);
      splash.handleInput(input);
      expect((splash as any).isDevModeOpen).toBe(true);

      // Click Dev drawer item (itemIdx = 0 -> StoryScene)
      const dwX = vp.width - 280 - 16;
      const dwY = 16 + 26 + 8;
      (input as any).mouseButtonsJustPressed = new Set([0]);
      (input as any).mousePosition = new Vector2D(dwX + 50, dwY + 45); // item 0
      splash.handleInput(input);
      expect(engine.getSceneManager().getCurrentScene()?.id).toBe('StoryScene');

      // Switch back to Splash
      engine.getSceneManager().switchTo('SplashScene');
      const splash2 = engine.getSceneManager().getCurrentScene() as SplashScene;
      (splash2 as any).isDevModeOpen = true;

      // Click Dev drawer item 5 (StoryCampaignScene)
      (input as any).mouseButtonsJustPressed = new Set([0]);
      (input as any).mousePosition = new Vector2D(dwX + 50, dwY + 36 + 5 * 24 + 10);
      splash2.handleInput(input);
      expect(engine.getSceneManager().getCurrentScene()?.id).toBe('StoryCampaignScene');

      // Click main menu item via hoveredIndex
      engine.getSceneManager().switchTo('SplashScene');
      const splash3 = engine.getSceneManager().getCurrentScene() as SplashScene;
      const startY = vp.height / 2 + 54;
      const codexBtnY = startY + 5 * (32 + 8) + 16;
      (input as any).mouseButtonsJustPressed = new Set([0]);
      (input as any).mousePosition = new Vector2D(vp.width / 2 + 165, codexBtnY);
      splash3.handleInput(input);
      expect((splash3 as any).codexModal.isOpen()).toBe(true);
      (splash3 as any).codexModal.close();

      splash3.onExit();
    });

    it('exercises SceneManager fallback navigation and lifecycle disposal errors', () => {
      const sm = engine.getSceneManager();
      sm.clearHistory();

      // Navigate back with empty stack and fallback
      expect(sm.getPreviousScene()).toBeNull();
      const navSuccess = sm.navigateBack('SplashScene');
      expect(navSuccess).toBe(true);
      expect(sm.getCurrentScene()?.id).toBe('SplashScene');

      // Navigate back with invalid fallback
      sm.clearHistory();
      const navFail = sm.navigateBack('NON_EXISTENT_SCENE');
      expect(navFail).toBe(false);

      // Dispose with error throwing scene
      const errorScene = {
        id: 'ErrorScene',
        onEnter: vi.fn(),
        onExit: vi.fn(),
        update: vi.fn(),
        render: vi.fn(),
        handleInput: vi.fn(),
        onDispose: vi.fn(() => {
          throw new Error('Dispose test error');
        }),
      };
      sm.register(errorScene as any);
      expect(() => sm.dispose()).not.toThrow();
    });
  });

  describe('9.4 & 9.5 — Production UI Components, HUD, Dialogue & Touch Controls', () => {
    it('exercises ProductionHUD combo multipliers and pointer interactions', () => {
      const hud = new ProductionHUD();

      // Combo increments and multipliers
      hud.registerHit();
      hud.registerHit();
      hud.registerHit();
      hud.registerHit();
      expect((hud as any).comboCount).toBe(4);
      expect((hud as any).comboMultiplier).toBeGreaterThan(1.0);

      // Render combo badge in normal contrast
      AccessibilityManager.getInstance().updateSettings({ highContrast: false });
      expect(() => hud.render(renderer, { health: 100, maxHealth: 100, energy: 50, maxEnergy: 100, shardsCollected: 2 } as any, 'Find the Sun Altar')).not.toThrow();

      // Render combo badge in high contrast
      AccessibilityManager.getInstance().updateSettings({ highContrast: true });
      expect(() => hud.render(renderer, { health: 100, maxHealth: 100, energy: 50, maxEnergy: 100, shardsCollected: 2 } as any, 'Find the Sun Altar')).not.toThrow();
      AccessibilityManager.getInstance().updateSettings({ highContrast: false });

      // Reset combo
      hud.resetCombo();
      expect((hud as any).comboCount).toBe(0);
      expect((hud as any).comboMultiplier).toBe(1.0);

      // Pointer click handlers
      let pauseClicked = false;
      let codexClicked = false;
      (hud as any).onPauseClick = () => { pauseClicked = true; };
      (hud as any).onCodexClick = () => { codexClicked = true; };

      (hud as any).pauseButtonBounds = { x: 10, y: 10, width: 40, height: 40 };
      (hud as any).codexButtonBounds = { x: 60, y: 10, width: 40, height: 40 };

      expect(hud.handlePointerDown(new Vector2D(0, 0))).toBe(false);
      expect(hud.handlePointerDown(new Vector2D(25, 25))).toBe(true);
      expect(pauseClicked).toBe(true);

      expect(hud.handlePointerDown(new Vector2D(75, 25))).toBe(true);
      expect(codexClicked).toBe(true);

      expect(hud.handlePointerDown(new Vector2D(500, 500))).toBe(false);
    });

    it('exercises DialogueBox typewriter skip and completion callbacks', () => {
      const box = new DialogueBox();
      let completed = false;
      box.start([
        { speaker: 'Tara', speakerRole: 'Goddess', portraitColor: '#FFD700', text: 'First dialogue node text' },
        { speaker: 'Veer', speakerRole: 'Warrior', portraitColor: '#00E5FF', text: 'Second dialogue node text' },
      ], () => {
        completed = true;
      });

      expect(box.isActive()).toBe(true);

      // Advance while typewriter is progressing -> finishes line instantly
      const skipRes = box.advance();
      expect(skipRes).toBe(true);
      expect((box as any).isFinishedCurrentNode).toBe(true);

      // Advance to second dialogue node
      const nextRes = box.advance();
      expect(nextRes).toBe(true);
      expect((box as any).currentIndex).toBe(1);

      // Finish second line instantly
      box.advance();

      // Finish dialogue
      const endRes = box.advance();
      expect(endRes).toBe(false);
      expect(completed).toBe(true);
      expect(box.isActive()).toBe(false);
    });

    it('exercises VirtualJoystick pointer tracking and button actions', () => {
      const vjoy = new VirtualJoystick(input);
      const root = document.createElement('div');
      document.body.appendChild(root);

      vjoy.mount(root);
      // Double mount test (noop)
      vjoy.mount(root);

      const stickZone = document.getElementById('stick-zone');
      expect(stickZone).toBeDefined();

      if (stickZone) {
        stickZone.getBoundingClientRect = () => ({
          left: 100,
          top: 100,
          width: 140,
          height: 140,
          right: 240,
          bottom: 240,
          x: 100,
          y: 100,
          toJSON: () => {},
        });
        (stickZone as any).setPointerCapture = vi.fn();
        (stickZone as any).releasePointerCapture = vi.fn();

        // Pointer down
        const pDown = new Event('pointerdown') as any;
        pDown.clientX = 170;
        pDown.clientY = 170;
        pDown.pointerId = 1;
        stickZone.dispatchEvent(pDown);

        // Pointer move beyond max radius
        const pMove = new Event('pointermove') as any;
        pMove.clientX = 250;
        pMove.clientY = 250;
        pMove.pointerId = 1;
        stickZone.dispatchEvent(pMove);

        // Pointer up
        const pUp = new Event('pointerup') as any;
        pUp.pointerId = 1;
        stickZone.dispatchEvent(pUp);

        // Pointer cancel
        stickZone.dispatchEvent(new Event('pointerdown'));
        stickZone.dispatchEvent(new Event('pointercancel'));

        // Pointer release throwing capture error (line 131)
        (stickZone as any).releasePointerCapture = vi.fn(() => {
          throw new Error('Capture release error');
        });
        const pUpErr = new Event('pointerup') as any;
        pUpErr.pointerId = 2;
        stickZone.dispatchEvent(pUpErr);
      }

      // Action buttons
      const btnAttack = document.getElementById('btn-attack');
      if (btnAttack) {
        btnAttack.dispatchEvent(new Event('pointerdown'));
        btnAttack.dispatchEvent(new Event('pointerup'));
        btnAttack.dispatchEvent(new Event('pointercancel'));
      }

      vjoy.unmount();
      root.remove();
    });
  });

  describe('9.2 & 9.5 — StoryScene & DialogueTree Visual Portraits', () => {
    it('exercises StoryScene dialogue completion and DialogueTree speaker portraits', () => {
      const story = new StoryScene();
      story.onEnter(engine);
      story.update(0.1);
      expect(() => story.render(renderer)).not.toThrow();

      // INTERACT action advances dialogue
      input.triggerVirtualAction('INTERACT');
      story.handleInput(input);

      // Advance to end of script triggering chapter victory callback (lines 60-61)
      while ((story as any).dialogueBox.isActive()) {
        (story as any).dialogueBox.advance();
      }

      // Exit via KeyQ
      input.postUpdate();
      (input as any).keysJustPressed = new Set(['KeyQ']);
      story.handleInput(input);
      story.onExit();

      // DialogueTree portrait and fallback branches (lines 239-241, 268-269)
      const tree = new DialogueTree();
      tree.registerNodes([
        {
          id: 'sthula_test',
          speaker: 'Stone Rakshasa Sthula',
          speakerRole: 'Sentinel',
          portraitColor: '#EF4444',
          text: 'Halt, mortal! The sacred torana shall not yield!',
        },
        {
          id: 'mahisha_test',
          speaker: 'Titan Mahishasura',
          speakerRole: 'Titan',
          portraitColor: '#7C3AED',
          text: 'The celestial light wanes into eternal eclipse!',
        },
      ]);

      tree.start('sthula_test');
      tree.update(0.1);
      expect(() => tree.render(renderer)).not.toThrow();

      // Render with roundRect missing to exercise line 240
      const ctx = renderer.getContext();
      const origRoundRect = (ctx as any).roundRect;
      delete (ctx as any).roundRect;
      expect(() => tree.render(renderer)).not.toThrow();
      (ctx as any).roundRect = origRoundRect;

      tree.start('mahisha_test');
      tree.update(0.1);
      expect(() => tree.render(renderer)).not.toThrow();

      // DialogueTree pointer hit testing for choices and advance
      const treeChoices = new DialogueTree();
      treeChoices.registerNodes([
        {
          id: 'choice_node',
          speaker: 'Tara',
          speakerRole: 'Goddess',
          portraitColor: '#FFD700',
          text: 'Choose your path:',
          choices: [
            { id: 'c1', text: 'Option A', targetNodeId: 'node_a' },
            { id: 'c2', text: 'Option B', targetNodeId: 'node_b' },
          ],
        },
        {
          id: 'node_a',
          speaker: 'Tara',
          speakerRole: 'Goddess',
          portraitColor: '#FFD700',
          text: 'Path A chosen.',
        },
      ]);
      treeChoices.start('choice_node');
      treeChoices.update(0.1);
      (treeChoices as any).isAwaitingChoice = true;

      // Pointer click outside choice bounds
      expect(treeChoices.handlePointerDown(10, 10, 1280, 720)).toBe(false);

      // Pointer click inside choice 0
      const boxWidth = 840;
      const boxX = (1280 - boxWidth) / 2;
      const choiceStartY = (720 - 150 - 24) - (2 * 38) - 10;
      expect(treeChoices.handlePointerDown(boxX + 50, choiceStartY + 10, 1280, 720)).toBe(true);

      // In node_a (not awaiting choice)
      expect((treeChoices as any).isAwaitingChoice).toBe(false);
      // Click inside dialogue box to advance
      const boxY = 720 - 150 - 24;
      expect(treeChoices.handlePointerDown(boxX + 50, boxY + 50, 1280, 720)).toBe(true);
      // Click outside dialogue box
      expect(treeChoices.handlePointerDown(10, 10, 1280, 720)).toBe(false);
    });
  });

  describe('9.4 & 9.5 — Camera Bounds, FocusManager & Splash Codex Branches', () => {
    it('exercises Camera fitToBounds and shake variations', () => {
      const cam = new Camera(1280, 720);
      // fitToBounds with object and custom padding
      cam.fitToBounds({ x: 100, y: 100, width: 400, height: 300 }, 50);
      expect(cam.getPosition().x).toBe(300);
      expect(cam.getPosition().y).toBe(250);

      // fitToBounds with numbers (minX, minY, maxX, maxY, padding)
      cam.fitToBounds(50, 50, 450, 350, 20);
      expect(cam.getPosition().x).toBe(250);

      // fitToBounds with default fallback numbers
      cam.fitToBounds(10);
      expect(cam.getPosition().x).toBe(10);

      // Camera shake and update decay
      cam.shake(10, 0.5);
      cam.update(0.1);
      expect(cam.shakeOffset.magnitudeSquared()).toBeGreaterThanOrEqual(0);
      cam.update(1.0); // timer expired
      expect(cam.shakeOffset.x).toBeCloseTo(0);
      expect(cam.shakeOffset.y).toBeCloseTo(0);

      // Target following
      const target = new Vector2D(500, 500);
      cam.setTarget(target);
      cam.update(0.1);
      expect(cam.getPosition().x).toBeGreaterThan(10);
    });

    it('exercises FocusManager spatial traversal, activation, and blur callbacks', () => {
      const fm = new FocusManager();
      let changedTo: any = 'init';
      fm.onFocusChange = (item) => { changedTo = item; };

      // Register items
      let activated: any = null;
      fm.onActivate = (item) => { activated = item; };
      const item1 = { id: 'btn_1', tabIndex: 0, isFocused: false, bounds: { x: 0, y: 0, width: 60, height: 25 }, onActivate: vi.fn() };
      const itemDisabled = { id: 'btn_dis', tabIndex: 1, isFocused: false, bounds: { x: 80, y: 0, width: 60, height: 25 }, isDisabled: true };
      const item2 = { id: 'btn_2', tabIndex: 2, isFocused: false, bounds: { x: 160, y: 0, width: 60, height: 25 } };

      fm.register(item1);
      fm.register(itemDisabled);
      fm.register(item2);

      // setFocusIndex(0) invokes callback with item1
      fm.setFocusIndex(0);
      expect(changedTo).toBe(item1);

      // setFocusIndex(-1) invokes callback with null
      fm.setFocusIndex(-1);
      expect(changedTo).toBeNull();

      // Activation callbacks
      fm.setFocusIndex(0);
      expect(fm.activateFocused()).toBe(true);
      expect(item1.onActivate).toHaveBeenCalled();
      expect(activated).toBe(item1);

      // focusNext skips disabled item and wraps around
      fm.focusNext();
      expect(fm.getFocusedItem()?.id).toBe('btn_2');
      fm.focusNext();
      expect(fm.getFocusedItem()?.id).toBe('btn_1');

      // focusPrevious skips disabled item and wraps around backwards
      fm.focusPrevious();
      expect(fm.getFocusedItem()?.id).toBe('btn_2');
      fm.focusPrevious();
      expect(fm.getFocusedItem()?.id).toBe('btn_1');
    });

    it('exercises SplashScene codexModal input delegation', () => {
      const splash = new SplashScene();
      splash.onEnter(engine);
      (splash as any).codexModal.open(1280, 720);
      expect((splash as any).codexModal.isOpen()).toBe(true);

      // Handle pointer move and click while open
      (input as any).mousePosition = new Vector2D(300, 300);
      (input as any).mouseButtonsJustPressed = new Set([0]);
      splash.handleInput(input);
      expect((splash as any).codexModal.isOpen()).toBe(true);

      // Close via PAUSE action
      input.postUpdate();
      input.triggerVirtualAction('PAUSE');
      splash.handleInput(input);
      expect((splash as any).codexModal.isOpen()).toBe(false);

      splash.onExit();
    });
  });
});
