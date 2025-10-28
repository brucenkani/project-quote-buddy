-- Add bank_account_id column to purchase_payments table
ALTER TABLE public.purchase_payments 
ADD COLUMN IF NOT EXISTS bank_account_id uuid REFERENCES public.bank_accounts(id);

-- Add bank_account_id column to expense_payments table
ALTER TABLE public.expense_payments 
ADD COLUMN IF NOT EXISTS bank_account_id uuid REFERENCES public.bank_accounts(id);