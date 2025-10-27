// Temporary compatibility wrapper - DO NOT USE FOR NEW CODE
// Use InventoryContext instead
import { InventoryItem } from '@/types/inventory';

export const loadInventory = (): InventoryItem[] => {
  console.warn('loadInventory() is deprecated. Use useInventory() hook instead.');
  return [];
};

export const saveInventoryItem = (item: InventoryItem): void => {
  console.warn('saveInventoryItem() is deprecated. Use useInventory() hook instead.');
};
