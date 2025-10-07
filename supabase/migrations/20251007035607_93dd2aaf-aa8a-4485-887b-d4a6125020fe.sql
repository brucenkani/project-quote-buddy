-- Ensure explicit INSERT policy exists for employees to avoid RLS violations on create
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create explicit INSERT policy for owners and accountants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'employees'
      AND policyname = 'Owners and accountants can create employees (explicit)'
  ) THEN
    CREATE POLICY "Owners and accountants can create employees (explicit)"
    ON public.employees
    FOR INSERT
    TO authenticated
    WITH CHECK (
      public.has_role(auth.uid(), 'owner'::app_role)
      OR public.has_role(auth.uid(), 'accountant'::app_role)
    );
  END IF;
END$$;