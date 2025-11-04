import { supabase } from '@/integrations/supabase/client';
import { RecurringJournal, RecurringJournalLine } from '@/types/recurringJournal';

export const loadRecurringJournals = async (): Promise<RecurringJournal[]> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) return [];

    const userId = session.session.user.id;

    const { data: memberData } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId)
      .single();

    if (!memberData?.company_id) return [];

    const { data: recurring, error } = await supabase
      .from('recurring_journals')
      .select('*')
      .eq('company_id', memberData.company_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Load lines for each recurring journal
    const journalsWithLines = await Promise.all(
      (recurring || []).map(async (r) => {
        const { data: lines } = await supabase
          .from('recurring_journal_lines')
          .select('*')
          .eq('recurring_journal_id', r.id);

        return {
          id: r.id,
          description: r.description,
          frequency: r.frequency as 'weekly' | 'monthly' | 'quarterly' | 'yearly',
          startDate: r.start_date,
          endDate: r.end_date || undefined,
          nextGenerationDate: r.next_generation_date,
          status: r.status as 'active' | 'paused',
          reference: r.reference || undefined,
          lines: (lines || []).map(line => ({
            id: line.id,
            account_id: line.account_id,
            account_name: line.account_name,
            debit: typeof line.debit === 'number' ? line.debit : parseFloat(String(line.debit)),
            credit: typeof line.credit === 'number' ? line.credit : parseFloat(String(line.credit)),
          })),
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
      })
    );

    return journalsWithLines;
  } catch (error) {
    console.error('Failed to load recurring journals:', error);
    return [];
  }
};

export const saveRecurringJournal = async (journal: RecurringJournal): Promise<void> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) throw new Error('No authenticated user');

    const userId = session.session.user.id;

    const { data: memberData } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId)
      .single();

    if (!memberData?.company_id) throw new Error('No active company');

    // Save recurring journal
    const { data: savedJournal, error: journalError } = await supabase
      .from('recurring_journals')
      .upsert({
        id: journal.id,
        user_id: userId,
        company_id: memberData.company_id,
        description: journal.description,
        frequency: journal.frequency,
        start_date: journal.startDate,
        end_date: journal.endDate || null,
        next_generation_date: journal.nextGenerationDate,
        status: journal.status,
        reference: journal.reference || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (journalError) throw journalError;

    // Delete existing lines
    await supabase
      .from('recurring_journal_lines')
      .delete()
      .eq('recurring_journal_id', journal.id);

    // Insert new lines
    if (journal.lines.length > 0) {
      const { error: linesError } = await supabase
        .from('recurring_journal_lines')
        .insert(
          journal.lines.map(line => ({
            recurring_journal_id: savedJournal.id,
            account_id: line.account_id,
            account_name: line.account_name,
            debit: line.debit,
            credit: line.credit,
          }))
        );

      if (linesError) throw linesError;
    }
  } catch (error) {
    console.error('Failed to save recurring journal:', error);
    throw error;
  }
};

export const deleteRecurringJournal = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('recurring_journals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete recurring journal:', error);
    throw error;
  }
};

export const calculateNextGenerationDate = (
  startDate: string,
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
): string => {
  const date = new Date(startDate);

  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date.toISOString().split('T')[0];
};