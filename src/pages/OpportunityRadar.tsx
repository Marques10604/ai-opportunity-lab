import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Loader2, AlertTriangle, Globe, MessageSquare,
  Zap, TrendingUp, Flame, Tag, Wrench, ChevronDown, ChevronUp,
  Filter, Layers, ArrowRight, Lightbulb, Film, Sparkles, ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDetectedProblems } from "@/hooks/useSupabaseData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  
  // Niche & Hunting State
  const [selectedNiche, setSelectedNiche] = useState("Todos");
  const [hunting, setHunting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
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

  const handleHunt = async () => {
    if (!user) return;
    setHunting(true);
    setHasSearched(true);
    // Clear previously selected problem when hunting anew
    setSelectedProblem(null);
    setDiscoveryResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const { data, error } = await supabase.functions.invoke("discover-problems", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          niche: selectedNiche === "Todos" ? null : selectedNiche,
          count: 8,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      queryClient.invalidateQueries({ queryKey: ["detected_problems"] });
      toast.success(`${data.problems_discovered || 0} problemas descobertos!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao caçar problemas");
    } finally {
      setHunting(false);
    }
  };

  const handleSelectProblem = async (problemId: string) => {
    setSelectedProblem(problemId);
    setDiscoveryResult(null); // Clear previous pipeline

    const problemData = problems.find(p => p.id === problemId);
    if (!problemData || !user) return;

    setDiscovering(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const { data, error } = await supabase.functions.invoke("discover-tools", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          problem_id: problemData.id,
          problem_title: problemData.problem_title,
          problem_description: problemData.problem_description,
          niche_category: problemData.niche_category,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setDiscoveryResult(data);
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      queryClient.invalidateQueries({ queryKey: ["tool_combinations"] });
      toast.success(`${data.discovered_tools?.length || 0} ferramentas e soluções geradas com sucesso!`);
      
      // Auto-scroll to pipeline (optional visual improvement)
      setTimeout(() => {
        document.getElementById('pipeline-results')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);

    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao descobrir ferramentas e soluções");
    } finally {
      setDiscovering(false);
    }
  };


  return (
    <div className="space-y-8 max-w-7xl pb-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Search className="h-8 w-8 text-primary" />
          Radar de Oportunidades
        </h1>
        <p className="text-base text-muted-foreground mt-2">
          Selecione um nicho, liste problemas latentes e gere automaticamente o pipeline completo de soluções e conteúdo.
        </p>
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
          <div className="pt-2">
           <Button
              onClick={handleHunt}
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
          </div>
        </div>

        {/* List detected problems for selected niche */}
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
                     disabled={discovering && isSelected}
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
