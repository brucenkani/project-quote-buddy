-- Create bank_accounts table with proper RLS
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  branch_code TEXT,
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'credit')),
  currency TEXT NOT NULL DEFAULT 'ZAR',
  ledger_account TEXT NOT NULL,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for company members
CREATE POLICY "Company members can view bank accounts" 
ON public.bank_accounts 
FOR SELECT 
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can insert bank accounts" 
ON public.bank_accounts 
FOR INSERT 
WITH CHECK (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can update bank accounts" 
ON public.bank_accounts 
FOR UPDATE 
USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can delete bank accounts" 
ON public.bank_accounts 
FOR DELETE 
USING (is_company_member(auth.uid(), company_id));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bank_accounts_updated_at
BEFORE UPDATE ON public.bank_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();