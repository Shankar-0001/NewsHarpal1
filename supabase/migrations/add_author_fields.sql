-- Add missing fields to authors table
ALTER TABLE public.authors 
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS authors_slug_idx ON public.authors(slug) WHERE slug IS NOT NULL;

-- Add comment to explain social_links structure
COMMENT ON COLUMN public.authors.social_links IS 'JSON object with social media links: {twitter, linkedin, website}';
