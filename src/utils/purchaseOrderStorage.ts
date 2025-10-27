import { PurchaseOrder } from '@/types/purchaseOrder';
import { supabase } from '@/integrations/supabase/client';

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

    return (orders || []).map(o => ({
      id: o.id,
      poNumber: o.po_number,
      vendor: o.supplier_id,
      date: o.issue_date,
      expectedDelivery: o.delivery_date || undefined,
      lineItems: [],
      subtotal: Number(o.subtotal),
      taxRate: 15,
      taxAmount: Number(o.tax_amount),
      discount: 0,
      total: Number(o.total_amount),
      status: o.status as any,
      notes: o.notes || undefined,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    }));
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
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to save purchase order:', error);
    throw error;
  }
};

export const deletePurchaseOrder = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
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
