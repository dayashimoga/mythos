export interface TradeItem {
  id: string;
  name: string;
  baseCost: number; // in Karma Essence
  category: 'CONSUMABLE' | 'MATERIAL' | 'ASTRIC_RELIC';
  stock: number;
}

export interface ArtisanRecipe {
  id: string;
  resultName: string;
  requiredMaterials: Array<{ itemId: string; count: number }>;
  karmaCost: number;
  resultBonusDamage: number;
}

export class SettlementEconomy {
  public merchantInventory: TradeItem[] = [
    { id: 'item_amrita_vial', name: 'Amrita Vital Nectar', baseCost: 40, category: 'CONSUMABLE', stock: 5 },
    { id: 'item_brahma_ingot', name: 'Brahma-Forged Ingot', baseCost: 100, category: 'MATERIAL', stock: 3 },
    { id: 'item_surya_incense', name: 'Surya Solar Incense', baseCost: 60, category: 'CONSUMABLE', stock: 4 },
    { id: 'item_vajra_alloy', name: 'Indra’s Vajra Alloy', baseCost: 150, category: 'MATERIAL', stock: 2 },
    { id: 'item_dharma_talisman', name: 'Dharmic Protection Talisman', baseCost: 200, category: 'ASTRIC_RELIC', stock: 1 },
  ];

  public artisanRecipes: ArtisanRecipe[] = [
    {
      id: 'recipe_consecrated_blade',
      resultName: 'Consecrated Agni Chakram +1',
      requiredMaterials: [
        { itemId: 'item_brahma_ingot', count: 1 },
        { itemId: 'item_surya_incense', count: 1 },
      ],
      karmaCost: 80,
      resultBonusDamage: 0.25,
    },
    {
      id: 'recipe_vajra_glaive',
      resultName: 'Thunder-Forged Prana Glaive',
      requiredMaterials: [
        { itemId: 'item_vajra_alloy', count: 1 },
        { itemId: 'item_brahma_ingot', count: 1 },
      ],
      karmaCost: 140,
      resultBonusDamage: 0.4,
    },
  ];

  public getAdjustedPrice(item: TradeItem, playerKarmaAlignment: number): number {
    // Karma alignment [-100 to +100] gives up to 25% discount or penalty
    const discount = (playerKarmaAlignment / 100) * 0.25;
    return Math.max(5, Math.round(item.baseCost * (1 - discount)));
  }

  public purchaseItem(
    itemId: string,
    playerKarmaCurrency: number,
    playerKarmaAlignment = 0
  ): { success: boolean; costPaid: number; remainingCurrency: number; purchasedItem?: TradeItem } {
    const item = this.merchantInventory.find((i) => i.id === itemId);
    if (!item || item.stock <= 0) {
      return { success: false, costPaid: 0, remainingCurrency: playerKarmaCurrency };
    }

    const price = this.getAdjustedPrice(item, playerKarmaAlignment);
    if (playerKarmaCurrency < price) {
      return { success: false, costPaid: 0, remainingCurrency: playerKarmaCurrency };
    }

    item.stock -= 1;
    return {
      success: true,
      costPaid: price,
      remainingCurrency: playerKarmaCurrency - price,
      purchasedItem: { ...item, stock: 1 },
    };
  }

  public craftArtisanRecipe(
    recipeId: string,
    playerInventory: Map<string, number>,
    playerKarmaCurrency: number
  ): { success: boolean; craftedName?: string; remainingCurrency: number } {
    const recipe = this.artisanRecipes.find((r) => r.id === recipeId);
    if (!recipe) {
      return { success: false, remainingCurrency: playerKarmaCurrency };
    }

    if (playerKarmaCurrency < recipe.karmaCost) {
      return { success: false, remainingCurrency: playerKarmaCurrency };
    }

    // Check material requirements
    for (const req of recipe.requiredMaterials) {
      const owned = playerInventory.get(req.itemId) || 0;
      if (owned < req.count) {
        return { success: false, remainingCurrency: playerKarmaCurrency };
      }
    }

    // Consume materials
    for (const req of recipe.requiredMaterials) {
      const owned = playerInventory.get(req.itemId) || 0;
      playerInventory.set(req.itemId, owned - req.count);
    }

    return {
      success: true,
      craftedName: recipe.resultName,
      remainingCurrency: playerKarmaCurrency - recipe.karmaCost,
    };
  }
}
