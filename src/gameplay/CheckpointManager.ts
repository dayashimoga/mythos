import { Vector2D } from '../physics/Vector2D';
import { Player } from '../entities/Player';

export interface Checkpoint {
  id: string;
  name: string;
  position: Vector2D;
  isActivated: boolean;
}

export class CheckpointManager {
  private checkpoints: Map<string, Checkpoint> = new Map();
  private activeCheckpointId: string | null = null;

  public register(id: string, name: string, x: number, y: number): Checkpoint {
    const cp: Checkpoint = {
      id,
      name,
      position: new Vector2D(x, y),
      isActivated: false,
    };
    this.checkpoints.set(id, cp);
    if (!this.activeCheckpointId) {
      this.activeCheckpointId = id;
      cp.isActivated = true;
    }
    return cp;
  }

  public activate(id: string): boolean {
    const cp = this.checkpoints.get(id);
    if (!cp) return false;

    for (const c of this.checkpoints.values()) {
      c.isActivated = false;
    }
    cp.isActivated = true;
    this.activeCheckpointId = id;
    return true;
  }

  public getActiveCheckpoint(): Checkpoint | null {
    if (!this.activeCheckpointId) return null;
    return this.checkpoints.get(this.activeCheckpointId) || null;
  }

  public getAllCheckpoints(): Checkpoint[] {
    return Array.from(this.checkpoints.values());
  }

  public restorePlayer(player: Player): boolean {
    const cp = this.getActiveCheckpoint();
    if (!cp) return false;

    player.position.set(cp.position.x, cp.position.y);
    player.syncBounds();
    player.health = player.maxHealth;
    player.energy = player.maxEnergy;
    player.velocity.set(0, 0);
    player.isDashing = false;
    return true;
  }

  public clear(): void {
    this.checkpoints.clear();
    this.activeCheckpointId = null;
  }
}
