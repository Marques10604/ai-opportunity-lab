# 🏆 AUDITORIA GOLD STANDARD - Marques System 2026

Este documento detalha o estado técnico atual do projeto, identificando lacunas arquiteturais, dívidas técnicas e inconsistências em relação ao "Padrão Ouro" definido para a refatoração via Claude Code.

---

## 1. 🏗️ Arquitetura e Fluxo de Dados (Frontend -> Backend)

### 🚨 Falhas Críticas de Segurança e Fluxo
- **Chamadas Diretas da API (Client-Side):** Identificamos que as páginas `OpportunityDetail.tsx` e `RadarDores.tsx` realizam chamadas diretas para as APIs da Google (Gemini) e Anthropic (Claude) usando chaves expostas no ambiente (`VITE_GEMINI_API_KEY`, `VITE_ANTHROPIC_API_KEY`).
  - **Ação:** Refatorar para usar `supabase.functions.invoke()` em todas as operações de IA, centralizando a lógica e as chaves no backend (Edge Functions).

### ⚡ Performance e Concorrência
- **Await Faltante:** Em `OpportunityRadar.tsx`, a chamada para `process-pipeline-queue` não é aguardada (`await`).
- **Feedback Visual "Fantasma":** O progresso do scan é controlado por timers e não por estados reais.

---

## 2. 🤖 Consistência do Modelo IA (Gold Standard: Gemini 2.5 Flash)

### 📊 Status de Migração
- **Edge Functions:** ✅ 100% migradas para `gemini-2.5-flash`.
- **Frontend Labels:** ❌ Inconsistente (referências ao 1.5 Pro).
- **Divergência Crítica:** `RadarDores.tsx` utilizando Anthropic indevidamente.

---

## 3. 🧹 Dívida Técnica e Legados (Niches & Tools)

### 🚫 Ferramentas Proibidas (n8n, Make, Zapier)
- **Ação:** Remover menções de ferramentas de automação legadas dos prompts em favor de agentes puros.

---

## 🔗 CAMADAS DE ELITE (ROTEIRO DE UPGRADE)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAMADA 2: CLAUDE SKILLS / MCPS (DX ELITE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Funcionalidade exclusiva de **Developer Experience (DX)** no módulo **'Ecossistema Anthropic' -> Aba 'Configuração de Projeto'**.
- **ZIP de Elite:** Exporta `mcp-servers.json` e a pasta `.claude/rules/`.
- **Prompt Dinâmico:** Botão 'Copiar Primeiro Comando' com aviso de segurança para Skills ativas.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAMADA 3-8: ESTRATÉGIA, ROI E CONTEXTO
━━━━━━━━━━━━━━━━━━━━━━━
Loop automático, análise de rivais, janela de oportunidade, Multi-plataforma, Motores de Validação (ROI/PAS) e Direção de Cena/Copy de 5 Ângulos.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAMADA 9: GITHUB ENGINE & CONTEXT AUTOMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Esta é a última peça do quebra-cabeça: **A ponte para o código.**

1. **GitHub OAuth Flow (Scope: repo):**
   - Integração do Supabase Auth com provedor GitHub para capturar o `provider_token`.
   - Permissão de escrita para criar projetos e realizar commits em nome do usuário.

2. **Auto-Repo Architect (Edge Function):**
   Lógica automatizada para:
   - Criar repositório público/privado via API.
   - **Initial Commit Elite:** Subir a estrutura completa de contexto que economiza tokens e guia o Claude:
     - `/CLAUDE.md`: O "Dono da Casa" (Regras principais).
     - `/.claude/rules/`: Pasta de regras específicas (.md).
     - `/.tasks/`: Histórico de progresso.
     - `/ARCHITECTURE.md`: O mapa da mina.

3. **Prompt de Boot Dinâmico:**
   O 'Primeiro Comando' na aba de Configuração deve incluir a URL do novo repo e a instrução de **'Sequência de Leitura' (Boot Sequence)**: "Leia CLAUDE.md e ARCHITECTURE.md antes de qualquer ação".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIM DAS CAMADAS DE ELITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 💎 ESPECIFICAÇÕES TÉCNICAS PARA O CLAUDE

#### 1. 🗄️ SQL Schema (Migrations & Vault)
```sql
-- Tokens Criptografados (Vault / Profiles)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS encrypted_github_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github_username text;

-- Cache de Direções (Layer 8)
ALTER TABLE public.content_opportunities ADD COLUMN IF NOT EXISTS directions_metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.content_opportunities ADD COLUMN IF NOT EXISTS angle_type text;
```

#### 2. 🧠 Prompt Master (GitHub Boot Sequence)
```json
{
  "system": "Aja como Arquiteto DevOps e Instrutor de Claude Code.",
  "boot_instruction": "Sequência de Leitura Obrigatória: 1. CLAUDE.md, 2. ARCHITECTURE.md, 3. .claude/rules/",
  "repo_integration": "Repo URL: {generated_repo_url}",
  "token_optimization": "Use arquivos Markdown da pasta .claude/rules/ para economizar tokens de contexto."
}
```

#### 3. 🧹 Cleanup List
- `src/pages/RadarDores.tsx` 🛑 (Deletar monólito)
- `src/components/DiscoveryEngine.tsx` 🛑 (Deletar legado)