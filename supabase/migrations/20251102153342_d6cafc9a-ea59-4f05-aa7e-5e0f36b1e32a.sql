-- Add sub_category column to chart_of_accounts table
ALTER TABLE public.chart_of_accounts 
ADD COLUMN IF NOT EXISTS sub_category text;

-- Add comment to explain the sub_category field
COMMENT ON COLUMN public.chart_of_accounts.sub_category IS 'Account sub-category for better classification and report mapping';