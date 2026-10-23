export interface CustomAstraModDefinition {
  modId: string;
  modName: string;
  version: string;
  author: string;
  weapon: {
    name: string;
    description: string;
    damageType: 'FIRE' | 'WIND' | 'PRANA' | 'VOID' | 'CELESTIAL';
    baseDamage: number;
    attackSpeedMultiplier: number;
    comboHits: number;
    specialAbility: string;
  };
  visuals: {
    primaryColor: string;
    secondaryColor: string;
    particleCount: number;
  };
}

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
}

export class ModdingSchema {
  public static validateMod(json: unknown): ValidationReport {
    const errors: string[] = [];

    if (!json || typeof json !== 'object') {
      return { isValid: false, errors: ['Mod definition must be a valid JSON object'] };
    }

    const mod = json as Partial<CustomAstraModDefinition>;

    if (!mod.modId || typeof mod.modId !== 'string' || mod.modId.trim().length === 0) {
      errors.push('modId is required and must be a non-empty string');
    }
    if (!mod.modName || typeof mod.modName !== 'string') {
      errors.push('modName is required and must be a string');
    }
    if (!mod.version || typeof mod.version !== 'string') {
      errors.push('version is required and must follow semantic versioning');
    }

    if (!mod.weapon || typeof mod.weapon !== 'object') {
      errors.push('weapon definition object is required');
    } else {
      const validDamageTypes = ['FIRE', 'WIND', 'PRANA', 'VOID', 'CELESTIAL'];
      if (!validDamageTypes.includes(mod.weapon.damageType)) {
        errors.push(`weapon.damageType must be one of: ${validDamageTypes.join(', ')}`);
      }
      if (typeof mod.weapon.baseDamage !== 'number' || mod.weapon.baseDamage <= 0 || mod.weapon.baseDamage > 1000) {
        errors.push('weapon.baseDamage must be a number between 1 and 1000');
      }
      if (typeof mod.weapon.comboHits !== 'number' || mod.weapon.comboHits < 1 || mod.weapon.comboHits > 10) {
        errors.push('weapon.comboHits must be between 1 and 10');
      }
    }

    if (!mod.visuals || typeof mod.visuals !== 'object') {
      errors.push('visuals configuration object is required');
    } else {
      if (!mod.visuals.primaryColor || typeof mod.visuals.primaryColor !== 'string') {
        errors.push('visuals.primaryColor is required');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public static loadMod(jsonString: string): { success: boolean; mod?: CustomAstraModDefinition; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      const validation = this.validateMod(parsed);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join('; ') };
      }
      return { success: true, mod: parsed as CustomAstraModDefinition };
    } catch (e) {
      return { success: false, error: `JSON Parse Failure: ${(e as Error).message}` };
    }
  }
}
