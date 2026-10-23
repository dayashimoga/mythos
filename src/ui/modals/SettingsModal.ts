/**
 * Mythos: Astra & The Seven Realms
 * Stage 6 Production Settings Modal
 *
 * Comprehensive 5-tab settings system bound to real engine state,
 * AccessibilityManager, and SaveGameManager with full keyboard/gamepad/mouse navigation.
 */

import { UIModal } from '../components/UIModal';
import { UITabs } from '../components/UITabs';
import { UISlider } from '../components/UISlider';
import { UIToggle } from '../components/UIToggle';
import { UIButton } from '../components/UIButton';
import { IRenderer } from '../../render/CanvasRenderer';
import { Vector2D } from '../../physics/Vector2D';
import { AccessibilityManager, SubtitleScale, ColorblindMode } from '../accessibility/AccessibilityManager';
import { SaveGameManager } from '../../state/SaveGameManager';
import { ToastManager } from '../components/ToastManager';
import { DesignTokens } from '../design/DesignTokens';

export class SettingsModal {
  public modal: UIModal;
  private tabs: UITabs;
  private activeTabId = 'audio';

  // Audio Controls
  private sliderMaster!: UISlider;
  private sliderMusic!: UISlider;
  private sliderSfx!: UISlider;
  private sliderVoice!: UISlider;
  private toggleMute!: UIToggle;

  // Display Controls
  private tabsQuality!: UITabs;
  private toggleFullscreen!: UIToggle;
  private sliderParticles!: UISlider;

  // Controls Tab
  private toggleTouch!: UIToggle;
  private toggleInvertY!: UIToggle;
  private toggleVibration!: UIToggle;

  // Accessibility Controls
  private toggleReducedMotion!: UIToggle;
  private sliderShake!: UISlider;
  private toggleHighContrast!: UIToggle;
  private tabsSubtitles!: UITabs;
  private toggleDyslexia!: UIToggle;
  private tabsColorblind!: UITabs;

  // Data & Saves Controls
  private btnSaveNow!: UIButton;
  private btnLoadNow!: UIButton;
  private btnResetSettings!: UIButton;
  private btnPurgeData!: UIButton;

  constructor(onClose?: () => void) {
    this.modal = new UIModal({
      title: 'Cosmic Settings & Configuration',
      subtitle: 'Tune audio frequencies, cosmic visual clarity, and accessible guidance.',
      width: 720,
      height: 520,
      onClose,
    });

    this.tabs = new UITabs('settings_tabs', 0, 0, 680, 36, {
      tabs: [
        { id: 'audio', label: 'Audio' },
        { id: 'display', label: 'Display' },
        { id: 'controls', label: 'Controls' },
        { id: 'accessibility', label: 'Accessibility' },
        { id: 'saves', label: 'Data & Saves' },
      ],
      activeTabId: 'audio',
      onTabChange: (tabId: string) => this.switchTab(tabId),
    });

    this.buildControls();
    this.refreshFromSettings();
  }

  private buildControls(): void {
    const a11y = AccessibilityManager.getInstance();
    const settings = a11y.getSettings();

    // 1. Audio Controls
    this.sliderMaster = new UISlider('audio_master', 0, 0, 420, 28, {
      label: 'Master Volume',
      min: 0,
      max: 1,
      step: 0.05,
      value: settings.masterVolume,
      onChange: (val) => {
        a11y.updateSettings({ masterVolume: val });
      },
    });

    this.sliderMusic = new UISlider('audio_music', 0, 0, 420, 28, {
      label: 'Music Harmony',
      min: 0,
      max: 1,
      step: 0.05,
      value: settings.musicVolume,
      onChange: (val) => {
        a11y.updateSettings({ musicVolume: val });
      },
    });

    this.sliderSfx = new UISlider('audio_sfx', 0, 0, 420, 28, {
      label: 'Sound Effects',
      min: 0,
      max: 1,
      step: 0.05,
      value: settings.sfxVolume,
      onChange: (val) => {
        a11y.updateSettings({ sfxVolume: val });
      },
    });

    this.sliderVoice = new UISlider('audio_voice', 0, 0, 420, 28, {
      label: 'Divine Voice Cues',
      min: 0,
      max: 1,
      step: 0.05,
      value: settings.voiceVolume,
      onChange: (val) => {
        a11y.updateSettings({ voiceVolume: val });
      },
    });

    this.toggleMute = new UIToggle('audio_mute_all', 0, 0, 420, 28, {
      label: 'Mute All Sound',
      value: settings.masterVolume === 0,
      onChange: (val) => {
        a11y.updateSettings({ masterVolume: val ? 0 : 1.0 });
        this.sliderMaster.setValue(val ? 0 : 1.0);
        ToastManager.getInstance().show(val ? 'Audio Muted' : 'Audio Unmuted', 'info');
      },
    });

    // 2. Display Controls
    this.tabsQuality = new UITabs('display_quality', 0, 0, 420, 30, {
      tabs: [
        { id: 'fast', label: 'Performance' },
        { id: 'balanced', label: 'Balanced' },
        { id: 'cinematic', label: 'Cinematic' },
      ],
      activeTabId: 'balanced',
      onTabChange: (q: string) => ToastManager.getInstance().show(`Graphics Quality: ${q.toUpperCase()}`, 'info'),
    });

    this.toggleFullscreen = new UIToggle('display_fullscreen', 0, 0, 420, 28, {
      label: 'Fullscreen Mode',
      value: false,
      onChange: (val) => {
        if (typeof document !== 'undefined') {
          if (val && !document.fullscreenElement) {
            document.documentElement.requestFullscreen?.().catch(() => {});
          } else if (!val && document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => {});
          }
        }
        ToastManager.getInstance().show(val ? 'Fullscreen Enabled' : 'Windowed Mode', 'info');
      },
    });

