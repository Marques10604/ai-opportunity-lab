
ALTER TABLE public.detected_problems
ADD COLUMN IF NOT EXISTS impact_level text DEFAULT 'Medium',
ADD COLUMN IF NOT EXISTS timing_status text DEFAULT 'Emergente',
ADD COLUMN IF NOT EXISTS complaint_examples jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS related_tools jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS niche_category text;
