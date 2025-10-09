-- Function to auto-create company for existing users on first login
CREATE OR REPLACE FUNCTION public.ensure_user_has_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_company_name TEXT;
BEGIN
  -- Check if user already has a company
  IF EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  -- Create default company name from email
  v_company_name := COALESCE(
    SPLIT_PART(NEW.email, '@', 1) || '''s Company',
    'My Company'
  );

  -- Create company
  INSERT INTO public.companies (name, created_by)
  VALUES (v_company_name, NEW.id)
  RETURNING id INTO v_company_id;

  -- Add user as owner
  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (v_company_id, NEW.id, 'owner');

  -- Migrate any existing data to the new company
  UPDATE public.company_settings SET company_id = v_company_id WHERE user_id = NEW.id AND company_id IS NULL;
  UPDATE public.contacts SET company_id = v_company_id WHERE user_id = NEW.id AND company_id IS NULL;
  UPDATE public.inventory_items SET company_id = v_company_id WHERE user_id = NEW.id AND company_id IS NULL;
  UPDATE public.invoices SET company_id = v_company_id WHERE user_id = NEW.id AND company_id IS NULL;
  UPDATE public.quotes SET company_id = v_company_id WHERE user_id = NEW.id AND company_id IS NULL;
  UPDATE public.purchases SET company_id = v_company_id WHERE user_id = NEW.id AND company_id IS NULL;
  UPDATE public.purchase_orders SET company_id = v_company_id WHERE user_id = NEW.id AND company_id IS NULL;
  UPDATE public.purchase_payments SET company_id = v_company_id WHERE user_id = NEW.id AND company_id IS NULL;
  UPDATE public.recurring_invoices SET company_id = v_company_id WHERE user_id = NEW.id AND company_id IS NULL;
  UPDATE public.journal_entries SET company_id = v_company_id WHERE user_id = NEW.id AND company_id IS NULL;
  UPDATE public.bank_transactions SET company_id = v_company_id WHERE user_id = NEW.id AND company_id IS NULL;
  UPDATE public.expense_payments SET company_id = v_company_id WHERE user_id = NEW.id AND company_id IS NULL;
  UPDATE public.employees SET company_id = v_company_id WHERE user_id = NEW.id AND company_id IS NULL;
  UPDATE public.chart_of_accounts SET company_id = v_company_id WHERE user_id = NEW.id AND company_id IS NULL;

  RETURN NEW;
END;
$$;

-- Update the existing trigger to also ensure company
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER ensure_company_on_login
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_has_company();

-- Migrate existing users' data right now
DO $$
DECLARE
  v_user RECORD;
  v_company_id UUID;
  v_company_name TEXT;
BEGIN
  FOR v_user IN SELECT id, email FROM auth.users
  LOOP
    -- Check if user already has a company
    IF NOT EXISTS (
      SELECT 1 FROM public.company_members WHERE user_id = v_user.id
    ) THEN
      -- Create company
      v_company_name := COALESCE(
        SPLIT_PART(v_user.email, '@', 1) || '''s Company',
        'My Company'
      );
      
      INSERT INTO public.companies (name, created_by)
      VALUES (v_company_name, v_user.id)
      RETURNING id INTO v_company_id;

      -- Add as owner
      INSERT INTO public.company_members (company_id, user_id, role)
      VALUES (v_company_id, v_user.id, 'owner');

      -- Migrate data
      UPDATE public.company_settings SET company_id = v_company_id WHERE user_id = v_user.id AND company_id IS NULL;
      UPDATE public.contacts SET company_id = v_company_id WHERE user_id = v_user.id AND company_id IS NULL;
      UPDATE public.inventory_items SET company_id = v_company_id WHERE user_id = v_user.id AND company_id IS NULL;
      UPDATE public.invoices SET company_id = v_company_id WHERE user_id = v_user.id AND company_id IS NULL;
      UPDATE public.quotes SET company_id = v_company_id WHERE user_id = v_user.id AND company_id IS NULL;
      UPDATE public.purchases SET company_id = v_company_id WHERE user_id = v_user.id AND company_id IS NULL;
      UPDATE public.purchase_orders SET company_id = v_company_id WHERE user_id = v_user.id AND company_id IS NULL;
      UPDATE public.purchase_payments SET company_id = v_company_id WHERE user_id = v_user.id AND company_id IS NULL;
      UPDATE public.recurring_invoices SET company_id = v_company_id WHERE user_id = v_user.id AND company_id IS NULL;
      UPDATE public.journal_entries SET company_id = v_company_id WHERE user_id = v_user.id AND company_id IS NULL;
      UPDATE public.bank_transactions SET company_id = v_company_id WHERE user_id = v_user.id AND company_id IS NULL;
      UPDATE public.expense_payments SET company_id = v_company_id WHERE user_id = v_user.id AND company_id IS NULL;
      UPDATE public.employees SET company_id = v_company_id WHERE user_id = v_user.id AND company_id IS NULL;
      UPDATE public.chart_of_accounts SET company_id = v_company_id WHERE user_id = v_user.id AND company_id IS NULL;
    END IF;
  END LOOP;
END;
$$;