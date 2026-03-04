# 🔧 Quick Admin SQL Commands

Keep this handy for common database operations!

---

## 👤 User Management

### View All Users
```sql
SELECT id, email, role, created_at 
FROM public.users 
ORDER BY created_at DESC;
```

### Check Your Own Role
```sql
SELECT role 
FROM public.users 
WHERE id = auth.uid();
```

### Make Someone an Admin
```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'user@example.com';
```

### Change Admin Back to Author
```sql
UPDATE public.users 
SET role = 'author' 
WHERE email = 'user@example.com';
```

### Delete a User (CASCADE - careful!)
```sql
DELETE FROM public.users 
WHERE email = 'user@example.com';
```

---

## 📝 Article Management

### View All Articles (All Statuses)
```sql
SELECT 
  a.id,
  a.title,
  a.slug,
  a.status,
  au.name as author_name,
  c.name as category_name,
  a.published_at,
  a.created_at
FROM public.articles a
LEFT JOIN public.authors au ON a.author_id = au.id
LEFT JOIN public.categories c ON a.category_id = c.id
ORDER BY a.created_at DESC;
```

### View Only Published Articles
```sql
SELECT 
  title, 
  slug, 
  author_id, 
  published_at
FROM public.articles 
WHERE status = 'published' 
ORDER BY published_at DESC;
```

### View Draft Articles (Admin Only)
```sql
SELECT 
  a.title,
  a.slug,
  au.name as author_name,
  a.status,
  a.created_at
FROM public.articles a
LEFT JOIN public.authors au ON a.author_id = au.id
WHERE a.status = 'draft'
ORDER BY a.created_at DESC;
```

### Publish an Article
```sql
UPDATE public.articles 
SET status = 'published', published_at = NOW()
WHERE slug = 'article-slug-here';
```

### Unpublish an Article
```sql
UPDATE public.articles 
SET status = 'draft', published_at = NULL
WHERE slug = 'article-slug-here';
```

### Delete an Article
```sql
DELETE FROM public.articles 
WHERE id = 'article-id-here';
```

### Change Article Author (Admin Only)
```sql
UPDATE public.articles 
SET author_id = (SELECT id FROM public.authors WHERE user_id = 'new-user-id')
WHERE id = 'article-id';
```

---

## 🏷️ Categories & Tags

### View All Categories
```sql
SELECT id, name, slug, description, created_at 
FROM public.categories 
ORDER BY name;
```

### View All Tags
```sql
SELECT id, name, slug, created_at 
FROM public.tags 
ORDER BY name;
```

### Create a New Category
```sql
INSERT INTO public.categories (name, slug, description)
VALUES (
  'Category Name',
  'category-slug',
  'Description here'
);
```

### Create a New Tag
```sql
INSERT INTO public.tags (name, slug)
VALUES (
  'Tag Name',
  'tag-slug'
);
```

### Update Category
```sql
UPDATE public.categories 
SET name = 'New Name', description = 'New description'
WHERE slug = 'old-slug';
```

### Delete Category (Articles keep null category_id)
```sql
DELETE FROM public.categories 
WHERE slug = 'category-slug';
```

### Delete Tag
```sql
DELETE FROM public.tags 
WHERE slug = 'tag-slug';
```

---

## 👥 Author Management

### View All Authors
```sql
SELECT 
  au.id,
  au.name,
  u.email,
  au.bio,
  au.avatar_url,
  au.created_at
FROM public.authors au
LEFT JOIN public.users u ON au.user_id = u.id
ORDER BY au.created_at DESC;
```

### View Author's Articles
```sql
SELECT 
  a.title,
  a.slug,
  a.status,
  a.created_at
FROM public.articles a
LEFT JOIN public.authors au ON a.author_id = au.id
WHERE au.id = 'author-id'
ORDER BY a.created_at DESC;
```

### Update Author Profile
```sql
UPDATE public.authors 
SET name = 'New Name', bio = 'New bio'
WHERE id = 'author-id';
```

