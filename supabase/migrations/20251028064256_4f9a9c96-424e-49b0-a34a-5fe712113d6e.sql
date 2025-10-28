-- Add is_manual flag to journal_entries to distinguish manual vs automatic entries
ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT true;

-- Mark existing automatic entries (those with INV-, PAY-, EXP-, PUR- references) as non-manual
UPDATE public.journal_entries
SET is_manual = false
WHERE reference ~ '^(INV-|PAY-|EXP-|PUR-)';

-- Create index for better filtering performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_is_manual 
ON public.journal_entries(is_manual) WHERE is_manual = true;