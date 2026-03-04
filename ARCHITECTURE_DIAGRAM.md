# 🏗️ ARCHITECTURE: Role-Based Authentication System

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS APPLICATION                         │
│  (Login, Signup, Dashboard, Articles, Admin Panel)              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
          ┌──────────────────────────────────────┐
          │    SUPABASE AUTH (auth.users)        │
          │  ├─ Handles signup/login             │
          │  ├─ Password hashing (bcrypt)        │
          │  ├─ Session management               │
          │  └─ Triggers: on_auth_user_created   │
          └────────────────┬─────────────────────┘
                           │ (ON NEW SIGNUP)
                           ↓
          ┌──────────────────────────────────────┐
          │   TRIGGER: on_auth_user_created      │
          │  (Automatic, NO hardcoding!)         │
          │  ├─ Gets new auth.users record       │
          │  ├─ Inserts into public.users        │
          │  ├─ Sets role = 'author' (default)   │
          │  └─ Creates public.authors profile   │
          └────────────────┬─────────────────────┘
                           │
                           ↓
          ┌────────────────────────────────────────┐
          │   DATABASE TABLES (PostgreSQL)         │
          │  ┌──────────────────────────────────┐  │
          │  │ public.users                     │  │
          │  │ ├─ id (from auth.users)          │  │
          │  │ ├─ email                         │  │
          │  │ ├─ role (author | admin)  ← KEY │  │
          │  │ ├─ created_at                    │  │
          │  │ └─ updated_at                    │  │
          │  └──────────────────────────────────┘  │
          │  ┌──────────────────────────────────┐  │
          │  │ public.authors                   │  │
          │  │ ├─ id                            │  │
          │  │ ├─ user_id FK → public.users     │  │
          │  │ ├─ name                          │  │
          │  │ ├─ bio                           │  │
          │  │ └─ avatar_url                    │  │
          │  └──────────────────────────────────┘  │
          │  ┌──────────────────────────────────┐  │
          │  │ public.articles                  │  │
          │  │ ├─ id                            │  │
          │  │ ├─ title, slug, content          │  │
          │  │ ├─ author_id FK → authors        │  │
          │  │ ├─ category_id FK → categories   │  │
          │  │ ├─ status (draft|pending|pub)    │  │
          │  │ └─ RLS: Only own/published/admin │  │
          │  └──────────────────────────────────┘  │
          │  ... and more tables ...                │
          └────────────────┬─────────────────────┘
                           │
                           ↓
          ┌────────────────────────────────────────┐
          │   ROW LEVEL SECURITY (RLS) POLICIES    │
          │  (Enforces access control at DB level) │
          │  ├─ users_select_own                   │
          │  ├─ authors_select_all / update_own    │
          │  ├─ articles_select_policy             │
          │  │  ├─ Published for public            │
          │  │  ├─ Own articles for authors        │
          │  │  └─ All for admins                  │
          │  ├─ articles_insert_authors            │
          │  ├─ articles_update_policy             │
          │  │  ├─ Own for authors                 │
          │  │  └─ All for admins                  │
          │  ├─ categories_*_admin                 │
          │  └─ ... and more ...                   │
          └────────────────┬─────────────────────┘
                           │
                           ↓
          ┌────────────────────────────────────────┐
          │   APPLICATION LEVEL CHECKS             │
          │  ├─ Middleware (protected routes)      │
          │  ├─ API route handlers                 │
          │  └─ Component permissions              │
          └────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Scenario 1: New User Signs Up

