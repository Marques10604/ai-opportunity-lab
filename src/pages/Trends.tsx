import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, RefreshCw, Loader2, Zap, Filter, X } from "lucide-react";
import { format } from "date-fns";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { useTrends } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

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
  return "text-destructive";
}
function scoreBg(score: number) {
  if (score >= 75) return "bg-success/10";
  if (score >= 50) return "bg-warning/10";
  return "bg-destructive/10";
}
function scoreHsl(score: number) {
  if (score >= 75) return "hsl(150, 60%, 50%)";
  if (score >= 50) return "hsl(40, 90%, 55%)";
  return "hsl(0, 72%, 51%)";
}

export default function Trends() {
  const { data: trends, isLoading } = useTrends();
  const queryClient = useQueryClient();
  const [ingesting, setIngesting] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  // Derived filter options
  const categories = useMemo(() => {
    if (!trends) return [];
    return [...new Set(trends.map((t) => t.category).filter(Boolean))].sort();
  }, [trends]);

  const sources = useMemo(() => {
    if (!trends) return [];
    return [...new Set(trends.map((t) => t.source).filter(Boolean))].sort();
  }, [trends]);

  // Filtered trends
  const filtered = useMemo(() => {
    if (!trends) return [];
    return trends.filter((t) => {
      if (selectedCategory && t.category !== selectedCategory) return false;
      if (selectedSource && t.source !== selectedSource) return false;
      if (dateFrom) {
        const d = new Date(t.detected_at);
        if (d < dateFrom) return false;
      }
      if (dateTo) {
        const d = new Date(t.detected_at);
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      return true;
    });
  }, [trends, selectedCategory, selectedSource, dateFrom, dateTo]);

  // Chart: growth over time (group by date)
  const timeChartData = useMemo(() => {
    const byDate: Record<string, { total: number; count: number }> = {};
    for (const t of filtered) {
      const day = format(new Date(t.detected_at), "MMM d");
      if (!byDate[day]) byDate[day] = { total: 0, count: 0 };
      byDate[day].total += t.growth_score ?? 0;
      byDate[day].count += 1;
    }
    return Object.entries(byDate).map(([date, { total, count }]) => ({
      date,
      avgScore: Math.round(total / count),
      count,
    }));
  }, [filtered]);

  // Chart: category breakdown
  const categoryChartData = useMemo(() => {
    const byCategory: Record<string, { total: number; count: number }> = {};
    for (const t of filtered) {
      const cat = t.category || "Other";
      if (!byCategory[cat]) byCategory[cat] = { total: 0, count: 0 };
      byCategory[cat].total += t.growth_score ?? 0;
      byCategory[cat].count += 1;
    }
    return Object.entries(byCategory)
      .map(([name, { total, count }]) => ({ name, avgScore: Math.round(total / count), count }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [filtered]);

  const hasFilters = selectedCategory || selectedSource || dateFrom || dateTo;

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedSource(null);
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const handleIngest = async () => {
    setIngesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("ingest-trends");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      queryClient.invalidateQueries({ queryKey: ["trends"] });
      toast.success(data?.message || "Trends ingested");
    } catch (err: any) {
      toast.error(err?.message || "Failed to ingest trends");
    }
    setIngesting(false);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Market Trends</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-detected trends from {Object.keys(SOURCE_ICONS).length} data sources
          </p>
        </div>
        <button
          onClick={handleIngest}
          disabled={ingesting}
          className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity glow-primary disabled:opacity-60"
        >
          {ingesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {ingesting ? "Scanning..." : "Scan Sources"}
        </button>
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold">Filters</span>
          {hasFilters && (
            <button onClick={clearFilters} className="ml-auto text-[10px] text-primary flex items-center gap-1 hover:underline">
              <X className="h-3 w-3" /> Clear all
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Category */}
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Category</label>
            <select
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="h-8 px-2 rounded-md border border-border bg-secondary text-xs text-foreground min-w-[140px]"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c!}>{c}</option>
              ))}
            </select>
          </div>

          {/* Source */}
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Source</label>
            <select
              value={selectedSource || ""}
              onChange={(e) => setSelectedSource(e.target.value || null)}
              className="h-8 px-2 rounded-md border border-border bg-secondary text-xs text-foreground min-w-[140px]"
            >
              <option value="">All sources</option>
              {sources.map((s) => (
                <option key={s} value={s!}>{s}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">From</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-8 px-2 text-xs min-w-[130px] justify-start", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="h-3 w-3 mr-1.5" />
                  {dateFrom ? format(dateFrom, "MMM d, yyyy") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date To */}
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">To</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-8 px-2 text-xs min-w-[130px] justify-start", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="h-3 w-3 mr-1.5" />
                  {dateTo ? format(dateTo, "MMM d, yyyy") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
            <span className="text-[10px] text-muted-foreground mr-1">Active:</span>
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {selectedCategory}
                <button onClick={() => setSelectedCategory(null)}><X className="h-2.5 w-2.5" /></button>
              </span>
            )}
            {selectedSource && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                {selectedSource}
                <button onClick={() => setSelectedSource(null)}><X className="h-2.5 w-2.5" /></button>
              </span>
            )}
            {dateFrom && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-info/10 text-info">
                From {format(dateFrom, "MMM d")}
                <button onClick={() => setDateFrom(undefined)}><X className="h-2.5 w-2.5" /></button>
              </span>
            )}
            {dateTo && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-info/10 text-info">
                To {format(dateTo, "MMM d")}
                <button onClick={() => setDateTo(undefined)}><X className="h-2.5 w-2.5" /></button>
              </span>
            )}
            <span className="text-[10px] text-muted-foreground/50 ml-1">{filtered.length} results</span>
          </div>
        )}
      </motion.div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Growth over time */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Average Growth Score Over Time</h3>
          {timeChartData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={timeChartData}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(190, 90%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(190, 90%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                <XAxis dataKey="date" tick={{ fill: "hsl(215,12%,50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "hsl(215,12%,50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(220,18%,10%)", border: "1px solid hsl(220,14%,18%)", borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="avgScore" stroke="hsl(190, 90%, 50%)" fillOpacity={1} fill="url(#growthGrad)" strokeWidth={2} name="Avg Score" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Category breakdown */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Growth by Category</h3>
          {categoryChartData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,18%)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(215,12%,50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "hsl(215,12%,50%)", fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(220,18%,10%)", border: "1px solid hsl(220,14%,18%)", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="avgScore" radius={[0, 4, 4, 0]} barSize={18} name="Avg Score">
                  {categoryChartData.map((entry, i) => (
                    <Cell key={i} fill={scoreHsl(entry.avgScore)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Trends table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-border bg-card">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">All Trends</h3>
            <span className="text-[10px] text-muted-foreground font-mono">{filtered.length} results</span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading trends...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Zap className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{hasFilters ? "No trends match filters" : "No trends detected yet"}</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              {hasFilters ? "Try adjusting your filters" : 'Click "Scan Sources" to fetch trends'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Trend</th>
                  <th className="px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Category</th>
                  <th className="px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Source</th>
                  <th className="px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Growth</th>
                  <th className="px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Detected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((trend, i) => (
                  <motion.tr
                    key={trend.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{SOURCE_ICONS[trend.source ?? ""] || "📊"}</span>
                        <span className="text-xs font-medium">{trend.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-mono">
                        {trend.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{trend.source}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-10 h-6 rounded-md text-xs font-bold ${scoreBg(trend.growth_score ?? 0)} ${scoreColor(trend.growth_score ?? 0)}`}>
                        {trend.growth_score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                      {format(new Date(trend.detected_at), "MMM d, HH:mm")}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sources footer */}
        <div className="p-3 border-t border-border bg-secondary/20">
          <p className="text-[10px] text-muted-foreground/50 mb-1.5">Connected sources:</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(SOURCE_ICONS).map(([name, icon]) => (
              <span
                key={name}
                onClick={() => setSelectedSource(selectedSource === name ? null : name)}
                className={cn(
                  "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full cursor-pointer transition-colors",
                  selectedSource === name ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                )}
              >
                {icon} {name}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
