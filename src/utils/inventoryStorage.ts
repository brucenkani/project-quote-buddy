import { InventoryItem } from '@/types/inventory';

const STORAGE_KEY = 'quotebuilder-inventory';

export const loadInventory = (): InventoryItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load inventory:', error);
  }
  return [];
};

export const saveInventory = (items: InventoryItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save inventory:', error);
  }
};

export const saveInventoryItem = (item: InventoryItem): void => {
  const items = loadInventory();
  const index = items.findIndex(i => i.id === item.id);
  if (index >= 0) {
    items[index] = item;
  } else {
    items.push(item);
  }
  saveInventory(items);
};

export const deleteInventoryItem = (id: string): void => {
  const items = loadInventory().filter(i => i.id !== id);
  saveInventory(items);
};
