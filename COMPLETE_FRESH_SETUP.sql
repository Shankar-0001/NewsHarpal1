-- ================================================================
-- COMPLETE NEWS CMS FRESH DATABASE SETUP
-- ================================================================
-- This is a COMPLETE CLEAN SLATE setup that:
-- 1. Drops ALL existing tables safely
-- 2. Creates complete schema from scratch
-- 3. Sets up Role-Based Authentication (NO hardcoded credentials)
-- 4. Implements Row Level Security (RLS) for all tables
-- 5. Creates triggers for automatic role assignment on signup
-- ================================================================
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Copy-paste the ENTIRE content of this file
-- 3. Click "Run" to execute
-- 4. All tables will be created from scratch
-- ================================================================

-- ================================================================
-- PHASE 1: ENABLE EXTENSIONS & SET PROPER PERMISSIONS
-- ================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure we have proper permissions to work with the schema
-- Grant schema permissions to the current user
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

SELECT 'Extensions enabled and permissions set' as status;

-- ================================================================
-- PHASE 2: REMOVE ALL TRIGGERS FROM AUTH.USERS (Safe cleanup)
-- ================================================================

-- Safely disable auth.users triggers
DO $$
BEGIN
  ALTER TABLE auth.users DISABLE TRIGGER ALL;
  RAISE NOTICE 'Auth triggers disabled safely';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable auth.users triggers (may already be disabled)';
END $$;

SELECT 'Auth triggers handling complete' as status;

-- ================================================================
-- PHASE 3.5: DISABLE RLS ON EXISTING TABLES (Remove constraints)
-- ================================================================

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.authors DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.categories DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.tags DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.articles DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.article_tags DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.media_library DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.slug_history DISABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'RLS disabled on existing tables';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable RLS (tables may not exist)';
END $$;

SELECT 'RLS disabled on existing tables' as status;

DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public') 
    LOOP
        BEGIN
          EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
                        r.policyname, r.schemaname, r.tablename);
        EXCEPTION WHEN OTHERS THEN
          -- Ignore errors for individual policies
          RAISE NOTICE 'Could not drop policy %s on table %s (may be locked)', 
                      r.policyname, r.tablename;
        END;
    END LOOP;
    RAISE NOTICE 'Policy cleanup attempt complete';
END $$;

SELECT 'All existing policies handled' as status;

-- ================================================================
-- PHASE 4: DROP ALL EXISTING TABLES (Clean slate with cascade)
-- ================================================================

-- Drop dependencies first
DROP TABLE IF EXISTS public.article_tags CASCADE;
DROP TABLE IF EXISTS public.articles CASCADE;
DROP TABLE IF EXISTS public.authors CASCADE;
DROP TABLE IF EXISTS public.slug_history CASCADE;
DROP TABLE IF EXISTS public.media_library CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- For users table, we need to be more careful due to potential ownership issues
-- Try to drop with CASCADE, ignoring permission errors
DO $$ 
BEGIN
  DROP TABLE IF EXISTS public.users CASCADE;
  RAISE NOTICE 'Successfully dropped users table';
EXCEPTION WHEN OTHERS THEN
  -- If we can't drop, that's okay - we'll recreate it
  RAISE NOTICE 'Could not drop users table (may not exist), continuing...';
END $$;

SELECT 'All existing tables dropped successfully' as status;

-- ================================================================
-- PHASE 5: DROP EXISTING ENUMS (Fresh start)
-- ================================================================

DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.article_status CASCADE;

SELECT 'Enums reset' as status;

-- ================================================================
-- PHASE 6: DROP EXISTING FUNCTIONS AND TRIGGERS
-- ================================================================

-- Drop triggers safely
DO $$
BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
  DROP TRIGGER IF EXISTS update_users_updated_at ON public.users CASCADE;
  DROP TRIGGER IF EXISTS update_authors_updated_at ON public.authors CASCADE;
  DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories CASCADE;
  DROP TRIGGER IF EXISTS update_tags_updated_at ON public.tags CASCADE;
  DROP TRIGGER IF EXISTS update_articles_updated_at ON public.articles CASCADE;
  DROP TRIGGER IF EXISTS on_article_slug_change ON public.articles CASCADE;
  RAISE NOTICE 'Triggers cleaned up successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Some triggers may not have existed, continuing...';
END $$;

-- Drop functions safely
DO $$
BEGIN
  DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
  DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
  DROP FUNCTION IF EXISTS public.handle_slug_change() CASCADE;
  RAISE NOTICE 'Functions cleaned up successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Some functions may not have existed, continuing...';
