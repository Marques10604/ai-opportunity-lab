-- Create content opportunities table
CREATE TABLE public.content_opportunities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  titulo_conteudo text NOT NULL,
  gancho text,
  tipo_conteudo text,
  roteiro_curto text,
  slides_carrossel jsonb DEFAULT '[]'::jsonb,
  plataforma text,
  pontuacao_viral integer DEFAULT 0,
  source_problem_id uuid REFERENCES public.detected_problems(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_opportunities ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own content opportunities"
  ON public.content_opportunities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content opportunities"
  ON public.content_opportunities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content opportunities"
  ON public.content_opportunities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content opportunities"
  ON public.content_opportunities FOR DELETE
  USING (auth.uid() = user_id);

-- Create post metrics table
CREATE TABLE public.post_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  post_id uuid REFERENCES public.content_opportunities(id) ON DELETE CASCADE,
  visualizacoes integer DEFAULT 0,
  curtidas integer DEFAULT 0,
  comentarios integer DEFAULT 0,
  compartilhamentos integer DEFAULT 0,
  salvamentos integer DEFAULT 0,
  data_coleta timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own post metrics"
  ON public.post_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own post metrics"
  ON public.post_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own post metrics"
  ON public.post_metrics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own post metrics"
  ON public.post_metrics FOR DELETE
  USING (auth.uid() = user_id);