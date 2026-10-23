import { Entity } from './Entity';
import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';
import { PoiseData } from '../gameplay/CombatSystem';
import { Projectile } from './Projectile';
import { Shockwave } from './Shockwave';
import { AsuraEliteVanguard } from './AsuraEliteVanguard';
import {
  ActionNode,
  BehaviorNode,
  Blackboard,
  ConditionNode,
  NodeStatus,
  SelectorNode,
  SequenceNode,
} from '../gameplay/BehaviorTree';

export type BossPhase = 1 | 2 | 3;

export interface BossAttackEvent {
  type: 'SHOCKWAVE' | 'PROJECTILE_BURST' | 'SUMMON_MINIONS' | 'MELEE_SLAM' | 'CHARGE_HIT';
  origin: Vector2D;
  damage: number;
  poiseDamage: number;
  radius?: number;
  projectiles?: Projectile[];
  shockwaves?: Shockwave[];
  minions?: AsuraEliteVanguard[];
}

export class MahishasuraBoss extends Entity {
  public health = 1000;
  public maxHealth = 1000;

  public poise: PoiseData = {
    current: 250,
    max: 250,
    isStaggered: false,
    staggerTimer: 0,
    staggerDuration: 2.2,
  };

  public phase: BossPhase = 1;
  public hasSummonedPhase2Squad = false;

  public speed = 120;
  public facing: Vector2D = new Vector2D(-1, 0);

  // Buffalo Charge State
  public isCharging = false;
  public chargeWindupTimer = 0;
  public chargeDurationTimer = 0;
  public chargeCooldown = 6.0;
  public chargeCooldownTimer = 2.0;
  public chargeDir: Vector2D = new Vector2D(-1, 0);
  public chargeSpeed = 400;

  // Melee Slam State
  public isHammerSlamming = false;
  public slamWindupTimer = 0;
  public slamCooldown = 2.6;
  public slamCooldownTimer = 1.0;

  // Phase 2: Shadow Blink & Homing Orbs
  public isTeleporting = false;
  public teleportTimer = 0;
  public orbCooldown = 7.0;
  public orbCooldownTimer = 3.0;

  // Phase 3: Eclipse Berserk Leap
  public isLeaping = false;
  public leapTimer = 0;
  public leapCooldown = 8.0;
  public leapCooldownTimer = 4.0;
  public leapTarget: Vector2D = new Vector2D(0, 0);

  // Pending attacks to be harvested by the Scene
  public pendingEvents: BossAttackEvent[] = [];

  // Behavior Tree
  private behaviorTree!: BehaviorNode;
  public blackboard: Blackboard = new Blackboard();

