export type PlatformType = 'web' | 'windows' | 'macos' | 'linux' | 'android' | 'ios';

export interface PlatformCapabilities {
  platform: PlatformType;
  hasTouch: boolean;
  hasGamepad: boolean;
  hasKeyboard: boolean;
  dpr: number;
  viewportWidth: number;
  viewportHeight: number;
  isMobile: boolean;
}

export class PlatformBridge {
  private static instance: PlatformBridge;
  private capabilities: PlatformCapabilities;

  private constructor() {
    this.capabilities = this.detectCapabilities();
    this.setupResizeListener();
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
    const isMobile = platform === 'android' || platform === 'ios' || (hasTouch && window.innerWidth <= 768);

    return {
      platform,
      hasTouch,
      hasGamepad,
      hasKeyboard: !isMobile,
      dpr: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 1280,
      viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 720,
      isMobile,
    };
  }

  private setupResizeListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('resize', () => {
      this.capabilities.viewportWidth = window.innerWidth;
      this.capabilities.viewportHeight = window.innerHeight;
      this.capabilities.dpr = window.devicePixelRatio || 1;
    });
  }

  public getCapabilities(): PlatformCapabilities {
    return { ...this.capabilities };
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
