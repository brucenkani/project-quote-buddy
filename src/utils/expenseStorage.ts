import { supabase } from '@/integrations/supabase/client';
import { logAudit } from './auditLogger';

export const deleteExpense = async (id: string): Promise<void> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) throw new Error('No authenticated user');

    const { data: memberData } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', session.session.user.id)
      .single();

    if (!memberData?.company_id) throw new Error('No active company');

    // Get expense details before deletion
    const { data: expense } = await supabase
      .from('expenses')
      .select('expense_number')
      .eq('id', id)
      .single();

    if (expense) {
      // Delete related journal entries
      await supabase
        .from('journal_entries')
        .delete()
        .eq('reference', expense.expense_number)
        .eq('company_id', memberData.company_id);
    }

    // Delete expense payments
    await supabase
      .from('expense_payments')
      .delete()
      .eq('expense_id', id);

    // Delete expense line items
    await supabase
      .from('expense_line_items')
      .delete()
      .eq('expense_id', id);

    // Delete the expense itself
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log audit trail
    if (expense) {
      await logAudit({
        action: 'delete',
        entityType: 'expense',
        entityId: id,
        details: {
          expense_number: expense.expense_number,
          deleted_at: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('Failed to delete expense:', error);
    throw error;
  }
};
