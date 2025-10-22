-- Create function to safely create company, membership and settings in one transaction
CREATE OR REPLACE FUNCTION public.create_company_full(
  _name text,
  _settings jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id uuid,
  name text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_company public.companies%ROWTYPE;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create company
  INSERT INTO public.companies (name, created_by)
  VALUES (_name, v_user_id)
  RETURNING * INTO v_company;

  -- Add creator as owner
  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (v_company.id, v_user_id, 'owner');

  -- Create default company settings with overrides from _settings
  INSERT INTO public.company_settings (
    company_id,
    user_id,
    company_name,
    country,
    company_type,
    email,
    phone,
    address,
    city,
    state,
    postal_code,
    tax_number,
    registration_number,
    currency,
    currency_symbol,
    logo_url,
    tax_rate,
    financial_year_end,
    invoice_prefix,
    invoice_start_number,
    quote_prefix,
    quote_start_number,
    purchase_prefix,
    purchase_start_number
  ) VALUES (
    v_company.id,
    v_user_id,
    COALESCE(_settings->>'company_name', _name),
    COALESCE(_settings->>'country', 'ZA'),
    COALESCE(_settings->>'company_type', 'trading'),
    COALESCE(_settings->>'email', ''),
    COALESCE(_settings->>'phone', ''),
    COALESCE(_settings->>'address', ''),
    COALESCE(_settings->>'city', ''),
    COALESCE(_settings->>'state', ''),
    COALESCE(_settings->>'postal_code', ''),
    COALESCE(_settings->>'tax_number', ''),
    COALESCE(_settings->>'registration_number', ''),
    COALESCE(_settings->>'currency', 'ZAR'),
    COALESCE(_settings->>'currency_symbol', 'R'),
    NULLIF(_settings->>'logo_url', ''),
    COALESCE((_settings->>'tax_rate')::numeric, 15),
    COALESCE(_settings->>'financial_year_end', '02-28'),
    COALESCE(_settings->>'invoice_prefix', 'INV'),
    COALESCE((_settings->>'invoice_start_number')::int, 1),
    COALESCE(_settings->>'quote_prefix', 'QTE'),
    COALESCE((_settings->>'quote_start_number')::int, 1),
    COALESCE(_settings->>'purchase_prefix', 'PO'),
    COALESCE((_settings->>'purchase_start_number')::int, 1)
  );

  RETURN QUERY SELECT v_company.id, v_company.name, v_company.created_by, v_company.created_at, v_company.updated_at;
END;
$$;