  private animTimer = 0;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 76, 84, 'boss_mahishasura');
    this.initBehaviorTree();
  }

  public getPhase(): BossPhase {
    return this.phase;
  }

  private updatePhase(): void {
    const hpRatio = this.health / this.maxHealth;
    if (hpRatio <= 0.30) {
      if (this.phase !== 3) {
        this.phase = 3;
        this.speed = 180; // Berserk speed
        this.poise.max = 300;
        this.poise.current = 300;
      }
    } else if (hpRatio <= 0.70) {
      if (this.phase !== 2) {
        this.phase = 2;
        this.speed = 145;
        if (!this.hasSummonedPhase2Squad) {
          this.summonReinforcements();
          this.hasSummonedPhase2Squad = true;
        }
      }
    } else {
      this.phase = 1;
    }
  }

  private summonReinforcements(): void {
    const leftVanguard = new AsuraEliteVanguard(
      `vanguard_summon_left_${Date.now()}`,
      this.position.x - 140,
      this.position.y + 60,
      'Alpha_Left'
    );
    const rightVanguard = new AsuraEliteVanguard(
      `vanguard_summon_right_${Date.now()}`,
      this.position.x + 140,
      this.position.y + 60,
      'Beta_Right'
    );

    this.pendingEvents.push({
      type: 'SUMMON_MINIONS',
      origin: this.position.clone(),
      damage: 0,
      poiseDamage: 0,
      minions: [leftVanguard, rightVanguard],
    });
  }

  private initBehaviorTree(): void {
    const root = new SelectorNode('mahishasura_root');

    // 1. Staggered State
    const staggerSeq = new SequenceNode('boss_stagger');
    staggerSeq.addChild(new ConditionNode('is_staggered', (bb) => bb.get<boolean>('isStaggered', false)));
    staggerSeq.addChild(new ActionNode('stagger_stall', () => NodeStatus.RUNNING));
    root.addChild(staggerSeq);

    // 2. Active Action Locks (Charge / Slam / Leap / Teleport in progress)
    const lockAction = new ActionNode('action_locks', () => {
      if (this.isCharging || this.isHammerSlamming || this.isLeaping || this.isTeleporting) {
        return NodeStatus.RUNNING;
      }
      return NodeStatus.FAILURE;
    });
    root.addChild(lockAction);

    // 3. Phase 3: Eclipse Cataclysm Leap
    const leapSeq = new SequenceNode('phase3_leap');
    leapSeq.addChild(new ConditionNode('is_phase_3', () => this.phase === 3));
    leapSeq.addChild(new ConditionNode('can_leap', () => this.leapCooldownTimer <= 0));
    leapSeq.addChild(new ActionNode('execute_eclipse_leap', (bb) => {
      const playerPos = bb.get<Vector2D>('playerPos', this.position);
      this.isLeaping = true;
      this.leapTimer = 1.1; // 1.1s total airtime
      this.leapTarget = playerPos.clone();
      this.leapCooldownTimer = this.leapCooldown;
      return NodeStatus.SUCCESS;
    }));
    root.addChild(leapSeq);

    // 4. Phase 2: Shadow Blink & Tamas Orbs
    const sorcerySeq = new SequenceNode('phase2_sorcery');
    sorcerySeq.addChild(new ConditionNode('is_phase_2_or_3', () => this.phase >= 2));
    sorcerySeq.addChild(new ConditionNode('can_cast_orbs', () => this.orbCooldownTimer <= 0));
    sorcerySeq.addChild(new ActionNode('cast_tamas_orbs', (bb) => {
      const playerPos = bb.get<Vector2D>('playerPos', this.position);
      this.orbCooldownTimer = this.orbCooldown;

      // Teleport slightly behind player
      this.isTeleporting = true;
      this.teleportTimer = 0.4;
      const behindOffset = Vector2D.sub(playerPos, this.position).normalize().scale(-120);
      const targetTeleport = Vector2D.add(playerPos, behindOffset);

      // Clamp target teleport to arena bounds
      targetTeleport.x = Math.max(100, Math.min(1180, targetTeleport.x));
      targetTeleport.y = Math.max(120, Math.min(760, targetTeleport.y));

      setTimeout(() => {
        this.position.set(targetTeleport.x, targetTeleport.y);
        this.syncBounds();
        this.isTeleporting = false;
        this.spawnTamasOrbs(playerPos);
      }, 350);

      return NodeStatus.SUCCESS;
    }));
    root.addChild(sorcerySeq);

    // 5. Buffalo Horn Charge (Range: 180 to 460)
    const chargeSeq = new SequenceNode('buffalo_charge');
    chargeSeq.addChild(new ConditionNode('can_charge', (bb) => {
      const dist = bb.get<number>('distToPlayer', 0);
      return dist >= 160 && dist <= 480 && this.chargeCooldownTimer <= 0;
    }));
    chargeSeq.addChild(new ActionNode('start_buffalo_charge', (bb) => {
      const playerPos = bb.get<Vector2D>('playerPos', this.position);
      this.chargeDir = Vector2D.sub(playerPos, this.position).normalize();
      this.facing = this.chargeDir.clone();
      this.isCharging = true;
      this.chargeWindupTimer = 0.55; // 550ms telegraph
      this.chargeDurationTimer = 0.85; // 850ms charge sprint
      this.chargeCooldownTimer = this.chargeCooldown;
      return NodeStatus.SUCCESS;
    }));
    root.addChild(chargeSeq);

    // 6. Seismic Hammer Slam (Range: <= 110)
    const slamSeq = new SequenceNode('hammer_slam');
    slamSeq.addChild(new ConditionNode('can_slam', (bb) => {
      const dist = bb.get<number>('distToPlayer', 999);
      return dist <= 110 && this.slamCooldownTimer <= 0;
    }));
    slamSeq.addChild(new ActionNode('execute_slam', () => {
      this.isHammerSlamming = true;
      this.slamWindupTimer = 0.45; // 450ms telegraph
      this.slamCooldownTimer = this.slamCooldown;
      return NodeStatus.SUCCESS;
    }));
    root.addChild(slamSeq);

    // 7. General Approach & Stalking
    const approachAction = new ActionNode('stalk_player', (bb, dt) => {
      const playerPos = bb.get<Vector2D>('playerPos', this.position);
      const toPlayer = Vector2D.sub(playerPos, this.position);
      const dist = toPlayer.magnitude();

      if (dist > 75) {
        const moveDir = toPlayer.normalize();
        this.facing = moveDir.clone();
        this.position.x += moveDir.x * this.speed * dt;
        this.position.y += moveDir.y * this.speed * dt;
        this.syncBounds();
      }
      return NodeStatus.RUNNING;
    });
    root.addChild(approachAction);

    this.behaviorTree = root;
  }

  private spawnTamasOrbs(targetPos: Vector2D): void {
    const orbs: Projectile[] = [];
    const baseDir = Vector2D.sub(targetPos, this.position).normalize();
    const baseAngle = Math.atan2(baseDir.y, baseDir.x);

    [-0.32, 0, 0.32].forEach((offsetAngle, idx) => {
      const dir = new Vector2D(Math.cos(baseAngle + offsetAngle), Math.sin(baseAngle + offsetAngle));
      const orb = new Projectile(
        `boss_orb_${Date.now()}_${idx}`,
        this.position.x + dir.x * 35,
        this.position.y + dir.y * 35,
        dir,
        280,
        'boss_projectile'
      );
      orb.damage = 28;
      orbs.push(orb);
    });

    this.pendingEvents.push({
      type: 'PROJECTILE_BURST',
      origin: this.position.clone(),
      damage: 28,
      poiseDamage: 25,
      projectiles: orbs,
    });
  }

  public updateAI(playerPos: Vector2D, dt: number): void {
    this.animTimer += dt;
    this.updatePhase();

    // Cooldown ticks
    if (this.chargeCooldownTimer > 0) this.chargeCooldownTimer -= dt;
    if (this.slamCooldownTimer > 0) this.slamCooldownTimer -= dt;
    if (this.orbCooldownTimer > 0) this.orbCooldownTimer -= dt;
    if (this.leapCooldownTimer > 0) this.leapCooldownTimer -= dt;

    // Handle Buffalo Horn Charge
    if (this.isCharging) {
      if (this.chargeWindupTimer > 0) {
        this.chargeWindupTimer -= dt;
        if (this.chargeWindupTimer > 0) {
          return;
        }
      }
      this.chargeDurationTimer -= dt;
      this.position.x += this.chargeDir.x * this.chargeSpeed * dt;
      this.position.y += this.chargeDir.y * this.chargeSpeed * dt;
      this.syncBounds();

      if (this.chargeDurationTimer <= 0) {
        this.isCharging = false;
      }
      return;
    }

    // Handle Seismic Hammer Slam
    if (this.isHammerSlamming) {
      this.slamWindupTimer -= dt;
      if (this.slamWindupTimer <= 0) {
        this.isHammerSlamming = false;
        const wave = new Shockwave(
          `boss_slam_wave_${Date.now()}`,
          this.position.x,
          this.position.y,
          190,
          45
        );
        this.pendingEvents.push({
          type: 'SHOCKWAVE',
          origin: this.position.clone(),
          damage: 45,
          poiseDamage: 60,
          shockwaves: [wave],
        });
      }
      return;
    }

    // Handle Eclipse Leap
    if (this.isLeaping) {
      this.leapTimer -= dt;

      // Arc interpolation towards leap target
      this.position.x += (this.leapTarget.x - this.position.x) * dt * 3.5;
      this.position.y += (this.leapTarget.y - this.position.y) * dt * 3.5;
      this.syncBounds();

      if (this.leapTimer <= 0) {
        this.isLeaping = false;
        this.position.set(this.leapTarget.x, this.leapTarget.y);
        this.syncBounds();

        // 8-directional radial magma burst on landing
        const magmaBursts: Projectile[] = [];
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI * 2) / 8;
          const dir = new Vector2D(Math.cos(angle), Math.sin(angle));
          const p = new Projectile(
            `magma_burst_${Date.now()}_${i}`,
            this.position.x,
            this.position.y,
            dir,
            340,
            'boss_projectile'
          );
          p.damage = 32;
          magmaBursts.push(p);
        }

        const shock = new Shockwave(
          `magma_shock_${Date.now()}`,
          this.position.x,
          this.position.y,
          230,
          55
        );

        this.pendingEvents.push({
          type: 'PROJECTILE_BURST',
          origin: this.position.clone(),
          damage: 32,
          poiseDamage: 40,
          projectiles: magmaBursts,
          shockwaves: [shock],
        });
      }
      return;
    }

    const distToPlayer = Vector2D.distance(this.position, playerPos);
    this.blackboard.set('playerPos', playerPos);
    this.blackboard.set('distToPlayer', distToPlayer);
    this.blackboard.set('isStaggered', this.poise.isStaggered);

    this.behaviorTree.tick(this.blackboard, dt);
  }

  public update(dt: number): void {
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.syncBounds();
  }

  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    this.updatePhase();
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    const isLeft = this.facing.x < 0;
    if (isLeft) ctx.scale(-1, 1);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 36, 38, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Telegraph: Charge Red Vector Line
    if (this.isCharging && this.chargeWindupTimer > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = 14;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(260, 0);
      ctx.stroke();
      ctx.restore();
    }

    // Telegraph: Slam Expanding Warning Ring
    if (this.isHammerSlamming) {
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 20, 100 * (1 - this.slamWindupTimer / 0.45), 0, Math.PI * 2);
      ctx.stroke();
    }

    // Phase 3 Eclipse Berserk Aura
    if (this.phase === 3) {
      ctx.strokeStyle = '#9333EA';
      ctx.shadowColor = '#C026D3';
      ctx.shadowBlur = 24;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 52 + Math.sin(this.animTimer * 6) * 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Staggered Indicator
    if (this.poise.isStaggered) {
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, 56, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Titan Torso (Obsidian Carapace)
    ctx.fillStyle = this.phase === 3 ? '#450A0A' : '#1C1917';
    ctx.fillRect(-28, -32, 56, 64);

    // Glowing Magma Fissures on Chest
    ctx.strokeStyle = this.phase === 3 ? '#F97316' : '#EF4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-16, -20);
    ctx.lineTo(0, -6);
    ctx.lineTo(16, -20);
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 18);
    ctx.stroke();

    // Spiked Bronze Shoulders
    ctx.fillStyle = '#78350F';
    ctx.fillRect(-40, -42, 22, 26);
    ctx.fillRect(18, -42, 22, 26);

    // Massive Buffalo Head
    ctx.fillStyle = '#0C0A09';
    ctx.beginPath();
    ctx.arc(0, -42, 24, 0, Math.PI * 2);
    ctx.fill();

    // Colossal Swept Buffalo Horns
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.moveTo(-18, -48);
    ctx.quadraticCurveTo(-44, -78, -34, -92);
    ctx.quadraticCurveTo(-26, -72, -12, -54);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(18, -48);
    ctx.quadraticCurveTo(44, -78, 34, -92);
    ctx.quadraticCurveTo(26, -72, 12, -54);
    ctx.closePath();
    ctx.fill();

    // Demonic Glowing Crimson Eyes
    ctx.fillStyle = this.phase === 3 ? '#A855F7' : '#EF4444';
    ctx.beginPath();
    ctx.arc(8, -44, 4, 0, Math.PI * 2);
    ctx.fill();

    // Great Obsidian War Club
    ctx.fillStyle = '#292524';
    ctx.fillRect(26, -20, 16, 52);
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(24, -30, 20, 14);

    ctx.restore();
  }
}
