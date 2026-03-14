import { useState } from "react";
import { 
  Github, 
  Link as LinkIcon, 
  Cpu, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Terminal, 
  Download, 
  FileCode, 
  ChevronUp, 
  ChevronDown, 
  Info 
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

// File descriptions for tooltips
const FILE_DESCRIPTIONS: Record<string, string> = {
  "CLAUDE.md": "Instruções persistentes, regras e convenções do projeto para o Claude Code.",
  "README.md": "Visão geral do projeto para humanos e contexto inicial para o Claude.",
  "features.md": "Lista completa e detalhada de todas as funcionalidades existentes.",
  "roadmap.md": "Plano de desenvolvimento futuro e prioridades estratégicas.",
  "ARCHITECTURE.md": "Estrutura técnica, camadas, decisões de design e padrões do sistema.",
  "TECH_STACK.md": "Tecnologias, versões e fundamentação das escolhas técnicas.",
  ".claude/commands/deploy.md": "Comando customizado (slash command) para automação de deploy no Claude Code.",
  ".gitignore": "Configuração de exclusão de arquivos otimizada para a stack detectada.",
};

export default function ProjectSetup() {
  // Form State for Manual Input
  const [formData, setFormData] = useState({
    projectName: "",
    description: "",
    objective: "",
    techStack: "",
    features: "",
    roadmap: "",
  });

  // State for GitHub Analysis
  const [githubUrl, setGithubUrl] = useState("");
  const [analyzingGithub, setAnalyzingGithub] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<Record<string, string> | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleFile = (fileName: string) => {
    setExpandedFiles((prev) => ({ ...prev, [fileName]: !prev[fileName] }));
  };

  const callAI = async (prompt: string) => {
    const GEMINI_API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY || "";
    
    if (!GEMINI_API_KEY) {
      throw new Error("VITE_GEMINI_API_KEY não configurada no ambiente.");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ 
              text: `SYSTEM INSTRUCTIONS:
You are an expert Claude Code project architect. Your job is to generate 8 precise, production-ready documentation files that help Claude Code understand a project deeply without any additional explanation from the user.

QUALITY RULES — every file must follow these:
- No placeholders. No "add your content here". Real content only.
- No generic descriptions. Every sentence must be specific to this project.
- Minimum 300 characters per file.
- Technical and direct. Claude Code reads these files, not humans.

REFERENCE EXAMPLES of excellent files:

--- CLAUDE.md EXAMPLE ---
# CLAUDE.md — AI Opportunity Lab

## Project Overview
Market intelligence engine that discovers real pain points from Reddit, HN, GitHub and generates Problem→Tool→Solution content for Instagram and TikTok.

## Essential Commands
- npm run dev → start local server at localhost:5173
- npm run build → production build
- npx supabase functions serve → run edge functions locally
- npx supabase functions deploy <name> → deploy single function

## Architecture Rules
- Frontend: React + TypeScript + Tailwind in /src
- Backend: Supabase Edge Functions in /supabase/functions (Deno runtime)
- Database: Supabase PostgreSQL — never modify schema directly, always use migrations
- State: React Query for server state, useState for local UI state

## What Claude Should NEVER Do
- Never modify /supabase/migrations directly
- Never install packages without checking package.json first
- Never use fetch() in components — always use Supabase client or Edge Functions
- Never hardcode API keys — always use environment variables

## Folder Structure
/src/pages → full page components
/src/components → reusable UI components
/src/components/ui → shadcn base components, never modify
/src/lib → utility functions and helpers
/src/hooks → custom React hooks
/src/integrations/supabase → Supabase client and types
/supabase/functions → Edge Functions (Deno)
/supabase/migrations → SQL migrations

--- README.md EXAMPLE ---
# AI Opportunity Lab

Market intelligence engine that discovers real pain points from online communities and generates structured content for social media.

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + Edge Functions + Auth)
- Deno (Edge Functions runtime)

## Prerequisites
- Node.js 18+
- Supabase CLI
- Bun (optional, for faster installs)

## Installation
git clone https://github.com/your/repo
cd ai-opportunity-lab
npm install
cp .env.example .env
# Fill in .env values

## Environment Variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GEMINI_API_KEY=your_gemini_key

## Running Locally
npm run dev

--- features.md EXAMPLE ---
## Core Features

### Discovery Engine
- [x] Niche selector (Health, E-commerce, Finance, Legal, HR, Education)
- [x] Pain point detection from online communities
- [x] Real-time pipeline with 7 sequential agents
- [x] Problem scoring by frequency and urgency

### Content Generation
- [x] Problem → Tool → Solution format
- [x] 5-angle engine per pain point (Tutorial, Controversy, Hack, Comparison, Transformation)
- [x] Platform adaptation (Instagram, TikTok, LinkedIn, X, YouTube Shorts)
- [x] Video script generation

### SaaS Laboratory
- [x] SaaS opportunity detection
- [x] MVP plan generation
- [x] Technical blueprint generation

--- ARCHITECTURE.md EXAMPLE ---
# Architecture — AI Opportunity Lab

## System Overview
Three-layer architecture: React frontend → Supabase Edge Functions → External APIs + PostgreSQL

## Data Flow
User selects niche
→ Frontend calls pain-hunter Edge Function
→ Edge Function fetches from HN + Reddit APIs
→ AI analyzes and classifies pain points
→ Results stored in detected_problems table
→ Frontend displays in real-time via Supabase subscription

## Edge Functions (Agents)
- pain-hunter: fetches real complaints from HN and Reddit
- discover-tools: maps existing tools via GitHub + Product Hunt
- ingest-trends: captures trends via NewsAPI + RSS
- generate-content-idea: creates Problem→Tool→Solution posts
- generate-blueprint: generates technical SaaS blueprints
- generate-mvp-plan: creates actionable MVP roadmaps
- run-pipeline: orchestrates all agents in sequence

## Database Tables
- detected_problems: raw pain points with frequency/urgency scores
- opportunities: validated SaaS opportunities
- agents: agent status and last run timestamps
- agent_logs: execution logs per pipeline run
- trends: market trend data
- tools: discovered tool combinations

Now generate all 8 files for the project described below. Return ONLY a valid JSON object with this exact structure, no markdown, no explanation:
{
  "CLAUDE.md": "...",
  "README.md": "...",
  "features.md": "...",
  "roadmap.md": "...",
  "ARCHITECTURE.md": "...",
  "TECH_STACK.md": "...",
  ".claude/commands/deploy.md": "...",
  ".gitignore": "..."
}

USER PROMPT / CONTEXT:
${prompt}`
            }] 
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Erro HTTP: ${response.status}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean JSON from markdown if needed
    const clean = text.replace(/```json|```/g, "").trim();
    const files = JSON.parse(clean);

    // Validation
    const invalidFiles = Object.entries(files).filter(([_, content]) => {
      const c = (content as string).toLowerCase();
      return (content as string).length < 200 || c.includes("placeholder") || c.includes("add here");
    });

    if (invalidFiles.length > 0) {
      throw new Error("Qualidade insuficiente — tente novamente");
    }

    return files;
  };

  const handleGenerateManual = async () => {
    if (!formData.projectName || !formData.description) {
      toast.error("Por favor, preencha ao menos o nome e a descrição do projeto.");
      return;
    }

    setGenerating(true);
    setGeneratedFiles(null);

    try {
      const files = await callAI(
        `PROJECT DATA:
Nome: ${formData.projectName}
Descrição: ${formData.description}
Objetivo Principal: ${formData.objective}
Stack Tecnológica: ${formData.techStack}
Funcionalidades Atuais: ${formData.features}
Roadmap/Próximos Passos: ${formData.roadmap}`
      );
      setGeneratedFiles(files);
      toast.success("Pacote Claude Code gerado com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao gerar arquivos.");
    } finally {
      setGenerating(false);
    }
  };

  const handleGitHubAnalyze = async () => {
    if (!githubUrl.includes("github.com/")) {
      toast.error("Por favor, insira uma URL válida do GitHub.");
      return;
    }

    setAnalyzingGithub(true);
    setGenerating(true);
    setGeneratedFiles(null);

    try {
      // Parse owner and repo from URL
      const parts = githubUrl.split("github.com/")[1].split("/");
      const owner = parts[0];
      const repo = parts[1];

      if (!owner || !repo) throw new Error("URL do GitHub inválida.");

      // Fetch basic repo info to get default branch
      const repoInfoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (!repoInfoRes.ok) throw new Error("Repositório não encontrado ou é privado.");
      const repoInfo = await repoInfoRes.json();
      const defaultBranch = repoInfo.default_branch;

      // Parallel fetches for context
      const [readmeRes, packageRes, treeRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${owner}/${repo}/readme`),
        fetch(`https://api.github.com/repos/${owner}/${repo}/contents/package.json`),
        fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`)
      ]);

      const readmeData = readmeRes.ok ? await readmeRes.json() : null;
      const packageData = packageRes.ok ? await packageRes.json() : null;
      const treeData = treeRes.ok ? await treeRes.json() : null;

      const readmeContent = readmeData ? atob(readmeData.content) : "Nenhum README encontrado.";
      const packageContent = packageData ? atob(packageData.content) : "Nenhum package.json encontrado.";
      const fileTree = treeData ? treeData.tree.map((item: any) => item.path).join("\n").slice(0, 3000) : "Estrutura de pastas não disponível.";

      const files = await callAI(
        `GITHUB REPOSITORY CONTEXT (${owner}/${repo}):
CONTEÚDO DO README.md:
${readmeContent.slice(0, 4000)}

CONTEÚDO DO package.json:
${packageContent}

ESTRUTURA DE PASTAS (RESUMO):
${fileTree}`
      );

      setGeneratedFiles(files);
      toast.success("Análise completa e pacote gerado!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao analisar o repositório.");
    } finally {
      setAnalyzingGithub(false);
      setGenerating(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!generatedFiles) return;

    try {
      const zip = new JSZip();
      Object.entries(generatedFiles).forEach(([fileName, content]) => {
        zip.file(fileName, content as string);
      });

      const blob = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fileNamePrefix = formData.projectName ? formData.projectName.toLowerCase().replace(/\s+/g, "-") : "github-repo";
      a.download = `${fileNamePrefix}-claude-config.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download iniciado!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar o arquivo ZIP.");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl pb-16 mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 glow-primary">
              <Cpu className="h-6 w-6 text-primary" />
            </div>
            Project Setup (Claude Code)
          </h1>
          <p className="text-base text-muted-foreground mt-2">
            Gere a infraestrutura de documentação ideal para o Claude Code trabalhar no seu projeto.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Tabs with Forms */}
        <div className="space-y-6">
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/20 p-1 rounded-xl">
              <TabsTrigger value="manual" className="rounded-lg gap-2">
                <FileText className="h-4 w-4" /> Novo Projeto
              </TabsTrigger>
              <TabsTrigger value="github" className="rounded-lg gap-2">
                <Github className="h-4 w-4" /> Projeto no GitHub
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="mt-4 animate-in fade-in-50 duration-300">
              <Card className="border-border bg-card/40 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Entrada Manual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome do Projeto</label>
                      <Input name="projectName" placeholder="Ex: My AI Startup" value={formData.projectName} onChange={handleInputChange} className="bg-secondary/30" />
                    </div>
                    <div className="space-y-2 col-span-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stack</label>
                      <Input name="techStack" placeholder="Ex: React, TS, Supabase" value={formData.techStack} onChange={handleInputChange} className="bg-secondary/30" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">O que o projeto faz?</label>
                    <Textarea name="description" placeholder="Descreva o propósito..." value={formData.description} onChange={handleInputChange} className="bg-secondary/30 min-h-[70px]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Objetivo Principal</label>
                    <Input name="objective" placeholder="Ex: Criar MVP em 2 semanas" value={formData.objective} onChange={handleInputChange} className="bg-secondary/30" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Features Atuais</label>
                      <Textarea name="features" value={formData.features} onChange={handleInputChange} placeholder="O que já existe?" className="bg-secondary/30 min-h-[90px]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Roadmap</label>
                      <Textarea name="roadmap" value={formData.roadmap} onChange={handleInputChange} placeholder="O que vem agora?" className="bg-secondary/30 min-h-[90px]" />
                    </div>
                  </div>
                  <Button onClick={handleGenerateManual} disabled={generating} className="w-full h-12 gap-2 mt-4 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20">
                    {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</> : <><Sparkles className="h-4 w-4" /> Gerar Pacote Claude Code</>}
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
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">URL do Repositório GitHub</label>
                    <div className="relative">
                      <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input 
                        placeholder="https://github.com/usuario/projeto" 
                        value={githubUrl} 
                        onChange={(e) => setGithubUrl(e.target.value)}
                        className="pl-10 bg-secondary/30 h-12 border-border/40" 
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 ml-1 italic opacity-70">
                      <Info className="h-3 w-3" /> Funciona apenas com repositórios públicos
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                    <h4 className="text-xs font-bold text-primary flex items-center gap-2">
                      <Sparkles className="h-3 w-3" /> O que será analisado:
                    </h4>
                    <ul className="grid grid-cols-2 gap-2">
                      {["README.md", "package.json", "Estrutura de Pastas", "Tech Stack"].map(item => (
                        <li key={item} className="flex items-center gap-2 text-[10px] text-muted-foreground bg-secondary/40 p-2 rounded-lg border border-border/30">
                          <CheckCircle2 className="h-3 w-3 text-success/60" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button 
                    onClick={handleGitHubAnalyze} 
                    disabled={generating} 
                    className="w-full h-12 gap-2 bg-foreground text-background hover:bg-foreground/90 font-bold transition-all hover:scale-[1.01]"
                  >
                    {analyzingGithub ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Analisando Código...</>
                    ) : (
                      <><Github className="h-4 w-4" /> Analisar Repositório e Gerar</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Results Column */}
        <div className="space-y-4 min-h-[600px]">
          {!generatedFiles && !generating && (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 border border-dashed border-border/60 rounded-xl bg-secondary/5 text-center space-y-6">
              <div className="h-20 w-20 rounded-2xl bg-secondary/10 flex items-center justify-center border border-border/30">
                <Terminal className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-muted-foreground/80">Pacote de Contexto Claude</h3>
                <p className="text-sm text-muted-foreground/60 max-w-[300px] mx-auto leading-relaxed">
                  Os arquivos gerados criarão uma camada de persistência para que o Claude Code entenda sua arquitetura e decisões de design.
                </p>
              </div>
            </div>
          )}

          {generating && (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 border border-primary/20 bg-primary/5 rounded-xl text-center space-y-8 animate-in fade-in zoom-in duration-500">
               <div className="relative">
                <div className="h-24 w-24 rounded-full border-2 border-primary/20 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full border-2 border-primary/10 border-t-primary animate-spin" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  {analyzingGithub ? <Github className="h-8 w-8 text-primary animate-pulse" /> : <Cpu className="h-8 w-8 text-primary animate-pulse" />}
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-foreground tracking-tight uppercase">
                  {analyzingGithub ? "Analisando GitHub" : "Arquitetando Projeto"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-[300px] mx-auto leading-relaxed">
                  Otimizando convenções e regras persistentes para o motor Anthropic...
                </p>
              </div>
            </div>
          )}

          {generatedFiles && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div className="flex items-center justify-between bg-primary/10 border border-primary/20 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Pacote Gerado</h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">8 arquivos otimizados</p>
                  </div>
                </div>
                <Button onClick={handleDownloadZip} className="gap-2 bg-primary hover:bg-primary/90 h-10 px-6 font-bold text-xs uppercase tracking-wider">
                  <Download className="h-4 w-4" /> Baixar ZIP
                </Button>
              </div>

              <ScrollArea className="h-[730px] pr-4">
                <div className="space-y-3 pb-8">
                  {Object.entries(generatedFiles).map(([fileName, content]) => {
                    const isExpanded = expandedFiles[fileName];
                    return (
                      <Card key={fileName} className="overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm transition-all hover:border-primary/30">
                        <div className="p-4 flex items-center justify-between cursor-pointer group" onClick={() => toggleFile(fileName)}>
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                              <FileCode className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold font-mono ${isExpanded ? "text-primary" : "text-foreground"}`}>{fileName}</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild><Info className="h-3 w-3.5 text-muted-foreground/40 hover:text-primary cursor-help" /></TooltipTrigger>
                                    <TooltipContent className="max-w-[250px] bg-card border-primary/20">
                                      <p className="text-[11px] leading-relaxed">{FILE_DESCRIPTIONS[fileName]}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="h-5 w-5 text-primary" /> : <ChevronDown className="h-5 w-5 text-muted-foreground/30" />}
                        </div>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border/20 bg-black/40 p-4">
                              <pre className="text-[10px] font-mono p-4 rounded-lg bg-black/40 overflow-x-auto text-primary/70 whitespace-pre-wrap leading-tight border border-primary/5">
                                {content as string}
                              </pre>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
