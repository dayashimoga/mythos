/**
 * Mythos: Astra & The Seven Realms
 * Stage 6 Accessibility Manager
 *
 * Manages accessibility settings: reduced motion, high contrast visual theme,
 * screen shake dampening, subtitle scaling, colorblind filters, audio channel mixes,
 * and live screen-reader announcements.
 */

export type SubtitleScale = 'normal' | 'large' | 'extra-large';
export type ColorblindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export interface AccessibilitySettings {
  reducedMotion: boolean;
  screenShakeFactor: number; // 0.0 to 1.0
  highContrast: boolean;
  subtitleScale: SubtitleScale;
  colorblindMode: ColorblindMode;
  dyslexiaFont: boolean;
  screenReaderVoiceCues: boolean;

  // Audio Mix Volumes (0.0 to 1.0)
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;
}

export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private static readonly STORAGE_KEY = 'mythos_accessibility_settings_v1';

  private settings: AccessibilitySettings = {
    reducedMotion: false,
    screenShakeFactor: 1.0,
    highContrast: false,
    subtitleScale: 'normal',
    colorblindMode: 'none',
    dyslexiaFont: false,
    screenReaderVoiceCues: true,
    masterVolume: 1.0,
    musicVolume: 0.85,
    sfxVolume: 0.90,
    voiceVolume: 1.0,
  };

  private liveRegion: HTMLElement | null = null;
  private announcementQueue: string[] = [];

  constructor() {
    this.load();
    this.detectSystemPreferences();
    this.setupScreenReaderLiveRegion();
  }

  public static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  private detectSystemPreferences(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      try {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
          this.settings.reducedMotion = true;
          this.settings.screenShakeFactor = 0.0;
        }

        const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;
        if (prefersHighContrast) {
          this.settings.highContrast = true;
        }
      } catch (_) {
        // Safe fallback in non-browser or mock environments
      }
    }
  }

  private setupScreenReaderLiveRegion(): void {
    if (typeof document === 'undefined') return;

    let region = document.getElementById('a11y-live-region');
    if (!region) {
      region = document.createElement('div');
      region.id = 'a11y-live-region';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      region.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        border: 0;
      `;
      document.body.appendChild(region);
    }
    this.liveRegion = region;
  }

  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.announcementQueue.push(message);
    if (this.liveRegion) {
      this.liveRegion.setAttribute('aria-live', priority);
      this.liveRegion.textContent = '';
      // Force DOM reflow to trigger assistive tech announcement
      setTimeout(() => {
        if (this.liveRegion) {
          this.liveRegion.textContent = message;
        }
      }, 50);
    }
  }

  public getSettings(): Readonly<AccessibilitySettings> {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<AccessibilitySettings>): void {
    this.settings = {
      ...this.settings,
      ...partial,
      // Clamp numerical volumes and shake factors
      screenShakeFactor: Math.max(0, Math.min(1, partial.screenShakeFactor ?? this.settings.screenShakeFactor)),
      masterVolume: Math.max(0, Math.min(1, partial.masterVolume ?? this.settings.masterVolume)),
      musicVolume: Math.max(0, Math.min(1, partial.musicVolume ?? this.settings.musicVolume)),
      sfxVolume: Math.max(0, Math.min(1, partial.sfxVolume ?? this.settings.sfxVolume)),
      voiceVolume: Math.max(0, Math.min(1, partial.voiceVolume ?? this.settings.voiceVolume)),
    };
    this.save();
  }

  public getEffectiveShake(baseShake: number): number {
    if (this.settings.reducedMotion) return 0;
    return baseShake * this.settings.screenShakeFactor;
  }

  public isReducedMotion(): boolean {
    return this.settings.reducedMotion;
  }

  public isHighContrast(): boolean {
    return this.settings.highContrast;
  }

  public isDyslexiaFont(): boolean {
    return this.settings.dyslexiaFont;
  }

  public getScreenShakeFactor(): number {
    return this.settings.screenShakeFactor;
  }

  public getSubtitleFontSize(basePx = 14): number {
    switch (this.settings.subtitleScale) {
      case 'large':
        return Math.round(basePx * 1.25);
      case 'extra-large':
        return Math.round(basePx * 1.55);
      default:
        return basePx;
    }
  }

  public getFontFamily(isDisplay = false): string {
    if (this.settings.dyslexiaFont) {
      return '"OpenDyslexic", "Comic Sans MS", sans-serif';
    }
    return isDisplay ? '"Cinzel", Georgia, serif' : '"Outfit", "Inter", sans-serif';
  }

  public save(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(AccessibilityManager.STORAGE_KEY, JSON.stringify(this.settings));
      }
    } catch (_) {}
  }

  public load(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(AccessibilityManager.STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.settings = { ...this.settings, ...parsed };
        }
      }
    } catch (_) {}
  }

  public resetToDefaults(): void {
    this.settings = {
      reducedMotion: false,
      screenShakeFactor: 1.0,
      highContrast: false,
      subtitleScale: 'normal',
      colorblindMode: 'none',
      dyslexiaFont: false,
      screenReaderVoiceCues: true,
      masterVolume: 1.0,
      musicVolume: 0.85,
      sfxVolume: 0.90,
      voiceVolume: 1.0,
    };
    this.save();
  }
}
