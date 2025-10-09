import { BankTransaction } from '@/types/bankTransaction';

const STORAGE_KEY = 'quotebuilder-bank-transactions';

export const loadBankTransactions = (): BankTransaction[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load bank transactions:', error);
  }
  return [];
};

export const saveBankTransactions = (transactions: BankTransaction[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Failed to save bank transactions:', error);
  }
};

export const saveBankTransaction = (transaction: BankTransaction): void => {
  const transactions = loadBankTransactions();
  const index = transactions.findIndex(t => t.id === transaction.id);
  if (index >= 0) {
    transactions[index] = transaction;
  } else {
    transactions.push(transaction);
  }
  saveBankTransactions(transactions);
};

export const deleteBankTransaction = (id: string): void => {
  const transactions = loadBankTransactions();
  const filtered = transactions.filter(t => t.id !== id);
  saveBankTransactions(filtered);
};
