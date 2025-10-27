-- Create table to track unique article views per user
CREATE TABLE IF NOT EXISTS public.knowledge_article_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure uniqueness per (article_id, user_id)
CREATE UNIQUE INDEX IF NOT EXISTS knowledge_article_views_unique ON public.knowledge_article_views (article_id, user_id);
CREATE INDEX IF NOT EXISTS knowledge_article_views_article_idx ON public.knowledge_article_views (article_id);

-- Enable RLS
ALTER TABLE public.knowledge_article_views ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view article views"
ON public.knowledge_article_views
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own article view"
ON public.knowledge_article_views
FOR INSERT
WITH CHECK (auth.uid() = user_id);
