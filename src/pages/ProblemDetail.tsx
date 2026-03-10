import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, TrendingUp, Zap, Flame, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProblemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: problem, isLoading } = useQuery({
    queryKey: ["problem_detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("detected_problems")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="max-w-4xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => <Button variant="ghost" size="sm" onClick={() => navigate("/discovery/detected")}>}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">Problema não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => <Button variant="ghost" size="sm" onClick={() => navigate("/discovery/detected")} className="gap-2">>
        <ArrowLeft className="h-4 w-4" /> Voltar aos problemas
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-6 space-y-5"
      >
        <div>
          <h1 className="text-xl font-bold tracking-tight">{problem.problem_title}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {problem.source_platform && (
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-secondary font-medium">
                <Globe className="h-3 w-3" /> {problem.source_platform}
              </span>
            )}
            {problem.nichos && (
              <span className="text-xs text-muted-foreground">Indústria: <span className="font-medium text-foreground">{problem.nichos}</span></span>
            )}
            <span className="text-xs text-muted-foreground/60 font-mono ml-auto">
              {format(new Date(problem.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
            </span>
          </div>
        </div>

        {problem.problem_description && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-2">Descrição do Problema</p>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed bg-secondary/50 rounded-lg p-4">
              {problem.problem_description}
            </div>
          </div>
        )}

        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-3">Scores</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border p-4 text-center space-y-1">
              <TrendingUp className="h-5 w-5 text-primary mx-auto" />
              <p className="text-2xl font-bold font-mono">{problem.frequency_score ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Frequência</p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center space-y-1">
              <Zap className="h-5 w-5 text-destructive mx-auto" />
              <p className="text-2xl font-bold font-mono">{problem.urgency_score ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Urgência</p>
            </div>
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center space-y-1">
              <Flame className="h-5 w-5 text-destructive mx-auto" />
              <p className="text-2xl font-bold font-mono text-destructive">{problem.viral_score ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Viral Score</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