```
┌──────────────────────────────────────────────────────────┐
│ USER FILLS SIGNUP FORM                                   │
│  Email: author@example.com                              │
│  Password: SecurePassword123                             │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ↓
┌──────────────────────────────────────────────────────────┐
│ SUPABASE AUTH VALIDATES & SIGNS UP                       │
│  ✅ Email format valid                                   │
│  ✅ Password meets requirements                          │
│  ✅ Email not already registered                         │
│  ✅ Creates auth.users record                            │
│                                                          │
│ auth.users:                                              │
│ {                                                        │
│   id: "uuid-auto-generated",                             │
│   email: "author@example.com",                           │
│   created_at: "2026-03-04 10:30:00"                      │
│ }                                                        │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ↓
         🔥 TRIGGER FIRES: on_auth_user_created
                          │
                          ↓
┌──────────────────────────────────────────────────────────┐
│ FUNCTION: handle_new_user()                              │
│  ✅ Gets new auth.users record                           │
│  ✅ Extracts: id, email                                  │
│  ✅ Inserts to public.users:                             │
│                                                          │
│  public.users:                                           │
│  {                                                       │
│    id: "uuid-auto-generated",    ← FROM auth.users       │
│    email: "author@example.com",   ← FROM auth.users       │
│    role: "author",                ← DEFAULT, NOT HARD!    │
│    created_at: "2026-03-04 10:30:00"                     │
│    updated_at: "2026-03-04 10:30:00"                     │
│  }                                                       │
│                                                          │
│  ✅ Also creates public.authors:                         │
│  {                                                       │
│    id: "uuid-auto-generated",                            │
│    user_id: "uuid-from-users",    ← LINKS TO AUTHORS     │
│    name: "Author",                ← DEFAULT NAME          │
│    bio: null,                                             │
│    avatar_url: null                                       │
│  }                                                       │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ↓
┌──────────────────────────────────────────────────────────┐
│ USER IS LOGGED IN                                        │
│  ✅ Session created                                      │
│  ✅ Cookies set                                          │
│  ✅ Role = 'author' (visible in app)                     │
│  ✅ Can access /dashboard                                │
│  ✅ Author permissions only                              │
└──────────────────────────────────────────────────────────┘
```

### Scenario 2: Promoting User to Admin

```
┌──────────────────────────────────────────────────────────┐
│ ADMIN (YOU) RUNS SQL COMMAND                             │
│  UPDATE public.users                                     │
│  SET role = 'admin'                                      │
│  WHERE email = 'author@example.com';                     │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ↓
┌──────────────────────────────────────────────────────────┐
│ DATABASE UPDATES USER RECORD                             │
│  public.users:                                           │
│  {                                                       │
│    id: "uuid",                                           │
│    email: "author@example.com",                          │
│    role: "author"  → CHANGED TO → "admin",  ← MANUALLY   │
│    updated_at: "2026-03-04 10:35:00"  ← AUTO-UPDATED     │
│  }                                                       │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ↓
┌──────────────────────────────────────────────────────────┐
│ USER LOGS OUT & LOG BACK IN                              │
│  (Or session is refreshed)                               │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ↓
┌──────────────────────────────────────────────────────────┐
│ MIDDLEWARE VERIFIES ROLE FROM DATABASE                   │
│  SELECT role FROM public.users WHERE id = auth.uid();    │
│  ✅ Returns: "admin"                                     │
│  ✅ Updates session with new role                        │
│                                                          │
│ Now user has ADMIN permissions:                          │
│  ✅ Can view all articles (draft/pending/published)      │
│  ✅ Can create categories                                │
│  ✅ Can delete authors                                   │
│  ✅ Can publish articles directly                        │
└──────────────────────────────────────────────────────────┘
```

### Scenario 3: Author Creates an Article

```
┌──────────────────────────────────────────────────────────┐
│ LOGGED IN AUTHOR CREATES ARTICLE                         │
│  Title: "AI Breakthroughs in 2026"                       │
│  Content: [TipTap JSON content]                          │
│  Author: author@example.com (ID from session)            │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ↓
┌──────────────────────────────────────────────────────────┐
│ RLS CHECK: articles_insert_authors POLICY                │
│  Checks: auth.uid() IN (SELECT user_id FROM authors)     │
│  ✅ User has author record                               │
│  ✅ User_id matches auth.uid()                           │
│  ✅ INSERT ALLOWED                                       │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ↓
┌──────────────────────────────────────────────────────────┐
│ DATABASE INSERTS ARTICLE                                 │
│  public.articles:                                        │
│  {                                                       │
│    id: "uuid-auto",                                      │
│    title: "AI Breakthroughs in 2026",                    │
│    slug: "ai-breakthroughs-in-2026",                     │
│    content_json: {TipTap JSON},                          │
│    author_id: [author UUID],  ← SET BY APP               │
│    status: "draft",           ← DEFAULT                   │
│    created_at: NOW(),         ← AUTO                      │
│    updated_at: NOW()          ← AUTO                      │
│  }                                                       │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ↓
┌──────────────────────────────────────────────────────────┐
│ ARTICLE IS STORED (status = "draft")                     │
│  ✅ Only author can see it (RLS policy)                  │
│  ❌ Not visible to other authors                         │
│  ❌ Not visible to public                                │
│  ✅ Admin can see it                                     │
└──────────────────────────────────────────────────────────┘
```

