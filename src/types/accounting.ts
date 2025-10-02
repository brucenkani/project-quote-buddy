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
  attachmentUrl?: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected' | 'partly-paid' | 'overdue';
  dueDate?: string;
  payments?: ExpensePayment[];
  includesVAT?: boolean; // Whether VAT is included in the amount
  vatRate?: number; // VAT rate (e.g., 0.15 for 15%)
  vatAmount?: number; // Calculated VAT amount
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
