import { supabase } from '@/integrations/supabase/client';
import { logAudit } from './auditLogger';
import { Expense } from '@/types/accounting';
import { calculateExpenseStatus } from './expenseStatusCalculator';

export const loadExpensesFromDB = async (): Promise<Expense[]> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) return [];

    const { data: memberData } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', session.session.user.id)
      .single();

    if (!memberData?.company_id) return [];

    // Load expenses with payments
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select(`
        *,
        expense_payments (*)
      `)
      .eq('company_id', memberData.company_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (expenses || []).map((expense: any) => {
      const totalAmount = parseFloat(expense.total);
      const payments = (expense.expense_payments || []).map((p: any) => ({
        id: p.id,
        amount: parseFloat(p.amount),
        date: p.date,
        method: p.method,
        reference: p.reference || '',
      }));

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      let status: Expense['status'] = 'pending';
      
      if (totalPaid >= totalAmount) {
        status = 'paid';
      } else if (totalPaid > 0) {
        status = 'partly-paid';
      } else if (expense.due_date && new Date(expense.due_date) < new Date()) {
        status = 'overdue';
      }

      return {
        id: expense.id,
        date: expense.date,
        vendor: expense.supplier_id, // Using supplier_id as vendor
        category: 'Expense',
        description: expense.notes || '',
        amount: totalAmount,
        paymentMethod: payments.length > 0 ? payments[0].method : 'unpaid',
        reference: expense.expense_number,
        status,
        dueDate: expense.due_date,
        payments,
        vatRate: parseFloat(expense.tax_rate) / 100,
        vatAmount: parseFloat(expense.tax_amount),
        createdAt: expense.created_at,
        updatedAt: expense.updated_at,
      };
    });
  } catch (error) {
    console.error('Failed to load expenses from DB:', error);
    return [];
  }
};

export const saveExpenseToDB = async (expense: Expense): Promise<void> => {
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

    const companyId = memberData.company_id;

    const taxRate = expense.vatRate ? expense.vatRate * 100 : 0;
    const taxAmount = expense.vatAmount || 0;
    const subtotal = expense.amount - taxAmount;

    // Upsert expense
    const { error: expenseError } = await supabase
      .from('expenses')
      .upsert({
        id: expense.id,
        user_id: userId,
        company_id: companyId,
        expense_number: expense.reference || `EXP-${Date.now()}`,
        supplier_id: expense.vendor,
        date: expense.date,
        due_date: expense.dueDate || expense.date,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        discount: 0,
        total: expense.amount,
        status: expense.status,
        payment_terms: expense.paymentMethod,
        notes: expense.description,
        updated_at: new Date().toISOString(),
      });

    if (expenseError) throw expenseError;

    // Handle payments if any
    if (expense.payments && expense.payments.length > 0) {
      for (const payment of expense.payments) {
        const { error: paymentError } = await supabase
          .from('expense_payments')
          .upsert({
            id: payment.id || crypto.randomUUID(),
            user_id: userId,
            company_id: companyId,
            expense_id: expense.id,
            amount: payment.amount,
            date: payment.date,
            method: payment.method,
            reference: payment.reference || '',
          });

        if (paymentError) throw paymentError;
      }
    }

    // Log audit trail
    await logAudit({
      action: 'update',
      entityType: 'expense',
      entityId: expense.id,
      details: {
        expense_number: expense.reference,
        supplier_id: expense.vendor,
        total: expense.amount,
      },
    });
  } catch (error) {
    console.error('Failed to save expense to DB:', error);
    throw error;
  }
};

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

// Legacy function for backward compatibility - redirects to DB
export const loadExpenses = loadExpensesFromDB;
export const saveExpense = saveExpenseToDB;
