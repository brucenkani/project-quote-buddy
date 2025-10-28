
-- Clean up duplicate journal entries
-- Keep only the most recent journal entry for each unique reference
DELETE FROM journal_entry_lines
WHERE journal_entry_id IN (
  SELECT je.id
  FROM journal_entries je
  WHERE je.id NOT IN (
    SELECT DISTINCT ON (reference, company_id) id
    FROM journal_entries
    WHERE company_id IS NOT NULL
    ORDER BY reference, company_id, created_at DESC
  )
);

DELETE FROM journal_entries
WHERE id NOT IN (
  SELECT DISTINCT ON (reference, company_id) id
  FROM journal_entries
  WHERE company_id IS NOT NULL
  ORDER BY reference, company_id, created_at DESC
);
