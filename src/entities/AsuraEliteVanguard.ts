import { Entity } from './Entity';
import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';
import { PoiseData } from '../gameplay/CombatSystem';
import {
  ActionNode,
  BehaviorNode,
  Blackboard,
  ConditionNode,
  NodeStatus,
  SelectorNode,
  SequenceNode,
} from '../gameplay/BehaviorTree';

export type SquadFlankRole = 'Alpha_Left' | 'Beta_Right' | 'Solo';

export class AsuraEliteVanguard extends Entity {
  public health = 180;
  public maxHealth = 180;

  public poise: PoiseData = {
    current: 60,
    max: 60,
    isStaggered: false,
    staggerTimer: 0,
    staggerDuration: 1.8,
  };

  public speed = 145;
  public facing: Vector2D = new Vector2D(-1, 0);
  public isGuarding = true;
  public role: SquadFlankRole = 'Solo';

  // Combat Timers
  public attackCooldown = 1.4;
  public attackCooldownTimer = 0;
  public isAttacking = false;
  public attackWindupTimer = 0;

  // Leap Attack
  public leapCooldown = 4.0;
  public leapCooldownTimer = 1.0;
  public isLeaping = false;
  public leapTimer = 0;
  public leapTarget: Vector2D = new Vector2D(0, 0);

  // Behavior Tree
  private behaviorTree!: BehaviorNode;
  public blackboard: Blackboard = new Blackboard();

  constructor(id: string, x: number, y: number, role: SquadFlankRole = 'Solo') {
    super(id, x, y, 44, 48, 'enemy_elite_vanguard');
    this.role = role;
    this.initBehaviorTree();
  }

  private initBehaviorTree(): void {
    const root = new SelectorNode('root_selector');

    // 1. Staggered Branch
    const staggerSeq = new SequenceNode('stagger_sequence');
    staggerSeq.addChild(new ConditionNode('is_staggered', (bb) => bb.get<boolean>('isStaggered', false)));
    staggerSeq.addChild(new ActionNode('stagger_wait', () => NodeStatus.RUNNING));
    root.addChild(staggerSeq);

    // 2. Melee Attack Branch (distance < 75)
    const attackSeq = new SequenceNode('attack_sequence');
    attackSeq.addChild(new ConditionNode('in_melee_range', (bb) => {
      const dist = bb.get<number>('distanceToPlayer', Infinity);
      return dist <= 75 && this.attackCooldownTimer <= 0;
    }));
    attackSeq.addChild(new ActionNode('execute_cleave', () => {
      this.isAttacking = true;
      this.attackWindupTimer = 0.35;
      this.attackCooldownTimer = this.attackCooldown;
      return NodeStatus.SUCCESS;
    }));
    root.addChild(attackSeq);

    // 3. Leap Attack Branch (distance between 160 and 320)
    const leapSeq = new SequenceNode('leap_sequence');
    leapSeq.addChild(new ConditionNode('can_leap', (bb) => {
      const dist = bb.get<number>('distanceToPlayer', Infinity);
      return dist >= 160 && dist <= 320 && this.leapCooldownTimer <= 0 && !this.isLeaping;
    }));
    leapSeq.addChild(new ActionNode('start_leap', (bb) => {
      const targetPos = bb.get<Vector2D>('playerPos', this.position);
      this.isLeaping = true;
      this.leapTimer = 0.55;
      this.leapTarget = targetPos.clone();
      this.leapCooldownTimer = this.leapCooldown;
      return NodeStatus.SUCCESS;
    }));
    root.addChild(leapSeq);

    // 4. Tactical Flank & Approach Branch
    const flankAction = new ActionNode('flank_approach', (bb, dt) => {
      const playerPos = bb.get<Vector2D>('playerPos', this.position);
      const toPlayer = Vector2D.sub(playerPos, this.position);
      const dist = toPlayer.magnitude();

      if (dist < 0.001) return NodeStatus.SUCCESS;

      // Adjust approach angle based on cooperative squad role
      let flankAngle = 0;
      if (this.role === 'Alpha_Left') {
        flankAngle = -Math.PI * 0.28; // -50 degrees
      } else if (this.role === 'Beta_Right') {
        flankAngle = Math.PI * 0.28;  // +50 degrees
      }

      const baseAngle = Math.atan2(toPlayer.y, toPlayer.x);
      const targetAngle = baseAngle + flankAngle;
      const targetOffset = new Vector2D(Math.cos(targetAngle), Math.sin(targetAngle)).scale(70);
      const desiredPos = Vector2D.add(playerPos, targetOffset);

      const moveDir = Vector2D.sub(desiredPos, this.position);
      if (moveDir.magnitude() > 10) {
        moveDir.normalize();
        this.position.x += moveDir.x * this.speed * dt;
        this.position.y += moveDir.y * this.speed * dt;
        this.syncBounds();
      }

      // Keep facing toward player for shield guarding
      this.facing = toPlayer.normalize();
      this.isGuarding = true;
      return NodeStatus.RUNNING;
    });
    root.addChild(flankAction);

    this.behaviorTree = root;
  }

