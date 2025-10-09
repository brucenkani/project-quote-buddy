import { supabase } from '@/integrations/supabase/client';

export interface ExpensePayment {
  id: string;
  expenseId: string;
  amount: number;
  date: string;
  method: string;
  reference: string;
  notes?: string;
}

export const loadExpensePayments = async (): Promise<ExpensePayment[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('expense_payments')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      expenseId: row.expense_id,
      amount: Number(row.amount),
      date: row.date,
      method: row.method,
      reference: row.reference,
      notes: row.notes || undefined,
    }));
  } catch (error) {
    console.error('Failed to load expense payments:', error);
    return [];
  }
};

export const saveExpensePayments = async (payments: ExpensePayment[]): Promise<void> => {
  // Not used anymore
  console.warn('saveExpensePayments is deprecated');
};

export const saveExpensePayment = async (payment: ExpensePayment): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('expense_payments')
      .insert({
        id: payment.id,
        user_id: user.id,
        expense_id: payment.expenseId,
        amount: payment.amount,
        date: payment.date,
        method: payment.method,
        reference: payment.reference,
        notes: payment.notes,
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to save expense payment:', error);
    throw error;
  }
};

export const getExpensePayments = async (expenseId: string): Promise<ExpensePayment[]> => {
  const allPayments = await loadExpensePayments();
  return allPayments.filter(p => p.expenseId === expenseId);
};

export const getTotalPaid = async (expenseId: string): Promise<number> => {
  const payments = await getExpensePayments(expenseId);
  return payments.reduce((sum, p) => sum + p.amount, 0);
};
