import { PurchasePayment } from '@/types/purchasePayment';

const STORAGE_KEY = 'quotebuilder-purchase-payments';

export const loadPurchasePayments = (): PurchasePayment[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load purchase payments:', error);
  }
  return [];
};

export const savePurchasePayments = (payments: PurchasePayment[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
  } catch (error) {
    console.error('Failed to save purchase payments:', error);
  }
};

export const savePurchasePayment = (payment: PurchasePayment): void => {
  const payments = loadPurchasePayments();
  payments.push(payment);
  savePurchasePayments(payments);
};

export const getPurchasePayments = (purchaseId: string): PurchasePayment[] => {
  return loadPurchasePayments().filter(p => p.purchaseId === purchaseId);
};

export const getTotalPaid = (purchaseId: string): number => {
  return getPurchasePayments(purchaseId).reduce((sum, p) => sum + p.amount, 0);
};
