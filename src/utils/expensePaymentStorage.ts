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
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) return [];

    const userId = session.session.user.id;

    const { data: memberData } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!memberData?.company_id) return [];

    const { data: payments, error } = await supabase
      .from('expense_payments')
      .select('*')
      .eq('company_id', memberData.company_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (payments || []).map(p => ({
      id: p.id,
      expenseId: p.expense_id,
      amount: Number(p.amount),
      date: p.date,
      method: p.method,
      reference: p.reference,
      notes: p.notes || undefined,
    }));
  } catch (error) {
    console.error('Failed to load expense payments:', error);
    return [];
  }
};

export const saveExpensePayment = async (payment: ExpensePayment): Promise<void> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) throw new Error('No authenticated user');

    const userId = session.session.user.id;

    const { data: memberData } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!memberData?.company_id) throw new Error('No active company');

    const { error } = await supabase
      .from('expense_payments')
      .insert({
        id: payment.id,
        user_id: userId,
        company_id: memberData.company_id,
        expense_id: payment.expenseId,
        amount: payment.amount,
        date: payment.date,
        method: payment.method,
        reference: payment.reference,
        notes: payment.notes || null,
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to save expense payment:', error);
    throw error;
  }
};

export const saveExpensePayments = async (payments: ExpensePayment[]): Promise<void> => {
  for (const payment of payments) {
    await saveExpensePayment(payment);
  }
};

export const getExpensePayments = async (expenseId: string): Promise<ExpensePayment[]> => {
  const payments = await loadExpensePayments();
  return payments.filter(p => p.expenseId === expenseId);
};

export const getTotalPaid = async (expenseId: string): Promise<number> => {
  const payments = await getExpensePayments(expenseId);
  return payments.reduce((sum, p) => sum + p.amount, 0);
};
