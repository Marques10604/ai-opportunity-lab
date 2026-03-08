CREATE TABLE public.agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_name text NOT NULL,
  action text NOT NULL,
  detail text,
  level text NOT NULL DEFAULT 'info',
  pipeline_run_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agent logs"
  ON public.agent_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent logs"
  ON public.agent_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert agent logs"
  ON public.agent_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can select agent logs"
  ON public.agent_logs FOR SELECT
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_logs;