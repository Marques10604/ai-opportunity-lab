import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Calendar, Crown, Flame, Globe, Lightbulb, Loader2, TrendingUp, X, Zap, Film, LayoutGrid, MessageSquare, ArrowUpDown, Eye } from "lucide-react";
import { useDetectedProblems } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface VideoScript {
  hook: string;
  problem: string;
  insight: string;
  cta: string;
}

interface Carousel {
  carousel_title: string;
  slide_1_hook: string;
  slide_2_problem: string;
  slide_3_explanation: string;
  slide_4_tip_or_solution: string;
  slide_5_call_to_action: string;
}

interface ContentIdea {
  content_title: string;
  content_hook: string;
  content_type: string;
  video_script: VideoScript;
  carousel: Carousel;
}

type SortOption = "viral_score" | "urgency_score" | "frequency_score";

const contentTypeIcon = (type: string) => {
  if (type.includes("vídeo") || type.includes("video")) return <Film className="h-4 w-4" />;
  if (type.includes("carrossel") || type.includes("carousel")) return <LayoutGrid className="h-4 w-4" />;
  return <MessageSquare className="h-4 w-4" />;
};

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "viral_score", label: "Viral Score" },
  { value: "urgency_score", label: "Urgência" },
  { value: "frequency_score", label: "Frequência" },
];

