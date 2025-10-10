-- Create community members table
CREATE TABLE public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL,
  business_description TEXT,
  business_category TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  website TEXT,
  logo_url TEXT,
  address TEXT,
  city TEXT,
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create community settings table
CREATE TABLE public.community_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  featured_listing_fee NUMERIC NOT NULL DEFAULT 500,
  featured_duration_days INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create community payments table
CREATE TABLE public.community_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  community_member_id UUID REFERENCES public.community_members(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  payment_reference TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  featured_start_date TIMESTAMP WITH TIME ZONE,
  featured_end_date TIMESTAMP WITH TIME ZONE,
  payfast_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_members
CREATE POLICY "Anyone can view community members"
  ON public.community_members FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own community profile"
  ON public.community_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own community profile"
  ON public.community_members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own community profile"
  ON public.community_members FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for community_settings
CREATE POLICY "Anyone can view community settings"
  ON public.community_settings FOR SELECT
  USING (true);

CREATE POLICY "Only owners can manage community settings"
  ON public.community_settings FOR ALL
  USING (is_owner(auth.uid()));

-- RLS Policies for community_payments
CREATE POLICY "Users can view their own payments"
  ON public.community_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON public.community_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can view all payments"
  ON public.community_payments FOR SELECT
  USING (is_owner(auth.uid()));

-- Insert default community settings
INSERT INTO public.community_settings (featured_listing_fee, featured_duration_days)
VALUES (500, 30);

-- Add updated_at trigger for community_members
CREATE TRIGGER update_community_members_updated_at
  BEFORE UPDATE ON public.community_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for community_settings
CREATE TRIGGER update_community_settings_updated_at
  BEFORE UPDATE ON public.community_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for community_payments
CREATE TRIGGER update_community_payments_updated_at
  BEFORE UPDATE ON public.community_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();