import { describe, it, expect, beforeEach } from 'vitest';
import {
  Blackboard,
  ActionNode,
  ConditionNode,
  SequenceNode,
  SelectorNode,
  InverterNode,
  CooldownNode,
  NodeStatus,
} from '../../src/gameplay/BehaviorTree';
import { EquipmentManager } from '../../src/gameplay/EquipmentManager';
import { CombatSystem, PoiseData, AttackSpec, DefenseSpec } from '../../src/gameplay/CombatSystem';
import { CheckpointManager } from '../../src/gameplay/CheckpointManager';
import { Player } from '../../src/entities/Player';
import { Vector2D } from '../../src/physics/Vector2D';

describe('Stage 4: Behavior Tree Engine', () => {
  let bb: Blackboard;

  beforeEach(() => {
    bb = new Blackboard();
  });

  it('manages blackboard key-value state correctly', () => {
    expect(bb.has('target')).toBe(false);
    bb.set('target', 'PlayerVeer');
    expect(bb.has('target')).toBe(true);
    expect(bb.get<string>('target')).toBe('PlayerVeer');
    expect(bb.get<number>('non_existent', 42)).toBe(42);

    bb.delete('target');
    expect(bb.has('target')).toBe(false);
    bb.clear();
  });

  it('ActionNode executes custom action delegate and returns status', () => {
    let executed = false;
    const action = new ActionNode('test_action', (blackboard) => {
      executed = true;
      blackboard.set('executed', true);
      return NodeStatus.SUCCESS;
    });

    const status = action.tick(bb, 0.016);
    expect(status).toBe(NodeStatus.SUCCESS);
    expect(executed).toBe(true);
    expect(bb.get('executed')).toBe(true);
  });

  it('ConditionNode returns SUCCESS if predicate is true, FAILURE if false', () => {
    const condTrue = new ConditionNode('cond_true', () => true);
    const condFalse = new ConditionNode('cond_false', () => false);

    expect(condTrue.tick(bb, 0.016)).toBe(NodeStatus.SUCCESS);
    expect(condFalse.tick(bb, 0.016)).toBe(NodeStatus.FAILURE);
  });

  it('SequenceNode succeeds only when all children succeed', () => {
    const seq = new SequenceNode('seq_test');
    seq.addChild(new ConditionNode('c1', () => true));
    seq.addChild(new ConditionNode('c2', () => true));
    seq.addChild(new ActionNode('a1', () => NodeStatus.SUCCESS));

    expect(seq.tick(bb, 0.016)).toBe(NodeStatus.SUCCESS);

    // If one fails, sequence aborts with FAILURE
    const failingSeq = new SequenceNode('failing_seq');
    failingSeq.addChild(new ConditionNode('c1', () => true));
    failingSeq.addChild(new ConditionNode('c2', () => false));
    failingSeq.addChild(new ActionNode('a1', () => NodeStatus.SUCCESS));

    expect(failingSeq.tick(bb, 0.016)).toBe(NodeStatus.FAILURE);
  });

  it('SelectorNode succeeds when any child succeeds or runs', () => {
    const selector = new SelectorNode('sel_test');
    selector.addChild(new ConditionNode('c1', () => false));
    selector.addChild(new ActionNode('a1', () => NodeStatus.SUCCESS));
    selector.addChild(new ActionNode('a2', () => NodeStatus.FAILURE));

    expect(selector.tick(bb, 0.016)).toBe(NodeStatus.SUCCESS);

    // If all fail, selector returns FAILURE
    const allFail = new SelectorNode('all_fail');
    allFail.addChild(new ConditionNode('c1', () => false));
    allFail.addChild(new ConditionNode('c2', () => false));

    expect(allFail.tick(bb, 0.016)).toBe(NodeStatus.FAILURE);
  });

  it('InverterNode flips SUCCESS to FAILURE and vice-versa', () => {
    const invSuccess = new InverterNode('inv_s', new ConditionNode('t', () => true));
    const invFail = new InverterNode('inv_f', new ConditionNode('f', () => false));
    const invRunning = new InverterNode('inv_r', new ActionNode('r', () => NodeStatus.RUNNING));

    expect(invSuccess.tick(bb, 0.016)).toBe(NodeStatus.FAILURE);
    expect(invFail.tick(bb, 0.016)).toBe(NodeStatus.SUCCESS);
    expect(invRunning.tick(bb, 0.016)).toBe(NodeStatus.RUNNING);
  });

  it('CooldownNode enforces cooldown duration between successful executions', () => {
    const cool = new CooldownNode('cool_test', 0.5, new ActionNode('a', () => NodeStatus.SUCCESS));

    // 1st tick: executes and succeeds
    expect(cool.tick(bb, 0.016)).toBe(NodeStatus.SUCCESS);

    // 2nd tick immediately: on cooldown, returns FAILURE
    expect(cool.tick(bb, 0.016)).toBe(NodeStatus.FAILURE);

    // Advance time past cooldown
    expect(cool.tick(bb, 0.55)).toBe(NodeStatus.SUCCESS);
  });
});

