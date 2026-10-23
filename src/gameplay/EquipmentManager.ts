export type WeaponType = 'AGNI_CHAKRAM' | 'PRANA_GLAIVE';

export interface WeaponStats {
  type: WeaponType;
  name: string;
  level: number;
  baseDamage: number;
  basePoiseDamage: number;
  attackCooldown: number;
  reach: number;
  arcAngle: number;
  canBreakShield: boolean;
  description: string;
}

export class EquipmentManager {
  private activeWeapon: WeaponType = 'AGNI_CHAKRAM';
  private swapCooldownTimer = 0;
  public readonly swapCooldown = 0.15; // 150ms swap cooldown

  public essence = 0;

  private weapons: Record<WeaponType, WeaponStats> = {
    AGNI_CHAKRAM: {
      type: 'AGNI_CHAKRAM',
      name: 'Agni-Chakram',
      level: 1,
      baseDamage: 28,
      basePoiseDamage: 18,
      attackCooldown: 0.22,
      reach: 75,
      arcAngle: Math.PI * 0.55,
      canBreakShield: false,
      description: 'Rapid twin solar discs with swift attack cadence and deflection capability.',
    },
    PRANA_GLAIVE: {
      type: 'PRANA_GLAIVE',
      name: 'Prana-Glaive',
      level: 1,
      baseDamage: 48,
      basePoiseDamage: 38,
      attackCooldown: 0.40,
      reach: 125,
      arcAngle: Math.PI * 0.78,
      canBreakShield: true,
      description: 'Monumental polearm with immense reach, guard-breaking thrusts, and high stagger.',
    },
  };

  public getActiveWeapon(): WeaponType {
    return this.activeWeapon;
  }

  public getActiveWeaponStats(): WeaponStats {
    return this.weapons[this.activeWeapon];
  }

  public getWeaponStats(type: WeaponType): WeaponStats {
    return this.weapons[type];
  }

  public canSwap(): boolean {
    return this.swapCooldownTimer <= 0;
  }

  public swapWeapon(): boolean {
    if (!this.canSwap()) return false;

    this.activeWeapon = this.activeWeapon === 'AGNI_CHAKRAM' ? 'PRANA_GLAIVE' : 'AGNI_CHAKRAM';
    this.swapCooldownTimer = this.swapCooldown;
    return true;
  }

  public setWeapon(type: WeaponType): void {
    this.activeWeapon = type;
    this.swapCooldownTimer = this.swapCooldown;
  }

  public update(dt: number): void {
    if (this.swapCooldownTimer > 0) {
      this.swapCooldownTimer = Math.max(0, this.swapCooldownTimer - dt);
    }
  }

  /**
   * Evaluates dynamic combo modifiers for 3-hit attack chains
   */
  public getComboStrike(comboIndex: number): {
    damage: number;
    poiseDamage: number;
    reach: number;
    arcAngle: number;
    isShieldBreak: boolean;
  } {
    const stats = this.getActiveWeaponStats();
    const lvlMultiplier = 1.0 + (stats.level - 1) * 0.15;

    // Step 0: Hit 1, Step 1: Hit 2, Step 2: Finisher
    if (comboIndex === 0) {
      return {
        damage: Math.round(stats.baseDamage * lvlMultiplier),
        poiseDamage: Math.round(stats.basePoiseDamage * lvlMultiplier),
        reach: stats.reach,
        arcAngle: stats.arcAngle,
        isShieldBreak: false,
      };
    } else if (comboIndex === 1) {
      return {
        damage: Math.round(stats.baseDamage * 1.25 * lvlMultiplier),
        poiseDamage: Math.round(stats.basePoiseDamage * 1.3 * lvlMultiplier),
        reach: stats.reach * 1.1,
        arcAngle: stats.arcAngle * 1.15,
        isShieldBreak: stats.canBreakShield,
      };
    } else {
      // Finisher (3rd strike)
      return {
        damage: Math.round(stats.baseDamage * 1.6 * lvlMultiplier),
        poiseDamage: Math.round(stats.basePoiseDamage * 1.8 * lvlMultiplier),
        reach: stats.reach * 1.25,
        arcAngle: stats.arcAngle * 1.3,
        isShieldBreak: stats.canBreakShield,
      };
    }
  }

  public addEssence(amount: number): void {
    this.essence += amount;
  }

  public upgradeWeapon(type: WeaponType): boolean {
    const cost = this.weapons[type].level * 100;
    if (this.essence >= cost) {
      this.essence -= cost;
      this.weapons[type].level++;
      return true;
    }
    return false;
  }
}
