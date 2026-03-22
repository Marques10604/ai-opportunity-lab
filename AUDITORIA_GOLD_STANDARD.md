# 🏆 AUDITORIA GOLD STANDARD - Marques System 2026 (Modernização Real-Stack)

Este documento consolidado define as diretrizes de engenharia para a refatoração via **Claude Code**, alinhando o projeto à stack **Supabase + Lovable + Vercel + Antigravity**.

---

## 🛡️ 1. Blindagem de Infraestrutura e Governança

### 🚨 Segurança de Segredos (Zero Exposure)
- **Eliminação de VITE_:** É terminantemente proibido o uso de variáveis `VITE_` para chaves de API sensíveis no frontend.
- **Supabase Vault & Secrets:**
  - Chaves estáticas (Gemini, GitHub App) devem ser configuradas via `supabase secrets set`.
  - Tokens dinâmicos (GitHub OAuth `provider_token`) devem ser armazenados no **Supabase Vault** com criptografia baseada em `libsodium`.
  - **Acesso:** Somente via Edge Functions (Deno) ou funções SQL com `SECURITY DEFINER` e `search_path` fixo.

### 🏛️ Governança Antigravity
- **O Guardião:** O **Antigravity** atua como o Guardião da Arquitetura. 
- **Regra de Push:** Toda refatoração estrutural proposta pelo Claude Code deve ser validada contra as regras do Antigravity definidas em `.agent/` antes do deploy final na Vercel.

---

## 🤖 2. Hierarquia de Inteligência e Custo (84% OFF)

O sistema deve operar em um modelo híbrido para maximizar a eficiência:

- **Motor de Execução (Gemini 2.5 Flash):** 
  - **Uso:** Radar de Oportunidades, Geração de Conteúdo, Landing Pages, Scan de Tendências.
  - **Por que:** 84% mais barato que Claude 3.5 Sonnet, 1M de janela de contexto e 200 tokens/s.
- **Ambiente de Desenvolvimento (Claude 3.5 Sonnet):**
  - **Uso:** Apenas para **Claude Code CLI (DX)** e tarefas de alta lógica/raciocínio complexo.

---

## ⚡ 3. Protocolo AG-UI (Realtime Workflow)

### 🚫 Adeus Timers Fantasmas
- O progresso em `OpportunityRadar.tsx` e `Dashboard.tsx` não deve ser simulado por `setInterval`.
- **Streaming de Eventos:** Implementar o protocolo **AG-UI** via **Supabase Realtime**.
- **Contrato de Eventos:**
  - `RUN_STARTED`: Início da tarefa global.
  - `STEP_STARTED`: Detalhamento da sub-tarefa (ex: "Pesquisando nicho Tech").
  - `STATE_DELTA`: Atualização incremental dos dados no dashboard.
  - `TEXT_DELTA`: Streaming de texto (tokens) para roteiros e copy.

---

## 🔗 4. Agentes Puros (Adeus Low-Code)

### 💀 Limpeza de Legado
- **Remoção Total:** Deletar qualquer menção ou integração com `n8n`, `Make.com` ou `Zapier`.
- **Estratégia Agêntica:** O sistema é 100% agêntico, rodando em Edge Functions integradas nativamente ao Lovable.
- **Orquestração Nativa:** Usar `pg_cron` e `pg_net` para disparar tarefas agendadas e processar filas diretamente no banco de dados.

---

## ⚙️ 5. Idempotência e Resiliência

### 💰 Proteção de Cobrança
- **EXECUTION_ID:** Todas as Edge Functions devem validar o `EXECUTION_ID` nos metadados para evitar execuções duplicadas em caso de oscilação de rede ou retentativas automáticas.
- **Checkpoints:** Salvar o progresso parcial no PostgreSQL para permitir que funções retomem de onde pararam em caso de timeout.

---

## 📂 6. Estrutura de Contexto (DX Elite)

Para que o Claude Code opere com máxima precisão e economia de tokens:

- **CLAUDE.md:** Limite de 200 linhas. Foco em padrões de código e build.
- **.claude/rules/:** Modularizar regras por domínio (ex: `ui-rules.md`, `api-rules.md`).
- **Boot Sequence:** O comando de início deve ser: `git clone [REPO] && claude` -> Seguido da leitura obrigatória de `CLAUDE.md` e `ARCHITECTURE.md`.

---

## 💎 ESPECIFICAÇÕES TÉCNICAS FINAIS

#### 🗄️ SQL Schema (2026 Modernizado)
```sql
-- Vault Access Helper
CREATE OR REPLACE FUNCTION public.get_decrypted_secret(secret_name text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE decrypted_val text;
BEGIN
    SELECT decrypted_secret INTO decrypted_val FROM vault.decrypted_secrets WHERE name = secret_name;
    RETURN decrypted_val;
END; $$;

-- Activity Logs for AG-UI Realtime
ALTER TABLE public.agent_activity ADD COLUMN IF NOT EXISTS execution_id uuid;
ALTER TABLE public.agent_activity ADD COLUMN IF NOT EXISTS event_type text; -- RUN_STARTED, STEP_STARTED, etc.
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_activity;
```

#### 🧠 Prompt Master (Antigravity Guard)
```json
{
  "system": "Aja como Antigravity Architecture Guard.",
  "mandate": "Validar refatoração estrutural com regras em .agent/ antes de propor alterações.",
  "stack": "Supabase, Lovable, Vercel, Gemini 2.5 Flash (Worker), Claude 3.5 (Arquitetura).",
  "idempotency": "Garantir captura de EXECUTION_ID em todas as novas funções."
}
```