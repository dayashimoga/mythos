import { describe, it, expect } from 'vitest';
import { Player } from '../../src/entities/Player';
import { AstraShard } from '../../src/entities/AstraShard';
import { Altar } from '../../src/entities/Altar';
import { EnemySentinel } from '../../src/entities/EnemySentinel';
import { Projectile } from '../../src/entities/Projectile';
import { Vector2D } from '../../src/physics/Vector2D';

describe('Game Entities Subsystem', () => {
  describe('Player (Veer)', () => {
    it('moves in 8 directions and updates bounds', () => {
      const p = new Player('player', 0, 0);
      p.move(new Vector2D(1, 0), 0.1);
      expect(p.position.x).toBeGreaterThan(0);
      expect(p.bounds.x).toBe(p.position.x - p.bounds.width / 2);
    });

    it('performs Agni-Dash with energy cost and cooldown', () => {
      const p = new Player('player', 0, 0);
      expect(p.energy).toBe(100);

      const dashed = p.triggerDash();
      expect(dashed).toBe(true);
      expect(p.isDashing).toBe(true);
      expect(p.energy).toBe(75);
      expect(p.dashCooldownTimer).toBeGreaterThan(0);

      // Cannot dash immediately while on cooldown
      const secondDash = p.triggerDash();
      expect(secondDash).toBe(false);
    });

    it('shoots Surya-Burst projectile and updates cooldown', () => {
      const p = new Player('player', 0, 0);
      const proj = p.shoot(new Vector2D(100, 0));
      expect(proj).not.toBeNull();
      expect(proj!.velocity.x).toBeGreaterThan(0);
      expect(p.energy).toBe(85);
      expect(p.shootCooldownTimer).toBeGreaterThan(0);
    });

    it('regenerates energy over time up to max', () => {
      const p = new Player('player', 0, 0);
      p.energy = 50;
      p.update(1.0);
      expect(p.energy).toBeGreaterThan(50);
      expect(p.energy).toBeLessThanOrEqual(p.maxEnergy);
    });
  });

  describe('AstraShard', () => {
    it('levitates sinusoidally and attracts toward player', () => {
      const shard = new AstraShard('shard1', 100, 100);
      shard.update(0.5);
      expect(shard.position.y).not.toBe(100);

      // Attract towards player at (120, 100)
      const playerPos = new Vector2D(120, 100);
      shard.attractTowards(playerPos, 0.1);
      expect(shard.position.x).toBeGreaterThan(100);
    });
  });

  describe('Altar of Surya', () => {
    it('progresses from dormant to attuning to consecrated', () => {
      const altar = new Altar('altar', 0, 0);
      expect(altar.state).toBe('dormant');

      altar.depositShard();
      expect(altar.state).toBe('attuning');
      expect(altar.shardsDeposited).toBe(1);

      altar.depositShard();
      expect(altar.state).toBe('attuning');

      altar.depositShard();
      expect(altar.state).toBe('consecrated');
      expect(altar.shardsDeposited).toBe(3);
    });
  });

  describe('EnemySentinel', () => {
    it('patrols around origin and takes damage from attacks', () => {
      const sentinel = new EnemySentinel('sen1', 0, 0);
      sentinel.update(0.5);
      expect(sentinel.position.x).not.toBe(0);

      const killedFirst = sentinel.takeDamage(25);
      expect(killedFirst).toBe(false);
      expect(sentinel.health).toBe(25);

      const killedSecond = sentinel.takeDamage(25);
      expect(killedSecond).toBe(true);
      expect(sentinel.isActive).toBe(false);
    });
  });

  describe('Projectile', () => {
    it('travels along trajectory and expires after lifespan', () => {
      const proj = new Projectile('p1', 0, 0, new Vector2D(1, 0), 100);
      proj.update(0.5);
      expect(proj.position.x).toBe(50);
      expect(proj.isActive).toBe(true);

      proj.update(2.0); // Exceeds 1.8s life
      expect(proj.isActive).toBe(false);
    });
  });
});
