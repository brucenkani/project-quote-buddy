-- Add admin role to app_role enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'admin') THEN
    ALTER TYPE app_role ADD VALUE 'admin';
  END IF;
END $$;

-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'expired', 'cancelled', 'suspended');

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  status subscription_status NOT NULL DEFAULT 'trial',
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  subscription_start TIMESTAMP WITH TIME ZONE,
  subscription_end TIMESTAMP WITH TIME ZONE,
  payfast_subscription_token TEXT,
  payfast_payment_id TEXT,
  amount NUMERIC(10, 2),
  currency TEXT DEFAULT 'ZAR',
  auto_renew BOOLEAN DEFAULT true,
  cancellation_date TIMESTAMP WITH TIME ZONE,
  deletion_scheduled_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create subscription transactions table
CREATE TABLE public.subscription_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  payfast_payment_id TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  status TEXT NOT NULL,
  transaction_type TEXT NOT NULL, -- 'subscription', 'renewal', 'cancellation'
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create data deletion queue table
CREATE TABLE public.data_deletion_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  scheduled_deletion_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_deletion_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all subscriptions"
  ON public.subscriptions FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert subscriptions"
  ON public.subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for subscription_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.subscription_transactions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE subscriptions.id = subscription_transactions.subscription_id
    AND subscriptions.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all transactions"
  ON public.subscription_transactions FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert transactions"
  ON public.subscription_transactions FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for data_deletion_queue
CREATE POLICY "Admins can view all deletion queue"
  ON public.data_deletion_queue FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage deletion queue"
  ON public.data_deletion_queue FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
    AND status IN ('trial', 'active')
    AND (
      (status = 'trial' AND trial_end > now()) OR
      (status = 'active' AND subscription_end > now())
    )
  )
$$;

-- Function to check if user is in trial
CREATE OR REPLACE FUNCTION public.is_in_trial(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
    AND status = 'trial'
    AND trial_end > now()
  )
$$;

-- Function to schedule data deletion
CREATE OR REPLACE FUNCTION public.schedule_data_deletion(_user_id UUID, _company_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deletion_id UUID;
BEGIN
  INSERT INTO public.data_deletion_queue (
    user_id,
    company_id,
    scheduled_deletion_date
  ) VALUES (
    _user_id,
    _company_id,
    now() + INTERVAL '7 days'
  )
  RETURNING id INTO deletion_id;
  
  RETURN deletion_id;
END;
$$;

-- Trigger to create trial subscription on user signup
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Get the user's company
  SELECT id INTO v_company_id
  FROM public.companies
  WHERE created_by = NEW.id
  LIMIT 1;
  
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

-- Add trigger to handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_company_name TEXT;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign owner role to new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner');
  
  -- Use company name from metadata, or create default from email
  v_company_name := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
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

-- Create index for performance
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscription_transactions_subscription_id ON public.subscription_transactions(subscription_id);
CREATE INDEX idx_data_deletion_queue_scheduled_date ON public.data_deletion_queue(scheduled_deletion_date) WHERE status = 'pending';