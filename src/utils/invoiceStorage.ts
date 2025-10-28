import { Invoice } from '@/types/invoice';
import { supabase } from '@/integrations/supabase/client';
import { calculateInvoiceStatus } from './invoiceStatusCalculator';
import { recordInvoice } from './doubleEntryManager';

export const loadInvoices = async (): Promise<Invoice[]> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) {
      console.error('No authenticated user');
      return [];
    }

    const userId = session.session.user.id;

    // Get active company
    const { data: memberData } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!memberData?.company_id) {
      console.error('No active company found');
      return [];
    }

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_line_items (*)
      `)
      .eq('company_id', memberData.company_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform and recalculate status
    return (invoices || []).map(invoice => {
      const transformed: Invoice = {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        lineItems: (invoice.invoice_line_items || []).map((item: any) => ({
          id: item.id,
          description: item.description,
          quantity: Number(item.quantity),
          unit: 'unit',
          unitPrice: Number(item.unit_price),
          taxRate: Number(item.tax_rate),
          amount: Number(item.amount),
          total: Number(item.amount),
        })),
        subtotal: Number(invoice.subtotal),
        taxRate: Number((invoice.invoice_line_items?.[0]?.tax_rate) ?? 0.15),
        taxAmount: Number(invoice.tax_amount),
        discount: 0,
        total: Number(invoice.total_amount),
        status: invoice.status as any,
        paymentTerms: invoice.terms || '',
        notes: invoice.notes || '',
        type: 'invoice',
        payments: [],
        creditNotes: [],
        projectDetails: {
          clientName: invoice.customer_id || '',
          clientEmail: '',
          clientPhone: '',
        },
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
      };

      return {
        ...transformed,
        status: calculateInvoiceStatus(transformed, []),
      };
    });
  } catch (error) {
    console.error('Failed to load invoices:', error);
    return [];
  }
};

export const saveInvoice = async (invoice: Invoice): Promise<void> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) {
      throw new Error('No authenticated user');
    }

    const userId = session.session.user.id;

    const { data: memberData } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!memberData?.company_id) {
      throw new Error('No active company found');
    }

    const { error: invoiceError } = await supabase
      .from('invoices')
      .upsert({
        id: invoice.id,
        user_id: userId,
        company_id: memberData.company_id,
        invoice_number: invoice.invoiceNumber,
        customer_id: invoice.projectDetails.clientName,
        issue_date: invoice.issueDate,
        due_date: invoice.dueDate,
        subtotal: invoice.subtotal,
        tax_amount: invoice.taxAmount,
        total_amount: invoice.total,
        status: invoice.status,
        notes: invoice.notes || null,
        terms: invoice.paymentTerms || null,
        updated_at: new Date().toISOString(),
      });

    if (invoiceError) throw invoiceError;

    // Delete existing line items
    await supabase
      .from('invoice_line_items')
      .delete()
      .eq('invoice_id', invoice.id);

    // Insert new line items
    if (invoice.lineItems.length > 0) {
      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(
          invoice.lineItems.map(item => ({
            id: item.id,
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            tax_rate: item.taxRate,
            amount: item.amount,
          }))
        );

      if (lineItemsError) throw lineItemsError;
    }


    // Create journal entry for the invoice only if it's a new invoice
    // Check if journal entry already exists to prevent duplicates
    try {
      const { data: existingJournalEntry } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('reference', invoice.invoiceNumber)
        .eq('company_id', memberData.company_id)
        .maybeSingle();
      
      // Only create journal entry if it doesn't exist and invoice is not a credit note
      if (!existingJournalEntry && invoice.type !== 'credit-note') {
        recordInvoice(invoice);
      }
    } catch (journalError) {
      console.error('Failed to create journal entry for invoice:', journalError);
      // Don't throw - invoice is saved, journal entry is supplementary
    }
  } catch (error) {
    console.error('Failed to save invoice:', error);
    throw error;
  }
};

export const deleteInvoice = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete invoice:', error);
    throw error;
  }
};

export const generateNextInvoiceNumber = async (): Promise<string> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) {
      return 'INV-00001';
    }

    const userId = session.session.user.id;

    const { data: memberData } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!memberData?.company_id) {
      return 'INV-00001';
    }

    const { data: invoices } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('company_id', memberData.company_id)
      .order('created_at', { ascending: false });

    if (!invoices || invoices.length === 0) {
      return 'INV-00001';
    }

    const lastNumber = Math.max(
      ...invoices.map(inv => {
        const match = inv.invoice_number.match(/\d+$/);
        return match ? parseInt(match[0]) : 0;
      })
    );

    return `INV-${String(lastNumber + 1).padStart(5, '0')}`;
  } catch (error) {
    console.error('Failed to generate invoice number:', error);
    return 'INV-00001';
  }
};
