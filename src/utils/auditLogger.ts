import { supabase } from '@/integrations/supabase/client';

export type AuditAction = 'create' | 'update' | 'delete' | 'view' | 'export' | 'import' | 'approve' | 'reject' | 'login' | 'logout';

export type EntityType = 
  | 'invoice' 
  | 'purchase' 
  | 'expense' 
  | 'inventory' 
  | 'employee' 
  | 'payroll' 
  | 'contact' 
  | 'bank_account' 
  | 'chart_of_accounts'
  | 'purchase_order'
  | 'settings';

interface AuditLogParams {
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  details?: Record<string, any>;
}

export const logAudit = async ({
  action,
  entityType,
  entityId,
  details,
}: AuditLogParams): Promise<void> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) return;

    const userId = session.session.user.id;

    const { data: memberData } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId)
      .single();

    if (!memberData?.company_id) return;

    await supabase
      .from('audit_logs')
      .insert({
        company_id: memberData.company_id,
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        details: details || null,
        ip_address: null,
        user_agent: navigator.userAgent,
      });
  } catch (error) {
    console.error('Failed to log audit:', error);
    // Don't throw - audit logging should not break the main operation
  }
};
