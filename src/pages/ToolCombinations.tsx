import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Layers, Sparkles, Loader2, Wrench, Lightbulb, Film, ArrowRight,
  Zap, ExternalLink, Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function ToolCombinations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: combinations = [], isLoading } = useQuery({
    queryKey: ["tool_combinations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tool_combinations")
        .select("*")
        .order("innovation_score", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tool_combinations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Combinação removida");
      queryClient.invalidateQueries({ queryKey: ["tool_combinations"] });
    },
  });

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Layers className="h-6 w-6 text-accent" />
          Combinações de Ferramentas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Soluções geradas pela combinação inteligente de ferramentas e APIs.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : combinations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3">
          <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">Nenhuma combinação gerada ainda.</p>
          <p className="text-xs text-muted-foreground/60">
            Use a Descoberta de Ferramentas para gerar combinações a partir de problemas detectados.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">{combinations.length} soluções geradas</p>

          {combinations.map((combo: any, i: number) => {
            const toolsUsed = Array.isArray(combo.tools_used) ? combo.tools_used : [];
            const videoScript = typeof combo.video_script === 'object' ? combo.video_script : {};

            return (
              <motion.div
                key={combo.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-border bg-card p-5 space-y-4 hover:border-accent/30 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold">{combo.solution_name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{combo.solution_description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary ${scoreColor(combo.innovation_score || 0)}`}>
                      <Sparkles className="h-3 w-3" />
                      <span className="text-xs font-bold font-mono">{combo.innovation_score}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                      onClick={() => deleteMutation.mutate(combo.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Tool combination visual */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {toolsUsed.map((tool: string, j: number) => (
                    <span key={j} className="inline-flex items-center">
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-semibold">{tool}</span>
                      {j < toolsUsed.length - 1 && <span className="mx-1 text-muted-foreground text-[10px] font-bold">+</span>}
                    </span>
                  ))}
                  <ArrowRight className="h-3 w-3 text-muted-foreground mx-1" />
                  <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[10px] font-semibold">Solução</span>
                </div>

                {/* Result */}
                {combo.expected_result && (
                  <div className="text-xs bg-success/5 border border-success/20 rounded-lg px-3 py-2 text-foreground">
                    <span className="text-muted-foreground font-medium">Resultado: </span>{combo.expected_result}
                  </div>
                )}

                {/* Content idea */}
                {combo.content_idea && (
                  <div className="flex items-start gap-2 text-xs">
                    <Lightbulb className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{combo.content_idea}</span>
                  </div>
                )}

                {/* Video script summary */}
                {videoScript.hook && (
                  <div className="flex items-start gap-2 text-xs">
                    <Film className="h-3.5 w-3.5 text-info mt-0.5 shrink-0" />
                    <span className="text-muted-foreground italic">"{videoScript.hook}"</span>
                  </div>
                )}

                <div className="text-[10px] text-muted-foreground/50">
                  {new Date(combo.created_at).toLocaleDateString("pt-BR")}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