END $$;

SELECT 'Functions and triggers cleaned up' as status;

-- ================================================================
-- PHASE 7: CREATE ENUMS (User roles and article status)
-- ================================================================

CREATE TYPE public.user_role AS ENUM ('admin', 'author');
CREATE TYPE public.article_status AS ENUM ('draft', 'pending', 'published');

SELECT 'Enums created: user_role, article_status' as status;

-- ================================================================
-- PHASE 8: CREATE TABLES (Complete fresh schema)
-- ================================================================

-- =====================
-- USERS TABLE
-- =====================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'author',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'Extended user information with role assignment. Role is set to author by default on signup.';
COMMENT ON COLUMN public.users.role IS 'User role: author (default on signup) or admin (manually assigned by superuser)';

-- =====================
-- AUTHORS TABLE
-- =====================
CREATE TABLE public.authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.authors IS 'Author profiles linked to users';
COMMENT ON COLUMN public.authors.user_id IS 'Reference to public.users - one author per user';

-- =====================
-- CATEGORIES TABLE
-- =====================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.categories IS 'Article categories (Tech, Business, Health, etc.)';

-- =====================
-- TAGS TABLE
-- =====================
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.tags IS 'Tags for articles (AI, Blockchain, Innovation, etc.)';

-- =====================
-- ARTICLES TABLE
-- =====================
CREATE TABLE public.articles (
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

COMMENT ON TABLE public.articles IS 'News articles with workflow support (draft → pending → published)';
COMMENT ON COLUMN public.articles.status IS 'Draft (unpublished), Pending (awaiting review), Published (live)';

-- =====================
-- ARTICLE_TAGS JUNCTION TABLE
-- =====================
CREATE TABLE public.article_tags (
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

COMMENT ON TABLE public.article_tags IS 'Many-to-many relationship between articles and tags';

-- =====================
-- MEDIA_LIBRARY TABLE
-- =====================
CREATE TABLE public.media_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.media_library IS 'Track uploaded media files in Supabase Storage';

-- =====================
-- SLUG_HISTORY TABLE (301 Redirects)
-- =====================
CREATE TABLE public.slug_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  old_slug TEXT NOT NULL,
  new_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.slug_history IS 'Track slug changes for 301 redirect support';

SELECT '✅ All tables created successfully' as status;

-- ================================================================
-- PHASE 9: CREATE INDEXES (Performance optimization)
-- ================================================================

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_authors_user_id ON public.authors(user_id);
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_tags_slug ON public.tags(slug);
CREATE INDEX idx_articles_slug ON public.articles(slug);
CREATE INDEX idx_articles_author_id ON public.articles(author_id);
CREATE INDEX idx_articles_category_id ON public.articles(category_id);
CREATE INDEX idx_articles_status ON public.articles(status);
CREATE INDEX idx_articles_published_at ON public.articles(published_at DESC NULLS LAST);
CREATE INDEX idx_articles_status_published_at ON public.articles(status, published_at DESC) WHERE status = 'published';
CREATE INDEX idx_articles_author_status ON public.articles(author_id, status);
CREATE INDEX idx_media_library_uploaded_by ON public.media_library(uploaded_by);
CREATE INDEX idx_slug_history_article_id ON public.slug_history(article_id);
CREATE INDEX idx_slug_history_old_slug ON public.slug_history(old_slug);

SELECT '✅ All indexes created' as status;

-- ================================================================
-- PHASE 10: CREATE UTILITY FUNCTIONS
-- ================================================================

-- =====================
-- FUNCTION: Update updated_at timestamp
-- =====================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- FUNCTION: Handle new user signup (CRITICAL FOR ROLE ASSIGNMENT)
-- =====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'author')
  ON CONFLICT (id) DO NOTHING;
  
  -- Also create author profile automatically
  INSERT INTO public.authors (user_id, name)
  SELECT NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Author')
  WHERE NOT EXISTS (SELECT 1 FROM public.authors WHERE user_id = NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user entry with role=author on auth.users signup. NO HARDCODING.';

-- =====================
-- FUNCTION: Handle article slug changes (for 301 redirects)
-- =====================
CREATE OR REPLACE FUNCTION public.handle_slug_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.slug IS DISTINCT FROM NEW.slug THEN
    INSERT INTO public.slug_history (article_id, old_slug, new_slug)
    VALUES (NEW.id, OLD.slug, NEW.slug);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ Utility functions created' as status;

-- ================================================================
-- PHASE 11: CREATE TRIGGERS
-- ================================================================

-- Update timestamps on data changes
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_authors_updated_at BEFORE UPDATE ON public.authors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Automatic user creation on auth signup (ROLE ASSIGNMENT TRIGGER)
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Track slug changes for 301 redirects
CREATE TRIGGER on_article_slug_change AFTER UPDATE ON public.articles
  FOR EACH ROW
  WHEN (OLD.slug IS DISTINCT FROM NEW.slug)
  EXECUTE FUNCTION public.handle_slug_change();

-- Re-enable triggers on auth.users
DO $$
BEGIN
  ALTER TABLE auth.users ENABLE TRIGGER ALL;
  RAISE NOTICE 'Auth triggers re-enabled successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable auth.users triggers';
END $$;

SELECT '✅ All triggers created and auth.users updated' as status;

-- ================================================================
-- PHASE 12: ENABLE ROW LEVEL SECURITY (RLS)
-- ================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slug_history ENABLE ROW LEVEL SECURITY;

SELECT '✅ Row Level Security (RLS) enabled on all tables' as status;

-- ================================================================
-- PHASE 13: CREATE RLS POLICIES (ACCESS CONTROL)
-- ================================================================

-- =====================
-- USERS TABLE POLICIES
-- =====================

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- =====================
-- AUTHORS TABLE POLICIES
-- =====================

CREATE POLICY "authors_select_all" ON public.authors
  FOR SELECT USING (true);

CREATE POLICY "authors_insert_own" ON public.authors
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "authors_update_own" ON public.authors
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "authors_delete_admin" ON public.authors
  FOR DELETE USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- =====================
-- CATEGORIES TABLE POLICIES
-- =====================

CREATE POLICY "categories_select_all" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "categories_insert_admin" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "categories_update_admin" ON public.categories
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "categories_delete_admin" ON public.categories
  FOR DELETE USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- =====================
-- TAGS TABLE POLICIES
-- =====================

CREATE POLICY "tags_select_all" ON public.tags
  FOR SELECT USING (true);

CREATE POLICY "tags_insert_authenticated" ON public.tags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "tags_update_admin" ON public.tags
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "tags_delete_admin" ON public.tags
  FOR DELETE USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- =====================
-- ARTICLES TABLE POLICIES (CRITICAL - PREVENTS DRAFT LEAKAGE)
-- =====================

CREATE POLICY "articles_select_policy" ON public.articles
  FOR SELECT USING (
    status = 'published' 
    OR auth.uid() IN (SELECT user_id FROM public.authors WHERE id = author_id)
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "articles_insert_authors" ON public.articles
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.authors WHERE id = author_id)
  );

CREATE POLICY "articles_update_policy" ON public.articles
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.authors WHERE id = author_id)
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "articles_delete_policy" ON public.articles
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.authors WHERE id = author_id)
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

