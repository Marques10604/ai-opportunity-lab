
CREATE TABLE public.detected_problems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  problem_title TEXT NOT NULL,
  problem_description TEXT,
  source_platform TEXT,
  frequency_score INTEGER DEFAULT 0,
  urgency_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.detected_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own detected problems"
ON public.detected_problems FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own detected problems"
ON public.detected_problems FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own detected problems"
ON public.detected_problems FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own detected problems"
ON public.detected_problems FOR DELETE
USING (auth.uid() = user_id);
