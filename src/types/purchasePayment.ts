export type PaymentMethod = 'cash' | 'bank-transfer' | 'cheque' | 'credit-card' | 'other';

export interface PurchasePayment {
  id: string;
  purchaseId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  bankAccountId?: string;
  createdAt: string;
}
