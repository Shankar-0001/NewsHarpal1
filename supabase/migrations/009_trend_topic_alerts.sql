CREATE TABLE IF NOT EXISTS public.trend_topic_alerts (
  topic_slug TEXT PRIMARY KEY,
  topic_keyword TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_views BIGINT NOT NULL DEFAULT 0,
  alerted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trend_topic_alerts_alerted_at
  ON public.trend_topic_alerts(alerted_at DESC);

ALTER TABLE public.trend_topic_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage trend alerts" ON public.trend_topic_alerts;
CREATE POLICY "Admins can manage trend alerts" ON public.trend_topic_alerts
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

