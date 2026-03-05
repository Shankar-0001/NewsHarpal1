-- Web Stories content type
CREATE TABLE IF NOT EXISTS public.web_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  cover_image TEXT NOT NULL,
  slides JSONB NOT NULL DEFAULT '[]'::jsonb,
  author_id UUID NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  related_article_slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_stories_slug ON public.web_stories(slug);
CREATE INDEX IF NOT EXISTS idx_web_stories_author_id ON public.web_stories(author_id);
CREATE INDEX IF NOT EXISTS idx_web_stories_category_id ON public.web_stories(category_id);
CREATE INDEX IF NOT EXISTS idx_web_stories_created_at ON public.web_stories(created_at DESC);

ALTER TABLE public.web_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view web stories" ON public.web_stories;
CREATE POLICY "Anyone can view web stories" ON public.web_stories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authors can create own web stories" ON public.web_stories;
CREATE POLICY "Authors can create own web stories" ON public.web_stories
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.authors WHERE id = author_id
    )
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

DROP POLICY IF EXISTS "Authors can update own web stories" ON public.web_stories;
CREATE POLICY "Authors can update own web stories" ON public.web_stories
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.authors WHERE id = author_id
    )
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

DROP POLICY IF EXISTS "Authors can delete own web stories" ON public.web_stories;
CREATE POLICY "Authors can delete own web stories" ON public.web_stories
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.authors WHERE id = author_id
    )
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

-- Engagement for web stories
CREATE TABLE IF NOT EXISTS public.web_story_engagement (
  story_id UUID PRIMARY KEY REFERENCES public.web_stories(id) ON DELETE CASCADE,
  views BIGINT NOT NULL DEFAULT 0,
  likes BIGINT NOT NULL DEFAULT 0,
  shares BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_story_engagement_views ON public.web_story_engagement(views DESC);
CREATE INDEX IF NOT EXISTS idx_web_story_engagement_shares ON public.web_story_engagement(shares DESC);

ALTER TABLE public.web_story_engagement ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view web story engagement" ON public.web_story_engagement;
CREATE POLICY "Anyone can view web story engagement" ON public.web_story_engagement
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert web story engagement" ON public.web_story_engagement;
CREATE POLICY "Anyone can insert web story engagement" ON public.web_story_engagement
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update web story engagement" ON public.web_story_engagement;
CREATE POLICY "Anyone can update web story engagement" ON public.web_story_engagement
  FOR UPDATE USING (true);
