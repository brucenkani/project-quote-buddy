-- Update the handle_new_user function to also assign owner role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign owner role to new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner');
  
  RETURN NEW;
END;
$$;

-- Create custom_payroll_items table for additional income/deductions
CREATE TABLE public.custom_payroll_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_id uuid NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('income', 'deduction')),
  description text NOT NULL,
  amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on custom_payroll_items
ALTER TABLE public.custom_payroll_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for custom_payroll_items
CREATE POLICY "Owners and accountants can manage custom payroll items"
ON public.custom_payroll_items
FOR ALL
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Owners and accountants can view custom payroll items"
ON public.custom_payroll_items
FOR SELECT
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_custom_payroll_items_updated_at
BEFORE UPDATE ON public.custom_payroll_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();