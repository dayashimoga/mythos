import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Engine } from '../../src/engine/Engine';
import { CanvasRenderer } from '../../src/render/CanvasRenderer';
import { SplashScene } from '../../src/scenes/SplashScene';
import { ProductionHUD } from '../../src/ui/ProductionHUD';
import { CharacterShowcaseScene } from '../../src/scenes/CharacterShowcaseScene';
import { PauseMenuModal } from '../../src/ui/modals/PauseMenuModal';
import { CodexQuestModal } from '../../src/ui/modals/CodexQuestModal';
import { SettingsModal } from '../../src/ui/modals/SettingsModal';
import { Player } from '../../src/entities/Player';
import { Vector2D } from '../../src/physics/Vector2D';
import { InputManager } from '../../src/input/InputManager';
import { SaveGameManager } from '../../src/state/SaveGameManager';
import { StorageAdapter, MemoryStorage } from '../../src/state/StorageAdapter';

describe('Stage 7: Full UI/UX & Player Experience Redesign', () => {
  let engine: Engine;
  let canvas: HTMLCanvasElement;
  let renderer: CanvasRenderer;
  let input: InputManager;

  beforeEach(() => {
    StorageAdapter.setCustomStorage(new MemoryStorage());
    SaveGameManager.reset();

    canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    engine = new Engine();
    engine.init(canvas);
    renderer = engine.getRenderer() as CanvasRenderer;
    input = engine.getInput();
  });

  describe('Phase 7.3: Player-Facing Main Menu & Navigation (SplashScene)', () => {
    it('initializes SplashScene with player-facing options and continues journey if save exists', () => {
      const splash = new SplashScene();
      splash.onEnter(engine);

      // Default fresh state: First item is START CAMPAIGN
      expect((splash as any).menuItems.length).toBe(7);
      expect((splash as any).menuItems[0].label).toBe('START CAMPAIGN');

      // Now simulate existing save with shards collected
      SaveGameManager.save({ shardsCollected: 2 });
      const splashWithSave = new SplashScene();
      splashWithSave.onEnter(engine);
      expect((splashWithSave as any).menuItems[0].label).toBe('CONTINUE JOURNEY');
    });

    it('navigates menu options via ArrowUp / ArrowDown and wraps around', () => {
      const splash = new SplashScene();
      splash.onEnter(engine);

      expect(splash.selectedIndex).toBe(0);

      // Down arrow increments
      vi.spyOn(input, 'isKeyJustPressed').mockImplementation((k: string) => k === 'ArrowDown');
      splash.handleInput(input);
      expect(splash.selectedIndex).toBe(1);

      // Up arrow decrements
      vi.spyOn(input, 'isKeyJustPressed').mockImplementation((k: string) => k === 'ArrowUp');
      splash.handleInput(input);
      expect(splash.selectedIndex).toBe(0);

      // Up arrow at 0 wraps to last item
      splash.handleInput(input);
      expect(splash.selectedIndex).toBe((splash as any).menuItems.length - 1);
    });

    it('toggles developer workspace drawer via F1 / Backquote', () => {
      const splash = new SplashScene();
      splash.onEnter(engine);

      expect(splash.isDevModeOpen).toBe(false);

      vi.spyOn(input, 'isKeyJustPressed').mockImplementation((k: string) => k === 'F1');
      splash.handleInput(input);
      expect(splash.isDevModeOpen).toBe(true);

      splash.handleInput(input);
      expect(splash.isDevModeOpen).toBe(false);
    });

    it('executes scene transitions upon selecting menu options', () => {
      const splash = new SplashScene();
      splash.onEnter(engine);

      const switchSpy = vi.spyOn(engine.getSceneManager(), 'switchTo');

      // Select item 0 (Continue / Start Campaign)
      splash.selectedIndex = 0;
      vi.spyOn(input, 'isKeyJustPressed').mockImplementation((k: string) => k === 'Enter');
      splash.handleInput(input);
      expect(switchSpy).toHaveBeenCalledWith('StoryCampaignScene');

      // Select item 2 (Realm Expeditions)
      splash.selectedIndex = 2;
      splash.handleInput(input);
      expect(switchSpy).toHaveBeenCalledWith('BhumiTempleScene');

      // Select item 3 (Boss Trials)
      splash.selectedIndex = 3;
      splash.handleInput(input);
      expect(switchSpy).toHaveBeenCalledWith('BossEncounterScene');

      // Select item 4 (Hero Compendium)
      splash.selectedIndex = 4;
      splash.handleInput(input);
      expect(switchSpy).toHaveBeenCalledWith('CharacterShowcaseScene');
    });

    it('renders SplashScene main menu without throwing', () => {
      const splash = new SplashScene();
      splash.onEnter(engine);

      expect(() => {
        splash.render(renderer);
      }).not.toThrow();

      splash.onExit();
    });
  });

  describe('Phase 7.4: Gameplay HUD Reconstruction (ProductionHUD)', () => {
    it('eases health and energy bars smoothly toward player values', () => {
      const hud = new ProductionHUD();
      const player = new Player('hero_veer', 0, 0);
      player.health = 40;
      player.energy = 60;

      hud.displayedHealth = 100;
      hud.displayedEnergy = 100;

      // Update HUD over several frames
      for (let i = 0; i < 10; i++) {
        hud.update(0.016, player);
      }

      expect(hud.displayedHealth).toBeLessThan(100);
      expect(hud.displayedHealth).toBeGreaterThanOrEqual(40);
      expect(hud.displayedEnergy).toBeLessThan(100);
      expect(hud.displayedEnergy).toBeGreaterThanOrEqual(60);
    });

    it('manages contextual interaction prompts and compass target angles', () => {
      const hud = new ProductionHUD();

      expect(hud.activeContextualPrompt).toBeNull();
      hud.setContextualPrompt('[ E ] Consecrate the Sun Altar');
      expect(hud.activeContextualPrompt).toBe('[ E ] Consecrate the Sun Altar');

      expect(hud.compassTargetAngle).toBeNull();
      hud.setCompassAngle(Math.PI / 4);
      expect(hud.compassTargetAngle).toBeCloseTo(Math.PI / 4, 3);
    });

    it('handles HUD scale and opacity customization', () => {
      const hud = new ProductionHUD({ hudScale: 1.15, hudOpacity: 0.75 });
      expect(hud.hudScale).toBe(1.15);
      expect(hud.hudOpacity).toBe(0.75);
    });

    it('renders complete HUD with vitals, weapon badge, and contextual prompt', () => {
      const hud = new ProductionHUD();
      const player = new Player('hero_veer', 0, 0);
      player.health = 85;
      player.energy = 70;
      player.shardsCollected = 2;

      hud.setContextualPrompt('[ E ] Speak with Devi Tara');
      hud.setCompassAngle(0.5);

      expect(() => {
        hud.render(renderer, player, 'Consecrate Altar');
      }).not.toThrow();
    });
  });

  describe('Phase 7.5: Character Studio / Hero Compendium UX', () => {
    it('supports Clean Screenshot Mode (KeyH) by hiding studio controls', () => {
      const studio = new CharacterShowcaseScene();
      studio.onEnter(engine);

      expect(studio.isControlsHidden).toBe(false);

      vi.spyOn(input, 'isKeyJustPressed').mockImplementation((k: string) => k === 'KeyH');
      studio.handleInput(input);
      expect(studio.isControlsHidden).toBe(true);

      // Render in hidden mode
      expect(() => studio.render(renderer)).not.toThrow();

      // Toggle back
      studio.handleInput(input);
      expect(studio.isControlsHidden).toBe(false);

      studio.onExit();
    });

    it('returns to title screen when clicking the Exit Title button', () => {
      const studio = new CharacterShowcaseScene();
      studio.onEnter(engine);

      const switchSpy = vi.spyOn(engine.getSceneManager(), 'switchTo');

      // Click exit button at x=1180, y=40
      vi.spyOn(input, 'isMouseButtonJustPressed').mockReturnValue(true);
      vi.spyOn(input, 'getMousePosition').mockReturnValue(new Vector2D(1180, 40));

      studio.handleInput(input);
      expect(switchSpy).toHaveBeenCalledWith('SplashScene');

      studio.onExit();
    });
  });

  describe('Phase 7.6: Modals, Accessibility & Navigation', () => {
    it('manages PauseMenuModal with resume, codex, settings, and title navigation', () => {
      let resumed = false;
      let codexOpened = false;
      let settingsOpened = false;
      let exited = false;

      const pauseModal = new PauseMenuModal({
        onResume: () => {
          resumed = true;
        },
        onOpenCodex: () => {
          codexOpened = true;
        },
        onOpenSettings: () => {
          settingsOpened = true;
        },
        onRestartRealm: () => {},
        onExitToTitle: () => {
          exited = true;
        },
      });

      pauseModal.open(1280, 720);
      expect(pauseModal.isOpen()).toBe(true);

      // Test Escape hotkey resumes
      pauseModal.handleKeyDown('Escape');
      expect(pauseModal.isOpen()).toBe(false);

      // Test O hotkey opens codex
      pauseModal.open(1280, 720);
      pauseModal.handleKeyDown('o');
      expect(codexOpened).toBe(true);

      // Callback flags
      expect(resumed).toBe(true);
      expect(settingsOpened).toBe(false);
      expect(exited).toBe(false);

      expect(() => pauseModal.render(renderer)).not.toThrow();
    });

    it('manages CodexQuestModal with tab switching and search/filter across 4 annals tabs', () => {
      const codex = new CodexQuestModal();
      codex.open(1280, 720);
      expect(codex.isOpen()).toBe(true);

      // Render Quests tab
      expect(() => codex.render(renderer)).not.toThrow();

      // Click Affinities tab
      (codex as any).activeTabId = 'affinities';
      expect(() => codex.render(renderer)).not.toThrow();

      // Click Lore tab
      (codex as any).activeTabId = 'lore';
      expect(() => codex.render(renderer)).not.toThrow();

      // Click Tutorials tab
      (codex as any).activeTabId = 'tutorials';
      expect(() => codex.render(renderer)).not.toThrow();

      codex.close();
      expect(codex.isOpen()).toBe(false);
    });

    it('manages SettingsModal with audio, display, controls, and accessibility tabs', () => {
      let closed = false;
      const settings = new SettingsModal(() => {
        closed = true;
      });

      settings.open(1280, 720);
      expect(settings.isOpen()).toBe(true);

      // Switch through tabs
      ['audio', 'display', 'controls', 'accessibility', 'saves'].forEach((tabId) => {
        (settings as any).switchTab(tabId);
        expect((settings as any).activeTabId).toBe(tabId);
        expect(() => settings.render(renderer)).not.toThrow();
      });

      settings.close();
      expect(settings.isOpen()).toBe(false);
      expect(closed).toBe(true);
    });
  });
});
