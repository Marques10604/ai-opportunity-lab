import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Network, Trash2, TrendingUp, Hash, Sparkles, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface RelatedProblem {
  id: string;
  title: string;
  viral_score: number;
}

interface Pattern {
  id: string;
  pattern_title: string;
  pattern_description: string | null;
  related_problems: RelatedProblem[];
  total_occurrences: number;
  average_viral_score: number;
  created_at: string;
}

export default function Patterns() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<"occurrences" | "viral">("occurrences");
  const [generatingPatternId, setGeneratingPatternId] = useState<string | null>(null);

  const { data: patterns = [], isLoading } = useQuery({
    queryKey: ["problem_patterns", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("problem_patterns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        related_problems: Array.isArray(p.related_problems) ? p.related_problems : [],
      })) as Pattern[];
    },
    enabled: !!user,
  });

  const detectMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const { data, error } = await supabase.functions.invoke("detect-patterns", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.patterns?.length || 0} padrões detectados!`);
      queryClient.invalidateQueries({ queryKey: ["problem_patterns"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao detectar padrões");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("problem_patterns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Padrão removido");
      queryClient.invalidateQueries({ queryKey: ["problem_patterns"] });
    },
  });

  const sorted = [...patterns].sort((a, b) =>
    sortBy === "occurrences"
      ? b.total_occurrences - a.total_occurrences
      : b.average_viral_score - a.average_viral_score
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Network className="h-6 w-6 text-primary" />
            Padrões de Problemas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Agrupamento inteligente de problemas similares detectados pela IA
          </p>
        </div>
        <Button
          onClick={() => detectMutation.mutate()}
          disabled={detectMutation.isPending}
          className="gap-2"
        >
          {detectMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Detectar Padrões
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={sortBy === "occurrences" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortBy("occurrences")}
          className="gap-1"
        >
          <Hash className="h-3 w-3" /> Ocorrências
        </Button>
        <Button
          variant={sortBy === "viral" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortBy("viral")}
          className="gap-1"
        >
          <TrendingUp className="h-3 w-3" /> Viral Score
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : sorted.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Network className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Nenhum padrão detectado ainda.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Clique em "Detectar Padrões" para agrupar problemas similares.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((pattern) => (
            <Card key={pattern.id} className="group hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base leading-tight">{pattern.pattern_title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => deleteMutation.mutate(pattern.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Hash className="h-3 w-3" /> {pattern.total_occurrences} ocorrências
                  </Badge>
                  <Badge variant="outline" className="text-xs gap-1">
                    <TrendingUp className="h-3 w-3" /> Viral: {pattern.average_viral_score}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {pattern.pattern_description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pattern.pattern_description}
                  </p>
                )}
                {pattern.related_problems.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Problemas relacionados:</p>
                    <div className="space-y-1">
                      {pattern.related_problems.map((rp, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-secondary/50 rounded px-2 py-1">
                          <span className="truncate mr-2">{rp.title}</span>
                          <span className="text-muted-foreground shrink-0">⚡ {rp.viral_score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground/50">
                  {new Date(pattern.created_at).toLocaleDateString("pt-BR")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
