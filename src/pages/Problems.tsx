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
