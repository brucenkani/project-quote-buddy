-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID,
  expense_number TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal NUMERIC NOT NULL,
  tax_rate NUMERIC NOT NULL,
  tax_amount NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid',
  payment_terms TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create expense line items table
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expenses
CREATE POLICY "Company members can view expenses"
  ON public.expenses FOR SELECT
  USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can insert expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can update expenses"
  ON public.expenses FOR UPDATE
  USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can delete expenses"
  ON public.expenses FOR DELETE
  USING (is_company_member(auth.uid(), company_id));

-- RLS Policies for expense line items
CREATE POLICY "Users can view expense line items"
  ON public.expense_line_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.expenses
    WHERE expenses.id = expense_line_items.expense_id
    AND expenses.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert expense line items"
  ON public.expense_line_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.expenses
    WHERE expenses.id = expense_line_items.expense_id
    AND expenses.user_id = auth.uid()
  ));

CREATE POLICY "Users can update expense line items"
  ON public.expense_line_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.expenses
    WHERE expenses.id = expense_line_items.expense_id
    AND expenses.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete expense line items"
  ON public.expense_line_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.expenses
    WHERE expenses.id = expense_line_items.expense_id
    AND expenses.user_id = auth.uid()
  ));

-- Create updated_at trigger for expenses
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();