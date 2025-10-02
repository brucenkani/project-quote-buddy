import { Expense } from '@/types/accounting';

export const calculateExpenseStatus = (expense: Expense): Expense['status'] => {
  // If manually approved/rejected, keep that status
  if (expense.status === 'approved' || expense.status === 'rejected') {
    return expense.status;
  }

  // Check if overdue (if dueDate exists and is passed)
  if (expense.dueDate) {
    const dueDate = new Date(expense.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < today && expense.status !== 'paid') {
      return 'overdue';
    }
  }

  // Return existing status (pending, paid, etc.)
  return expense.status;
};

