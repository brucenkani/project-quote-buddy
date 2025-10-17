-- Create table for knowledge centre articles
CREATE TABLE public.knowledge_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  featured_image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;

-- Policies for knowledge articles
CREATE POLICY "Knowledge articles are viewable by everyone" 
ON public.knowledge_articles 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can manage knowledge articles" 
ON public.knowledge_articles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Add index for performance
CREATE INDEX idx_knowledge_articles_category ON public.knowledge_articles(category);
CREATE INDEX idx_knowledge_articles_slug ON public.knowledge_articles(slug);
CREATE INDEX idx_knowledge_articles_published ON public.knowledge_articles(is_published);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_knowledge_articles_updated_at
BEFORE UPDATE ON public.knowledge_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();