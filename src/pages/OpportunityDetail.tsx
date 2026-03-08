import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Shield, Gauge, DollarSign, Layers, Rocket } from "lucide-react";
import { useOpportunities } from "@/hooks/useSupabaseData";

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: opportunities, isLoading } = useOpportunities();

  const opp = opportunities?.find((o) => o.id === id);

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading...</div>;
  if (!opp) return <div className="p-8 text-sm text-muted-foreground">Opportunity not found.</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => navigate("/opportunities")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Opportunities
      </button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{opp.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{opp.niche}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-4xl font-bold gradient-text">{opp.market_score}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Market Score</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Competition", value: opp.competition_level, icon: Shield, color: "text-success" },
          { label: "Difficulty", value: opp.difficulty_level, icon: Gauge, color: "text-warning" },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-border bg-card p-4">
            <item.icon className={`h-4 w-4 ${item.color} mb-2`} />
            <p className="text-lg font-bold">{item.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Zap className="h-4 w-4 text-destructive" /> Problem</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{opp.problem || "No problem description yet."}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> Solution</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{opp.solution || "No solution description yet."}</p>
        </motion.div>
      </div>

      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full rounded-xl p-4 font-semibold text-sm flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:opacity-90 transition-opacity glow-primary"
      >
        <Rocket className="h-4 w-4" /> Generate MVP Plan
      </motion.button>
    </div>
  );
}
