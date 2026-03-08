import { motion } from "framer-motion";
import { useAgents } from "@/hooks/useSupabaseData";
import { agentLogs } from "@/lib/mockData";
import { Search, Sparkles, Activity } from "lucide-react";

const levelColors: Record<string, string> = {
  info: "text-info",
  warn: "text-warning",
  success: "text-success",
};

export default function AgentMonitor() {
  const { data: agents, isLoading } = useAgents();

  const activeAgents = agents?.filter((a) => a.status === "active").length ?? 0;
  const totalAgents = agents?.length ?? 0;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agent Monitor</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time AI agent control panel</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><Activity className="h-5 w-5 text-success" /></div>
          <div>
            <p className="text-2xl font-bold">{activeAgents}/{totalAgents}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Agents Active</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Sparkles className="h-5 w-5 text-primary" /></div>
          <div>
            <p className="text-2xl font-bold">142</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tasks Processing</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center"><Search className="h-5 w-5 text-accent" /></div>
          <div>
            <p className="text-2xl font-bold">24</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Data Sources</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Agent Status</h2>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading agents...</div>
          ) : (
            agents?.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-lg border border-border bg-card p-3 flex items-center gap-3"
              >
                <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium">{agent.agent_name}</p>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      agent.status === "active" ? "bg-success" : agent.status === "processing" ? "bg-warning animate-pulse-glow" : "bg-muted-foreground/40"
                    }`} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{agent.role}</p>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground capitalize">{agent.status}</span>
              </motion.div>
            ))
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-3">Discovery Logs</h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="bg-secondary/50 px-4 py-2 flex items-center gap-2 border-b border-border">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              <div className="h-2 w-2 rounded-full bg-warning" />
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-[10px] font-mono text-muted-foreground ml-2">agent-logs.stream</span>
            </div>
            <div className="p-4 font-mono text-[11px] space-y-1.5 max-h-[420px] overflow-y-auto bg-background/50">
              {agentLogs.map((log, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }} className="flex gap-2">
                  <span className="text-muted-foreground/40 shrink-0">{log.timestamp}</span>
                  <span className={`shrink-0 ${levelColors[log.level] || ""}`}>[{log.level.toUpperCase().padEnd(7)}]</span>
                  <span className="text-primary/80 shrink-0">{log.agent}:</span>
                  <span className="text-foreground/80">{log.message}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
