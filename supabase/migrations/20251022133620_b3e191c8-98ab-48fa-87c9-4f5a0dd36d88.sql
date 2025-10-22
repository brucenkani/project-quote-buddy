-- Create a function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- Add RLS policies for super admin to access all companies
CREATE POLICY "Super admins can view all companies"
ON public.companies
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete all companies"
ON public.companies
FOR DELETE
TO authenticated
USING (is_super_admin(auth.uid()));

-- Add RLS policies for super admin to access all company members
CREATE POLICY "Super admins can view all company members"
ON public.company_members
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage all company members"
ON public.company_members
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Add RLS policies for super admin to access all profiles
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()));

-- Add RLS policies for super admin to manage subscriptions
CREATE POLICY "Super admins can manage all subscriptions"
ON public.subscriptions
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));