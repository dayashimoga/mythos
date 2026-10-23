/**
 * Mythos: Astra & The Seven Realms
 * Stage 6 UI Comprehensive Branch & Function Coverage Suite
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIButton } from '../../src/ui/components/UIButton';
import { UISlider } from '../../src/ui/components/UISlider';
import { UIToggle } from '../../src/ui/components/UIToggle';
import { UITabs } from '../../src/ui/components/UITabs';
import { UIModal } from '../../src/ui/components/UIModal';
import { ToastManager } from '../../src/ui/components/ToastManager';
import { SettingsModal } from '../../src/ui/modals/SettingsModal';
import { PauseMenuModal } from '../../src/ui/modals/PauseMenuModal';
import { CodexQuestModal } from '../../src/ui/modals/CodexQuestModal';
import { SettingsScene } from '../../src/scenes/SettingsScene';
import { AccessibilityManager } from '../../src/ui/accessibility/AccessibilityManager';
import { Vector2D } from '../../src/physics/Vector2D';
import { QuestManager } from '../../src/narrative/QuestManager';
import { CampaignChapter1 } from '../../src/narrative/CampaignChapter1';
import { FocusManager } from '../../src/ui/design/FocusManager';

function createMockRenderer(width = 800, height = 600) {
  const ctx = {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    roundRect: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn(() => ({ width: 60 })),
    setLineDash: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    font: '12px sans-serif',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    globalAlpha: 1.0,
    shadowColor: 'transparent',
    shadowBlur: 0,
    shadowOffsetY: 0,
  };

  return {
    getContext: () => ctx as any,
    getViewport: () => ({ x: 0, y: 0, width, height }),
    clear: vi.fn(),
    drawRect: vi.fn(),
    drawText: vi.fn(),
    drawCircle: vi.fn(),
    drawAABB: vi.fn(),
    drawMandala: vi.fn(),
    beginWorldPass: vi.fn(),
    endWorldPass: vi.fn(),
    getCamera: () => ({
      position: new Vector2D(0, 0),
      viewportWidth: width,
      viewportHeight: height,
      screenToWorld: (v: Vector2D) => v.clone(),
      worldToScreen: (v: Vector2D) => v.clone(),
      triggerShake: vi.fn(),
    }),
  } as any;
}

describe('Stage 6: Exhaustive UI Component & Screen Branch Coverage', () => {
  let renderer: any;
  let a11y: AccessibilityManager;

  beforeEach(() => {
    renderer = createMockRenderer();
    a11y = AccessibilityManager.getInstance();
    a11y.resetToDefaults();
  });

  describe('UIButton branch coverage', () => {
    it('exercises all variants, states, icons, and hotkeys in normal and high-contrast modes', () => {
      const variants: Array<'solar' | 'astral' | 'prana' | 'tamas' | 'surface'> = [
        'solar',
        'astral',
        'prana',
        'tamas',
        'surface',
      ];

      for (const variant of variants) {
        const btn = new UIButton(`btn_${variant}`, 10, 10, 120, 36, {
          text: variant,
          variant,
          icon: '✦',
          hotkey: 'K',
        });

        // Normal render
        btn.render(renderer);

        // Hover & focus
        btn.isHovered = true;
        btn.isFocused = true;
        btn.update(0.1);
        btn.render(renderer);

        // Pressed
        btn.isPressed = true;
        btn.render(renderer);

        // Disabled
        btn.isDisabled = true;
        btn.render(renderer);
      }

      // High contrast mode
      a11y.updateSettings({ highContrast: true });
      const hcBtn = new UIButton('btn_hc', 10, 10, 120, 36, {
        text: 'High Contrast',
        variant: 'solar',
      });
      hcBtn.isFocused = true;
      hcBtn.render(renderer);

      hcBtn.isDisabled = true;
      hcBtn.render(renderer);

      // Invisible button should skip render
      hcBtn.isVisible = false;
      hcBtn.render(renderer);

      // UIComponent base methods
      hcBtn.getBounds();
      hcBtn.setPressed(true);
      expect(hcBtn.isPressed).toBe(false); // Because disabled/invisible
    });
  });

  describe('UISlider branch coverage', () => {
    it('exercises pointer dragging, clamping, stepping, and focus render', () => {
      const onChange = vi.fn();
      const slider = new UISlider('slider_test', 50, 50, 400, 30, {
        label: 'Test Level',
        min: 10,
        max: 50,
        step: 5,
        value: 25,
        onChange,
      });

      // Pointer drag interaction
      slider.handlePointer(new Vector2D(250, 65), true);
      expect(slider.isDragging).toBe(true);

      // Drag outside track (left of min and right of max)
      slider.handlePointer(new Vector2D(100, 65), true);
      expect(slider.value).toBe(10);

      slider.handlePointer(new Vector2D(500, 65), true);
      expect(slider.value).toBe(50);

      // Pointer release
      slider.handlePointer(new Vector2D(500, 65), false);
      expect(slider.isDragging).toBe(false);

      // Stepping negative below min wraps to max
      slider.stepValue(-50);
      expect(slider.value).toBe(50);

      // Activation steps value
      slider.onActivate?.();

      // Rendering normal and high contrast
      slider.isFocused = true;
      slider.render(renderer);

      a11y.updateSettings({ highContrast: true });
      slider.render(renderer);

      // Invisible slider skips
      slider.isVisible = false;
      slider.handlePointer(new Vector2D(200, 65), true);
      slider.render(renderer);
    });
  });

  describe('UIToggle branch coverage', () => {
    it('exercises disabled toggling, smooth animation, and high contrast styling', () => {
      const toggle = new UIToggle('toggle_test', 20, 20, 200, 30, {
        label: 'Haptic Cue',
        checked: true,
      });

      // Disabled toggle prevents state change
      toggle.isDisabled = true;
      toggle.toggle();
      expect(toggle.isChecked).toBe(true);

      toggle.isDisabled = false;
      toggle.toggle();
      expect(toggle.isChecked).toBe(false);

      // Update animation progress
      toggle.update(0.05);
      toggle.render(renderer);

      // High contrast & reduced motion
      a11y.updateSettings({ highContrast: true, reducedMotion: true });
      toggle.update(0.05);
      toggle.isFocused = true;
      toggle.render(renderer);

      // Invisible skips
      toggle.isVisible = false;
      toggle.render(renderer);
    });
  });

  describe('UITabs branch coverage', () => {
    it('exercises keyboard selection, pointer selection, and hover handling', () => {
      const tabs = new UITabs('tabs_branch', 10, 10, 300, 32, {
        tabs: [
          { id: 'tab1', label: 'One' },
          { id: 'tab2', label: 'Two' },
          { id: 'tab3', label: 'Three' },
        ],
        activeTabId: 'tab1',
      });

      // Select next / previous
      tabs.selectNextTab();
      expect(tabs.getActiveTab()?.id).toBe('tab2');

      tabs.selectNextTab();
      expect(tabs.getActiveTab()?.id).toBe('tab3');

      tabs.selectNextTab(); // wraps to tab1
      expect(tabs.getActiveTab()?.id).toBe('tab1');

      tabs.selectPreviousTab(); // wraps to tab3
      expect(tabs.getActiveTab()?.id).toBe('tab3');

      // Pointer interactions
      tabs.updateHover(new Vector2D(50, 20));
      tabs.handlePointer(new Vector2D(150, 20)); // Clicks tab2

      // Render normal and high contrast
      tabs.isFocused = true;
      tabs.render(renderer);

      a11y.updateSettings({ highContrast: true });
      tabs.render(renderer);

      tabs.isVisible = false;
      tabs.render(renderer);
    });
  });

  describe('UIModal branch coverage', () => {
    it('exercises close button, focus traversal, key mappings, and child management', () => {
      const modal = new UIModal({
        title: 'Celestial Portal',
        subtitle: 'Dimensional Gateway',
        width: 600,
        height: 400,
        showCloseButton: true,
      });

      const btn1 = new UIButton('m_btn1', 100, 100, 80, 30, { text: 'A' });
      const btn2 = new UIButton('m_btn2', 200, 100, 80, 30, { text: 'B' });

      modal.addChild(btn1);
      modal.addChild(btn2);
      modal.open(800, 600);

      // Update animation
      modal.update(0.2);

      // Hover and pointer move
      modal.handlePointerMove(new Vector2D(110, 110));

      // Pointer down on child
      modal.handlePointerDown(new Vector2D(110, 110));
      expect(btn1.isPressed).toBe(true);

      // Pointer up on child
      modal.handlePointerUp(new Vector2D(110, 110));
      expect(btn1.isPressed).toBe(false);

      // Pointer down on close button
      if (modal.closeButton) {
        modal.handlePointerDown(new Vector2D(modal.closeButton.bounds.x + 10, modal.closeButton.bounds.y + 10));
        modal.handlePointerUp(new Vector2D(modal.closeButton.bounds.x + 10, modal.closeButton.bounds.y + 10));
        expect(modal.isOpen).toBe(false);
      }

      // Re-open and exercise keyboard traversal
      modal.open(800, 600);
      modal.handleKeyDown('Tab', false); // Focus next
      modal.handleKeyDown('Tab', true); // Focus previous
      modal.handleKeyDown('ArrowDown');
      modal.handleKeyDown('ArrowUp');
      modal.handleKeyDown('ArrowRight');
      modal.handleKeyDown('ArrowLeft');
      modal.handleKeyDown('Enter'); // Activate focused
      modal.handleKeyDown(' '); // Activate space

      // Render normal, reduced motion, and high contrast
      modal.render(renderer);

      a11y.updateSettings({ highContrast: true, reducedMotion: true });
      modal.render(renderer);

      // Remove child and clear
      modal.removeChild('m_btn1');
      modal.clearChildren();
    });
  });

  describe('SettingsModal exhaustive tab and interaction coverage', () => {
    it('exercises all 5 tabs, slider manipulations, keyboard navigation, and renderer overlays', () => {
      const modal = new SettingsModal();
      modal.open(800, 600);

      // 1. Display Tab
      modal.switchTab('display');
      modal.handlePointerDown(new Vector2D(modal.modal.bounds.x + 200, modal.modal.bounds.y + 200));
      modal.handlePointerUp(new Vector2D(modal.modal.bounds.x + 200, modal.modal.bounds.y + 200));
      modal.render(renderer);

      // 2. Controls Tab (exercises command mappings diagram overlay)
      modal.switchTab('controls');
      modal.render(renderer);

      // 3. Accessibility Tab
      modal.switchTab('accessibility');
      modal.handlePointerDown(new Vector2D(modal.modal.bounds.x + 200, modal.modal.bounds.y + 180));
      modal.handlePointerUp(new Vector2D(modal.modal.bounds.x + 200, modal.modal.bounds.y + 180));
      modal.render(renderer);

      // 4. Data & Saves Tab
      modal.switchTab('saves');
      modal.render(renderer);

      // 5. Audio Tab
      modal.switchTab('audio');
      modal.handlePointerMove(new Vector2D(modal.modal.bounds.x + 100, modal.modal.bounds.y + 150));
      modal.handlePointerDown(new Vector2D(modal.modal.bounds.x + 100, modal.modal.bounds.y + 150));
      modal.handlePointerUp(new Vector2D(modal.modal.bounds.x + 100, modal.modal.bounds.y + 150));
      modal.render(renderer);

      // Update & Keyboard
      modal.update(0.1);
      modal.handleKeyDown('ArrowDown');
      modal.handleKeyDown('ArrowUp');
      modal.handleKeyDown('Escape');
      expect(modal.isOpen()).toBe(false);
    });
  });

  describe('PauseMenuModal & CodexQuestModal exhaustive interaction coverage', () => {
    it('exercises PauseMenuModal pointer and keyboard events', () => {
      const pauseModal = new PauseMenuModal({
        onResume: vi.fn(),
        onOpenCodex: vi.fn(),
        onOpenSettings: vi.fn(),
        onRestartRealm: vi.fn(),
        onExitToTitle: vi.fn(),
      });

      pauseModal.open(800, 600);
      pauseModal.update(0.1);
      pauseModal.handlePointerMove(new Vector2D(200, 200));
      pauseModal.handlePointerDown(new Vector2D(200, 200));
      pauseModal.handlePointerUp(new Vector2D(200, 200));
      pauseModal.handleKeyDown('ArrowDown');
      pauseModal.render(renderer);

      pauseModal.handleKeyDown('Escape');
      expect(pauseModal.isOpen()).toBe(false);
    });

    it('exercises CodexQuestModal pointer and keyboard selection across all tabs', () => {
      const qm = new QuestManager(CampaignChapter1.getMissions());
      const codex = new CodexQuestModal(qm);
      codex.open(800, 600);

      // Pointer clicks on mission list item
      const listPt = new Vector2D(codex.modal.bounds.x + 50, codex.modal.bounds.y + 140);
      codex.handlePointerMove(listPt);
      codex.handlePointerDown(listPt);
      codex.handlePointerUp(listPt);

      // Keyboard arrow navigation
      codex.handleKeyDown('ArrowDown');
      codex.handleKeyDown('ArrowUp');

      // High contrast renders across all tabs
      a11y.updateSettings({ highContrast: true });
      (codex as any).tabs.setActiveTab('quests');
      codex.render(renderer);

      (codex as any).tabs.setActiveTab('affinities');
      codex.render(renderer);

      (codex as any).tabs.setActiveTab('lore');
      codex.render(renderer);

      (codex as any).tabs.setActiveTab('tutorials');
      codex.render(renderer);

      codex.handleKeyDown('Escape');
      expect(codex.isOpen()).toBe(false);
    });
  });

  describe('SettingsScene integration coverage', () => {
    it('exercises lifecycle and arrow/action controls in SettingsScene', () => {
      const scene = new SettingsScene();
      const mockEngine = {
        getRenderer: () => renderer,
        getSceneManager: () => ({
          switchTo: vi.fn(),
        }),
      } as any;

      scene.onEnter(mockEngine);
      scene.update(0.1);
      scene.render(renderer);

      // Handle pointer events
      const mockInput = {
        getMousePosition: () => new Vector2D(200, 200),
        isActionJustPressed: vi.fn((act: string) => act === 'ATTACK'),
        isActionJustReleased: vi.fn(() => false),
      } as any;

      scene.handleInput(mockInput);

      // Arrow navigation
      mockInput.isActionJustPressed = vi.fn((act: string) => act === 'MOVE_DOWN');
      scene.handleInput(mockInput);

      mockInput.isActionJustPressed = vi.fn((act: string) => act === 'MOVE_UP');
      scene.handleInput(mockInput);

      mockInput.isActionJustPressed = vi.fn((act: string) => act === 'MOVE_LEFT');
      scene.handleInput(mockInput);

      mockInput.isActionJustPressed = vi.fn((act: string) => act === 'MOVE_RIGHT');
      scene.handleInput(mockInput);

      mockInput.isActionJustPressed = vi.fn((act: string) => act === 'INTERACT');
      scene.handleInput(mockInput);

      mockInput.isActionJustPressed = vi.fn((act: string) => act === 'PAUSE');
      scene.handleInput(mockInput);

      scene.onExit();
    });
  });

  describe('Deep branch coverage for SettingsModal, Toasts, Focus and PauseMenu', () => {
    it('exercises all SettingsModal callback controls and toggle switches', () => {
      const modal = new SettingsModal();
      modal.open(800, 600);

      // Display controls callbacks
      (modal as any).tabsQuality.setActiveTab('fast');
      (modal as any).tabsQuality.setActiveTab('cinematic');
      (modal as any).toggleFullscreen.toggle(); // on
      (modal as any).toggleFullscreen.toggle(); // off
      (modal as any).sliderParticles.setValue(0.6);

      // Controls callbacks
      (modal as any).toggleTouch.toggle();
      (modal as any).toggleTouch.toggle();
      (modal as any).toggleInvertY.toggle();
      (modal as any).toggleInvertY.toggle();
      (modal as any).toggleVibration.toggle();
      (modal as any).toggleVibration.toggle();

      // Accessibility callbacks
      (modal as any).toggleReducedMotion.toggle(); // on
      (modal as any).toggleReducedMotion.toggle(); // off
      (modal as any).toggleHighContrast.toggle(); // on
      (modal as any).toggleHighContrast.toggle(); // off
      (modal as any).toggleDyslexia.toggle();
      (modal as any).toggleDyslexia.toggle();
      (modal as any).tabsSubtitles.setActiveTab('large');
      (modal as any).tabsSubtitles.setActiveTab('extra-large');
      (modal as any).tabsColorblind.setActiveTab('protanopia');
      (modal as any).tabsColorblind.setActiveTab('tritanopia');

      // Saves callbacks
      (modal as any).btnLoadNow.onActivate?.();
      (modal as any).btnResetSettings.onActivate?.();
      (modal as any).btnPurgeData.onActivate?.();

      // Audio mute toggle
      (modal as any).toggleMute.toggle();
      (modal as any).toggleMute.toggle();

      // Pointer drag branches for each tab
      modal.switchTab('audio');
      modal.handlePointerDown(new Vector2D(modal.modal.bounds.x + 200, modal.modal.bounds.y + 130));
      modal.handlePointerUp(new Vector2D(modal.modal.bounds.x + 200, modal.modal.bounds.y + 130));

      modal.switchTab('display');
      modal.handlePointerDown(new Vector2D(modal.modal.bounds.x + 200, modal.modal.bounds.y + 200));
      modal.handlePointerUp(new Vector2D(modal.modal.bounds.x + 200, modal.modal.bounds.y + 200));

      modal.switchTab('accessibility');
      modal.handlePointerDown(new Vector2D(modal.modal.bounds.x + 200, modal.modal.bounds.y + 170));
      modal.handlePointerUp(new Vector2D(modal.modal.bounds.x + 200, modal.modal.bounds.y + 170));
    });

    it('exercises ToastManager all types and exit animation', () => {
      const tm = ToastManager.getInstance();
      tm.clear();

      tm.show('Warning test', 'warning', 1.0);
      tm.show('Error test', 'error', 1.0);
      tm.show('Info test', 'info', 1.0);
      tm.show('Overflow test', 'success', 1.0); // Drops oldest

      // Render with high contrast
      a11y.updateSettings({ highContrast: true });
      tm.render(renderer);

      // Advance into exit animation (elapsed > duration - 0.25)
      tm.update(0.8);
      tm.render(renderer);

      // Expire all
      tm.update(0.5);
      expect(tm.getActiveToasts().length).toBe(0);
    });

    it('exercises FocusManager spatial traversal and keyboard nav status', () => {
      const fm = new FocusManager();
      expect(fm.isKeyboardNavActive()).toBe(false);
      fm.setKeyboardNavActive(true);
      expect(fm.isKeyboardNavActive()).toBe(true);

      const item1 = { id: 'it1', tabIndex: 1, isFocused: false };
      const item2 = { id: 'it2', tabIndex: 2, isFocused: false, isDisabled: true };
      const item3 = { id: 'it3', tabIndex: 3, isFocused: false };

      fm.register(item1);
      fm.register(item2);
      fm.register(item3);

      fm.focusPrevious(); // Wraps to it3 skipping disabled it2
      expect(fm.getCurrentFocus()?.id).toBe('it3');

      fm.focusPrevious(); // Moves to it1 skipping disabled it2
      expect(fm.getCurrentFocus()?.id).toBe('it1');

      // Unregister active item
      fm.unregister('it1');

      // Activation without callback
      fm.activateFocused();
    });

    it('exercises PauseMenuModal hotkeys and codex shortcut', () => {
      const onOpenCodex = vi.fn();
      const pauseModal = new PauseMenuModal({
        onResume: vi.fn(),
        onOpenCodex,
        onOpenSettings: vi.fn(),
        onRestartRealm: vi.fn(),
        onExitToTitle: vi.fn(),
      });

      pauseModal.open(800, 600);
      pauseModal.handleKeyDown('o');
      expect(onOpenCodex).toHaveBeenCalledTimes(1);

      pauseModal.open(800, 600);
      pauseModal.handleKeyDown('O');
      expect(onOpenCodex).toHaveBeenCalledTimes(2);
    });
  });
});
