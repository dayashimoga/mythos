export enum RenderLayer {
  BACKGROUND = 0,     // Parallax celestial backdrop (sky, mountains, nebula)
  TERRAIN = 1,        // Carved stone floors, inlaid mandalas
  SHADOWS = 2,        // Dynamic contact shadows beneath actors and props
  ARCHITECTURE = 3,   // Pillars, altars, torana gates (Y-sorted)
  ACTORS = 4,         // Player Veer, Sentinels, Shards, Projectiles (Y-sorted)
  FOREGROUND = 5,     // Hanging garlands, arch tops, decorative borders
  VFX = 6,            // Particles, shockwaves, runes, slash ribbons, god rays
  LIGHTING = 7,       // Additive point lights, brazier glow, ambient darkness
  UI = 8,             // HUD, dialogues, objectives, pause modals
}

export interface RenderItem {
  layer: RenderLayer;
  sortY: number;
  render: (ctx: CanvasRenderingContext2D) => void;
}

export interface PointLight {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
  flicker?: boolean;
}

export enum GraphicsQuality {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  ULTRA = 'ULTRA',
}

export interface QualityProfile {
  quality: GraphicsQuality;
  shadows: boolean;
  lightShafts: boolean;
  maxDynamicLights: number;
  particlesScale: number;
  parallax: boolean;
}
