# CONTEXTO.md — AI Opportunity Lab
## Padrão Ouro 2026 | Versão 2.0 (Auditada)

---

## 1. O QUE É O SISTEMA

O **AI Opportunity Lab** é uma plataforma de inteligência de mercado e conteúdo que automatiza
a jornada desde a descoberta de dores reais até a criação de produtos SaaS e conteúdo viral.

**Proposta de valor central:**
- Detecta dores reais do mercado via scraping inteligente (Apify)
- Gera conteúdo pronto para redes sociais (5 ângulos × 5 plataformas)
- Transforma dores em oportunidades de SaaS com Blueprint técnico e Landing Page
- Tudo baseado em dados reais — zero achismo

---

## 2. STACK TECNOLÓGICA

### Frontend
- React 18 + TypeScript + Vite (SWC)
- Tailwind CSS + shadcn/ui + Radix UI + Lucide React
- React Router DOM v6
- React Query (TanStack v5) + React Context
- Framer Motion + Sonner (notificações)

### Backend
- Supabase (PostgreSQL + Edge Functions + Auth + Realtime + Vault)
- Edge Functions em TypeScript/Deno
- pg_cron e pg_net para tarefas agendadas nativas

### Deploy
- Frontend: Vercel
- Backend: Supabase
- Builder: Lovable | Editor IA: Antigravity | CLI: Claude Code

---

## 3. HIERARQUIA DE IA

| Modelo | Papel | Onde é usado |
|--------|-------|--------------|
| Gemini 2.5 Flash | Operário | TODAS as Edge Functions do app |
| Claude Sonnet | Arquiteto | Apenas Claude Code CLI |
| Apify SDK | Caçador | Scraping Reddit, G2, YouTube |

**Endpoint Gemini obrigatório:**
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
```
**Sempre usar v1beta — nunca v1.**
**responseMimeType: "application/json" obrigatório.**

---

## 4. SEGURANÇA — ZERO EXPOSURE

**Proibido:** variáveis `VITE_` para chaves sensíveis.

| Variável | Destino | Motivo |
|----------|---------|--------|
| GEMINI_API_KEY | Supabase Vault | Sensível — nunca no frontend |
| APIFY_API_KEY | Supabase Vault | Sensível — nunca no frontend |
| VITE_SUPABASE_URL | Pode ficar pública | Não é sensível |
| VITE_SUPABASE_PUBLISHABLE_KEY | Pode ficar pública | Anon key por design |

### Vault Helper SQL (obrigatório no banco)
```sql
CREATE OR REPLACE FUNCTION public.get_decrypted_secret(secret_name text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE decrypted_val text;
BEGIN
  SELECT decrypted_secret INTO decrypted_val
  FROM vault.decrypted_secrets WHERE name = secret_name;
  RETURN decrypted_val;
END; $$;
```

### Como usar nas Edge Functions
```typescript
const geminiKey = await supabase.rpc('get_decrypted_secret', { secret_name: 'GEMINI_API_KEY' })
const apifyKey = await supabase.rpc('get_decrypted_secret', { secret_name: 'APIFY_API_KEY' })
```

---

## 5. EXECUTION_ID — IDEMPOTÊNCIA

Toda Edge Function deve validar EXECUTION_ID para evitar cobrança dupla.

### Padrão obrigatório em todas as Edge Functions
```typescript
const executionId = req.headers.get('x-execution-id') ?? crypto.randomUUID()

// Verificar se já foi processado
const { data: existing } = await supabase
  .from('pipeline_cache')
  .select('id, status')
  .eq('execution_id', executionId)
  .eq('status', 'completed')
  .single()

if (existing) {
  return new Response(JSON.stringify({ cached: true, id: existing.id }), { status: 200 })
}
```

---

## 6. PROTOCOLO AG-UI (Realtime)

Substituiu todos os `setInterval`. Usa Supabase Realtime na tabela `agent_activity`.

### 4 eventos obrigatórios
- `RUN_STARTED` — início da tarefa global
- `STEP_STARTED` — sub-tarefa em execução
- `STATE_DELTA` — atualização incremental de dados
- `TEXT_DELTA` — streaming de tokens (roteiros, copy)

### Como emitir eventos nas Edge Functions
```typescript
await supabase.from('agent_activity').insert({
  execution_id: executionId,
  event_type: 'STEP_STARTED',
  detail: 'Pesquisando nicho Tech no Reddit',
  user_id: userId
})
```

### Como ouvir no frontend
```typescript
supabase
  .channel('pipeline-progress')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'agent_activity',
    filter: `execution_id=eq.${executionId}`
  }, (payload) => updateProgress(payload.new))
  .subscribe()
