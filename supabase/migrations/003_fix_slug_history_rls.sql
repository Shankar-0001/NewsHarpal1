-- Fix for slug_history RLS policies

-- Enable RLS on slug_history table
ALTER TABLE public.slug_history ENABLE ROW LEVEL SECURITY;

-- Anyone can view slug history (needed for 301 redirects)
CREATE POLICY "Anyone can view slug history" ON public.slug_history
  FOR SELECT USING (true);

-- Only system/authenticated users can manage slug history
-- (This happens automatically via trigger, but adding policy for safety)
CREATE POLICY "System can manage slug history" ON public.slug_history
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );