-- Create invoices table
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_number text NOT NULL,
  customer_id text NOT NULL,
  issue_date date NOT NULL,
  due_date date NOT NULL,
  subtotal numeric NOT NULL,
  tax_amount numeric NOT NULL,
  total_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  terms text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create invoice_line_items table
CREATE TABLE public.invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  tax_rate numeric NOT NULL,
  amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create invoice_payments table
CREATE TABLE public.invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_id text NOT NULL,
  amount numeric NOT NULL,
  date date NOT NULL,
  method text NOT NULL,
  reference text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create quotes table
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quote_number text NOT NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  issue_date date NOT NULL,
  valid_until date NOT NULL,
  subtotal numeric NOT NULL,
  tax_amount numeric NOT NULL,
  total_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  terms text,
  industry text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create quote_line_items table
CREATE TABLE public.quote_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES public.quotes(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  tax_rate numeric NOT NULL,
  amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create purchases table
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  purchase_number text NOT NULL,
  supplier_id text NOT NULL,
  issue_date date NOT NULL,
  due_date date NOT NULL,
  subtotal numeric NOT NULL,
  tax_amount numeric NOT NULL,
  total_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create purchase_line_items table
CREATE TABLE public.purchase_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid REFERENCES public.purchases(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  tax_rate numeric NOT NULL,
  amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create purchase_orders table
CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  po_number text NOT NULL,
  supplier_id text NOT NULL,
  issue_date date NOT NULL,
  delivery_date date,
  subtotal numeric NOT NULL,
  tax_amount numeric NOT NULL,
  total_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create purchase_order_line_items table
CREATE TABLE public.purchase_order_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid REFERENCES public.purchase_orders(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create purchase_payments table
CREATE TABLE public.purchase_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  purchase_id text NOT NULL,
  amount numeric NOT NULL,
  date date NOT NULL,
  method text NOT NULL,
  reference text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create recurring_invoices table
CREATE TABLE public.recurring_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id text NOT NULL,
  frequency text NOT NULL,
  next_invoice_date date NOT NULL,
  subtotal numeric NOT NULL,
  tax_amount numeric NOT NULL,
  total_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create journal_entries table
CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_number text NOT NULL,
  date date NOT NULL,
  description text NOT NULL,
  reference text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create journal_entry_lines table
CREATE TABLE public.journal_entry_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id uuid REFERENCES public.journal_entries(id) ON DELETE CASCADE NOT NULL,
  account_id text NOT NULL,
  account_name text NOT NULL,
  debit numeric DEFAULT 0,
  credit numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Users can view their own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for invoice_line_items
CREATE POLICY "Users can view invoice line items" ON public.invoice_line_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_line_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can insert invoice line items" ON public.invoice_line_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_line_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can update invoice line items" ON public.invoice_line_items FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_line_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can delete invoice line items" ON public.invoice_line_items FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_line_items.invoice_id AND invoices.user_id = auth.uid()));

-- RLS Policies for invoice_payments
CREATE POLICY "Users can view their own invoice payments" ON public.invoice_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own invoice payments" ON public.invoice_payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for quotes
CREATE POLICY "Users can view their own quotes" ON public.quotes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quotes" ON public.quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quotes" ON public.quotes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quotes" ON public.quotes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for quote_line_items
CREATE POLICY "Users can view quote line items" ON public.quote_line_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.quotes WHERE quotes.id = quote_line_items.quote_id AND quotes.user_id = auth.uid()));
CREATE POLICY "Users can insert quote line items" ON public.quote_line_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.quotes WHERE quotes.id = quote_line_items.quote_id AND quotes.user_id = auth.uid()));
CREATE POLICY "Users can update quote line items" ON public.quote_line_items FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.quotes WHERE quotes.id = quote_line_items.quote_id AND quotes.user_id = auth.uid()));
CREATE POLICY "Users can delete quote line items" ON public.quote_line_items FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.quotes WHERE quotes.id = quote_line_items.quote_id AND quotes.user_id = auth.uid()));

