
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Opportunities table
CREATE TABLE public.opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  problem TEXT,
  niche TEXT,
  solution TEXT,
  market_score INTEGER DEFAULT 0,
  competition_level TEXT DEFAULT 'Medium',
  difficulty_level TEXT DEFAULT 'Medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own opportunities" ON public.opportunities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own opportunities" ON public.opportunities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own opportunities" ON public.opportunities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own opportunities" ON public.opportunities FOR DELETE USING (auth.uid() = user_id);

-- Trends table
CREATE TABLE public.trends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  growth_score INTEGER DEFAULT 0,
  source TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.trends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own trends" ON public.trends FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own trends" ON public.trends FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Niches table
CREATE TABLE public.niches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  niche_name TEXT NOT NULL,
  audience TEXT,
  demand_score INTEGER DEFAULT 0,
  competition_score INTEGER DEFAULT 0
);
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own niches" ON public.niches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own niches" ON public.niches FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tools table
CREATE TABLE public.tools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  category TEXT,
  website TEXT,
  description TEXT
);
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own tools" ON public.tools FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tools" ON public.tools FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Agents table
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  role TEXT,
  status TEXT DEFAULT 'idle',
  last_run TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own agents" ON public.agents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own agents" ON public.agents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own agents" ON public.agents FOR UPDATE USING (auth.uid() = user_id);
