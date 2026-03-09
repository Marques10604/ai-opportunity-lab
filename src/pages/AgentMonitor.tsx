import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgents, useAgentLogs } from "@/hooks/useSupabaseData";
import {
  Search, Sparkles, Activity, TrendingUp, Wrench, Target, Filter,
  BarChart3, Play, Loader2, Zap, Clock, CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const PIPELINE_AGENTS = [
  { name: "Pain Hunter", label: "Caçador de Problemas", icon: Search, color: "text-destructive", bg: "bg-destructive/10" },
  { name: "Trend Detector", label: "Detector de Tendências", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  { name: "Tool Hunter", label: "Caçador de Ferramentas", icon: Wrench, color: "text-warning", bg: "bg-warning/10" },
  { name: "Niche Detector", label: "Detector de Nichos", icon: Target, color: "text-accent", bg: "bg-accent/10" },
  { name: "SaaS Generator", label: "Gerador de SaaS", icon: Sparkles, color: "text-info", bg: "bg-info/10" },
  { name: "Saturation Filter", label: "Filtro de Saturação", icon: Filter, color: "text-warning", bg: "bg-warning/10" },
  { name: "Market Predictor", label: "Preditor de Mercado", icon: BarChart3, color: "text-success", bg: "bg-success/10" },
];

const levelColors: Record<string, string> = {
  info: "text-info",
  warn: "text-warning",
  success: "text-success",
};

const levelDots: Record<string, string> = {
  info: "bg-info",
  warn: "bg-warning",
  success: "bg-success",
};

const statusLabel = (status: string | null) => {
  if (status === "active") return "ativo";
  if (status === "processing") return "processando";
  if (status === "idle") return "inativo";
  return status ?? "-";
};

export default function AgentMonitor() {
  const { data: agents, isLoading: agentsLoading } = useAgents();
  const { data: logs, isLoading: logsLoading } = useAgentLogs();
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);

  const activeAgents = agents?.filter((a) => a.status === "active" || a.status === "processing").length ?? 0;
  const totalAgents = agents?.length ?? 0;
  const totalLogs = logs?.length ?? 0;
  const successLogs = logs?.filter((l) => (l as any).level === "success").length ?? 0;

  const handleRunPipeline = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("run-pipeline");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      queryClient.invalidateQueries({ queryKey: ["agent_logs"] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      toast.success(`Pipeline concluído — ${data.opportunities_generated} oportunidades geradas`);
    } catch (err: any) {
      toast.error(err?.message || "Falha no pipeline");
    }
    setRunning(false);
  };

  useEffect(() => {
    const channel = supabase
      .channel("agent-logs-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "agent_logs" }, () => {
        queryClient.invalidateQueries({ queryKey: ["agent_logs"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitor de Agentes</h1>
          <p className="text-sm text-muted-foreground mt-1">Controle do pipeline de agentes e feed de atividade</p>
        </div>
        <button
          onClick={handleRunPipeline}
          disabled={running}
          className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity glow-primary disabled:opacity-60"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running ? "Executando Pipeline..." : "Executar Pipeline"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Agentes Ativos", value: `${activeAgents}/${totalAgents}`, icon: Activity, color: "text-success", bg: "bg-success/10" },
          { label: "Total de Logs", value: totalLogs, icon: Clock, color: "text-primary", bg: "bg-primary/10" },
          { label: "Descobertas", value: successLogs, icon: CheckCircle2, color: "text-accent", bg: "bg-accent/10" },
          { label: "Agenda", value: "A cada 4h", icon: Zap, color: "text-warning", bg: "bg-warning/10" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${s.bg} flex items-center justify-center`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
            <div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Pipeline de Agentes</h3>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {PIPELINE_AGENTS.map((agent, i) => {
            const dbAgent = agents?.find((a) => a.agent_name === agent.name);
            const status = dbAgent?.status || "idle";
            return (
              <div key={agent.name} className="flex items-center gap-1 shrink-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className={`rounded-lg border p-3 min-w-[120px] transition-all ${
                    status === "processing" ? "border-primary/40 bg-primary/5" : status === "active" ? "border-success/30 bg-success/5" : "border-border bg-secondary/30"
                  }`}
                >
                  <div className={`h-7 w-7 rounded-md ${agent.bg} flex items-center justify-center mb-2`}>
                    <agent.icon className={`h-3.5 w-3.5 ${agent.color}`} />
                  </div>
                  <p className="text-[11px] font-medium truncate">{agent.label}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      status === "processing" ? "bg-warning animate-pulse" : status === "active" ? "bg-success" : "bg-muted-foreground/30"
                    }`} />
                    <span className="text-[9px] font-mono text-muted-foreground">{statusLabel(status)}</span>
                  </div>
                </motion.div>
                {i < PIPELINE_AGENTS.length - 1 && (
                  <div className="text-muted-foreground/30 text-xs px-0.5">→</div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
          <h2 className="text-sm font-semibold">Status dos Agentes</h2>
          {agentsLoading ? (
            <div className="text-sm text-muted-foreground">Carregando agentes...</div>
          ) : (
            agents?.map((agent, i) => {
              const pAgent = PIPELINE_AGENTS.find((p) => p.name === agent.agent_name);
              const Icon = pAgent?.icon || Sparkles;
              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-lg border border-border bg-card p-3 flex items-center gap-3"
                >
                  <div className={`h-8 w-8 rounded-md ${pAgent?.bg || "bg-secondary"} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${pAgent?.color || "text-primary"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium">{pAgent?.label || agent.agent_name}</p>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        agent.status === "active" ? "bg-success" : agent.status === "processing" ? "bg-warning animate-pulse" : "bg-muted-foreground/40"
                      }`} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{agent.role}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-muted-foreground">{statusLabel(agent.status)}</span>
                    {agent.last_run && (
                      <p className="text-[9px] text-muted-foreground/50">{formatDistanceToNow(new Date(agent.last_run), { addSuffix: true, locale: ptBR })}</p>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-sm font-semibold mb-3">Feed de Atividade ao Vivo</h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="bg-secondary/50 px-4 py-2 flex items-center gap-2 border-b border-border">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              <div className="h-2 w-2 rounded-full bg-warning" />
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-[10px] font-mono text-muted-foreground ml-2">agent-pipeline.log</span>
              {running && <span className="text-[9px] text-primary animate-pulse ml-auto">● AO VIVO</span>}
            </div>
            <div className="p-4 font-mono text-[11px] space-y-1.5 max-h-[420px] overflow-y-auto bg-background/50">
              {logsLoading ? (
                <p className="text-muted-foreground">Carregando logs...</p>
              ) : !logs?.length ? (
                <p className="text-muted-foreground/50">Sem atividade de agentes ainda. Clique em "Executar Pipeline" para iniciar.</p>
              ) : (
                <AnimatePresence initial={false}>
                  {logs.map((log: any, i: number) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex gap-2"
                    >
                      <span className="text-muted-foreground/40 shrink-0 w-14">
                        {format(new Date(log.created_at), "HH:mm:ss", { locale: ptBR })}
                      </span>
                      <span className={`shrink-0 w-2 h-2 rounded-full mt-1 ${levelDots[log.level] || "bg-muted-foreground/30"}`} />
                      <span className={`shrink-0 ${levelColors[log.level] || "text-muted-foreground"}`}>
                        [{(log.level || "info").toUpperCase().padEnd(7)}]
                      </span>
                      <span className="text-primary/80 shrink-0">{log.agent_name}:</span>
                      <span className="text-foreground/80">{log.detail || log.action}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
