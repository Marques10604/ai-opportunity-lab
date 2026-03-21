import { motion } from "framer-motion";
import { Film, ArrowRight, ArrowLeft, ArrowDown } from "lucide-react";
import { useSelectedProblem } from "@/contexts/SelectedProblemContext";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STEP_CONFIG = [
  { key: "hook", label: "Hook", emoji: "🎣", color: "bg-destructive/10 border-destructive/20 text-destructive" },
  { key: "problem", label: "Problema", emoji: "😤", color: "bg-warning/10 border-warning/20 text-warning" },
  { key: "solution", label: "Solução", emoji: "💡", color: "bg-accent/10 border-accent/20 text-accent" },
  { key: "cta", label: "CTA", emoji: "🎯", color: "bg-success/10 border-success/20 text-success" },
];

export default function VideoScripts() {
  const navigate = useNavigate();
  const { selectedProblem, selectedPipelineData } = useSelectedProblem();

  if (!selectedProblem) {
    return (
      <div className="space-y-6 max-w-7xl">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Film className="h-6 w-6 text-info" /> Roteiros de Vídeo
        </h1>
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card/20 rounded-2xl border border-dashed border-border mt-8 space-y-4">
          <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Film className="h-10 w-10 text-info" />
          </div>
          <h2 className="text-lg font-bold">Nenhum problema selecionado</h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Selecione um problema no Radar de Oportunidades para gerar conteúdo.
          </p>
          <Button onClick={() => navigate('/radar')} className="mt-4 gap-2">
            Ir para o Radar <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const vs = selectedPipelineData?.video_script;

  return (
    <div className="space-y-6 max-w-7xl">
      <Button variant="ghost" onClick={() => navigate('/radar')} className="pl-0 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Radar
      </Button>
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Film className="h-6 w-6 text-info" />
          Roteiro de Vídeo
        </h1>
        <div className="mt-2 flex items-center gap-2 flex-wrap bg-secondary/30 p-3 rounded-lg border border-border">
          <span className="text-sm font-medium text-muted-foreground">Conteúdo gerado para: <span className="text-foreground font-bold">{selectedProblem.problem_title}</span></span>
          <Badge variant="secondary" className="text-[10px]">{selectedProblem.niche_category || "Geral"}</Badge>
        </div>
      </div>

      {vs ? (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-5 space-y-4 max-w-3xl"
        >
            <div className="flex items-start justify-between">
                <h3 className="text-sm font-bold flex-1">Roteiro Principal</h3>
                <Badge variant="secondary" className="text-[10px] shrink-0 gap-1">
                <Film className="h-3 w-3" /> Roteiro
                </Badge>
            </div>

            <div className="space-y-2">
                {STEP_CONFIG.map((step, k) => {
                const value = vs[step.key];
                if (!value) return null;
                return (
                    <div key={k}>
                    {k > 0 && <div className="flex justify-center py-0.5"><ArrowDown className="h-3 w-3 text-muted-foreground/30" /></div>}
                    <div className={`rounded-lg border px-3 py-2.5 ${step.color}`}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5">
                        {step.emoji} {step.label}
                        </p>
                        <p className="text-sm leading-relaxed font-medium">{value}</p>
                    </div>
                    </div>
                );
                })}
            </div>
        </motion.div>
      ) : (
        <div className="text-sm text-muted-foreground">Roteiro não encontrado para este pipeline.</div>
      )}
    </div>
  );
}
