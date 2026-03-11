import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, Flame, AlertTriangle, Clock, Eye, Zap,
  ArrowUpDown, Filter, X,
} from "lucide-react";
import { useDetectedProblems } from "@/hooks/useSupabaseData";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const TIMING_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string; description: string }> = {
  Emergente: {
    icon: <TrendingUp className="h-4 w-4" />,
    color: "text-success",
    bgColor: "bg-success/10 border-success/30",
    description: "Problema novo com crescimento rápido. Melhor momento para agir.",
  },
  Crescendo: {
    icon: <Flame className="h-4 w-4" />,
    color: "text-warning",
    bgColor: "bg-warning/10 border-warning/30",
    description: "Problema em crescimento. Ainda há espaço para soluções.",
  },
  Saturado: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-destructive",
    bgColor: "bg-destructive/10 border-destructive/30",
    description: "Mercado saturado. Diferenciação é essencial.",
  },
};

type TimingFilter = "Todos" | "Emergente" | "Crescendo" | "Saturado";

export default function OpportunityWindow() {
  const navigate = useNavigate();
  const { data: problems, isLoading } = useDetectedProblems("viral_score");
  const [timingFilter, setTimingFilter] = useState<TimingFilter>("Todos");

  const grouped = useMemo(() => {
    if (!problems) return { Emergente: [], Crescendo: [], Saturado: [] };
    const groups: Record<string, typeof problems> = { Emergente: [], Crescendo: [], Saturado: [] };
    for (const p of problems) {
      const status = (p as any).timing_status || "Emergente";
      if (groups[status]) {
        groups[status].push(p);
      } else {
        groups["Emergente"].push(p);
      }
    }
    return groups;
  }, [problems]);

  const filteredGroups = useMemo(() => {
    if (timingFilter === "Todos") return grouped;
    return { [timingFilter]: grouped[timingFilter] || [] };
  }, [grouped, timingFilter]);

  const stats = useMemo(() => ({
    emergente: grouped.Emergente.length,
    crescendo: grouped.Crescendo.length,
    saturado: grouped.Saturado.length,
    total: (problems?.length || 0),
  }), [grouped, problems]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          Janela de Oportunidade
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Classifique problemas por timing para identificar as melhores oportunidades de ação.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(TIMING_CONFIG).map(([status, config]) => (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-5 space-y-2 cursor-pointer transition-all hover:scale-[1.02] ${config.bgColor} ${
              timingFilter === status ? "ring-2 ring-offset-2 ring-offset-background ring-current" : ""
            }`}
            onClick={() => setTimingFilter(timingFilter === status ? "Todos" : status as TimingFilter)}
          >
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 ${config.color}`}>
                {config.icon}
                <span className="text-sm font-bold">{status}</span>
              </div>
              <span className={`text-2xl font-bold font-mono ${config.color}`}>
                {stats[status.toLowerCase() as keyof typeof stats] || 0}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">{config.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter indicator */}
      {timingFilter !== "Todos" && (
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Filtrando por:</span>
          <Badge variant="secondary" className="gap-1">
            {timingFilter}
            <button onClick={() => setTimingFilter("Todos")}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      {/* Problem Lists by Timing */}
      {isLoading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : stats.total === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3">
          <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">Nenhum problema classificado ainda.</p>
          <p className="text-xs text-muted-foreground/60">
            Execute o Caçador de Problemas para descobrir e classificar problemas por timing.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(filteredGroups).map(([status, items]) => {
            if (!items || items.length === 0) return null;
            const config = TIMING_CONFIG[status];
            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <span className={config.color}>{config.icon}</span>
                  <h2 className="text-lg font-semibold">{status}</h2>
                  <span className="text-xs text-muted-foreground font-mono">({items.length})</span>
                </div>

                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {items.map((problem, i) => (
                    <motion.div
                      key={problem.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`rounded-xl border bg-card p-4 space-y-3 hover:border-primary/30 transition-colors`}
                    >
                      <div>
                        <h3 className="text-sm font-bold leading-snug">{problem.problem_title}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="secondary" className="text-[10px]">
                            {problem.source_platform || "—"}
                          </Badge>
                          {(problem as any).niche_category && (
                            <Badge variant="outline" className="text-[10px]">
                              {(problem as any).niche_category}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {problem.problem_description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {problem.problem_description}
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-[10px]">
                          <TrendingUp className="h-3 w-3 text-primary" />
                          <span className="font-bold font-mono">{problem.frequency_score ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-[10px]">
                          <Zap className="h-3 w-3 text-destructive" />
                          <span className="font-bold font-mono">{problem.urgency_score ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-destructive/10 text-[10px]">
                          <Flame className="h-3 w-3 text-destructive" />
                          <span className="font-bold font-mono text-destructive">{problem.viral_score ?? 0}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-border">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          config.color
                        } ${config.bgColor}`}>
                          {config.icon}
                          {status}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                          {format(new Date(problem.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        <button
                          onClick={() => navigate(`/discovery/detected/${problem.id}`)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-[10px] font-medium hover:bg-secondary transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          Detalhes
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