  public updateAI(playerPos: Vector2D, dt: number): void {
    const distToPlayer = Vector2D.distance(this.position, playerPos);

    // Update Blackboard
    this.blackboard.set('playerPos', playerPos);
    this.blackboard.set('distanceToPlayer', distToPlayer);
    this.blackboard.set('isStaggered', this.poise.isStaggered);

    // Cooldown updates
    if (this.attackCooldownTimer > 0) this.attackCooldownTimer -= dt;
    if (this.leapCooldownTimer > 0) this.leapCooldownTimer -= dt;

    // Handle Leap Slam physics
    if (this.isLeaping) {
      this.leapTimer -= dt;
      const t = Math.max(0, this.leapTimer / 0.55);
      const factor = 1 - t;
      this.position.x += (this.leapTarget.x - this.position.x) * factor * 0.15;
      this.position.y += (this.leapTarget.y - this.position.y) * factor * 0.15;
      this.syncBounds();

      if (this.leapTimer <= 0) {
        this.isLeaping = false;
        this.position.set(this.leapTarget.x, this.leapTarget.y);
        this.syncBounds();
      }
      return;
    }

    // Handle Attack Windup
    if (this.isAttacking) {
      this.attackWindupTimer -= dt;
      if (this.attackWindupTimer <= 0) {
        this.isAttacking = false;
      }
      return;
    }

    // Tick Behavior Tree
    this.behaviorTree.tick(this.blackboard, dt);
  }

  public update(dt: number): void {
    // Normal entity physics update
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.syncBounds();
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();

    // Leap Landing Target Indicator (World-space)
    if (this.isLeaping) {
      ctx.save();
      ctx.translate(this.leapTarget.x, this.leapTarget.y);
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, 44, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(217, 119, 6, 0.2)';
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    const isLeft = this.facing.x < 0;
    if (isLeft) ctx.scale(-1, 1);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 20, 22, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cleave Attack Telegraph Arc
    if (this.isAttacking && this.attackWindupTimer > 0) {
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 65, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.stroke();
    }

    // Staggered aura
    if (this.poise.isStaggered) {
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Heavy Body Armor (Dark Bronze & Obsidian)
    ctx.fillStyle = '#2A2D34';
    ctx.fillRect(-16, -18, 32, 36);

    // Spiked Bronze Pauldrons
    ctx.fillStyle = '#B45309';
    ctx.fillRect(-22, -22, 12, 14);
    ctx.fillRect(10, -22, 12, 14);

    // Horned Helmet
    ctx.fillStyle = '#1E1E24';
    ctx.beginPath();
    ctx.arc(0, -24, 14, 0, Math.PI * 2);
    ctx.fill();

    // Horns
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.moveTo(-10, -32);
    ctx.lineTo(-18, -44);
    ctx.lineTo(-6, -34);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(10, -32);
    ctx.lineTo(18, -44);
    ctx.lineTo(6, -34);
    ctx.closePath();
    ctx.fill();

    // Glowing Red Asura Eyes
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(4, -25, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Tower Shield (Held in Front)
    if (this.isGuarding) {
      ctx.fillStyle = '#D97706';
      ctx.fillRect(14, -24, 12, 44);
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 2;
      ctx.strokeRect(14, -24, 12, 44);

      // Boss shield crest
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(20, -2, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Heavy Curved Scimitar
    ctx.fillStyle = '#E5E7EB';
    ctx.beginPath();
    ctx.moveTo(-8, 6);
    ctx.quadraticCurveTo(18, 12, 28, -6);
    ctx.lineTo(24, -10);
    ctx.quadraticCurveTo(14, 6, -8, 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Health & Poise Bar above head
    this.renderVitals(ctx);
  }

  private renderVitals(ctx: CanvasRenderingContext2D): void {
    const barW = 44;
    const barH = 5;
    const bx = this.position.x - barW / 2;
    const by = this.position.y - 42;

    // Health Bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(bx, by, barW, barH);
    const hpRatio = Math.max(0, this.health / this.maxHealth);
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(bx, by, barW * hpRatio, barH);

    // Poise Bar
    const py = by + barH + 1;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(bx, py, barW, 3);
    const poiseRatio = Math.max(0, this.poise.current / this.poise.max);
    ctx.fillStyle = this.poise.isStaggered ? '#EF4444' : '#F59E0B';
    ctx.fillRect(bx, py, barW * poiseRatio, 3);
  }
}
