import { Purchase } from '@/types/purchase';

const STORAGE_KEY = 'quotebuilder-purchases';

export const loadPurchases = (): Purchase[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load purchases:', error);
  }
  return [];
};

export const savePurchases = (purchases: Purchase[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
  } catch (error) {
    console.error('Failed to save purchases:', error);
  }
};

export const savePurchase = (purchase: Purchase): void => {
  const purchases = loadPurchases();
  const index = purchases.findIndex(p => p.id === purchase.id);
  if (index >= 0) {
    purchases[index] = purchase;
  } else {
    purchases.push(purchase);
  }
  savePurchases(purchases);
};

export const deletePurchase = (id: string): void => {
  const purchases = loadPurchases().filter(p => p.id !== id);
  savePurchases(purchases);
};

export const generatePurchaseNumber = (): string => {
  const purchases = loadPurchases();
  const lastNumber = purchases.length > 0 
    ? Math.max(...purchases.map(p => {
        const match = p.purchaseNumber.match(/\d+$/);
        return match ? parseInt(match[0]) : 0;
      }))
    : 0;
  return `PO-${String(lastNumber + 1).padStart(5, '0')}`;
};
