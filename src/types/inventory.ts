export type InventoryType = 'raw-materials' | 'work-in-progress' | 'consumables' | 'finished-products';

export interface InventoryItem {
  id: string;
  name: string;
  type: InventoryType;
  sku: string;
  category: string;
  description: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  unitCost: number;
  totalValue: number;
  supplier?: string;
  location?: string;
  lastRestocked?: string;
  createdAt: string;
  updatedAt: string;
}

export const getInventoryTypesForCompanyType = (companyType: string): InventoryType[] => {
  switch (companyType) {
    case 'manufacturer':
      return ['raw-materials', 'work-in-progress', 'finished-products', 'consumables'];
    case 'trading':
      return ['finished-products'];
    case 'contractor':
      return ['consumables'];
    case 'professional-services':
      return []; // No inventory for professional services
    default:
      return ['consumables'];
  }
};

// Check if inventory type should be included in cost of sales calculation
export const isIncludedInCOGS = (type: InventoryType): boolean => {
  // Only Raw Materials and Finished Products are included in COGS
  // Work In Progress and Consumables are NOT included
  return type === 'raw-materials' || type === 'finished-products';
};
