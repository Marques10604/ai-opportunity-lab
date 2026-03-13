import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench, Search, Loader2, Globe, Tag, Zap, ExternalLink, ArrowRight, ArrowDown,
  Layers, Lightbulb, Film, ChevronDown, ChevronUp, Sparkles, Rocket, Brain,
  DollarSign, Server, TrendingUp,
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

  const pipelineSteps = [
    { label: "Problema", icon: Zap, color: "destructive" },
    { label: "Ferramentas", icon: Wrench, color: "primary" },
    { label: "Combinações", icon: Layers, color: "accent" },
    { label: "Solução", icon: Sparkles, color: "success" },
    { label: "Conteúdo", icon: Lightbulb, color: "warning" },
    { label: "Roteiro", icon: Film, color: "primary" },
    { label: "Negócio AI", icon: Brain, color: "accent" },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" />
          Descoberta de Ferramentas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione um problema detectado → descubra ferramentas → gere soluções, conteúdo e ideias de negócio AI-First.
        </p>
      </div>

      {/* Pipeline visualization */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {pipelineSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-${step.color}/10 border border-${step.color}/20`}>
                <step.icon className={`h-3.5 w-3.5 text-${step.color}`} />
                <span className="text-[10px] font-semibold">{step.label}</span>
              </div>
              {i < pipelineSteps.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Problem Selector */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-4 w-4 text-destructive" />
          <span className="text-sm font-semibold">Selecionar Problema Detectado</span>
          <Badge variant="secondary" className="text-[10px]">{problems.length} problemas</Badge>
        </div>

        {loadingProblems ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando problemas detectados...
          </div>
        ) : problems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum problema detectado. Use o Caçador de Problemas primeiro.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
            {problems.map((p) => (
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
                  {p.impact_level && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      p.impact_level === "Critical" ? "bg-destructive/10 text-destructive" :
                      p.impact_level === "High" ? "bg-warning/10 text-warning" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                      {p.impact_level}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground font-mono">⚡ {p.viral_score}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <Button onClick={handleDiscover} disabled={!selectedProblem || discovering} className="gap-2" size="lg">
          {discovering ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando pipeline completo...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Descobrir Ferramentas e Gerar Soluções
            </>
          )}
        </Button>

        {discovering && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Analisando problema → Buscando ferramentas AI → Gerando combinações → Criando conteúdo → Ideias de negócio...
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div className="h-full bg-primary rounded-full" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 18, ease: "linear" }} />
            </div>
          </div>
        )}
      </motion.div>

      {/* Discovery Results */}
      {discoveryResult && (
        <div className="space-y-6">
          {/* Selected problem context */}
          {selectedProblemData && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 text-xs text-destructive font-semibold mb-1">
                <Zap className="h-4 w-4" /> Problema Analisado
              </div>
              <p className="text-sm font-bold">{selectedProblemData.problem_title}</p>
              {selectedProblemData.problem_description && (
                <p className="text-xs text-muted-foreground mt-1">{selectedProblemData.problem_description}</p>
              )}
            </motion.div>
          )}

          {/* Connector */}
          <div className="flex justify-center"><ArrowDown className="h-5 w-5 text-muted-foreground" /></div>

          {/* Discovered Tools */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Wrench className="h-5 w-5 text-primary" />
              Ferramentas que Resolvem
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
                      <ExternalLink className="h-3 w-3" /> Acessar
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Connector */}
          <div className="flex justify-center"><ArrowDown className="h-5 w-5 text-muted-foreground" /></div>

          {/* Tool Combinations → Solutions → Content → Video → Business */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Layers className="h-5 w-5 text-accent" />
              Combinações → Soluções → Conteúdo → Negócio
            </h2>
            <div className="space-y-4">
              {discoveryResult.combinations?.map((combo: any, i: number) => {
                const isExpanded = expandedCombo === i;
                const bi = combo.business_idea || {};
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-xl border border-border bg-card overflow-hidden"
                  >
                    <div className="p-5 cursor-pointer hover:bg-secondary/20 transition-colors" onClick={() => setExpandedCombo(isExpanded ? null : i)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <h3 className="text-sm font-bold">{combo.solution_name}</h3>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {combo.tools_used?.map((tool: string, j: number) => (
                              <span key={j} className="inline-flex items-center">
                                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-semibold">{tool}</span>
                                {j < combo.tools_used.length - 1 && <span className="mx-1 text-muted-foreground text-[10px] font-bold">+</span>}
                              </span>
                            ))}
                            <span className="mx-1 text-muted-foreground">=</span>
                            <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[10px] font-semibold">Solução</span>
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
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-5 pb-5 space-y-5 border-t border-border pt-4">

                            {/* Mini pipeline */}
                            <div className="flex items-center justify-center gap-1.5 flex-wrap text-[10px]">
                              {["Problema", "Ferramentas", "Combinação", "Solução", "Conteúdo", "Roteiro", "Negócio AI"].map((s, k) => (
                                <div key={k} className="flex items-center gap-1.5">
                                  <span className="px-2 py-1 rounded bg-secondary text-muted-foreground font-semibold">{s}</span>
                                  {k < 6 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                                </div>
                              ))}
                            </div>

                            {/* Solução Gerada */}
                            <Section icon={<Sparkles className="h-3 w-3" />} label="Solução Gerada">
                              <p className="text-xs text-foreground bg-success/5 border border-success/20 rounded-lg px-3 py-2">{combo.solution_description}</p>
                            </Section>

                            {/* Resultado Esperado */}
                            <Section icon={<TrendingUp className="h-3 w-3" />} label="Resultado Esperado">
                              <p className="text-xs text-foreground bg-success/5 border border-success/20 rounded-lg px-3 py-2">{combo.expected_result}</p>
                            </Section>

                            {/* Ideia de Conteúdo */}
                            <Section icon={<Lightbulb className="h-3 w-3" />} label="Ideia de Conteúdo">
                              <p className="text-xs text-foreground bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">{combo.content_idea}</p>
                            </Section>

                            {/* Roteiro de Vídeo */}
                            {combo.video_script && (
                              <Section icon={<Film className="h-3 w-3" />} label="Roteiro de Vídeo">
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
                              </Section>
                            )}

                            {/* Ideia de Negócio AI-First */}
                            {bi.nome && (
                              <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                  <Brain className="h-4 w-4 text-accent" />
                                  <span className="text-xs font-bold uppercase tracking-wider text-accent">Ideia de Negócio AI-First</span>
                                </div>
                                <h4 className="text-sm font-bold">{bi.nome}</h4>
                                <p className="text-xs text-foreground/80">{bi.descricao_produto}</p>

                                <div className="grid sm:grid-cols-2 gap-3">
                                  <InfoBlock icon={<Server className="h-3 w-3" />} label="Infraestrutura" value={bi.infraestrutura} />
                                  <InfoBlock icon={<DollarSign className="h-3 w-3" />} label="Monetização" value={bi.monetizacao} />
                                  <InfoBlock icon={<Rocket className="h-3 w-3" />} label="Diferencial AI-First" value={bi.diferencial_ai} />
                                  <InfoBlock icon={<TrendingUp className="h-3 w-3" />} label="Potencial de Escala" value={bi.potencial_escala} />
                                </div>

                                {bi.stack_ferramentas?.length > 0 && (
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1.5">Stack de Ferramentas</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {bi.stack_ferramentas.map((t: string, k: number) => (
                                        <span key={k} className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[10px] font-semibold">{t}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
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
          </motion.div>
        </div>
      )}

      {/* Empty state */}
      {!discoveryResult && !discovering && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3">
          <Wrench className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">Selecione um problema e clique em "Descobrir Ferramentas" para iniciar o pipeline completo</p>
          <p className="text-xs text-muted-foreground/60">Problema → Ferramentas → Combinações → Solução → Conteúdo → Roteiro → Ideia de Negócio AI-First</p>
        </div>
      )}
    </div>
  );
}

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1 flex items-center gap-1">
        {icon} {label}
      </p>
      {children}
    </div>
  );
}

function InfoBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium flex items-center gap-1">{icon} {label}</p>
      <p className="text-xs text-foreground/80">{value}</p>
    </div>
  );
}
