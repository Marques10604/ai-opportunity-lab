-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS (CONTEÚDO INFINITO - AI OPPORTUNITY LAB)
-- Execute este script no SQL Editor do seu projeto Supabase externo (qizcuaknqrbfcohlixbc)

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABELA: detected_problems
create table if not exists public.detected_problems (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid not null,
    problem_title text not null,
    problem_description text,
    source_platform text,
    niche_category text,
    impact_level text,
    timing_status text,
    viral_score integer default 0,
    frequency_score integer default 0,
    urgency_score integer default 0,
    complaint_examples jsonb default '[]'::jsonb,
    related_tools jsonb default '[]'::jsonb,
    nichos text
);

-- 3. TABELA: niches
create table if not exists public.niches (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid not null,
    niche_name text not null,
    audience text,
    demand_score integer default 0,
    competition_score integer default 0
);

-- 4. TABELA: opportunities
create table if not exists public.opportunities (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid not null,
    title text not null,
    problem text,
    solution text,
    niche text,
    market_score integer default 0,
    difficulty_level text,
    competition_level text,
    source_pattern_id uuid
);

-- 5. TABELA: tools
create table if not exists public.tools (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid not null,
    tool_name text not null,
    description text,
    website text,
    category text
);

-- 6. TABELA: tool_combinations
create table if not exists public.tool_combinations (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid not null,
    solution_name text not null,
    solution_description text,
    expected_result text,
    innovation_score integer default 0,
    tools_used jsonb default '[]'::jsonb,
    content_idea text,
    video_script jsonb default '{}'::jsonb,
    business_idea jsonb default '{}'::jsonb,
    source_problem_id uuid references public.detected_problems(id) on delete set null
);

-- 7. TABELA: agents
create table if not exists public.agents (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid not null,
    agent_name text not null,
    role text,
    status text,
    last_run timestamp with time zone
);

-- 8. TABELA: agent_logs
create table if not exists public.agent_logs (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid not null,
    agent_name text not null,
    action text not null,
    detail text,
    level text default 'info',
    pipeline_run_id text
);

-- 9. TABELA: content_opportunities
create table if not exists public.content_opportunities (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid not null,
    titulo_conteudo text not null,
    tipo_conteudo text,
    plataforma text,
    gancho text,
    roteiro_curto text,
    slides_carrossel jsonb default '[]'::jsonb,
    pontuacao_viral integer default 0,
    source_problem_id uuid references public.detected_problems(id) on delete set null
);

-- 10. TABELA: calendario_conteudo (Novo)
create table if not exists public.calendario_conteudo (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid not null,
    batch_id text,
    dia integer,
    data_publicacao date,
    dor_titulo text,
    dor_tipo text,
    produto text,
    angulo text,
    plataforma text,
    roteiro_narracao text,
    roteiro_tela text,
    hook text,
    cta text,
    duracao_estimada text,
    hashtags text[],
    status text default 'pendente'
);

-- 11. TABELA: problem_patterns
create table if not exists public.problem_patterns (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid not null,
    pattern_title text not null,
    pattern_description text,
    total_occurrences integer default 0,
    average_viral_score integer default 0,
    related_problems jsonb default '[]'::jsonb,
    oportunidades_geradas jsonb default '[]'::jsonb
);

-- 12. Habilitar RLS (Opcional, mas recomendado desativar para teste inicial rápido)
alter table public.detected_problems enable row level security;
alter table public.niches enable row level security;
alter table public.opportunities enable row level security;
alter table public.tools enable row level security;
alter table public.tool_combinations enable row level security;
alter table public.agents enable row level security;
alter table public.agent_logs enable row level security;
alter table public.content_opportunities enable row level security;
alter table public.calendario_conteudo enable row level security;
alter table public.problem_patterns enable row level security;

-- Políticas de Acesso Público (PARA TESTE) - Se quiser segurança real, troque 'true' por auth.uid() = user_id
create policy "Allow all for authenticated users" on public.detected_problems for all using (true);
create policy "Allow all for authenticated users" on public.niches for all using (true);
create policy "Allow all for authenticated users" on public.opportunities for all using (true);
create policy "Allow all for authenticated users" on public.tools for all using (true);
create policy "Allow all for authenticated users" on public.tool_combinations for all using (true);
create policy "Allow all for authenticated users" on public.agents for all using (true);
create policy "Allow all for authenticated users" on public.agent_logs for all using (true);
create policy "Allow all for authenticated users" on public.content_opportunities for all using (true);
create policy "Allow all for authenticated users" on public.calendario_conteudo for all using (true);
create policy "Allow all for authenticated users" on public.problem_patterns for all using (true);
