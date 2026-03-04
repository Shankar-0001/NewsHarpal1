# 📰 News CMS - Complete Project Documentation

## 🎯 Project Overview

**News CMS** is a full-featured, production-ready Content Management System built specifically for news publishing. It provides a modern, professional platform for managing news articles, authors, categories, and media with advanced features like SEO optimization, role-based access control, and a rich text editor.

---

## 🏗️ Technology Stack

### **Frontend**
- **Next.js 14** (App Router) - React framework with server-side rendering
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React component library
- **TipTap** - Rich text WYSIWYG editor
- **Lucide React** - Icon library
- **next-themes** - Dark mode support

### **Backend**
- **Next.js API Routes** - Serverless API endpoints
- **Supabase** - Backend-as-a-Service
  - PostgreSQL Database
  - Authentication (Email/Password)
  - Row Level Security (RLS)
  - Storage for media files

### **Database**
- **PostgreSQL** (via Supabase)
- Tables: users, authors, articles, categories, tags, article_tags, media_library, slug_history

---

## 📁 Project Structure

```
/app
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Protected dashboard routes
│   │   ├── articles/           # Article management
│   │   │   ├── page.jsx        # Articles list
│   │   │   ├── new/page.jsx    # Create new article
│   │   │   └── [id]/           
│   │   │       ├── page.jsx    # View article
│   │   │       └── edit/page.jsx # Edit article
│   │   ├── authors/            # Author management
│   │   ├── categories/         # Category management
│   │   ├── media/              # Media library
│   │   └── layout.jsx          # Dashboard layout with sidebar
│   │
│   ├── [categorySlug]/         # Public category pages
│   │   └── [articleSlug]/      # Public article pages
│   │       └── page.js
│   │
│   ├── login/page.jsx          # Login page
│   ├── signup/page.jsx         # Signup page
│   ├── page.js                 # Homepage
│   ├── layout.js               # Root layout
│   └── globals.css             # Global styles
│
├── components/                  # React components
│   ├── ads/                    # AdSense components
│   │   └── AdComponent.jsx
│   ├── common/                 # Common components
│   │   └── BreakingNewsTicker.jsx
│   ├── editor/                 # Rich text editor
│   │   └── TiptapEditor.jsx
│   ├── layout/                 # Layout components
│   │   ├── PublicHeader.jsx
│   │   ├── Sidebar.jsx
│   │   └── Header.jsx
│   ├── seo/                    # SEO components
│   │   └── StructuredData.jsx
│   └── ui/                     # shadcn/ui components
│       ├── button.jsx
│       ├── card.jsx
│       ├── dialog.jsx
│       └── ... (30+ components)
│
├── lib/                         # Utility libraries
│   └── supabase/               # Supabase clients
│       ├── client.js           # Client-side Supabase
│       ├── server.js           # Server-side Supabase (SSR)
│       └── admin.js            # Admin Supabase (service role)
│
├── scripts/                     # Database seeding scripts
│   ├── seed.mjs                # Original seeding script
│   ├── seed-fixed.mjs          # Fixed seeding script (use this)
│   ├── check-schema.mjs        # Schema diagnostic tool
│   └── test-user-creation.mjs  # User creation test
│
├── supabase/                    # Supabase configuration
│   ├── schema_only.sql         # Complete schema setup
│   ├── disable_triggers.sql    # Disable triggers (for seeding)
│   ├── enable_triggers.sql     # Re-enable triggers
│   ├── fix_trigger.sql         # Fix broken trigger
│   └── migrations/             # Old migration files
│
├── middleware.js                # Authentication middleware
├── .env                         # Environment variables
├── package.json                 # Dependencies
├── tailwind.config.js           # Tailwind configuration
├── next.config.js               # Next.js configuration
│
└── Documentation/
    ├── DATABASE_SETUP_GUIDE.md
    ├── FIXED_SEEDING_GUIDE.md
    ├── QUICKSTART.md
    └── PROJECT_DOCUMENTATION.md (this file)
```

