import { motion } from "framer-motion";
import { Megaphone, ArrowRight, ArrowLeft, Instagram, Youtube, Linkedin, Twitter } from "lucide-react";
import { useSelectedProblem } from "@/contexts/SelectedProblemContext";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "tiktok", label: "TikTok", icon: Megaphone },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "twitter", label: "X (Twitter)", icon: Twitter },
  { id: "youtube", label: "YouTube Shorts", icon: Youtube },
];

export default function PlatformContent() {
  const navigate = useNavigate();
  const { selectedProblem, selectedPipelineData } = useSelectedProblem();

  if (!selectedProblem) {
    return (
      <div className="space-y-6 max-w-7xl">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-accent" /> Conteúdo por Plataforma
        </h1>
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card/20 rounded-2xl border border-dashed border-border mt-8 space-y-4">
          <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Megaphone className="h-10 w-10 text-accent" />
          </div>
          <h2 className="text-lg font-bold">Nenhum problema selecionado</h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Selecione um problema no Radar de Oportunidades para gerar conteúdo adaptado.
          </p>
          <Button onClick={() => navigate('/radar')} className="mt-4 gap-2">
            Ir para o Radar <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const platformContent = selectedPipelineData?.platform_content || {};

  return (
    <div className="space-y-6 max-w-7xl">
      <Button variant="ghost" onClick={() => navigate('/radar')} className="pl-0 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Radar
      </Button>
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-accent" />
          Conteúdo por Plataforma
        </h1>
        <div className="mt-2 flex items-center gap-2 flex-wrap bg-secondary/30 p-3 rounded-lg border border-border">
          <span className="text-sm font-medium text-muted-foreground">Conteúdo gerado para: <span className="text-foreground font-bold">{selectedProblem.problem_title}</span></span>
          <Badge variant="secondary" className="text-[10px]">{selectedProblem.niche_category || "Geral"}</Badge>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORMS.map((p) => {
            const data = platformContent[p.id] || platformContent[p.id.replace('twitter', 'x')];

            return (
                <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl border border-border bg-card p-5 space-y-5"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <p.icon className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-bold text-base">{p.label}</h3>
                    </div>

                    {data ? (
                        <div className="space-y-4 border-t border-border/50 pt-4">
                            <div>
                                <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Formato</p>
                                <p className="font-medium text-sm text-foreground">{data.format}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Duração</p>
                                <p className="font-medium text-sm text-foreground">{data.duration}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Estilo</p>
                                <p className="font-medium text-sm text-foreground">{data.style}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="pt-4 border-t border-border/50 h-[150px] flex items-center justify-center">
                            <p className="text-sm text-muted-foreground/60 italic">Não especificado pela IA.</p>
                        </div>
                    )}
                </motion.div>
            );
        })}
      </div>
    </div>
  );
}
