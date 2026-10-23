export type MutatorType =
  | 'ECLIPSE_DARKNESS'
  | 'AGNI_OVERHEAT'
  | 'VAYU_TURBULENCE'
  | 'VOID_VAMPIRISM';

export interface KarmicMutator {
  type: MutatorType;
  title: string;
  description: string;
  scoreMultiplier: number;
  playerSpeedModifier: number;
  enemyDamageModifier: number;
  specialRules: string[];
}

export interface ChallengeSeason {
  weekNumber: number;
  seasonTitle: string;
  activeMutators: KarmicMutator[];
  combinedMultiplier: number;
}

export class KarmicChallengeMutator {
  public static getMutator(type: MutatorType): KarmicMutator {
    switch (type) {
      case 'ECLIPSE_DARKNESS':
        return {
          type,
          title: 'Eclipse of Tamas',
          description: 'Darkness blankets the sacred realm. Enemies strike from the shadows.',
          scoreMultiplier: 1.8,
          playerSpeedModifier: 1.0,
          enemyDamageModifier: 1.3,
          specialRules: ['Vision radius reduced to 180px', 'Enemies deal +30% damage'],
        };
      case 'AGNI_OVERHEAT':
        return {
          type,
          title: 'Agni’s Primordial Crucible',
          description: 'The earth burns hot with sacred fire. Standing still drains prana.',
          scoreMultiplier: 1.5,
          playerSpeedModifier: 1.15,
          enemyDamageModifier: 1.2,
          specialRules: ['Passive prana drain when stationary', 'Fire trails on dash'],
        };
      case 'VAYU_TURBULENCE':
        return {
          type,
          title: 'Vayu’s Unbound Tempest',
          description: 'Violent winds whip across the battlefield.',
          scoreMultiplier: 1.4,
          playerSpeedModifier: 1.25,
          enemyDamageModifier: 1.1,
          specialRules: ['Glider speed boosted 100%', 'Random crosswinds active'],
        };
      case 'VOID_VAMPIRISM':
        return {
          type,
          title: 'Vedic Rite of Sannyasa',
          description: 'Amrita shrines run dry. Only flawless parries replenish your soul.',
          scoreMultiplier: 2.0,
          playerSpeedModifier: 1.0,
          enemyDamageModifier: 1.5,
          specialRules: ['Shrines disabled', 'Parries restore 20 HP'],
        };
    }
  }

  public static getWeeklySeason(weekNumber: number): ChallengeSeason {
    const mutatorTypes: MutatorType[] = [
      'ECLIPSE_DARKNESS',
      'AGNI_OVERHEAT',
      'VAYU_TURBULENCE',
      'VOID_VAMPIRISM',
    ];

    const m1 = this.getMutator(mutatorTypes[weekNumber % mutatorTypes.length]);
    const m2 = this.getMutator(mutatorTypes[(weekNumber + 1) % mutatorTypes.length]);

    const active = [m1, m2];
    const combined = active.reduce((acc, m) => acc * m.scoreMultiplier, 1.0);

    return {
      weekNumber,
      seasonTitle: `Week ${weekNumber}: Convergence of ${m1.title} & ${m2.title}`,
      activeMutators: active,
      combinedMultiplier: Math.round(combined * 100) / 100,
    };
  }

  public static computeFinalKarmicScore(baseScore: number, season: ChallengeSeason, noHitBonus = false): number {
    let score = baseScore * season.combinedMultiplier;
    if (noHitBonus) score *= 1.5;
    return Math.round(score);
  }
}
