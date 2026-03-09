import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Lightbulb, TrendingUp, Target, LineChart, Zap, Search, Loader2, Network } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { StatCard } from "@/components/StatCard";
import { chartData } from "@/lib/mockData";
import { useNavigate } from "react-router-dom";
import { useOpportunities, useTrends, useNiches, useAgentLogs } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { seedUserData } from "@/lib/seedData";
import { DiscoveryEngine } from "@/components/DiscoveryEngine";
import { TrendsList } from "@/components/TrendsList";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const competitionLabel = (level: string | null) => {
  if (level === "Low") return "Baixa";
  if (level === "Medium") return "Média";
  if (level === "High") return "Alta";
  return level ?? "-";
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const [painHunterLoading, setPainHunterLoading] = useState(false);
  const { data: opportunities, isLoading: oppLoading } = useOpportunities();
  const { data: trends } = useTrends();
  const { data: niches } = useNiches();
  const { data: agentLogs } = useAgentLogs();

  useEffect(() => {
    if (user) seedUserData(user.id);
  }, [user]);

  const runPainHunter = async () => {
    setPainHunterLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("pain-hunter", {
        body: { test_mode: true },
      });
      if (error) throw error;
      toast.success("Pain Hunter concluído. Problemas armazenados no banco de dados.");
    } catch (err: any) {
      console.error("Erro ao executar Pain Hunter:", err);
      toast.error(err?.message || "Erro ao executar Pain Hunter");
    } finally {
      setPainHunterLoading(false);
    }
  };

  const topScore = opportunities?.length ? Math.max(...opportunities.map(o => o.market_score ?? 0)) : 0;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Painel</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão em tempo real da descoberta de oportunidades com IA</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runPainHunter}
            disabled={painHunterLoading}
            className="h-9 px-4 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium flex items-center gap-2 hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            {painHunterLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Executar Pain Hunter
          </button>
          <button
            onClick={() => setDiscoveryOpen(true)}
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity glow-primary"
          >
            <Zap className="h-4 w-4" /> Descobrir Oportunidades
          </button>
        </div>
      </div>

      <DiscoveryEngine open={discoveryOpen} onClose={() => { setDiscoveryOpen(false); navigate("/opportunities"); }} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Maior Pontuação" value={topScore} icon={BarChart3} trend="+12% nesta semana" glowing />
        <StatCard label="Ideias Descobertas" value={opportunities?.length ?? 0} icon={Lightbulb} />
        <StatCard label="Tendências Detectadas" value={trends?.length ?? 0} icon={TrendingUp} />
        <StatCard label="Nichos Analisados" value={niches?.length ?? 0} icon={Target} />
        <StatCard label="Previsões de Mercado" value={89} icon={LineChart} trend="94% de precisão" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Oportunidades ao Longo do Tempo</h3>
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
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-primary" />Descobertas</span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-accent" />Validadas</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Feed de Atividade da IA</h3>
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {!agentLogs?.length ? (
              <p className="text-[11px] text-muted-foreground/50">Sem atividade ainda. Execute o pipeline para ver os logs.</p>
            ) : (
              agentLogs.slice(0, 15).map((log: any) => (
                <div key={log.id} className="flex gap-3 text-[11px]">
                  <span className="text-muted-foreground/50 font-mono shrink-0 w-16">
                    {new Date(log.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <div>
                    <span className="text-primary font-medium">{log.agent_name}</span>
                    <span className="text-muted-foreground"> · {log.action}</span>
                    <p className="text-muted-foreground/70 mt-0.5">{log.detail}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      <TrendsList />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-xl border border-border bg-card">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-semibold">Oportunidades Recentes</h3>
        </div>
        {oppLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando oportunidades...</div>
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
                  <p className="text-[11px] text-muted-foreground mt-0.5">{opp.niche} · Concorrência: {competitionLabel(opp.competition_level)}</p>
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