describe('Stage 4: Equipment & Weapon Combo Subsystem', () => {
  let equip: EquipmentManager;

  beforeEach(() => {
    equip = new EquipmentManager();
  });

  it('initializes with Agni-Chakram and supports weapon switching', () => {
    expect(equip.getActiveWeapon()).toBe('AGNI_CHAKRAM');
    expect(equip.getActiveWeaponStats().reach).toBe(75);

    const swapped = equip.swapWeapon();
    expect(swapped).toBe(true);
    expect(equip.getActiveWeapon()).toBe('PRANA_GLAIVE');
    expect(equip.getActiveWeaponStats().reach).toBe(125);
    expect(equip.getActiveWeaponStats().canBreakShield).toBe(true);

    // Cannot swap immediately during swap cooldown
    expect(equip.canSwap()).toBe(false);
    expect(equip.swapWeapon()).toBe(false);

    equip.update(0.2);
    expect(equip.canSwap()).toBe(true);
  });

  it('calculates 3-hit combo progression with progressive damage and reach multipliers', () => {
    // Agni-Chakram combos
    const hit1 = equip.getComboStrike(0);
    const hit2 = equip.getComboStrike(1);
    const finisher = equip.getComboStrike(2);

    expect(hit1.damage).toBe(28);
    expect(hit2.damage).toBeGreaterThan(hit1.damage);
    expect(finisher.damage).toBeGreaterThan(hit2.damage);
    expect(finisher.reach).toBeGreaterThan(hit1.reach);

    // Switch to Prana Glaive (heavy poise damage, shield breaker on combo chain)
    equip.update(0.2);
    equip.swapWeapon();
    const gHit1 = equip.getComboStrike(0);
    const gHit2 = equip.getComboStrike(1);
    const gFinisher = equip.getComboStrike(2);

    expect(gHit1.damage).toBe(48);
    expect(gHit1.poiseDamage).toBe(38);
    expect(gHit2.isShieldBreak).toBe(true);
    expect(gFinisher.isShieldBreak).toBe(true);
  });

  it('handles Astra Essence accumulation and weapon stat upgrades', () => {
    expect(equip.essence).toBe(0);
    equip.addEssence(250);
    expect(equip.essence).toBe(250);

    // Level 1 -> Level 2 upgrade costs 100
    const upgraded = equip.upgradeWeapon('AGNI_CHAKRAM');
    expect(upgraded).toBe(true);
    expect(equip.getWeaponStats('AGNI_CHAKRAM').level).toBe(2);
    expect(equip.essence).toBe(150);

    // Level 2 -> Level 3 costs 200 (not enough essence)
    expect(equip.upgradeWeapon('AGNI_CHAKRAM')).toBe(false);
  });
});

