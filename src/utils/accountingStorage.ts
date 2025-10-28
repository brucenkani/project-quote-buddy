import { JournalEntry, Expense } from '@/types/accounting';
import { calculateExpenseStatus } from './expenseStatusCalculator';
import { supabase } from '@/integrations/supabase/client';

const JOURNAL_KEY = 'quotebuilder-journal';
const EXPENSE_KEY = 'quotebuilder-expenses';

// Journal Entries - Sync version loads from localStorage
export const loadJournalEntries = (): JournalEntry[] => {
  try {
    const stored = localStorage.getItem(JOURNAL_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load journal entries:', error);
  }
  return [];
};

// Async version loads from Supabase
export const loadJournalEntriesFromDB = async (): Promise<JournalEntry[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get active company ID
    const activeCompanyId = localStorage.getItem('activeCompanyId');
    
    // Build query - filter by company_id if available
    let query = supabase
      .from('journal_entries')
      .select(`
        *,
        journal_entry_lines (*)
      `);
    
    if (activeCompanyId) {
      query = query.eq('company_id', activeCompanyId);
    }
    
    const { data: entries, error } = await query.order('date', { ascending: false });

    if (error) {
      console.error('Journal entries query error:', error);
      throw error;
    }

    return entries?.map(entry => ({
      id: entry.id,
      date: entry.date,
      reference: entry.reference || '',
      description: entry.description,
      entries: entry.journal_entry_lines.map((line: any) => ({
        id: line.id,
        account: line.account_name,
        accountType: line.account_id as any,
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
        description: line.account_name
      })),
      totalDebit: entry.journal_entry_lines.reduce((sum: number, line: any) => sum + (Number(line.debit) || 0), 0),
      totalCredit: entry.journal_entry_lines.reduce((sum: number, line: any) => sum + (Number(line.credit) || 0), 0),
      createdAt: entry.created_at || new Date().toISOString(),
      updatedAt: entry.created_at || new Date().toISOString()
    })) || [];
  } catch (error) {
    console.error('Failed to load journal entries from DB:', error);
    return [];
  }
};

export const saveJournalEntries = (entries: JournalEntry[]): void => {
  try {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Failed to save journal entries:', error);
  }
};

// Synchronous version saves to localStorage and queues DB save
export const saveJournalEntry = (entry: JournalEntry): void => {
  const entries = loadJournalEntries();
  const index = entries.findIndex(e => e.id === entry.id);
  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.push(entry);
  }
  saveJournalEntries(entries);
  
  // Also save to database asynchronously (fire and forget)
  saveJournalEntryToDB(entry).catch(error => {
    console.error('Failed to save journal entry to database:', error);
  });
};

// Async version saves to Supabase
export const saveJournalEntryToDB = async (entry: JournalEntry): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Prefer the active company from app state, fallback to the first membership
    const activeCompanyId = localStorage.getItem('activeCompanyId');

    let companyId = activeCompanyId || null;
    if (!companyId) {
      const { data: memberData } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .maybeSingle();
      companyId = memberData?.company_id || null;
    }

    if (!companyId) throw new Error('No active company found');

    // Upsert journal entry with conflict on (company_id, reference)
    const { data: journalData, error: journalError } = await supabase
      .from('journal_entries')
      .upsert({
        user_id: user.id,
        company_id: companyId,
        entry_number: entry.reference,
        date: entry.date,
        description: entry.description,
        reference: entry.reference
      }, { onConflict: 'company_id,reference' })
      .select()
      .single();

    if (journalError) throw journalError;

    // Delete existing lines first
    await supabase
      .from('journal_entry_lines')
      .delete()
      .eq('journal_entry_id', journalData.id);

    // Insert journal entry lines
    const lines = entry.entries.map(line => ({
      journal_entry_id: journalData.id,
      account_id: line.accountType,
      account_name: line.account,
      debit: line.debit,
      credit: line.credit
    }));

    const { error: linesError } = await supabase
      .from('journal_entry_lines')
      .insert(lines);

    if (linesError) throw linesError;
  } catch (error) {
    console.error('Failed to save journal entry to DB:', error);
    throw error;
  }
};

export const deleteJournalEntry = (id: string): void => {
  const entries = loadJournalEntries().filter(e => e.id !== id);
  saveJournalEntries(entries);
  
  // Also delete from database asynchronously
  deleteJournalEntryFromDB(id).catch(error => {
    console.error('Failed to delete from database:', error);
  });
};

export const deleteJournalEntryFromDB = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete journal entry from DB:', error);
    throw error;
  }
};

// Expenses
export const loadExpenses = (): Expense[] => {
  try {
    const stored = localStorage.getItem(EXPENSE_KEY);
    if (stored) {
      const expenses = JSON.parse(stored);
      // Recalculate status dynamically for each expense and ensure all fields exist
      return expenses.map((exp: Expense) => ({
        ...exp,
        payments: exp.payments || [],
        status: calculateExpenseStatus(exp),
      }));
    }
  } catch (error) {
    console.error('Failed to load expenses:', error);
  }
  return [];
};

export const saveExpenses = (expenses: Expense[]): void => {
  try {
    localStorage.setItem(EXPENSE_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.error('Failed to save expenses:', error);
  }
};

export const saveExpense = (expense: Expense): void => {
  const expenses = loadExpenses();
  const index = expenses.findIndex(e => e.id === expense.id);
  if (index >= 0) {
    expenses[index] = expense;
  } else {
    expenses.push(expense);
  }
  saveExpenses(expenses);
};

export const deleteExpense = (id: string): void => {
  const expenses = loadExpenses().filter(e => e.id !== id);
  saveExpenses(expenses);
};
