-- Fix RLS policies for user_roles table to allow owners to manage roles

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

-- Create policies that allow owners to manage all user roles
CREATE POLICY "Owners can view all user roles"
ON public.user_roles
FOR SELECT
USING (public.is_owner(auth.uid()));

CREATE POLICY "Owners can insert user roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "Owners can update user roles"
ON public.user_roles
FOR UPDATE
USING (public.is_owner(auth.uid()));

CREATE POLICY "Owners can delete user roles"
ON public.user_roles
FOR DELETE
USING (public.is_owner(auth.uid()));

-- Allow users to view their own role
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);