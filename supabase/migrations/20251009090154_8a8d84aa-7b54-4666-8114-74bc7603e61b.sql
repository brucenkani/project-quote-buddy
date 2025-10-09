-- Create a secure view for employees that excludes sensitive financial data
CREATE OR REPLACE VIEW public.employee_safe_view AS
SELECT 
  id,
  employee_number,
  first_name,
  last_name,
  email,
  phone,
  position,
  department,
  status,
  start_date,
  end_date,
  annual_leave_days,
  sick_leave_days,
  family_responsibility_leave_days,
  maternity_leave_days,
  study_leave_days,
  user_id,
  created_at,
  updated_at
FROM public.employees;

-- Grant access to authenticated users
GRANT SELECT ON public.employee_safe_view TO authenticated;

-- Create RLS policies for the safe view
ALTER VIEW public.employee_safe_view SET (security_invoker = true);

-- Drop existing employee SELECT policies
DROP POLICY IF EXISTS "Employees can view own record only" ON public.employees;
DROP POLICY IF EXISTS "Owners can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Accountants can view all employees" ON public.employees;

-- Create new restrictive policy for employees - they can only see limited data via the view
CREATE POLICY "Employees can view limited own data"
ON public.employees
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND NOT EXISTS (
    -- Prevent direct SELECT on employees table for regular employees
    -- They should use the safe view instead
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'accountant')
  )
  AND false -- Force employees to use employee_safe_view instead
);

-- Owners can view ALL fields in employees table
CREATE POLICY "Owners can view all employee data"
ON public.employees
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Accountants can view ALL fields in employees table
CREATE POLICY "Accountants can view all employee data"
ON public.employees
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'accountant'
  )
);

-- Create a security definer function for employees to access their safe data
CREATE OR REPLACE FUNCTION public.get_employee_safe_profile(employee_user_id uuid)
RETURNS SETOF public.employee_safe_view
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.employee_safe_view
  WHERE user_id = employee_user_id
  AND user_id = auth.uid(); -- Ensure users can only get their own data
$$;

COMMENT ON VIEW public.employee_safe_view IS 'Safe view of employee data excluding sensitive financial information (salary, bank details, ID numbers, tax numbers)';
COMMENT ON FUNCTION public.get_employee_safe_profile IS 'Allows employees to securely view their own non-sensitive profile data';