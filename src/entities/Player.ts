import { Entity } from './Entity';
import { Vector2D } from '../physics/Vector2D';
import { Projectile } from './Projectile';
import { IRenderer } from '../render/CanvasRenderer';
import { CharacterDefinitions } from '../animation/CharacterDefinitions';
import { CharacterRig } from '../animation/CharacterRig';
import { EquipmentManager, WeaponType, WeaponStats } from '../gameplay/EquipmentManager';
import { PoiseData } from '../gameplay/CombatSystem';

export type CombatStance = 'Standard' | 'SolarResonantFlare';
export type AttackState = 'IDLE' | 'STARTUP' | 'ACTIVE' | 'RECOVERY';

export interface MeleeAttackArc {
  origin: Vector2D;
  direction: Vector2D;
  radius: number;
  arcAngle: number;
  damage: number;
  poiseDamage?: number;
  isShieldBreak?: boolean;
}

export interface InputBufferItem {
  action: 'ATTACK' | 'DASH' | 'SWAP' | 'SPECIAL';
  timer: number;
}

export class Player extends Entity {
  public health = 100;
  public maxHealth = 100;
  public energy = 100;
  public maxEnergy = 100;
  public energyRegenRate = 18; // per second

  // Poise System
  public poise: PoiseData = {
    current: 100,
    max: 100,
    isStaggered: false,
    staggerTimer: 0,
    staggerDuration: 1.2,
  };

  // Movement & Dash
  public speed = 220;
  public dashSpeed = 520;
  public isDashing = false;
  public dashTimer = 0;
  public dashDuration = 0.18;
  public dashCooldown = 0.55;
  public dashCooldownTimer = 0;

  // Attack Phase State Machine & Input Buffering
  public attackState: AttackState = 'IDLE';
  public attackPhaseTimer = 0;
  public canCancelWithDodge = false;
  public inputBuffer: InputBufferItem | null = null;
  public activeMeleeArc: MeleeAttackArc | null = null;
  public isSpecialAttacking = false;

  // Ranged Shoot
  public shootCooldown = 0.22;
  public shootCooldownTimer = 0;

  // Melee & Combo System
  public equipmentManager: EquipmentManager = new EquipmentManager();
  public comboIndex = 0;
  public comboResetTimer = 0;
  public readonly comboChainWindow = 1.0; // 1s to chain next hit
  public meleeCooldownTimer = 0;
  public isMeleeSlashing = false;
  public meleeSlashTimer = 0;
  public meleeDamage = 40;
  public meleeRadius = 80;

  // Defensive Guard & Parry
  public isGuarding = false;
  public parryWindowTimer = 0;
  public readonly PARRY_WINDOW = 0.12; // 120ms frame-accurate window

  public get isParrying(): boolean {
    return this.parryWindowTimer > 0;
  }
  public set isParrying(val: boolean) {
    this.parryWindowTimer = val ? this.PARRY_WINDOW : 0;
  }

  // Stance & Buffs
  public stance: CombatStance = 'Standard';
  public iFrameTimer = 0;

  public facing: Vector2D = new Vector2D(0, 1);
  public shardsCollected = 0;
  public score = 0;