```

---

## 7. PRE-BATCH STRATEGY (Cache 15 dias)

### Fluxo de problemas
```
Usuário clica "Escanear Agora"
→ Verifica detected_problems (niche_category + created_at < 15 dias)
→ Cache válido → carrega do banco, ZERO chamada à IA
→ Cache expirado/vazio → Apify coleta → Gemini filtra → salva banco
→ Para cada problema: gera pipeline completo em background (1 por vez, delay 4s)
→ Salva em pipeline_cache com status: pending → processing → completed
```

### Clique no card de problema
```
Clique no card
→ SELECT pipeline_cache WHERE detected_problem_id = X AND status = 'completed'
→ Carrega para SelectedProblemContext
→ Todas as abas atualizam instantaneamente
→ ZERO chamada à IA
```

---

## 8. APIFY — DATA HUNTER

### Fontes
- Reddit → dores de sub-nicho (dores reais em comentários)
- G2 → falhas de competidores (reviews negativos)
- YouTube → comentários em vídeos de review

### Fluxo de ingestão
```
Trigger "Escanear Agora"
→ Apify Actor dispara com maxItems configurado
→ Edge Function recebe dados brutos
→ Filtragem: remove bots, ads, HTML
→ Gemini 2.5 Flash extrai "ouro"
→ Salva em detected_problems
→ Pipeline sequencial para pipeline_cache
```

**Regra de custo:** `maxItems` obrigatório em todo Actor. Focar em "Hot" e "Top" apenas.

---

## 9. BANCO DE DADOS — TABELAS OFICIAIS

### Tabelas do schema.sql (criação original)
```sql
detected_problems   -- Problemas detectados pelas fontes
niches              -- Nichos de mercado mapeados
opportunities       -- Oportunidades de SaaS geradas
tools               -- Ferramentas encontradas
tool_combinations   -- Combinações de ferramentas
agents              -- Agentes do sistema
agent_logs          -- Logs de execução dos agentes
content_opportunities -- Ideias e roteiros de conteúdo
calendario_conteudo -- Calendário semanal de posts
problem_patterns    -- Padrões identificados entre problemas
```

### Tabelas adicionadas via SQL Editor (não estão no schema.sql)
```sql
pipeline_cache      -- Cache completo do pipeline por problema (TTL 15 dias)
blueprints          -- Arquitetura técnica por oportunidade
landing_pages       -- HTML/React gerado com histórico
published_posts     -- Posts publicados nas plataformas
agent_activity      -- Logs AG-UI com execution_id e event_type (Realtime)
```

### Colunas adicionadas manualmente (não estão no schema.sql original)
```sql
-- detected_problems
pipeline_status TEXT DEFAULT 'pending'
pipeline_error TEXT
source_problem_id UUID (FK para detected_problems)

-- opportunities
detected_problem_id UUID (FK para detected_problems)

-- calendario_conteudo
notas TEXT
source_problem_id UUID (FK para detected_problems)

