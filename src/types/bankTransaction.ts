export type TransactionType = 'debit' | 'credit';
export type AllocationStatus = 'unallocated' | 'partially-allocated' | 'allocated';
export type AllocationType = 'invoice' | 'purchase' | 'expense';

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  reference: string;
  type: TransactionType;
  amount: number;
  balance: number;
  status: AllocationStatus;
  allocations: TransactionAllocation[];
  importedAt: string;
}

export interface TransactionAllocation {
  id: string;
  allocationType: AllocationType;
  allocationId: string; // Invoice ID, Purchase ID, or Expense ID
  amount: number;
  allocatedAt: string;
  notes?: string;
}
