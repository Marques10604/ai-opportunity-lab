import { motion } from "framer-motion";
import { opportunityDetail } from "@/lib/mockData";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Shield, Gauge, DollarSign, Clock, Layers, TrendingUp, Rocket } from "lucide-react";

export default function OpportunityDetail() {
  const navigate = useNavigate();
  const opp = opportunityDetail;

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
            <p className="text-4xl font-bold gradient-text">{opp.marketScore}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Market Score</p>
          </div>
        </div>
      </motion.div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Competition", value: opp.competitionLevel, icon: Shield, color: "text-success" },
          { label: "Difficulty", value: opp.difficultyLevel, icon: Gauge, color: "text-warning" },
          { label: "TAM", value: opp.tam, icon: TrendingUp, color: "text-primary" },
          { label: "Growth", value: opp.growthRate, icon: Zap, color: "text-accent" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <item.icon className={`h-4 w-4 ${item.color} mb-2`} />
            <p className="text-lg font-bold">{item.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Problem & Solution */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Zap className="h-4 w-4 text-destructive" /> Problem</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{opp.problem}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> Solution</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{opp.solution}</p>
        </motion.div>
      </div>

      {/* Monetization */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><DollarSign className="h-4 w-4 text-success" /> Monetization Strategy</h3>
        <div className="space-y-2">
          {opp.monetization.map((m, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
              {m}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tech & MVP */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Clock className="h-4 w-4 text-warning" /> Time to MVP</h3>
          <p className="text-2xl font-bold">{opp.timeToMvp}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">Suggested Tech Stack</h3>
          <div className="flex flex-wrap gap-2">
            {opp.techStack.map((t) => (
              <span key={t} className="text-[11px] font-mono px-2 py-1 rounded-md bg-secondary text-secondary-foreground">{t}</span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full rounded-xl p-4 font-semibold text-sm flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:opacity-90 transition-opacity glow-primary"
      >
        <Rocket className="h-4 w-4" /> Generate MVP Plan
      </motion.button>
    </div>
  );
}
