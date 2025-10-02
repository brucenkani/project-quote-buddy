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
      return ['raw-materials', 'consumables'];
    case 'professional-services':
      return ['consumables'];
    default:
      return ['raw-materials', 'consumables'];
  }
};
