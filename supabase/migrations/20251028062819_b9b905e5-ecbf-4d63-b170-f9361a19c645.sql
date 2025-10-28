-- 1) Remove duplicate journal entries by company_id + reference (keep earliest)
WITH duplicates AS (
  SELECT id, company_id, reference,
         ROW_NUMBER() OVER (PARTITION BY company_id, reference ORDER BY created_at) AS rn
  FROM public.journal_entries
  WHERE reference IS NOT NULL
)
DELETE FROM public.journal_entry_lines l
USING duplicates d
WHERE l.journal_entry_id = d.id AND d.rn > 1;

WITH duplicates AS (
  SELECT id, company_id, reference,
         ROW_NUMBER() OVER (PARTITION BY company_id, reference ORDER BY created_at) AS rn
  FROM public.journal_entries
  WHERE reference IS NOT NULL
)
DELETE FROM public.journal_entries je
USING duplicates d
WHERE je.id = d.id AND d.rn > 1;

-- 2) Enforce uniqueness going forward
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'journal_entries_company_reference_unique'
  ) THEN
    ALTER TABLE public.journal_entries
      ADD CONSTRAINT journal_entries_company_reference_unique
      UNIQUE (company_id, reference);
  END IF;
END $$;