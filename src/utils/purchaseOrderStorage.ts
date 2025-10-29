import { PurchaseOrder } from '@/types/purchaseOrder';
import { supabase } from '@/integrations/supabase/client';
import { logAudit } from './auditLogger';

export const loadPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
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

    const { data: orders, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('company_id', memberData.company_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Load line items for all orders
    const ordersWithLineItems = await Promise.all((orders || []).map(async (o) => {
      const { data: lineItems } = await supabase
        .from('purchase_order_line_items')
        .select('*')
        .eq('purchase_order_id', o.id);

      return {
        id: o.id,
        poNumber: o.po_number,
        vendor: o.supplier_id,
        vendorContact: undefined,
        date: o.issue_date,
        expectedDelivery: o.delivery_date || undefined,
        lineItems: (lineItems || []).map((li: any) => ({
          id: li.id,
          description: li.description,
          quantity: Number(li.quantity),
          unitCost: Number(li.unit_price),
          total: Number(li.amount),
        })),
        subtotal: Number(o.subtotal),
        taxRate: 15,
        taxAmount: Number(o.tax_amount),
        discount: 0,
        total: Number(o.total_amount),
        status: o.status as any,
        notes: o.notes || undefined,
        terms: undefined,
        deliveryAddress: undefined,
        projectId: undefined,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
        convertedToPurchaseId: o.invoice_number || undefined,
      };
    }));

    return ordersWithLineItems;
  } catch (error) {
    console.error('Failed to load purchase orders:', error);
    return [];
  }
};

export const savePurchaseOrder = async (order: PurchaseOrder): Promise<void> => {
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

    // Save purchase order
    const { error } = await supabase
      .from('purchase_orders')
      .upsert({
        id: order.id,
        user_id: userId,
        company_id: memberData.company_id,
        po_number: order.poNumber,
        supplier_id: order.vendor,
        issue_date: order.date,
        delivery_date: order.expectedDelivery || null,
        subtotal: order.subtotal,
        tax_amount: order.taxAmount,
        total_amount: order.total,
        status: order.status,
        notes: order.notes || null,
        invoice_number: order.convertedToPurchaseId || null,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    // Delete existing line items
    await supabase
      .from('purchase_order_line_items')
      .delete()
      .eq('purchase_order_id', order.id);

    // Insert new line items
    if (order.lineItems && order.lineItems.length > 0) {
      const { error: lineItemsError } = await supabase
        .from('purchase_order_line_items')
        .insert(
          order.lineItems.map(item => ({
            purchase_order_id: order.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unitCost,
            amount: item.total,
          }))
        );

      if (lineItemsError) throw lineItemsError;
    }
  } catch (error) {
    console.error('Failed to save purchase order:', error);
    throw error;
  }
};

export const deletePurchaseOrder = async (id: string): Promise<void> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) throw new Error('No authenticated user');

    const { data: memberData } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', session.session.user.id)
      .single();

    if (!memberData?.company_id) throw new Error('No active company');

    // Get purchase order details before deletion
    const { data: purchaseOrder } = await supabase
      .from('purchase_orders')
      .select('po_number')
      .eq('id', id)
      .single();

    if (purchaseOrder) {
      // Delete related journal entries (memo entries)
      await supabase
        .from('journal_entries')
        .delete()
        .eq('reference', purchaseOrder.po_number)
        .eq('company_id', memberData.company_id);
    }

    // Delete line items first
    await supabase
      .from('purchase_order_line_items')
      .delete()
      .eq('purchase_order_id', id);

    // Delete purchase order
    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log audit trail
    if (purchaseOrder) {
      await logAudit({
        action: 'delete',
        entityType: 'purchase_order',
        entityId: id,
        details: {
          po_number: purchaseOrder.po_number,
          deleted_at: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('Failed to delete purchase order:', error);
    throw error;
  }
};

export const generatePONumber = async (): Promise<string> => {
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

    const { data: orders } = await supabase
      .from('purchase_orders')
      .select('po_number')
      .eq('company_id', memberData.company_id)
      .order('created_at', { ascending: false });

    if (!orders || orders.length === 0) return 'PO-00001';

    const lastNumber = Math.max(
      ...orders.map(o => {
        const match = o.po_number.match(/\d+$/);
        return match ? parseInt(match[0]) : 0;
      })
    );

    return `PO-${String(lastNumber + 1).padStart(5, '0')}`;
  } catch (error) {
    console.error('Failed to generate PO number:', error);
    return 'PO-00001';
  }
};
