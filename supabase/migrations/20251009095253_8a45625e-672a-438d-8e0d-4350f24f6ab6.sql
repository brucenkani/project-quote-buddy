-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create company_members junction table
CREATE TABLE public.company_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'accountant',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check company membership
CREATE OR REPLACE FUNCTION public.is_company_member(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_members
    WHERE user_id = _user_id AND company_id = _company_id
  )
$$;

-- Create function to get user's company role
CREATE OR REPLACE FUNCTION public.get_company_role(_user_id UUID, _company_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.company_members
  WHERE user_id = _user_id AND company_id = _company_id
  LIMIT 1
$$;

-- RLS policies for companies
CREATE POLICY "Users can view their companies"
ON public.companies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_members.company_id = companies.id
    AND company_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create companies"
ON public.companies FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Company owners can update"
ON public.companies FOR UPDATE
USING (
  get_company_role(auth.uid(), id) = 'owner'
);

-- RLS policies for company_members
CREATE POLICY "Users can view their company memberships"
ON public.company_members FOR SELECT
USING (user_id = auth.uid() OR is_company_member(auth.uid(), company_id));

CREATE POLICY "Company owners can manage members"
ON public.company_members FOR ALL
USING (get_company_role(auth.uid(), company_id) = 'owner');

-- Add company_id to all data tables
ALTER TABLE public.company_settings ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.contacts ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_items ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.invoices ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.quotes ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.purchases ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.purchase_orders ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.purchase_payments ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.recurring_invoices ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.journal_entries ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.bank_transactions ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.expense_payments ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.employees ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.payroll ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.chart_of_accounts ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_company_members_user ON public.company_members(user_id);
CREATE INDEX idx_company_members_company ON public.company_members(company_id);
CREATE INDEX idx_company_settings_company ON public.company_settings(company_id);
CREATE INDEX idx_contacts_company ON public.contacts(company_id);
CREATE INDEX idx_inventory_items_company ON public.inventory_items(company_id);
CREATE INDEX idx_invoices_company ON public.invoices(company_id);
CREATE INDEX idx_quotes_company ON public.quotes(company_id);
CREATE INDEX idx_purchases_company ON public.purchases(company_id);
CREATE INDEX idx_employees_company ON public.employees(company_id);

-- Update RLS policies to use company membership
DROP POLICY IF EXISTS "Users can view their own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can insert their own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can update their own company settings" ON public.company_settings;

CREATE POLICY "Company members can view settings"
ON public.company_settings FOR SELECT
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can insert settings"
ON public.company_settings FOR INSERT
WITH CHECK (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can update settings"
ON public.company_settings FOR UPDATE
USING (is_company_member(auth.uid(), company_id));

-- Update contacts policies
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts;

CREATE POLICY "Company members can view contacts"
ON public.contacts FOR SELECT
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can insert contacts"
ON public.contacts FOR INSERT
WITH CHECK (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can update contacts"
ON public.contacts FOR UPDATE
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can delete contacts"
ON public.contacts FOR DELETE
USING (is_company_member(auth.uid(), company_id));

-- Update inventory policies
DROP POLICY IF EXISTS "Users can view their own inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can insert their own inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can update their own inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can delete their own inventory" ON public.inventory_items;

CREATE POLICY "Company members can view inventory"
ON public.inventory_items FOR SELECT
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can insert inventory"
ON public.inventory_items FOR INSERT
WITH CHECK (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can update inventory"
ON public.inventory_items FOR UPDATE
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can delete inventory"
ON public.inventory_items FOR DELETE
USING (is_company_member(auth.uid(), company_id));

-- Update invoices policies
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;

CREATE POLICY "Company members can view invoices"
ON public.invoices FOR SELECT
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can insert invoices"
ON public.invoices FOR INSERT
WITH CHECK (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can update invoices"
ON public.invoices FOR UPDATE
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can delete invoices"
ON public.invoices FOR DELETE
USING (is_company_member(auth.uid(), company_id));

-- Update quotes policies
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can insert their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can delete their own quotes" ON public.quotes;

CREATE POLICY "Company members can view quotes"
ON public.quotes FOR SELECT
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can insert quotes"
ON public.quotes FOR INSERT
WITH CHECK (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can update quotes"
ON public.quotes FOR UPDATE
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can delete quotes"
ON public.quotes FOR DELETE
USING (is_company_member(auth.uid(), company_id));

-- Update purchases policies
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can update their own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can delete their own purchases" ON public.purchases;

CREATE POLICY "Company members can view purchases"
ON public.purchases FOR SELECT
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can insert purchases"
ON public.purchases FOR INSERT
WITH CHECK (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can update purchases"
ON public.purchases FOR UPDATE
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can delete purchases"
ON public.purchases FOR DELETE
USING (is_company_member(auth.uid(), company_id));

-- Update employees policies
DROP POLICY IF EXISTS "Owners can view all employee data" ON public.employees;
DROP POLICY IF EXISTS "Accountants can view all employee data" ON public.employees;
DROP POLICY IF EXISTS "Owners and accountants can create employees" ON public.employees;
DROP POLICY IF EXISTS "Owners and accountants can update employees" ON public.employees;
DROP POLICY IF EXISTS "Owners and accountants can delete employees" ON public.employees;

CREATE POLICY "Company members can view employees"
ON public.employees FOR SELECT
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company owners and accountants can manage employees"
ON public.employees FOR ALL
USING (
  is_company_member(auth.uid(), company_id) AND
  get_company_role(auth.uid(), company_id) IN ('owner', 'accountant')
);

-- Update chart_of_accounts policies
DROP POLICY IF EXISTS "Users can view their own chart of accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Users can insert their own chart of accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Users can update their own chart of accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Users can delete their own chart of accounts" ON public.chart_of_accounts;

CREATE POLICY "Company members can view chart of accounts"
ON public.chart_of_accounts FOR SELECT
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can manage chart of accounts"
ON public.chart_of_accounts FOR ALL
USING (is_company_member(auth.uid(), company_id));

-- Add trigger for updated_at on companies
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();