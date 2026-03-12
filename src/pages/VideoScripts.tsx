import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Film, Loader2, Wrench, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const STEP_CONFIG = [
  { key: "hook", label: "Hook", emoji: "🎣", color: "bg-destructive/10 border-destructive/20 text-destructive" },
  { key: "problem", label: "Problema", emoji: "😤", color: "bg-warning/10 border-warning/20 text-warning" },
  { key: "tools_demo", label: "Ferramentas", emoji: "🔧", color: "bg-primary/10 border-primary/20 text-primary" },
  { key: "solution", label: "Solução", emoji: "💡", color: "bg-accent/10 border-accent/20 text-accent" },
  { key: "result", label: "Resultado", emoji: "🎯", color: "bg-success/10 border-success/20 text-success" },
];

export default function VideoScripts() {
  const { user } = useAuth();

  const { data: combinations = [], isLoading } = useQuery({
    queryKey: ["tool_combinations_scripts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tool_combinations")
        .select("*")
        .not("video_script", "is", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).filter((c: any) => {
        const vs = c.video_script;
        return vs && typeof vs === 'object' && vs.hook;
      });
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Film className="h-6 w-6 text-info" />
          Roteiros de Vídeo
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Roteiros estruturados para vídeos curtos gerados automaticamente: Hook → Problema → Ferramentas → Solução → Resultado.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : combinations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3">
          <Film className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">Nenhum roteiro de vídeo gerado ainda.</p>
          <p className="text-xs text-muted-foreground/60">Use a Descoberta de Ferramentas para gerar roteiros automaticamente.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {combinations.map((combo: any, i: number) => {
            const vs = combo.video_script;
            const toolsUsed = Array.isArray(combo.tools_used) ? combo.tools_used : [];

            return (
              <motion.div
                key={combo.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card p-5 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-bold flex-1">{combo.solution_name}</h3>
                  <Badge variant="secondary" className="text-[10px] shrink-0 gap-1">
                    <Film className="h-3 w-3" /> Roteiro
                  </Badge>
                </div>

                {toolsUsed.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {toolsUsed.map((tool: string, j: number) => (
                      <span key={j} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-medium">{tool}</span>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  {STEP_CONFIG.map((step, k) => {
                    const value = vs[step.key];
                    if (!value) return null;
                    return (
                      <div key={k}>
                        {k > 0 && <div className="flex justify-center py-0.5"><ArrowDown className="h-3 w-3 text-muted-foreground/30" /></div>}
                        <div className={`rounded-lg border px-3 py-2.5 ${step.color}`}>
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5">
                            {step.emoji} {step.label}
                          </p>
                          <p className="text-xs leading-relaxed">{value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

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
