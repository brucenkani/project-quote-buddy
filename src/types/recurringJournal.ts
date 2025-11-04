export interface RecurringJournalLine {
  id?: string;
  account_id: string;
  account_name: string;
  debit: number;
  credit: number;
}

export interface RecurringJournal {
  id: string;
  description: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate?: string;
  nextGenerationDate: string;
  status: 'active' | 'paused';
  reference?: string;
  lines: RecurringJournalLine[];
  createdAt: string;
  updatedAt: string;
}