export interface ProjectDetails {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  projectAddress?: string;
  projectName?: string;
  projectLocation?: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  amount: number;
  total: number;
  lineItemType?: 'inventory' | 'account'; // Type of line item
  inventoryItemId?: string; // Link to inventory item if type is 'inventory'
  accountId?: string; // GL account if type is 'account'
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quoteId?: string;
  type: 'invoice' | 'credit-note';
  projectDetails: ProjectDetails;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  dueDate: string;
  issueDate: string;
  status: 'draft' | 'paid' | 'unpaid' | 'partly-paid' | 'overdue';
  paymentTerms: string;
  notes?: string;
  payments?: Payment[];
  creditNotes?: string[]; // IDs of related credit notes
  createdAt: string;
  updatedAt: string;
  // Tax compliance fields
  fiscalData?: {
    qrCode?: string; // For ZRA (Zambia) and ZIMRA (Zimbabwe)
    fiscalSignature?: string; // For ZIMRA fiscal devices
    smartInvoiceId?: string; // ZRA Smart Invoice ID
    fiscalDeviceId?: string; // ZIMRA fiscal device ID
    verificationUrl?: string; // URL for QR code verification
  };
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  method: string;
  reference?: string;
}

export interface RecurringInvoice {
  id: string;
  invoiceTemplate: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'payments' | 'creditNotes'>;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate?: string;
  lastGeneratedDate?: string;
  nextGenerationDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
