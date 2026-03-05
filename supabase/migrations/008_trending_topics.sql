CREATE TABLE IF NOT EXISTS public.trending_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  search_volume INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trending_topics_slug ON public.trending_topics(slug);
CREATE INDEX IF NOT EXISTS idx_trending_topics_created_at ON public.trending_topics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trending_topics_volume ON public.trending_topics(search_volume DESC);

ALTER TABLE public.trending_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read trending topics" ON public.trending_topics;
CREATE POLICY "Public can read trending topics" ON public.trending_topics
  FOR SELECT USING (true);

