
CREATE TABLE public.saved_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.saved_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own saved readings"
  ON public.saved_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own saved readings"
  ON public.saved_readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own saved readings"
  ON public.saved_readings FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_saved_readings_user_date ON public.saved_readings (user_id, date DESC);