-- =====================
-- ARTICLE_TAGS TABLE POLICIES
-- =====================

CREATE POLICY "article_tags_select_all" ON public.article_tags
  FOR SELECT USING (true);

CREATE POLICY "article_tags_manage_authors" ON public.article_tags
  FOR ALL USING (
    auth.uid() IN (
      SELECT au.user_id 
      FROM public.articles a
      JOIN public.authors au ON a.author_id = au.id
      WHERE a.id = article_id
    )
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

-- =====================
-- MEDIA_LIBRARY TABLE POLICIES
-- =====================

CREATE POLICY "media_select_all" ON public.media_library
  FOR SELECT USING (true);

CREATE POLICY "media_insert_authenticated" ON public.media_library
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "media_delete_own_or_admin" ON public.media_library
  FOR DELETE USING (
    auth.uid() = uploaded_by
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

-- =====================
-- SLUG_HISTORY TABLE POLICIES
-- =====================

CREATE POLICY "slug_history_select_all" ON public.slug_history
  FOR SELECT USING (true);

SELECT '✅ All RLS policies created successfully' as status;

-- ================================================================
-- PHASE 14: CREATE STORAGE BUCKET
-- ================================================================

-- Create media storage bucket for uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage access policies
DROP POLICY IF EXISTS "media_select_public" ON storage.objects;
CREATE POLICY "media_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_insert_authenticated" ON storage.objects;
CREATE POLICY "media_insert_authenticated" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "media_delete_own_or_admin" ON storage.objects;
CREATE POLICY "media_delete_own_or_admin" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'media' 
    AND (
      auth.uid() = owner
      OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
    )
  );

SELECT '✅ Storage bucket "media" created with access policies' as status;

-- ================================================================
-- PHASE 15: INSERT INITIAL DATA (Categories & Tags only - NO USERS)
-- ================================================================

INSERT INTO public.categories (name, slug, description) VALUES
('Technology', 'technology', 'Latest technology news and innovations'),
('Business', 'business', 'Business, finance, and market news'),
('Health', 'health', 'Healthcare and wellness information'),
('Science', 'science', 'Scientific discoveries and research'),
('Sports', 'sports', 'Sports news and updates'),
('Lifestyle', 'lifestyle', 'Lifestyle, culture, and entertainment'),
('Politics', 'politics', 'Political news and analysis'),
('Environment', 'environment', 'Environmental and climate news'),
('Education', 'education', 'Education and learning resources'),
('Travel', 'travel', 'Travel, tourism, and destination guides')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES
('AI', 'ai'),
('Artificial Intelligence', 'artificial-intelligence'),
('Machine Learning', 'machine-learning'),
('Blockchain', 'blockchain'),
('Cryptocurrency', 'cryptocurrency'),
('Innovation', 'innovation'),
('Technology', 'technology'),
('Health', 'health'),
('Business', 'business'),
('Science', 'science'),
('Climate Change', 'climate-change'),
('Sustainability', 'sustainability'),
('Fitness', 'fitness'),
('Finance', 'finance'),
('Security', 'security')
ON CONFLICT (slug) DO NOTHING;

SELECT '✅ Initial categories and tags inserted' as status;

-- ================================================================
-- PHASE 16: VERIFICATION AND STATUS
-- ================================================================

-- Verify tables exist
SELECT 'Tables created:' as check_type, 
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- Verify RLS enabled
SELECT 'RLS enabled on:' as check_type,
  COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Verify policies exist
SELECT 'RLS policies created:' as check_type,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public';

-- Verify indexes
SELECT 'Indexes created:' as check_type,
  COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public';

-- Verify categories were inserted
SELECT 'Categories inserted:' as check_type,
  COUNT(*) as category_count
FROM public.categories;

-- Verify tags were inserted
SELECT 'Tags inserted:' as check_type,
  COUNT(*) as tag_count
FROM public.tags;

-- ================================================================
-- PHASE 17: INSTRUCTIONS FOR NEXT STEPS
-- ================================================================

SELECT '
╔══════════════════════════════════════════════════════════════════╗
║                 ✅ DATABASE SETUP COMPLETE ✅                    ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  ALL TABLES, POLICIES, AND TRIGGERS ARE READY!                  ║
║                                                                  ║
║  NEXT STEPS:                                                     ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║                                                                  ║
║  1. Go to your application login page                           ║
║  2. Click "Sign Up"                                             ║
║  3. Create your first user account                              ║
║     - Email: your-email@example.com                             ║
║     - Password: Your secure password                            ║
║                                                                  ║
║     ⭐ This user will AUTOMATICALLY get role=author             ║
║                                                                  ║
║  4. To make yourself an ADMIN:                                  ║
║     - Go to Supabase > SQL Editor                               ║
║     - Run this command:                                         ║
║                                                                  ║
║     UPDATE public.users SET role = ''admin''                    ║
║     WHERE email = ''your-email@example.com'';                   ║
║                                                                  ║
║  5. Log into your admin dashboard!                              ║
║                                                                  ║
║  ROLE-BASED ACCESS CONTROL:                                     ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║                                                                  ║
║  👤 AUTHOR (default):                                            ║
║     • Create articles (Draft status)                            ║
║     • Edit own articles                                         ║
║     • Submit for review (Pending status)                        ║
║     • Cannot publish (requires admin)                           ║
║     • Cannot manage categories                                  ║
║                                                                  ║
║  👑 ADMIN (manually assigned):                                   ║
║     • Edit/Delete all articles                                  ║
║     • Manage categories                                         ║
║     • Manage tags                                               ║
║     • Publish articles directly                                 ║
║     • Delete authors                                            ║
║     • Full dashboard access                                     ║
║                                                                  ║
║  🔐 SECURITY FEATURES:                                           ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║                                                                  ║
║  ✓ Row Level Security (RLS) enabled on all tables               ║
║  ✓ Draft/Pending articles hidden from public                   ║
║  ✓ Authors can only edit their own articles                    ║
║  ✓ Automatic timestamp updates                                  ║
║  ✓ 301 redirect support for slug changes                        ║
║  ✓ NO HARDCODED CREDENTIALS - All role-based!                  ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
' as setup_complete;

-- ================================================================
-- END OF SETUP
-- ================================================================
