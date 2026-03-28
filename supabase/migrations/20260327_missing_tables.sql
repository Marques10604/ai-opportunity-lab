-- Vault Access Helper
CREATE OR REPLACE FUNCTION public.get_decrypted_secret(secret_name text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE decrypted_val text;
BEGIN
  SELECT decrypted_secret INTO decrypted_val
  FROM vault.decrypted_secrets WHERE name = secret_name;
  RETURN decrypted_val;
END; $$;

-- Pipeline Cache (TTL 15 dias)
CREATE TABLE IF NOT EXISTS public.pipeline_cache (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '15 days'),
  detected_problem_id uuid REFERENCES public.detected_problems(id) ON DELETE CASCADE,
  execution_id uuid,
  status text DEFAULT 'pending',
  tools jsonb DEFAULT '[]',
  combinations jsonb DEFAULT '[]',
  content_ideas jsonb DEFAULT '[]',
  video_script jsonb DEFAULT '{}',
  platform_content jsonb DEFAULT '{}',
  angles jsonb DEFAULT '[]',
  opportunity jsonb DEFAULT '{}'
);
ALTER TABLE public.pipeline_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.pipeline_cache FOR ALL USING (true);

-- Agent Activity para AG-UI Realtime
CREATE TABLE IF NOT EXISTS public.agent_activity (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  user_id uuid,
  execution_id uuid,
  event_type text,
  detail text,
  level text DEFAULT 'info'
);
ALTER TABLE public.agent_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.agent_activity FOR ALL USING (true);

-- Ensure table is added to realtime publication
-- Using a DO block to avoid errors if already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'agent_activity'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_activity;
  END IF;
END $$;

-- Blueprints técnicos
CREATE TABLE IF NOT EXISTS public.blueprints (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE,
  specification text,
  features jsonb DEFAULT '[]',
  ui_structure jsonb DEFAULT '[]',
  database_schema jsonb DEFAULT '[]',
  api_endpoints jsonb DEFAULT '[]',
  architecture_notes jsonb DEFAULT '[]'
);
ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.blueprints FOR ALL USING (true);

-- Landing Pages geradas
CREATE TABLE IF NOT EXISTS public.landing_pages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE,
  opportunity_title text,
  category text,
  html_content text,
  html_filename text
);
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.landing_pages FOR ALL USING (true);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_pipeline_cache_problem_id ON public.pipeline_cache(detected_problem_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_cache_status ON public.pipeline_cache(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_cache_expires ON public.pipeline_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_agent_activity_execution ON public.agent_activity(execution_id);
