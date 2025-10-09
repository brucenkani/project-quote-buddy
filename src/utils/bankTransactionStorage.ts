import { BankTransaction } from '@/types/bankTransaction';
import { supabase } from '@/integrations/supabase/client';

export const loadBankTransactions = async (): Promise<BankTransaction[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      date: row.date,
      description: row.description,
      reference: row.reference || '',
      debit: Number(row.debit),
      credit: Number(row.credit),
      balance: Number(row.balance),
      accountId: row.account_id || '',
      category: row.category || '',
      isReconciled: row.is_reconciled,
    }));
  } catch (error) {
    console.error('Failed to load bank transactions:', error);
    return [];
  }
};

export const saveBankTransactions = async (transactions: BankTransaction[]): Promise<void> => {
  // Not used anymore - use saveBankTransaction instead
  console.warn('saveBankTransactions is deprecated, use saveBankTransaction instead');
};

export const saveBankTransaction = async (transaction: BankTransaction): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('bank_transactions')
      .upsert({
        id: transaction.id,
        user_id: user.id,
        date: transaction.date,
        description: transaction.description,
        reference: transaction.reference,
        debit: transaction.debit,
        credit: transaction.credit,
        balance: transaction.balance,
        account_id: transaction.accountId,
        category: transaction.category,
        is_reconciled: transaction.isReconciled,
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to save bank transaction:', error);
    throw error;
  }
};

export const deleteBankTransaction = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('bank_transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete bank transaction:', error);
    throw error;
  }
};
