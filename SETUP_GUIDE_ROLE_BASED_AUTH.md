# 🚀 COMPLETE DATABASE SETUP GUIDE - Role-Based Authentication

## Overview
This guide explains how to set up your Supabase database with **ZERO hardcoded credentials**. All user roles are assigned dynamically based on signup and manually updated for admins.

---

## 📋 What's Included

Your `COMPLETE_FRESH_SETUP.sql` file contains:

✅ **Complete table drops** - Clean slate (no orphaned data)  
✅ **Full schema creation** - All tables from scratch  
✅ **Row Level Security (RLS)** - Fine-grained access control  
✅ **Automatic triggers** - User creation on signup  
✅ **Role assignment logic** - NO hardcoding  
✅ **Storage bucket** - For media uploads  
✅ **Indexes** - For performance  
✅ **Categories & Tags** - Pre-populated  

---

## 🔧 Setup Instructions (5 Steps)

### Step 1: Go to Supabase SQL Editor
1. Log in to [Supabase](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)

### Step 2: Create New SQL Query
1. Click **New Query** button
2. A blank editor will open

### Step 3: Copy the Complete SQL
1. Open this file: `COMPLETE_FRESH_SETUP.sql`
2. Copy the **entire** content (Ctrl+A, Ctrl+C)

### Step 4: Paste into Supabase
1. Paste the SQL into the Supabase editor (Ctrl+V)
2. Your editor should show ~1000 lines of SQL

### Step 5: Execute
1. Click the **RUN** button (or press Ctrl+Enter)
2. Wait for completion (should take 10-30 seconds)
3. You'll see verification messages at the bottom

✅ If you see `✅ DATABASE SETUP COMPLETE ✅`, you're done!

---

## 🎯 How Role-Based Authentication Works

### The Flow (NO Hardcoding)

```
User Signup
    ↓
[User fills form with email & password]
    ↓
Supabase Auth creates auth.users record
    ↓
TRIGGER: on_auth_user_created fires
    ↓
Automatically inserts into public.users:
{
  id: [from auth.users],
  email: [from form],
  role: 'author'  ← DEFAULT ROLE
}
    ↓
Also creates public.authors entry
    ↓
User can now login with author permissions
```

### Role Levels

#### 👤 **Author Role** (Default)
What they CAN do:
- ✅ Create new articles (status = draft)
- ✅ Edit their own articles
- ✅ Submit articles for review (status = pending)
- ✅ Upload media
- ✅ View published articles

What they CANNOT do:
- ❌ Edit other authors' articles
- ❌ Delete articles
- ❌ Publish articles directly
- ❌ Manage categories or tags
- ❌ Delete other authors

#### 👑 **Admin Role** (Manually Assigned)
What they CAN do:
- ✅ ALL of the above (author permissions)
- ✅ Edit/Delete ANY article
- ✅ Publish articles directly (no review needed)
- ✅ Create, edit, delete categories
- ✅ Create, edit, delete tags
- ✅ Delete authors
- ✅ Full dashboard access

---

## 📝 Creating Your First User

### Step 1: Access the Login Page
Go to your application: `http://localhost:3000/login`

### Step 2: Click "Sign Up"
Fill in:
- **Email**: `your-email@example.com`
- **Password**: `YourSecurePassword123`

### Step 3: Submit
- You'll be automatically logged in
- Your role will be `author` (automatic!)
- An author profile will be created

---

## 🔑 Making Yourself an Admin

Once you've signed up, you need to manually upgrade your role to admin:

### Option A: Using Supabase Dashboard (Easy)

1. Go to **Supabase Dashboard**
2. Select your project
3. Go to **SQL Editor**
4. Create **New Query**
5. Paste this command:

