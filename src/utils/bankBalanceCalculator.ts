import { supabase } from '@/integrations/supabase/client';

/**
 * Recalculates the current balance of a bank account based on all transactions
 * Formula: current_balance = opening_balance + (sum of debits - sum of credits)
 */
export async function recalculateBankBalance(bankAccountId: string): Promise<number> {
  try {
    // Get the bank account's opening balance
    const { data: account, error: accountError } = await supabase
      .from('bank_accounts')
      .select('opening_balance')
      .eq('id', bankAccountId)
      .single();

    if (accountError) throw accountError;
    if (!account) throw new Error('Bank account not found');

    const openingBalance = Number(account.opening_balance || 0);

    // Sum all transactions for this account
    const { data: transactions, error: txError } = await supabase
      .from('bank_transactions')
      .select('debit, credit')
      .eq('account_id', bankAccountId);

    if (txError) throw txError;

    const totalDebits = (transactions || []).reduce((sum, tx) => sum + Number(tx.debit || 0), 0);
    const totalCredits = (transactions || []).reduce((sum, tx) => sum + Number(tx.credit || 0), 0);

    const currentBalance = openingBalance + totalDebits - totalCredits;

    // Update the current balance in the database
    const { error: updateError } = await supabase
      .from('bank_accounts')
      .update({ 
        current_balance: currentBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', bankAccountId);

    if (updateError) throw updateError;

    return currentBalance;
  } catch (error) {
    console.error('Failed to recalculate bank balance:', error);
    throw error;
  }
}

/**
 * Recalculates balances for all bank accounts in a company
 */
export async function recalculateAllBankBalances(companyId: string): Promise<void> {
  try {
    const { data: accounts, error } = await supabase
      .from('bank_accounts')
      .select('id')
      .eq('company_id', companyId);

    if (error) throw error;

    // Recalculate each account balance
    for (const account of accounts || []) {
      await recalculateBankBalance(account.id);
    }
  } catch (error) {
    console.error('Failed to recalculate all bank balances:', error);
    throw error;
  }
}
