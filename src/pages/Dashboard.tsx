import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Lightbulb, TrendingUp, Target, LineChart, Zap, Search, Loader2, Network, Play, CheckCircle2, Clock, AlertCircle, Square } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { StatCard } from "@/components/StatCard";
import { chartData } from "@/lib/mockData";
import { useNavigate } from "react-router-dom";
import { useOpportunities, useTrends, useNiches, useAgentLogs } from "@/hooks/useSupabaseData";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { seedUserData } from "@/lib/seedData";
import { DiscoveryEngine } from "@/components/DiscoveryEngine";
import { TrendsList } from "@/components/TrendsList";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function TopPatternsCard({ navigate }: { navigate: (path: string) => void }) {
  const { user } = useAuth();
  const { data: patterns = [], isLoading } = useQuery({
    queryKey: ["top_patterns", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("problem_patterns")
        .select("id, pattern_title, average_viral_score, total_occurrences")
        .order("average_viral_score", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" /> Top Padrões
        </h3>
        <button onClick={() => navigate("/patterns")} className="text-[11px] text-primary hover:underline">Ver todos</button>
      </div>
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : patterns.length === 0 ? (
        <p className="text-xs text-muted-foreground/60">Nenhum padrão detectado ainda.</p>
      ) : (
        <div className="space-y-3">
          {patterns.map((p, i) => (
            <button key={p.id} onClick={() => navigate("/patterns")} className="w-full flex items-center gap-3 rounded-lg p-3 hover:bg-secondary/50 transition-colors text-left">
              <span className="text-lg font-bold text-primary/70 w-6 text-center">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.pattern_title}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] h-5">⚡ Viral: {p.average_viral_score}</Badge>
                  <Badge variant="secondary" className="text-[10px] h-5">{p.total_occurrences} ocorrências</Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

const competitionLabel = (level: string | null) => {
  if (level === "Low") return "Baixa";
  if (level === "Medium") return "Média";
  if (level === "High") return "Alta";
  return level ?? "-";
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const [painHunterLoading, setPainHunterLoading] = useState(false);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [pipelineLogs, setPipelineLogs] = useState<{ time: string; icon: string; text: string; level: "info" | "success" | "warn" }[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [stepStartTime, setStepStartTime] = useState<number>(0);
  const [stepElapsed, setStepElapsed] = useState<number>(0);
  const { data: opportunities, isLoading: oppLoading } = useOpportunities();
  const { data: trends } = useTrends();
  const { data: niches } = useNiches();
  const { data: agentLogs } = useAgentLogs();

  useEffect(() => {
    if (user) seedUserData(user.id);
  }, [user]);

  const runPainHunter = async () => {
    setPainHunterLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("pain-hunter", {
        body: { test_mode: true },
      });
      if (error) throw error;
      toast.success("Caçador de Problemas executado. Problemas armazenados com sucesso.");
    } catch (err: any) {
      console.error("Erro ao executar Caçador de Problemas:", err);
      toast.error(err?.message || "Erro ao executar Caçador de Problemas");
    } finally {
      setPainHunterLoading(false);
    }
  };

  const addLog = (icon: string, text: string, level: "info" | "success" | "warn" = "info") => {
    const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setPipelineLogs((prev) => [...prev, { time, icon, text, level }]);
  };

  const startStep = (step: number) => {
    setPipelineStep(step);
    setStepStartTime(Date.now());
    setStepElapsed(0);
  };

  // Timer for current step elapsed
  useEffect(() => {
    if (!pipelineRunning || pipelineStep === 0 || pipelineStep === 4) return;
    const interval = setInterval(() => {
      setStepElapsed(Math.floor((Date.now() - stepStartTime) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [pipelineRunning, pipelineStep, stepStartTime]);

  const cancelPipeline = () => {
    abortController?.abort();
    setAbortController(null);
  };

  const runFullPipeline = async () => {
    if (!user) return;
    const controller = new AbortController();
    setAbortController(controller);
    setPipelineRunning(true);
    setPipelineLogs([]);
    const totalStart = Date.now();
    const signal = controller.signal;

    try {
      const checkAbort = () => { if (signal.aborted) throw new Error("Pipeline cancelado pelo usuário."); };

      // Step 1: Pain Hunter
      startStep(1);
      addLog("🔍", "Iniciando Caçador de Problemas...");
      addLog("⏱️", "Tempo estimado: ~15-25 segundos");

      const { data: phData, error: phError } = await supabase.functions.invoke("pain-hunter", {
        body: { test_mode: true },
      });
      if (phError) throw new Error(`Caçador de Problemas: ${phError.message}`);
      checkAbort();
      const problemCount = phData?.inserted || phData?.problems?.length || 0;
      addLog("✅", `${problemCount} problemas detectados e armazenados`, "success");
      queryClient.invalidateQueries({ queryKey: ["detected_problems"] });

      // Step 2: Detect Patterns
      checkAbort();
      startStep(2);
      addLog("🔗", "Iniciando Detector de Padrões...");
      addLog("⏱️", "Tempo estimado: ~10-20 segundos");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const { data: patternData, error: ptError } = await supabase.functions.invoke("detect-patterns", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (ptError) throw new Error(`Detector de Padrões: ${ptError.message}`);
      if (patternData?.error) throw new Error(`Detector de Padrões: ${patternData.error}`);
      checkAbort();
      queryClient.invalidateQueries({ queryKey: ["problem_patterns"] });
      queryClient.invalidateQueries({ queryKey: ["top_patterns"] });

      const patterns = patternData?.patterns || [];
      if (patterns.length === 0) throw new Error("Nenhum padrão detectado para gerar oportunidades.");

      addLog("✅", "Detector de Padrões executado. Padrões agrupados com sucesso.", "success");
      patterns.forEach((p: any) => {
        addLog("📊", `Padrão: "${p.pattern_title}" — ${p.total_occurrences || 0} ocorrências`);
      });

      // Step 3: Generate Opportunities from each pattern
      checkAbort();
      startStep(3);
      addLog("💡", "Iniciando Gerador de Oportunidades...");
      addLog("⏱️", `Tempo estimado: ~${patterns.length * 10}-${patterns.length * 20}s (${patterns.length} padrões)`);

      let totalOpps = 0;
      for (let i = 0; i < patterns.length; i++) {
        checkAbort();
        const pattern = patterns[i];
        addLog("🔄", `Gerando oportunidades para "${pattern.pattern_title}" (${i + 1}/${patterns.length})...`);

        const { data: oppData, error: oppError } = await supabase.functions.invoke("generate-opportunities", {
          body: {
            pattern_context: {
              pattern_title: pattern.pattern_title,
              pattern_description: pattern.pattern_description,
              related_problems: pattern.related_problems || [],
            },
          },
        });
        if (oppError) {
          addLog("⚠️", `Erro no padrão "${pattern.pattern_title}": ${oppError.message}`, "warn");
          continue;
        }
        const opps = oppData?.opportunities || [];
        if (opps.length > 0) {
          await supabase.from("opportunities").insert(
            opps.map((o: any) => ({ ...o, user_id: user.id, source_pattern_id: pattern.id }))
          );
          totalOpps += opps.length;
          opps.forEach((o: any) => {
            addLog("🎯", `Nova oportunidade: "${o.title}" (score: ${o.market_score})`, "success");
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["agent_logs"] });

      const totalTime = Math.round((Date.now() - totalStart) / 1000);
      startStep(4);
      addLog("🏁", `Pipeline concluído em ${totalTime}s — ${patterns.length} padrões → ${totalOpps} oportunidades`, "success");
      toast.success(`Pipeline completo em ${totalTime}s! ${totalOpps} oportunidades geradas.`);

      setTimeout(() => { setPipelineStep(0); setPipelineRunning(false); setAbortController(null); }, 5000);
      return;
    } catch (err: any) {
      const cancelled = signal.aborted;
      if (cancelled) {
        addLog("🛑", "Pipeline cancelado pelo usuário.", "warn");
        toast.info("Pipeline cancelado.");
      } else {
        console.error("Erro no pipeline:", err);
        addLog("❌", err?.message || "Erro desconhecido", "warn");
        toast.error(err?.message || "Erro ao executar pipeline completo");
      }
    }
    setPipelineStep(0);
    setPipelineRunning(false);
    setAbortController(null);
  };

  const topScore = opportunities?.length ? Math.max(...opportunities.map(o => o.market_score ?? 0)) : 0;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Painel</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão em tempo real da descoberta de oportunidades com IA</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={runPainHunter}
            disabled={painHunterLoading || pipelineRunning}
            className="h-9 px-4 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium flex items-center gap-2 hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            {painHunterLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Caçador de Problemas
          </button>
          <button
            onClick={runFullPipeline}
            disabled={pipelineRunning || painHunterLoading}
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity glow-primary disabled:opacity-60"
          >
            {pipelineRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Pipeline Completo
          </button>
          {pipelineRunning && (
            <button
              onClick={cancelPipeline}
              className="h-9 px-4 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Square className="h-4 w-4" /> Parar
            </button>
          )}
          <button
            onClick={() => setDiscoveryOpen(true)}
            disabled={pipelineRunning}
            className="h-9 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Zap className="h-4 w-4" /> Descobrir Oportunidades
          </button>
        </div>
      </div>

      {/* Pipeline Progress */}
      <AnimatePresence>
        {pipelineRunning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-primary/30 bg-card overflow-hidden"
          >
            {/* Steps header */}
            <div className="p-4 bg-primary/5 border-b border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-primary">Pipeline em execução...</p>
                {pipelineStep > 0 && pipelineStep < 4 && (
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                    <Clock className="h-3 w-3" /> Etapa atual: {stepElapsed}s
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { step: 1, label: "Caçador de Problemas", est: "~15-25s" },
                  { step: 2, label: "Detector de Padrões", est: "~10-20s" },
                  { step: 3, label: "Gerador de Oportunidades", est: "~20-40s" },
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-2">
                    <div className={`flex flex-col items-start px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      pipelineStep > s.step
                        ? "bg-success/10 text-success"
                        : pipelineStep === s.step
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}>
                      <div className="flex items-center gap-1.5">
                        {pipelineStep > s.step ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : pipelineStep === s.step ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
                        )}
                        {s.label}
                      </div>
                      <span className="text-[9px] font-mono opacity-60 ml-5">{s.est}</span>
                    </div>
                    {s.step < 3 && <span className="text-muted-foreground/30">→</span>}
                  </div>
                ))}
                {pipelineStep === 4 && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium ml-2">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Concluído!
                  </motion.div>
                )}
              </div>
            </div>

            {/* Live log feed */}
            <div className="p-3 max-h-[220px] overflow-y-auto bg-background/50">
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="h-2 w-2 rounded-full bg-destructive" />
                <div className="h-2 w-2 rounded-full bg-warning" />
                <div className="h-2 w-2 rounded-full bg-success" />
                <span className="text-[9px] font-mono text-muted-foreground ml-1">pipeline.log</span>
                {pipelineStep > 0 && pipelineStep < 4 && (
                  <span className="text-[9px] text-primary animate-pulse ml-auto">● AO VIVO</span>
                )}
              </div>
              <div className="space-y-1 font-mono text-[11px]">
                <AnimatePresence initial={false}>
                  {pipelineLogs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 px-1 py-0.5 rounded ${
                        log.level === "success" ? "text-success" : log.level === "warn" ? "text-destructive" : "text-foreground/70"
                      }`}
                    >
                      <span className="text-muted-foreground/40 shrink-0 w-16">{log.time}</span>
                      <span className="shrink-0">{log.icon}</span>
                      <span>{log.text}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {pipelineLogs.length === 0 && (
                  <p className="text-muted-foreground/40 px-1">Aguardando início...</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DiscoveryEngine open={discoveryOpen} onClose={() => { setDiscoveryOpen(false); <DiscoveryEngine open={discoveryOpen} onClose={() => { setDiscoveryOpen(false); navigate("/saas/opportunities"); }} /> />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Maior Pontuação" value={topScore} icon={BarChart3} trend="+12% nesta semana" glowing />
        <StatCard label="Ideias Descobertas" value={opportunities?.length ?? 0} icon={Lightbulb} />
        <StatCard label="Tendências Detectadas" value={trends?.length ?? 0} icon={TrendingUp} />
        <StatCard label="Nichos Analisados" value={niches?.length ?? 0} icon={Target} />
        <StatCard label="Previsões de Mercado" value={89} icon={LineChart} trend="94% de precisão" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Oportunidades ao Longo do Tempo</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorOpp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(190, 90%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(190, 90%, 50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(260, 70%, 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(260, 70%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "hsl(210, 20%, 92%)" }} />
              <Area type="monotone" dataKey="opportunities" stroke="hsl(190, 90%, 50%)" fillOpacity={1} fill="url(#colorOpp)" strokeWidth={2} />
              <Area type="monotone" dataKey="validated" stroke="hsl(260, 70%, 60%)" fillOpacity={1} fill="url(#colorVal)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-primary" />Descobertas</span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-accent" />Validadas</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Feed de Atividade da IA</h3>
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {!agentLogs?.length ? (
              <p className="text-[11px] text-muted-foreground/50">Sem atividade ainda. Execute o pipeline para ver os logs.</p>
            ) : (
              agentLogs.slice(0, 15).map((log: any) => (
                <div key={log.id} className="flex gap-3 text-[11px]">
                  <span className="text-muted-foreground/50 font-mono shrink-0 w-16">
                    {new Date(log.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <div>
                    <span className="text-primary font-medium">{log.agent_name}</span>
                    <span className="text-muted-foreground"> · {log.action}</span>
                    <p className="text-muted-foreground/70 mt-0.5">{log.detail}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      <TopPatternsCard navigate={navigate} />

      <TrendsList />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-xl border border-border bg-card">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-semibold">Oportunidades Recentes</h3>
        </div>
        {oppLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando oportunidades...</div>
        ) : (
          <div className="divide-y divide-border">
            {opportunities?.map((opp) => (
              <button
                key={opp.id}
                onClick={() => navigate(`/saas/opportunities/${opp.id}`)}={() => navigate(`/saas/opportunities/${opp.id}`)}}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{opp.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{opp.niche} · Concorrência: {competitionLabel(opp.competition_level)}</p>
                </div>
                <span className="text-lg font-bold text-primary ml-4">{opp.market_score}</span>
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
