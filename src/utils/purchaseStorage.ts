import { Purchase } from '@/types/purchase';
import { supabase } from '@/integrations/supabase/client';
import { logAudit } from './auditLogger';

export const loadPurchases = async (): Promise<Purchase[]> => {
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

    const { data: purchases, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('company_id', memberData.company_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (purchases || []).map(p => ({
      id: p.id,
      purchaseNumber: p.purchase_number,
      vendor: p.supplier_id,
      date: p.issue_date,
      dueDate: p.due_date || undefined,
      lineItems: [],
      subtotal: Number(p.subtotal),
      taxRate: 15,
      taxAmount: Number(p.tax_amount),
      discount: 0,
      total: Number(p.total_amount),
      status: p.status as any,
      paymentMethod: 'credit' as const,
      notes: p.notes || undefined,
      inventoryMethod: 'perpetual' as const,
      supplierInvoiceNumber: p.supplier_invoice_number || undefined,
      receivedDate: p.received_date || undefined,
      invoiceDate: p.invoice_date || undefined,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
  } catch (error) {
    console.error('Failed to load purchases:', error);
    return [];
  }
};

export const savePurchase = async (purchase: Purchase): Promise<void> => {
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
      .from('purchases')
      .upsert({
        id: purchase.id,
        user_id: userId,
        company_id: memberData.company_id,
        purchase_number: purchase.purchaseNumber,
        supplier_id: purchase.vendor,
        issue_date: purchase.date,
        due_date: purchase.dueDate || null,
        subtotal: purchase.subtotal,
        tax_amount: purchase.taxAmount,
        total_amount: purchase.total,
        status: purchase.status,
        notes: purchase.notes || null,
        supplier_invoice_number: purchase.supplierInvoiceNumber || null,
        received_date: purchase.receivedDate || null,
        invoice_date: purchase.invoiceDate || null,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to save purchase:', error);
    throw error;
  }
};

export const deletePurchase = async (id: string): Promise<void> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) throw new Error('No authenticated user');

    const { data: memberData } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', session.session.user.id)
      .single();

    if (!memberData?.company_id) throw new Error('No active company');

    // Get purchase details before deletion
    const { data: purchase } = await supabase
      .from('purchases')
      .select('purchase_number')
      .eq('id', id)
      .single();

    if (purchase) {
      // Delete related journal entries
      await supabase
        .from('journal_entries')
        .delete()
        .eq('reference', purchase.purchase_number)
        .eq('company_id', memberData.company_id);

      // Delete related inventory movements
      await supabase
        .from('inventory_movements')
        .delete()
        .eq('reference_id', id)
        .eq('company_id', memberData.company_id);
    }

    // Delete purchase payments
    await supabase
      .from('purchase_payments')
      .delete()
      .eq('purchase_id', id);

    // Delete purchase line items
    await supabase
      .from('purchase_line_items')
      .delete()
      .eq('purchase_id', id);

    // Delete the purchase itself
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log audit trail
    if (purchase) {
      await logAudit({
        action: 'delete',
        entityType: 'purchase',
        entityId: id,
        details: {
          purchase_number: purchase.purchase_number,
          deleted_at: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('Failed to delete purchase:', error);
    throw error;
  }
};

export const generatePurchaseNumber = async (): Promise<string> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) return 'PO-00001';

    const userId = session.session.user.id;

    const { data: memberData } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId)
      .single();

    if (!memberData?.company_id) return 'PO-00001';

    const { data: purchases } = await supabase
      .from('purchases')
      .select('purchase_number')
      .eq('company_id', memberData.company_id)
      .order('created_at', { ascending: false });

    if (!purchases || purchases.length === 0) return 'PO-00001';

    const lastNumber = Math.max(
      ...purchases.map(p => {
        const match = p.purchase_number.match(/\d+$/);
        return match ? parseInt(match[0]) : 0;
      })
    );

    return `PO-${String(lastNumber + 1).padStart(5, '0')}`;
  } catch (error) {
    console.error('Failed to generate purchase number:', error);
    return 'PO-00001';
  }
};
