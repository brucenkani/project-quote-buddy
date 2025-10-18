-- Fix employees table RLS policy to include company_id in INSERT
-- The issue is that company_id is nullable but required by RLS policies

-- First, make company_id NOT NULL since it's required for RLS
ALTER TABLE public.employees ALTER COLUMN company_id SET NOT NULL;

-- Update the RLS policy for managing employees to be more explicit
DROP POLICY IF EXISTS "Company owners and accountants can manage employees" ON public.employees;

CREATE POLICY "Company owners and accountants can manage employees"
ON public.employees
FOR ALL
USING (
  is_company_member(auth.uid(), company_id) 
  AND (get_company_role(auth.uid(), company_id) = ANY (ARRAY['owner'::app_role, 'accountant'::app_role]))
)
WITH CHECK (
  is_company_member(auth.uid(), company_id) 
  AND (get_company_role(auth.uid(), company_id) = ANY (ARRAY['owner'::app_role, 'accountant'::app_role]))
);