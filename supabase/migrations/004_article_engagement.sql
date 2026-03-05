-- Article engagement metrics for SEO/user signals
CREATE TABLE IF NOT EXISTS public.article_engagement (
  article_id UUID PRIMARY KEY REFERENCES public.articles(id) ON DELETE CASCADE,
  views BIGINT NOT NULL DEFAULT 0,
  likes BIGINT NOT NULL DEFAULT 0,
  shares BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.article_engagement
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.article_engagement
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_article_engagement_views ON public.article_engagement(views DESC);
CREATE INDEX IF NOT EXISTS idx_article_engagement_shares ON public.article_engagement(shares DESC);

ALTER TABLE public.article_engagement ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view engagement" ON public.article_engagement;
CREATE POLICY "Anyone can view engagement" ON public.article_engagement
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can update engagement counters" ON public.article_engagement;
CREATE POLICY "Anyone can update engagement counters" ON public.article_engagement
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can modify engagement counters" ON public.article_engagement;
CREATE POLICY "Anyone can modify engagement counters" ON public.article_engagement
  FOR UPDATE USING (true);
