import { Expense } from '@/types/accounting';

export const calculateExpenseStatus = (expense: Expense): Expense['status'] => {
  // If manually approved/rejected, keep that status
  if (expense.status === 'approved' || expense.status === 'rejected') {
    return expense.status;
  }

  // Calculate amount due
  let amountDue = expense.amount;
  
  // Subtract payments
  if (expense.payments && expense.payments.length > 0) {
    const totalPaid = expense.payments.reduce((sum, payment) => sum + payment.amount, 0);
    amountDue -= totalPaid;
  }
  
  // Fully paid
  if (amountDue <= 0) {
    return 'paid';
  }

  // Check if overdue (if dueDate exists and is passed)
  if (expense.dueDate) {
    const dueDate = new Date(expense.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < today && amountDue > 0) {
      return 'overdue';
    }
  }
  
  // Partly paid if some payment was made but not full
  if (amountDue < expense.amount) {
    return 'partly-paid';
  }

  // Return existing status (pending, etc.)
  return expense.status;
};

export const calculateExpenseAmountDue = (expense: Expense): number => {
  let amountDue = expense.amount;
  
  if (expense.payments && expense.payments.length > 0) {
    const totalPaid = expense.payments.reduce((sum, payment) => sum + payment.amount, 0);
    amountDue -= totalPaid;
  }
  
  return Math.max(0, amountDue);
};
