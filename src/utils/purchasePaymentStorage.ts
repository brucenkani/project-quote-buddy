import { PurchasePayment } from '@/types/purchasePayment';
import { supabase } from '@/integrations/supabase/client';

export const loadPurchasePayments = async (): Promise<PurchasePayment[]> => {
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

    const { data: payments, error } = await supabase
      .from('purchase_payments')
      .select('*')
      .eq('company_id', memberData.company_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (payments || []).map(p => ({
      id: p.id,
      purchaseId: p.purchase_id,
      amount: Number(p.amount),
      date: p.date,
      method: p.method as any,
      reference: p.reference || undefined,
      notes: p.notes || undefined,
      createdAt: p.created_at,
    }));
  } catch (error) {
    console.error('Failed to load purchase payments:', error);
    return [];
  }
};

export const savePurchasePayment = async (payment: PurchasePayment): Promise<void> => {
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
      .from('purchase_payments')
      .insert({
        id: payment.id,
        user_id: userId,
        company_id: memberData.company_id,
        purchase_id: payment.purchaseId,
        amount: payment.amount,
        date: payment.date,
        method: payment.method,
        reference: payment.reference || '',
        notes: payment.notes || null,
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to save purchase payment:', error);
    throw error;
  }
};

export const getPurchasePayments = async (purchaseId: string): Promise<PurchasePayment[]> => {
  const payments = await loadPurchasePayments();
  return payments.filter(p => p.purchaseId === purchaseId);
};

export const getTotalPaid = async (purchaseId: string): Promise<number> => {
  const payments = await getPurchasePayments(purchaseId);
  return payments.reduce((sum, p) => sum + p.amount, 0);
};