describe('Stage 4: Authoritative Combat System', () => {
  let combat: CombatSystem;

  beforeEach(() => {
    combat = new CombatSystem();
  });

  it('resolves normal unblocked attack against defender', () => {
    const poise: PoiseData = {
      current: 100,
      max: 100,
      isStaggered: false,
      staggerTimer: 0,
      staggerDuration: 1.5,
    };

    const attack: AttackSpec = {
      attackerId: 'player',
      damage: 40,
      poiseDamage: 20,
      origin: new Vector2D(0, 0),
    };

    const defense: DefenseSpec = {
      defenderId: 'enemy',
      position: new Vector2D(50, 0),
      facing: new Vector2D(-1, 0),
      isGuarding: false,
      parryWindowTimer: 0,
      poise,
    };

    const res = combat.resolveAttack(attack, defense);
    expect(res.damageDealt).toBe(40);
    expect(res.poiseDamageDealt).toBe(20);
    expect(res.wasBlocked).toBe(false);
    expect(res.wasParried).toBe(false);
    expect(poise.current).toBe(80);
  });

  it('resolves directional shield block reducing damage by 75% when facing attacker', () => {
    const poise: PoiseData = {
      current: 100,
      max: 100,
      isStaggered: false,
      staggerTimer: 0,
      staggerDuration: 1.5,
    };

    const attack: AttackSpec = {
      attackerId: 'player',
      damage: 40,
      poiseDamage: 30,
      origin: new Vector2D(0, 0),
    };

    // Defender at (50, 0) facing (-1, 0) directly towards attack origin (0, 0)
    const defense: DefenseSpec = {
      defenderId: 'enemy',
      position: new Vector2D(50, 0),
      facing: new Vector2D(-1, 0),
      isGuarding: true,
      parryWindowTimer: 0,
      poise,
    };

    const res = combat.resolveAttack(attack, defense);
    expect(res.wasBlocked).toBe(true);
    expect(res.damageDealt).toBe(10); // 40 * 0.25
    expect(res.poiseDamageDealt).toBe(15); // 30 * 0.50
    expect(poise.current).toBe(85);
  });

  it('bypasses shield block and deals 2x poise damage when attack has isShieldBreak', () => {
    const poise: PoiseData = {
      current: 100,
      max: 100,
      isStaggered: false,
      staggerTimer: 0,
      staggerDuration: 1.5,
    };

    const attack: AttackSpec = {
      attackerId: 'player',
      damage: 50,
      poiseDamage: 35,
      isShieldBreak: true,
      origin: new Vector2D(0, 0),
    };

    const defense: DefenseSpec = {
      defenderId: 'enemy',
      position: new Vector2D(50, 0),
      facing: new Vector2D(-1, 0),
      isGuarding: true,
      parryWindowTimer: 0,
      poise,
    };

    const res = combat.resolveAttack(attack, defense);
    expect(res.wasBlocked).toBe(false);
    expect(res.damageDealt).toBe(50);
    expect(res.poiseDamageDealt).toBe(70); // 35 * 2.0
    expect(poise.current).toBe(30);
  });

  it('triggers stagger when poise reaches 0 and applies critical punish multiplier (+35%)', () => {
    const poise: PoiseData = {
      current: 20,
      max: 100,
      isStaggered: false,
      staggerTimer: 0,
      staggerDuration: 1.5,
    };

    const attack: AttackSpec = {
      attackerId: 'player',
      damage: 40,
      poiseDamage: 30,
      origin: new Vector2D(0, 0),
    };

    const defense: DefenseSpec = {
      defenderId: 'enemy',
      position: new Vector2D(50, 0),
      facing: new Vector2D(-1, 0),
      isGuarding: false,
      parryWindowTimer: 0,
      poise,
    };

    const res1 = combat.resolveAttack(attack, defense);
    expect(res1.triggeredStagger).toBe(true);
    expect(poise.isStaggered).toBe(true);
    expect(poise.staggerTimer).toBe(1.5);

    // Follow-up hit while staggered receives critical multiplier (+35%)
    const res2 = combat.resolveAttack(attack, defense);
    expect(res2.isCritical).toBe(true);
    expect(res2.damageDealt).toBe(Math.floor(40 * 1.35)); // 54
  });

  it('negates 100% damage and poise damage during perfect parry window (120ms)', () => {
    const poise: PoiseData = {
      current: 100,
      max: 100,
      isStaggered: false,
      staggerTimer: 0,
      staggerDuration: 1.5,
    };

    const attack: AttackSpec = {
      attackerId: 'boss',
      damage: 75,
      poiseDamage: 50,
      origin: new Vector2D(0, 0),
    };

    const defense: DefenseSpec = {
      defenderId: 'player',
      position: new Vector2D(50, 0),
      facing: new Vector2D(-1, 0),
      isGuarding: true,
      parryWindowTimer: 0.10, // within 120ms window
      poise,
    };

    const res = combat.resolveAttack(attack, defense);
    expect(res.wasParried).toBe(true);
    expect(res.damageDealt).toBe(0);
    expect(res.poiseDamageDealt).toBe(0);
    expect(poise.current).toBe(100);
  });

  it('recovers poise over time and resets stagger after duration', () => {
    const poise: PoiseData = {
      current: 0,
      max: 100,
      isStaggered: true,
      staggerTimer: 1.0,
      staggerDuration: 1.0,
    };

    // Staggered: counts down staggerTimer
    combat.updatePoise(poise, 0.4);
    expect(poise.staggerTimer).toBeCloseTo(0.6, 2);
    expect(poise.isStaggered).toBe(true);

    // Stagger expires: poise resets to max
    combat.updatePoise(poise, 0.7);
    expect(poise.isStaggered).toBe(false);
    expect(poise.current).toBe(100);

    // Normal poise regen when depleted
    poise.current = 60;
    combat.updatePoise(poise, 1.0, 25);
    expect(poise.current).toBe(85);
  });
});

