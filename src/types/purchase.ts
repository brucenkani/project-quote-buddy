export type PurchaseStatus = 'pending' | 'received' | 'partly-received' | 'cancelled';
export type PurchasePaymentMethod = 'credit' | 'cash' | 'bank-transfer';

export interface PurchaseLineItem {
  id: string;
  description: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
  total: number;
  inventoryItemId?: string; // Link to inventory item
  inventoryType?: 'raw-materials' | 'work-in-progress' | 'consumables' | 'finished-products';
  category?: string;
  projectId?: string; // For contractor businesses
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  vendor: string;
  vendorContact?: string;
  date: string;
  dueDate?: string;
  lineItems: PurchaseLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  status: PurchaseStatus;
  paymentMethod: PurchasePaymentMethod;
  bankAccountId?: string; // Required when paymentMethod is 'bank-transfer'
  notes?: string;
  projectId?: string;
  inventoryMethod: 'perpetual' | 'periodic';
  supplierInvoiceNumber?: string; // To prevent duplicate invoices
  receivedDate?: string;
  invoiceDate?: string;
  createdAt: string;
  updatedAt: string;
}
