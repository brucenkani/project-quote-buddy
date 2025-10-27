import { RecurringInvoice, Invoice } from '@/types/invoice';
import { saveInvoice, generateNextInvoiceNumber } from './invoiceStorage';
import { supabase } from '@/integrations/supabase/client';

export const loadRecurringInvoices = async (): Promise<RecurringInvoice[]> => {
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
      .from('recurring_invoices')
      .select('*')
      .eq('company_id', memberData.company_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (recurring || []).map(r => ({
      id: r.id,
      invoiceTemplate: {} as Invoice,
      frequency: r.frequency as any,
      startDate: r.created_at,
      nextGenerationDate: r.next_invoice_date,
      isActive: r.status === 'active',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  } catch (error) {
    console.error('Failed to load recurring invoices:', error);
    return [];
  }
};

export const saveRecurringInvoice = async (invoice: RecurringInvoice): Promise<void> => {
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

    const { error } = await supabase
      .from('recurring_invoices')
      .upsert({
        id: invoice.id,
        user_id: userId,
        company_id: memberData.company_id,
        customer_id: invoice.invoiceTemplate.projectDetails.clientName,
        frequency: invoice.frequency,
        next_invoice_date: invoice.nextGenerationDate,
        subtotal: invoice.invoiceTemplate.subtotal,
        tax_amount: invoice.invoiceTemplate.taxAmount,
        total_amount: invoice.invoiceTemplate.total,
        status: invoice.isActive ? 'active' : 'paused',
        notes: invoice.invoiceTemplate.notes || null,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to save recurring invoice:', error);
    throw error;
  }
};

export const deleteRecurringInvoice = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('recurring_invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete recurring invoice:', error);
    throw error;
  }
};

export const calculateNextGenerationDate = (startDate: string, frequency: RecurringInvoice['frequency']): string => {
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

export const generateInvoicesFromRecurring = async (): Promise<number> => {
  const recurringInvoices = await loadRecurringInvoices();
  const today = new Date().toISOString().split('T')[0];
  let generatedCount = 0;

  for (const recurring of recurringInvoices) {
    if (!recurring.isActive) continue;
    
    if (recurring.nextGenerationDate <= today) {
      const newInvoice: Invoice = {
        ...recurring.invoiceTemplate,
        id: crypto.randomUUID(),
        invoiceNumber: await generateNextInvoiceNumber(),
        issueDate: today,
        type: 'invoice',
        payments: [],
        creditNotes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveInvoice(newInvoice);
      generatedCount++;

      const nextDate = calculateNextGenerationDate(recurring.nextGenerationDate, recurring.frequency);
      recurring.nextGenerationDate = nextDate;
      await saveRecurringInvoice(recurring);
    }
  }

  return generatedCount;
};
