
ALTER TABLE public.detected_problems
ADD COLUMN viral_score INTEGER DEFAULT 0;

-- Update existing records
UPDATE public.detected_problems
SET viral_score = COALESCE(frequency_score, 0) + COALESCE(urgency_score, 0);
