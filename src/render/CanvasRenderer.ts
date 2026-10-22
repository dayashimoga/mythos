import { Camera, ViewportBounds } from './Camera';
import { AABB } from '../physics/AABB';
import { SacredGeometry } from './SacredGeometry';

export interface IRenderer {
  clear(color: string): void;
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  scale(sx: number, sy: number): void;
  rotate(angle: number): void;
  drawRect(x: number, y: number, w: number, h: number, fill?: string, stroke?: string): void;
  drawCircle(x: number, y: number, radius: number, fill?: string, stroke?: string): void;
  drawText(text: string, x: number, y: number, font: string, color: string, align?: CanvasTextAlign): void;
  drawAABB(bounds: AABB, color: string): void;
  drawMandala(x: number, y: number, radius: number, petals: number, angle: number, color: string): void;
  getCamera(): Camera;
  getViewport(): ViewportBounds;
  getContext(): CanvasRenderingContext2D;
  beginWorldPass(): void;
  endWorldPass(): void;
}

export class CanvasRenderer implements IRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to acquire 2D rendering context');
    }
    this.ctx = context;
    this.camera = new Camera(canvas.width, canvas.height);
  }

  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  public getCamera(): Camera {
    return this.camera;
  }

  public getViewport(): ViewportBounds {
    return {
      x: 0,
      y: 0,
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }

  public clear(color = '#080C14'): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public save(): void {
    this.ctx.save();
  }

  public restore(): void {
    this.ctx.restore();
  }

  public translate(x: number, y: number): void {
    this.ctx.translate(x, y);
  }

  public scale(sx: number, sy: number): void {
    this.ctx.scale(sx, sy);
  }

  public rotate(angle: number): void {
    this.ctx.rotate(angle);
  }

  public beginWorldPass(): void {
    this.ctx.save();
    // Center of screen
    this.ctx.translate(
      this.canvas.width / 2 + this.camera.shakeOffset.x,
      this.canvas.height / 2 + this.camera.shakeOffset.y
    );
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    this.ctx.translate(-this.camera.position.x, -this.camera.position.y);
  }

  public endWorldPass(): void {
    this.ctx.restore();
  }

  public drawRect(x: number, y: number, w: number, h: number, fill?: string, stroke?: string): void {
    if (fill) {
      this.ctx.fillStyle = fill;
      this.ctx.fillRect(x, y, w, h);
    }
    if (stroke) {
      this.ctx.strokeStyle = stroke;
      this.ctx.strokeRect(x, y, w, h);
    }
  }

  public drawCircle(x: number, y: number, radius: number, fill?: string, stroke?: string): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    if (fill) {
      this.ctx.fillStyle = fill;
      this.ctx.fill();
    }
    if (stroke) {
      this.ctx.strokeStyle = stroke;
      this.ctx.stroke();
    }
  }

  public drawText(
    text: string,
    x: number,
    y: number,
    font = '16px sans-serif',
    color = '#FFFFFF',
    align: CanvasTextAlign = 'left'
  ): void {
    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.fillText(text, x, y);
  }

  public drawAABB(bounds: AABB, color = '#00FF00'): void {
    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 4]);
    this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    this.ctx.restore();
  }

  public drawMandala(x: number, y: number, radius: number, petals: number, angle: number, color: string): void {
    SacredGeometry.drawMandala(this.ctx, x, y, radius, petals, angle, color);
  }
}
