-- Add nichos column to detected_problems
ALTER TABLE public.detected_problems 
ADD COLUMN IF NOT EXISTS nichos text;

-- Add oportunidades_geradas column to problem_patterns
ALTER TABLE public.problem_patterns 
ADD COLUMN IF NOT EXISTS oportunidades_geradas jsonb DEFAULT '[]'::jsonb;