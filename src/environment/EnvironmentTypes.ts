import { AABB } from '../physics/AABB';
import { Camera } from '../render/Camera';

export type TimeOfDayPreset = 'DAWN' | 'NOON' | 'SUNSET' | 'NIGHT' | 'ECLIPSE';
export type WeatherPreset = 'SOLAR_CLEAR' | 'MONSOON_MIST' | 'CHASM_EMBERS' | 'VALLEY_WIND';

export enum CollisionLayer {
  NONE = 0,
  TERRAIN_SOLID = 1 << 0,     // Walls, pillars, tree trunks, boulders
  CHASM_ABYSS = 1 << 1,       // Impassable deep gorges
  HAZARD_LAVA = 1 << 2,       // Lava fissures dealing damage
  WATER_SHALLOW = 1 << 3,     // Stepped ghat, shallow stream
  INTERACTIVE_PROP = 1 << 4,  // Braziers, prayer wheels, bell shrines
  TRIGGER_ZONE = 1 << 5,      // Landmark discovery, zone transitions
}

export enum LODLevel {
  LOD0_DETAILED = 0, // High-fidelity geometry with micro-ornaments (< 600px)
  LOD1_MEDIUM = 1,   // Simplified silhouette and main shapes (600 - 1400px)
  LOD2_FAR = 2,      // Distant billboard / basic bounds (> 1400px)
}

export interface ILightSource {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
  flickerSpeed?: number;
  flickerAmount?: number;
  isDynamic?: boolean;
}

export interface IEnvironmentObject {
  id: string;
  layer: CollisionLayer;
  bounds: AABB;
  lodLevel?: LODLevel;
  zoneId: string;
  isInteractive?: boolean;
  interactionPrompt?: string;
  isLit?: boolean;
  angle?: number;
  customData?: Record<string, unknown>;
  render(ctx: CanvasRenderingContext2D, camera: Camera, lod: LODLevel, time: number): void;
  onInteract?(playerPos: { x: number; y: number }): void;
}

export interface IWorldChunk {
  id: string;
  gridX: number;
  gridY: number;
  bounds: AABB;
  objects: IEnvironmentObject[];
  isVisible: boolean;
  lodLevel: LODLevel;
}

export interface NavNode {
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  traversable: boolean;
  cost: number; // 1.0 = road, 1.1 = path, 1.4 = meadow, 2.0 = water, Infinity = impassable
  gScore: number;
  fScore: number;
  parent: NavNode | null;
}

export interface NavPath {
  points: { x: number; y: number }[];
  totalCost: number;
  isValid: boolean;
}

export interface LandmarkInfo {
  id: string;
  name: string;
  zone: string;
  description: string;
  x: number;
  y: number;
  discovered: boolean;
}