### Scenario 4: Public Tries to View Article

```
┌──────────────────────────────────────────────────────────┐
│ PUBLIC USER (ANONYMOUS) TRIES TO VIEW ARTICLE            │
│  GET /api/articles/ai-breakthroughs-in-2026              │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ↓
┌──────────────────────────────────────────────────────────┐
│ RLS CHECK: articles_select_policy POLICY                 │
│  SELECT * FROM public.articles                           │
│  WHERE [RLS condition...]                                │
│                                                          │
│  RLS Condition:                                          │
│  status = 'published'                                    │
│  OR auth.uid() IN (SELECT user_id FROM authors)         │
│  OR auth.uid() IN (SELECT id FROM users WHERE...)        │
│                                                          │
│  User is anonymous:                                      │
│  ✅ auth.uid() = NULL                                    │
│  ❌ status = 'draft' (not published)                     │
│  ❌ Not an author                                        │
│  ❌ Not an admin                                         │
│                                                          │
│  RESULT: 0 rows returned                                │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ↓
┌──────────────────────────────────────────────────────────┐
│ APPLICATION RETURNS 404 OR EMPTY                         │
│  Article is hidden! 🔒                                   │
│  ✅ SECURITY WORKING                                     │
└──────────────────────────────────────────────────────────┘
```

### Scenario 5: Admin Publishes Article

```
┌──────────────────────────────────────────────────────────┐
│ ADMIN CLICKS "PUBLISH" ON DRAFT ARTICLE                  │
│  Current status: "draft"                                 │
│  New status: "published"                                 │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ↓
┌──────────────────────────────────────────────────────────┐
│ RLS CHECK: articles_update_policy POLICY                 │
│  UPDATE public.articles SET status = 'published'         │
│  WHERE id = [article_id]                                 │
│                                                          │
│  Checks: auth.uid() IN (SELECT id FROM users WHERE...)   │
│  ✅ User is admin                                        │
│  ✅ UPDATE ALLOWED                                       │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ↓
┌──────────────────────────────────────────────────────────┐
│ DATABASE UPDATES ARTICLE                                 │
│  public.articles:                                        │
│  {                                                       │
│    id: "uuid",                                           │
│    status: "draft" → "published"  ← CHANGED               │
│    published_at: NULL → NOW()     ← AUTO-SET              │
│    updated_at: NOW()              ← AUTO-UPDATED          │
│  }                                                       │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ↓
┌──────────────────────────────────────────────────────────┐
│ ARTICLE IS NOW PUBLIC                                    │
│  ✅ Visible to all users                                 │
│  ✅ Published on homepage                                │
│  ✅ Public can read it now                               │
│  ✅ Author can still edit it                             │
│  ✅ Admin can delete it                                  │
└──────────────────────────────────────────────────────────┘
```

---

## Permission Matrix

