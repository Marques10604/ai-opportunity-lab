import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Loader2, AlertTriangle, Globe, MessageSquare,
  Zap, TrendingUp, Flame, Tag, Wrench, ChevronDown, ChevronUp,
  Filter, Layers, ArrowRight, Lightbulb, Film, Sparkles, ExternalLink, Database, CheckCircle2,
  RefreshCw, Clock, Rocket
} from "lucide-react";
import { COPYWRITER_SYSTEM_PROMPT } from "@/lib/copywriterAgent";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDetectedProblems } from "@/hooks/useSupabaseData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useSelectedProblem } from "@/contexts/SelectedProblemContext";

const NICHES = [
  "Todos", "Saúde", "E-commerce", "Finanças", "Jurídico", "Imobiliário",
  "RH", "Educação", "Logística", "Tecnologia", "Marketing", "Produtividade",
];

const IMPACT_COLORS: Record<string, string> = {
  Crítico: "bg-destructive/20 text-destructive border-destructive/30",
  Alto: "bg-warning/20 text-warning border-warning/30",
  Médio: "bg-info/20 text-info border-info/30",
  Baixo: "bg-secondary text-muted-foreground border-border",
};

const TIMING_COLORS: Record<string, string> = {
  Emergente: "bg-success/20 text-success",
  Crescendo: "bg-warning/20 text-warning",
  Saturado: "bg-destructive/20 text-destructive",
};

const TIMING_ICONS: Record<string, React.ReactNode> = {
  Emergente: <TrendingUp className="h-3 w-3" />,
  Crescendo: <Flame className="h-3 w-3" />,
  Saturado: <AlertTriangle className="h-3 w-3" />,
};

