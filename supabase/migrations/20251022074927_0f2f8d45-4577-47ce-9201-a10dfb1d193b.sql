-- Drop and recreate the handle_new_user function with better logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company_id UUID;
  v_company_name TEXT;
  v_full_name TEXT;
BEGIN
  -- Extract full name from metadata
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  -- Extract company name from metadata
  v_company_name := NEW.raw_user_meta_data->>'company_name';
  
  -- If no company name in metadata, create default from email
  IF v_company_name IS NULL OR v_company_name = '' THEN
    v_company_name := SPLIT_PART(NEW.email, '@', 1) || '''s Company';
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name
  );
  
  -- Assign owner role to new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner');

  -- Create company
  INSERT INTO public.companies (name, created_by)
  VALUES (v_company_name, NEW.id)
  RETURNING id INTO v_company_id;

  -- Add user as company owner
  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (v_company_id, NEW.id, 'owner');
  
  -- Create trial subscription
  INSERT INTO public.subscriptions (
    user_id,
    company_id,
    status,
    trial_start,
    trial_end
  ) VALUES (
    NEW.id,
    v_company_id,
    'trial',
    now(),
    now() + INTERVAL '1 day'
  );
  
  RETURN NEW;
END;
$$;