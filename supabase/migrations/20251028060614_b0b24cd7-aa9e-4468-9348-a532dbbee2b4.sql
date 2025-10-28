-- Ensure RLS is enabled and company-scoped policies exist for journal tables
-- 1) journal_entries
ALTER TABLE IF EXISTS public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Delete existing overly permissive policies if any (safe no-ops if not present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='journal_entries' AND policyname='Company members can view journal entries'
  ) THEN
    DROP POLICY "Company members can view journal entries" ON public.journal_entries;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='journal_entries' AND policyname='Company members can insert journal entries'
  ) THEN
    DROP POLICY "Company members can insert journal entries" ON public.journal_entries;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='journal_entries' AND policyname='Company members can update journal entries'
  ) THEN
    DROP POLICY "Company members can update journal entries" ON public.journal_entries;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='journal_entries' AND policyname='Company members can delete journal entries'
  ) THEN
    DROP POLICY "Company members can delete journal entries" ON public.journal_entries;
  END IF;
END$$;

-- Create company-scoped policies
CREATE POLICY "Company members can view journal entries"
ON public.journal_entries
FOR SELECT
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can insert journal entries"
ON public.journal_entries
FOR INSERT
WITH CHECK (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can update journal entries"
ON public.journal_entries
FOR UPDATE
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can delete journal entries"
ON public.journal_entries
FOR DELETE
USING (is_company_member(auth.uid(), company_id));

-- 2) journal_entry_lines
ALTER TABLE IF EXISTS public.journal_entry_lines ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='journal_entry_lines' AND policyname='Company members can view journal entry lines'
  ) THEN
    DROP POLICY "Company members can view journal entry lines" ON public.journal_entry_lines;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='journal_entry_lines' AND policyname='Company members can insert journal entry lines'
  ) THEN
    DROP POLICY "Company members can insert journal entry lines" ON public.journal_entry_lines;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='journal_entry_lines' AND policyname='Company members can update journal entry lines'
  ) THEN
    DROP POLICY "Company members can update journal entry lines" ON public.journal_entry_lines;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='journal_entry_lines' AND policyname='Company members can delete journal entry lines'
  ) THEN
    DROP POLICY "Company members can delete journal entry lines" ON public.journal_entry_lines;
  END IF;
END$$;

CREATE POLICY "Company members can view journal entry lines"
ON public.journal_entry_lines
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.journal_entries je
  WHERE je.id = journal_entry_lines.journal_entry_id
  AND is_company_member(auth.uid(), je.company_id)
));

CREATE POLICY "Company members can insert journal entry lines"
ON public.journal_entry_lines
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.journal_entries je
  WHERE je.id = journal_entry_lines.journal_entry_id
  AND is_company_member(auth.uid(), je.company_id)
));

CREATE POLICY "Company members can update journal entry lines"
ON public.journal_entry_lines
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.journal_entries je
  WHERE je.id = journal_entry_lines.journal_entry_id
  AND is_company_member(auth.uid(), je.company_id)
));

CREATE POLICY "Company members can delete journal entry lines"
ON public.journal_entry_lines
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.journal_entries je
  WHERE je.id = journal_entry_lines.journal_entry_id
  AND is_company_member(auth.uid(), je.company_id)
));