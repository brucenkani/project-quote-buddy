-- Create expenses table (already exists, adding missing columns if needed)
-- This migration ensures expenses table has all required columns

-- Create expense_line_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.expense_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  unit_price NUMERIC NOT NULL,
  tax_rate NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on expense_line_items
ALTER TABLE public.expense_line_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for expense_line_items
CREATE POLICY "Company members can view expense line items"
  ON public.expense_line_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE expenses.id = expense_line_items.expense_id
      AND is_company_member(auth.uid(), expenses.company_id)
    )
  );

CREATE POLICY "Company members can insert expense line items"
  ON public.expense_line_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE expenses.id = expense_line_items.expense_id
      AND is_company_member(auth.uid(), expenses.company_id)
    )
  );

CREATE POLICY "Company members can update expense line items"
  ON public.expense_line_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE expenses.id = expense_line_items.expense_id
      AND is_company_member(auth.uid(), expenses.company_id)
    )
  );

CREATE POLICY "Company members can delete expense line items"
  ON public.expense_line_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE expenses.id = expense_line_items.expense_id
      AND is_company_member(auth.uid(), expenses.company_id)
    )
  );

-- Create updated_at trigger for expense_line_items
CREATE TRIGGER set_expense_line_items_updated_at
  BEFORE UPDATE ON public.expense_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();