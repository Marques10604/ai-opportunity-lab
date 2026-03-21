import { motion } from "framer-motion";
import { useOpportunities } from "@/hooks/useSupabaseData";
import { 
  Rocket, ArrowUpRight, Target, Zap, Network
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ProductIdeas() {
  const { data: opportunities, isLoading } = useOpportunities();
  const navigate = useNavigate();

  if (isLoading) return <div className="p-8 text-muted-foreground">Carregando ideias...</div>;

  const radarOpportunities = (opportunities || []).filter((o: any) => !!o.detected_problem_id);
  const patternOpportunities = (opportunities || []).filter((o: any) => !!o.source_pattern_id);
  
  const filtered = (opportunities || []).filter((opp: any) => {
    if (radarOpportunities.length > 0 || patternOpportunities.length > 0) {
      return !!opp.detected_problem_id || !!opp.source_pattern_id;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ideias de Produto</h1>
          <p className="text-sm text-muted-foreground">Oportunidades de SaaS detectadas e validadas via Radar.</p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Rocket className="h-8 w-8 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Nenhuma oportunidade real gerada via Radar ou Padrões ainda.</p>
          <button 
            onClick={() => navigate("/radar")}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Ir para o Radar de Oportunidades
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((opp, i) => (
            <motion.div
              key={opp.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/saas/opportunities/${opp.id}`)}
              className="group relative rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Rocket className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold gradient-text">{opp.market_score}</span>
                  <p className="text-[10px] text-muted-foreground uppercase">Score</p>
                </div>
              </div>

              <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{opp.title}</h3>
              <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{opp.problem}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Target className="h-3 w-3" />
                  <span>{opp.niche}</span>
                </div>
                {opp.detected_problem_id && (
                  <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded-md">
                    <Zap className="h-3 w-3 fill-current" />
                    <span className="line-clamp-1">Radar: {opp.problem}</span>
                  </div>
                )}
                {opp.source_pattern_id && (
                   <div className="flex items-center gap-2 text-[10px] text-blue-500 font-bold bg-blue-500/10 px-2 py-1 rounded-md">
                     <Network className="h-3 w-3" />
                     <span className="line-clamp-1">De Padrão</span>
                   </div>
                )}
                <div className="flex items-center gap-2 text-[11px] font-medium text-success">
                  <Zap className="h-3 w-3" />
                  <span className="line-clamp-1">{opp.solution}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-[9px] font-medium uppercase">{opp.difficulty_level}</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