-- RLS Policies for purchases
CREATE POLICY "Users can view their own purchases" ON public.purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own purchases" ON public.purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own purchases" ON public.purchases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own purchases" ON public.purchases FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for purchase_line_items
CREATE POLICY "Users can view purchase line items" ON public.purchase_line_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.purchases WHERE purchases.id = purchase_line_items.purchase_id AND purchases.user_id = auth.uid()));
CREATE POLICY "Users can insert purchase line items" ON public.purchase_line_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.purchases WHERE purchases.id = purchase_line_items.purchase_id AND purchases.user_id = auth.uid()));
CREATE POLICY "Users can update purchase line items" ON public.purchase_line_items FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.purchases WHERE purchases.id = purchase_line_items.purchase_id AND purchases.user_id = auth.uid()));
CREATE POLICY "Users can delete purchase line items" ON public.purchase_line_items FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.purchases WHERE purchases.id = purchase_line_items.purchase_id AND purchases.user_id = auth.uid()));

-- RLS Policies for purchase_orders
CREATE POLICY "Users can view their own purchase orders" ON public.purchase_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own purchase orders" ON public.purchase_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own purchase orders" ON public.purchase_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own purchase orders" ON public.purchase_orders FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for purchase_order_line_items
CREATE POLICY "Users can view purchase order line items" ON public.purchase_order_line_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.purchase_orders WHERE purchase_orders.id = purchase_order_line_items.purchase_order_id AND purchase_orders.user_id = auth.uid()));
CREATE POLICY "Users can insert purchase order line items" ON public.purchase_order_line_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.purchase_orders WHERE purchase_orders.id = purchase_order_line_items.purchase_order_id AND purchase_orders.user_id = auth.uid()));
CREATE POLICY "Users can update purchase order line items" ON public.purchase_order_line_items FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.purchase_orders WHERE purchase_orders.id = purchase_order_line_items.purchase_order_id AND purchase_orders.user_id = auth.uid()));
CREATE POLICY "Users can delete purchase order line items" ON public.purchase_order_line_items FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.purchase_orders WHERE purchase_orders.id = purchase_order_line_items.purchase_order_id AND purchase_orders.user_id = auth.uid()));

-- RLS Policies for purchase_payments
CREATE POLICY "Users can view their own purchase payments" ON public.purchase_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own purchase payments" ON public.purchase_payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for recurring_invoices
CREATE POLICY "Users can view their own recurring invoices" ON public.recurring_invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recurring invoices" ON public.recurring_invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recurring invoices" ON public.recurring_invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recurring invoices" ON public.recurring_invoices FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for journal_entries
CREATE POLICY "Users can view their own journal entries" ON public.journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own journal entries" ON public.journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own journal entries" ON public.journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own journal entries" ON public.journal_entries FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for journal_entry_lines
CREATE POLICY "Users can view journal entry lines" ON public.journal_entry_lines FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.journal_entries WHERE journal_entries.id = journal_entry_lines.journal_entry_id AND journal_entries.user_id = auth.uid()));
CREATE POLICY "Users can insert journal entry lines" ON public.journal_entry_lines FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.journal_entries WHERE journal_entries.id = journal_entry_lines.journal_entry_id AND journal_entries.user_id = auth.uid()));
CREATE POLICY "Users can update journal entry lines" ON public.journal_entry_lines FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.journal_entries WHERE journal_entries.id = journal_entry_lines.journal_entry_id AND journal_entries.user_id = auth.uid()));
CREATE POLICY "Users can delete journal entry lines" ON public.journal_entry_lines FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.journal_entries WHERE journal_entries.id = journal_entry_lines.journal_entry_id AND journal_entries.user_id = auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recurring_invoices_updated_at BEFORE UPDATE ON public.recurring_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();