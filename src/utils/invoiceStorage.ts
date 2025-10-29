import { Invoice } from '@/types/invoice';
import { supabase } from '@/integrations/supabase/client';
import { calculateInvoiceStatus } from './invoiceStatusCalculator';
import { recordInvoice, recordCreditNote } from './doubleEntryManager';
import { logAudit } from './auditLogger';

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

    // Load all payments for this company
    const { data: paymentsData } = await supabase
      .from('invoice_payments')
      .select('*')
      .eq('company_id', memberData.company_id);

    // Group payments by invoice_id
    const paymentsByInvoice = (paymentsData || []).reduce((acc, payment) => {
      if (!acc[payment.invoice_id]) {
        acc[payment.invoice_id] = [];
      }
      acc[payment.invoice_id].push({
        id: payment.id,
        amount: Number(payment.amount),
        date: payment.date,
        method: payment.method,
        reference: payment.reference || '',
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Transform invoices
    const allInvoices = (invoices || []).map(invoice => {
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
        type: invoice.invoice_number?.startsWith('CN-') ? 'credit-note' : 'invoice',
        payments: paymentsByInvoice[invoice.id] || [],
        creditNotes: [],
        projectDetails: {
          clientName: invoice.customer_id || '',
          clientEmail: '',
          clientPhone: '',
        },
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
      };

      return transformed;
    });

    // Build credit note links based on invoice numbers (CN-<original>)
    const creditNotesByOriginal: Record<string, string[]> = {};
    allInvoices
      .filter(inv => inv.invoiceNumber?.startsWith('CN-'))
      .forEach(cn => {
        const originalNumber = cn.invoiceNumber.replace(/^CN-/, '');
        creditNotesByOriginal[originalNumber] = [...(creditNotesByOriginal[originalNumber] || []), cn.id];
      });

    // Attach credit notes to original invoices and recalc statuses
    return allInvoices.map(inv => {
      const withLinks = inv.invoiceNumber?.startsWith('CN-')
        ? { ...inv, creditNotes: [] }
        : { ...inv, creditNotes: creditNotesByOriginal[inv.invoiceNumber] || [] };
      return {
        ...withLinks,
        status: calculateInvoiceStatus(withLinks, allInvoices),
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

    // Prefer active company in app state; fallback to membership
    const activeCompanyId = localStorage.getItem('activeCompanyId');

    const { data: memberData } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId)
      .maybeSingle();

    const companyId = activeCompanyId || memberData?.company_id;

    if (!companyId) {
      throw new Error('No active company found');
    }

    const { error: invoiceError } = await supabase
      .from('invoices')
      .upsert({
        id: invoice.id,
        user_id: userId,
        company_id: companyId,
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

    // Save invoice payments to database
    if (invoice.payments && invoice.payments.length > 0) {
      // Delete existing payments
      await supabase
        .from('invoice_payments')
        .delete()
        .eq('invoice_id', invoice.id);

      // Insert new payments
      const { error: paymentsError } = await supabase
        .from('invoice_payments')
        .insert(
          invoice.payments.map(payment => ({
            id: payment.id,
            invoice_id: invoice.id,
            user_id: userId,
            company_id: companyId,
            amount: payment.amount,
            date: payment.date,
            method: payment.method,
            reference: payment.reference || null,
          }))
        );

      if (paymentsError) throw paymentsError;
    }


    // Create journal entry for the invoice only if it's a new invoice
    // Check if journal entry already exists to prevent duplicates
    try {
      const { data: existingJournalEntry } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('reference', invoice.invoiceNumber)
        .eq('company_id', companyId)
        .maybeSingle();
      
      // Only create journal entry if it doesn't exist
      if (!existingJournalEntry) {
        if (invoice.type === 'credit-note') {
          recordCreditNote(invoice);
        } else {
          recordInvoice(invoice);
        }
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
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) throw new Error('No authenticated user');

    const { data: memberData } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', session.session.user.id)
      .single();

    if (!memberData?.company_id) throw new Error('No active company');

    // Get invoice details before deletion
    const { data: invoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('id', id)
      .single();

    if (invoice) {
      // Delete related journal entries
      await supabase
        .from('journal_entries')
        .delete()
        .eq('reference', invoice.invoice_number)
        .eq('company_id', memberData.company_id);
    }

    // Delete invoice payments
    await supabase
      .from('invoice_payments')
      .delete()
      .eq('invoice_id', id);

    // Delete invoice line items
    await supabase
      .from('invoice_line_items')
      .delete()
      .eq('invoice_id', id);

    // Delete the invoice itself
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log audit trail
    if (invoice) {
      await logAudit({
        action: 'delete',
        entityType: 'invoice',
        entityId: id,
        details: {
          invoice_number: invoice.invoice_number,
          deleted_at: new Date().toISOString(),
        },
      });
    }
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