```
┌──────────────────────────────────────────────────────────────────┐
│                         PERMISSION MATRIX                        │
├──────────────────────────────────────┬───────────┬──────────────┤
│ ACTION                               │ AUTHOR    │ ADMIN        │
├──────────────────────────────────────┼───────────┼──────────────┤
│ View own draft articles              │ ✅        │ ✅           │
│ View others' draft articles          │ ❌        │ ✅           │
│ View published articles              │ ✅        │ ✅           │
│ Create articles (as draft)           │ ✅        │ ✅           │
│ Edit own articles                    │ ✅        │ ✅           │
│ Edit others' articles                │ ❌        │ ✅           │
│ Delete own articles                  │ ❌        │ ✅           │
│ Delete others' articles              │ ❌        │ ✅           │
│ Publish articles directly            │ ❌        │ ✅           │
│ Submit for review (pending)          │ ✅        │ ✅           │
│ Approve pending articles             │ ❌        │ ✅           │
│ Create categories                    │ ❌        │ ✅           │
│ Edit categories                      │ ❌        │ ✅           │
│ Delete categories                    │ ❌        │ ✅           │
│ Create tags                          │ ✅        │ ✅           │
│ Edit tags                            │ ❌        │ ✅           │
│ Delete tags                          │ ❌        │ ✅           │
│ Upload media                         │ ✅        │ ✅           │
│ Delete own media                     │ ✅        │ ✅           │
│ Delete others' media                 │ ❌        │ ✅           │
│ View user list                       │ ❌        │ ✅           │
│ Manage user roles                    │ ❌        │ ✅           │
│ Delete authors                       │ ❌        │ ✅           │
│ Access dashboard                     │ ✅        │ ✅           │
│                                      │ (limited) │ (full)       │
└──────────────────────────────────────┴───────────┴──────────────┘
```

---

## RLS Policy Enforcement Points

```
CLIENT APP                    DATABASE
    │                              │
    ├─ User fills form              │
    ├─ Click submit                 │
    │                               │
    └─→ API Route ────→ INSERT/UPDATE/SELECT
                             │
                             ↓
                        ┌─────────────────────┐
                        │  RLS POLICY CHECK   │
                        │  ┌───────────────┐  │
                        │  │ Get current   │  │
                        │  │ user role     │  │
                        │  └───────────────┘  │
                        │  ┌───────────────┐  │
                        │  │ Check record  │  │
                        │  │ ownership     │  │
                        │  └───────────────┘  │
                        │  ┌───────────────┐  │
                        │  │ Apply policy  │  │
                        │  │ condition     │  │
                        │  └───────────────┘  │
                        │         │           │
                        │         ↓           │
                        │   ✅ ALLOWED      │
                        │   ❌ DENIED       │
                        │         │           │
                        └─────────┼───────────┘
                                  │
                    ┌─────────────┴──────────────┐
                    │                            │
                    ↓                            ↓
              ✅ Query Executes           ❌ 403 Forbidden
              ✅ Returns data             ❌ Zero rows
```

---

## No Hardcoding! 🎯

```
❌ BAD (Don't do this):
   if (email === 'admin@example.com') {
     role = 'admin';
   }
   // Hardcoded! Anyone with that email is admin!

✅ GOOD (What we do):
   - User signs up
   - Trigger sets role = 'author'
   - Admin manually updates in database
   - No hardcoding in code!
   - Anyone can be made admin
   - Easy to change later
   - Secure!
```

---

## Security Layers

```
┌────────────────────────────────────────┐
│ LAYER 1: Application Logic             │
│ (Next.js middleware, components)       │
└────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────┐
│ LAYER 2: API Route Authorization       │
│ (Check auth.uid() in routes)            │
└────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────┐
│ LAYER 3: Supabase Row Level Security   │
│ (Database-level enforcement)           │
│ (Most secure - can't be bypassed!)     │
└────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────┐
│ LAYER 4: Database Constraints          │
│ (Foreign keys, NOT NULL, UNIQUE)       │
└────────────────────────────────────────┘
```

The RLS is the **most important** because:
- It works at the database level
- Can't be bypassed by hacking the API
- Even if middleware fails, RLS protects
- Direct database queries are protected

---

## Summary

✅ **This architecture provides:**
1. **No hardcoded credentials** - Dynamic role assignment
2. **Strong access control** - RLS at database level
3. **Scalability** - Works for 1 user or 1 million
4. **Security** - Multi-layered protection
5. **Maintainability** - Easy to change roles
6. **Production-ready** - Enterprise-grade design
