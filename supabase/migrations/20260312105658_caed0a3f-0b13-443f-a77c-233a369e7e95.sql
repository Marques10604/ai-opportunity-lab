
-- Table for tool combinations and solutions
CREATE TABLE public.tool_combinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_problem_id UUID REFERENCES public.detected_problems(id) ON DELETE SET NULL,
  solution_name TEXT NOT NULL,
  solution_description TEXT,
  tools_used JSONB NOT NULL DEFAULT '[]'::jsonb,
  expected_result TEXT,
  innovation_score INTEGER DEFAULT 0,
  content_idea TEXT,
  video_script JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tool_combinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tool combinations" ON public.tool_combinations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tool combinations" ON public.tool_combinations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tool combinations" ON public.tool_combinations FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own tool combinations" ON public.tool_combinations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
