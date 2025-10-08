-- Strengthen employee data security with granular RLS policies

-- Drop existing broad policies
DROP POLICY IF EXISTS "Owners and accountants can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Owners and accountants can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Owners and accountants can create employees (explicit)" ON public.employees;
DROP POLICY IF EXISTS "Employees can view their own record" ON public.employees;

-- Create granular policies with clear separation of concerns

-- SELECT Policies - Separate policies for clarity and security
CREATE POLICY "Owners can view all employees"
  ON public.employees
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Accountants can view all employees"
  ON public.employees
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Employees can view own record only"
  ON public.employees
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- INSERT Policy - Only owners and accountants can create employees
CREATE POLICY "Owners and accountants can create employees"
  ON public.employees
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'owner'::app_role) 
    OR has_role(auth.uid(), 'accountant'::app_role)
  );

-- UPDATE Policy - Strict authorization check
CREATE POLICY "Owners and accountants can update employees"
  ON public.employees
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'owner'::app_role) 
    OR has_role(auth.uid(), 'accountant'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'owner'::app_role) 
    OR has_role(auth.uid(), 'accountant'::app_role)
  );

-- DELETE Policy - Only authorized users can delete
CREATE POLICY "Owners and accountants can delete employees"
  ON public.employees
  FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'owner'::app_role) 
    OR has_role(auth.uid(), 'accountant'::app_role)
  );

-- Performance indexes for RLS policy checks
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);

-- Add table comment documenting security
COMMENT ON TABLE public.employees IS 'SENSITIVE DATA: Contains PII including ID numbers, addresses, bank details, tax numbers. RLS enforced - only authenticated owners/accountants can manage, employees can view own record only.';

-- Ensure RLS is strictly enforced (FORCE prevents superuser bypass in application context)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees FORCE ROW LEVEL SECURITY;