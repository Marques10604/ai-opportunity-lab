
CREATE TABLE public.mvp_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  product_concept TEXT NOT NULL,
  core_features JSONB NOT NULL DEFAULT '[]',
  tech_stack JSONB NOT NULL DEFAULT '[]',
  ui_structure JSONB NOT NULL DEFAULT '[]',
  roadmap JSONB NOT NULL DEFAULT '[]',
  monetization TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mvp_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mvp plans" ON public.mvp_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own mvp plans" ON public.mvp_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mvp plans" ON public.mvp_plans FOR DELETE USING (auth.uid() = user_id);
