-- Create company_settings table
CREATE TABLE public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL DEFAULT '',
  company_type text NOT NULL DEFAULT 'LLC',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT 'ZA',
  tax_number text NOT NULL DEFAULT '',
  registration_number text NOT NULL DEFAULT '',
  tax_rate numeric NOT NULL DEFAULT 15,
  currency text NOT NULL DEFAULT 'ZAR',
  currency_symbol text NOT NULL DEFAULT 'R',
  logo_url text,
  invoice_prefix text NOT NULL DEFAULT 'INV',
  invoice_start_number integer NOT NULL DEFAULT 1,
  quote_prefix text NOT NULL DEFAULT 'QTE',
  quote_start_number integer NOT NULL DEFAULT 1,
  purchase_prefix text NOT NULL DEFAULT 'PO',
  purchase_start_number integer NOT NULL DEFAULT 1,
  financial_year_end text NOT NULL DEFAULT '02-28',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Create contacts table
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  city text,
  state text,
  postal_code text,
  country text DEFAULT 'ZA',
  type text NOT NULL,
  tax_number text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create inventory_items table
CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  sku text,
  category text,
  unit text NOT NULL DEFAULT 'unit',
  unit_price numeric NOT NULL,
  cost_price numeric,
  quantity numeric NOT NULL DEFAULT 0,
  reorder_level numeric,
  tax_rate numeric NOT NULL DEFAULT 15,
  is_taxable boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create bank_transactions table
CREATE TABLE public.bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  description text NOT NULL,
  reference text,
  debit numeric DEFAULT 0,
  credit numeric DEFAULT 0,
  balance numeric NOT NULL,
  account_id text,
  category text,
  is_reconciled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Create expense_payments table
CREATE TABLE public.expense_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expense_id text NOT NULL,
  amount numeric NOT NULL,
  date date NOT NULL,
  method text NOT NULL,
  reference text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create chart_of_accounts table
CREATE TABLE public.chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  account_type text NOT NULL,
  parent_account text,
  description text,
  is_active boolean DEFAULT true,
  opening_balance numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_settings
CREATE POLICY "Users can view their own company settings"
  ON public.company_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company settings"
  ON public.company_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company settings"
  ON public.company_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for contacts
CREATE POLICY "Users can view their own contacts"
  ON public.contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
  ON public.contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
  ON public.contacts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for inventory_items
CREATE POLICY "Users can view their own inventory"
  ON public.inventory_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory"
  ON public.inventory_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory"
  ON public.inventory_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory"
  ON public.inventory_items FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for bank_transactions
CREATE POLICY "Users can view their own bank transactions"
  ON public.bank_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bank transactions"
  ON public.bank_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank transactions"
  ON public.bank_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank transactions"
  ON public.bank_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for expense_payments
CREATE POLICY "Users can view their own expense payments"
  ON public.expense_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expense payments"
  ON public.expense_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for chart_of_accounts
CREATE POLICY "Users can view their own chart of accounts"
  ON public.chart_of_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chart of accounts"
  ON public.chart_of_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chart of accounts"
  ON public.chart_of_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chart of accounts"
  ON public.chart_of_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chart_of_accounts_updated_at
  BEFORE UPDATE ON public.chart_of_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();