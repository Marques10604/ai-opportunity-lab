import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Rocket, Loader2, Wrench, Lightbulb, ArrowRight, Sparkles,
  Layers, Film, Zap, ChevronDown, ChevronUp, Brain, Server,
  DollarSign, TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";

export default function GeneratedSolutions() {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: combinations = [], isLoading } = useQuery({
    queryKey: ["tool_combinations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tool_combinations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: problems = [] } = useQuery({
    queryKey: ["detected_problems", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("detected_problems").select("id, problem_title");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const getProblemTitle = (id: string | null) => {
    if (!id) return null;
    return problems.find((p) => p.id === id)?.problem_title || null;
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Rocket className="h-6 w-6 text-success" />
          Soluções Geradas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fluxo completo: Problema → Ferramentas → Solução → Conteúdo
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : combinations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3">
          <Rocket className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">Nenhuma solução gerada ainda.</p>
          <p className="text-xs text-muted-foreground/60">Use a Descoberta de Ferramentas para gerar soluções completas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {combinations.map((combo: any, i: number) => {
            const toolsUsed = Array.isArray(combo.tools_used) ? combo.tools_used : [];
            const videoScript = typeof combo.video_script === 'object' ? combo.video_script : {};
            const isExpanded = expandedId === combo.id;
            const problemTitle = getProblemTitle(combo.source_problem_id);

            return (
              <motion.div
                key={combo.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <div className="p-5 cursor-pointer hover:bg-secondary/20 transition-colors" onClick={() => setExpandedId(isExpanded ? null : combo.id)}>
                  {/* Flow header */}
                  {problemTitle && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
                      <Zap className="h-3 w-3 text-destructive" />
                      <span className="font-medium">Problema:</span>
                      <span className="truncate">{problemTitle}</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold">{combo.solution_name}</h3>
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        {toolsUsed.map((tool: string, j: number) => (
                          <span key={j} className="inline-flex items-center">
                            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-semibold">{tool}</span>
                            {j < toolsUsed.length - 1 && <span className="mx-1 text-muted-foreground text-[10px] font-bold">+</span>}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{combo.solution_description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Sparkles className="h-3 w-3" /> {combo.innovation_score}
                      </Badge>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
                        {/* Full flow */}
                        <div className="flex items-center justify-center gap-2 flex-wrap text-[10px]">
                          <span className="px-2 py-1 rounded bg-destructive/10 text-destructive font-semibold">Dor Detectada</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="px-2 py-1 rounded bg-primary/10 text-primary font-semibold">Ferramentas</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="px-2 py-1 rounded bg-accent/10 text-accent font-semibold">Combinação</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="px-2 py-1 rounded bg-success/10 text-success font-semibold">Solução</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="px-2 py-1 rounded bg-warning/10 text-warning font-semibold">Conteúdo</span>
                        </div>

                        {combo.expected_result && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1">Resultado Esperado</p>
                            <p className="text-xs text-foreground bg-success/5 border border-success/20 rounded-lg px-3 py-2">{combo.expected_result}</p>
                          </div>
                        )}

                        {combo.content_idea && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1 flex items-center gap-1">
                              <Lightbulb className="h-3 w-3" /> Ideia de Conteúdo
                            </p>
                            <p className="text-xs text-foreground bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">{combo.content_idea}</p>
                          </div>
                        )}

                        {videoScript.hook && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-2 flex items-center gap-1">
                              <Film className="h-3 w-3" /> Roteiro de Vídeo
                            </p>
                            <div className="grid gap-2">
                              {[
                                { label: "🎣 Hook", value: videoScript.hook },
                                { label: "😤 Problema", value: videoScript.problem },
                                { label: "🔧 Ferramentas", value: videoScript.tools_demo },
                                { label: "💡 Solução", value: videoScript.solution },
                                { label: "🎯 Resultado", value: videoScript.result },
                              ].map((step, k) => (
                                <div key={k} className="flex gap-2 text-xs">
                                  <span className="shrink-0 font-semibold text-muted-foreground w-28">{step.label}</span>
                                  <span className="text-foreground/80">{step.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-[10px] text-muted-foreground/50">
                          Gerado em {new Date(combo.created_at).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
