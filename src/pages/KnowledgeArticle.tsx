import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface ArticleContent {
  type: 'text' | 'image' | 'flowchart' | 'heading';
  content: string;
  level?: number;
}

interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  content: ArticleContent[];
  featured_image_url?: string;
  view_count: number;
  created_at: string;
}

export default function KnowledgeArticle() {
  const { slug } = useParams();
  const navigate = useNavigate();
const [article, setArticle] = useState<Article | null>(null);
const [loading, setLoading] = useState(true);
const [viewCount, setViewCount] = useState<number>(0);

  useEffect(() => {
    if (slug) {
      loadArticle(slug);
    }
  }, [slug]);

  const loadArticle = async (articleSlug: string) => {
    try {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('slug', articleSlug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      
      setArticle({
        ...data,
        content: Array.isArray(data.content) ? data.content : []
      } as unknown as Article);
      
      // Record unique view and fetch total unique views
      const { data: userData } = await supabase.auth.getUser();
      try {
        if (userData?.user) {
          (supabase as any)
            .from('knowledge_article_views')
            .upsert(
              { article_id: data.id, user_id: userData.user.id },
              { onConflict: 'article_id,user_id' }
            );
        }
      } catch (e) {
        console.warn('View upsert failed', e);
      }

      const { count } = await (supabase as any)
        .from('knowledge_article_views')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', data.id);
      setViewCount(count || 0);
        
    } catch (error) {
      console.error('Error loading article:', error);
      toast.error('Article not found');
      navigate('/knowledge');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (contentItem: ArticleContent, index: number) => {
    switch (contentItem.type) {
      case 'heading':
        const HeadingTag = `h${contentItem.level || 2}` as keyof JSX.IntrinsicElements;
        const headingClasses = contentItem.level === 1 
          ? "text-3xl font-bold mb-4 mt-8" 
          : contentItem.level === 2 
          ? "text-2xl font-bold mb-3 mt-6" 
          : "text-xl font-semibold mb-2 mt-4";
        return (
          <HeadingTag key={index} className={headingClasses}>
            {contentItem.content}
          </HeadingTag>
        );
      case 'text': {
        const normalizedContent = (contentItem.content || '')
          .replace(/^(#{1,6})([^#\s])/gm, '$1 $2')
          .replace(/^(#{1,6})\s*(.+?)\s*#+\s*(.+)$/gm, '$1 $2\n\n$3')
          .replace(/\s*#+\s*$/gm, '');
        return (
          <div key={index} className="mb-4 leading-relaxed">
            <ReactMarkdown 
              components={{
                p: ({ children }) => <p className="text-muted-foreground mb-2">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children }) => <ul className="list-disc pl-6 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-6 mb-2">{children}</ol>,
                li: ({ children }) => <li className="text-muted-foreground">{children}</li>
              }}
            >
              {normalizedContent}
            </ReactMarkdown>
          </div>
        );
      }
      case 'image':
        return (
          <img 
            key={index}
            src={contentItem.content} 
            alt="Article content"
            className="w-full rounded-lg mb-6 shadow-md"
          />
        );
      case 'flowchart':
        return (
          <div key={index} className="bg-muted p-6 rounded-lg mb-6">
            <img 
              src={contentItem.content} 
              alt="Flowchart"
              className="w-full"
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading article...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Article not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/knowledge')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Knowledge Centre
        </Button>

        <article className="max-w-4xl mx-auto">
          <Card>
            {article.featured_image_url && (
              <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                <img 
                  src={article.featured_image_url} 
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <CardContent className="p-8">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <Badge>{article.category}</Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>{viewCount} views</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(article.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <h1 className="text-4xl font-bold mb-3">{article.title}</h1>
                {article.description && (
                  <p className="text-xl text-muted-foreground">{article.description}</p>
                )}
              </div>

              {/* Content */}
              <div className="prose prose-lg max-w-none">
                {article.content.map((item, index) => renderContent(item, index))}
              </div>

              {/* Footer */}
              <div className="mt-12 pt-6 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  Need help with {article.category.toLowerCase()}? Contact our professional accounting team.
                </p>
                <div className="flex justify-center mt-4">
                  <Button onClick={() => navigate('/#contact')}>
                    Contact Us
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </article>
      </div>
    </div>
  );
}