---

## 🗄️ Database Schema

### **Tables**

#### 1. `users`
Synced with Supabase Auth users.
```sql
- id: UUID (Primary Key, FK to auth.users)
- email: TEXT (Unique)
- role: user_role ENUM ('admin', 'author')
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### 2. `authors`
Author profiles linked to users.
```sql
- id: UUID (Primary Key)
- user_id: UUID (FK to users, Unique)
- name: TEXT
- bio: TEXT
- avatar_url: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### 3. `categories`
Article categories (Technology, Business, etc.)
```sql
- id: UUID (Primary Key)
- name: TEXT
- slug: TEXT (Unique)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### 4. `tags`
Article tags for organization.
```sql
- id: UUID (Primary Key)
- name: TEXT
- slug: TEXT (Unique)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### 5. `articles`
Main content table.
```sql
- id: UUID (Primary Key)
- title: TEXT
- slug: TEXT (Unique)
- excerpt: TEXT
- content: TEXT (HTML)
- content_json: JSONB (TipTap JSON format)
- featured_image_url: TEXT
- author_id: UUID (FK to authors)
- category_id: UUID (FK to categories)
- status: article_status ENUM ('draft', 'pending', 'published')
- seo_title: TEXT
- seo_description: TEXT
- published_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### 6. `article_tags`
Junction table for articles and tags (many-to-many).
```sql
- article_id: UUID (FK to articles)
- tag_id: UUID (FK to tags)
- PRIMARY KEY (article_id, tag_id)
```

#### 7. `media_library`
Uploaded media files.
```sql
- id: UUID (Primary Key)
- filename: TEXT
- file_url: TEXT
- file_type: TEXT
- file_size: INTEGER
- uploaded_by: UUID (FK to users)
- created_at: TIMESTAMPTZ
```

#### 8. `slug_history`
SEO: Track article slug changes for redirects.
```sql
- id: UUID (Primary Key)
- article_id: UUID (FK to articles)
- old_slug: TEXT
- new_slug: TEXT
- created_at: TIMESTAMPTZ
```

---

## 🔐 Authentication & Authorization

### **Authentication Method**
- Email/Password via Supabase Auth
- Email confirmation enabled
- Password requirements: Minimum 6 characters

### **User Roles**

#### **Admin**
- Full access to all features
- Can manage all articles, categories, tags
- Can manage all authors
- Can delete any content
- Access to all dashboard sections

#### **Author**
- Can create and edit own articles
- Can upload media
- Can view all published articles
- Cannot manage categories or tags
- Cannot manage other authors

### **Row Level Security (RLS)**
All tables have RLS policies:
- **Public Read**: Published articles, categories, tags, authors
- **Authenticated Write**: Users can create/edit their own content
- **Admin Override**: Admins can manage all content

---

## ✨ Features

### **Public Features**
✅ Modern newspaper-style homepage
✅ Article listing with pagination
✅ Individual article pages with full content
✅ Category pages
✅ Tag pages
✅ Breaking news ticker
✅ Trending articles sidebar
✅ Search functionality (in header)
✅ Dark mode support
✅ Fully responsive design
✅ SEO-optimized with structured data
✅ Fast page loads with ISR (Incremental Static Regeneration)

### **Dashboard Features**
✅ Article Management
  - Create, Read, Update, Delete (CRUD)
  - Rich text editor (TipTap) with:
    - Bold, Italic, Underline
    - Headings (H1-H6)
    - Lists (ordered, unordered)
    - Links
    - Images
    - YouTube embeds
    - Tables
    - Code blocks
  - Draft/Pending/Published workflow
  - Featured image upload
  - SEO fields (title, description)
  - Category and tag assignment
  - Article preview

✅ Author Management
  - View all authors
  - Edit author profiles
  - Avatar management

✅ Category Management
  - Create categories
  - Edit/delete categories
  - Slug management

✅ Media Library
  - Upload images
  - View all media
  - Delete media
  - File type/size info

✅ User Profile
  - Edit profile
  - Change password
  - Role display

### **SEO Features**
✅ Dynamic meta tags (title, description, OG tags)
✅ Structured data (JSON-LD schemas)
  - Article schema
  - Organization schema
  - Website schema
✅ Sitemap generation (planned)
✅ Slug history for 301 redirects
✅ Clean URL structure: `/category-slug/article-slug`

### **Performance Features**
✅ Server-side rendering (SSR) for dynamic content
✅ Static generation for public pages
✅ Image optimization with Next.js Image
✅ Code splitting
✅ Lazy loading

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ installed
- Supabase account and project
- Environment variables configured

### **Environment Variables**
Required in `.env` file:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Optional
NEXT_PUBLIC_ADS_ENABLED=false
```