describe('Stage 4: Checkpoint Manager', () => {
  let cm: CheckpointManager;
  let player: Player;

  beforeEach(() => {
    cm = new CheckpointManager();
    player = new Player('p', 500, 500);
  });

  it('registers checkpoints and activates first by default', () => {
    const cp1 = cm.register('gate', 'Sanctum Gate', 100, 200);
    expect(cp1.isActivated).toBe(true);
    expect(cm.getActiveCheckpoint()?.id).toBe('gate');

    const cp2 = cm.register('inner', 'Inner Sanctum', 300, 400);
    expect(cp2.isActivated).toBe(false);

    cm.activate('inner');
    expect(cm.getActiveCheckpoint()?.id).toBe('inner');
    expect(cp1.isActivated).toBe(false);
  });

  it('restores player state and position to active checkpoint upon defeat', () => {
    cm.register('sanctum', 'Sanctum', 50, 75);
    player.health = 0;
    player.energy = 5;
    player.position.set(999, 999);
    player.isDashing = true;

    const restored = cm.restorePlayer(player);
    expect(restored).toBe(true);
    expect(player.position.x).toBe(50);
    expect(player.position.y).toBe(75);
    expect(player.health).toBe(player.maxHealth);
    expect(player.energy).toBe(player.maxEnergy);
    expect(player.isDashing).toBe(false);
  });

  it('retrieves all checkpoints and handles clear()', () => {
    cm.register('cp1', 'CP 1', 0, 0);
    cm.register('cp2', 'CP 2', 10, 10);
    expect(cm.getAllCheckpoints().length).toBe(2);

    cm.clear();
    expect(cm.getAllCheckpoints().length).toBe(0);
    expect(cm.getActiveCheckpoint()).toBeNull();
  });
});

describe('Stage 4: Combat Camera and Equipment Setters', () => {
  it('triggers camera shake on parry, stagger, and high damage', () => {
    let shakeCount = 0;
    const mockCamera = {
      triggerShake: () => {
        shakeCount++;
      },
    } as any;

    const combat = new CombatSystem();
    combat.setCamera(mockCamera);

    const poise: PoiseData = {
      current: 10,
      max: 100,
      isStaggered: false,
      staggerTimer: 0,
      staggerDuration: 1.0,
    };

    // Parry triggers shake
    combat.resolveAttack(
      { attackerId: 'a', damage: 40, poiseDamage: 10, origin: new Vector2D(0, 0) },
      { defenderId: 'd', position: new Vector2D(0, 0), facing: new Vector2D(1, 0), isGuarding: true, parryWindowTimer: 0.1, poise }
    );
    expect(shakeCount).toBeGreaterThan(0);

    // Stagger & high damage triggers shake
    combat.resolveAttack(
      { attackerId: 'a', damage: 60, poiseDamage: 50, origin: new Vector2D(0, 0) },
      { defenderId: 'd', position: new Vector2D(0, 0), facing: new Vector2D(1, 0), isGuarding: false, parryWindowTimer: 0, poise }
    );
    expect(shakeCount).toBeGreaterThan(1);
  });

  it('allows explicit weapon setting in EquipmentManager', () => {
    const equip = new EquipmentManager();
    equip.setWeapon('PRANA_GLAIVE');
    expect(equip.getActiveWeapon()).toBe('PRANA_GLAIVE');
  });
});
