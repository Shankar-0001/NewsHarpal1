-- Update article_status enum to include 'pending'
ALTER TYPE article_status ADD VALUE IF NOT EXISTS 'pending';

-- Add new columns to articles table
ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS content_json JSONB; -- Structured TipTap JSON content

-- Create slug history table for 301 redirects
CREATE TABLE IF NOT EXISTS public.slug_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  old_slug TEXT NOT NULL,
  new_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slug_history_old_slug ON public.slug_history(old_slug);
CREATE INDEX IF NOT EXISTS idx_slug_history_article_id ON public.slug_history(article_id);

-- Function to handle slug changes
CREATE OR REPLACE FUNCTION public.handle_slug_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.slug IS DISTINCT FROM NEW.slug THEN
    INSERT INTO public.slug_history (article_id, old_slug, new_slug)
    VALUES (NEW.id, OLD.slug, NEW.slug);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for slug changes
DROP TRIGGER IF EXISTS on_article_slug_change ON public.articles;
CREATE TRIGGER on_article_slug_change
  AFTER UPDATE ON public.articles
  FOR EACH ROW
  WHEN (OLD.slug IS DISTINCT FROM NEW.slug)
  EXECUTE FUNCTION public.handle_slug_change();

-- Update articles RLS policies to include 'pending' status
DROP POLICY IF EXISTS "Anyone can view published articles" ON public.articles;
CREATE POLICY "Anyone can view published articles" ON public.articles
  FOR SELECT USING (
    status = 'published' 
    OR auth.uid() IN (SELECT user_id FROM public.authors WHERE id = author_id)
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

-- Storage bucket setup (run this separately in Supabase dashboard if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- Storage policies for media bucket
-- CREATE POLICY "Public can view media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
-- CREATE POLICY "Authenticated users can upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.uid() IS NOT NULL);
-- CREATE POLICY "Users can delete their own media" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND auth.uid() = owner);
