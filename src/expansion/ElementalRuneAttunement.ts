export type ElementalRuneType =
  | 'AGNI_EMBER'
  | 'VAYU_GALE'
  | 'PRANA_BLOOM'
  | 'SURYA_RADIANCE'
  | 'TAMAS_VOID';

export interface ElementalRune {
  id: string;
  type: ElementalRuneType;
  name: string;
  tier: number; // 1 to 3
  description: string;
  bonusDamage: number;
  bonusSpeed: number;
  critChance: number;
  lifesteal: number;
}

export interface WeaponAttunementSocket {
  slotIndex: number;
  unlocked: boolean;
  slottedRune: ElementalRune | null;
}

export class ElementalRuneAttunement {
  public sockets: WeaponAttunementSocket[] = [
    { slotIndex: 0, unlocked: true, slottedRune: null },
    { slotIndex: 1, unlocked: false, slottedRune: null },
    { slotIndex: 2, unlocked: false, slottedRune: null },
  ];

  public static createRune(type: ElementalRuneType, tier = 1): ElementalRune {
    switch (type) {
      case 'AGNI_EMBER':
        return {
          id: `rune_agni_${Date.now()}_${Math.random()}`,
          type,
          name: `Agni's Scorching Ember (Tier ${tier})`,
          tier,
          description: `Infuses attacks with scorching Vedic flame (+${15 * tier}% damage).`,
          bonusDamage: 0.15 * tier,
          bonusSpeed: 0,
          critChance: 0.05 * tier,
          lifesteal: 0,
        };
      case 'VAYU_GALE':
        return {
          id: `rune_vayu_${Date.now()}_${Math.random()}`,
          type,
          name: `Vayu's Swift Tempest (Tier ${tier})`,
          tier,
          description: `Bestows celestial wind haste (+${10 * tier}% movement & attack speed).`,
          bonusDamage: 0.05 * tier,
          bonusSpeed: 0.1 * tier,
          critChance: 0,
          lifesteal: 0,
        };
      case 'PRANA_BLOOM':
        return {
          id: `rune_prana_${Date.now()}_${Math.random()}`,
          type,
          name: `Prana's Vital Essence (Tier ${tier})`,
          tier,
          description: `Restores prana vital life force (+${3 * tier}% lifesteal).`,
          bonusDamage: 0,
          bonusSpeed: 0,
          critChance: 0,
          lifesteal: 0.03 * tier,
        };
      case 'SURYA_RADIANCE':
        return {
          id: `rune_surya_${Date.now()}_${Math.random()}`,
          type,
          name: `Surya's Blinding Corona (Tier ${tier})`,
          tier,
          description: `Sunlight piercing critical strikes (+${10 * tier}% crit chance).`,
          bonusDamage: 0.1 * tier,
          bonusSpeed: 0,
          critChance: 0.1 * tier,
          lifesteal: 0,
        };
      case 'TAMAS_VOID':
        return {
          id: `rune_tamas_${Date.now()}_${Math.random()}`,
          type,
          name: `Tamas Void Shard (Tier ${tier})`,
          tier,
          description: `Abyssal gravitation (+${20 * tier}% raw damage, -5% speed).`,
          bonusDamage: 0.2 * tier,
          bonusSpeed: -0.05 * tier,
          critChance: 0.08 * tier,
          lifesteal: 0.01 * tier,
        };
    }
  }

  public unlockSocket(index: number, essenceCost: number, currentEssence: number): boolean {
    if (index < 0 || index >= this.sockets.length) return false;
    if (this.sockets[index].unlocked) return true;
    if (currentEssence >= essenceCost) {
      this.sockets[index].unlocked = true;
      return true;
    }
    return false;
  }

  public attuneRune(index: number, rune: ElementalRune): boolean {
    if (index < 0 || index >= this.sockets.length) return false;
    if (!this.sockets[index].unlocked) return false;
    this.sockets[index].slottedRune = rune;
    return true;
  }

  public removeRune(index: number): ElementalRune | null {
    if (index < 0 || index >= this.sockets.length) return null;
    const existing = this.sockets[index].slottedRune;
    this.sockets[index].slottedRune = null;
    return existing;
  }

  public getComputedStatModifiers(): {
    damageMultiplier: number;
    speedMultiplier: number;
    critChance: number;
    lifesteal: number;
  } {
    let bonusDamage = 0;
    let bonusSpeed = 0;
    let critChance = 0;
    let lifesteal = 0;

    for (const socket of this.sockets) {
      if (socket.unlocked && socket.slottedRune) {
        bonusDamage += socket.slottedRune.bonusDamage;
        bonusSpeed += socket.slottedRune.bonusSpeed;
        critChance += socket.slottedRune.critChance;
        lifesteal += socket.slottedRune.lifesteal;
      }
    }

    return {
      damageMultiplier: 1.0 + Math.max(0, bonusDamage),
      speedMultiplier: 1.0 + Math.max(-0.5, bonusSpeed),
      critChance: Math.min(1.0, Math.max(0, critChance)),
      lifesteal: Math.min(0.5, Math.max(0, lifesteal)),
    };
  }
}
