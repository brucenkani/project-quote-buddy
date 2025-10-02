import { JournalEntry, Expense } from '@/types/accounting';

const JOURNAL_KEY = 'quotebuilder-journal';
const EXPENSE_KEY = 'quotebuilder-expenses';

// Journal Entries
export const loadJournalEntries = (): JournalEntry[] => {
  try {
    const stored = localStorage.getItem(JOURNAL_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load journal entries:', error);
  }
  return [];
};

export const saveJournalEntries = (entries: JournalEntry[]): void => {
  try {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Failed to save journal entries:', error);
  }
};

export const saveJournalEntry = (entry: JournalEntry): void => {
  const entries = loadJournalEntries();
  const index = entries.findIndex(e => e.id === entry.id);
  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.push(entry);
  }
  saveJournalEntries(entries);
};

export const deleteJournalEntry = (id: string): void => {
  const entries = loadJournalEntries().filter(e => e.id !== id);
  saveJournalEntries(entries);
};

// Expenses
export const loadExpenses = (): Expense[] => {
  try {
    const stored = localStorage.getItem(EXPENSE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load expenses:', error);
  }
  return [];
};

export const saveExpenses = (expenses: Expense[]): void => {
  try {
    localStorage.setItem(EXPENSE_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.error('Failed to save expenses:', error);
  }
};

export const saveExpense = (expense: Expense): void => {
  const expenses = loadExpenses();
  const index = expenses.findIndex(e => e.id === expense.id);
  if (index >= 0) {
    expenses[index] = expense;
  } else {
    expenses.push(expense);
  }
  saveExpenses(expenses);
};

export const deleteExpense = (id: string): void => {
  const expenses = loadExpenses().filter(e => e.id !== id);
  saveExpenses(expenses);
};