export default function OpportunityRadar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setSelectedProblem: setGlobalProblem, setSelectedPipelineData } = useSelectedProblem();

  // Niche & Hunting State
  const [selectedNiche, setSelectedNiche] = useState("Todos");
  const [hunting, setHunting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const { data: problems = [], isLoading: loadingProblems } = useDetectedProblems();

  // Selected Problem & Discovery Pipeline State
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<any>(null);
  const [expandedCombo, setExpandedCombo] = useState<number | null>(null);

  const filteredProblems = selectedNiche === "Todos" 
    ? problems 
    : problems.filter(p => p.niche_category === selectedNiche);

  const selectedProblemData = problems.find((p) => p.id === selectedProblem);

  const getDaysRemaining = () => {
    if (!problems || problems.length === 0) return null;
    
    const nicheProblems = selectedNiche === "Todos" 
      ? problems 
      : problems.filter(p => p.niche_category === selectedNiche);
      
    if (nicheProblems.length === 0) return null;
    
    const latest = new Date(Math.max(...nicheProblems.map(p => new Date(p.created_at!).getTime())));
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, 15 - diffDays);
  };

  const daysRemaining = getDaysRemaining();

  const handleHunt = async (force = false) => {
    if (!user) return;

    // Part 1: Pre-Batch Strategy check
    if (!force && daysRemaining !== null && daysRemaining > 0) {
      toast.info(`Usando lote atual. Faltam ${daysRemaining} dias para a próxima atualização automática.`);
      setHasSearched(true);
      return;
    }

    setHunting(true);
    setHasSearched(true);
    setScanStep(0);
    setSelectedProblem(null);
    setDiscoveryResult(null);

    const interval = setInterval(() => {
      setScanStep((prev) => (prev < 5 ? prev + 1 : prev));
    }, 1500);

    try {
      const prompt = `Gere 15 problemas reais que pessoas enfrentam no nicho de ${selectedNiche === 'Todos' ? 'Negócios Online' : selectedNiche}. Para cada problema retorne JSON com: title, description, source_platform (Reddit/YouTube/Twitter/LinkedIn/Threads), frequency_score (1-10), urgency_score (1-10). Responda APENAS com array JSON valido.`;
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro na API do Gemini");
      }

      const resData = await response.json();
      const aiText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!aiText) throw new Error("A AI retornou uma resposta vazia");
      
      const jsonMatch = aiText.match(/\[.*\]/s);
      if (!jsonMatch) throw new Error("Resposta da AI em formato JSON inválido");
      
      const parsedProblems = JSON.parse(jsonMatch[0]);

      const problemsToInsert = parsedProblems.map((p: any) => {
        const urgency = parseInt(p.urgency_score) || 5;
        const frequency = parseInt(p.frequency_score) || 5;
        
        return {
          user_id: user.id,
          problem_title: p.title || p.problem_title,
          problem_description: p.description || p.problem_description,
          source_platform: p.source_platform || "Reddit",
          niche_category: selectedNiche === "Todos" ? "Geral" : selectedNiche,
          frequency_score: frequency,
          urgency_score: urgency,
          viral_score: Math.floor((frequency + urgency) / 2) * 10,
          impact_level: urgency > 8 ? "Crítico" : urgency > 6 ? "Alto" : urgency > 4 ? "Médio" : "Baixo",
          timing_status: frequency > 7 ? "Emergente" : "Crescendo"
        };
      });

      const { error: insertError } = await supabase
        .from("detected_problems")
        .insert(problemsToInsert);

      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ["detected_problems"] });
      toast.success(`${problemsToInsert.length} problemas descobertos e salvos no lote de 15 dias!`);
    } catch (err: any) {
      console.error("Erro completo:", err);
      toast.error(err.message || "Erro ao caçar problemas");
    } finally {
      clearInterval(interval);
      setScanStep(5);
      setTimeout(() => {
        setHunting(false);
        setScanStep(0);
      }, 1000);
    }
  };

  const [isGeneratingFull, setIsGeneratingFull] = useState(false);

  const handleSelectProblem = async (problemId: string) => {
    console.log("Iniciando handleSelectProblem para ID:", problemId);
    try {
      // Limpeza de estado assíncrona para evitar conflitos de renderização no React
      await new Promise(resolve => setTimeout(resolve, 10));
      if (typeof setSelectedPipelineData === 'function') {
        setSelectedPipelineData(null);
      }
      setSelectedProblem(problemId);
      setDiscoveryResult(null);

      const problemData = problems.find(p => p.id === problemId);
      if (!problemData) {
        throw new Error("Dados do problema não encontrados na base local.");
      }
      if (!user) {
        throw new Error("Sessão de usuário não encontrada. Faça login novamente.");
      }

      setDiscovering(true);
      setIsGeneratingFull(true);
      
      try {
        const prompt = `Você é um estrategista de conteúdo e negócios AI-First.
Analise o problema: "${problemData.problem_title}" (${problemData.problem_description || "N/A"}) no nicho "${problemData.niche_category || "Geral"}".

Gere um pipeline completo em um único JSON com a seguinte estrutura:

{
  "discovered_tools": [
    {"tool_name": "...", "category": "AI Tools|Automation Frameworks|Developer Tools", "description": "...", "website": "..."}
  ],
  "combinations": [
    {
      "solution_name": "...",
      "tools_used": ["nome_da_ferramenta"],
      "solution_description": "...",
      "expected_result": "...",
      "innovation_score": 9,
      "content_idea": "...",
      "video_script": {"hook": "...", "problem": "...", "tools_demo": "...", "solution": "...", "result": "..."},
      "business_idea": {"nome": "...", "descricao_produto": "...", "infraestrutura": "...", "stack_ferramentas": [], "monetizacao": "...", "diferencial_ai": "...", "potencial_escala": "..."}
    }
  ],
  "content_ideas": [
    {
      "angle": "tutorial|polemica|hack|comparativo|transformacao",
      "title": "...",
      "instagram": "roteiro completo 30s com hook nos primeiros 3s",
      "tiktok": "roteiro completo storytelling",
      "linkedin": "post completo 200-300 palavras",
      "twitter": ["tweet1", "tweet2", "tweet3", "tweet4", "tweet5"],
      "youtube": "roteiro tutorial 60s"
    }
  ],
  "video_script": {
    "hook": "primeiros 3 segundos",
    "problem": "desenvolvimento do problema",
    "solution": "demonstracao da solucao",
    "cta": "call to action final"
  },
  "platform_content": {
    "instagram": {"format": "Reels", "duration": "30s", "style": "Cinematic"},
    "tiktok": {"format": "Trends", "duration": "15s", "style": "Lofi"},
    "linkedin": {"format": "Article", "duration": "3min", "style": "Professional"},
    "twitter": {"format": "Thread", "duration": "1min", "style": "Direct"},
    "youtube": {"format": "Shorts", "duration": "60s", "style": "Educational"}
  }
}

Gere 5 content_ideas (um para cada 'angle').
Gere 2-3 combinations.
Responda APENAS com o JSON válido em Português (Brasil).`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              system_instruction: {
                parts: [{ text: COPYWRITER_SYSTEM_PROMPT }]
              }
            })
          }
        );

        const resData = await response.json();

        if (!response.ok) {
          const errorMsg = resData.error?.message || response.statusText || "Erro desconhecido";
          throw new Error(`Falha na API do Gemini: ${errorMsg}`);
        }

        const aiText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiText) throw new Error("A IA retornou uma resposta vazia");
        
        const cleanedText = aiText.replace(/```json|```/g, "").trim();
        const result = JSON.parse(cleanedText);

        // 1. Save Tools
        if (result.discovered_tools) {
          const { error } = await supabase.from("tools").insert(
            result.discovered_tools.map((t: any) => ({
              user_id: user.id,
              tool_name: t.tool_name,
              category: t.category,
              description: t.description,
              website: t.website || ""
            }))
          );
          if (error) console.error("Erro ao salvar tools:", error);
        }

        // 2. Save Combinations
        if (result.combinations) {
          const { error } = await supabase.from("tool_combinations").insert(
            result.combinations.map((c: any) => ({
              user_id: user.id,
              source_problem_id: problemId,
              solution_name: c.solution_name,
              solution_description: c.solution_description,
              tools_used: c.tools_used,
              expected_result: c.expected_result,
              innovation_score: c.innovation_score,
              content_idea: c.content_idea,
              video_script: c.video_script,
              business_idea: c.business_idea
            }))
          );
          if (error) console.error("Erro ao salvar combinações:", error);
        }

        // 3. Save Content Ideas (to calendario_conteudo for each platform)
        if (result.content_ideas) {
          const calendarRows: any[] = [];
          const platforms = ["instagram", "tiktok", "linkedin", "twitter", "youtube"];
          
          result.content_ideas.forEach((idea: any) => {
            platforms.forEach(platform => {
              const platformKey = platform === 'twitter' ? 'x' : platform;
              const pContent = result.platform_content?.[platform] || {};
              
              calendarRows.push({
                user_id: user.id,
                dor_titulo: idea.title,
                angulo: idea.angle,
                plataforma: platformKey,
                roteiro_narracao: typeof idea[platform] === 'string' ? idea[platform] : JSON.stringify(idea[platform]),
                roteiro_tela: pContent.style || "",
                duracao_estimada: pContent.duration || "",
                hook: platform === 'instagram' && typeof idea.instagram === 'string' ? idea.instagram.substring(0, 100) : idea.title,
                status: 'pendente'
              });
            });
          });
          const { error } = await supabase.from("calendario_conteudo").insert(calendarRows);
          if (error) console.error("Erro ao salvar calendário:", error);
        }
        
        // 4. Save to content_opportunities
        const { error: oppError } = await supabase.from("content_opportunities").insert({
          user_id: user.id,
          titulo_conteudo: problemData.problem_title,
          tipo_conteudo: "Pipeline Completo",
          gancho: result.video_script?.hook,
          roteiro_curto: result.video_script?.solution,
          source_problem_id: problemId
        });
        if (oppError) console.error("Erro ao salvar content opportunities:", oppError);

        // 5. Automatic Save as Opportunity (Sync with Lab)
        if (result.combinations && result.combinations.length > 0) {
          const firstCombo = result.combinations[0];
          const mScore = problemData.viral_score || 50;
          
          let compLevel = 'Média';
          if (mScore > 80) compLevel = 'Baixa';
          else if (mScore < 60) compLevel = 'Alta';

          const { error: oppLabError } = await supabase.from("opportunities").insert({
            user_id: user.id,
            title: firstCombo.solution_name,
            problem: problemData.problem_title,
            solution: firstCombo.solution_description,
            niche: problemData.niche_category || "Geral",
            market_score: mScore,
            competition_level: compLevel,
            difficulty_level: 'Média',
            detected_problem_id: problemId
          });
          if (oppLabError) console.error("Erro ao salvar opportunity (Lab):", oppLabError);
          else toast.success("Oportunidade salva no Laboratório SaaS!");
        }

        setDiscoveryResult(result);
        setGlobalProblem(problemData);
        setSelectedPipelineData(result);

        queryClient.invalidateQueries({ queryKey: ["tools"] });
        queryClient.invalidateQueries({ queryKey: ["tool_combinations"] });
        queryClient.invalidateQueries({ queryKey: ["calendario_conteudo"] });
        queryClient.invalidateQueries({ queryKey: ["content_opportunities"] });
        queryClient.invalidateQueries({ queryKey: ["opportunities"] });
        
        toast.success("Conteúdo gerado! Todas as abas foram preenchidas.");
        
        setTimeout(() => {
          document.getElementById('pipeline-results')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);

      } catch (err: any) {
        console.error("Erro na execução do pipeline:", err);
        toast.error(err.message || "Erro ao gerar pipeline completo");
      } finally {
        // Garantir que as flags de loading são desligadas em qualquer cenário de sucesso ou erro do pipeline
        setDiscovering(false);
        setIsGeneratingFull(false);
      }
    } catch (err: any) {
      console.error("Erro crítico ao inicializar problema:", err);
      toast.error(err.message || "Ocorreu um erro ao processar seu card.");
      // Garantir que não fique preso
      setDiscovering(false);
      setIsGeneratingFull(false);
    }
  };

  const handleSaveAsOpportunity = async (combo: any) => {
    if (!user || !selectedProblemData) return;
    
    try {
      const { data, error } = await supabase.from("opportunities").insert({
        user_id: user.id,
        title: combo.solution_name,
        problem: selectedProblemData.problem_title,
        solution: combo.solution_description,
        niche: selectedNiche === "Todos" ? "Geral" : selectedNiche,
        market_score: Math.min(100, (selectedProblemData.viral_score || 50) + (combo.innovation_score * 5)),
        competition_level: "Medium",
        difficulty_level: "Medium"
      }).select().single();

      if (error) throw error;
      
      toast.success("Oportunidade criada com sucesso!");
      navigate(`/saas/opportunities/${data.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao criar oportunidade");
    }
  };


  return (
    <div className="space-y-8 max-w-7xl pb-16">
      <AnimatePresence>
        {isGeneratingFull && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full p-8 bg-card border border-primary/20 rounded-2xl text-center space-y-6 shadow-2xl"
            >
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center glow-primary relative">
                <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                <Loader2 className="h-20 w-20 text-primary animate-spin absolute inset-0 opacity-20" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Gerando conteúdo completo...</h3>
                <p className="text-sm text-muted-foreground">
                  Criando estratégias, roteiros e variações para todas as abas simultaneamente.
                </p>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-1">
                    <span>Injetando Inteligência</span>
                    <span>100%</span>
                 </div>
                 <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                   <motion.div 
                      className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" 
                      initial={{ width: "0%" }} 
                      animate={{ width: "100%" }} 
                      transition={{ duration: 15, ease: "linear" }} 
                   />
                 </div>
              </div>
              <p className="text-[10px] text-primary/60 font-mono animate-pulse uppercase tracking-tight">
                [SYSTEM: Populando Tabelas de Conteúdo e Canais]
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Search className="h-8 w-8 text-primary" />
          Radar de Oportunidades
        </h1>
        <p className="text-base text-muted-foreground mt-2">
          Selecione um nicho, liste problemas latentes e gere automaticamente o pipeline completo de soluções e conteúdo.
        </p>

        {/* Explanatory Static Flow Header */}
        <div className="mt-6 p-4 rounded-xl border border-dashed border-border/60 bg-secondary/30 flex items-center justify-center sm:justify-start gap-2 sm:gap-4 overflow-x-auto text-[10px] sm:text-xs">
          <span className="text-muted-foreground/70 font-medium whitespace-nowrap">Como funciona:</span>
          
          <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground/80 whitespace-nowrap">
            <span className="font-semibold flex items-center gap-1"><Search className="h-3 w-3" /> Detectar Problema</span>
            <ArrowRight className="h-3 w-3 opacity-50" />
            
            <span className="font-semibold flex items-center gap-1"><Wrench className="h-3 w-3" /> Descobrir Ferramentas</span>
            <ArrowRight className="h-3 w-3 opacity-50" />
            
            <span className="font-semibold flex items-center gap-1"><Layers className="h-3 w-3" /> Combinar Soluções</span>
            <ArrowRight className="h-3 w-3 opacity-50" />
            
            <span className="font-semibold flex items-center gap-1"><Lightbulb className="h-3 w-3" /> Criar Conteúdo</span>
            <ArrowRight className="h-3 w-3 opacity-50" />
            
            <span className="font-semibold flex items-center gap-1"><Film className="h-3 w-3" /> Gerar Roteiro</span>
            <ArrowRight className="h-3 w-3 opacity-50" />
            
            <span className="font-semibold flex items-center gap-1"><Sparkles className="h-3 w-3 text-primary/60" /> Criar Negócio AI</span>
          </div>
        </div>
      </div>

      {/* STEP 1 & 2: Niche Selection and Problem Detection */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-6 space-y-6"
      >
        <div className="space-y-4 border-b border-border pb-6">
           <div className="flex items-center gap-2 mb-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">1. Selecionar Nicho</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {NICHES.map((niche) => (
              <button
                key={niche}
                onClick={() => setSelectedNiche(niche)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedNiche === niche
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {niche}
              </button>
            ))}
          </div>
          <div className="pt-2 flex items-center gap-3">
            <Button
              onClick={() => handleHunt()}
              disabled={hunting}
              className="gap-2"
              variant={hasSearched ? "secondary" : "default"}
              size="sm"
            >
              {hunting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Escaneando internet...</>
              ) : (
                <><Search className="h-4 w-4" /> Buscar Novos Problemas</>
              )}
            </Button>

            {daysRemaining !== null && daysRemaining > 0 && !hunting && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1.5 py-1.5 bg-primary/5 border-primary/20 text-primary animate-in fade-in slide-in-from-left-2 transition-all">
                  <Clock className="h-3 w-3" />
                  Lote atual · {daysRemaining} dias restantes
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  onClick={() => handleHunt(true)}
                  title="Forçar Nova Busca"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* List detected problems for selected niche */}
        {hunting ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pt-4 pb-8">
            <div className="text-center space-y-2 mb-8">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center glow-primary mb-3">
                <Search className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <h3 className="text-lg font-bold">Motor de Descoberta Ativo</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Analisando discussões reais no Reddit, Hacker News, Product Hunt e outras comunidades para encontrar dores latentes.
              </p>
            </div>

            <div className="max-w-3xl mx-auto rounded-xl border border-border bg-card p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-2 relative">
                {/* Visual Pipeline */}
                <div className="hidden sm:block absolute top-[28px] left-[10%] right-[10%] h-0.5 bg-secondary pointer-events-none" />
                
                {[
                  { icon: Globe, label: "Escaneando Internet" },
                  { icon: Database, label: "Coletando Discussões" },
                  { icon: Search, label: "Detectando Problemas" },
                  { icon: Tag, label: "Analisando Padrões" },
                  { icon: Sparkles, label: "Gerando Oportunidades" }
                ].map((step, idx) => {
                  const isActive = scanStep === idx;
                  const isPast = scanStep > idx;
                  const isFuture = scanStep < idx;

                  return (
                    <div key={idx} className="flex flex-col items-center gap-3 relative z-10">
                      <motion.div
                        animate={{ 
                          scale: isActive ? 1.1 : 1,
                        }}
                        className={`h-11 w-11 rounded-full flex items-center justify-center border-2 transition-all duration-500
                          ${isPast ? "bg-primary border-primary text-primary-foreground" : 
                            isActive ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]" : 
                            "bg-card border-border text-muted-foreground"}`}
                      >
                        {isPast ? (
                           <CheckCircle2 className="h-5 w-5" />
                        ) : (
                           <step.icon className={`h-5 w-5 ${isActive ? "animate-pulse" : ""}`} />
                        )}
                      </motion.div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider text-center max-w-[90px] transition-colors duration-500
                        ${isActive ? "text-primary" : isPast ? "text-foreground" : "text-muted-foreground/50"}`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
             <div className="flex items-center gap-2">
               <AlertTriangle className="h-4 w-4 text-warning" />
               <span className="text-sm font-semibold">2. Problemas Detectados</span>
               {filteredProblems.length > 0 && (
                 <Badge variant="secondary" className="ml-2 text-[10px]">{filteredProblems.length}</Badge>
               )}
             </div>

             {loadingProblems ? (
               <div className="flex items-center gap-3 text-sm text-muted-foreground p-8 justify-center border border-dashed rounded-lg">
                 <Loader2 className="h-5 w-5 animate-spin" /> Carregando base de problemas...
               </div>
             ) : filteredProblems.length === 0 ? (
               <div className="text-center p-8 border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">Nenhum problema detectado para "{selectedNiche}".</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Clique em "Buscar Novos Problemas" para iniciar varredura.</p>
               </div>
             ) : (
               <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 pb-2">
                 {filteredProblems.map((p) => {
                   const isSelected = selectedProblem === p.id;
                   return (
                     <button
                       key={p.id}
                       onClick={() => handleSelectProblem(p.id)}
                       className={`text-left flex flex-col p-4 rounded-xl border transition-all ${
                         isSelected
                           ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                           : "border-border bg-card hover:bg-secondary/40 hover:border-primary/40"
                       }`}
                     >
                       <div className="flex justify-between items-start gap-2 mb-2 w-full">
                         <p className="font-semibold text-sm line-clamp-2 leading-tight flex-1">{p.problem_title}</p>
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${IMPACT_COLORS[p.impact_level] || "bg-secondary"}`}>
                           {p.impact_level || "Desconhecido"}
                         </span>
                       </div>
                       <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{p.problem_description}</p>
                       
                       <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border/50 w-full">
                          <Badge variant="outline" className="text-[10px] font-normal gap-1">
                            <Globe className="h-3 w-3" /> {p.source_platform}
                          </Badge>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto bg-secondary px-1.5 py-0.5 rounded">
                            <Flame className="h-3 w-3 text-destructive" /> {p.viral_score}
                          </div>
                       </div>
                     </button>
                   );
                 })}
               </div>
             )}
          </div>
        )}
      </motion.div>

      {/* Loading State for Pipeline */}
      {discovering && (
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 border border-primary/20 bg-primary/5 rounded-xl text-center space-y-4">
             <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center glow-primary mb-2">
                 <Loader2 className="h-6 w-6 text-primary animate-spin" />
             </div>
             <div>
                <h3 className="text-lg font-semibold text-foreground">Construindo Pipeline de Solução</h3>
                <p className="text-sm text-muted-foreground mt-1">Analisando o problema, mapeando ferramentas no mercado e gerando ideias de negócios e conteúdo...</p>
             </div>
             <div className="max-w-md mx-auto h-1.5 rounded-full bg-secondary overflow-hidden mt-4">
               <motion.div className="h-full bg-primary rounded-full" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 15, ease: "linear" }} />
             </div>
         </motion.div>
      )}

      {/* STEP 3: Pipeline Results */}
      {discoveryResult && !discovering && selectedProblemData && (
        <motion.div id="pipeline-results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
               <Layers className="h-5 w-5 text-primary" />
             </div>
             <div>
               <h2 className="text-2xl font-bold">Pipeline de Oportunidade</h2>
               <p className="text-sm text-muted-foreground">Para: <span className="text-foreground font-medium">"{selectedProblemData.problem_title}"</span></p>
             </div>
          </div>

           {/* Flow visualization */}
           <div className="rounded-xl border border-border bg-card p-5 overflow-x-auto">
            <div className="flex items-center gap-3 min-w-max text-xs">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                <Zap className="h-4 w-4" /> <span className="font-semibold">Problema</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <Wrench className="h-4 w-4" /> <span className="font-semibold">{discoveryResult.discovered_tools?.length || 0} Ferramentas</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 text-accent">
                <Layers className="h-4 w-4" /> <span className="font-semibold">{discoveryResult.combinations?.length || 0} Soluções SaaS</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20 text-success">
                <Lightbulb className="h-4 w-4" /> <span className="font-semibold">Conteúdo & Scripts</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left Column: Tools */}
            <div className="lg:col-span-4 space-y-4">
               <h3 className="text-base font-bold flex items-center gap-2">
                 <Wrench className="h-4 w-4 text-primary" />
                 Ferramentas que Resolvem
               </h3>
               {discoveryResult.discovered_tools?.length > 0 ? (
                 <div className="space-y-3">
                   {discoveryResult.discovered_tools.slice(0, 5).map((tool: any, i: number) => (
                     <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
                        <div className="flex items-start justify-between">
                            <h4 className="text-sm font-bold">{tool.tool_name}</h4>
                            <Badge variant="secondary" className="text-[10px]">{tool.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{tool.description}</p>
                        {tool.website && (
                            <a href={tool.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-1">
                            <ExternalLink className="h-3 w-3" /> Website
                            </a>
                        )}
                     </div>
                   ))}
                 </div>
               ) : (
                 <p className="text-sm text-muted-foreground">Nenhuma ferramenta específica encontrada.</p>
               )}
            </div>

            {/* Right Column: Solutions & Content */}
            <div className="lg:col-span-8 space-y-6">
               <h3 className="text-base font-bold flex items-center gap-2">
                 <Sparkles className="h-4 w-4 text-accent" />
                 Soluções, Rotina e Negócios AI-First (Combinações)
               </h3>
               
               <div className="space-y-4">
                 {discoveryResult.combinations?.map((combo: any, i: number) => {
                   const isExpanded = expandedCombo === i;
                   return (
                     <motion.div
                       key={i}
                       className="rounded-xl border border-border bg-card overflow-hidden"
                     >
                       <div
                         className="p-5 cursor-pointer hover:bg-secondary/20 transition-colors"
                         onClick={() => setExpandedCombo(isExpanded ? null : i)}
                       >
                         <div className="flex items-start justify-between gap-4">
                           <div className="flex-1 space-y-3">
                             <h4 className="text-sm font-bold">{combo.solution_name}</h4>
                             
                             <div className="flex items-center gap-1.5 flex-wrap">
                               {combo.tools_used?.map((tool: string, j: number) => (
                                 <span key={j} className="inline-flex items-center">
                                   <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
                                     {tool}
                                   </span>
                                   {j < combo.tools_used.length - 1 && (
                                     <span className="mx-1 text-muted-foreground text-xs">+</span>
                                   )}
                                 </span>
                               ))}
                             </div>
                             
                             <p className="text-sm text-muted-foreground">{combo.solution_description}</p>
                           </div>
                           <div className="flex flex-col items-end gap-2 shrink-0">
                                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
                                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                                    <span className="text-xs font-bold text-accent">Inovação: {combo.innovation_score}/10</span>
                                </div>
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                           </div>
                         </div>
                       </div>

                       <AnimatePresence>
                         {isExpanded && (
                           <motion.div
                             initial={{ height: 0, opacity: 0 }}
                             animate={{ height: "auto", opacity: 1 }}
                             exit={{ height: 0, opacity: 0 }}
                             className="border-t border-border bg-secondary/10"
                           >
                             <div className="p-5 space-y-5">
                                {/* Resultado Esperado */}
                                <div>
                                    <h5 className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-2">Resultado Esperado (Hipótese)</h5>
                                    <p className="text-sm text-foreground bg-success/5 border border-success/20 rounded-lg p-3">{combo.expected_result}</p>
                                </div>

                                {/* Content & Video Script Grid */}
                                <div className="grid md:grid-cols-2 gap-4">
                                     <div className="space-y-3">
                                        <h5 className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-semibold flex items-center gap-1.5">
                                            <Lightbulb className="h-3.5 w-3.5" /> Ideia de Conteúdo
                                        </h5>
                                        <div className="text-sm text-foreground bg-card border border-border rounded-lg p-3 shadow-sm h-full flex items-center">
                                            {combo.content_idea}
                                        </div>
                                     </div>

                                     {combo.video_script && (
                                        <div className="space-y-3">
                                            <h5 className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-semibold flex items-center gap-1.5">
                                                <Film className="h-3.5 w-3.5" /> Roteiro de Vídeo Curto
                                            </h5>
                                            <div className="bg-card border border-border rounded-lg p-3 shadow-sm space-y-2 text-xs">
                                              <div className="flex gap-2"><span className="font-semibold text-muted-foreground w-16">Hook:</span><span className="flex-1">{combo.video_script.hook}</span></div>
                                              <div className="flex gap-2"><span className="font-semibold text-muted-foreground w-16">Problema:</span><span className="flex-1">{combo.video_script.problem}</span></div>
                                              <div className="flex gap-2"><span className="font-semibold text-muted-foreground w-16">Demo:</span><span className="flex-1">{combo.video_script.tools_demo}</span></div>
                                              <div className="flex gap-2"><span className="font-semibold text-muted-foreground w-16">Solução:</span><span className="flex-1">{combo.video_script.solution}</span></div>
                                              <div className="flex gap-2"><span className="font-semibold text-muted-foreground w-16">CTA:</span><span className="flex-1">{combo.video_script.result}</span></div>
                                            </div>
                                        </div>
                                     )}
                                </div>
                             </div>
                           </motion.div>
                         )}
                       </AnimatePresence>
                     </motion.div>
                   );
                 })}
               </div>
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
}
