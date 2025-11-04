-- Create recurring journals table
CREATE TABLE IF NOT EXISTS public.recurring_journals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  description TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  next_generation_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create recurring journal lines table
CREATE TABLE IF NOT EXISTS public.recurring_journal_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recurring_journal_id UUID NOT NULL REFERENCES public.recurring_journals(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  debit NUMERIC NOT NULL DEFAULT 0,
  credit NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create recurring invoice line items table (if doesn't exist)
CREATE TABLE IF NOT EXISTS public.recurring_invoice_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recurring_invoice_id UUID NOT NULL REFERENCES public.recurring_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  tax_rate NUMERIC NOT NULL DEFAULT 0.15,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on recurring journals
ALTER TABLE public.recurring_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_invoice_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recurring journals
CREATE POLICY "Company members can view recurring journals"
  ON public.recurring_journals
  FOR SELECT
  USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can insert recurring journals"
  ON public.recurring_journals
  FOR INSERT
  WITH CHECK (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can update recurring journals"
  ON public.recurring_journals
  FOR UPDATE
  USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can delete recurring journals"
  ON public.recurring_journals
  FOR DELETE
  USING (is_company_member(auth.uid(), company_id));

-- RLS Policies for recurring journal lines
CREATE POLICY "Company members can view recurring journal lines"
  ON public.recurring_journal_lines
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recurring_journals rj
      WHERE rj.id = recurring_journal_lines.recurring_journal_id
        AND is_company_member(auth.uid(), rj.company_id)
    )
  );

CREATE POLICY "Company members can insert recurring journal lines"
  ON public.recurring_journal_lines
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recurring_journals rj
      WHERE rj.id = recurring_journal_lines.recurring_journal_id
        AND is_company_member(auth.uid(), rj.company_id)
    )
  );

CREATE POLICY "Company members can update recurring journal lines"
  ON public.recurring_journal_lines
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.recurring_journals rj
      WHERE rj.id = recurring_journal_lines.recurring_journal_id
        AND is_company_member(auth.uid(), rj.company_id)
    )
  );

CREATE POLICY "Company members can delete recurring journal lines"
  ON public.recurring_journal_lines
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recurring_journals rj
      WHERE rj.id = recurring_journal_lines.recurring_journal_id
        AND is_company_member(auth.uid(), rj.company_id)
    )
  );

-- RLS Policies for recurring invoice line items
CREATE POLICY "Company members can view recurring invoice line items"
  ON public.recurring_invoice_line_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recurring_invoices ri
      WHERE ri.id = recurring_invoice_line_items.recurring_invoice_id
        AND is_company_member(auth.uid(), ri.company_id)
    )
  );

CREATE POLICY "Company members can insert recurring invoice line items"
  ON public.recurring_invoice_line_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recurring_invoices ri
      WHERE ri.id = recurring_invoice_line_items.recurring_invoice_id
        AND is_company_member(auth.uid(), ri.company_id)
    )
  );

CREATE POLICY "Company members can update recurring invoice line items"
  ON public.recurring_invoice_line_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.recurring_invoices ri
      WHERE ri.id = recurring_invoice_line_items.recurring_invoice_id
        AND is_company_member(auth.uid(), ri.company_id)
    )
  );

CREATE POLICY "Company members can delete recurring invoice line items"
  ON public.recurring_invoice_line_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recurring_invoices ri
      WHERE ri.id = recurring_invoice_line_items.recurring_invoice_id
        AND is_company_member(auth.uid(), ri.company_id)
    )
  );

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;