export default function Problems() {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortOption>("viral_score");
  const { data: problems, isLoading } = useDetectedProblems(sortBy);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [contentIdea, setContentIdea] = useState<ContentIdea | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const topProblems = useMemo(() => {
    if (!problems?.length) return [];
    return [...problems]
      .sort((a, b) => ((b.viral_score ?? 0)) - ((a.viral_score ?? 0)))
      .slice(0, 5);
  }, [problems]);

  const generateContentIdea = async (problemId: string, title: string, description: string | null) => {
    setGeneratingId(problemId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content-idea", {
        body: { problem_title: title, problem_description: description || "" },
      });
      if (error) throw error;
      if (data?.content_idea) {
        setContentIdea(data.content_idea);
        setModalOpen(true);
      } else {
        throw new Error(data?.error || "Erro ao gerar ideia");
      }
    } catch (err: any) {
      console.error("Erro:", err);
      toast.error(err?.message || "Erro ao gerar ideia de conteúdo");
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Problemas Detectados</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Problemas identificados pelo Pain Hunter Agent
        </p>
      </div>

      {/* Top Problems */}
      {!isLoading && topProblems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Top Problemas</h2>
            <span className="text-xs text-muted-foreground ml-1">por viral score</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {topProblems.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card p-4 space-y-3 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 px-2 py-1 rounded-bl-lg bg-destructive/20 text-destructive text-[10px] font-bold font-mono flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  {p.viral_score ?? 0}
                </div>
                <h3 className="text-sm font-semibold pr-14 leading-snug">{p.problem_title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-3">{p.problem_description || "-"}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-[10px] font-medium">
                  {p.source_platform || "-"}
                </span>
                <div className="flex gap-4 pt-1">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />Freq.</span>
                      <span className="font-mono">{p.frequency_score ?? 0}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${p.frequency_score ?? 0}%` }} />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Zap className="h-3 w-3" />Urg.</span>
                      <span className="font-mono">{p.urgency_score ?? 0}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-destructive rounded-full" style={{ width: `${p.urgency_score ?? 0}%` }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Sorting Controls */}
      <div className="flex items-center gap-3">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Ordenar por:</span>
        <div className="flex gap-2">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sortBy === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Problems Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando problemas...</div>
        ) : !problems?.length ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum problema detectado ainda.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Execute o Pain Hunter no Painel para detectar problemas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />Título</div>
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Descrição</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    <div className="flex items-center gap-2"><Globe className="h-4 w-4" />Plataforma</div>
                  </th>
                  <th className="text-center p-4 font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-2"><TrendingUp className="h-4 w-4" />Freq.</div>
                  </th>
                  <th className="text-center p-4 font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-2"><Zap className="h-4 w-4" />Urg.</div>
                  </th>
                  <th className="text-center p-4 font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-2"><Flame className="h-4 w-4" />Viral</div>
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />Data</div>
                  </th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {problems.map((problem) => (
                  <tr key={problem.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-4 font-medium">{problem.problem_title}</td>
                    <td className="p-4 text-muted-foreground max-w-xs">
                      <p className="line-clamp-2">{problem.problem_description || "-"}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-xs font-medium">
                        {problem.source_platform || "-"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${problem.frequency_score ?? 0}%` }} />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground w-8">{problem.frequency_score ?? 0}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full bg-destructive rounded-full" style={{ width: `${problem.urgency_score ?? 0}%` }} />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground w-8">{problem.urgency_score ?? 0}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-bold">
                        <Flame className="h-3 w-3" />
                        {problem.viral_score ?? 0}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground text-xs font-mono">
                      {problem.created_at
                        ? format(new Date(problem.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })
                        : "-"}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => generateContentIdea(problem.id, problem.problem_title, problem.problem_description)}
                        disabled={generatingId === problem.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                      >
                        {generatingId === problem.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Lightbulb className="h-3 w-3" />
                        )}
                        Gerar Conteúdo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Content Idea Modal */}
      <AnimatePresence>
        {modalOpen && contentIdea && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Lightbulb className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">Ideia de Conteúdo</h2>
                    <p className="text-[10px] text-muted-foreground">Gerada por IA a partir do problema</p>
                  </div>
                </div>
                <button onClick={() => setModalOpen(false)} className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-secondary transition-colors">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <h3 className="text-base font-bold">{contentIdea.content_title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    {contentTypeIcon(contentIdea.content_type)}
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold uppercase">
                      {contentIdea.content_type}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1.5">Hook de Abertura</p>
                  <p className="text-sm italic text-foreground">"{contentIdea.content_hook}"</p>
                </div>

                {/* Video Script Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Roteiro para Vídeo Curto</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-destructive font-bold mb-1">🎯 Hook (3s)</p>
                      <p className="text-sm text-foreground">{contentIdea.video_script?.hook}</p>
                    </div>

                    <div className="rounded-lg border border-border bg-secondary/30 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/80 font-bold mb-1">😩 Problema</p>
                      <p className="text-sm text-foreground">{contentIdea.video_script?.problem}</p>
                    </div>

                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">💡 Insight</p>
                      <p className="text-sm text-foreground">{contentIdea.video_script?.insight}</p>
                    </div>

                    <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-success font-bold mb-1">📣 CTA</p>
                      <p className="text-sm text-foreground">{contentIdea.video_script?.cta}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const script = `🎯 HOOK:\n${contentIdea.video_script?.hook}\n\n😩 PROBLEMA:\n${contentIdea.video_script?.problem}\n\n💡 INSIGHT:\n${contentIdea.video_script?.insight}\n\n📣 CTA:\n${contentIdea.video_script?.cta}`;
                      navigator.clipboard.writeText(script);
                      toast.success("Roteiro de vídeo copiado!");
                    }}
                    className="w-full h-9 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
                  >
                    📋 Copiar Roteiro de Vídeo
                  </button>
                </div>

                {/* Carousel Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-accent" />
                    <p className="text-sm font-semibold">Carrossel Instagram (5 slides)</p>
                  </div>

                  <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 mb-2">
                    <p className="text-[10px] uppercase tracking-widest text-accent font-bold mb-1">📌 Título do Carrossel</p>
                    <p className="text-sm font-semibold text-foreground">{contentIdea.carousel?.carousel_title}</p>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2">
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-center">
                      <p className="text-[9px] uppercase tracking-widest text-destructive font-bold mb-1">Slide 1</p>
                      <p className="text-[10px] text-muted-foreground mb-1">Hook</p>
                      <p className="text-xs text-foreground leading-tight">{contentIdea.carousel?.slide_1_hook}</p>
                    </div>

                    <div className="rounded-lg border border-border bg-secondary/30 p-2.5 text-center">
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Slide 2</p>
                      <p className="text-[10px] text-muted-foreground mb-1">Problema</p>
                      <p className="text-xs text-foreground leading-tight">{contentIdea.carousel?.slide_2_problem}</p>
                    </div>

                    <div className="rounded-lg border border-border bg-secondary/30 p-2.5 text-center">
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Slide 3</p>
                      <p className="text-[10px] text-muted-foreground mb-1">Explicação</p>
                      <p className="text-xs text-foreground leading-tight">{contentIdea.carousel?.slide_3_explanation}</p>
                    </div>

                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5 text-center">
                      <p className="text-[9px] uppercase tracking-widest text-primary font-bold mb-1">Slide 4</p>
                      <p className="text-[10px] text-muted-foreground mb-1">Solução</p>
                      <p className="text-xs text-foreground leading-tight">{contentIdea.carousel?.slide_4_tip_or_solution}</p>
                    </div>

                    <div className="rounded-lg border border-success/30 bg-success/5 p-2.5 text-center">
                      <p className="text-[9px] uppercase tracking-widest text-success font-bold mb-1">Slide 5</p>
                      <p className="text-[10px] text-muted-foreground mb-1">CTA</p>
                      <p className="text-xs text-foreground leading-tight">{contentIdea.carousel?.slide_5_call_to_action}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const carousel = `📌 ${contentIdea.carousel?.carousel_title}\n\n🔥 SLIDE 1 - HOOK:\n${contentIdea.carousel?.slide_1_hook}\n\n😩 SLIDE 2 - PROBLEMA:\n${contentIdea.carousel?.slide_2_problem}\n\n📖 SLIDE 3 - EXPLICAÇÃO:\n${contentIdea.carousel?.slide_3_explanation}\n\n💡 SLIDE 4 - SOLUÇÃO:\n${contentIdea.carousel?.slide_4_tip_or_solution}\n\n📣 SLIDE 5 - CTA:\n${contentIdea.carousel?.slide_5_call_to_action}`;
                      navigator.clipboard.writeText(carousel);
                      toast.success("Carrossel copiado!");
                    }}
                    className="w-full h-9 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
                  >
                    📋 Copiar Carrossel
                  </button>
                </div>
              </div>

              <div className="p-5 border-t border-border">
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
