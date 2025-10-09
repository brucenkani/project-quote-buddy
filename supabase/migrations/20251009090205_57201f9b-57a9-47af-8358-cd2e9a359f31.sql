-- Fix the search_path for the get_employee_safe_profile function
CREATE OR REPLACE FUNCTION public.get_employee_safe_profile(employee_user_id uuid)
RETURNS SETOF public.employee_safe_view
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT * FROM public.employee_safe_view
  WHERE user_id = employee_user_id
  AND user_id = auth.uid(); -- Ensure users can only get their own data
$$;