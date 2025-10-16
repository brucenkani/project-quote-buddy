-- Drop the triggers and function together to avoid dependency issues
DROP TRIGGER IF EXISTS ensure_user_has_company_trigger ON auth.users;
DROP TRIGGER IF EXISTS ensure_company_on_login ON auth.users;
DROP FUNCTION IF EXISTS public.ensure_user_has_company() CASCADE;

-- Add DELETE policy for companies (owners can delete their companies)
DROP POLICY IF EXISTS "Company owners can delete" ON public.companies;

CREATE POLICY "Company owners can delete"
ON public.companies
FOR DELETE
TO authenticated
USING (get_company_role(auth.uid(), id) = 'owner'::app_role);

-- Clean up duplicate companies for existing users
-- Keep only the most recent company for each user
DELETE FROM public.companies c1
WHERE EXISTS (
  SELECT 1 FROM public.companies c2
  WHERE c1.created_by = c2.created_by
  AND c1.created_at < c2.created_at
);