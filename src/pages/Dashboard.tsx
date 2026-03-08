import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Lightbulb, TrendingUp, Target, LineChart, Zap } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { StatCard } from "@/components/StatCard";
import { activityFeed, chartData } from "@/lib/mockData";
import { useNavigate } from "react-router-dom";
import { useOpportunities, useTrends, useNiches } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { seedUserData } from "@/lib/seedData";
import { DiscoveryEngine } from "@/components/DiscoveryEngine";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const { data: opportunities, isLoading: oppLoading } = useOpportunities();
  const { data: trends } = useTrends();
  const { data: niches } = useNiches();

  // Seed data on first login
  useEffect(() => {
    if (user) seedUserData(user.id);
  }, [user]);

  const topScore = opportunities?.length ? Math.max(...opportunities.map(o => o.market_score ?? 0)) : 0;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time overview of AI opportunity discovery</p>
        </div>
        <button
          onClick={() => setDiscoveryOpen(true)}
          className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity glow-primary"
        >
          <Zap className="h-4 w-4" /> Discover Opportunities
        </button>
      </div>

      <DiscoveryEngine open={discoveryOpen} onClose={() => { setDiscoveryOpen(false); navigate("/opportunities"); }} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Top Score" value={topScore} icon={BarChart3} trend="+12% this week" glowing />
        <StatCard label="Ideas Discovered" value={opportunities?.length ?? 0} icon={Lightbulb} />
        <StatCard label="Trends Detected" value={trends?.length ?? 0} icon={TrendingUp} />
        <StatCard label="Niches Analyzed" value={niches?.length ?? 0} icon={Target} />
        <StatCard label="Market Predictions" value={89} icon={LineChart} trend="94% accuracy" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Opportunities Over Time</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorOpp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(190, 90%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(190, 90%, 50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(260, 70%, 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(260, 70%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "hsl(210, 20%, 92%)" }} />
              <Area type="monotone" dataKey="opportunities" stroke="hsl(190, 90%, 50%)" fillOpacity={1} fill="url(#colorOpp)" strokeWidth={2} />
              <Area type="monotone" dataKey="validated" stroke="hsl(260, 70%, 60%)" fillOpacity={1} fill="url(#colorVal)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-primary" />Discovered</span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-accent" />Validated</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">AI Activity Feed</h3>
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {activityFeed.map((item, i) => (
              <div key={i} className="flex gap-3 text-[11px]">
                <span className="text-muted-foreground/50 font-mono shrink-0 w-16">{item.time}</span>
                <div>
                  <span className="text-primary font-medium">{item.agent}</span>
                  <span className="text-muted-foreground"> · {item.action}</span>
                  <p className="text-muted-foreground/70 mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-border bg-card">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-semibold">Recent Opportunities</h3>
        </div>
        {oppLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading opportunities...</div>
        ) : (
          <div className="divide-y divide-border">
            {opportunities?.map((opp) => (
              <button
                key={opp.id}
                onClick={() => navigate(`/opportunities/${opp.id}`)}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{opp.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{opp.niche} · Competition: {opp.competition_level}</p>
                </div>
                <span className="text-lg font-bold text-primary ml-4">{opp.market_score}</span>
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
