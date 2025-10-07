-- Create invitations table
CREATE TABLE public.invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'accountant'::app_role,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  accepted_at timestamp with time zone,
  UNIQUE(email, status)
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Owners can view all invitations
CREATE POLICY "Owners can view all invitations"
ON public.invitations
FOR SELECT
TO authenticated
USING (is_owner(auth.uid()));

-- Owners can create invitations
CREATE POLICY "Owners can create invitations"
ON public.invitations
FOR INSERT
TO authenticated
WITH CHECK (is_owner(auth.uid()));

-- Owners can update invitations
CREATE POLICY "Owners can update invitations"
ON public.invitations
FOR UPDATE
TO authenticated
USING (is_owner(auth.uid()));

-- Owners can delete invitations
CREATE POLICY "Owners can delete invitations"
ON public.invitations
FOR DELETE
TO authenticated
USING (is_owner(auth.uid()));

-- Anyone can view their own invitation by token (for acceptance)
CREATE POLICY "Anyone can view invitation by token"
ON public.invitations
FOR SELECT
TO anon, authenticated
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_invitations_updated_at
BEFORE UPDATE ON public.invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();