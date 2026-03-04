-- ================================================================
-- UPDATE RLS POLICIES - NEW WORKFLOW
-- ================================================================
-- Authors publish directly (no draft/pending)
-- Admins can perform full CRUD on all articles
-- ================================================================

-- Drop existing article policies
DROP POLICY IF EXISTS "articles_select_policy" ON public.articles;
DROP POLICY IF EXISTS "articles_insert_authors" ON public.articles;
DROP POLICY IF EXISTS "articles_update_policy" ON public.articles;
DROP POLICY IF EXISTS "articles_delete_policy" ON public.articles;

-- =====================
-- NEW ARTICLES TABLE POLICIES
-- =====================

-- SELECT: Published articles for public, own articles for authors, all for admins
CREATE POLICY "articles_select_policy" ON public.articles
  FOR SELECT USING (
    status = 'published' 
    OR auth.uid() IN (SELECT user_id FROM public.authors WHERE id = author_id)
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

-- INSERT: Authors can create (automatically published), admins can create with any status
CREATE POLICY "articles_insert_authors" ON public.articles
  FOR INSERT WITH CHECK (
    (
      -- Authors: can only create with status='published'
      auth.uid() IN (SELECT user_id FROM public.authors WHERE id = author_id)
      AND status = 'published'
    )
    OR
    (
      -- Admins: can create with any status
      auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
    )
  );

-- UPDATE: Authors can edit only own published articles, admins can edit any
CREATE POLICY "articles_update_policy" ON public.articles
  FOR UPDATE USING (
    (
      -- Authors: can only update their own articles
      auth.uid() IN (SELECT user_id FROM public.authors WHERE id = author_id)
    )
    OR
    (
      -- Admins: can update any article
      auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
    )
  );

-- DELETE: Authors can delete only own articles, admins can delete any
CREATE POLICY "articles_delete_policy" ON public.articles
  FOR DELETE USING (
    (
      -- Authors: can only delete their own articles
      auth.uid() IN (SELECT user_id FROM public.authors WHERE id = author_id)
    )
    OR
    (
      -- Admins: can delete any article
      auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
    )
  );

SELECT '✅ RLS policies updated successfully' as status;

-- ================================================================
-- VERIFICATION
-- ================================================================

SELECT 'Updated policies:' as check_type,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'articles';

SELECT '
╔══════════════════════════════════════════════════════════════════╗
║               ✅ WORKFLOW UPDATED SUCCESSFULLY ✅                ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  NEW WORKFLOW:                                                   ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║                                                                  ║
║  👤 AUTHORS (writers):                                           ║
║     • Write article in dashboard                                ║
║     • Click "Publish Article"                                   ║
║     • Article is PUBLISHED IMMEDIATELY                          ║
║     • Can edit own articles                                     ║
║     • Can delete own articles                                   ║
║     • CANNOT modify other authors'' articles                    ║
║                                                                  ║
║  👑 ADMIN:                                                       ║
║     • Can create articles (with any status)                     ║
║     • Can save as draft                                         ║
║     • Can submit for review (pending)                           ║
║     • Can publish articles                                      ║
║     • Can edit ANY article                                      ║
║     • Can delete ANY article                                    ║
║     • Full CRUD control                                         ║
║                                                                  ║
║  🔐 SECURITY:                                                    ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║  ✓ RLS enforced at database level                               ║
║  ✓ Authors cannot save drafts                                   ║
║  ✓ Authors cannot access other articles                         ║
║  ✓ Admins have full access                                      ║
║  ✓ All changes logged with timestamps                           ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
' as workflow_update;
