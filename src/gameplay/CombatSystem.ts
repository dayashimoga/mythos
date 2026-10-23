import { Vector2D } from '../physics/Vector2D';
import { Camera } from '../render/Camera';
import { DamageNumberSystem } from '../render/DamageNumberSystem';

export interface PoiseData {
  current: number;
  max: number;
  isStaggered: boolean;
  staggerTimer: number;
  staggerDuration: number;
}

export interface AttackSpec {
  attackerId: string;
  damage: number;
  poiseDamage: number;
  isShieldBreak?: boolean;
  element?: 'AGNI' | 'SURYA' | 'VAYU' | 'TAMAS';
  origin: Vector2D;
}

export interface DefenseSpec {
  defenderId: string;
  position: Vector2D;
  facing: Vector2D;
  isGuarding: boolean;
  parryWindowTimer: number; // >0 means inside perfect parry window
  poise: PoiseData;
}

export interface CombatHitResult {
  damageDealt: number;
  poiseDamageDealt: number;
  wasParried: boolean;
  wasBlocked: boolean;
  triggeredStagger: boolean;
  isCritical: boolean;
}

export class CombatSystem {
  private damageNumbers?: DamageNumberSystem;
  private camera?: Camera;

  constructor(damageNumbers?: DamageNumberSystem, camera?: Camera) {
    this.damageNumbers = damageNumbers;
    this.camera = camera;
  }

  public setDamageNumbers(dn: DamageNumberSystem): void {
    this.damageNumbers = dn;
  }

  public setCamera(cam: Camera): void {
    this.camera = cam;
  }

  /**
   * Authoritatively evaluates an attack against a defender's defense state
   */
  public resolveAttack(attack: AttackSpec, defense: DefenseSpec): CombatHitResult {
    // 1. Perfect Parry Check (120ms active window)
    if (defense.parryWindowTimer > 0) {
      if (this.damageNumbers) {
        this.damageNumbers.spawn(defense.position.x, defense.position.y - 25, 'PARRY!', '#00E5FF');
      }
      if (this.camera) {
        this.camera.triggerShake(5.0, 0.15);
      }
      return {
        damageDealt: 0,
        poiseDamageDealt: 0,
        wasParried: true,
        wasBlocked: false,
        triggeredStagger: false,
        isCritical: false,
      };
    }

    // 2. Directional Shield Block Check
    let wasBlocked = false;
    let damage = attack.damage;
    let poiseDmg = attack.poiseDamage;

    if (defense.isGuarding) {
      // Calculate angle between defender facing and incoming attack vector
      const attackDir = Vector2D.sub(attack.origin, defense.position).normalize();
      const dot = defense.facing.dot(attackDir);

      // Facing toward attack (dot > 0.38 corresponds to ~68 degree half-angle)
      if (dot > 0.38) {
        if (attack.isShieldBreak) {
          // Shield break bypasses guard and inflicts 2x poise damage!
          wasBlocked = false;
          poiseDmg *= 2.0;
          if (this.damageNumbers) {
            this.damageNumbers.spawn(defense.position.x, defense.position.y - 30, 'GUARD BREAK!', '#F59E0B');
          }
        } else {
          // Normal block absorbs 75% of health damage, absorbs 50% poise damage
          wasBlocked = true;
          damage = Math.floor(damage * 0.25);
          poiseDmg = Math.floor(poiseDmg * 0.50);
          if (this.damageNumbers) {
            this.damageNumbers.spawn(defense.position.x, defense.position.y - 20, 'BLOCKED', '#94A3B8');
          }
        }
      }
    }

    // 3. Stagger & Critical Vulnerability Check
    let isCritical = false;
    if (defense.poise.isStaggered) {
      isCritical = true;
      damage = Math.floor(damage * 1.35); // +35% critical punish damage
    }

    // 4. Apply Poise Damage
    let triggeredStagger = false;
    defense.poise.current = Math.max(0, defense.poise.current - poiseDmg);

    if (defense.poise.current <= 0 && !defense.poise.isStaggered) {
      defense.poise.isStaggered = true;
      defense.poise.staggerTimer = defense.poise.staggerDuration;
      triggeredStagger = true;
      if (this.damageNumbers) {
        this.damageNumbers.spawn(defense.position.x, defense.position.y - 35, 'STAGGERED!', '#EF4444');
      }
      if (this.camera) {
        this.camera.triggerShake(7.0, 0.25);
      }
    }

    // 5. Spawn Damage Floating Text & Camera Impact
    if (this.damageNumbers && damage > 0) {
      const color = isCritical ? '#FFD700' : (wasBlocked ? '#94A3B8' : '#FFFFFF');
      this.damageNumbers.spawn(defense.position.x, defense.position.y - 15, damage.toString(), color);
    }

    if (this.camera && damage > 30) {
      this.camera.triggerShake(Math.min(10, damage * 0.15), 0.12);
    }

    return {
      damageDealt: damage,
      poiseDamageDealt: poiseDmg,
      wasParried: false,
      wasBlocked,
      triggeredStagger,
      isCritical,
    };
  }

  /**
   * Updates poise recovery timer for entities
   */
  public updatePoise(poise: PoiseData, dt: number, regenRate = 25): void {
    if (poise.isStaggered) {
      poise.staggerTimer -= dt;
      if (poise.staggerTimer <= 0) {
        poise.isStaggered = false;
        poise.current = poise.max; // Full poise reset after recovery
      }
    } else if (poise.current < poise.max) {
      poise.current = Math.min(poise.max, poise.current + regenRate * dt);
    }
  }
}
