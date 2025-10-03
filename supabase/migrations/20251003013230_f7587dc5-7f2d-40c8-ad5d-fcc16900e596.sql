-- Update tax brackets table to support multiple countries
ALTER TABLE public.sars_tax_brackets 
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'ZA';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_tax_brackets_country_year 
  ON public.sars_tax_brackets(country, year);

-- Rename table to be more generic
ALTER TABLE public.sars_tax_brackets RENAME TO tax_brackets;

-- Update RLS policies for renamed table
DROP POLICY IF EXISTS "Everyone can view tax brackets" ON public.tax_brackets;
DROP POLICY IF EXISTS "Only owners can manage tax brackets" ON public.tax_brackets;

CREATE POLICY "Everyone can view tax brackets" 
ON public.tax_brackets 
FOR SELECT 
USING (true);

CREATE POLICY "Only owners can manage tax brackets" 
ON public.tax_brackets 
FOR ALL 
USING (is_owner(auth.uid()));

-- Create payroll settings table for country and currency configuration
CREATE TABLE IF NOT EXISTS public.payroll_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country TEXT NOT NULL DEFAULT 'ZA',
  currency TEXT NOT NULL DEFAULT 'ZAR',
  currency_symbol TEXT NOT NULL DEFAULT 'R',
  current_tax_year INTEGER NOT NULL DEFAULT 2024,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payroll_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view payroll settings" 
ON public.payroll_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Only owners can manage payroll settings" 
ON public.payroll_settings 
FOR ALL 
USING (is_owner(auth.uid()));

-- Insert default settings
INSERT INTO public.payroll_settings (country, currency, currency_symbol, current_tax_year)
VALUES ('ZA', 'ZAR', 'R', 2024)
ON CONFLICT DO NOTHING;

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_payroll_settings_updated_at
BEFORE UPDATE ON public.payroll_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();