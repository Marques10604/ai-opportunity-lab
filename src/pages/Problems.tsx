import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Calendar, Crown, Globe, TrendingUp, Zap } from "lucide-react";
import { useDetectedProblems } from "@/hooks/useSupabaseData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Problems() {
  const { data: problems, isLoading } = useDetectedProblems();

  const topProblems = useMemo(() => {
    if (!problems?.length) return [];
    return [...problems]
      .sort((a, b) => ((b.frequency_score ?? 0) + (b.urgency_score ?? 0)) - ((a.frequency_score ?? 0) + (a.urgency_score ?? 0)))
      .slice(0, 5);
  }, [problems]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Problemas Detectados</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Problemas identificados pelo Pain Hunter Agent
        </p>
      </div>

      {/* Top Problems */}
      {!isLoading && topProblems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Top Problemas</h2>
            <span className="text-xs text-muted-foreground ml-1">por score combinado (frequência + urgência)</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {topProblems.map((p, i) => {
              const combined = (p.frequency_score ?? 0) + (p.urgency_score ?? 0);
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card p-4 space-y-3 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 px-2 py-1 rounded-bl-lg bg-primary/10 text-primary text-[10px] font-bold font-mono">
                    #{i + 1} · {combined}
                  </div>
                  <h3 className="text-sm font-semibold pr-14 leading-snug">{p.problem_title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-3">{p.problem_description || "-"}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-[10px] font-medium">
                    {p.source_platform || "-"}
                  </span>
                  <div className="flex gap-4 pt-1">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />Freq.</span>
                        <span className="font-mono">{p.frequency_score ?? 0}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${p.frequency_score ?? 0}%` }} />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Zap className="h-3 w-3" />Urg.</span>
                        <span className="font-mono">{p.urgency_score ?? 0}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-destructive rounded-full" style={{ width: `${p.urgency_score ?? 0}%` }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Carregando problemas...
          </div>
        ) : !problems?.length ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum problema detectado ainda.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Execute o Pain Hunter no Painel para detectar problemas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Título
                    </div>
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Descrição</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Plataforma
                    </div>
                  </th>
                  <th className="text-center p-4 font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Frequência
                    </div>
                  </th>
                  <th className="text-center p-4 font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="h-4 w-4" />
                      Urgência
                    </div>
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {problems.map((problem) => (
                  <tr
                    key={problem.id}
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="p-4 font-medium">{problem.problem_title}</td>
                    <td className="p-4 text-muted-foreground max-w-xs">
                      <p className="line-clamp-2">{problem.problem_description || "-"}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-xs font-medium">
                        {problem.source_platform || "-"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${problem.frequency_score ?? 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground w-8">
                          {problem.frequency_score ?? 0}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full bg-destructive rounded-full"
                            style={{ width: `${problem.urgency_score ?? 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground w-8">
                          {problem.urgency_score ?? 0}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground text-xs font-mono">
                      {problem.created_at
                        ? format(new Date(problem.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