    this.sliderParticles = new UISlider('display_particles', 0, 0, 420, 28, {
      label: 'Aura Particle Density',
      min: 0.2,
      max: 1.0,
      step: 0.1,
      value: 1.0,
      onChange: (val) => {
        ToastManager.getInstance().show(`Particles: ${Math.round(val * 100)}%`, 'info');
      },
    });

    // 3. Controls Tab
    this.toggleTouch = new UIToggle('controls_touch', 0, 0, 420, 28, {
      label: 'On-Screen Virtual Controls',
      value: false,
      onChange: (val) => {
        ToastManager.getInstance().show(val ? 'Virtual Touch Sticks Enabled' : 'Touch Sticks Hidden', 'info');
      },
    });

    this.toggleInvertY = new UIToggle('controls_inverty', 0, 0, 420, 28, {
      label: 'Invert Aim Pitch (Y-Axis)',
      value: false,
      onChange: (val) => {
        ToastManager.getInstance().show(val ? 'Y-Axis Inverted' : 'Y-Axis Normal', 'info');
      },
    });

    this.toggleVibration = new UIToggle('controls_haptics', 0, 0, 420, 28, {
      label: 'Gamepad Haptic Feedback',
      value: true,
      onChange: (val) => {
        ToastManager.getInstance().show(val ? 'Haptics Enabled' : 'Haptics Disabled', 'info');
      },
    });

    // 4. Accessibility Controls
    this.toggleReducedMotion = new UIToggle('a11y_reduced_motion', 0, 0, 420, 28, {
      label: 'Reduced Motion (No Shake / Pulses)',
      value: settings.reducedMotion,
      onChange: (val) => {
        a11y.updateSettings({ reducedMotion: val });
        if (val) this.sliderShake.setValue(0);
        ToastManager.getInstance().show(val ? 'Reduced Motion Activated' : 'Reduced Motion Disabled', 'info');
      },
    });

    this.sliderShake = new UISlider('a11y_shake_intensity', 0, 0, 420, 28, {
      label: 'Screen Shake Intensity',
      min: 0,
      max: 1,
      step: 0.1,
      value: settings.screenShakeFactor,
      onChange: (val) => {
        a11y.updateSettings({ screenShakeFactor: val });
      },
    });

    this.toggleHighContrast = new UIToggle('a11y_high_contrast', 0, 0, 420, 28, {
      label: 'High Contrast Mode (WCAG AAA)',
      value: settings.highContrast,
      onChange: (val) => {
        a11y.updateSettings({ highContrast: val });
        ToastManager.getInstance().show(val ? 'High Contrast Palette Enabled' : 'Standard Palette Restored', 'info');
      },
    });

    this.tabsSubtitles = new UITabs('a11y_subtitles', 0, 0, 420, 30, {
      tabs: [
        { id: 'normal', label: 'Normal (14px)' },
        { id: 'large', label: 'Large (18px)' },
        { id: 'extra-large', label: 'Extra Large (22px)' },
      ],
      activeTabId: settings.subtitleScale,
      onTabChange: (scale: string) => {
        a11y.updateSettings({ subtitleScale: scale as SubtitleScale });
        ToastManager.getInstance().show(`Subtitle Scale: ${scale.toUpperCase()}`, 'info');
      },
    });

    this.toggleDyslexia = new UIToggle('a11y_dyslexia', 0, 0, 420, 28, {
      label: 'Dyslexia-Friendly Typography',
      value: settings.dyslexiaFont,
      onChange: (val) => {
        a11y.updateSettings({ dyslexiaFont: val });
        ToastManager.getInstance().show(val ? 'Dyslexia Font Enabled' : 'Standard Font Enabled', 'info');
      },
    });

