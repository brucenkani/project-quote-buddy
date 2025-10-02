import { Quote } from './quote';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quoteId?: string;
  projectDetails: Quote['projectDetails'];
  lineItems: Quote['lineItems'];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  dueDate: string;
  issueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paymentTerms: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
