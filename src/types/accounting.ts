export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  entries: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryLine {
  id: string;
  account: string;
  accountType: AccountType;
  debit: number;
  credit: number;
  description?: string;
}

export interface Expense {
  id: string;
  date: string;
  vendor: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  supplierInvoiceRef?: string;
  attachmentUrl?: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected' | 'partly-paid' | 'overdue';
  dueDate?: string;
  payments?: ExpensePayment[];
  supplierReturns?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ExpensePayment {
  id: string;
  amount: number;
  date: string;
  method: string;
  reference?: string;
}
