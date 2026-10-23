/**
 * Mythos: Astra & The Seven Realms
 * Stage 6 UI/UX Design System Tokens
 *
 * Defines color palettes, typography scales, spacing grids, layout breakpoints,
 * focus styles, and contrast ratio validation for accessible, aesthetic rendering.
 */

export interface ColorToken {
  main: string;
  hover: string;
  active: string;
  border: string;
  glow: string;
  text: string;
}

export const DesignTokens = {
  // Brand & Aesthetic Colors (Vedic Celestial & Solar Tamas)
  colors: {
    bgDeep: '#080C14',
    bgSurface: '#121824',
    bgElevated: '#1E293B',
    bgGlass: 'rgba(18, 24, 36, 0.88)',
    bgGlassDark: 'rgba(8, 12, 20, 0.94)',

    solar: {
      primary: '#FFB703',
      secondary: '#FB8500',
      glow: '#FFD166',
      subtle: 'rgba(255, 183, 3, 0.15)',
      contrastText: '#080C14',
    },

    astral: {
      primary: '#00E5FF',
      secondary: '#0284C7',
      glow: '#38BDF8',
      subtle: 'rgba(0, 229, 255, 0.15)',
      contrastText: '#080C14',
    },

    prana: {
      primary: '#06D6A0',
      secondary: '#10B981',
      glow: '#34D399',
      subtle: 'rgba(6, 214, 160, 0.15)',
      contrastText: '#080C14',
    },

    tamas: {
      primary: '#DC2626',
      secondary: '#EF4444',
      glow: '#FCA5A5',
      subtle: 'rgba(220, 38, 38, 0.15)',
      contrastText: '#FFFFFF',
    },

    brahma: {
      primary: '#8338EC',
      secondary: '#9333EA',
      glow: '#C77DFF',
      subtle: 'rgba(131, 56, 236, 0.15)',
      contrastText: '#FFFFFF',
    },

    text: {
      primary: '#F8F9FA',
      secondary: '#94A3B8',
      muted: '#64748B',
      accent: '#FFD166',
      error: '#EF4444',
      success: '#10B981',
    },

    borders: {
      gold: '#D97706',
      subtleGold: 'rgba(255, 183, 3, 0.35)',
      cyan: '#0284C7',
      subtleCyan: 'rgba(0, 229, 255, 0.3)',
      divider: 'rgba(148, 163, 184, 0.2)',
    },

    focus: {
      outline: '#00E5FF',
      glow: 'rgba(0, 229, 255, 0.75)',
      width: 2.5,
    },
  },

  // High Contrast Accessibility Palette Overrides
  highContrastColors: {
    bgDeep: '#000000',
    bgSurface: '#0B0F19',
    bgElevated: '#151D2C',
    bgGlass: 'rgba(11, 15, 25, 0.98)',
    textPrimary: '#FFFFFF',
    textSecondary: '#E2E8F0',
    solarPrimary: '#FFE600',
    astralPrimary: '#00FFFF',
    pranaPrimary: '#00FF66',
    tamasPrimary: '#FF1133',
    bordersGold: '#FFD700',
    focusOutline: '#00FFFF',
  },

  // Typography Scales
  typography: {
    fonts: {
      display: '"Cinzel", Georgia, serif',
      body: '"Outfit", "Inter", -apple-system, sans-serif',
      mono: '"JetBrains Mono", monospace',
    },
    sizes: {
      xs: '10px',
      sm: '12px',
      md: '14px',
      lg: '16px',
      xl: '20px',
      xxl: '26px',
      title: '36px',
      hero: '48px',
    },
    weights: {
      regular: '400',
      medium: '500',
      semiBold: '600',
      bold: '700',
    },
  },

  // Spacing Grid (4px base)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Responsive Breakpoints
  breakpoints: {
    mobile: 640,
    tablet: 1024,
    desktop: 1440,
  },

  // Motion Durations (seconds)
  motion: {
    fast: 0.12,
    normal: 0.22,
    slow: 0.40,
    reduced: 0.01,
  },
};

/**
 * Calculates WCAG 2.1 relative luminance for hex color strings
 */
export function getRelativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const sRGB = [r, g, b].map((val) =>
    val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  );

  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

/**
 * Computes contrast ratio between two hex colors according to WCAG 2.1 guidelines
 * (Returns a value from 1:1 up to 21:1)
 */
export function calculateContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
