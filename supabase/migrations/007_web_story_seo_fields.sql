-- SEO-only description for Web Stories (not shown in viewer body)
ALTER TABLE public.web_stories
  ADD COLUMN IF NOT EXISTS seo_description TEXT;

