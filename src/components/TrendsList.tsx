import { motion } from "framer-motion";
import { TrendingUp, Zap, Loader2, RefreshCw } from "lucide-react";
import { useTrends } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

const SOURCE_ICONS: Record<string, string> = {
  "Google Trends": "🔍",
  "Product Hunt": "🚀",
  "Crunchbase": "💰",
  "TechCrunch": "📰",
  "Hacker News": "🔶",
  "Reddit r/SaaS": "💬",
};

function scoreColor(score: number) {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-muted-foreground";
}

function scoreBg(score: number) {
  if (score >= 75) return "bg-success/10";
  if (score >= 50) return "bg-warning/10";
  return "bg-secondary";
}

export function TrendsList() {
  const { data: trends, isLoading } = useTrends();
  const queryClient = useQueryClient();
  const [ingesting, setIngesting] = useState(false);

  const handleIngest = async () => {
    setIngesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("ingest-trends");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      queryClient.invalidateQueries({ queryKey: ["trends"] });
      toast.success(data?.message || "Trends ingested successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to ingest trends");
    }
    setIngesting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="rounded-xl border border-border bg-card"
    >
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Detected Trends</h3>
          <span className="text-[10px] text-muted-foreground font-mono ml-1">
            {trends?.length ?? 0} total
          </span>
        </div>
        <button
          onClick={handleIngest}
          disabled={ingesting}
          className="h-7 px-3 rounded-md bg-primary/10 text-primary text-[11px] font-medium flex items-center gap-1.5 hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          {ingesting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          {ingesting ? "Scanning..." : "Scan Now"}
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Loading trends...</div>
      ) : !trends?.length ? (
        <div className="p-8 text-center">
          <Zap className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No trends detected yet</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">Click "Scan Now" to fetch from data sources</p>
        </div>
      ) : (
        <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
          {trends.slice(0, 20).map((trend, i) => (
            <motion.div
              key={trend.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 p-3.5 hover:bg-secondary/30 transition-colors"
            >
              {/* Source icon */}
              <span className="text-base shrink-0" title={trend.source ?? ""}>
                {SOURCE_ICONS[trend.source ?? ""] || "📊"}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{trend.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono">
                    {trend.category}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">
                    {trend.source}
                  </span>
                  <span className="text-[10px] text-muted-foreground/40">
                    {format(new Date(trend.detected_at), "MMM d, HH:mm")}
                  </span>
                </div>
              </div>

              {/* Growth score */}
              <div className={`shrink-0 px-2 py-1 rounded-md ${scoreBg(trend.growth_score ?? 0)} text-center`}>
                <p className={`text-sm font-bold ${scoreColor(trend.growth_score ?? 0)}`}>
                  {trend.growth_score}
                </p>
                <p className="text-[8px] text-muted-foreground uppercase tracking-wider">growth</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Data sources footer */}
      <div className="p-3 border-t border-border bg-secondary/20">
        <p className="text-[10px] text-muted-foreground/50 mb-1.5">Connected data sources:</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(SOURCE_ICONS).map(([name, icon]) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
            >
              {icon} {name}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
