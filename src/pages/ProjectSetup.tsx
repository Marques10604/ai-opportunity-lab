import React, { useState } from "react";
import { 
  Github, Link as LinkIcon, Cpu, Sparkles, CheckCircle2, Loader2, 
  Terminal, Download, Copy, Check, FileCode, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import JSZip from "jszip";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

const FILE_CARDS = [
  { id: "CLAUDE.md", icon: "🧠", name: "CLAUDE.md", path: "raiz/", tooltip: "Memoria do Claude em toda sessao", badge: "Mais importante", critical: true },
  { id: "AGENTS.md", icon: "🤖", name: "AGENTS.md", path: "raiz/", tooltip: "Funciona em Claude Code, Cursor e Codex" },
  { id: "README.md", icon: "📖", name: "README.md", path: "raiz/", tooltip: "Visao geral para humanos e IA" },
  { id: "features.md", icon: "📋", name: "features.md", path: "raiz/", tooltip: "Evita sugerir o que ja existe" },
  { id: "roadmap.md", icon: "🗺️", name: "roadmap.md", path: "raiz/", tooltip: "Alinha com seu plano real" },
  { id: "ARCHITECTURE.md", icon: "🏗️", name: "ARCHITECTURE.md", path: "raiz/", tooltip: "Claude nunca quebra sua arquitetura" },
  { id: "TECH_STACK.md", icon: "🔧", name: "TECH_STACK.md", path: "raiz/", tooltip: "Para de sugerir trocar a stack" },
  { id: ".claude/settings.json", icon: "⚙️", name: "settings.json", path: ".claude/", tooltip: "Economiza ate 70% dos tokens", badge: "Economiza 70% tokens", critical: true },
  { id: "rules", match: ".claude/rules/", icon: "📏", name: "rules/", path: ".claude/", tooltip: "Regras que o Claude nunca ignora" },
  { id: "commands", match: ".claude/commands/", icon: "⚡", name: "commands/", path: ".claude/", tooltip: "Atalhos /tdd /plan /code-review" },
  { id: ".claude/hooks/hooks.json", icon: "🪝", name: "hooks.json", path: ".claude/hooks/", tooltip: "Bloqueia leitura de .env e secrets" },
  { id: "contexts", match: "contexts/", icon: "🔄", name: "contexts/", path: "raiz/", tooltip: "Muda comportamento por modo" },
  { id: ".tasks", match: ".tasks/", icon: "📁", name: ".tasks/", path: "raiz/", tooltip: "Tarefas ja preenchidas do seu roadmap", badge: "Elimina context rot", critical: true },
  { id: ".ai/handoff.md", icon: "📝", name: "handoff.md", path: ".ai/", tooltip: "Continuidade entre dias" },
  { id: "mcp-servers", match: "mcp-configs/mcp-servers.json", icon: "🔌", name: "mcp-servers.json", path: "mcp-configs/", tooltip: "Conecta suas integracoes" },
  { id: "SETUP-GUIDE.md", icon: "📘", name: "SETUP-GUIDE.md", path: "ZIP/", tooltip: "Instrucoes dentro do pacote" }
];

const BR_INTEGRATIONS = ["Pagar.me", "Mercado Pago", "Correios", "NFe"];
const INTL_INTEGRATIONS = ["Supabase", "Stripe", "GitHub", "Vercel", "Railway", "AWS", "Slack", "Notion"];
const STACK_OPTIONS = [
  "TypeScript/Next.js", "TypeScript/Node.js", "Python/Django", "Python/FastAPI", 
  "React/Vite", "Go", "Java/Spring Boot", "React Native", "Flutter", "Outra"
];

export default function ProjectSetup() {
  const [activeTab, setActiveTab] = useState("manual");
  
  // Form State
  const [formData, setFormData] = useState({
    projectName: "",
    description: "",
    objective: "",
    techStack: "",
    techStackOther: "",
    features: "",
    roadmap: "",
    teamSize: "Solo Dev",
    integrations: [] as string[],
    additionalContext: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // GitHub State
  const [githubUrl, setGithubUrl] = useState("");
  const [analyzingGithub, setAnalyzingGithub] = useState(false);

  // Generation State
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [generatedFiles, setGeneratedFiles] = useState<Record<string, string> | null>(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (value: string, name: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleIntegrationToggle = (integration: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      integrations: checked 
        ? [...prev.integrations, integration]
        : prev.integrations.filter(i => i !== integration)
    }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.projectName || formData.projectName.length < 3) errors.projectName = "Mínimo 3 caracteres";
    if (!formData.techStack) errors.techStack = "Obrigatório";
    if (formData.techStack === "Outra" && !formData.techStackOther) errors.techStackOther = "Especifique a stack";
    if (!formData.description || formData.description.length < 20) errors.description = "Mínimo 20 caracteres";
    if (!formData.objective) errors.objective = "Obrigatório";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const callAI = async (projectData: typeof formData) => {
    const ANTHROPIC_API_KEY = (import.meta as any).env.VITE_ANTHROPIC_API_KEY || "";
    if (!ANTHROPIC_API_KEY) {
      throw new Error("VITE_ANTHROPIC_API_KEY não configurada no ambiente.");
    }

    setGenerationStep("Gerando arquivos com Claude API...");

    const finalStack = projectData.techStack === "Outra" ? projectData.techStackOther : projectData.techStack;

    const prompt = `Voce e especialista em configuracao de Claude Code. Gere um pacote completo de arquivos para o projeto abaixo. TODOS os arquivos devem ter conteudo REAL e COMPLETO baseado nas informacoes do projeto. NENHUM arquivo pode ter placeholders, templates vazios ou instrucoes para o usuario preencher. Tudo deve vir preenchido automaticamente.

Projeto: ${projectData.projectName}
Stack: ${finalStack}
O que faz: ${projectData.description}
Objetivo: ${projectData.objective}
Features atuais: ${projectData.features}
Roadmap: ${projectData.roadmap}
Tamanho do time: ${projectData.teamSize}
Integracoes: ${projectData.integrations.join(', ')}
Contexto adicional: ${projectData.additionalContext}

Use o contexto adicional para enriquecer o CLAUDE.md (secao Custom Context), o ARCHITECTURE.md (decisoes especificas do projeto) e os arquivos .tasks/ (restricoes e padroes unicos deste projeto).

Gere os seguintes arquivos com conteudo real e completo:

CLAUDE.md — instrucoes persistentes com: visao geral do projeto, comandos principais (npm run dev, build, test), arquitetura, convencoes de codigo, o que o Claude NUNCA deve fazer neste projeto especifico (SEMPRE incluir a regra de NUNCA usar autocompact automatico), estrutura de pastas. Se houver contexto adicional, incluir em secao propria chamada Custom Context no final do arquivo.

AGENTS.md — descricao do projeto para agentes de IA (Claude Code, Cursor, Codex, OpenCode), politicas de delegacao, quando usar cada modo.

README.md — visao geral completa: o que e o projeto, stack, como rodar localmente, estrutura de pastas, variaveis de ambiente necessarias.

features.md — lista real das features com status: Implemented (baseado em features atuais), In Progress, Planned (baseado no roadmap), Out of Scope.

roadmap.md — plano de desenvolvimento com prioridades reais baseado no roadmap informado, com complexidade estimada (baixa/media/alta) para cada item.

ARCHITECTURE.md — arquitetura tecnica real: camadas do sistema, fluxo de dados, como os modulos se conectam, decisoes de design e por que foram tomadas, o que nunca quebrar. Se houver contexto adicional relevante para arquitetura (ex: monorepo, LGPD, regras de negocio especificas), incluir em secao Decisoes Especificas do Projeto.

TECH_STACK.md — tecnologias com versoes estimadas, por que cada uma foi escolhida, secao Why NOT para alternativas descartadas.

.claude/settings.json — configurado baseado no tamanho do time. Independente do tamanho, SEMPRE incluir o comentario "// Compactacao manual recomendada — use /compact nos checkpoints" e a chave "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "50".
Solo Dev: MAX_THINKING_TOKENS 10000, CLAUDE_CODE_SUBAGENT_MODEL haiku
Time Grande (15+): habilitar Opus para arquitetura
Outros: modo balanceado

.claude/rules/common/coding-style.md — regras reais de estilo baseadas na stack escolhida
.claude/rules/common/git-workflow.md — fluxo de commits e PRs
.claude/rules/common/testing.md — regras de teste para a stack. Ao gerar este arquivo, lembre-se de incluir tambem no CLAUDE.md (na secao What Claude Should NEVER Do) a regra: "NUNCA use autocompact automatico — use /compact manualmente apenas nos checkpoints: depois de terminar uma feature, depois de resolver um bug, antes de iniciar uma nova tarefa. Autocompact automatico e destrutivo e apaga contexto util sem criterio."
.claude/rules/common/security.md — regras de seguranca incluindo nunca commitar .env

.claude/rules/stack/coding-style.md — regras especificas da stack (TypeScript, Python ou Go)
.claude/rules/stack/testing.md — testes especificos da stack

.claude/commands/tdd.md — comando /tdd calibrado para a stack
.claude/commands/plan.md — comando /plan para o projeto
.claude/commands/code-review.md — comando /code-review

.claude/hooks/hooks.json — SEMPRE incluir: alerta antes de git push, detectar console.log em arquivos editados, BLOQUEAR leitura de .env secrets.json .pem .key. Se time grande: secrets detection obrigatorio em todo commit.

contexts/dev.md — modo desenvolvimento para este projeto especifico
contexts/review.md — modo revisao para este projeto especifico
contexts/research.md — modo pesquisa para este projeto especifico

.tasks/ — IMPORTANTE: nao gerar templates vazios. Baseado no roadmap do usuario, identificar as 2-3 primeiras tarefas reais e gerar os 3 arquivos ja preenchidos para cada uma. Se houver contexto adicional, usar para preencher restricoes e padroes nos arquivos de contexto das tarefas.
Para cada tarefa do roadmap gerar:
[nome-tarefa]-plan.md com objetivo real, requisitos de sucesso reais, arquivos envolvidos reais, restricoes reais baseadas no projeto
[nome-tarefa]-context.md com arquivos relevantes reais, decisoes de design reais, padroes reais da codebase, o que nao fazer baseado nas restricoes do projeto
[nome-tarefa]-tasks.md com subtarefas reais divididas em: Concluido (features ja existentes relacionadas), Em andamento (primeira tarefa do roadmap marcada como proxima), Pendente (demais tarefas)

.ai/handoff.md — template preenchido com contexto real do projeto para continuidade entre sessoes

mcp-configs/mcp-servers.json — gerar APENAS se o usuario selecionou integracoes, com configuracao real para cada servico selecionado (Supabase, Stripe, Pagar.me etc) com placeholders so para as chaves de API

SETUP-GUIDE.md — guia completo com passos reais para este projeto especifico, incluindo instrucao: diga ao Claude 'Leia o CLAUDE.md e os arquivos em .tasks/ para saber onde estamos e o que precisa ser feito'

Responda APENAS com JSON valido. Sem markdown. Sem backticks. Sem texto adicional. Crie chaves literais com os caminhos dos arquivos (ex: '.tasks/login-plan.md').`;

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
          max_tokens: 8000,
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

    setGenerationStep("Processando pacote...");
    const clean = text.replace(/```json|```/g, "").trim();
    let files;
    try {
      files = JSON.parse(clean);
    } catch (e) {
      throw new Error("Erro ao interpretar resposta estruturada da API.");
    }
    return files;
  };

  const handleGenerateManual = async () => {
    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário.");
      return;
    }

    setGenerating(true);
    setGenerationStep("Analisando seu projeto...");
    setGeneratedFiles(null);

    try {
      const files = await callAI(formData);
      setGeneratedFiles(files);
      setGenerationStep("Montando o pacote...");
      await handleDownloadZip(files);
      setShowModal(true);
      toast.success("Pacote Claude Code pronto!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao gerar arquivos.");
    } finally {
      setGenerating(false);
      setGenerationStep("");
    }
  };

  const decodeBase64Utf8 = (base64: string) => {
    try {
      const binString = atob(base64.replace(/\n/g, ''));
      const bytes = new Uint8Array(binString.length);
      for (let i = 0; i < binString.length; i++) bytes[i] = binString.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    } catch(e) {
      return "";
    }
  };

  const handleGitHubAnalyze = async () => {
    if (!githubUrl.includes("github.com/")) {
      toast.error("Por favor, insira uma URL válida do GitHub.");
      return;
    }

    setAnalyzingGithub(true);
    setGenerating(true);
    setGenerationStep("Acessando repositório...");

    try {
      const parts = githubUrl.split("github.com/")[1].split("/");
      const owner = parts[0];
      const repo = parts[1];

      if (!owner || !repo) throw new Error("URL do GitHub inválida.");

      setGenerationStep("Obtendo estrutura...");
      const repoInfoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (!repoInfoRes.ok) throw new Error("Repositório não encontrado ou é privado.");
      const defaultBranch = (await repoInfoRes.json()).default_branch;

      setGenerationStep("Lendo arquivos da nuvem...");
      const [readmeRes, packageRes, treeRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${owner}/${repo}/contents/README.md`),
        fetch(`https://api.github.com/repos/${owner}/${repo}/contents/package.json`),
        fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`)
      ]);

      const readmeData = readmeRes.ok ? await readmeRes.json() : null;
      const packageData = packageRes.ok ? await packageRes.json() : null;
      
      const readmeContent = readmeData?.content ? decodeBase64Utf8(readmeData.content) : "";
      const packageContent = packageData?.content ? decodeBase64Utf8(packageData.content) : "{}";
      
      let parsedName = repo;
      let parsedDesc = "";
      
      const titleMatch = readmeContent.match(/^#\s+(.+)$/m);
      if(titleMatch) parsedName = titleMatch[1];
      
      try {
        const pkg = JSON.parse(packageContent);
        if (pkg.name) parsedName = pkg.name;
        if (pkg.description) parsedDesc = pkg.description;
      } catch (e) {}

      setFormData(prev => ({
        ...prev,
        projectName: parsedName || repo,
        description: parsedDesc || "Projeto importado do GitHub",
        objective: "Configurar ambiente do Claude Code localmente"
      }));
      
      setActiveTab("manual");
      toast.success("Dados preenchidos! Você pode ajustar antes de gerar.");
      
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao analisar o repositório.");
    } finally {
      setAnalyzingGithub(false);
      setGenerating(false);
      setGenerationStep("");
    }
  };

  const handleDownloadZip = async (filesToZip = generatedFiles) => {
    if (!filesToZip) return;
    try {
      const zip = new JSZip();
      
      Object.entries(filesToZip).forEach(([filePath, content]) => {
        zip.file(filePath, content as string);
      });

      const blob = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fileNamePrefix = formData.projectName 
        ? formData.projectName.toLowerCase().replace(/\s+/g, "-") 
        : "github-repo";
      a.download = `${fileNamePrefix}-claude-setup.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar o arquivo ZIP.");
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(id);
    setTimeout(() => setCopiedStep(null), 2000);
    toast.success("Copiado!");
  };

  return (
    <div className="space-y-8 max-w-7xl pb-16 mx-auto relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 glow-primary">
              <Cpu className="h-6 w-6 text-primary" />
            </div>
            Project Setup (Claude Code)
          </h1>
          <p className="text-base text-muted-foreground mt-2">
            Gere a infraestrutura de documentação ideal para o Anthropic Claude.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Form */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/20 p-1 rounded-xl">
              <TabsTrigger value="manual" className="rounded-lg gap-2">
                <FileCode className="h-4 w-4" /> Novo Projeto
              </TabsTrigger>
              <TabsTrigger value="github" className="rounded-lg gap-2">
                <Github className="h-4 w-4" /> Importar GitHub
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="mt-4 animate-in fade-in-50 duration-300">
              <Card className="border-border bg-card/40 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Detalhes do Projeto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome do Projeto *</label>
                      <Input name="projectName" placeholder="Ex: My AI Startup" value={formData.projectName} onChange={handleInputChange} className={`bg-secondary/30 ${formErrors.projectName ? 'border-destructive' : ''}`} />
                      {formErrors.projectName && <p className="text-[10px] text-destructive">{formErrors.projectName}</p>}
                    </div>
                    
                    <div className="space-y-2 col-span-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stack Tecnológica *</label>
                      <Select value={formData.techStack} onValueChange={(val) => handleSelectChange(val, "techStack")}>
                        <SelectTrigger className={`bg-secondary/30 ${formErrors.techStack ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Selecione a stack principal" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {STACK_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {formErrors.techStack && <p className="text-[10px] text-destructive">{formErrors.techStack}</p>}
                    </div>
                  </div>

                  {formData.techStack === "Outra" && (
                     <div className="space-y-2 animate-in fade-in zoom-in duration-200">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Qual Stack? *</label>
                       <Input name="techStackOther" placeholder="Descreva sua stack..." value={formData.techStackOther} onChange={handleInputChange} className={`bg-secondary/30 ${formErrors.techStackOther ? 'border-destructive' : ''}`} />
                       {formErrors.techStackOther && <p className="text-[10px] text-destructive">{formErrors.techStackOther}</p>}
                     </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">O que o projeto faz? *</label>
                    <Textarea name="description" placeholder="Descreva o propósito e regras de negócio essenciais..." value={formData.description} onChange={handleInputChange} className={`bg-secondary/30 min-h-[70px] ${formErrors.description ? 'border-destructive' : ''}`} />
                    {formErrors.description && <p className="text-[10px] text-destructive">{formErrors.description}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Objetivo Principal *</label>
                    <Input name="objective" placeholder="Ex: Criar MVP em 2 semanas mantendo arquitetura limpa" value={formData.objective} onChange={handleInputChange} className={`bg-secondary/30 ${formErrors.objective ? 'border-destructive' : ''}`} />
                    {formErrors.objective && <p className="text-[10px] text-destructive">{formErrors.objective}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tamanho do time</label>
                    <RadioGroup value={formData.teamSize} onValueChange={(v) => handleSelectChange(v, 'teamSize')} className="flex gap-4 flex-wrap">
                      {["Solo Dev", "Time Pequeno (2-5)", "Time Medio (6-15)", "Time Grande (15+)"].map((size) => (
                        <div key={size} className="flex items-center space-x-2 bg-secondary/20 px-3 py-2 rounded-lg border border-border/30">
                          <RadioGroupItem value={size} id={`team-${size}`} />
                          <label htmlFor={`team-${size}`} className="text-xs font-medium cursor-pointer">{size}</label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Features Atuais</label>
                      <Textarea name="features" value={formData.features} onChange={handleInputChange} placeholder="Opcional: O que já funciona?" className="bg-secondary/30 min-h-[60px]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Roadmap</label>
                      <Textarea name="roadmap" value={formData.roadmap} onChange={handleInputChange} placeholder="Opcional: Próximos passos?" className="bg-secondary/30 min-h-[60px]" />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Integrações (Opcional)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-muted-foreground">BR-first</span>
                        <div className="flex flex-col gap-2">
                          {BR_INTEGRATIONS.map(int => (
                            <div key={int} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`int-${int}`} 
                                checked={formData.integrations.includes(int)} 
                                onCheckedChange={(c) => handleIntegrationToggle(int, !!c)} 
                              />
                              <label htmlFor={`int-${int}`} className="text-xs cursor-pointer">{int}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-muted-foreground">Internacional</span>
                        <div className="grid grid-cols-2 gap-2">
                          {INTL_INTEGRATIONS.map(int => (
                            <div key={int} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`int-${int}`} 
                                checked={formData.integrations.includes(int)} 
                                onCheckedChange={(c) => handleIntegrationToggle(int, !!c)} 
                              />
                              <label htmlFor={`int-${int}`} className="text-[11px] cursor-pointer truncate" title={int}>{int}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contexto Adicional</label>
                    <Textarea name="additionalContext" value={formData.additionalContext} onChange={handleInputChange} placeholder="Ha algo especifico que o Claude precisa saber sobre este projeto?" className="bg-secondary/30 min-h-[60px]" />
                  </div>

                  <Button onClick={handleGenerateManual} disabled={generating} className="w-full h-12 gap-2 mt-4 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20">
                    {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> {generationStep || "⏳ Gerando arquivos..."}</> : <><Sparkles className="h-4 w-4" /> Gerar Pacote Claude Code</>}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="github" className="mt-4 animate-in fade-in-50 duration-300">
              <Card className="border-border bg-card/40 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" /> Conectar Repositório
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">URL do Repositório Público</label>
                    <div className="relative">
                      <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input 
                        placeholder="Ex: https://github.com/usuario/projeto" 
                        value={githubUrl} 
                        onChange={(e) => setGithubUrl(e.target.value)}
                        className="pl-10 bg-secondary/30 h-12 border-border/40" 
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                    <h4 className="text-xs font-bold text-primary flex items-center gap-2">
                      <Zap className="h-3 w-3" /> Auto-Preenchimento Via API:
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Lemos o \`README.md\`, extraímos dependências do \`package.json\` e analisamos 
                      a \`tree/\` para pré-preencher seu projeto automaticamente.
                    </p>
                  </div>

                  <Button 
                    onClick={handleGitHubAnalyze} 
                    disabled={generating} 
                    className="w-full h-12 gap-2 bg-foreground text-background hover:bg-foreground/90 font-bold"
                  >
                    {analyzingGithub ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> {generationStep || "⏳ Analisando repositório..."}</>
                    ) : (
                      <><Github className="h-4 w-4" /> Analisar GitHub e Preencher Dados</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: File Cards */}
        <div className="space-y-4">
          <Card className="border-border bg-card/60 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-3 border-b border-border/30">
              <CardTitle className="text-sm font-bold flex flex-col gap-1">
                <span className="flex items-center gap-2 text-foreground">
                  <Terminal className="h-4 w-4" /> Estrutura do Pacote Claude
                </span>
                <span className="text-[10px] text-muted-foreground font-normal normal-case">
                  {generating ? generationStep || "Processando..." : (generatedFiles ? "Pronto para extração" : "Aguardando geração do projeto")}
                </span>
              </CardTitle>
            </CardHeader>
            <ScrollArea className="h-[480px]">
              <CardContent className="pt-4 space-y-2">
                {FILE_CARDS.map((file) => {
                  let isGenerated = false;
                  if (generatedFiles) {
                    if (file.match) {
                       isGenerated = Object.keys(generatedFiles).some(k => k.includes(file.match));
                    } else {
                       isGenerated = !!generatedFiles[file.id];
                    }
                  }

                  return (
                    <TooltipProvider key={file.id}>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isGenerated ? 'bg-primary/5 border-primary/20' : 'bg-secondary/20 border-border/40 grayscale opacity-70'}`}>
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{file.icon}</span>
                              <div className="flex flex-col text-left">
                                <span className={`text-xs font-bold font-mono ${isGenerated ? 'text-primary' : 'text-foreground'}`}>
                                  {file.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {file.path}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 relative">
                              {file.badge && (
                                <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${file.critical ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>
                                  {file.badge}
                                </span>
                              )}
                              {isGenerated && <CheckCircle2 className="h-4 w-4 text-success" />}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="bg-popover border-border max-w-[200px]">
                          <p className="text-xs">{file.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
              </CardContent>
            </ScrollArea>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex gap-4 items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-primary flex items-center gap-1.5"><Zap className="h-3 w-3" /> Estimativa de impacto</h4>
                <p className="text-[10px] text-muted-foreground">Evite reinserir contexto a cada sessão.</p>
              </div>
              <div className="text-right text-[10px] font-mono space-y-0.5">
                <p className="text-muted-foreground line-through decoration-destructive/50">Sem pacote: ~R$ 4,50/dia</p>
                <p className="text-primary font-bold">Com o pacote: ~R$ 1,20/dia</p>
                <p className="text-success font-bold mt-1 inline-block border border-success/30 bg-success/10 px-1 py-0.5 rounded">
                  Economia: ~73%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Custom Post-Generation Modal Overlay */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-card border border-primary/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 pb-2 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-success/10 text-success rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Pacote gerado!</h2>
                    <p className="text-sm text-muted-foreground">4 passos para ativar na sua máquina</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                <div className="flex gap-4 items-start">
                  <div className="bg-primary/20 text-primary font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs">1</div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Extraia o ZIP na raiz do seu repositório</h4>
                    <p className="text-[11px] text-muted-foreground">Substitua arquivos se solicitado.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="bg-primary/20 text-primary font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs">2</div>
                  <div className="w-full">
                    <h4 className="text-sm font-bold text-foreground mb-2">Faça commit de tudo</h4>
                    <div className="relative group">
                      <pre className="text-[11px] p-3 rounded-md bg-black border border-border/30 font-mono text-muted-foreground">
                        git add .{"\n"}
                        git commit -m "chore: add Claude Code config"{"\n"}
                        git push
                      </pre>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary/80 hover:bg-secondary"
                        onClick={() => handleCopy('git add .\ngit commit -m "chore: add Claude Code config"\ngit push', 'step2')}
                      >
                        {copiedStep === 'step2' ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-start border-b border-border/20 pb-4">
                  <div className="bg-primary/20 text-primary font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs">3</div>
                  <div className="w-full">
                    <h4 className="text-sm font-bold text-foreground mb-2">Abra o Claude Code e inicie</h4>
                    <div className="relative group">
                      <pre className="text-[11px] p-3 rounded-md bg-black border border-border/30 font-mono text-primary/80">
                        Leia o CLAUDE.md e os arquivos em .tasks/ para saber quais tarefas ja estao mapeadas e por onde comecar.
                      </pre>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary/80 hover:bg-secondary"
                        onClick={() => handleCopy('Leia o CLAUDE.md e os arquivos em .tasks/ para saber quais tarefas ja estao mapeadas e por onde comecar.', 'step3')}
                      >
                        {copiedStep === 'step3' ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-start pt-2">
                  <div className="bg-primary/20 text-primary font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs">4</div>
                  <div className="w-full space-y-3">
                    <h4 className="text-sm font-bold text-foreground">Envie o Primeiro Comando ao Claude Code</h4>
                    <p className="text-[11px] text-muted-foreground">Copie este comando e cole no Claude Code após subir os arquivos:</p>
                    <div className="relative group">
                      <pre className="text-[10px] p-3 rounded-md bg-black/60 border border-primary/20 font-mono text-primary leading-relaxed">
                        Leia o CLAUDE.md e me confirme que entendeu o projeto respondendo:{"\n"}
                        1. O que este projeto faz em uma frase{"\n"}
                        2. Qual e a stack principal{"\n"}
                        3. Quais sao as 3 regras mais importantes que voce vai seguir{"\n"}
                        {"\n"}
                        Depois leia todos os arquivos na pasta .tasks/ e me diga:{"\n"}
                        1. Quais tarefas estao mapeadas{"\n"}
                        2. Qual e a proxima tarefa prioritaria{"\n"}
                        3. O que voce precisa saber antes de comecar essa tarefa
                      </pre>
                      <Button 
                        className="w-full mt-3 h-8 text-[11px] gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
                        onClick={() => handleCopy(`Leia o CLAUDE.md e me confirme que entendeu o projeto respondendo:
1. O que este projeto faz em uma frase
2. Qual e a stack principal
3. Quais sao as 3 regras mais importantes que voce vai seguir

Depois leia todos os arquivos na pasta .tasks/ e me diga:
1. Quais tarefas estao mapeadas
2. Qual e a proxima tarefa prioritaria
3. O que voce precisa saber antes de comecar essa tarefa`, 'step4')}
                      >
                        {copiedStep === 'step4' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        Copiar Primeiro Comando
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic text-center">
                      "Este comando ativa o Claude Code no modo especialista do seu projeto. Sem ele, o Claude nao confirma que leu e entendeu tudo."
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-secondary/10 border-t border-border/30 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowModal(false)} className="h-9 text-xs">
                  Fechar
                </Button>
                <Button onClick={() => { handleDownloadZip(); setShowModal(false); }} className="h-9 text-xs gap-2 bg-primary hover:bg-primary/90 font-bold">
                  <Download className="h-3.5 w-3.5" /> Baixar ZIP
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
