import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';

export interface Boid {
  id: number;
  position: Vector2D;
  velocity: Vector2D;
  species: 'PEACOCK' | 'GOLDEN_DEER';
}

export class FlockingSystem {
  public boids: Boid[] = [];
  public maxSpeed = 120;
  public maxForce = 80;
  public neighborRadius = 90;
  public separationRadius = 32;
  public threatRadius = 140;

  public boundsWidth: number;
  public boundsHeight: number;

  constructor(count = 20, width = 1200, height = 800) {
    this.boundsWidth = width;
    this.boundsHeight = height;
    this.initFlock(count);
  }

  private initFlock(count: number): void {
    this.boids = [];
    for (let i = 0; i < count; i++) {
      const species = i % 2 === 0 ? 'PEACOCK' : 'GOLDEN_DEER';
      this.boids.push({
        id: i,
        position: new Vector2D(Math.random() * this.boundsWidth, Math.random() * this.boundsHeight),
        velocity: new Vector2D((Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60),
        species,
      });
    }
  }

  public update(dt: number, threatPos?: Vector2D): void {
    for (const boid of this.boids) {
      const sep = this.calculateSeparation(boid);
      const ali = this.calculateAlignment(boid);
      const coh = this.calculateCohesion(boid);

      let steer = sep.multiply(1.5).add(ali.multiply(1.0)).add(coh.multiply(1.0));

      if (threatPos && boid.position.distanceTo(threatPos) < this.threatRadius) {
        const fleeDir = boid.position.subtract(threatPos).normalize();
        steer = steer.add(fleeDir.multiply(this.maxForce * 2.5));
      }

      // Clamp steer force
      if (steer.length() > this.maxForce) {
        steer = steer.normalize().multiply(this.maxForce);
      }

      boid.velocity = boid.velocity.add(steer.multiply(dt));

      // Clamp velocity to max speed
      if (boid.velocity.length() > this.maxSpeed) {
        boid.velocity = boid.velocity.normalize().multiply(this.maxSpeed);
      }

      boid.position = boid.position.add(boid.velocity.multiply(dt));

      // Boundary wrap
      if (boid.position.x < 0) boid.position.x = this.boundsWidth;
      if (boid.position.x > this.boundsWidth) boid.position.x = 0;
      if (boid.position.y < 0) boid.position.y = this.boundsHeight;
      if (boid.position.y > this.boundsHeight) boid.position.y = 0;
    }
  }

  private calculateSeparation(boid: Boid): Vector2D {
    let steer = new Vector2D(0, 0);
    let count = 0;

    for (const other of this.boids) {
      if (other.id === boid.id) continue;
      const d = boid.position.distanceTo(other.position);
      if (d > 0 && d < this.separationRadius) {
        const diff = boid.position.subtract(other.position).normalize().multiply(1 / d);
        steer = steer.add(diff);
        count++;
      }
    }

    if (count > 0) {
      steer = steer.multiply(1 / count);
    }
    return steer;
  }

  private calculateAlignment(boid: Boid): Vector2D {
    let avgVel = new Vector2D(0, 0);
    let count = 0;

    for (const other of this.boids) {
      if (other.id === boid.id) continue;
      const d = boid.position.distanceTo(other.position);
      if (d < this.neighborRadius) {
        avgVel = avgVel.add(other.velocity);
        count++;
      }
    }

    if (count > 0) {
      avgVel = avgVel.multiply(1 / count).normalize().multiply(this.maxSpeed);
      return avgVel.subtract(boid.velocity);
    }
    return new Vector2D(0, 0);
  }

  private calculateCohesion(boid: Boid): Vector2D {
    let center = new Vector2D(0, 0);
    let count = 0;

    for (const other of this.boids) {
      if (other.id === boid.id) continue;
      const d = boid.position.distanceTo(other.position);
      if (d < this.neighborRadius) {
        center = center.add(other.position);
        count++;
      }
    }

    if (count > 0) {
      center = center.multiply(1 / count);
      const desired = center.subtract(boid.position).normalize().multiply(this.maxSpeed);
      return desired.subtract(boid.velocity);
    }
    return new Vector2D(0, 0);
  }

  public render(renderer: IRenderer): void {
    for (const boid of this.boids) {
      const color = boid.species === 'PEACOCK' ? '#00b4d8' : '#e09f3e';
      const border = boid.species === 'PEACOCK' ? '#06d6a0' : '#ffd166';
      renderer.drawCircle(boid.position.x, boid.position.y, 6, color, border);
    }
  }
}
