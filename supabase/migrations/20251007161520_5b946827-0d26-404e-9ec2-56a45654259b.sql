-- Fix critical security issue: Restrict invitation token access
-- Drop the insecure policy that allows anyone to view all invitations
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.invitations;

-- Create a secure policy that only allows viewing a specific invitation by exact token match
-- This prevents enumeration attacks and email harvesting
CREATE POLICY "Users can view invitation with specific token"
ON public.invitations
FOR SELECT
USING (
  -- Allow if the request includes a specific token match (for accepting invitations)
  -- Note: This should be used with RPC functions that take token as parameter
  token IN (
    SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'invitation_token', '')::text
  )
);

-- Create an RPC function to securely fetch invitation by token
-- This prevents direct table access and ensures only one invitation is returned
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token text)
RETURNS TABLE (
  id uuid,
  email text,
  role app_role,
  expires_at timestamp with time zone,
  status text,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    id,
    email,
    role,
    expires_at,
    status,
    created_at
  FROM public.invitations
  WHERE token = _token
    AND status = 'pending'
    AND expires_at > now()
  LIMIT 1;
$$;