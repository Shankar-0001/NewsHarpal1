-- =====================================================
-- NEWS CMS SCHEMA SETUP (No Data)
-- Run this in Supabase SQL Editor FIRST
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types/enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'author');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE article_status AS ENUM ('draft', 'pending', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (synced with auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'author',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Authors table
CREATE TABLE IF NOT EXISTS public.authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Articles table
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Article tags junction table
CREATE TABLE IF NOT EXISTS public.article_tags (
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- Media library table
CREATE TABLE IF NOT EXISTS public.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Slug history table (for SEO redirects)
CREATE TABLE IF NOT EXISTS public.slug_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  old_slug TEXT NOT NULL,
  new_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_authors_user_id ON public.authors(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON public.articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON public.tags(slug);
CREATE INDEX IF NOT EXISTS idx_slug_history_article_id ON public.slug_history(article_id);
CREATE INDEX IF NOT EXISTS idx_slug_history_old_slug ON public.slug_history(old_slug);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slug_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "authors_select_all" ON public.authors;
DROP POLICY IF EXISTS "authors_insert_own" ON public.authors;
DROP POLICY IF EXISTS "authors_update_own" ON public.authors;
DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_admin" ON public.categories;
DROP POLICY IF EXISTS "categories_update_admin" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_admin" ON public.categories;
DROP POLICY IF EXISTS "tags_select_all" ON public.tags;
DROP POLICY IF EXISTS "tags_insert_admin" ON public.tags;
DROP POLICY IF EXISTS "tags_update_admin" ON public.tags;
DROP POLICY IF EXISTS "tags_delete_admin" ON public.tags;
DROP POLICY IF EXISTS "articles_select_policy" ON public.articles;
DROP POLICY IF EXISTS "articles_insert_policy" ON public.articles;
DROP POLICY IF EXISTS "articles_update_policy" ON public.articles;
DROP POLICY IF EXISTS "articles_delete_policy" ON public.articles;
DROP POLICY IF EXISTS "article_tags_select_all" ON public.article_tags;
DROP POLICY IF EXISTS "article_tags_manage_policy" ON public.article_tags;
DROP POLICY IF EXISTS "media_select_all" ON public.media_library;
DROP POLICY IF EXISTS "media_insert_authenticated" ON public.media_library;
DROP POLICY IF EXISTS "media_delete_own" ON public.media_library;
DROP POLICY IF EXISTS "slug_history_select_all" ON public.slug_history;
DROP POLICY IF EXISTS "slug_history_insert_policy" ON public.slug_history;

-- Users policies
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Authors policies (public read, authenticated write own)
CREATE POLICY "authors_select_all" ON public.authors
  FOR SELECT USING (true);

CREATE POLICY "authors_insert_own" ON public.authors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authors_update_own" ON public.authors
  FOR UPDATE USING (
    auth.uid() = user_id 
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

-- Categories policies (public read, admin write)
CREATE POLICY "categories_select_all" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "categories_insert_admin" ON public.categories
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "categories_update_admin" ON public.categories
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "categories_delete_admin" ON public.categories
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

-- Tags policies (public read, admin write)
CREATE POLICY "tags_select_all" ON public.tags
  FOR SELECT USING (true);

CREATE POLICY "tags_insert_admin" ON public.tags
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "tags_update_admin" ON public.tags
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "tags_delete_admin" ON public.tags
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

-- Articles policies (public can see published, authors can see own, admin can see all)
CREATE POLICY "articles_select_policy" ON public.articles
  FOR SELECT USING (
    status = 'published'
    OR auth.uid() IN (SELECT user_id FROM public.authors WHERE id = author_id)
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "articles_insert_policy" ON public.articles
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.authors WHERE id = author_id)
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "articles_update_policy" ON public.articles
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.authors WHERE id = author_id)
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "articles_delete_policy" ON public.articles
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

-- Article tags policies
CREATE POLICY "article_tags_select_all" ON public.article_tags
  FOR SELECT USING (true);

CREATE POLICY "article_tags_manage_policy" ON public.article_tags
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.authors 
      WHERE id IN (SELECT author_id FROM public.articles WHERE id = article_id)
    )
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

-- Media library policies
CREATE POLICY "media_select_all" ON public.media_library
  FOR SELECT USING (true);

CREATE POLICY "media_insert_authenticated" ON public.media_library
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "media_delete_own" ON public.media_library
  FOR DELETE USING (
    auth.uid() = uploaded_by
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

-- Slug history policies
CREATE POLICY "slug_history_select_all" ON public.slug_history
  FOR SELECT USING (true);

CREATE POLICY "slug_history_insert_policy" ON public.slug_history
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.authors 
      WHERE id IN (SELECT author_id FROM public.articles WHERE id = article_id)
    )
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_authors_updated_at ON public.authors;
CREATE TRIGGER update_authors_updated_at BEFORE UPDATE ON public.authors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tags_updated_at ON public.tags;
CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON public.tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_articles_updated_at ON public.articles;
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup (sync auth.users to public.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'author')::user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STORAGE BUCKETS (Run this if using Supabase Storage)
-- =====================================================

-- Create storage bucket for article images
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for article-images bucket
DROP POLICY IF EXISTS "Anyone can view article images" ON storage.objects;
CREATE POLICY "Anyone can view article images"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

DROP POLICY IF EXISTS "Authenticated users can upload article images" ON storage.objects;
CREATE POLICY "Authenticated users can upload article images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'article-images' 
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'article-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'article-images' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  )
);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Display created tables
SELECT 
  'Schema setup complete! Tables created:' as message;

SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
   AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT 'Ready for data seeding! Run: node scripts/seed.mjs' as next_step;