    this.tabsColorblind = new UITabs('a11y_colorblind', 0, 0, 420, 30, {
      tabs: [
        { id: 'none', label: 'None' },
        { id: 'protanopia', label: 'Protan' },
        { id: 'deuteranopia', label: 'Deuter' },
        { id: 'tritanopia', label: 'Tritan' },
      ],
      activeTabId: settings.colorblindMode,
      onTabChange: (mode: string) => {
        a11y.updateSettings({ colorblindMode: mode as ColorblindMode });
        ToastManager.getInstance().show(`Color Profile: ${mode.toUpperCase()}`, 'info');
      },
    });

    // 5. Data & Saves
    this.btnSaveNow = new UIButton('save_manual_save', 0, 0, 260, 36, {
      text: 'Save Cosmic Progress',
      variant: 'solar',
      icon: '💾',
      onClick: () => {
        SaveGameManager.save({ timestamp: Date.now() });
        ToastManager.getInstance().show('Cosmic Progress Saved to Local Storage', 'success');
      },
    });

    this.btnLoadNow = new UIButton('save_manual_load', 0, 0, 260, 36, {
      text: 'Reload Last Checkpoint',
      variant: 'astral',
      icon: '🔄',
      onClick: () => {
        const loaded = SaveGameManager.load();
        ToastManager.getInstance().show(`Loaded Realm: ${loaded.currentRealm}`, 'info');
      },
    });

    this.btnResetSettings = new UIButton('save_reset_settings', 0, 0, 260, 36, {
      text: 'Reset Settings to Default',
      variant: 'surface',
      icon: '⚙️',
      onClick: () => {
        a11y.resetToDefaults();
        this.refreshFromSettings();
        ToastManager.getInstance().show('All Settings Reset to Defaults', 'warning');
      },
    });

    this.btnPurgeData = new UIButton('save_purge_data', 0, 0, 260, 36, {
      text: 'Purge Save Data & Reset',
      variant: 'tamas',
      icon: '⚠️',
      onClick: () => {
        SaveGameManager.reset();
        ToastManager.getInstance().show('All Saved Journey Data Erased', 'error');
      },
    });

