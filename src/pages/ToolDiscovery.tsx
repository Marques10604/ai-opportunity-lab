import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench, Search, Loader2, Globe, Tag, Zap, ExternalLink, ArrowRight,
  Layers, Lightbulb, Film, ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDetectedProblems } from "@/hooks/useSupabaseData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ToolDiscovery() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: problems = [], isLoading: loadingProblems } = useDetectedProblems();
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<any>(null);
  const [expandedCombo, setExpandedCombo] = useState<number | null>(null);

  const selectedProblemData = problems.find((p) => p.id === selectedProblem);

  const handleDiscover = async () => {
    if (!selectedProblemData || !user) return;
    setDiscovering(true);
    setDiscoveryResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const { data, error } = await supabase.functions.invoke("discover-tools", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          problem_id: selectedProblemData.id,
          problem_title: selectedProblemData.problem_title,
          problem_description: selectedProblemData.problem_description,
          niche_category: selectedProblemData.niche_category,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setDiscoveryResult(data);
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      queryClient.invalidateQueries({ queryKey: ["tool_combinations"] });
      toast.success(`${data.discovered_tools?.length || 0} ferramentas e ${data.combinations?.length || 0} soluções geradas!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao descobrir ferramentas");
    } finally {
      setDiscovering(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" />
          Descoberta de Ferramentas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione um problema detectado para descobrir ferramentas e gerar combinações de soluções.
        </p>
      </div>

      {/* Problem Selector */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Wrench className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Selecionar Problema</span>
        </div>

        {loadingProblems ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando problemas...
          </div>
        ) : problems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum problema detectado. Use o Caçador de Problemas primeiro.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
            {problems.slice(0, 12).map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProblem(p.id)}
                className={`text-left p-3 rounded-lg border text-xs transition-all ${
                  selectedProblem === p.id
                    ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                    : "border-border bg-secondary/30 hover:border-primary/30"
                }`}
              >
                <p className="font-semibold line-clamp-2">{p.problem_title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  {p.niche_category && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                      {p.niche_category}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground font-mono">⚡ {p.viral_score}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <Button onClick={handleDiscover} disabled={!selectedProblem || discovering} className="gap-2 glow-primary" size="lg">
          {discovering ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Descobrindo ferramentas e soluções...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Descobrir Ferramentas e Soluções
            </>
          )}
        </Button>

        {discovering && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Buscando em GitHub, SaaS, APIs públicas, ferramentas open source...
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div className="h-full bg-primary rounded-full" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 15, ease: "linear" }} />
            </div>
          </div>
        )}
      </motion.div>

      {/* Discovery Results */}
      {discoveryResult && (
        <div className="space-y-6">
          {/* Flow visualization */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-center gap-3 flex-wrap text-xs">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
                <Zap className="h-4 w-4 text-destructive" />
                <span className="font-semibold">Problema</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                <Wrench className="h-4 w-4 text-primary" />
                <span className="font-semibold">{discoveryResult.discovered_tools?.length || 0} Ferramentas</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20">
                <Layers className="h-4 w-4 text-accent" />
                <span className="font-semibold">{discoveryResult.combinations?.length || 0} Soluções</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20">
                <Lightbulb className="h-4 w-4 text-success" />
                <span className="font-semibold">Conteúdo</span>
              </div>
            </div>
          </motion.div>

          {/* Discovered Tools */}
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Wrench className="h-5 w-5 text-primary" />
              Ferramentas Descobertas
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {discoveryResult.discovered_tools?.map((tool: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card p-4 space-y-2 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-bold">{tool.tool_name}</h3>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{tool.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{tool.description}</p>
                  <p className="text-xs text-primary/80">
                    <span className="text-muted-foreground">Uso: </span>{tool.use_case}
                  </p>
                  {tool.website && (
                    <a href={tool.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" /> {tool.website}
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Tool Combinations */}
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Layers className="h-5 w-5 text-accent" />
              Combinações de Ferramentas → Soluções
            </h2>
            <div className="space-y-4">
              {discoveryResult.combinations?.map((combo: any, i: number) => {
                const isExpanded = expandedCombo === i;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-xl border border-border bg-card overflow-hidden"
                  >
                    <div
                      className="p-5 cursor-pointer hover:bg-secondary/20 transition-colors"
                      onClick={() => setExpandedCombo(isExpanded ? null : i)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <h3 className="text-sm font-bold">{combo.solution_name}</h3>

                          {/* Tool combination visual */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {combo.tools_used?.map((tool: string, j: number) => (
                              <span key={j} className="inline-flex items-center">
                                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-semibold">
                                  {tool}
                                </span>
                                {j < combo.tools_used.length - 1 && (
                                  <span className="mx-1 text-muted-foreground text-[10px] font-bold">+</span>
                                )}
                              </span>
                            ))}
                            <span className="mx-1 text-muted-foreground">=</span>
                            <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[10px] font-semibold">
                              Solução
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2">{combo.solution_description}</p>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent/10">
                            <Sparkles className="h-3 w-3 text-accent" />
                            <span className="text-xs font-bold font-mono text-accent">{combo.innovation_score}</span>
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
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
                            {/* Expected Result */}
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1">Resultado Esperado</p>
                              <p className="text-xs text-foreground bg-success/5 border border-success/20 rounded-lg px-3 py-2">{combo.expected_result}</p>
                            </div>

                            {/* Content Idea */}
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1 flex items-center gap-1">
                                <Lightbulb className="h-3 w-3" /> Ideia de Conteúdo
                              </p>
                              <p className="text-xs text-foreground bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">{combo.content_idea}</p>
                            </div>

                            {/* Video Script */}
                            {combo.video_script && (
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-2 flex items-center gap-1">
                                  <Film className="h-3 w-3" /> Roteiro de Vídeo
                                </p>
                                <div className="grid gap-2">
                                  {[
                                    { label: "🎣 Hook", value: combo.video_script.hook },
                                    { label: "😤 Problema", value: combo.video_script.problem },
                                    { label: "🔧 Ferramentas", value: combo.video_script.tools_demo },
                                    { label: "💡 Solução", value: combo.video_script.solution },
                                    { label: "🎯 Resultado", value: combo.video_script.result },
                                  ].map((step, k) => (
                                    <div key={k} className="flex gap-2 text-xs">
                                      <span className="shrink-0 font-semibold text-muted-foreground w-28">{step.label}</span>
                                      <span className="text-foreground/80">{step.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
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
      )}

      {/* Empty state */}
      {!discoveryResult && !discovering && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3">
          <Wrench className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">Selecione um problema e clique em "Descobrir Ferramentas" para iniciar</p>
          <p className="text-xs text-muted-foreground/60">O sistema busca ferramentas reais e gera combinações inteligentes de soluções</p>
        </div>
      )}
    </div>
  );
}
