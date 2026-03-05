-- Growth fields for Web Stories (non-breaking extension)
ALTER TABLE public.web_stories
  ADD COLUMN IF NOT EXISTS cta_text TEXT,
  ADD COLUMN IF NOT EXISTS cta_url TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_group_url TEXT,
  ADD COLUMN IF NOT EXISTS ad_slot TEXT;

