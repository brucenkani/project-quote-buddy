export type PurchaseOrderStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'converted';

export interface PurchaseOrderLineItem {
  id: string;
  description: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendor: string;
  vendorContact?: string;
  date: string;
  expectedDelivery?: string;
  lineItems: PurchaseOrderLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  status: PurchaseOrderStatus;
  notes?: string;
  projectId?: string;
  terms?: string;
  deliveryAddress?: string;
  createdAt: string;
  updatedAt: string;
  convertedToPurchaseId?: string;
}
