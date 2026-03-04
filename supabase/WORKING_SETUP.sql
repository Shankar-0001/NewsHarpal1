-- =====================================================
-- WORKING NEWS CMS SETUP - Fixed version
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'author');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE article_status AS ENUM ('draft', 'pending', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create tables
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'author',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  content_json JSONB,
  featured_image_url TEXT,
  author_id UUID NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  status article_status NOT NULL DEFAULT 'draft',
  seo_title TEXT,
  seo_description TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.article_tags (
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.media_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.slug_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  old_slug TEXT NOT NULL,
  new_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON public.articles(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON public.tags(slug);

-- Create trigger function for auto user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'author')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slug_history ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "authors_select_all" ON public.authors;
DROP POLICY IF EXISTS "authors_insert_own" ON public.authors;
DROP POLICY IF EXISTS "authors_update_own" ON public.authors;
DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_admin" ON public.categories;
DROP POLICY IF EXISTS "tags_select_all" ON public.tags;
DROP POLICY IF EXISTS "tags_insert_authenticated" ON public.tags;
DROP POLICY IF EXISTS "articles_select_policy" ON public.articles;
DROP POLICY IF EXISTS "articles_insert_authors" ON public.articles;
DROP POLICY IF EXISTS "articles_update_policy" ON public.articles;
DROP POLICY IF EXISTS "article_tags_select_all" ON public.article_tags;
DROP POLICY IF EXISTS "article_tags_manage_authors" ON public.article_tags;
DROP POLICY IF EXISTS "slug_history_select_all" ON public.slug_history;
DROP POLICY IF EXISTS "media_select_all" ON public.media_library;

-- Create RLS policies
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "authors_select_all" ON public.authors FOR SELECT USING (true);
CREATE POLICY "authors_insert_own" ON public.authors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "authors_update_own" ON public.authors FOR UPDATE USING (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "categories_select_all" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_insert_admin" ON public.categories FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "tags_select_all" ON public.tags FOR SELECT USING (true);
CREATE POLICY "tags_insert_authenticated" ON public.tags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "articles_select_policy" ON public.articles FOR SELECT USING (
    status = 'published' 
    OR auth.uid() IN (SELECT user_id FROM public.authors WHERE id = author_id)
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "articles_insert_authors" ON public.articles FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.authors WHERE id = author_id));
CREATE POLICY "articles_update_policy" ON public.articles FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.authors WHERE id = author_id)
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "article_tags_select_all" ON public.article_tags FOR SELECT USING (true);
CREATE POLICY "article_tags_manage_authors" ON public.article_tags FOR ALL USING (
    auth.uid() IN (
      SELECT au.user_id FROM public.articles a
      JOIN public.authors au ON a.author_id = au.id
      WHERE a.id = article_id
    ) OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "slug_history_select_all" ON public.slug_history FOR SELECT USING (true);
CREATE POLICY "media_select_all" ON public.media_library FOR SELECT USING (true);

-- Insert categories (no user dependency)
INSERT INTO public.categories (name, slug, description) VALUES
('Technology', 'technology', 'Latest tech news and innovation'),
('Business', 'business', 'Business and finance news'),
('Health', 'health', 'Health and wellness'),
('Science', 'science', 'Scientific discoveries'),
('Sports', 'sports', 'Sports news'),
('Lifestyle', 'lifestyle', 'Lifestyle and culture')
ON CONFLICT (slug) DO NOTHING;

-- Insert tags (no user dependency)
INSERT INTO public.tags (name, slug) VALUES
('AI', 'ai'),
('Technology', 'technology'),
('Innovation', 'innovation'),
('Health', 'health'),
('Business', 'business'),
('Science', 'science'),
('Blockchain', 'blockchain'),
('Cryptocurrency', 'cryptocurrency'),
('Fitness', 'fitness'),
('Climate', 'climate')
ON CONFLICT (slug) DO NOTHING;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Verification
SELECT 'Database setup complete!' as status;
SELECT 'Categories' as item, COUNT(*) as count FROM public.categories
UNION ALL
SELECT 'Tags', COUNT(*) FROM public.tags;

-- =====================================================
-- NEXT STEPS:
-- 1. Go to /signup and create your admin account
-- 2. After signup, run the ARTICLE_INSERT.sql script
-- =====================================================
