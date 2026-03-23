# 🏆 AUDITORIA GOLD STANDARD — Marques System 2026
## Versão 2.0 | Revisada e corrigida contra schema.sql e App.tsx reais

---

## 🛡️ 1. Blindagem de Infraestrutura e Governança

### 🚨 Segurança de Segredos (Zero Exposure)

- **Proibido:** variáveis `VITE_` para chaves sensíveis
- **Permitido como público:** `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key por design)

| Chave | Destino | Como configurar |
|-------|---------|-----------------|
| GEMINI_API_KEY | Supabase Vault | `supabase secrets set GEMINI_API_KEY=...` |
| APIFY_API_KEY | Supabase Vault | `supabase secrets set APIFY_API_KEY=...` |

- **Acesso:** Somente via Edge Functions (Deno) usando `get_decrypted_secret`

### 🏛️ Governança Antigravity
- O **Antigravity** valida toda refatoração estrutural contra `.agent/` antes do deploy na Vercel
- Toda proposta do Claude Code passa pelo Antigravity Guard antes de ir para produção

---

## 🤖 2. Hierarquia de Inteligência e Custo (84% OFF)

| Modelo | Papel | Onde usar |
|--------|-------|-----------|
| Gemini 2.5 Flash | Operário | TODAS as Edge Functions do app |
| Claude Sonnet | Arquiteto | Apenas Claude Code CLI |
| Apify SDK | Caçador | Scraping Reddit, G2, YouTube |

---

## ⚡ 3. Protocolo AG-UI (Realtime Workflow)

### Adeus Timers Fantasmas
- Proibido `setInterval` para simular progresso em `OpportunityRadar.tsx` e `Dashboard.tsx`
- Usar **Supabase Realtime** na tabela `agent_activity`

### Contrato de Eventos
- `RUN_STARTED` — início da tarefa global
- `STEP_STARTED` — sub-tarefa em execução
- `STATE_DELTA` — atualização incremental de dados
- `TEXT_DELTA` — streaming de tokens para roteiros e copy

### Como emitir (Edge Function)
```typescript
await supabase.from('agent_activity').insert({
  execution_id: executionId,
  event_type: 'STEP_STARTED',
  detail: 'Pesquisando nicho Tech no Reddit',
  user_id: userId
})
```

### Como ouvir (Frontend)
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

## 🔗 4. Agentes Puros (Adeus Low-Code)

- **Removidos definitivamente:** n8n, Make.com, Zapier — deletar qualquer menção no código
- **Orquestração:** pg_cron e pg_net nativos do Postgres
- **Estratégia:** 100% agêntico via Edge Functions

---

## ⚙️ 5. Idempotência e Resiliência

### Padrão EXECUTION_ID obrigatório em todas as Edge Functions
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

**Regra:** Se `execution_id` já existe com `status = completed` → retorna cache, não processa novamente.

### Checkpoints
- Salvar progresso parcial no banco após cada etapa
- Permite retomada em caso de timeout da Edge Function (limite: 150s no plano gratuito)

---

## 📂 6. Estrutura de Contexto (DX Elite)

- **CLAUDE.md:** Máximo 200 linhas. Foco em padrões de código e build
- **.claude/rules/:** Regras modulares por domínio (`ui-rules.md`, `api-rules.md`)
- **Boot sequence:** `git clone [REPO] && claude` → leitura obrigatória de `CLAUDE.md`, `ARCHITECTURE.md` e `CONTEXTO.md`

---

## 🛰️ 7. Camada 10: Data Hunter (Apify Integration)

### Configuração dos Actors (valores obrigatórios)
```typescript
const APIFY_CONFIG = {
  reddit: {
    maxItems: 50,
    sort: 'hot',
    focus: 'dores de sub-nicho'
  },
  g2: {
    maxItems: 30,
    filter: 'negative',
    focus: 'falhas de competidores'
  },
  youtube: {
    maxItems: 100,
    type: 'comments',
    focus: 'reviews negativos'
  }
}
```

### Fluxo de Ingestão com Cache 15 dias
```
Usuário clica "Escanear Agora"
→ Verifica detected_problems (niche_category + created_at < 15 dias)
→ Cache válido → carrega do banco, ZERO chamada ao Apify
→ Cache expirado/vazio:
   → Apify Actor dispara com maxItems configurado
   → Edge Function recebe dados brutos
   → Filtragem: remove bots, ads, HTML
   → Gemini 2.5 Flash v1beta extrai "ouro"
   → Salva em detected_problems
   → Pipeline sequencial para pipeline_cache (1 por vez, delay 4s)
