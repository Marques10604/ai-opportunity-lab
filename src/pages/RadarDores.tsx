import React, { useState, useEffect } from "react";
import { 
  Search, ShieldAlert, Cpu, Sparkles, CheckCircle2, Loader2, 
  Terminal, Download, Copy, Check, FileCode, Zap, AlertCircle,
  Clock, TrendingUp, MessageSquare, Bookmark, Play, X, Eye, ThumbsUp, ChevronDown, FileText, Layers, Mic
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PRE_MAPPED_PAINS = [
  {
    id: 1,
    title: "'Context Rot' (Zona Burra) — Claude perde precisão após 20-30min de sessão",
    product: "Claude Code",
    badge: "ALTA DEMANDA",
    score: 91,
    mentions: 203,
    growth: "Crescendo 4x esta semana",
    sources: ["GitHub Issues", "Reddit r/ClaudeAI", "Hacker News"],
    quote: "Depois de uns 20 minutos o Claude começa a alucinar importações que não existem e sugerir refatorações que contradizem decisões que tomamos no início da sessão. É como se ele esquecesse tudo. Desenvolvedores chamam esse estado de 'Zona Burra' — quando o Claude vira um dev júnior confuso que inventa importações e esquece a estrutura de pastas.",
    solution_prompt: "Analise o estado atual desta sessao e identifique sinais de context rot: importacoes alucinadas, sugestoes que contradizem decisoes anteriores ou perda de coerencia com o inicio da conversa. Aplique a tecnica Document and Clear: resuma os 3 pontos mais importantes desta sessao em bullet points, salve em .tasks/[tarefa]-context.md e sugira quando iniciar uma nova sessao limpa.",
    workflow: ["Identifique o momento em que Claude começa a perder coerência (geralmente após 20-30min)", "Use /compact estrategicamente nos checkpoints — nunca no meio de uma implementação", "Mantenha .tasks/[tarefa]-context.md atualizado com decisões tomadas", "Inicie nova sessão dizendo: 'Leia o context.md e continue de onde paramos'", "Use subagentes para tarefas paralelas em vez de misturar tópicos"],
    window_hours: 72,
    type: "Performance"
  },
  {
    id: 2,
    title: "Claude Code lê .env e secrets.json sem permissão explícita",
    product: "Claude Code",
    badge: "ALTA DEMANDA",
    score: 89,
    mentions: 178,
    growth: "Crescendo 3.5x esta semana",
    sources: ["GitHub Issues", "Reddit r/ClaudeAI", "Twitter/X"],
    quote: "Acabei de perceber que o Claude Code leu meu arquivo .env e incluiu minha senha do banco de dados numa sugestão de código. É uma falha de segurança séria que ninguém está falando.",
    solution_prompt: "Adicione ao meu projeto um .claudeignore completo que bloqueie acesso a .env, .env.local, .env.production, secrets.json, .pem, .key e qualquer arquivo com credenciais. Adicione tambem um hook PreToolUse no hooks.json que intercepta e bloqueia leitura desses arquivos antes de processar qualquer comando.",
    workflow: ["Criar .claudeignore na raiz com todos os padrões de arquivos sensíveis", "Adicionar hook PreToolUse no .claude/hooks/hooks.json", "Adicionar regra no CLAUDE.md: 'NUNCA ler arquivos .env ou de credenciais'", "Testar com um arquivo .env fake para confirmar bloqueio", "Auditar histórico de sugestões anteriores para verificar vazamentos"],
    window_hours: 48,
    type: "Seguranca" // Normalized type
  },
  {
    id: 3,
    title: "Gasto excessivo de tokens sem aviso — conta explode sem perceber",
    product: "Claude Code",
    badge: "ALTA DEMANDA",
    score: 84,
    mentions: 156,
    growth: "Crescendo 2.8x esta semana",
    sources: ["Reddit r/ClaudeAI", "Hacker News", "Twitter/X"],
    quote: "Fui de $0 a $47 em um único dia usando o Claude Code sem perceber. O modelo Opus estava rodando pra tudo, incluindo autocomplete simples.",
    solution_prompt: "Analise meu uso de tokens nesta sessao. Identifique os 3 maiores consumidores de tokens e sugira como reduzi-los usando Prompt Caching, compactacao estrategica e roteamento de modelo. Mostre a configuracao otimizada para o meu settings.json.",
    workflow: ["Adicionar ao settings.json: MAX_THINKING_TOKENS 10000 e CLAUDE_AUTOCOMPACT_PCT_OVERRIDE 50", "Definir CLAUDE_CODE_SUBAGENT_MODEL como haiku para tarefas simples", "Usar /cost regularmente para monitorar gasto da sessão", "Ativar Prompt Caching colocando conteúdo estático no início do prompt", "Usar /clear entre tarefas não relacionadas — é gratuito e reseta o contexto"],
    window_hours: 72,
    type: "Custo/tokens"
  },
  {
    id: 4,
    title: "Prompt Caching: como ativar e quando usar de verdade",
    product: "Claude API",
    badge: "JANELA ABERTA",
    score: 82,
    mentions: 134,
    growth: "Crescendo 2.5x esta semana",
    sources: ["Reddit r/LocalLLaMA", "Hacker News", "Twitter/X"],
    quote: "A documentação diz que o Prompt Caching pode economizar 90% dos custos, mas não tenho ideia de como estruturar os prompts para realmente ter hits de cache. Minha taxa de acerto é basicamente zero.",
    solution_prompt: "Analise a estrutura dos meus prompts e identifique o que deve ir no inicio (conteudo estatico para cache) vs no final (conteudo dinamico). Gere versoes otimizadas dos meus system prompts usando cache_control para maximizar hits de cache e reduzir latencia de 11.5s para 2.4s.",
    workflow: ["Estruturar prompts com conteúdo estático no topo: system prompt, documentação, schemas", "Adicionar cache_control: {type: ephemeral} nos blocos estáticos", "Manter dados dinâmicos (query do usuário) sempre no final", "Monitorar cache_read_input_tokens vs input_tokens para medir hit rate", "Evitar qualquer mudança no início do prompt entre chamadas — invalida o cache"],
    window_hours: 96,
    type: "Custo/tokens"
  },
  {
    id: 5,
    title: "Como conectar MCP server no Windows — documentação quebrada",
    product: "MCP",
    badge: "JANELA ABERTA",
    score: 81,
    mentions: 112,
    growth: "Crescendo 2.2x esta semana",
    sources: ["GitHub Issues", "Reddit r/ClaudeAI"],
    quote: "A documentação de setup do MCP assume que você está no Mac. No Windows os caminhos são completamente diferentes e o JSON do config quebra o Claude Desktop toda vez que tento.",
    solution_prompt: "Gere a configuracao correta do MCP para Windows, incluindo: caminhos com barras invertidas escapadas, configuracao do claude_desktop_config.json com paths absolutos no formato Windows, e script de verificacao para confirmar que o servidor esta rodando corretamente.",
    workflow: ["Usar caminhos absolutos com barras invertidas duplas no JSON: C:\\\\Users\\\\...", "Verificar se Node.js está no PATH do sistema, não só do usuário", "Testar o servidor MCP isoladamente antes de conectar ao Claude Desktop", "Usar npx em vez de node direto para evitar problemas de PATH", "Reiniciar Claude Desktop completamente após qualquer mudança no config"],
    window_hours: 72,
    type: "Configuracao"
  },
  {
    id: 6,
    title: "Diferença real entre Opus, Sonnet e Haiku — quando usar cada um",
    product: "Claude API",
    badge: "EMERGINDO",
    score: 79,
    mentions: 98,
    growth: "Crescendo 1.8x esta semana",
    sources: ["Reddit r/ClaudeAI", "Reddit r/LocalLLaMA", "Hacker News"],
    quote: "Estou usando o Opus pra tudo e meus custos estão absurdos. Mas tenho medo de usar o Sonnet porque não quero perder qualidade. Existe algum guia prático de quando usar cada um?",
    solution_prompt: "Com base nas tarefas que realizo neste projeto, crie uma estrategia de roteamento de modelos: quais tarefas devem usar Haiku, quais Sonnet e quais realmente precisam de Opus. Inclua a configuracao do settings.json para implementar esse roteamento automaticamente.",
    workflow: ["Haiku: autocomplete, tarefas simples, subagentes de baixa complexidade", "Sonnet: desenvolvimento geral, code review, 80% das tarefas do dia a dia", "Opus: arquitetura complexa, debugging profundo, decisões críticas de design", "Configurar CLAUDE_CODE_SUBAGENT_MODEL haiku no settings.json", "Usar /model opus explicitamente apenas quando necessário"],
    window_hours: 96,
    type: "Performance"
  },
  {
    id: 7,
    title: "Claude Code esquece contexto após /compact — como evitar",
    product: "Claude Code",
    badge: "EMERGINDO",
    score: 76,
    mentions: 87,
    growth: "Crescendo 1.6x esta semana",
    sources: ["Reddit r/ClaudeAI", "GitHub Issues"],
    quote: "Depois de rodar o /compact o Claude parece esquecer metade do contexto do projeto. Começa a fazer sugestões que contradizem o que decidimos antes da compactação.",
    solution_prompt: "Antes de rodar /compact, gere um resumo estruturado dos 5 pontos mais importantes do contexto atual: decisoes de arquitetura, convencoes estabelecidas, o que nao fazer e onde estamos na tarefa. Salve em .tasks/[tarefa]-context.md para recarregar apos a compactacao.",
    workflow: ["Nunca usar /compact no meio de uma implementação — só em checkpoints", "Antes do /compact: documentar decisões em .tasks/[tarefa]-context.md", "Após o /compact: carregar contexto dizendo 'Leia o context.md'", "Usar CLAUDE_AUTOCOMPACT_PCT_OVERRIDE 50 para compactar mais cedo e melhor", "Manter CLAUDE.md sempre atualizado — é lido mesmo após compactação"],
    window_hours: 72,
    type: "Configuracao"
  },
  {
    id: 8,
    title: "Como criar skills personalizadas do zero no Claude Code",
    product: "Claude Code",
    badge: "EMERGINDO",
    score: 74,
    mentions: 76,
    growth: "Crescendo 1.4x esta semana",
    sources: ["YouTube", "Reddit r/ClaudeAI"],
    quote: "Vejo pessoas falando sobre skills personalizadas no Claude Code mas a documentação é praticamente inexistente. Como você cria uma do zero de verdade?",
    solution_prompt: "Crie um SKILL.md personalizado para o meu projeto baseado nos padroes do repositorio everything-claude-code. A skill deve documentar os workflows especificos do meu projeto, convencoes de codigo e padroes recorrentes que o Claude deve seguir automaticamente.",
    workflow: ["Criar pasta .claude/skills/ no projeto", "Cada skill é um arquivo SKILL.md com frontmatter YAML", "Incluir: name, description, quando usar, steps do workflow", "Referenciar a skill no CLAUDE.md para carregamento automático", "Usar /skill-create para gerar skills a partir do histórico do git"],
    window_hours: 96,
    type: "Configuracao"
  },
  {
    id: 9,
    title: "Rate limit da API sem documentação clara — como gerenciar",
    product: "Claude API",
    badge: "EMERGINDO",
    score: 72,
    mentions: 68,
    growth: "Crescendo 1.3x esta semana",
    sources: ["Twitter/X", "Reddit r/ClaudeAI", "GitHub Issues"],
    quote: "Fico batendo no rate limit mas a documentação não explica claramente quais são os limites reais do meu tier ou como implementar o backoff corretamente.",
    solution_prompt: "Implemente um sistema de retry com backoff exponencial para chamadas da API Anthropic. Inclua: deteccao do tipo de rate limit (tokens por minuto vs requests por minuto), delay otimizado por tier, logging de hits para monitoramento e fallback para modelo menor quando necessario.",
    workflow: ["Implementar retry com exponential backoff: 1s, 2s, 4s, 8s, 16s", "Verificar header retry-after na resposta 429", "Separar rate limits de TPM (tokens/min) vs RPM (requests/min)", "Usar Haiku como fallback quando Sonnet atingir rate limit", "Monitorar com /cost para identificar padrões de uso próximos ao limite"],
    window_hours: 72,
    type: "Erro tecnico"
  },
  {
    id: 10,
    title: "Hooks não disparam em projetos monorepo",
    product: "Claude Code",
    badge: "ESTÁVEL",
    score: 71,
    mentions: 64,
    growth: "Estável esta semana",
    sources: ["GitHub Issues", "Reddit r/ClaudeAI"],
    quote: "Meus hooks funcionam bem em projetos simples mas no monorepo eles simplesmente não disparam. Tenho o hooks.json na raiz mas o Claude parece ignorar os packages nos subdiretórios.",
    solution_prompt: "Diagnostique por que os hooks nao estao disparando no meu monorepo. Gere a configuracao correta do hooks.json para funcionar com workspaces, incluindo matchers que cubram subdiretorios e a estrutura correta de paths para projetos com multiplos packages.",
    workflow: ["Verificar se hooks.json está na raiz do monorepo, não em subpastas", "Usar matchers com glob patterns que cubram subdiretorios: **/*.ts", "Adicionar CLAUDE.md em cada package com referência ao hooks.json raiz", "Verificar versão do Claude Code CLI — hooks em monorepo requerem v2.1+", "Testar com ECC_HOOK_PROFILE=strict para debug de hooks não disparados"],
    window_hours: 96,
    type: "Configuracao"
  },
  {
    id: 11,
    title: "CLAUDE.md: padrões avançados que a Anthropic não documentou",
    product: "Claude Code",
    badge: "JANELA ABERTA",
    score: 69,
    mentions: 61,
    growth: "Crescendo 1.9x esta semana",
    sources: ["GitHub Issues", "Hacker News", "Reddit r/ClaudeAI"],
    quote: "Sinto que estou usando só 20% do que o CLAUDE.md consegue fazer. A documentação oficial mostra só exemplos básicos. Quais são os padrões avançados que realmente fazem diferença?",
    solution_prompt: "Analise meu CLAUDE.md atual e identifique o que esta faltando com base nos padroes avancados documentados pela comunidade: hierarquia de memoria (global vs projeto), secoes de contexto dinamico, restricoes especificas de ferramentas, padroes de delegacao para subagentes e configuracao de contexts/.",
    workflow: ["Separar ~/.claude/CLAUDE.md (global) do CLAUDE.md do projeto (local)", "Adicionar seção 'Custom Context' com quirks específicos do projeto", "Usar contexts/dev.md, review.md e research.md para mudar comportamento por modo", "Incluir seção 'What Claude Should NEVER Do' com restrições específicas", "Referenciar arquivos .tasks/ no CLAUDE.md para carregamento automático"],
    window_hours: 48,
    type: "Configuracao"
  },
  {
    id: 12,
    title: "Setup inicial do Claude Code no Windows — guia que realmente funciona",
    product: "Claude Code",
    badge: "ESTÁVEL",
    score: 68,
    mentions: 58,
    growth: "Estável esta semana",
    sources: ["Reddit r/ClaudeAI", "YouTube"],
    quote: "Todo tutorial de setup do Claude Code assume Mac ou Linux. No Windows eu fico encontrando problemas com WSL, PATH e os hooks não funcionam do mesmo jeito.",
    solution_prompt: "Gere um guia de setup completo do Claude Code para Windows, incluindo: configuracao do WSL2, instalacao do Node.js com PATH correto, configuracao do hooks.json para Windows, solucao para o problema de persistencia do CLAUDE.md no WSL e configuracao do MCP no claude_desktop_config.json com paths Windows.",
    workflow: ["Instalar Claude Code via npm no WSL2, não no Windows nativo", "Configurar Node.js no PATH do WSL separadamente do Windows", "Usar caminhos Linux dentro do WSL — /mnt/c/Users/... para acessar arquivos Windows", "Criar CLAUDE.md no diretório do projeto dentro do WSL", "Testar hooks com ECC_HOOK_PROFILE=minimal primeiro antes do strict"],
    window_hours: 96,
    type: "Configuracao"
  }
];

const ANGLE_TYPES: Record<string, string> = {
  tutorial: "TUTORIAL",
  polemica: "POLÊMICA",
  hack: "HACK",
  comparativo: "COMPARATIVO",
  transformacao: "TRANSFORMAÇÃO"
};

const BADGE_COLORS: Record<string, string> = {
  "ALTA DEMANDA": "bg-destructive/20 text-destructive border-destructive/30",
  "JANELA ABERTA": "bg-primary/20 text-primary border-primary/30",
  "EMERGINDO": "bg-warning/20 text-warning border-warning/30 text-yellow-500 border-yellow-500/30",
  "ESTÁVEL": "bg-success/20 text-success border-success/30"
};

const SCORE_BREAKDOWN: Record<number, { vol: number, vel: number, aus: number, urg: number }> = {
  91: { vol: 20, vel: 33, aus: 23, urg: 15 },
  89: { vol: 19, vel: 31, aus: 24, urg: 15 },
  84: { vol: 18, vel: 30, aus: 22, urg: 14 },
  82: { vol: 17, vel: 29, aus: 22, urg: 14 },
  81: { vol: 17, vel: 28, aus: 22, urg: 14 },
  79: { vol: 16, vel: 27, aus: 22, urg: 14 },
  76: { vol: 15, vel: 26, aus: 21, urg: 14 },
  74: { vol: 15, vel: 25, aus: 20, urg: 14 },
  72: { vol: 14, vel: 25, aus: 19, urg: 14 },
  71: { vol: 14, vel: 24, aus: 19, urg: 14 },
  69: { vol: 13, vel: 24, aus: 18, urg: 14 },
  68: { vol: 13, vel: 23, aus: 18, urg: 14 }
};

export default function RadarDores() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("radar");
  const [pains, setPains] = useState(PRE_MAPPED_PAINS);
  const [savedPains, setSavedPains] = useState<any[]>([]);
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
  
  // Save Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [painToSave, setPainToSave] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState({ notion: '', trello: '' });

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [generatingContentFor, setGeneratingContentFor] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAngles, setGeneratedAngles] = useState<any[] | null>(null);
  const [expandedPlatform, setExpandedPlatform] = useState<Record<number, string | null>>({});

  // NotebookLM State
  const [generatingNotebookLmForId, setGeneratingNotebookLmForId] = useState<number | null>(null);
  const [notebookLmScripts, setNotebookLmScripts] = useState<Record<number, string>>({});

  // Calendar State
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isGeneratingCalendar, setIsGeneratingCalendar] = useState(false);
  const [calendarProgressMsg, setCalendarProgressMsg] = useState("");
  const [calPlatform, setCalPlatform] = useState("Reels/TikTok");
  const [calStartDate, setCalStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [calLevel, setCalLevel] = useState("Mix");
  const [calProfile, setCalProfile] = useState("");

  // Filter States
  const [productFilter, setProductFilter] = useState("Todos");
  const [sourceFilters, setSourceFilters] = useState<string[]>(["GitHub Issues", "Reddit", "Twitter/X", "YouTube", "Hacker News"]);
  const [periodFilter, setPeriodFilter] = useState("Últimos 7 dias");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("anthropic_radar_saved");
    if (saved) {
      try {
        setSavedPains(JSON.parse(saved));
      } catch(e) {}
    }

    const notion = localStorage.getItem("notion_api_key") || (import.meta as any).env?.VITE_NOTION_API_KEY || "";
    const trello = localStorage.getItem("trello_api_key") || (import.meta as any).env?.VITE_TRELLO_API_KEY || "";
    setApiKeys({ notion, trello });
  }, []);

  const handleSaveClick = (pain: any) => {
    const isSaved = savedPains.some(p => p.id === pain.id);
    if (isSaved) {
      const newSaved = savedPains.filter(p => p.id !== pain.id);
      setSavedPains(newSaved);
      localStorage.setItem("anthropic_radar_saved", JSON.stringify(newSaved));
      toast.success("Dor removida dos salvos.");
    } else {
      setPainToSave(pain);
      setIsSaveModalOpen(true);
    }
  };

  const executeSave = async (destination: 'local' | 'notion' | 'trello') => {
    if (!painToSave) return;
    
    try {
      if (destination === 'notion') {
        // Simulação Notion API (CORS bloqueia nativo via front-end)
        console.log(`Sending to Notion with key ${apiKeys.notion}:`, painToSave);
      } else if (destination === 'trello') {
        // Simulação Trello API
        console.log(`Sending to Trello with key ${apiKeys.trello}:`, painToSave);
      }
      
      const newSaved = [{...painToSave, dateSaved: new Date().toISOString(), savedTo: destination}, ...savedPains];
      setSavedPains(newSaved);
      localStorage.setItem("anthropic_radar_saved", JSON.stringify(newSaved));
      
      toast.success("Dor salva com sucesso!");
      setIsSaveModalOpen(false);
      setPainToSave(null);
    } catch (err) {
      toast.error("Erro ao salvar a dor.");
    }
  };

  const isPainSaved = (id: number) => savedPains.some(p => p.id === id);

  const toggleExpandCard = (id: number) => {
    setExpandedCardId(prev => prev === id ? null : id);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      // Simulate API call and refresh feed. Just filter the PRE_MAPPED_PAINS locally
      const filtered = PRE_MAPPED_PAINS.filter(pain => {
        if (productFilter !== "Todos" && pain.product !== productFilter) return false;
        if (typeFilter !== "Todos" && pain.type !== typeFilter) return false;
        // Basic source matching
        const hasSource = pain.sources.some(s => {
          if (s.includes("GitHub") && sourceFilters.includes("GitHub Issues")) return true;
          if (s.includes("Reddit") && sourceFilters.includes("Reddit")) return true;
          if (s.includes("Twitter") && sourceFilters.includes("Twitter/X")) return true;
          if (s.includes("Hacker News") && sourceFilters.includes("Hacker News")) return true;
          if (s.includes("YouTube") && sourceFilters.includes("YouTube")) return true;
          return false;
        });
        if (!hasSource && sourceFilters.length > 0) return false;
        return true;
      });
      setPains(filtered);
      setIsSearching(false);
      if (filtered.length === 0) {
        toast.info("Nenhuma dor encontrada para os filtros selecionados.");
      } else {
        toast.success(`Encontradas ${filtered.length} dores.`);
      }
    }, 2000);
  };

  const handleGenerateContent = async (pain: any) => {
    setGeneratingContentFor(pain);
    setIsPanelOpen(true);
    setIsGenerating(true);
    setGeneratedAngles(null);
    setExpandedPlatform({});

    try {
      const ANTHROPIC_API_KEY = (import.meta as any).env.VITE_ANTHROPIC_API_KEY || "";
      if (!ANTHROPIC_API_KEY) {
        throw new Error("VITE_ANTHROPIC_API_KEY não configurada.");
      }

      const prompt = `Voce e especialista em criar conteudo para criadores de IA no Instagram, TikTok e LinkedIn, focado no ecossistema Anthropic.

Dor: ${pain.title}
Contexto: ${pain.solution_prompt}
Produto: ${pain.product}
Trechos reais da comunidade: ${pain.quote}

REGRAS PARA REELS E TIKTOK — siga esta estrutura de 60 segundos obrigatoriamente:
- 0-3s (Hook): Problema critico + promessa de solucao. Usar gancho de contradicao ou especificidade hiper-tecnica. Exemplo: 'O Claude Code esta lendo seus segredos de producao? (O erro que ninguem esta falando)'. NUNCA usar gancho generico como 'Veja como usar o Claude Code'.
- 3-10s (Frame): Por que a documentacao oficial falha e por que este metodo funciona. Criar tensao entre o que o usuario esperava e a realidade.
- 10-45s (Execucao): Passos rapidos mostrados na tela com sobreposicao de texto para leitura sem audio. Descrever cada corte de tela no roteiro.
- 45-55s (Payoff): O resultado rodando — mostrar latencia caindo, custo reduzido, erro resolvido. Resultado tangivel e visivel.
- 55-60s (CTA): Uma unica chamada para acao — salvar o prompt, seguir para mais hacks, ou comentar se passou pelo mesmo problema.

Gere 5 angulos de conteudo. Para cada angulo, gere 3 versoes de plataforma.

Responda APENAS com JSON valido:
{
  "angulos": [
    {
      "tipo": "tutorial",
      "titulo": "...",
      "reels": "[0-3s Hook] ... [3-10s Frame] ... [10-45s Execucao] ... [45-55s Payoff] ... [55-60s CTA] ...",
      "linkedin": "post completo 200-300 palavras...",
      "thread": ["tweet1", "tweet2", "tweet3", "tweet4", "tweet5"]
    },
    {
      "tipo": "polemica",
      "titulo": "...",
      "reels": "...",
      "linkedin": "...",
      "thread": ["..."]
    },
    {
      "tipo": "hack",
      "titulo": "...",
      "reels": "...",
      "linkedin": "...",
      "thread": ["..."]
    },
    {
      "tipo": "comparativo",
      "titulo": "...",
      "reels": "...",
      "linkedin": "...",
      "thread": ["..."]
    },
    {
      "tipo": "transformacao",
      "titulo": "...",
      "reels": "...",
      "linkedin": "...",
      "thread": ["..."]
    }
  ]
}
Sem markdown. Sem backticks. Apenas JSON.`;

      const response = await fetch(
        `https://api.anthropic.com/v1/messages`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true"
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4000,
            messages: [{ role: "user", content: prompt }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      const text = result.content?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const data = JSON.parse(clean);

      setGeneratedAngles(data.angulos);

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao gerar conteúdo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCalendar = async () => {
    setIsCalendarModalOpen(false);
    setIsGeneratingCalendar(true);
    setCalendarProgressMsg("Selecionando os 15 melhores problemas...");
    
    const msgs = [
      "Selecionando os 15 melhores problemas...",
      "Criando roteiros de narrativa...",
      "Escrevendo o que mostrar na tela...",
      "Definindo hooks e CTAs...",
      "Salvando no Supabase..."
    ];
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % msgs.length;
      setCalendarProgressMsg(msgs[msgIndex]);
    }, 2000);

    try {
      const sortedPains = [...PRE_MAPPED_PAINS].sort((a, b) => b.score - a.score);
      const finalPains = sortedPains.slice(0, 15);
      
      const painsText = finalPains.map((p, i) => `Problema ${i + 1}:\nTítulo: ${p.title}\nProduto: ${p.product}\nPrompt: ${p.solution_prompt}\nWorkflow: ${p.workflow.join(' -> ')}`).join('\n\n');

      const prompt = `Voce e especialista em criar conteudo para criadores de IA que aparecem na camera.
O usuario vai gravar os videos ele mesmo — voce esta criando o roteiro para ele falar e mostrar na tela.

Plataforma foco: ${calPlatform}
Nivel da audiencia: ${calLevel}
Perfil do criador: ${calProfile}
Data de inicio: ${calStartDate}

Gere roteiros para os ${finalPains.length} problemas abaixo. Para cada um, escolha o melhor angulo (tutorial | polemica | hack | comparativo | transformacao) e crie um roteiro COMPLETO que o usuario possa gravar imediatamente. Garanta que no maximo 2 angulos iguais fiquem em sequencia.

PROBLEMAS:
${painsText}

REGRAS PARA CADA ROTEIRO:
ROTEIRO_NARRACAO: O que o usuario fala em voz alta na camera. Dividido em:
- [HOOK 0-3s]: Frase de abertura. Usar contradicao ou dado especifico. Ex: 'Seu Claude Code esta vazando suas senhas de producao. Sabe como resolver?'. NUNCA usar introducoes genericas.
- [FRAME 3-10s]: Por que a documentacao oficial nao resolve e por que este metodo funciona.
- [EXECUCAO 10-45s]: Explicacao dos passos em linguagem natural, como se estivesse ensinando um amigo.
- [PAYOFF 45-55s]: Resultado concreto — tempo economizado, erro resolvido, custo reduzido.
- [CTA 55-60s]: Uma unica acao usando ${calProfile || 'o meu perfil'}. Ex: 'Salva esse roteiro' ou 'Comenta se voce passou por isso'.

ROTEIRO_TELA: O que mostrar na tela enquanto fala. Descricao de cada corte:
- Ex: '[0-3s] Mostrar terminal com erro / [3-10s] Abrir CLAUDE.md vazio / [10-20s] Colar o hook no arquivo...'

HOOK: Apenas a frase de abertura dos primeiros 3 segundos
CTA: Apenas a frase final de call to action
DURACAO_ESTIMADA: Tempo estimado do video (ex: '45-60 segundos')
HASHTAGS: Array de 5-7 hashtags relevantes para a dor e produto

Responda APENAS com JSON valido no seguinte formato exato (sem \`\`\`json, sem markdown):
{
  "roteiros": [
    {
      "dia": 1,
      "dor_titulo": "...",
      "dor_tipo": "...",
      "produto": "...",
      "angulo": "...",
      "plataforma": "...",
      "roteiro_narracao": "[HOOK 0-3s] ... [FRAME 3-10s] ... [EXECUCAO 10-45s] ... [PAYOFF 45-55s] ... [CTA 55-60s] ...",
      "roteiro_tela": "[0-3s] ... [3-10s] ... [10-45s] ... [45-55s] ... [55-60s] ...",
      "hook": "...",
      "cta": "...",
      "duracao_estimada": "...",
      "hashtags": ["...", "...", "...", "...", "..."]
    }
  ]
}`;

      const response = await fetch(
        `https://api.anthropic.com/v1/messages`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-api-key": (import.meta as any).env.VITE_ANTHROPIC_API_KEY || "",
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true"
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 8000,
            system: "Você retornará APENAS o JSON puro.",
            messages: [{ role: "user", content: prompt }]
          })
        }
      );

      if (!response.ok) throw new Error("Erro na API do Claude");

      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      let jsonMatches = null;
      try {
        jsonMatches = JSON.parse(text);
      } catch (e) {
        const jsonMatchInfo = text.match(/\{[\s\S]*\}/);
        if (jsonMatchInfo) {
          jsonMatches = JSON.parse(jsonMatchInfo[0]);
        } else {
          throw new Error("Formato JSON inválido retornado pelo Claude.");
        }
      }

      if (!jsonMatches?.roteiros) throw new Error("Formato json incorreto");

      const batchId = crypto.randomUUID?.() || Math.random().toString(36).substring(2);
      const rows = jsonMatches.roteiros.map((r: any) => {
        const d = new Date(calStartDate);
        d.setDate(d.getDate() + (r.dia - 1));
        const formattedDate = d.toISOString().split('T')[0];

        return {
          user_id: 'default_user',
          batch_id: batchId,
          dia: r.dia,
          data_publicacao: formattedDate,
          dor_titulo: r.dor_titulo,
          dor_tipo: r.dor_tipo || "Problema",
          produto: r.produto,
          angulo: r.angulo,
          plataforma: r.plataforma || calPlatform,
          roteiro_narracao: r.roteiro_narracao,
          roteiro_tela: r.roteiro_tela,
          hook: r.hook,
          cta: r.cta,
          duracao_estimada: r.duracao_estimada,
          hashtags: r.hashtags,
          status: 'pendente'
        };
      });

      const { error } = await supabase.from('calendario_conteudo').insert(rows);
      if (error) throw error;

      toast.success("15 roteiros gerados e salvos! Abrindo calendário...");
      setTimeout(() => navigate('/calendario'), 2000);
      
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao gerar calendário");
    } finally {
      clearInterval(msgInterval);
      setIsGeneratingCalendar(false);
    }
  };

  const handleGenerateNotebookLmScript = async (pain: any) => {
    setGeneratingNotebookLmForId(pain.id);
    
    try {
      const ANTHROPIC_API_KEY = (import.meta as any).env.VITE_ANTHROPIC_API_KEY || "";
      if (!ANTHROPIC_API_KEY) {
        throw new Error("VITE_ANTHROPIC_API_KEY não configurada.");
      }

      const prompt = `Voce e um especialista em educacao tecnica sobre IA e Claude Code.

Crie um documento estruturado e detalhado para ser usado como fonte no NotebookLM 
para gerar um Audio Overview explicando a solucao para a seguinte dor:

TITULO DA DOR: ${pain.title}
PRODUTO: ${pain.product}
DESCRICAO DO PROBLEMA: ${pain.type}
TRECHO REAL DA COMUNIDADE: ${pain.quote}
PROMPT DE SOLUCAO: ${pain.solution_prompt}
WORKFLOW DE SOLUCAO: ${pain.workflow.join('\n')}

O documento deve ter este formato:

# [Titulo da dor] — Guia Completo de Solucao

## O Problema
[Explicacao detalhada do problema em linguagem conversacional, como se estivesse explicando para um desenvolvedor frustrado. Mencionar por que isso acontece tecnicamente, qual o impacto no dia a dia e por que a documentacao oficial nao resolve.]

## Por que isso e mais comum do que parece
[Contexto do ecossistema — quantas pessoas sofrem com isso, por que surgiu, o que a Anthropic ainda nao resolveu oficialmente.]

## A Solucao Passo a Passo
[Expandir cada passo do workflow em paragrafos conversacionais. Cada passo deve ter: o que fazer, por que funciona, o que acontece se nao fizer, dica pratica.]

## O Prompt Pronto
[Incluir o prompt de solucao com explicacao de cada parte — por que cada instrucao esta ali e o que ela faz.]

## Resultado Esperado
[Descrever em detalhes o que muda depois de aplicar a solucao: tempo economizado, erros evitados, qualidade do codigo, reducao de custo.]

## Perguntas Frequentes
[Gerar 3-4 perguntas que um desenvolvedor faria sobre esta solucao, com respostas completas.]

## Resumo Executivo
[3 pontos principais que o desenvolvedor deve lembrar desta solucao.]

Escreva em portugues brasileiro. Tom conversacional mas tecnico. 
Como se fosse um podcast entre dois especialistas explicando a solucao.`;

      const response = await fetch(
        `https://api.anthropic.com/v1/messages`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true"
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2000,
            messages: [{ role: "user", content: prompt }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      const text = result.content?.[0]?.text || "";
      
      setNotebookLmScripts(prev => ({ ...prev, [pain.id]: text }));
      toast.success("Roteiro para NotebookLM gerado com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao gerar roteiro.");
    } finally {
      setGeneratingNotebookLmForId(null);
    }
  };

  const copyAllAngles = () => {
    if (!generatedAngles) return;
    const text = generatedAngles.map(a => `
### Ângulo: ${a.titulo} (${a.tipo.toUpperCase()})

**Reels/TikTok:**
${a.reels}

**LinkedIn:**
${a.linkedin}

**Thread (X):**
${a.thread.join('\n')}
    `).join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
    toast.success("Pacote completo copiado!");
  };

  const topPain = PRE_MAPPED_PAINS.find(p => p.score > 70);

  return (
    <TooltipProvider>
      <div className="relative min-h-screen pb-16">
      {topPain && (
        <div className="w-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-b border-primary/20 p-4 mb-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-primary fill-primary animate-pulse" />
                <span className="text-xs font-bold text-primary tracking-widest uppercase">Janela Aberta Agora</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">{topPain.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {topPain.growth} · {topPain.mentions} menções hoje · Nenhum vídeo no YouTube ainda
              </p>
              <p className="text-xs font-mono text-warning/80 text-yellow-500 mt-2">Você tem ~{topPain.window_hours}h antes do mercado saturar</p>
            </div>
            <Button size="lg" className="bg-primary hover:bg-primary/90 font-bold whitespace-nowrap" onClick={() => handleGenerateContent(topPain)}>
              <Zap className="h-4 w-4 mr-2" /> Gerar Conteúdo Agora →
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative">
        {/* Left Column - Filters */}
        <div className="md:col-span-4 lg:col-span-4 space-y-6 sticky top-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 glow-primary">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Filtros</h2>
              <p className="text-xs text-muted-foreground">Radar Anthropic</p>
            </div>
          </div>

          <Card className="border-border bg-card/60 backdrop-blur-sm shadow-xl">
            <CardContent className="p-5 space-y-6">
              {/* Product */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Produto</h4>
                <div className="flex flex-wrap gap-2">
                  {["Todos", "Claude Code", "Claude API", "Claude.ai", "Opus", "Sonnet", "Haiku", "Claude Cowork", "MCP"].map(prod => (
                    <button 
                      key={prod}
                      onClick={() => setProductFilter(prod)}
                      className={`text-[11px] px-3 py-1.5 rounded-full font-medium transition-colors border ${productFilter === prod ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/30 text-muted-foreground border-border/50 hover:bg-secondary/50'}`}
                    >
                      {prod}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Fonte</h4>
                <div className="flex flex-col gap-2.5">
                  {["GitHub Issues", "Reddit", "Twitter/X", "YouTube", "Hacker News"].map(source => (
                    <div key={source} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`src-${source}`} 
                        checked={sourceFilters.includes(source)} 
                        onCheckedChange={(c) => {
                          setSourceFilters(prev => c ? [...prev, source] : prev.filter(s => s !== source));
                        }} 
                      />
                      <label htmlFor={`src-${source}`} className="text-sm cursor-pointer">{source}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Period */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Período</h4>
                <RadioGroup value={periodFilter} onValueChange={setPeriodFilter} className="flex flex-col gap-2.5">
                  {["Últimas 24h", "Últimos 7 dias", "Últimos 30 dias"].map(period => (
                    <div key={period} className="flex items-center space-x-2">
                      <RadioGroupItem value={period} id={`period-${period}`} />
                      <label htmlFor={`period-${period}`} className="text-sm cursor-pointer">{period}</label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Type */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tipo de dor</h4>
                <div className="flex flex-wrap gap-2">
                  {["Todos", "Erro tecnico", "Custo/tokens", "Seguranca", "Configuracao", "Performance", "Integracao", "API"].map(type => (
                    <button 
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`text-[11px] px-3 py-1.5 rounded-full font-medium transition-colors border ${typeFilter === type ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/30 text-muted-foreground border-border/50 hover:bg-secondary/50'}`}
                    >
                      {type === 'Erro tecnico' ? 'Erro técnico' : type === 'Configuracao' ? 'Configuração' : type === 'Securanca' ? 'Segurança' : type === 'Integracao' ? 'Integração' : type}
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleSearch} 
                disabled={isSearching} 
                className="w-full h-12 gap-2 bg-primary hover:bg-primary/90 font-bold"
              >
                {isSearching ? <><Loader2 className="h-4 w-4 animate-spin" /> Buscando...</> : <><Search className="h-4 w-4" /> Buscar Dores Agora</>}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Center Column - Feed */}
        <div className="md:col-span-8 lg:col-span-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <TabsList className="bg-secondary/40 p-1 rounded-xl">
                <TabsTrigger value="radar" className="rounded-lg gap-2 text-xs">
                  <Cpu className="h-4 w-4" /> Radar Real-time
                </TabsTrigger>
                <TabsTrigger value="salvos" className="rounded-lg gap-2 text-xs">
                  <Bookmark className="h-4 w-4" /> Salvos ({savedPains.length})
                </TabsTrigger>
              </TabsList>
              
              <Button 
                 size="sm" 
                 className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-4 shadow-sm shrink-0"
                 onClick={() => setIsCalendarModalOpen(true)}
              >
                 📅 Gerar Calendário 15 Dias
              </Button>
            </div>

            <TabsContent value="radar" className="space-y-4 m-0">
              {pains.length === 0 ? (
                <div className="text-center py-20 bg-card/30 rounded-xl border border-dashed border-border">
                  <Search className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhuma dor encontrada com esses filtros.</p>
                  <p className="text-sm text-muted-foreground mt-2">Tente ampliar o período ou selecionar "Todos" os produtos.</p>
                  <Button variant="outline" className="mt-4" onClick={() => { setProductFilter("Todos"); setTypeFilter("Todos"); setSourceFilters(["GitHub Issues", "Reddit", "Twitter/X", "YouTube", "Hacker News"]); setPeriodFilter("Últimos 7 dias"); handleSearch();}}>
                    Limpar Filtros
                  </Button>
                </div>
              ) : (
                <AnimatePresence>
                  {pains.map(pain => (
                    <motion.div key={pain.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                      <Card className="border-border bg-card/40 hover:bg-card/60 transition-colors shadow-lg overflow-hidden group">
                        <CardHeader className="p-5 pb-3">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex flex-wrap gap-2">
                              <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${BADGE_COLORS[pain.badge]}`}>
                                {pain.badge === "ALTA DEMANDA" && <span className="mr-1">🔴</span>}
                                {pain.badge === "JANELA ABERTA" && <span className="mr-1">⚡</span>}
                                {pain.badge === "EMERGINDO" && <span className="mr-1">🟡</span>}
                                {pain.badge === "ESTÁVEL" && <span className="mr-1">🟢</span>}
                                {pain.badge}
                              </span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-bold cursor-help flex items-center">
                                    Score {pain.score}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="p-3 text-sm space-y-1 z-50 bg-card border border-border shadow-xl" side="top">
                                  <p className="font-bold mb-2">Score: {pain.score}/100</p>
                                  <p className="text-muted-foreground">📊 Volume de menções: <span className="text-foreground">{SCORE_BREAKDOWN[pain.score]?.vol || 0} pts</span></p>
                                  <p className="text-muted-foreground">🚀 Velocidade de crescimento: <span className="text-foreground">{SCORE_BREAKDOWN[pain.score]?.vel || 0} pts</span></p>
                                  <p className="text-muted-foreground">🔍 Ausência de conteúdo: <span className="text-foreground">{SCORE_BREAKDOWN[pain.score]?.aus || 0} pts</span></p>
                                  <p className="text-muted-foreground">⚠️ Urgência técnica: <span className="text-foreground">{SCORE_BREAKDOWN[pain.score]?.urg || 0} pts</span></p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <span className="text-[10px] bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full font-medium h-fit">
                              {pain.product}
                            </span>
                          </div>
                          <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors cursor-pointer" onClick={() => toggleExpandCard(pain.id)}>
                            {pain.title}
                          </CardTitle>
                          <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {pain.mentions} menções</span>
                            <span className="flex items-center gap-1 text-primary"><TrendingUp className="h-3 w-3" /> {pain.growth}</span>
                          </div>
                        </CardHeader>
                        <CardContent className="p-5 pt-0 space-y-4">
                          <p className="text-[11px] text-muted-foreground/80 font-medium">Fontes: {pain.sources.join(" · ")}</p>
                          
                          <div className="p-3 bg-secondary/30 rounded-xl border-l-2 border-primary/50 text-sm italic text-muted-foreground line-clamp-2">
                            "{pain.quote}"
                          </div>

                          <AnimatePresence>
                            {expandedCardId === pain.id && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-6 pt-4 border-t border-border/50 overflow-hidden">
                                <div className="space-y-3">
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                    <Terminal className="h-4 w-4" /> Cole este prompt no Claude Code:
                                  </h4>
                                  <div className="relative group">
                                    <pre className="text-xs p-4 rounded-xl bg-black border border-border/40 font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                      {pain.solution_prompt}
                                    </pre>
                                    <Button size="icon" variant="secondary" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleCopy(pain.solution_prompt)}>
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" /> Workflow da Solução:
                                  </h4>
                                  <div className="bg-secondary/20 p-4 rounded-xl border border-border/30">
                                    <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
                                      {pain.workflow.map((step: string, i: number) => (
                                        <li key={i}>{step}</li>
                                      ))}
                                    </ol>
                                    <Button variant="outline" size="sm" className="mt-4 gap-2 text-xs" onClick={() => handleCopy(pain.workflow.join('\n'))}>
                                      <Copy className="h-3 w-3" /> Copiar Workflow
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="space-y-3 pt-4 border-t border-border/30">
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                                    🎙️ ROTEIRO PARA NOTEBOOKLM
                                  </h4>
                                  <p className="text-xs text-muted-foreground pb-2">
                                    Gere um documento para o NotebookLM criar o áudio/vídeo desta solução
                                  </p>
                                  
                                  {!notebookLmScripts[pain.id] ? (
                                    <Button 
                                      onClick={() => handleGenerateNotebookLmScript(pain)}
                                      disabled={generatingNotebookLmForId === pain.id}
                                      variant="outline"
                                      className="w-full justify-center gap-2"
                                    >
                                      {generatingNotebookLmForId === pain.id ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando roteiro...</> : <>🎙️ Gerar Roteiro NotebookLM</>}
                                    </Button>
                                  ) : (
                                    <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                                      <div className="relative group">
                                        <pre className="text-xs p-4 rounded-xl bg-card border border-border/50 font-sans text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                                          {notebookLmScripts[pain.id]}
                                        </pre>
                                      </div>
                                      <div className="flex flex-col sm:flex-row gap-2">
                                        <Button className="flex-1 gap-2" variant="secondary" onClick={() => handleCopy(notebookLmScripts[pain.id])}>
                                          <Copy className="h-4 w-4" /> Copiar documento
                                        </Button>
                                        <Button className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => window.open('https://notebooklm.google.com', '_blank')}>
                                          📓 Abrir NotebookLM
                                        </Button>
                                      </div>
                                      <div className="text-[11px] text-muted-foreground/60 p-3 bg-secondary/10 rounded-lg border border-border/20">
                                        <ol className="list-decimal pl-4 space-y-1">
                                          <li>Copie o documento acima</li>
                                          <li>Abra o NotebookLM</li>
                                          <li>Crie um novo notebook</li>
                                          <li>Cole o documento como fonte</li>
                                          <li>Clique em 'Audio Overview' para gerar o áudio/vídeo</li>
                                        </ol>
                                      </div>

                                      <div className="space-y-3 pt-2">
                                        <h5 className="text-[11px] font-bold text-foreground/80 uppercase tracking-tight">O que você pode fazer depois de gerar</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                          <div className="p-3 rounded-lg bg-black/20 border border-border/40 space-y-2">
                                            <Mic className="h-4 w-4 text-primary" />
                                            <h6 className="text-xs font-bold text-foreground">Podcast técnico</h6>
                                            <p className="text-[10px] text-muted-foreground leading-tight">O NotebookLM gera dois hosts de IA conversando sobre a solução. Você pode interromper e fazer perguntas durante o áudio.</p>
                                          </div>
                                          <div className="p-3 rounded-lg bg-black/20 border border-border/40 space-y-2">
                                            <Layers className="h-4 w-4 text-primary" />
                                            <h6 className="text-xs font-bold text-foreground">Cruzar fontes</h6>
                                            <p className="text-[10px] text-muted-foreground leading-tight">Adicione o roteiro + o vídeo do YouTube sobre o mesmo problema + a documentação oficial. O NotebookLM cruza tudo num único entendimento.</p>
                                          </div>
                                          <div className="p-3 rounded-lg bg-black/20 border border-border/40 space-y-2">
                                            <Search className="h-4 w-4 text-primary" />
                                            <h6 className="text-xs font-bold text-foreground">Encontrar gaps</h6>
                                            <p className="text-[10px] text-muted-foreground leading-tight">Cole a documentação do seu projeto junto. O NotebookLM encontra onde as instruções se contradizem ou onde falta informação.</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="flex items-center gap-2 pt-2">
                            <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90 font-bold" onClick={() => handleGenerateContent(pain)}>
                              <Sparkles className="h-4 w-4" /> Gerar Conteúdo
                            </Button>
                            <Button size="sm" variant="outline" className="gap-2" onClick={() => toggleExpandCard(pain.id)}>
                              <Eye className="h-4 w-4" /> {expandedCardId === pain.id ? 'Ocultar' : 'Ver Detalhes'}
                            </Button>
                            <Button size="sm" variant="ghost" className={`gap-2 ${isPainSaved(pain.id) ? 'text-primary' : ''}`} onClick={() => handleSaveClick(pain)}>
                              <Bookmark className={`h-4 w-4 ${isPainSaved(pain.id) ? 'fill-primary' : ''}`} /> 
                              {isPainSaved(pain.id) ? 'Salvo' : 'Salvar'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </TabsContent>

            <TabsContent value="salvos" className="space-y-4 m-0">
              {savedPains.length === 0 ? (
                <div className="text-center py-20 bg-card/30 rounded-xl border border-dashed border-border">
                  <Bookmark className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhuma dor salva ainda.</p>
                  <p className="text-sm text-muted-foreground mt-2">Clique em "Salvar" em qualquer card para adicioná-lo aqui.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {savedPains.map(pain => (
                    <motion.div key={pain.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                      <Card className="border-border bg-card/40 hover:bg-card/60 transition-colors shadow-lg">
                        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border inline-block ${BADGE_COLORS[pain.badge]}`}>
                                {pain.badge}
                              </span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold cursor-help inline-block">
                                    Score {pain.score}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="p-3 text-sm space-y-1 z-50 bg-card border border-border shadow-xl" side="top">
                                  <p className="font-bold mb-2">Score: {pain.score}/100</p>
                                  <p className="text-muted-foreground">📊 Volume de menções: <span className="text-foreground">{SCORE_BREAKDOWN[pain.score]?.vol || 0} pts</span></p>
                                  <p className="text-muted-foreground">🚀 Velocidade de crescimento: <span className="text-foreground">{SCORE_BREAKDOWN[pain.score]?.vel || 0} pts</span></p>
                                  <p className="text-muted-foreground">🔍 Ausência de conteúdo: <span className="text-foreground">{SCORE_BREAKDOWN[pain.score]?.aus || 0} pts</span></p>
                                  <p className="text-muted-foreground">⚠️ Urgência técnica: <span className="text-foreground">{SCORE_BREAKDOWN[pain.score]?.urg || 0} pts</span></p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <h3 className="text-base font-bold text-foreground mb-1">{pain.title}</h3>
                            <p className="text-xs text-muted-foreground">
                              Salvo em {new Date(pain.dateSaved).toLocaleDateString()}
                              {pain.savedTo && ` · Destino: ${pain.savedTo === 'local' ? 'Local' : pain.savedTo === 'notion' ? 'Notion' : 'Trello'}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90 font-bold" onClick={() => handleGenerateContent(pain)}>
                              <Sparkles className="h-3 w-3" /> Gerar Conteúdo
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleSaveClick(pain)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Save Modal */}
      <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Salvar dor</DialogTitle>
            <DialogDescription>
              Escolha onde deseja salvar esta oportunidade.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <div className="p-3 border border-border rounded-xl bg-secondary/20 flex flex-col gap-2">
              <span className="text-sm font-semibold text-foreground">Opção 1 — Salvar localmente</span>
              <Button onClick={() => executeSave('local')} className="w-full justify-start gap-2 bg-secondary hover:bg-secondary/80 text-foreground font-medium">
                <Bookmark className="h-4 w-4" /> Salvar no app
              </Button>
            </div>

            <div className="p-3 border border-border rounded-xl bg-secondary/20 flex flex-col gap-2">
              <span className="text-sm font-semibold text-foreground">Opção 2 — Enviar para Notion</span>
              {apiKeys.notion ? (
                <Button onClick={() => executeSave('notion')} className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                  <FileText className="h-4 w-4" /> Criar página no Notion
                </Button>
              ) : (
                <div title="Conecte o Notion na aba APIs Conectadas para usar esta função">
                  <Button disabled className="w-full justify-start gap-2 bg-secondary/50 text-muted-foreground font-medium cursor-not-allowed">
                    <FileText className="h-4 w-4 opacity-50" /> Criar página no Notion
                  </Button>
                </div>
              )}
            </div>

            <div className="p-3 border border-border rounded-xl bg-secondary/20 flex flex-col gap-2">
              <span className="text-sm font-semibold text-foreground">Opção 3 — Enviar para Trello</span>
              {apiKeys.trello ? (
                <Button onClick={() => executeSave('trello')} className="w-full justify-start gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium">
                  <Layers className="h-4 w-4" /> Criar card no Trello
                </Button>
              ) : (
                <div title="Conecte o Trello na aba APIs Conectadas para usar esta função">
                  <Button disabled className="w-full justify-start gap-2 bg-secondary/50 text-muted-foreground font-medium cursor-not-allowed">
                    <Layers className="h-4 w-4 opacity-50" /> Criar card no Trello
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Right Panel Slide-in for Content Generation */}
      <AnimatePresence>
        {isPanelOpen && generatingContentFor && (
          <>
            {/* Backdrop for mobile */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsPanelOpen(false)}
            />
            
            <motion.div 
              initial={{ x: '100%', opacity: 0.5 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-screen w-full md:w-[480px] bg-card border-l border-border/50 shadow-2xl z-50 flex flex-col"
            >
              <div className="p-5 border-b border-border/30 flex items-start justify-between bg-secondary/10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Geração de Conteúdo</span>
                  </div>
                  <h3 className="text-sm font-bold leading-tight pr-4">{generatingContentFor.title}</h3>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setIsPanelOpen(false)} className="shrink-0 rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-5">
                {isGenerating ? (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center glow-primary mb-6">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      </div>
                      <h4 className="text-lg font-bold">Gerando 5 Ângulos</h4>
                      <p className="text-sm text-muted-foreground mt-2 max-w-[250px]">
                        Isolando contextos, extraindo dores e criando variações de alto engajamento...
                      </p>
                    </div>
                    {/* Skeleton Cards */}
                    {[1,2,3].map(i => (
                      <Card key={i} className="border-border/30 bg-secondary/5 animate-pulse">
                        <CardHeader className="p-4 space-y-3">
                          <div className="h-4 w-24 bg-secondary/50 rounded-full" />
                          <div className="h-5 w-full bg-secondary/50 rounded" />
                          <div className="flex gap-2 pt-2">
                            <div className="h-8 w-16 bg-secondary/50 rounded-md" />
                            <div className="h-8 w-16 bg-secondary/50 rounded-md" />
                            <div className="h-8 w-16 bg-secondary/50 rounded-md" />
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : generatedAngles ? (
                  <div className="space-y-6 pb-20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">5 Ângulos Gerados</h4>
                    </div>
                    
                    {generatedAngles.map((angle: any, index: number) => (
                      <Card key={index} className="border-primary/20 bg-card/60 shadow-md relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
                        <CardHeader className="p-4">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded-sm w-fit inline-block mb-2">
                            {ANGLE_TYPES[angle.tipo.toLowerCase()] || angle.tipo}
                          </span>
                          <CardTitle className="text-sm leading-snug">{angle.titulo}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {['reels', 'linkedin', 'thread'].map(plat => (
                              <Button 
                                key={plat}
                                size="sm" 
                                variant={expandedPlatform[index] === plat ? "default" : "secondary"}
                                className={`h-7 text-[10px] ${expandedPlatform[index] === plat ? 'bg-primary font-bold' : ''}`}
                                onClick={() => setExpandedPlatform(prev => ({ ...prev, [index]: prev[index] === plat ? null : plat }))}
                              >
                                {plat === 'reels' ? 'Reels / TikTok' : plat === 'thread' ? 'X / Threads' : 'LinkedIn'}
                              </Button>
                            ))}
                          </div>
                          
                          <AnimatePresence>
                            {expandedPlatform[index] && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="p-3 bg-secondary/30 rounded-xl border border-border/50 text-xs font-mono text-muted-foreground whitespace-pre-wrap mt-2 relative group">
                                  {expandedPlatform[index] === 'thread' && Array.isArray(angle.thread) 
                                    ? angle.thread.map((t: string, i: number) => `${i+1}/ ${t}`).join('\n\n')
                                    : angle[expandedPlatform[index] as string]
                                  }
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black"
                                    onClick={() => handleCopy(
                                      expandedPlatform[index] === 'thread' && Array.isArray(angle.thread) 
                                      ? angle.thread.map((t: string, i: number) => `${i+1}/ ${t}`).join('\n\n')
                                      : angle[expandedPlatform[index] as string]
                                    )}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">Erro ao carregar os dados.</div>
                )}
              </ScrollArea>
              
              {/* Bottom Actions */}
              {generatedAngles && (
                <div className="p-4 border-t border-border/30 bg-card/80 backdrop-blur-md flex items-center justify-between gap-2">
                  <Button variant="outline" className="text-xs h-9 flex-1" onClick={copyAllAngles}>
                    <Copy className="h-3 w-3 mr-2" /> Copiar Todos
                  </Button>
                  <Button className="font-bold text-xs h-9 flex-1 bg-primary hover:bg-primary/90" onClick={() => toast.success("Pack salvo em Meus Conteúdos!")}>
                    <Bookmark className="h-3 w-3 mr-2 fill-primary-foreground/30" /> Salvar Pack
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Calendar Config Modal */}
      <Dialog open={isCalendarModalOpen} onOpenChange={setIsCalendarModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Configurar Calendário de 15 Dias</DialogTitle>
            <DialogDescription>
              Defina as diretrizes para a geração em massa.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Plataforma foco</label>
              <RadioGroup value={calPlatform} onValueChange={setCalPlatform} className="flex gap-4">
                {["Reels/TikTok", "LinkedIn", "Thread X", "Mix"].map(p => (
                  <div key={p} className="flex items-center space-x-2">
                    <RadioGroupItem value={p} id={`p-${p}`} />
                    <label htmlFor={`p-${p}`} className="text-sm cursor-pointer">{p}</label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Começar em</label>
              <Input type="date" value={calStartDate} onChange={(e) => setCalStartDate(e.target.value)} className="bg-secondary/30" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Nível da audiência</label>
              <RadioGroup value={calLevel} onValueChange={setCalLevel} className="flex gap-4">
                {["Iniciante", "Intermediário", "Avançado", "Mix"].map(l => (
                  <div key={l} className="flex items-center space-x-2">
                    <RadioGroupItem value={l} id={`l-${l}`} />
                    <label htmlFor={`l-${l}`} className="text-sm cursor-pointer">{l}</label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Seu nome/perfil (opcional)</label>
              <Input 
                type="text" 
                placeholder="@seuperfil — aparece nos CTAs gerados" 
                value={calProfile} 
                onChange={(e) => setCalProfile(e.target.value)} 
                className="bg-secondary/30"
              />
            </div>
            
            <div className="mt-4">
              <Button onClick={handleGenerateCalendar} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2">
                <Zap className="h-4 w-4" /> Gerar 15 Roteiros Agora
              </Button>
              <p className="text-[11px] text-muted-foreground text-center mt-3 leading-relaxed px-2">
                Isso usa 1 chamada à API do Claude e salva tudo no Supabase. Não será necessário gerar novamente por 15 dias.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generating Calendar Full Screen Overlay */}
      {isGeneratingCalendar && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="bg-card border border-border/50 rounded-2xl p-8 flex flex-col items-center justify-center max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 relative">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Gerando 15 roteiros com IA...</h3>
            <p className="text-sm text-muted-foreground text-center h-6 animate-pulse">{calendarProgressMsg}</p>
          </div>
        </div>
      )}

      </div>
    </TooltipProvider>
  );
}
