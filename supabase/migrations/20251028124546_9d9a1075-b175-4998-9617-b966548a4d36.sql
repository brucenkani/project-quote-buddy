-- Add bank_account_id column to invoice_payments table
ALTER TABLE public.invoice_payments 
ADD COLUMN IF NOT EXISTS bank_account_id uuid REFERENCES public.bank_accounts(id);