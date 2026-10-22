import { describe, it, expect } from 'vitest';
import { VanaraScout } from '../../src/entities/VanaraScout';
import { StoneRakshasa } from '../../src/entities/StoneRakshasa';
import { TamasSpire } from '../../src/entities/TamasSpire';
import { ResonancePillar } from '../../src/entities/ResonancePillar';
import { AmritaFont } from '../../src/entities/AmritaFont';
import { AgniForge } from '../../src/entities/AgniForge';
import { Shockwave } from '../../src/entities/Shockwave';
import { DamageNumberSystem } from '../../src/render/DamageNumberSystem';
import { Vector2D } from '../../src/physics/Vector2D';
import { CanvasRenderer } from '../../src/render/CanvasRenderer';

describe('Stage 1 Entity Mechanics & AI', () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const renderer = new CanvasRenderer(canvas);

  describe('VanaraScout AI & Ranged Attacks', () => {
    it('orbits player, telegraphs shot, and fires void projectiles', () => {
      const scout = new VanaraScout('scout1', 200, 200);
      const playerPos = new Vector2D(0, 0);

      // AI update
      scout.updateAI(playerPos, 0.5);
      expect(scout.position.x).not.toBe(200);

      // Fast forward past telegraphing time
      let projs = null;
      for (let i = 0; i < 20; i++) {
        const result = scout.updateAI(playerPos, 0.1);
        if (result) {
          projs = result;
          break;
        }
      }

      expect(projs).not.toBeNull();
      expect(projs!.length).toBeGreaterThan(0);
      expect(projs![0].tag).toBe('enemy_projectile');

      // Takes damage and dies
      const killed = scout.takeDamage(50);
      expect(killed).toBe(true);
      expect(scout.isActive).toBe(false);
    });

    it('renders visual states without errors', () => {
      const scout = new VanaraScout('s', 0, 0);
      expect(() => scout.render(renderer)).not.toThrow();

      // Damaged and telegraphing state
      scout.isTelegraphing = true;
      scout.telegraphTimer = 0.5;
      scout.takeDamage(10);
      scout.update(0.05);
      expect(() => scout.render(renderer)).not.toThrow();
    });
  });

  describe('StoneRakshasa AI & Seismic Shockwave', () => {
    it('charges player, winds up, and emits expanding Shockwave', () => {
      const rakshasa = new StoneRakshasa('rakshasa1', 80, 0);
      const playerPos = new Vector2D(0, 0);

      // Trigger windup by being in close proximity (<110px)
      rakshasa.updateAI(playerPos, 1.6);
      expect(rakshasa.isWindingUp).toBe(true);

      // Complete windup (1.0s)
      const shockwave = rakshasa.updateAI(playerPos, 1.1);
      expect(shockwave).not.toBeNull();
      expect(shockwave instanceof Shockwave).toBe(true);
      expect(shockwave!.damage).toBe(35);

      // Rakshasa takes damage and dies
      const dead = rakshasa.takeDamage(150);
      expect(dead).toBe(true);
      expect(rakshasa.isActive).toBe(false);
    });

    it('renders without errors', () => {
      const rakshasa = new StoneRakshasa('r', 0, 0);
      rakshasa.isWindingUp = true;
      expect(() => rakshasa.render(renderer)).not.toThrow();

      // Damaged health bar render
      rakshasa.takeDamage(40);
      rakshasa.update(0.05);
      expect(() => rakshasa.render(renderer)).not.toThrow();
    });
  });

  describe('Shockwave Collision & Dash Avoidance', () => {
    it('hits player when walking into expanding perimeter', () => {
      const sw = new Shockwave('sw', 0, 0, 100, 30);
      sw.radius = 50;

      // Player at distance 50px, not dashing -> HIT
      const hit = sw.checkPlayerHit(new Vector2D(50, 0), false);
      expect(hit).toBe(true);
      expect(sw.hasHitPlayer).toBe(true);

      // Second check -> already hit, returns false
      expect(sw.checkPlayerHit(new Vector2D(50, 0), false)).toBe(false);
    });

    it('bypasses player safely if player is dashing (i-frames)', () => {
      const sw = new Shockwave('sw2', 0, 0, 100, 30);
      sw.radius = 40;

      // Player at distance 40px, but dashing = true -> NO HIT
      const hit = sw.checkPlayerHit(new Vector2D(40, 0), true);
      expect(hit).toBe(false);
      expect(sw.hasHitPlayer).toBe(false);
    });

    it('updates expansion and renders without errors', () => {
      const sw = new Shockwave('sw3', 0, 0, 50, 20);
      sw.update(0.1);
      expect(sw.radius).toBeGreaterThan(10);
      expect(() => sw.render(renderer)).not.toThrow();

      // Exceeds maxRadius -> destroys
      sw.update(2.0);
      expect(sw.isActive).toBe(false);
    });
  });

  describe('TamasSpire Objective Core', () => {
    it('is immune when shielded and takes damage when unshielded', () => {
      const spire = new TamasSpire('spire1', 0, 0);
      expect(spire.isShielded).toBe(true);

      // Hit while shielded
      const res1 = spire.takeDamage(50);
      expect(res1.shielded).toBe(true);
      expect(spire.health).toBe(200);

      // Drop shield
      spire.setShielded(false);
      expect(spire.isShielded).toBe(false);

      const res2 = spire.takeDamage(100);
      expect(res2.shielded).toBe(false);
      expect(spire.health).toBe(100);

      const res3 = spire.takeDamage(100);
      expect(res3.killed).toBe(true);
      expect(spire.isActive).toBe(false);
    });

    it('updates and renders without errors', () => {
      const spire = new TamasSpire('spire2', 0, 0);
      spire.update(0.5);
      expect(() => spire.render(renderer)).not.toThrow();

      // Damaged health bar render
      spire.setShielded(false);
      spire.takeDamage(50);
      spire.update(0.05);
      expect(() => spire.render(renderer)).not.toThrow();
    });
  });

  describe('ResonancePillar Attunement', () => {
    it('progresses from dormant to attuned on strike', () => {
      const pillar = new ResonancePillar('pillar_test', 0, 0, 'ॐ');
      expect(pillar.state).toBe('dormant');

      const attuned = pillar.attune();
      expect(attuned).toBe(true);
      expect(pillar.state).toBe('attuned');

      // Subsequent attunement returns false
      expect(pillar.attune()).toBe(false);

      pillar.update(0.1);
      expect(() => pillar.render(renderer)).not.toThrow();
    });
  });

  describe('AmritaFont & AgniForge Interactions', () => {
    it('AmritaFont drinks, heals, and enforces cooldown', () => {
      const font = new AmritaFont('font1', 0, 0);
      expect(font.canDrink()).toBe(true);

      const healed = font.drink();
      expect(healed).toBe(40);
      expect(font.canDrink()).toBe(false);
      expect(font.drink()).toBe(0);

      // Update timer
      font.update(font.cooldown + 0.1);
      expect(font.canDrink()).toBe(true);

      expect(() => font.render(renderer)).not.toThrow();
    });

    it('AgniForge consecrates weapon stance', () => {
      const forge = new AgniForge('forge1', 0, 0);
      expect(forge.isConsecrated).toBe(false);

      const success = forge.consecrate();
      expect(success).toBe(true);
      expect(forge.isConsecrated).toBe(true);

      expect(forge.consecrate()).toBe(false);

      forge.update(0.1);
      expect(() => forge.render(renderer)).not.toThrow();
    });
  });

  describe('DamageNumberSystem', () => {
    it('spawns, updates, and expires floating combat numbers', () => {
      const dns = new DamageNumberSystem(20);
      expect(dns.getActiveCount()).toBe(0);

      dns.spawn(100, 100, '-40', '#EF476F');
      expect(dns.getActiveCount()).toBe(1);

      dns.update(0.2);
      expect(() => dns.render(renderer)).not.toThrow();

      dns.update(1.0); // expired
      expect(dns.getActiveCount()).toBe(0);

      dns.spawn(50, 50, '+40 PRANA', '#06D6A0');
      dns.clear();
      expect(dns.getActiveCount()).toBe(0);
    });
  });
});
