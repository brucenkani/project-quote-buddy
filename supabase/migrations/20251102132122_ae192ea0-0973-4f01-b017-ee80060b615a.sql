-- First, we need to handle CASCADE deletes for companies
-- This will ensure that when a company is deleted, all related data is also deleted

-- Drop existing foreign key constraints and recreate them with CASCADE
-- For company_members
ALTER TABLE IF EXISTS public.company_members
  DROP CONSTRAINT IF EXISTS company_members_company_id_fkey;

ALTER TABLE public.company_members
  ADD CONSTRAINT company_members_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES public.companies(id)
  ON DELETE CASCADE;

-- For company_settings  
ALTER TABLE IF EXISTS public.company_settings
  DROP CONSTRAINT IF EXISTS company_settings_company_id_fkey;

ALTER TABLE public.company_settings
  ADD CONSTRAINT company_settings_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES public.companies(id)
  ON DELETE CASCADE;

-- For subscriptions
ALTER TABLE IF EXISTS public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_company_id_fkey;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES public.companies(id)
  ON DELETE CASCADE;

-- For employees
ALTER TABLE IF EXISTS public.employees
  DROP CONSTRAINT IF EXISTS employees_company_id_fkey;

ALTER TABLE public.employees
  ADD CONSTRAINT employees_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES public.companies(id)
  ON DELETE CASCADE;

-- For all other tables with company_id
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT 
            tc.table_name,
            tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'company_id'
            AND tc.table_schema = 'public'
            AND tc.table_name NOT IN ('company_members', 'company_settings', 'subscriptions', 'employees')
    LOOP
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', r.table_name, r.constraint_name);
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE', 
                      r.table_name, r.constraint_name);
    END LOOP;
END$$;