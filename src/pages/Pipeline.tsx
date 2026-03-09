import { motion } from "framer-motion";
import { useAgents } from "@/hooks/useSupabaseData";
import { Search, Sparkles, Database, ArrowRight, Layers, Eye, LayoutPanelLeft, Share2, RefreshCw, TrendingUp, Filter } from "lucide-react";

const agentIcons: Record<string, React.ElementType> = {
  "Pain Hunter": Search,
  "Niche Classifier": Layers,
  "Competitor Analyzer": Eye,
  "5 Angles Engine": LayoutPanelLeft,
  "Platform Personalizer": Share2,
  "Learning Loop": RefreshCw,
  "Trend Predictor": TrendingUp,
  "Anti Saturation Filter": Filter,
};

const agentLabels: Record<string, string> = {
  "Pain Hunter": "Caçador de Problemas",
  "Niche Classifier": "Classificador de Nichos",
  "Competitor Analyzer": "Análise de Concorrentes",
  "5 Angles Engine": "Motor de 5 Ângulos",
  "Platform Personalizer": "Personalizador por Plataforma",
  "Learning Loop": "Loop de Aprendizado",
  "Trend Predictor": "Previsor de Tendências",
  "Anti Saturation Filter": "Filtro Anti-Saturação",
};

const statusLabel = (status: string | null) => {
  if (status === "active") return "ativo";
  if (status === "processing") return "processando";
  if (status === "idle") return "inativo";
  return status ?? "-";
};

export default function Pipeline() {
  const { data: agents, isLoading } = useAgents();

  const pipelineNodes = [
    { id: "sources", name: "Fontes de Dados", icon: Database, status: null },
    ...(agents?.map((a) => ({ id: a.id, name: agentLabels[a.agent_name] || a.agent_name, icon: agentIcons[a.agent_name] || Sparkles, status: a.status })) ?? []),
    { id: "results", name: "Resultados de Oportunidades", icon: Sparkles, status: null },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline de Agentes</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do pipeline de processamento dos agentes de IA</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 overflow-x-auto">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando pipeline...</div>
        ) : (
          <div className="flex items-center gap-2 min-w-max">
            {pipelineNodes.map((node, i) => {
              const Icon = node.icon;
              const isEndpoint = node.id === "sources" || node.id === "results";
              return (
                <motion.div key={node.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }} className="flex items-center gap-2">
                  <div className={`rounded-xl border p-4 w-36 text-center transition-all ${
                    isEndpoint ? "border-primary/30 bg-primary/5" :
                    node.status === "active" ? "border-success/30 bg-success/5" :
                    node.status === "processing" ? "border-warning/30 bg-warning/5" :
                    "border-border bg-secondary/50"
                  }`}>
                    <div className={`mx-auto h-10 w-10 rounded-lg flex items-center justify-center mb-2 ${isEndpoint ? "bg-primary/20" : "bg-secondary"}`}>
                      <Icon className={`h-5 w-5 ${isEndpoint ? "text-primary" : "text-foreground"}`} />
                    </div>
                    <p className="text-[11px] font-medium leading-tight">{node.name}</p>
                    {node.status && (
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          node.status === "active" ? "bg-success" : node.status === "processing" ? "bg-warning animate-pulse-glow" : "bg-muted-foreground/40"
                        }`} />
                        <span className="text-[9px] text-muted-foreground">{statusLabel(node.status)}</span>
                      </div>
                    )}
                  </div>
                  {i < pipelineNodes.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Rede de Agentes</h2>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents?.map((agent, i) => {
              const Icon = agentIcons[agent.agent_name] || Sparkles;
              return (
                <motion.div key={agent.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{agentLabels[agent.agent_name] || agent.agent_name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            agent.status === "active" ? "bg-success" : agent.status === "processing" ? "bg-warning animate-pulse-glow" : "bg-muted-foreground/40"
                          }`} />
                          <span className="text-[10px] text-muted-foreground font-mono">{statusLabel(agent.status)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{agent.role}</p>
                  {agent.last_run && (
                    <p className="text-[9px] text-muted-foreground/60 mt-2 font-mono">Última execução: {new Date(agent.last_run).toLocaleString("pt-BR")}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
