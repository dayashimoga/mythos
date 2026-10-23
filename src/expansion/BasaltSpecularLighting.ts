import { Vector2D } from '../physics/Vector2D';
import { AABB } from '../physics/AABB';
import { IRenderer } from '../render/CanvasRenderer';

export interface DynamicPointLight {
  position: Vector2D;
  radius: number;
  color: string;
  intensity: number;
}

export interface BasaltBlock {
  bounds: AABB;
  normal: Vector2D; // 2D surface normal orientation
  roughness: number; // 0 (mirror-like wet) to 1 (diffuse stone)
  specularPower: number;
}

export class BasaltSpecularLighting {
  public blocks: BasaltBlock[] = [];
  public lights: DynamicPointLight[] = [];

  constructor() {
    this.initDefaultBasaltGrid();
  }

  private initDefaultBasaltGrid(): void {
    // Subterranean basalt columns
    for (let i = 0; i < 6; i++) {
      const bx = 120 + i * 140;
      const by = 480;
      const bw = 100;
      const bh = 140;
      this.blocks.push({
        bounds: new AABB(bx, by, bw, bh),
        normal: new Vector2D(0, -1), // Facing upward towards cave light
        roughness: 0.25, // Wet glossy basalt
        specularPower: 32,
      });
    }
  }

  public addLight(position: Vector2D, radius = 220, color = '#33ffaa', intensity = 1.0): void {
    this.lights.push({ position, radius, color, intensity });
  }

  public clearLights(): void {
    this.lights = [];
  }

  public calculateBlockLighting(block: BasaltBlock): { diffuse: number; specular: number } {
    let totalDiffuse = 0;
    let totalSpecular = 0;

    const blockCenter = new Vector2D(
      block.bounds.x + block.bounds.width / 2,
      block.bounds.y + block.bounds.height / 2
    );

    for (const light of this.lights) {
      const dist = blockCenter.distanceTo(light.position);
      if (dist > light.radius) continue;

      const atten = Math.max(0, 1 - dist / light.radius);
      const lightDir = light.position.subtract(blockCenter).normalize();

      // Diffuse N • L
      const nDotL = Math.max(0, block.normal.dot(lightDir));
      totalDiffuse += nDotL * atten * light.intensity;

      // Specular Blinn-Phong simulation (assuming viewer direction V = (0, -1))
      const viewDir = new Vector2D(0, -1);
      const halfVec = lightDir.add(viewDir).normalize();
      const nDotH = Math.max(0, block.normal.dot(halfVec));
      const spec = Math.pow(nDotH, block.specularPower) * (1 - block.roughness);
      totalSpecular += spec * atten * light.intensity;
    }

    return {
      diffuse: Math.min(1.0, totalDiffuse),
      specular: Math.min(1.0, totalSpecular),
    };
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();

    for (const block of this.blocks) {
      const { diffuse, specular } = this.calculateBlockLighting(block);

      // Base stone fill
      renderer.drawRect(
        block.bounds.x,
        block.bounds.y,
        block.bounds.width,
        block.bounds.height,
        '#0f171e',
        '#1b2836'
      );

      ctx.save();
      // Diffuse tint
      if (diffuse > 0.05) {
        ctx.fillStyle = `rgba(30, 80, 60, ${diffuse * 0.45})`;
        ctx.fillRect(block.bounds.x, block.bounds.y, block.bounds.width, block.bounds.height);
      }

      // Specular highlight band
      if (specular > 0.05) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(180, 255, 220, ${specular * 0.75})`;
        ctx.fillRect(
          block.bounds.x + 8,
          block.bounds.y + 4,
          block.bounds.width - 16,
          Math.max(6, 20 * specular)
        );
      }
      ctx.restore();
    }
  }
}
