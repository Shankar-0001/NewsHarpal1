# 🚀 News CMS Database Setup Guide

## Overview
This guide will help you set up and seed your News CMS database properly using the automated seeding script.

---

## Prerequisites

✅ Supabase project created and configured
✅ Environment variables set in `.env` file:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 1: Create Database Schema

Before running the seed script, you need to ensure your database schema is set up. 

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `/app/supabase/schema_only.sql`
4. Click **Run** to execute the schema creation

### Option B: Check if Tables Already Exist

If you've already run migrations or setup scripts, you can verify your tables exist:

```sql
-- Run this in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these tables:
- `users`
- `authors`
- `categories`
- `tags`
- `articles`
- `article_tags`
- `media_library`
- `slug_history`

---

## Step 2: Run the Seeding Script

The seeding script will:
- ✅ Create users via Supabase Auth (proper way)
- ✅ Create authors linked to those users
- ✅ Create 10 categories
- ✅ Create 15 tags
- ✅ Create 10 fully-featured news articles
- ✅ Link articles to tags
- ✅ Create your admin account

### Execute the Script

From your terminal in the `/app` directory, run:

```bash
node scripts/seed.mjs
```

### Expected Output

You should see:
```
🚀 Starting News CMS Database Seeding...

✅ Connected to Supabase successfully

📝 Step 1: Creating users via Supabase Auth...
  ✅ Created user: admin@newscms.com (uuid)
  ✅ Created user: john.doe@newscms.com (uuid)
  ...

📝 Step 2: Creating authors...
  ✅ Created author: Admin User (uuid)
  ...

📝 Step 3: Creating categories...
  ✅ Created category: Technology
  ...

📝 Step 4: Creating tags...
  ✅ Created 15 tags

📝 Step 5: Creating articles...
  ✅ Created article: Artificial Intelligence Revolutionizes Healthcare...
  ...

============================================================
🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!
============================================================

📊 Summary:
  👥 Users: 5
  ✍️  Authors: 5
  📁 Categories: 10
  🏷️  Tags: 15
  📰 Articles: 10

🔐 Admin Credentials:
  Email: admin@newscms.com
  Password: Admin@123456

🚀 You can now:
  1. Login at: https://your-app-url/login
  2. View articles at: https://your-app-url
  3. Access dashboard at: https://your-app-url/dashboard

✨ Happy publishing!
```

---

## Step 3: Verify the Setup

### Check the Public Homepage
1. Visit your application's homepage
2. You should see 10 news articles displayed
3. Click on any article to view the full content

### Login to Admin Dashboard
1. Go to `/login`
2. Use these credentials:
   - **Email:** `admin@newscms.com`
   - **Password:** `Admin@123456`
3. You should be redirected to `/dashboard`
4. You should see:
   - Articles list (10 published articles)
   - Categories list (10 categories)
   - Authors list (5 authors)
   - Media library (empty initially)

---

## Troubleshooting

### Error: "Failed to connect to Supabase"
- Verify your `.env` file has correct Supabase credentials
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set (not just the anon key)
- Ensure your Supabase project is active

### Error: "relation 'public.users' does not exist"
- You need to run the schema setup first (Step 1)
- Go to Supabase SQL Editor and run `schema_only.sql`

### Error: "User already exists"
- This is safe to ignore - the script will skip existing users
- If you want to start fresh, you can delete users from Supabase Auth dashboard

### Error: Foreign key constraint violations
- Ensure the schema was created properly with all foreign key relationships
- The seed script handles relationships automatically

### Script runs but homepage shows no articles
- Check that articles have `status = 'published'`
- Verify RLS (Row Level Security) policies are set correctly
- Check browser console for any API errors

---

## Additional Users Created

Besides the admin account, the script creates these author accounts (all with password: `Author@123456`):

1. **john.doe@newscms.com** - Technology Correspondent
2. **sarah.johnson@newscms.com** - Health Reporter
3. **michael.chen@newscms.com** - Business Journalist
4. **emma.williams@newscms.com** - Climate Reporter

You can login with any of these to test author-level permissions.

---

## Re-running the Script

The script is **idempotent**, meaning you can run it multiple times safely:
- Existing users won't be duplicated
- Existing articles won't be duplicated
- Only missing data will be created

---

## Next Steps

After successful seeding:

1. ✅ **Test the login flow** with admin credentials
2. ✅ **Browse the public site** to see articles
3. ✅ **Access the dashboard** to manage content
4. ✅ **Create a new article** using the TipTap editor
5. ✅ **Upload images** to test media library
6. ✅ **Test different user roles** (admin vs author)

---

## Support

If you encounter any issues not covered here:
1. Check the Supabase dashboard logs
2. Check browser console for errors
3. Verify all environment variables are correctly set
4. Ensure your Supabase project has no billing issues

---

**Ready to start? Run the seeding script and let's get your News CMS live! 🚀**