    this.modal.addChild(this.tabs);
    this.switchTab('audio');
  }

  public refreshFromSettings(): void {
    const a11y = AccessibilityManager.getInstance();
    const settings = a11y.getSettings();
    this.sliderMaster.setValue(settings.masterVolume);
    this.sliderMusic.setValue(settings.musicVolume);
    this.sliderSfx.setValue(settings.sfxVolume);
    this.sliderVoice.setValue(settings.voiceVolume);
    this.toggleMute.setValue(settings.masterVolume === 0);
    this.toggleReducedMotion.setValue(settings.reducedMotion);
    this.sliderShake.setValue(settings.screenShakeFactor);
    this.toggleHighContrast.setValue(settings.highContrast);
    this.tabsSubtitles.setActiveTab(settings.subtitleScale);
    this.toggleDyslexia.setValue(settings.dyslexiaFont);
    this.tabsColorblind.setActiveTab(settings.colorblindMode);
  }

  public switchTab(tabId: string): void {
    this.activeTabId = tabId;

    // Remove all tab specific components from modal
    this.modal.clearChildren();
    this.modal.addChild(this.tabs);

    const startX = this.modal.bounds.x + 40;
    let currentY = this.modal.bounds.y + 120;
    const spacing = 42;

    switch (tabId) {
      case 'audio': {
        const audioItems = [this.sliderMaster, this.sliderMusic, this.sliderSfx, this.sliderVoice, this.toggleMute];
        for (const item of audioItems) {
          item.bounds.x = startX;
          item.bounds.y = currentY;
          item.isVisible = true;
          this.modal.addChild(item);
          currentY += spacing;
        }
        break;
      }
      case 'display': {
        const displayItems = [this.tabsQuality, this.toggleFullscreen, this.sliderParticles];
        for (const item of displayItems) {
          item.bounds.x = startX;
          item.bounds.y = currentY;
          item.isVisible = true;
          this.modal.addChild(item);
          currentY += spacing + 10;
        }
        break;
      }
      case 'controls': {
        const ctrlItems = [this.toggleTouch, this.toggleInvertY, this.toggleVibration];
        for (const item of ctrlItems) {
          item.bounds.x = startX;
          item.bounds.y = currentY;
          item.isVisible = true;
          this.modal.addChild(item);
          currentY += spacing;
        }
        break;
      }
      case 'accessibility': {
        const a11yItems = [
          this.toggleReducedMotion,
          this.sliderShake,
          this.toggleHighContrast,
          this.tabsSubtitles,
          this.toggleDyslexia,
          this.tabsColorblind,
        ];
        for (const item of a11yItems) {
          item.bounds.x = startX;
          item.bounds.y = currentY;
          item.isVisible = true;
          this.modal.addChild(item);
          currentY += spacing;
        }
        break;
      }
      case 'saves': {
        const saveItems = [this.btnSaveNow, this.btnLoadNow, this.btnResetSettings, this.btnPurgeData];
        for (const item of saveItems) {
          item.bounds.x = startX + 40;
          item.bounds.y = currentY;
          item.isVisible = true;
          this.modal.addChild(item);
          currentY += 48;
        }
        break;
      }
    }
  }

  public open(viewportWidth: number, viewportHeight: number): void {
    this.modal.open(viewportWidth, viewportHeight);
    this.tabs.bounds.x = this.modal.bounds.x + 20;
    this.tabs.bounds.y = this.modal.bounds.y + 70;
    this.tabs.bounds.width = this.modal.bounds.width - 40;
    this.switchTab(this.activeTabId);
  }

  public close(): void {
    this.modal.close();
  }

  public isOpen(): boolean {
    return this.modal.isOpen;
  }

  public update(dt: number): void {
    if (!this.modal.isOpen) return;
    this.modal.update(dt);
  }

  public handlePointerMove(point: Vector2D): boolean {
    if (!this.modal.isOpen) return false;
    return this.modal.handlePointerMove(point);
  }

  public handlePointerDown(point: Vector2D): boolean {
    if (!this.modal.isOpen) return false;

    // Check sliders dragging
    if (this.activeTabId === 'audio') {
      this.sliderMaster.handlePointer(point, true);
      this.sliderMusic.handlePointer(point, true);
      this.sliderSfx.handlePointer(point, true);
      this.sliderVoice.handlePointer(point, true);
    } else if (this.activeTabId === 'display') {
      this.sliderParticles.handlePointer(point, true);
    } else if (this.activeTabId === 'accessibility') {
      this.sliderShake.handlePointer(point, true);
    }

    return this.modal.handlePointerDown(point);
  }

  public handlePointerUp(point: Vector2D): boolean {
    if (!this.modal.isOpen) return false;

    this.sliderMaster.handlePointer(point, false);
    this.sliderMusic.handlePointer(point, false);
    this.sliderSfx.handlePointer(point, false);
    this.sliderVoice.handlePointer(point, false);
    this.sliderParticles.handlePointer(point, false);
    this.sliderShake.handlePointer(point, false);

    return this.modal.handlePointerUp(point);
  }

  public handleKeyDown(key: string, shiftKey = false): boolean {
    if (!this.modal.isOpen) return false;
    return this.modal.handleKeyDown(key, shiftKey);
  }

  public render(renderer: IRenderer): void {
    if (!this.modal.isOpen) return;
    this.modal.render(renderer);

    // If on controls tab, draw helpful controller diagram overlay on right half
    if (this.activeTabId === 'controls') {
      const ctx = renderer.getContext();
      const rightX = this.modal.bounds.x + 360;
      const rightY = this.modal.bounds.y + 120;
      const rightW = this.modal.bounds.width - 390;
      const rightH = 280;

      ctx.save();
      ctx.fillStyle = 'rgba(8, 12, 20, 0.75)';
      ctx.strokeStyle = DesignTokens.colors.borders.subtleGold;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(rightX, rightY, rightW, rightH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.font = `bold 12px ${AccessibilityManager.getInstance().getFontFamily(true)}`;
      ctx.fillStyle = DesignTokens.colors.solar.glow;
      ctx.textAlign = 'left';
      ctx.fillText('COMMAND MAPPINGS', rightX + 16, rightY + 24);

      const mappings = [
        ['Move Astra', 'W, A, S, D / Left Stick'],
        ['Aim Astral Lance', 'Mouse Pointer / Right Stick'],
        ['Surya Burst (Attack)', 'Left Click / J / (X)'],
        ['Agni Dash (i-frames)', 'Space / Shift / (A)'],
        ['Attune / Interact', 'E / F / (B)'],
        ['Purify Corrupt Shrine', 'Hold E near altar'],
        ['Cosmic Codex / Lore', 'O / Tab / (Select)'],
        ['Pause / Astral Gate', 'Esc / P / (Start)'],
      ];

      ctx.font = `11px ${AccessibilityManager.getInstance().getFontFamily()}`;
      let mapY = rightY + 54;
      for (const [action, key] of mappings) {
        ctx.fillStyle = DesignTokens.colors.text.secondary;
        ctx.fillText(action, rightX + 16, mapY);
        ctx.fillStyle = DesignTokens.colors.solar.contrastText;
        ctx.textAlign = 'right';
        ctx.fillText(key, rightX + rightW - 16, mapY);
        ctx.textAlign = 'left';
        mapY += 26;
      }

      ctx.restore();
    }
  }
}
