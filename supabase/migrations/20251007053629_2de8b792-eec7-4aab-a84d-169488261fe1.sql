-- Create permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role text NOT NULL,
  permission text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(role, permission)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Insert default permissions
INSERT INTO public.role_permissions (role, permission, enabled) VALUES
  ('admin', 'manage_users', true),
  ('admin', 'manage_roles', true),
  ('admin', 'manage_permissions', true),
  ('admin', 'view_all_data', true),
  ('admin', 'manage_settings', true),
  ('admin', 'manage_accounting', true),
  ('admin', 'manage_payroll', true),
  ('admin', 'manage_employees', true),
  ('admin', 'manage_inventory', true),
  ('admin', 'view_reports', true),
  ('accountant', 'manage_users', false),
  ('accountant', 'manage_roles', false),
  ('accountant', 'manage_permissions', false),
  ('accountant', 'view_all_data', true),
  ('accountant', 'manage_settings', false),
  ('accountant', 'manage_accounting', true),
  ('accountant', 'manage_payroll', true),
  ('accountant', 'manage_employees', false),
  ('accountant', 'manage_inventory', true),
  ('accountant', 'view_reports', true),
  ('employee', 'manage_users', false),
  ('employee', 'manage_roles', false),
  ('employee', 'manage_permissions', false),
  ('employee', 'view_all_data', false),
  ('employee', 'manage_settings', false),
  ('employee', 'manage_accounting', false),
  ('employee', 'manage_payroll', false),
  ('employee', 'manage_employees', false),
  ('employee', 'manage_inventory', false),
  ('employee', 'view_reports', false)
ON CONFLICT (role, permission) DO NOTHING;

-- RLS policies - allow all authenticated users to view
CREATE POLICY "Authenticated users can view role permissions"
ON public.role_permissions FOR SELECT
TO authenticated
USING (true);

-- Allow admins based on user_roles table
CREATE POLICY "Admins can update role permissions"
ON public.role_permissions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text = 'admin'
  )
);

CREATE POLICY "Admins can insert role permissions"
ON public.role_permissions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text = 'admin'
  )
);

CREATE POLICY "Admins can delete role permissions"
ON public.role_permissions FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text = 'admin'
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_role_permissions_updated_at
BEFORE UPDATE ON public.role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();