-- agent_activity
execution_id UUID
event_type TEXT
```

### Estrutura da pipeline_cache
```sql
CREATE TABLE public.pipeline_cache (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '15 days'),
  detected_problem_id uuid REFERENCES detected_problems(id) ON DELETE CASCADE,
  execution_id uuid,
  status text DEFAULT 'pending', -- pending | processing | completed | failed
  tools jsonb DEFAULT '[]',
  combinations jsonb DEFAULT '[]',
  content_ideas jsonb DEFAULT '[]',
  video_script jsonb DEFAULT '{}',
  platform_content jsonb DEFAULT '{}',
  angles jsonb DEFAULT '[]',
  opportunity jsonb DEFAULT '{}'
);
```

---

## 10. ROTAS DO APP (App.tsx)

### Radar e Descoberta
```
/radar                    → OpportunityRadar (PRINCIPAL)
/discovery/trends         → Trends
/discovery/detected       → Problems
/discovery/detected/:id   → ProblemDetail
/discovery/patterns       → Patterns
/discovery/window         → OpportunityWindow
```

### Conteúdo para Redes Sociais
```
/content/ideas      → ContentIdeas
/content/scripts    → VideoScripts
/content/angles     → Motor5Angulos
/content/platforms  → PlatformContent
/content/calendar   → WeeklyCalendar (calendário da semana)
/calendario         → CalendarioConteudo (calendário completo)
```

### Inteligência (Placeholders — não implementados)
```
/intelligence/metrics   → PlaceholderPage
/intelligence/viral     → PlaceholderPage
/intelligence/learning  → PlaceholderPage
```

### Análise de Ferramentas
```
/tools/combinations     → ToolCombinations
/tools/solutions        → GeneratedSolutions
/tools/popular          → PlaceholderPage
/tools/reviews          → PlaceholderPage
/tools/failures         → PlaceholderPage
/tools/failure-content  → PlaceholderPage
```

### Laboratório SaaS
```
/saas/opportunities       → Opportunities
/saas/opportunities/:id   → OpportunityDetail
/saas/landing             → LandingPageGenerator
/saas/blueprint           → TechnicalBlueprint
```

### Ecossistema Anthropic
```
/project-setup          → ProjectSetup
/monitor-lancamentos    → MonitorLancamentos
/anthropic/radar        → RadarDores (não /radar-dores)
```

---

## 11. ESTADO GLOBAL

### SelectedProblemContext (sincroniza todas as abas)
```typescript
interface SelectedProblemContextType {
  selectedProblem: DetectedProblem | null
  selectedPipelineData: {
    tools: Tool[]
    combinations: Combination[]
    content_ideas: ContentIdea[]
    video_script: VideoScript
    platform_content: PlatformContent
    angles: Angle[]
  } | null
  setSelectedProblem: (p: DetectedProblem | null) => void
  setSelectedPipelineData: (d: PipelineData | null) => void
}
```

---

## 12. AGENTES DA LANDING PAGE

### Interface TypeScript obrigatória
```typescript
interface LandingPageOutput {
  component_code: string       // Componente React .tsx completo
  tailwind_classes: string[]   // Classes customizadas usadas
  metadata: {
    niche: string
    primary_color: string
    sections: ('hero' | 'pain' | 'solution' | 'offer_stack' | 'guarantee')[]
  }
}
```

### @Copy-Viking
- Framework: PAS (Problema, Agitação, Solução) + Hormozi + Ogilvy
- Output: copy em português, agressiva, focada em ROI
- Estrutura: Hero → Dor/Agitação → Solução → Offer Stack → Garantia 30 dias

### @Pixel-Premium
- Output: componente React + Tailwind CSS (não HTML puro)
- Sempre Dark Mode premium
- Paletas por nicho:
  - Tech/IA: `indigo-600` / `violet-500` + neon
  - Saúde: `emerald-500` + branco
  - Finanças: `blue-900` + `green-400`
  - Fitness: `orange-500` + preto

### Estrutura obrigatória da Landing Page
1. Hero — Headline Ogilvy + CTA above the fold
2. Dor e Agitação — ícones de alerta + bullets negativos
3. Solução — mockup placeholder + benefits com check verde
4. Offer Stack — valores empilhados Hormozi + preço riscado
5. Garantia — 30 dias incondicional + selo de segurança

---

## 13. EDGE FUNCTIONS EXISTENTES

```
supabase/functions/
├── pain-hunter/              # Coleta dores das fontes
├── process-pipeline-queue/   # Pipeline completo em background
├── discover-tools/           # GitHub + Product Hunt
├── ingest-trends/            # NewsAPI + RSS
├── generate-content-idea/    # Roteiros e ângulos
├── generate-blueprint/       # Arquitetura técnica
├── generate-mvp-plan/        # Plano de MVP
├── run-pipeline/             # Orquestrador principal
├── daily-pain-discovery/     # Descoberta diária agendada
├── detect-patterns/          # Análise de padrões
└── discover-problems/        # Descoberta de problemas
```

---

## 14. REGRAS ABSOLUTAS DE DESENVOLVIMENTO

### Nunca fazer
- Usar `VITE_` para Gemini ou Apify keys
- Criar Edge Function sem EXECUTION_ID
- Usar `setInterval` para simular progresso (usar AG-UI Realtime)
- Mencionar n8n, Make.com, Zapier (removidos definitivamente)
- Tocar nas abas do Ecossistema Anthropic sem instrução explícita
- Usar endpoint `v1` do Gemini (sempre `v1beta`)
- Gerar Landing Page como HTML puro (sempre componente React .tsx)

### Sempre fazer
- Validar EXECUTION_ID no início de toda Edge Function
- Verificar pipeline_cache antes de qualquer chamada à IA
- Emitir eventos AG-UI durante processamento
- Usar `maxItems` em todo Actor Apify
- Salvar checkpoints no banco para retomada em timeout
- Testar se tabela existe antes de insert (graceful handling)

---

## 15. GUARDIÃO DA ARQUITETURA

O **Antigravity** valida toda refatoração estrutural contra `.agent/` antes do deploy na Vercel.

**Boot sequence Claude Code:**
```
git clone [REPO] && claude
→ Leitura obrigatória: CLAUDE.md (max 200 linhas) + ARCHITECTURE.md + CONTEXTO.md
→ Regras modulares em .claude/rules/ (ui-rules.md, api-rules.md)
```