### Delete an Author (Cascades to articles)
```sql
DELETE FROM public.authors 
WHERE id = 'author-id';
```

---

## 📸 Media Library

### View All Uploaded Media
```sql
SELECT 
  m.filename,
  m.file_url,
  m.file_type,
  m.file_size,
  u.email as uploaded_by
FROM public.media_library m
LEFT JOIN public.users u ON m.uploaded_by = u.id
ORDER BY m.created_at DESC;
```

### View Media by User
```sql
SELECT 
  filename,
  file_url,
  file_type,
  file_size,
  created_at
FROM public.media_library 
WHERE uploaded_by = 'user-id'
ORDER BY created_at DESC;
```

### Delete Media Entry
```sql
DELETE FROM public.media_library 
WHERE id = 'media-id';
```

---

## 📊 Analytics & Stats

### Total Articles by Status
```sql
SELECT 
  status,
  COUNT(*) as count
FROM public.articles 
GROUP BY status;
```

### Articles by Author
```sql
SELECT 
  au.name,
  COUNT(a.id) as article_count
FROM public.articles a
LEFT JOIN public.authors au ON a.author_id = au.id
GROUP BY au.id, au.name
ORDER BY article_count DESC;
```

### Articles by Category
```sql
SELECT 
  c.name,
  COUNT(a.id) as article_count
FROM public.articles a
LEFT JOIN public.categories c ON a.category_id = c.id
GROUP BY c.id, c.name
ORDER BY article_count DESC;
```

### User Breakdown
```sql
SELECT 
  role,
  COUNT(*) as user_count
FROM public.users 
GROUP BY role;
```

### Total Content Stats
```sql
SELECT 
  'Total Users' as metric, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'Admin Users', COUNT(*) FROM public.users WHERE role = 'admin'
UNION ALL
SELECT 'Author Users', COUNT(*) FROM public.users WHERE role = 'author'
UNION ALL
SELECT 'Total Articles', COUNT(*) FROM public.articles
UNION ALL
SELECT 'Published Articles', COUNT(*) FROM public.articles WHERE status = 'published'
UNION ALL
SELECT 'Draft Articles', COUNT(*) FROM public.articles WHERE status = 'draft'
UNION ALL
SELECT 'Pending Articles', COUNT(*) FROM public.articles WHERE status = 'pending'
UNION ALL
SELECT 'Total Categories', COUNT(*) FROM public.categories
UNION ALL
SELECT 'Total Tags', COUNT(*) FROM public.tags;
```

---

## 🔍 Debugging

### Check RLS Status on All Tables
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### View All RLS Policies
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Check All Triggers
```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

### View All Indexes
```sql
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Check Storage Buckets
```sql
SELECT id, name, public, created_at 
FROM storage.buckets;
```

### View Storage Policies
```sql
SELECT 
  policyname,
  definition
FROM pg_policies
WHERE tablename = 'objects'
ORDER BY policyname;
```

---

## ⚠️ Dangerous Operations (Use Carefully!)

### Reset Entire Database (Remove All Data)
```sql
-- WARNING: This deletes everything!
DELETE FROM public.article_tags;
DELETE FROM public.articles;
DELETE FROM public.authors;
DELETE FROM public.users;
DELETE FROM public.categories;
DELETE FROM public.tags;
DELETE FROM public.media_library;
DELETE FROM public.slug_history;

-- Then re-insert base categories and tags
INSERT INTO public.categories (name, slug, description) VALUES
('Technology', 'technology', 'Latest technology'),
('Business', 'business', 'Business news'),
('Health', 'health', 'Health news');

INSERT INTO public.tags (name, slug) VALUES
('AI', 'ai'),
('Innovation', 'innovation'),
('Technology', 'technology');
```

### Disable All RLS (ONLY for debugging!)
```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.slug_history DISABLE ROW LEVEL SECURITY;
```

### Re-enable All RLS
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slug_history ENABLE ROW LEVEL SECURITY;
```

---

**💡 Pro Tip:** Copy the section you need, then paste it into Supabase SQL Editor and modify as needed!
