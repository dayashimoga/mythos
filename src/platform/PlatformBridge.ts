export type PlatformType = 'web' | 'windows' | 'macos' | 'linux' | 'android' | 'ios';
export type DeviceType = 'desktop' | 'tablet' | 'mobile' | 'console';
export type LifecycleState = 'active' | 'suspended' | 'hidden';

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface BatteryStatus {
  level: number; // 0.0 to 1.0
  isCharging: boolean;
  isLowPowerMode: boolean;
}

export interface PlatformCapabilities {
  platform: PlatformType;
  deviceType: DeviceType;
  hasTouch: boolean;
  hasGamepad: boolean;
  hasKeyboard: boolean;
  dpr: number;
  viewportWidth: number;
  viewportHeight: number;
  isMobile: boolean;
  safeArea: SafeAreaInsets;
  battery: BatteryStatus;
  isOnline: boolean;
}

export class PlatformBridge {
  private static instance: PlatformBridge;
  private capabilities: PlatformCapabilities;
  private lifecycleListeners: Set<(state: LifecycleState) => void> = new Set();
  private currentState: LifecycleState = 'active';

  private constructor() {
    this.capabilities = this.detectCapabilities();
    this.setupResizeListener();
    this.setupLifecycleListeners();
    this.setupBatteryMonitoring();
  }

  public static getInstance(): PlatformBridge {
    if (!PlatformBridge.instance) {
      PlatformBridge.instance = new PlatformBridge();
    }
    return PlatformBridge.instance;
  }

  private detectCapabilities(): PlatformCapabilities {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
    let platform: PlatformType = 'web';

    if (/android/i.test(userAgent)) {
      platform = 'android';
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
      platform = 'ios';
    } else if (/win/i.test(userAgent)) {
      platform = 'windows';
    } else if (/mac/i.test(userAgent)) {
      platform = 'macos';
    } else if (/linux/i.test(userAgent)) {
      platform = 'linux';
    }

    const hasTouch = Boolean(
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0))
    );
    const hasGamepad = Boolean(typeof navigator !== 'undefined' && 'getGamepads' in navigator);

    const isTablet = hasTouch && typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth <= 1024;
    const isPhone = (platform === 'android' || platform === 'ios') && !isTablet;
    const isMobile = isPhone || (hasTouch && typeof window !== 'undefined' && window.innerWidth < 768);

    let deviceType: DeviceType = 'desktop';
    if (isPhone) deviceType = 'mobile';
    else if (isTablet) deviceType = 'tablet';

    // Safe area calculation fallback
    const safeArea: SafeAreaInsets = {
      top: isPhone ? 44 : 0, // Notch height fallback for iOS
      bottom: isPhone ? 34 : 0, // Home bar fallback
      left: 0,
      right: 0,
    };

    const battery: BatteryStatus = {
      level: 1.0,
      isCharging: true,
      isLowPowerMode: false,
    };

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    return {
      platform,
      deviceType,
      hasTouch,
      hasGamepad,
      hasKeyboard: !isMobile,
      dpr: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 1280,
      viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 720,
      isMobile,
      safeArea,
      battery,
      isOnline,
    };
  }

  private setupResizeListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('resize', () => {
      this.capabilities.viewportWidth = window.innerWidth;
      this.capabilities.viewportHeight = window.innerHeight;
      this.capabilities.dpr = window.devicePixelRatio || 1;
    });

    window.addEventListener('online', () => {
      this.capabilities.isOnline = true;
    });

    window.addEventListener('offline', () => {
      this.capabilities.isOnline = false;
    });
  }

  private setupLifecycleListeners(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      const newState: LifecycleState = document.hidden ? 'hidden' : 'active';
      this.setLifecycleState(newState);
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', () => {
        this.setLifecycleState('suspended');
      });
      window.addEventListener('freeze', () => {
        this.setLifecycleState('suspended');
      });
      window.addEventListener('resume', () => {
        this.setLifecycleState('active');
      });
    }
  }

  private setupBatteryMonitoring(): void {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const update = () => {
          this.capabilities.battery = {
            level: battery.level,
            isCharging: battery.isCharging,
            isLowPowerMode: !battery.isCharging && battery.level <= 0.2,
          };
        };
        update();
        battery.addEventListener('levelchange', update);
        battery.addEventListener('chargingchange', update);
      }).catch(() => {
        // Battery API permission denied or unsupported
      });
    }
  }

  public setLifecycleState(state: LifecycleState): void {
    if (this.currentState === state) return;
    this.currentState = state;
    this.lifecycleListeners.forEach((listener) => {
      try {
        listener(state);
      } catch {
        // Graceful error isolation
      }
    });
  }

  public getLifecycleState(): LifecycleState {
    return this.currentState;
  }

  public onLifecycleChange(callback: (state: LifecycleState) => void): () => void {
    this.lifecycleListeners.add(callback);
    return () => this.lifecycleListeners.delete(callback);
  }

  public getCapabilities(): PlatformCapabilities {
    return { ...this.capabilities };
  }

  public triggerHaptic(durationMs = 20): boolean {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      return navigator.vibrate(durationMs);
    }
    return false;
  }

  public async toggleFullscreen(element?: HTMLElement): Promise<boolean> {
    if (typeof document === 'undefined') return false;

    try {
      if (!document.fullscreenElement) {
        const target = element || document.documentElement;
        if (target.requestFullscreen) {
          await target.requestFullscreen();
          return true;
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          return false;
        }
      }
    } catch {
      // Fullscreen not permitted
    }
    return false;
  }

  public resizeCanvas(canvas: HTMLCanvasElement, targetWidth = 1280, targetHeight = 720): { scale: number } {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scale = Math.min(windowWidth / targetWidth, windowHeight / targetHeight);
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    canvas.style.width = `${Math.floor(targetWidth * scale)}px`;
    canvas.style.height = `${Math.floor(targetHeight * scale)}px`;

    return { scale };
  }
}