```

### Regras de custo
- `maxItems` obrigatório em todo Actor — sem exceção
- Focar apenas em "Hot" e "Top" threads/reviews
- Não rastrear páginas além do necessário
- Cache de 15 dias evita recoleta desnecessária

---

## 💎 8. Especificações Técnicas Finais

### Gemini 2.5 Flash — Configuração obrigatória

**CRÍTICO:** Sempre usar `v1beta`. O endpoint `v1` não suporta `responseMimeType` e causa erro 400.

```typescript
// OBRIGATÓRIO em todas as Edge Functions
const GEMINI_CONFIG = {
  endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.7,
    maxOutputTokens: 8192
  }
}

// Como chamar
const response = await fetch(
  `${GEMINI_CONFIG.endpoint}?key=${geminiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: GEMINI_CONFIG.generationConfig
    })
  }
)
```

---

### SQL Schema Completo (tabelas que NÃO estão no schema.sql original)

Estas tabelas foram criadas via SQL Editor. Em ambiente limpo, rodar este SQL:

```sql
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

-- Activity Logs para AG-UI Realtime
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
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_activity;

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

-- Colunas adicionadas nas tabelas existentes
ALTER TABLE public.detected_problems
  ADD COLUMN IF NOT EXISTS pipeline_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS pipeline_error text,
  ADD COLUMN IF NOT EXISTS source_problem_id uuid REFERENCES public.detected_problems(id) ON DELETE CASCADE;

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS detected_problem_id uuid REFERENCES public.detected_problems(id) ON DELETE CASCADE;

ALTER TABLE public.calendario_conteudo
  ADD COLUMN IF NOT EXISTS notas text,
  ADD COLUMN IF NOT EXISTS source_problem_id uuid REFERENCES public.detected_problems(id) ON DELETE CASCADE;

ALTER TABLE public.tool_combinations
  ADD COLUMN IF NOT EXISTS source_problem_id uuid REFERENCES public.detected_problems(id) ON DELETE CASCADE;

ALTER TABLE public.content_opportunities
  ADD COLUMN IF NOT EXISTS source_problem_id uuid REFERENCES public.detected_problems(id) ON DELETE CASCADE;

-- Índices para performance em cascades
CREATE INDEX IF NOT EXISTS idx_pipeline_cache_problem_id ON public.pipeline_cache(detected_problem_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_cache_status ON public.pipeline_cache(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_cache_expires ON public.pipeline_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_agent_activity_execution ON public.agent_activity(execution_id);
```

---

### Prompt Master (Antigravity Guard)
```json
{
  "system": "Aja como Antigravity Architecture Guard.",
  "mandate": "Validar refatoração estrutural com regras em .agent/ antes de propor alterações.",
  "stack": "Supabase + Lovable + Vercel + Antigravity. Gemini 2.5 Flash v1beta (Worker). Claude Sonnet (Claude Code CLI apenas).",
  "security": "Zero VITE_ para chaves sensíveis. Gemini e Apify sempre via Supabase Vault.",
  "idempotency": "Garantir EXECUTION_ID em todas as Edge Functions.",
  "cache": "Verificar pipeline_cache antes de qualquer chamada à IA.",
  "forbidden": "n8n, Make.com, Zapier, setInterval para progresso, endpoint v1 do Gemini."
}
```