### **Installation**
```bash
# Install dependencies
yarn install

# Run development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start
```

---

## 🗃️ Database Setup

### **Initial Setup**

1. **Create Schema** (Supabase SQL Editor):
   ```
   Run: /app/supabase/schema_only.sql
   ```

2. **Disable Triggers** (if user creation fails):
   ```
   Run: /app/supabase/disable_triggers.sql
   ```

3. **Seed Database**:
   ```bash
   node /app/scripts/seed-fixed.mjs
   ```

4. **Re-enable Triggers**:
   ```
   Run: /app/supabase/enable_triggers.sql
   ```

### **Seeded Data**
- 5 Users (1 admin + 4 authors)
- 5 Author profiles
- 10 Categories
- 15 Tags
- 10 Published articles

### **Default Admin Account**
```
Email: admin@newscms.com
Password: Admin@123456
```

---

## 🎨 Design System

### **Color Palette**
- **Primary**: Blue (#0066CC)
- **Secondary**: Gray
- **Success**: Green
- **Warning**: Orange
- **Error**: Red
- **Dark Mode**: Full support with automatic switching

### **Typography**
- **Font**: System font stack (optimized for performance)
- **Headings**: Bold, various sizes (text-xl to text-5xl)
- **Body**: text-base (16px)

### **Components**
30+ shadcn/ui components:
- Buttons, Cards, Dialogs, Forms
- Tables, Badges, Alerts, Toasts
- Dropdowns, Selects, Checkboxes
- And more...

---

## 🔧 Development

### **Adding New Features**

#### Add a New Page
1. Create file in `/app/your-page/page.jsx`
2. Export default async component
3. Add to navigation if needed

#### Add New Component
1. Create in `/components/category/ComponentName.jsx`
2. Use 'use client' directive if needed (for interactivity)
3. Import and use in pages

#### Add New Database Table
1. Create migration SQL in `/supabase/migrations/`
2. Add RLS policies
3. Update TypeScript types (if using)

### **Code Conventions**
- **Components**: PascalCase (`UserProfile.jsx`)
- **Files**: kebab-case (`user-profile.jsx`) for pages
- **Functions**: camelCase (`getUserProfile`)
- **Use async/await** for database operations
- **Use Tailwind classes** for styling (avoid custom CSS)

---

## 📊 API Routes

### **Authentication**
- Handled via Supabase Auth
- Session management via cookies
- Middleware protects routes

### **Data Fetching**
- **Server Components**: Direct Supabase queries
- **Client Components**: Use `useEffect` + Supabase client
- **API Routes**: `/app/api/` (if needed for custom logic)

---

## 🔒 Security

### **Implemented**
✅ Row Level Security (RLS) on all tables
✅ Authentication required for dashboard
✅ CSRF protection (Next.js built-in)
✅ SQL injection prevention (Supabase client)
✅ XSS protection (React escaping)

### **Best Practices**
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client
- Use `auth.uid()` in RLS policies
- Validate user input
- Use prepared statements

---

## 🐛 Troubleshooting

### **Common Issues**

#### "No articles found"
- Database not seeded → Run `node /app/scripts/seed-fixed.mjs`
- Articles not published → Check `status = 'published'`
- RLS blocking access → Check policies in Supabase

#### "Cannot login"
- User not created → Run seeding script
- Wrong credentials → Use: `admin@newscms.com` / `Admin@123456`
- Trigger broken → Disable triggers, seed, re-enable

#### "Database error creating new user"
- Trigger failing → Run `/app/supabase/disable_triggers.sql`
- Schema mismatch → Check trigger function matches schema

#### "Failed to fetch"
- Supabase credentials wrong → Check `.env` file
- Network issue → Check Supabase project is active
- CORS issue → Check Supabase dashboard settings

---

## 📈 Performance Optimization

### **Implemented**
- ✅ Next.js Image optimization
- ✅ Server-side rendering for SEO
- ✅ Code splitting
- ✅ Static asset caching
- ✅ Database indexes on frequently queried columns

### **Future Improvements**
- [ ] Implement ISR (Incremental Static Regeneration) for articles
- [ ] Add Redis caching for popular articles
- [ ] Implement CDN for images
- [ ] Add service worker for offline support

---

## 🚢 Deployment

### **Deployment Options**

#### **Vercel** (Recommended)
1. Push code to GitHub
2. Connect Vercel to repository
3. Add environment variables
4. Deploy automatically

#### **Docker**
```bash
# Build image
docker build -t news-cms .

# Run container
docker run -p 3000:3000 --env-file .env news-cms
```

#### **Traditional Server**
```bash
yarn build
yarn start
```

### **Environment Variables**
Ensure all required env vars are set in deployment platform.

---

## 📚 Additional Resources

### **Documentation Files**
- `DATABASE_SETUP_GUIDE.md` - Detailed database setup
- `FIXED_SEEDING_GUIDE.md` - Seeding troubleshooting
- `QUICKSTART.md` - Quick start guide

### **External Documentation**
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TipTap Docs](https://tiptap.dev/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)

---

## 📞 Support

### **Getting Help**
1. Check documentation files
2. Review troubleshooting section
3. Check Supabase logs in dashboard
4. Check browser console for errors

---

## 🎯 Roadmap

### **Phase 1: Core Features** ✅ COMPLETE
- [x] User authentication
- [x] Article CRUD
- [x] Rich text editor
- [x] Category management
- [x] Media library
- [x] SEO optimization

### **Phase 2: Enhancement** 🚧 IN PROGRESS
- [x] Dark mode
- [x] Breaking news ticker
- [ ] Comment system
- [ ] Social sharing
- [ ] Email notifications

### **Phase 3: Advanced** 📋 PLANNED
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Newsletter integration
- [ ] Paywall/subscriptions
- [ ] Mobile app

---

## 📄 License

This project is proprietary. All rights reserved.

---

## 👥 Credits

**Built with:**
- Next.js - React Framework
- Supabase - Backend Platform
- TipTap - Rich Text Editor
- shadcn/ui - Component Library
- Tailwind CSS - Styling
- Lucide - Icons

---

**Last Updated:** June 2025  
**Version:** 1.0.0  
**Status:** Production Ready (pending final database seeding)

---

## 🆘 Quick Reference

### **Important Commands**
```bash
# Development
yarn dev                              # Start dev server

# Database
node /app/scripts/seed-fixed.mjs     # Seed database

# Production
yarn build                           # Build for production
yarn start                           # Start production server
```

### **Important URLs**
- Homepage: `/`
- Login: `/login`
- Signup: `/signup`
- Dashboard: `/dashboard`
- Article: `/[category]/[slug]`

### **Admin Credentials**
- Email: `admin@newscms.com`
- Password: `Admin@123456`

---

**Need help? Refer to the troubleshooting section or check the documentation files in the project root.**
