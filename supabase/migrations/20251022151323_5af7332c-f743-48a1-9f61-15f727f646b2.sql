-- Update RLS policies for community_members to only allow super_admin to manage

-- Drop existing policies
DROP POLICY IF EXISTS "Company owners can insert community profile" ON public.community_members;
DROP POLICY IF EXISTS "Company owners can update community profile" ON public.community_members;
DROP POLICY IF EXISTS "Company owners can delete community profile" ON public.community_members;

-- Create new policies for super admin only
CREATE POLICY "Super admins can insert community members"
ON public.community_members
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update community members"
ON public.community_members
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete community members"
ON public.community_members
FOR DELETE
TO authenticated
USING (is_super_admin(auth.uid()));

-- Update RLS policies for knowledge_articles to only allow super_admin to manage
-- First check if the table exists and enable RLS
ALTER TABLE IF EXISTS public.knowledge_articles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on knowledge_articles if they exist
DROP POLICY IF EXISTS "Anyone can view published articles" ON public.knowledge_articles;
DROP POLICY IF EXISTS "Admins can manage articles" ON public.knowledge_articles;
DROP POLICY IF EXISTS "Admins can view all articles" ON public.knowledge_articles;

-- Create new policies for knowledge_articles
CREATE POLICY "Anyone can view published articles"
ON public.knowledge_articles
FOR SELECT
TO authenticated
USING (is_published = true OR is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert articles"
ON public.knowledge_articles
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update articles"
ON public.knowledge_articles
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete articles"
ON public.knowledge_articles
FOR DELETE
TO authenticated
USING (is_super_admin(auth.uid()));

-- Update community_settings table policies if it exists
ALTER TABLE IF EXISTS public.community_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view community settings" ON public.community_settings;
DROP POLICY IF EXISTS "Super admins can manage community settings" ON public.community_settings;

CREATE POLICY "Anyone can view community settings"
ON public.community_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admins can manage community settings"
ON public.community_settings
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));