import { BankTransaction } from '@/types/bankTransaction';
import { supabase } from '@/integrations/supabase/client';

export const loadBankTransactions = async (): Promise<BankTransaction[]> => {
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

    const { data: transactions, error } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('company_id', memberData.company_id)
      .order('date', { ascending: false });

    if (error) throw error;

    return (transactions || []).map(t => {
      const debit = Number(t.debit || 0);
      const credit = Number(t.credit || 0);
      const isDebit = debit > 0;
      return {
        id: t.id,
        date: t.date,
        description: t.description,
        reference: t.reference || '',
        type: isDebit ? 'debit' : 'credit',
        amount: isDebit ? debit : credit,
        balance: Number(t.balance || 0),
        status: t.is_reconciled ? 'allocated' : 'unallocated',
        allocations: [],
        importedAt: t.created_at,
      } as BankTransaction;
    });
  } catch (error) {
    console.error('Failed to load bank transactions:', error);
    return [];
  }
};

export const saveBankTransaction = async (transaction: BankTransaction): Promise<void> => {
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
      .from('bank_transactions')
      .upsert({
        id: transaction.id,
        user_id: userId,
        company_id: memberData.company_id,
        date: transaction.date,
        description: transaction.description,
        reference: transaction.reference || null,
        debit: transaction.type === 'debit' ? transaction.amount : 0,
        credit: transaction.type === 'credit' ? transaction.amount : 0,
        balance: transaction.balance,
        category: null,
        account_id: null,
        is_reconciled: transaction.status === 'allocated' || transaction.status === 'partially-allocated',
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to save bank transaction:', error);
    throw error;
  }
};

export const saveBankTransactions = async (transactions: BankTransaction[]): Promise<void> => {
  for (const transaction of transactions) {
    await saveBankTransaction(transaction);
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
