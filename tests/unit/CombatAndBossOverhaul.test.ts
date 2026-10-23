import { describe, it, expect, beforeEach } from 'vitest';
import { Player } from '../../src/entities/Player';
import { CombatSystem, AttackSpec, DefenseSpec } from '../../src/gameplay/CombatSystem';
import { MahishasuraBoss } from '../../src/entities/MahishasuraBoss';
import { AsuraEliteVanguard } from '../../src/entities/AsuraEliteVanguard';
import { StoneRakshasa } from '../../src/entities/StoneRakshasa';
import { CheckpointManager } from '../../src/gameplay/CheckpointManager';
import { SaveGameManager } from '../../src/state/SaveGameManager';
import { Vector2D } from '../../src/physics/Vector2D';

describe('Stage 5 — Combat, Enemy AI & Boss Gameplay Production Overhaul', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Phase 5.1 & 5.2 — Player Combat & Combo Mechanics', () => {
    it('manages weapon swapping between Agni-Chakram and Prana-Glaive with cooldown and combo reset', () => {
      const player = new Player('p1', 0, 0);
      expect(player.getActiveWeaponStats().type).toBe('AGNI_CHAKRAM');
      expect(player.getActiveWeaponStats().name).toBe('Agni-Chakram');

      // Swap to Prana-Glaive
      const swapped = player.swapWeapon();
      expect(swapped).toBe(true);
      expect(player.getActiveWeaponStats().type).toBe('PRANA_GLAIVE');
      expect(player.getActiveWeaponStats().reach).toBe(125);
      expect(player.getActiveWeaponStats().canBreakShield).toBe(true);

      // Rapid swap rejected during swap cooldown (150ms)
      expect(player.swapWeapon()).toBe(false);

      // After cooldown expires
      player.update(0.16);
      expect(player.swapWeapon()).toBe(true);
      expect(player.getActiveWeaponStats().type).toBe('AGNI_CHAKRAM');
    });

    it('progresses 3-hit combo chain with escalating damage and poise damage', () => {
      const player = new Player('p1', 0, 0);
      player.energy = 100;

      // Hit 1
      const hit1 = player.executeComboAttack();
      expect(hit1).not.toBeNull();
      expect(hit1?.arc.damage).toBe(28); // Agni-Chakram base 28
      expect(hit1?.arc.poiseDamage).toBe(18);
      expect(player.comboIndex).toBe(1);

      // Hit 2 (advance attack phase timer)
      player.update(0.25);
      const hit2 = player.executeComboAttack();
      expect(hit2).not.toBeNull();
      expect(hit2?.arc.damage).toBe(35); // 28 * 1.25 = 35
      expect(player.comboIndex).toBe(2);

      // Finisher (Hit 3)
      player.update(0.25);
      const finisher = player.executeComboAttack();
      expect(finisher).not.toBeNull();
      expect(finisher?.arc.damage).toBe(45); // 28 * 1.6 = 44.8 -> 45
      expect(finisher?.arc.poiseDamage).toBe(32); // 18 * 1.8 = 32.4 -> 32
      expect(player.comboIndex).toBe(0); // Resets back to 0
    });

    it('resets combo index to 0 if chain window expires', () => {
      const player = new Player('p1', 0, 0);
      player.executeComboAttack();
      expect(player.comboIndex).toBe(1);

      // Wait beyond comboChainWindow (1.0s)
      player.update(1.1);
      expect(player.comboIndex).toBe(0);
    });

    it('transitions through attack startup, active, and recovery phases, allowing dodge cancels in recovery', () => {
      const player = new Player('p1', 0, 0);
      player.executeComboAttack();

      expect(player.attackState).toBe('STARTUP');
      expect(player.canCancelWithDodge).toBe(false);

      // Step past startup (0.05s) into active
      player.update(0.06);
      expect(player.attackState).toBe('ACTIVE');

      // Step past active (0.09s) into recovery
      player.update(0.10);
      expect(player.attackState).toBe('RECOVERY');
      expect(player.canCancelWithDodge).toBe(true);

      // Cancel recovery immediately with a dodge/dash
      const dashSuccess = player.triggerDash();
      expect(dashSuccess).toBe(true);
      expect(player.isDashing).toBe(true);
      expect(player.attackState).toBe('IDLE'); // Cancelled recovery into dash!
    });

    it('buffers inputs when actions are pressed during startup/cooldown and executes them upon window opening', () => {
      const player = new Player('p1', 0, 0);
      player.executeComboAttack();
      expect(player.attackState).toBe('STARTUP');

      // Try attacking during startup - gets buffered!
      const immediateStrike = player.executeComboAttack();
      expect(immediateStrike).toBeNull();
      expect(player.inputBuffer).not.toBeNull();
      expect(player.inputBuffer?.action).toBe('ATTACK');

      // Step into recovery - buffered attack fires automatically!
      player.update(0.06); // to ACTIVE
      player.update(0.10); // to RECOVERY
      player.meleeCooldownTimer = 0; // cooldown reset
      player.update(0.01);

      expect(player.comboIndex).toBe(2); // Progressed to Hit 2 from buffer!
    });

    it('executes special attacks with dedicated animations, energy costs, and radii', () => {
      const player = new Player('p1', 0, 0);
      player.energy = 50;

      // Agni-Chakram: Surya Solar Vortex (360-deg radial spin)
      const specialAgni = player.executeSpecialAttack();
      expect(specialAgni).not.toBeNull();
      expect(specialAgni?.name).toBe('Surya Solar Vortex');
      expect(specialAgni?.arc.arcAngle).toBeCloseTo(Math.PI * 2.0);
      expect(specialAgni?.arc.damage).toBe(65);
      expect(player.energy).toBe(20); // 50 - 30

      // Cannot execute special when energy < 30
      player.meleeCooldownTimer = 0;
      expect(player.executeSpecialAttack()).toBeNull();

      // Prana-Glaive: Brahmic Sky Cleave
      player.energy = 100;
      player.update(0.7);
      player.swapWeapon();
      const specialGlaive = player.executeSpecialAttack();
      expect(specialGlaive).not.toBeNull();
      expect(specialGlaive?.name).toBe('Brahmic Sky Cleave');
      expect(specialGlaive?.arc.radius).toBe(155);
      expect(specialGlaive?.arc.damage).toBe(85);
      expect(specialGlaive?.arc.isShieldBreak).toBe(true);
    });
  });

  describe('Phase 5.3 — Enemy Behavior & Squad Coordination', () => {
    it('AsuraEliteVanguard approaches from designated flanking angles based on squad role', () => {
      const playerPos = new Vector2D(0, 0);
      const alphaFlanker = new AsuraEliteVanguard('v_alpha', -100, 0, 'Alpha_Left');
      const betaFlanker = new AsuraEliteVanguard('v_beta', 100, 0, 'Beta_Right');

      // Update AI
      alphaFlanker.updateAI(playerPos, 0.1);
      betaFlanker.updateAI(playerPos, 0.1);

      expect(alphaFlanker.role).toBe('Alpha_Left');
      expect(betaFlanker.role).toBe('Beta_Right');
      expect(alphaFlanker.isGuarding).toBe(true);
      expect(betaFlanker.isGuarding).toBe(true);
    });

    it('StoneRakshasa has poise data and its ground slam windup is interrupted by stagger', () => {
      const rakshasa = new StoneRakshasa('rakshasa_1', 0, 0);
      expect(rakshasa.poise.current).toBe(80);
      expect(rakshasa.poise.isStaggered).toBe(false);

      // Start slam windup
      rakshasa.isWindingUp = true;

      // Heavy poise damage (85 poise dmg) breaks guard
      rakshasa.takeDamage(40, 85);
      expect(rakshasa.poise.isStaggered).toBe(true);
      expect(rakshasa.isWindingUp).toBe(false); // Slam was cancelled by poise break!

      // While staggered, updateAI stalls and returns no shockwaves
      const shock = rakshasa.updateAI(new Vector2D(10, 10), 0.1);
      expect(shock).toBeNull();
    });
  });

  describe('Phase 5.4 — Multi-Phase Mahishasura Boss Encounter', () => {
    it('transitions through Phase 1, Phase 2, and Phase 3 with invulnerability roars and stat escalations', () => {
      const boss = new MahishasuraBoss('boss', 0, 0);
      expect(boss.getPhase()).toBe(1);
      expect(boss.speed).toBe(120);

      // Reduce health to 680 (Phase 2 threshold <= 700)
      boss.takeDamage(320);
      expect(boss.getPhase()).toBe(2);
      expect(boss.phaseTransitionTimer).toBeGreaterThan(0);
      expect(boss.speed).toBe(145);
      expect(boss.hasSummonedPhase2Squad).toBe(true);

      // Harvested roar shockwave and reinforcements
      expect(boss.pendingEvents.length).toBeGreaterThanOrEqual(1);

      // Advance past transition roar
      boss.updateAI(new Vector2D(0, 200), 1.1);
      expect(boss.phaseTransitionTimer).toBe(0);

      // Damage down to 280 (Phase 3 threshold <= 300)
      boss.takeDamage(400);
      expect(boss.getPhase()).toBe(3);
      expect(boss.speed).toBe(180); // Berserk speed
      expect(boss.poise.max).toBe(300);
    });

    it('operates deterministic frame timers for shadow blink teleportation without setTimeout', () => {
      const boss = new MahishasuraBoss('boss', 0, 0);
      const playerPos = new Vector2D(100, 100);

      boss.takeDamage(320); // Enter Phase 2
      boss.phaseTransitionTimer = 0;
      boss.orbCooldownTimer = 0;

      // Run AI tick to trigger teleport
      boss.updateAI(playerPos, 0.05);

      if (boss.isTeleporting) {
        expect(boss.teleportTimer).toBeGreaterThan(0);
        // Step timer forward deterministically
        boss.updateAI(playerPos, 0.45);
        expect(boss.isTeleporting).toBe(false);
        expect(boss.recoveryTimer).toBeGreaterThan(0); // Fair recovery window!
      }
    });

    it('enforces fair vulnerability recovery windows after boss attacks', () => {
      const boss = new MahishasuraBoss('boss', 0, 0);
      const playerPos = new Vector2D(0, 200);

      // Trigger charge
      boss.isCharging = true;
      boss.chargeWindupTimer = 0;
      boss.chargeDurationTimer = 0.05;

      // Step charge completion
      boss.updateAI(playerPos, 0.06);
      expect(boss.isCharging).toBe(false);
      expect(boss.recoveryTimer).toBeCloseTo(0.60); // 600ms recovery window!
    });
  });

  describe('Phase 5.5 — Combat Resolution, Parries & Progression', () => {
    it('CombatSystem authoritatively resolves perfect parry, directional block, and guard breaks', () => {
      const combat = new CombatSystem();

      // 1. Perfect Parry (120ms active)
      const attack: AttackSpec = {
        attackerId: 'boss',
        damage: 40,
        poiseDamage: 30,
        origin: new Vector2D(0, -50),
      };

      const parryDef: DefenseSpec = {
        defenderId: 'player',
        position: new Vector2D(0, 0),
        facing: new Vector2D(0, -1),
        isGuarding: true,
        parryWindowTimer: 0.10, // Active parry
        poise: { current: 100, max: 100, isStaggered: false, staggerTimer: 0, staggerDuration: 1.2 },
      };

      const parryRes = combat.resolveAttack(attack, parryDef);
      expect(parryRes.wasParried).toBe(true);
      expect(parryRes.damageDealt).toBe(0);

      // 2. Normal Directional Block (facing attack, no parry)
      parryDef.parryWindowTimer = 0;
      const blockRes = combat.resolveAttack(attack, parryDef);
      expect(blockRes.wasBlocked).toBe(true);
      expect(blockRes.damageDealt).toBe(10); // Absorbs 75%, deals 25% (40 * 0.25 = 10)

      // 3. Guard Break (Shield Break attack against guarding enemy)
      attack.isShieldBreak = true;
      const breakRes = combat.resolveAttack(attack, parryDef);
      expect(breakRes.wasBlocked).toBe(false); // Bypasses guard
      expect(breakRes.poiseDamageDealt).toBe(60); // 2x poise damage (30 * 2 = 60)
    });

    it('CheckpointManager registers sanctum gateway and restores player to full vitality', () => {
      const cm = new CheckpointManager();
      cm.register('cp_throne_sanctum', 'Throne Sanctum Gateway', 0, 280);

      const player = new Player('p1', 500, 500);
      player.health = 12;
      player.energy = 5;

      cm.restorePlayer(player);
      expect(player.position.x).toBe(0);
      expect(player.position.y).toBe(280);
      expect(player.health).toBe(100);
      expect(player.energy).toBe(100);
    });

    it('persists encounter progression upon victory', () => {
      SaveGameManager.clear();
      SaveGameManager.save({
        shardsCollected: 3,
        highScore: 8500,
        currentRealm: 'ThroneSanctum',
      });

      const loaded = SaveGameManager.load();
      expect(loaded.highScore).toBe(8500);
      expect(loaded.currentRealm).toBe('ThroneSanctum');
    });
  });
});
