-- Add company_id to community_members and make it unique
ALTER TABLE public.community_members 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Create unique constraint on company_id (only one profile per company)
ALTER TABLE public.community_members
DROP CONSTRAINT IF EXISTS community_members_company_id_key;

ALTER TABLE public.community_members
ADD CONSTRAINT community_members_company_id_key UNIQUE (company_id);

-- Update RLS policies to use company membership
DROP POLICY IF EXISTS "Users can insert their own community profile" ON public.community_members;
DROP POLICY IF EXISTS "Users can update their own community profile" ON public.community_members;
DROP POLICY IF EXISTS "Users can delete their own community profile" ON public.community_members;

-- Only company owners can create/update/delete community profiles
CREATE POLICY "Company owners can insert community profile"
ON public.community_members
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IS NOT NULL AND
  get_company_role(auth.uid(), company_id) = 'owner'::app_role
);

CREATE POLICY "Company owners can update community profile"
ON public.community_members
FOR UPDATE
TO authenticated
USING (
  company_id IS NOT NULL AND
  get_company_role(auth.uid(), company_id) = 'owner'::app_role
);

CREATE POLICY "Company owners can delete community profile"
ON public.community_members
FOR DELETE
TO authenticated
USING (
  company_id IS NOT NULL AND
  get_company_role(auth.uid(), company_id) = 'owner'::app_role
);