  public rig: CharacterRig = CharacterDefinitions.createVeerRig();
  private idleBreath = 0;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 32, 40, 'player');
  }

  public bufferInput(action: 'ATTACK' | 'DASH' | 'SWAP' | 'SPECIAL'): void {
    this.inputBuffer = { action, timer: 0.22 };
  }

  public move(dir: Vector2D, dt: number): void {
    if (this.isDashing || this.poise.isStaggered) {
      if (this.poise.isStaggered) {
        this.velocity.set(0, 0);
      }
      return;
    }

    if (dir.magnitudeSquared() > 0.001) {
      this.facing = dir.clone().normalize();
      // If mid-swing (startup/active), dampen movement to committed combat footwork
      const moveSpeed = (this.attackState === 'STARTUP' || this.attackState === 'ACTIVE') ? this.speed * 0.35 : this.speed;
      this.velocity.x = dir.x * moveSpeed;
      this.velocity.y = dir.y * moveSpeed;
    } else {
      this.velocity.scale(0.85); // Gentle friction
      if (this.velocity.magnitudeSquared() < 1) {
        this.velocity.set(0, 0);
      }
    }

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.syncBounds();
  }

  public setMovement(x: number, y: number): void {
    if (this.isDashing || this.poise.isStaggered) return;
    const moveSpeed = (this.attackState === 'STARTUP' || this.attackState === 'ACTIVE') ? this.speed * 0.35 : this.speed;
    this.velocity.x = x * moveSpeed;
    this.velocity.y = y * moveSpeed;
    if (x !== 0 || y !== 0) {
      this.facing.set(x, y).normalize();
    }
  }

  public setFacingTowards(worldPos: Vector2D): void {
    const dir = Vector2D.sub(worldPos, this.position);
    if (dir.magnitudeSquared() > 0.001) {
      this.facing = dir.normalize();
    }
  }

  public dash(): boolean {
    return this.triggerDash();
  }

  public meleeAttack(): MeleeAttackArc | null {
    return this.performMeleeSlash();
  }

  public triggerDash(): boolean {
    if (this.poise.isStaggered) return false;

    if (this.dashCooldownTimer > 0 || this.energy < 25) {
      if (this.dashCooldownTimer > 0 && this.dashCooldownTimer < 0.15) {
        this.bufferInput('DASH');
      }
      return false;
    }

    // Cancel recovery window if dodging
    if (this.canCancelWithDodge || this.attackState === 'RECOVERY') {
      this.attackState = 'IDLE';
      this.isMeleeSlashing = false;
      this.canCancelWithDodge = false;
      this.isSpecialAttacking = false;
    }

    this.isDashing = true;
    this.dashTimer = this.dashDuration;
    this.dashCooldownTimer = this.stance === 'SolarResonantFlare' ? 0.42 : this.dashCooldown;
    this.energy -= 25;

    this.velocity = this.facing.clone().normalize().scale(this.dashSpeed);
    return true;
  }

  public startGuard(): void {
    if (!this.isGuarding && !this.poise.isStaggered) {
      this.isGuarding = true;
      this.parryWindowTimer = this.PARRY_WINDOW;
    }
  }

  public stopGuard(): void {
    this.isGuarding = false;
    this.parryWindowTimer = 0;
  }

  public swapWeapon(): boolean {
    if (this.poise.isStaggered) return false;
    const swapped = this.equipmentManager.swapWeapon();
    if (swapped) {
      this.comboIndex = 0;
      this.attackState = 'IDLE';
      this.isMeleeSlashing = false;
      this.isSpecialAttacking = false;
    }
    return swapped;
  }

  public getActiveWeaponStats(): WeaponStats {
    return this.equipmentManager.getActiveWeaponStats();
  }

  public shoot(targetPos?: Vector2D): Projectile | null {
    const burst = this.shootBurst(targetPos);
    return burst.length > 0 ? burst[0] : null;
  }

  public shootBurst(targetPos?: Vector2D): Projectile[] {
    if (this.shootCooldownTimer > 0 || this.energy < 15 || this.poise.isStaggered) return [];

    let shootDir = this.facing.clone();
    if (targetPos) {
      const dirToTarget = Vector2D.sub(targetPos, this.position);
      if (dirToTarget.magnitudeSquared() > 0.001) {
        shootDir = dirToTarget.normalize();
      }
    }

    this.shootCooldownTimer = this.shootCooldown;
    this.energy -= 15;

    const projs: Projectile[] = [];

    if (this.stance === 'SolarResonantFlare') {
      // Dual-shot spread (+12 deg, -12 deg)
      const angle = Math.atan2(shootDir.y, shootDir.x);
      [-0.18, 0.18].forEach((offset) => {
        const spreadDir = new Vector2D(Math.cos(angle + offset), Math.sin(angle + offset));
        const p = new Projectile(
          `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          this.position.x + spreadDir.x * 20,
          this.position.y + spreadDir.y * 20,
          spreadDir,
          560
        );
        p.damage = 22;
        projs.push(p);
      });
    } else {
      const p = new Projectile(
        `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        this.position.x + shootDir.x * 20,
        this.position.y + shootDir.y * 20,
        shootDir,
        520
      );
      projs.push(p);
    }

    return projs;
  }

  public executeComboAttack(): {
    arc: MeleeAttackArc;
    strike: ReturnType<EquipmentManager['getComboStrike']>;
    weaponType: WeaponType;
  } | null {
    if (this.poise.isStaggered) return null;

    const energyCost = this.comboIndex === 0 ? 10 : (this.comboIndex === 1 ? 12 : 16);
    const isComboChaining = this.attackState === 'RECOVERY';
    if (!isComboChaining && this.meleeCooldownTimer > 0) {
      this.bufferInput('ATTACK');
      return null;
    }
    if (this.energy < energyCost) {
      return null;
    }

    const strike = this.equipmentManager.getComboStrike(this.comboIndex);
    const activeStats = this.equipmentManager.getActiveWeaponStats();
    const isGlaive = activeStats.type === 'PRANA_GLAIVE';

    this.isMeleeSlashing = true;
    this.isSpecialAttacking = false;
    this.attackState = 'STARTUP';
    this.attackPhaseTimer = isGlaive ? 0.08 : 0.05;
    this.canCancelWithDodge = false;

    this.meleeSlashTimer = isGlaive ? 0.32 : 0.22;
    this.meleeCooldownTimer = activeStats.attackCooldown;
    this.energy = Math.max(0, this.energy - energyCost);

    // Apply stance damage bonus if active
    const finalDamage = this.stance === 'SolarResonantFlare' ? Math.round(strike.damage * 1.3) : strike.damage;

    // Progress combo chain
    this.comboIndex = (this.comboIndex + 1) % 3;
    this.comboResetTimer = this.comboChainWindow;

    const arc: MeleeAttackArc = {
      origin: this.position.clone(),
      direction: this.facing.clone().normalize(),
      radius: strike.reach,
      arcAngle: strike.arcAngle,
      damage: finalDamage,
      poiseDamage: strike.poiseDamage,
      isShieldBreak: strike.isShieldBreak,
    };
    this.activeMeleeArc = arc;

    return {
      arc,
      strike,
      weaponType: activeStats.type,
    };
  }

  public executeSpecialAttack(): {
    arc: MeleeAttackArc;
    name: string;
    weaponType: WeaponType;
  } | null {
    if (this.poise.isStaggered || this.energy < 30 || this.meleeCooldownTimer > 0) return null;

    const activeStats = this.equipmentManager.getActiveWeaponStats();
    const isGlaive = activeStats.type === 'PRANA_GLAIVE';

    this.energy -= 30;
    this.isMeleeSlashing = true;
    this.isSpecialAttacking = true;
    this.attackState = 'ACTIVE';
    this.attackPhaseTimer = isGlaive ? 0.30 : 0.25;
    this.canCancelWithDodge = false;
    this.meleeCooldownTimer = isGlaive ? 0.65 : 0.48;

    const arc: MeleeAttackArc = isGlaive
      ? {
          origin: this.position.clone(),
          direction: this.facing.clone().normalize(),
          radius: 155,
          arcAngle: Math.PI * 0.85,
          damage: this.stance === 'SolarResonantFlare' ? 110 : 85,
          poiseDamage: 75,
          isShieldBreak: true,
        }
      : {
          origin: this.position.clone(),
          direction: this.facing.clone().normalize(),
          radius: 95,
          arcAngle: Math.PI * 2.0, // 360 degree radial Surya vortex
          damage: this.stance === 'SolarResonantFlare' ? 85 : 65,
          poiseDamage: 45,
          isShieldBreak: false,
        };

    this.activeMeleeArc = arc;
    const name = isGlaive ? 'Brahmic Sky Cleave' : 'Surya Solar Vortex';

    return {
      arc,
      name,
      weaponType: activeStats.type,
    };
  }

  public performMeleeSlash(): MeleeAttackArc | null {
    const result = this.executeComboAttack();
    return result ? result.arc : null;
  }

  public takeDamage(amount: number, knockbackDir?: Vector2D): boolean {
    if (this.isDashing || this.iFrameTimer > 0) return false;

    this.health = Math.max(0, this.health - amount);
    this.iFrameTimer = 0.6; // 600ms invulnerability frames

    if (knockbackDir) {
      this.position.x += knockbackDir.x * 24;
      this.position.y += knockbackDir.y * 24;
      this.syncBounds();
    }

    return true; // damage was taken
  }

  public heal(amount: number): number {
    const prev = this.health;
    this.health = Math.min(this.maxHealth, this.health + amount);
    return this.health - prev;
  }

  public update(dt: number): void {
    this.idleBreath += dt * 3;
    this.equipmentManager.update(dt);

    // Energy regeneration
    if (this.energy < this.maxEnergy && !this.poise.isStaggered) {
      this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegenRate * dt);
    }

    // Cooldown timers
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - dt);
    }
    if (this.shootCooldownTimer > 0) {
      this.shootCooldownTimer = Math.max(0, this.shootCooldownTimer - dt);
    }
    if (this.meleeCooldownTimer > 0) {
      this.meleeCooldownTimer = Math.max(0, this.meleeCooldownTimer - dt);
    }
    if (this.iFrameTimer > 0) {
      this.iFrameTimer = Math.max(0, this.iFrameTimer - dt);
    }
    if (this.parryWindowTimer > 0) {
      this.parryWindowTimer = Math.max(0, this.parryWindowTimer - dt);
    }

    // Combo reset timer
    if (this.comboResetTimer > 0) {
      this.comboResetTimer -= dt;
      if (this.comboResetTimer <= 0) {
        this.comboIndex = 0;
      }
    }

    // Poise stagger recovery
    if (this.poise.isStaggered) {
      this.poise.staggerTimer -= dt;
      this.attackState = 'IDLE';
      this.isMeleeSlashing = false;
      this.isSpecialAttacking = false;
      this.inputBuffer = null;
      this.isGuarding = false;
      if (this.poise.staggerTimer <= 0) {
        this.poise.isStaggered = false;
        this.poise.current = this.poise.max;
      }
    } else if (this.poise.current < this.poise.max) {
      this.poise.current = Math.min(this.poise.max, this.poise.current + 25 * dt);
    }

    // Attack Phase State Machine
    if (this.attackState !== 'IDLE') {
      this.attackPhaseTimer -= dt;
      while (this.attackPhaseTimer <= 0 && (this.attackState as AttackState) !== 'IDLE') {
        const isGlaive = this.equipmentManager.getActiveWeapon() === 'PRANA_GLAIVE';
        if (this.attackState === 'STARTUP') {
          this.attackState = 'ACTIVE';
          this.attackPhaseTimer += isGlaive ? 0.12 : 0.09;
        } else if (this.attackState === 'ACTIVE') {
          this.attackState = 'RECOVERY';
          this.canCancelWithDodge = true;
          this.attackPhaseTimer += isGlaive ? 0.16 : 0.10;
        } else if (this.attackState === 'RECOVERY') {
          this.attackState = 'IDLE';
          this.canCancelWithDodge = false;
          this.isMeleeSlashing = false;
          this.isSpecialAttacking = false;
          this.activeMeleeArc = null;
          break;
        }
      }
    }

    // Melee slash visual duration fallback
    if (this.isMeleeSlashing) {
      this.meleeSlashTimer -= dt;
      if (this.meleeSlashTimer <= 0 && this.attackState === 'IDLE') {
        this.isMeleeSlashing = false;
        this.isSpecialAttacking = false;
      }
    }

    // Handle dash state
    if (this.isDashing) {
      this.dashTimer -= dt;
      this.position.x += this.velocity.x * dt;
      this.position.y += this.velocity.y * dt;
      this.syncBounds();

      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.velocity.set(0, 0);
      }
    }

    // Process buffered inputs
    if (this.inputBuffer) {
      this.inputBuffer.timer -= dt;
      if (this.inputBuffer.timer <= 0) {
        this.inputBuffer = null;
      } else {
        if (this.inputBuffer.action === 'DASH' && this.dashCooldownTimer <= 0 && this.energy >= 25) {
          this.inputBuffer = null;
          this.triggerDash();
        } else if (
          this.inputBuffer.action === 'ATTACK' &&
          (this.attackState === 'IDLE' || this.attackState === 'RECOVERY') &&
          this.meleeCooldownTimer <= 0 &&
          this.energy >= 10
        ) {
          this.inputBuffer = null;
          this.executeComboAttack();
        } else if (
          this.inputBuffer.action === 'SWAP' &&
          this.equipmentManager.canSwap()
        ) {
          this.inputBuffer = null;
          this.swapWeapon();
        }
      }
    }

    // Update Character Rig
    this.rig.position.set(this.position.x, this.position.y);
    this.rig.facing = this.facing.x >= 0 ? 1 : -1;
    const speedParam = this.isDashing ? 1.0 : Math.min(1.0, this.velocity.magnitude() / this.speed);
    this.rig.stateMachine.setFloat('speed', speedParam);
    if (this.isMeleeSlashing) {
      this.rig.stateMachine.setTrigger('trigger_slash');
    }
    if (this.isDashing) {
      this.rig.stateMachine.setTrigger('trigger_dash');
    }
    this.rig.expression = this.poise.isStaggered ? 'hurt' : (this.iFrameTimer > 0 ? 'hurt' : 'neutral');
    this.rig.update(dt);
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    // Blinking during invulnerability frames
    if (this.iFrameTimer > 0 && Math.floor(this.iFrameTimer * 20) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Shadow on ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stagger dizzy indicator
    if (this.poise.isStaggered) {
      ctx.save();
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -38, 16, 5, Math.sin(this.idleBreath * 5) * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#F59E0B';
      for (let i = 0; i < 3; i++) {
        const starAngle = this.idleBreath * 4 + (i * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.arc(Math.cos(starAngle) * 16, -38 + Math.sin(starAngle) * 4, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Guarding & Parry Shield Visual
    if (this.isGuarding) {
      ctx.save();
      const facingAngle = Math.atan2(this.facing.y, this.facing.x);
      ctx.rotate(facingAngle);

      if (this.parryWindowTimer > 0) {
        // Bright cyan parry flash
        ctx.strokeStyle = '#00E5FF';
        ctx.shadowColor = '#00E5FF';
        ctx.shadowBlur = 16;
        ctx.lineWidth = 4;
      } else {
        // Golden defensive shield arc
        ctx.strokeStyle = '#F59E0B';
        ctx.shadowColor = '#D97706';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 3;
      }

      ctx.beginPath();
      ctx.arc(0, 0, 26, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
      ctx.restore();
    }

    // Stance Aura (Solar Resonant Flare)
    if (this.stance === 'SolarResonantFlare') {
      ctx.strokeStyle = '#FFB703';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 26 + Math.sin(this.idleBreath * 2) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Dash trail or aura
    if (this.isDashing) {
      ctx.fillStyle = 'rgba(251, 133, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();
    }

    // Melee Crescent Arc Flash or Special Attack
    if (this.isMeleeSlashing) {
      const facingAngle = Math.atan2(this.facing.y, this.facing.x);
      ctx.save();
      ctx.rotate(facingAngle);

      const isGlaive = this.equipmentManager.getActiveWeapon() === 'PRANA_GLAIVE';
      ctx.strokeStyle = isGlaive ? '#06B6D4' : '#FFD166';
      ctx.lineWidth = isGlaive ? 7 : 5;
      ctx.shadowColor = isGlaive ? '#0891B2' : '#FB8500';
      ctx.shadowBlur = 14;

      if (this.isSpecialAttacking) {
        if (isGlaive) {
          // Brahmic Sky Cleave - Massive piercing spear beam
          ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
          ctx.fillRect(0, -14, 155, 28);
          ctx.strokeRect(0, -14, 155, 28);
        } else {
          // Surya Solar Vortex - Radial spinning golden nova
          ctx.beginPath();
          ctx.arc(0, 0, 95, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(255, 209, 102, 0.2)';
          ctx.fill();
        }
      } else {
        const stats = this.equipmentManager.getActiveWeaponStats();
        ctx.beginPath();
        ctx.arc(0, 0, stats.reach, -stats.arcAngle / 2, stats.arcAngle / 2);
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.restore();

    // Render Skeletal Character Rig
    this.rig.render(renderer);
  }
}
