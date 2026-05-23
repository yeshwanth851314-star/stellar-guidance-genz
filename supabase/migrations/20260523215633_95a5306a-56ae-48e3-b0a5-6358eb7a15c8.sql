ALTER TABLE public.daily_content
  ADD COLUMN IF NOT EXISTS morning_guidance text,
  ADD COLUMN IF NOT EXISTS evening_guidance text;