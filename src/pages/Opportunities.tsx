import { useState } from "react";
import { motion } from "framer-motion";
import { useOpportunities } from "@/hooks/useSupabaseData";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lightbulb, Network, Filter, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const competitionLabel = (level: string | null) => {
  if (level === "Low") return "Baixa";
  if (level === "Medium") return "Média";
  if (level === "High") return "Alta";
  return level ?? "-";
};

type FilterType = "all" | "from_pattern" | "manual";

export default function Opportunities() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: opportunities, isLoading } = useOpportunities();
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: patterns = [] } = useQuery({
    queryKey: ["patterns_map", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("problem_patterns")
        .select("id, pattern_title");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const filtered = opportunities || [];
  const radarCount = (opportunities || []).filter((o: any) => !!o.detected_problem_id).length;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Oportunidades de SaaS</h1>
        <p className="text-sm text-muted-foreground mt-1">Oportunidades SaaS que vieram do Radar de Descoberta</p>
      </div>

      <div className="flex gap-2 items-center">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <Button variant="default" size="sm" className="h-7 text-xs gap-1 cursor-default pointer-events-none">
          Todas ({filtered.length})
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground py-12 text-center">Nenhuma oportunidade encontrada para este filtro.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((opp: any, i: number) => {
            const patternName = opp.source_pattern_id ? patternMap.get(opp.source_pattern_id) : null;
            return (
              <motion.button
                key={opp.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/saas/opportunities/${opp.id}`)}
                className="w-full rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-all flex items-center gap-4 text-left group"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold group-hover:text-primary transition-colors">{opp.title}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-[10px] font-mono text-muted-foreground">{opp.niche}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground">Concorrência: {competitionLabel(opp.competition_level)}</span>
                    {!!opp.detected_problem_id && (
                      <Badge variant="outline" className="text-[9px] h-5 gap-1 ml-1 border-emerald-500/30 text-emerald-500">
                        <Zap className="h-2.5 w-2.5 fill-current" /> Radar
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{opp.market_score}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Pontuação</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
