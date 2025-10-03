export interface ExpensePayment {
  id: string;
  expenseId: string;
  amount: number;
  date: string;
  method: string;
  reference: string;
  notes?: string;
}

const STORAGE_KEY = 'quotebuilder-expense-payments';

export const loadExpensePayments = (): ExpensePayment[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load expense payments:', error);
  }
  return [];
};

export const saveExpensePayments = (payments: ExpensePayment[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
  } catch (error) {
    console.error('Failed to save expense payments:', error);
  }
};

export const saveExpensePayment = (payment: ExpensePayment): void => {
  const payments = loadExpensePayments();
  payments.push(payment);
  saveExpensePayments(payments);
};

export const getExpensePayments = (expenseId: string): ExpensePayment[] => {
  return loadExpensePayments().filter(p => p.expenseId === expenseId);
};

export const getTotalPaid = (expenseId: string): number => {
  return getExpensePayments(expenseId).reduce((sum, p) => sum + p.amount, 0);
};
