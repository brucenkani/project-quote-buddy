-- Fix RLS policies to ensure complete company-based data isolation
-- Drop old user_id based policies and create company_id based policies

-- Fix bank_transactions policies
DROP POLICY IF EXISTS "Users can view their own bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Users can insert their own bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Users can update their own bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Users can delete their own bank transactions" ON public.bank_transactions;

CREATE POLICY "Company members can view bank transactions"
ON public.bank_transactions FOR SELECT
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can insert bank transactions"
ON public.bank_transactions FOR INSERT
WITH CHECK (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can update bank transactions"
ON public.bank_transactions FOR UPDATE
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can delete bank transactions"
ON public.bank_transactions FOR DELETE
USING (is_company_member(auth.uid(), company_id));

-- Fix journal_entries policies
DROP POLICY IF EXISTS "Users can view their own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can insert their own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can update their own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can delete their own journal entries" ON public.journal_entries;

CREATE POLICY "Company members can view journal entries"
ON public.journal_entries FOR SELECT
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can insert journal entries"
ON public.journal_entries FOR INSERT
WITH CHECK (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can update journal entries"
ON public.journal_entries FOR UPDATE
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can delete journal entries"
ON public.journal_entries FOR DELETE
USING (is_company_member(auth.uid(), company_id));

-- Fix journal_entry_lines policies (use journal_entries company_id)
DROP POLICY IF EXISTS "Users can view journal entry lines" ON public.journal_entry_lines;
DROP POLICY IF EXISTS "Users can insert journal entry lines" ON public.journal_entry_lines;
DROP POLICY IF EXISTS "Users can update journal entry lines" ON public.journal_entry_lines;
DROP POLICY IF EXISTS "Users can delete journal entry lines" ON public.journal_entry_lines;

CREATE POLICY "Company members can view journal entry lines"
ON public.journal_entry_lines FOR SELECT
USING (EXISTS (
  SELECT 1 FROM journal_entries
  WHERE journal_entries.id = journal_entry_lines.journal_entry_id
  AND is_company_member(auth.uid(), journal_entries.company_id)
));

CREATE POLICY "Company members can insert journal entry lines"
ON public.journal_entry_lines FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM journal_entries
  WHERE journal_entries.id = journal_entry_lines.journal_entry_id
  AND is_company_member(auth.uid(), journal_entries.company_id)
));

CREATE POLICY "Company members can update journal entry lines"
ON public.journal_entry_lines FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM journal_entries
  WHERE journal_entries.id = journal_entry_lines.journal_entry_id
  AND is_company_member(auth.uid(), journal_entries.company_id)
));

CREATE POLICY "Company members can delete journal entry lines"
ON public.journal_entry_lines FOR DELETE
USING (EXISTS (
  SELECT 1 FROM journal_entries
  WHERE journal_entries.id = journal_entry_lines.journal_entry_id
  AND is_company_member(auth.uid(), journal_entries.company_id)
));

-- Fix expense_payments policies
DROP POLICY IF EXISTS "Users can view their own expense payments" ON public.expense_payments;
DROP POLICY IF EXISTS "Users can insert their own expense payments" ON public.expense_payments;

CREATE POLICY "Company members can view expense payments"
ON public.expense_payments FOR SELECT
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can insert expense payments"
ON public.expense_payments FOR INSERT
WITH CHECK (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can update expense payments"
ON public.expense_payments FOR UPDATE
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can delete expense payments"
ON public.expense_payments FOR DELETE
USING (is_company_member(auth.uid(), company_id));

-- Fix invoice_payments policies (they don't have company_id, need to check via invoices)
DROP POLICY IF EXISTS "Users can view their own invoice payments" ON public.invoice_payments;
DROP POLICY IF EXISTS "Users can insert their own invoice payments" ON public.invoice_payments;

-- Note: invoice_payments doesn't have company_id, we need to add it
ALTER TABLE public.invoice_payments ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

CREATE POLICY "Company members can view invoice payments"
ON public.invoice_payments FOR SELECT
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can insert invoice payments"
ON public.invoice_payments FOR INSERT
WITH CHECK (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can update invoice payments"
ON public.invoice_payments FOR UPDATE
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can delete invoice payments"
ON public.invoice_payments FOR DELETE
USING (is_company_member(auth.uid(), company_id));