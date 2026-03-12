import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Lightbulb, Loader2, Wrench, Film, ArrowRight, Sparkles, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

export default function ContentIdeas() {
  const { user } = useAuth();

  const { data: combinations = [], isLoading } = useQuery({
    queryKey: ["tool_combinations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tool_combinations")
        .select("*")
        .not("content_idea", "is", null)
        .order("innovation_score", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: contentOps = [] } = useQuery({
    queryKey: ["content_opportunities", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("content_opportunities").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const allIdeas = [
    ...combinations.filter((c: any) => c.content_idea).map((c: any) => ({
      type: "solution" as const,
      id: c.id,
      title: c.solution_name,
      idea: c.content_idea,
      tools: Array.isArray(c.tools_used) ? c.tools_used : [],
      score: c.innovation_score || 0,
      date: c.created_at,
    })),
    ...contentOps.map((c: any) => ({
      type: "content" as const,
      id: c.id,
      title: c.titulo_conteudo,
      idea: c.gancho || c.roteiro_curto || "",
      tools: [],
      score: c.pontuacao_viral || 0,
      date: c.created_at,
    })),
  ].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-warning" />
          Ideias de Conteúdo
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ideias de conteúdo geradas automaticamente a partir de problemas, ferramentas e soluções.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : allIdeas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3">
          <Lightbulb className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">Nenhuma ideia de conteúdo gerada ainda.</p>
          <p className="text-xs text-muted-foreground/60">Use a Descoberta de Ferramentas ou o Caçador de Problemas para gerar ideias automaticamente.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allIdeas.map((idea, i) => (
            <motion.div
              key={idea.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-border bg-card p-5 space-y-3 hover:border-warning/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <Badge variant={idea.type === "solution" ? "secondary" : "outline"} className="text-[10px]">
                  {idea.type === "solution" ? "💡 Solução" : "📱 Conteúdo"}
                </Badge>
                <div className="flex items-center gap-1 text-[10px] font-mono">
                  <Sparkles className="h-3 w-3 text-warning" />
                  <span className="font-bold">{idea.score}</span>
                </div>
              </div>

              <h3 className="text-sm font-bold">{idea.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{idea.idea}</p>

              {idea.tools.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {idea.tools.map((tool: string, j: number) => (
                    <span key={j} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-medium">{tool}</span>
                  ))}
                </div>
              )}

              <div className="text-[10px] text-muted-foreground/50">
                {new Date(idea.date).toLocaleDateString("pt-BR")}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
