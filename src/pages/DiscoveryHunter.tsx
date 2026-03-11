import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Loader2, AlertTriangle, Globe, MessageSquare,
  Zap, TrendingUp, Flame, Clock, Tag, Wrench, ChevronDown, ChevronUp,
  Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const NICHES = [
  "Todos", "Saúde", "E-commerce", "Finanças", "Jurídico", "Imobiliário",
  "RH", "Educação", "Logística", "Tecnologia", "Marketing", "Produtividade",
];

const IMPACT_COLORS: Record<string, string> = {
  Crítico: "bg-destructive/20 text-destructive border-destructive/30",
  Alto: "bg-warning/20 text-warning border-warning/30",
  Médio: "bg-info/20 text-info border-info/30",
  Baixo: "bg-secondary text-muted-foreground border-border",
};

const TIMING_COLORS: Record<string, string> = {
  Emergente: "bg-success/20 text-success",
  Crescendo: "bg-warning/20 text-warning",
  Saturado: "bg-destructive/20 text-destructive",
};

const TIMING_ICONS: Record<string, React.ReactNode> = {
  Emergente: <TrendingUp className="h-3 w-3" />,
  Crescendo: <Flame className="h-3 w-3" />,
  Saturado: <AlertTriangle className="h-3 w-3" />,
};

interface DiscoveredProblem {
  problem_title: string;
  problem_description: string | null;
  source_platform: string | null;
  niche_category: string | null;
  impact_level: string;
  timing_status: string;
  complaint_examples: string[];
  related_tools: string[];
  frequency_score: number;
  urgency_score: number;
  viral_score: number;
}

export default function DiscoveryHunter() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [hunting, setHunting] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState("Todos");
  const [results, setResults] = useState<DiscoveredProblem[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleHunt = async () => {
    if (!user) return;
    setHunting(true);
    setResults([]);
    setHasSearched(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const { data, error } = await supabase.functions.invoke("discover-problems", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          niche: selectedNiche === "Todos" ? null : selectedNiche,
          count: 8,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResults(data.problems || []);
      queryClient.invalidateQueries({ queryKey: ["detected_problems"] });
      toast.success(`${data.problems_discovered} problemas descobertos!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao caçar problemas");
    } finally {
      setHunting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" />
          Caçador de Problemas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Detecte problemas reais de discussões na internet — Reddit, Hacker News, Product Hunt, GitHub e mais.
        </p>
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-5 space-y-4"
      >
        <div className="flex items-center gap-2 mb-1">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Configurar Busca</span>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Nicho de Mercado</label>
          <div className="flex flex-wrap gap-2">
            {NICHES.map((niche) => (
              <button
                key={niche}
                onClick={() => setSelectedNiche(niche)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedNiche === niche
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {niche}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleHunt}
          disabled={hunting}
          className="gap-2 glow-primary"
          size="lg"
        >
          {hunting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Caçando problemas na internet...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Caçar Problemas
            </>
          )}
        </Button>

        {hunting && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Escaneando discussões em Reddit, Hacker News, Product Hunt, GitHub Issues, YouTube...
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 12, ease: "linear" }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Results */}
      {!hasSearched && !hunting && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3">
          <Globe className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">
            Clique em "Caçar Problemas" para detectar dores reais da internet
          </p>
          <p className="text-xs text-muted-foreground/60">
            O sistema analisa discussões dos últimos 30-90 dias em múltiplas plataformas
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              {results.length} Problemas Descobertos
            </h2>
            <span className="text-xs text-muted-foreground">
              Salvos automaticamente no banco de dados
            </span>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {results.map((problem, i) => {
                const isExpanded = expandedIdx === i;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`rounded-xl border bg-card p-5 space-y-3 transition-colors cursor-pointer ${
                      IMPACT_COLORS[problem.impact_level] || "border-border"
                    }`}
                    onClick={() => setExpandedIdx(isExpanded ? null : i)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold leading-snug flex-1">{problem.problem_title}</h3>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                    </div>

                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${TIMING_COLORS[problem.timing_status] || ""}`}>
                        {TIMING_ICONS[problem.timing_status]}
                        {problem.timing_status}
                      </span>
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Globe className="h-2.5 w-2.5" />
                        {problem.source_platform}
                      </Badge>
                      {problem.niche_category && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Tag className="h-2.5 w-2.5" />
                          {problem.niche_category}
                        </Badge>
                      )}
                    </div>

                    {/* Description */}
                    <p className={`text-xs text-muted-foreground leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                      {problem.problem_description}
                    </p>

                    {/* Scores */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-[10px]">
                        <TrendingUp className="h-3 w-3 text-primary" />
                        <span className="text-muted-foreground">Freq:</span>
                        <span className="font-bold font-mono">{problem.frequency_score}</span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-[10px]">
                        <Zap className="h-3 w-3 text-destructive" />
                        <span className="text-muted-foreground">Urg:</span>
                        <span className="font-bold font-mono">{problem.urgency_score}</span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-destructive/10 text-[10px]">
                        <Flame className="h-3 w-3 text-destructive" />
                        <span className="font-bold font-mono text-destructive">{problem.viral_score}</span>
                      </div>
                    </div>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 pt-2 border-t border-border overflow-hidden"
                        >
                          {/* Complaint examples */}
                          {problem.complaint_examples?.length > 0 && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1.5 flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                Exemplos de Reclamações
                              </p>
                              <div className="space-y-1.5">
                                {problem.complaint_examples.map((ex, j) => (
                                  <div key={j} className="text-xs text-muted-foreground italic bg-secondary/50 rounded-lg px-3 py-2">
                                    "{ex}"
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Related tools */}
                          {problem.related_tools?.length > 0 && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1.5 flex items-center gap-1">
                                <Wrench className="h-3 w-3" />
                                Ferramentas Relacionadas
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {problem.related_tools.map((tool, j) => (
                                  <span key={j} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-medium">
                                    {tool}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Impact */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">Impacto:</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${IMPACT_COLORS[problem.impact_level] || ""}`}>
                              {problem.impact_level}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