```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

6. Replace `your-email@example.com` with your actual email
7. Click **RUN**

✅ You're now an ADMIN!

### Option B: Using Database > Users Table (GUI)

1. Go to **Supabase Dashboard**
2. Click **Database** (left sidebar)
3. Select **public.users** table
4. Find your row
5. Click the `role` field and change from `author` to `admin`
6. Refresh the page

---

## 🛡️ How RLS (Row Level Security) Works

Your database uses RLS to enforce role-based access. Here's what each policy does:

### Articles Table (Most Important)

**SELECT Policy:**
```
✅ Can see published articles (anyone)
✅ Can see own articles (author)
✅ Can see all articles (admin)
❌ Cannot see other authors' draft articles
```

**INSERT Policy:**
```
✅ Authors can create articles
❌ Anonymous users cannot
```

**UPDATE Policy:**
```
✅ Authors can edit own articles
✅ Admins can edit any article
❌ Authors cannot edit other authors' articles
```

**DELETE Policy:**
```
✅ Authors can delete own articles
✅ Admins can delete any article
❌ Authors cannot delete other authors' articles
```

### Categories Table

**INSERT/UPDATE/DELETE:**
```
✅ Only admins can manage categories
❌ Authors cannot create/edit categories
```

### Tags Table

**INSERT:**
```
✅ Any authenticated user can create tags
```

**UPDATE/DELETE:**
```
✅ Only admins can update/delete tags
```

---

## 📊 Database Schema

### Key Tables

#### `public.users`
```
id           (UUID) → References auth.users
email        (TEXT) → User email
role         (user_role) → 'admin' or 'author'
created_at   (TIMESTAMP)
updated_at   (TIMESTAMP)
```

#### `public.authors`
```
id           (UUID)
user_id      (UUID) → References public.users
name         (TEXT)
bio          (TEXT)
avatar_url   (TEXT)
created_at   (TIMESTAMP)
```

#### `public.articles`
```
id                 (UUID)
title              (TEXT)
slug               (TEXT - UNIQUE)
excerpt            (TEXT)
content            (TEXT)
content_json       (JSONB) → For TipTap editor
featured_image_url (TEXT)
author_id          (UUID) → References public.authors
category_id        (UUID) → References public.categories
status             (article_status) → 'draft', 'pending', 'published'
seo_title          (TEXT)
seo_description    (TEXT)
published_at       (TIMESTAMP)
created_at         (TIMESTAMP)
updated_at         (TIMESTAMP)
```

#### `public.categories`
```
id          (UUID)
name        (TEXT)
slug        (TEXT - UNIQUE)
description (TEXT)
created_at  (TIMESTAMP)
updated_at  (TIMESTAMP)
```

#### `public.tags`
```
id         (UUID)
name       (TEXT)
slug       (TEXT - UNIQUE)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### `public.article_tags`
Many-to-many junction table:
```
article_id (UUID) → References public.articles
tag_id     (UUID) → References public.tags
PRIMARY KEY (article_id, tag_id)
```

#### `public.media_library`
```
id          (UUID)
filename    (TEXT)
file_url    (TEXT)
file_type   (TEXT)
file_size   (INTEGER)
uploaded_by (UUID) → References public.users
created_at  (TIMESTAMP)
```

---

## 🔒 Security Features

✅ **No Hardcoded Credentials**
- All roles assigned dynamically
- Users get 'author' role on signup
- Admins set manually via UPDATE query

✅ **Row Level Security (RLS)**
- Draft articles hidden from public
- Authors can only edit own articles
- Admins can access everything

✅ **Automatic Timestamps**
- `created_at` - Set on record creation
- `updated_at` - Auto-updated on changes

✅ **Triggers**
- `on_auth_user_created` - Creates user on signup
- `update_*_updated_at` - Updates timestamps
- `on_article_slug_change` - Tracks slug changes

✅ **Indexes**
- All key columns indexed for performance
- Published articles indexed for fast queries

---

## 🆘 Troubleshooting

### Issue: Users can't login
**Solution:**
1. Check `public.users` table exists
2. Verify `on_auth_user_created` trigger exists
3. Try signing up again (this creates the user)

### Issue: Can't see articles in dashboard
**Solution:**
1. Verify your role: `SELECT role FROM public.users WHERE id = auth.uid();`
2. Check article `author_id` matches
3. Check article `status` is not `draft`

### Issue: Can't create categories
**Solution:**
1. Verify you're admin: `SELECT role FROM public.users WHERE email = YOUR_EMAIL;`
2. If author, run the UPDATE command above to make yourself admin
3. Try again

### Issue: "Permission denied" errors
**Solution:**
1. This is RLS working correctly
2. Check if you have the right role
3. Check if you own the resource
4. If admin, check RLS policy for `role = 'admin'`

---

## 📱 Testing the System

### Test 1: Create an Author Account
1. Sign up with Email: `author1@test.com`
2. Verify role is 'author' in `public.users`
3. Verify author profile created in `public.authors`

### Test 2: Verify Draft Article Privacy
1. Login as author1@test.com
2. Create an article (defaults to draft)
3. In incognito window, try to view that article
4. ✅ Should get 401 or not see it (RLS working!)

### Test 3: Make Admin and Test Permissions
1. Upgrade author1@test.com to admin
2. Try creating a category
3. ✅ Should succeed (admin can create categories)
4. Switch back to window with author role
5. ✅ Category creation should fail (authors can't)

---

## 🚀 Next Steps

After setup:

1. **Start your app:**
   ```bash
   npm run dev
   ```

2. **Sign up your first user**

3. **Make yourself admin**

4. **Create test articles**

5. **Publish and view on homepage**

---

## 📞 Support

If you have issues:

1. Check the Supabase logs: **Logs** tab in Supabase
2. Verify all tables exist: `pg_tables` query
3. Check RLS policies are enabled
4. Verify triggers are created
5. Test with simple SELECT queries first

---

**✅ You're all set! Your database is production-ready with role-based authentication!**
