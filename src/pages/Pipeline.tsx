import { motion } from "framer-motion";
import { agents } from "@/lib/mockData";
import { Search, TrendingUp, Wrench, Target, Sparkles, Filter, BarChart3, Database, ArrowRight } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Search, TrendingUp, Wrench, Target, Sparkles, Filter, BarChart3,
};

const pipelineOrder = [
  { id: "sources", name: "Data Sources", icon: Database },
  ...agents.map((a) => ({ id: a.id, name: a.name, icon: iconMap[a.icon] || Sparkles })),
  { id: "results", name: "Opportunity Results", icon: Sparkles },
];

export default function Pipeline() {
  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agent Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-1">Visual overview of the AI agent processing pipeline</p>
      </div>

      {/* Pipeline Flow */}
      <div className="rounded-xl border border-border bg-card p-6 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {pipelineOrder.map((node, i) => {
            const Icon = node.icon;
            const agent = agents.find((a) => a.id === node.id);
            const isSource = node.id === "sources";
            const isResult = node.id === "results";

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-2"
              >
                <div className={`rounded-xl border p-4 w-36 text-center transition-all ${
                  isSource || isResult
                    ? "border-primary/30 bg-primary/5"
                    : agent?.status === "active"
                    ? "border-success/30 bg-success/5"
                    : agent?.status === "processing"
                    ? "border-warning/30 bg-warning/5"
                    : "border-border bg-secondary/50"
                }`}>
                  <div className={`mx-auto h-10 w-10 rounded-lg flex items-center justify-center mb-2 ${
                    isSource || isResult ? "bg-primary/20" : "bg-secondary"
                  }`}>
                    <Icon className={`h-5 w-5 ${isSource || isResult ? "text-primary" : "text-foreground"}`} />
                  </div>
                  <p className="text-[11px] font-medium leading-tight">{node.name}</p>
                  {agent && (
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        agent.status === "active" ? "bg-success" : agent.status === "processing" ? "bg-warning animate-pulse-glow" : "bg-muted-foreground/40"
                      }`} />
                      <span className="text-[9px] text-muted-foreground capitalize">{agent.status}</span>
                    </div>
                  )}
                </div>
                {i < pipelineOrder.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Agent Details */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Agent Network</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent, i) => {
            const Icon = iconMap[agent.icon] || Sparkles;
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{agent.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          agent.status === "active" ? "bg-success" : agent.status === "processing" ? "bg-warning animate-pulse-glow" : "bg-muted-foreground/40"
                        }`} />
                        <span className="text-[10px] text-muted-foreground capitalize font-mono">{agent.status}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">{agent.tasks} tasks</span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">{agent.description}</p>
                <div className="flex flex-wrap gap-1">
                  {agent.sources.map((s) => (
                    <span key={s} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{s}</span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
