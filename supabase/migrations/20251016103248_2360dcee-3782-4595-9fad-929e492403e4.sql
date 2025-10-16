-- Add tagline column to community_members table
ALTER TABLE public.community_members 
ADD COLUMN IF NOT EXISTS tagline TEXT;