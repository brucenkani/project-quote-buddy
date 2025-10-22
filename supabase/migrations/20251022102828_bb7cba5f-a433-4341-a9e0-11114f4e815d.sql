-- Create deals table for CRM sales pipeline
CREATE TABLE IF NOT EXISTS public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid,
  title text NOT NULL,
  customer text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  stage text NOT NULL DEFAULT 'lead',
  probability integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create policies for company members
CREATE POLICY "Company members can view deals"
  ON public.deals
  FOR SELECT
  USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can insert deals"
  ON public.deals
  FOR INSERT
  WITH CHECK (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can update deals"
  ON public.deals
  FOR UPDATE
  USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company members can delete deals"
  ON public.deals
  FOR DELETE
  USING (is_company_member(auth.uid(), company_id));

-- Create trigger for updated_at
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();