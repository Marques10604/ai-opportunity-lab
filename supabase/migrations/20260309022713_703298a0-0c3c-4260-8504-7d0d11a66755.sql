
CREATE TABLE public.problem_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pattern_title text NOT NULL,
  pattern_description text,
  related_problems jsonb DEFAULT '[]'::jsonb,
  total_occurrences integer DEFAULT 0,
  average_viral_score integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.problem_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own patterns" ON public.problem_patterns FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own patterns" ON public.problem_patterns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own patterns" ON public.problem_patterns FOR DELETE TO authenticated USING (auth.uid() = user_id);
