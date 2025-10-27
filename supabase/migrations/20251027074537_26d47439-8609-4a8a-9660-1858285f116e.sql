-- Make user_id nullable to allow guest views
ALTER TABLE public.knowledge_article_views 
ALTER COLUMN user_id DROP NOT NULL;

-- Update unique constraint to handle NULL user_ids differently
-- Drop existing unique index
DROP INDEX IF EXISTS knowledge_article_views_unique;

-- Create partial unique index only for logged-in users
CREATE UNIQUE INDEX knowledge_article_views_unique_user 
ON public.knowledge_article_views (article_id, user_id) 
WHERE user_id IS NOT NULL;

-- Add policy to allow guest view inserts
CREATE POLICY "Guests can insert anonymous article views"
ON public.knowledge_article_views
FOR INSERT
WITH CHECK (user_id IS NULL);