import { PurchaseOrder } from '@/types/purchaseOrder';

const STORAGE_KEY = 'quotebuilder-purchase-orders';

export const loadPurchaseOrders = (): PurchaseOrder[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load purchase orders:', error);
  }
  return [];
};

export const savePurchaseOrders = (orders: PurchaseOrder[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error('Failed to save purchase orders:', error);
  }
};

export const savePurchaseOrder = (order: PurchaseOrder): void => {
  const orders = loadPurchaseOrders();
  const index = orders.findIndex(o => o.id === order.id);
  if (index >= 0) {
    orders[index] = order;
  } else {
    orders.push(order);
  }
  savePurchaseOrders(orders);
};

export const deletePurchaseOrder = (id: string): void => {
  const orders = loadPurchaseOrders().filter(o => o.id !== id);
  savePurchaseOrders(orders);
};

export const generatePONumber = (): string => {
  const orders = loadPurchaseOrders();
  const lastNumber = orders.length > 0 
    ? Math.max(...orders.map(o => {
        const match = o.poNumber.match(/\d+$/);
        return match ? parseInt(match[0]) : 0;
      }))
    : 0;
  return `PO-${String(lastNumber + 1).padStart(5, '0')}`;
};
