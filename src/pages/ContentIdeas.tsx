import { motion } from "framer-motion";
import { Lightbulb, ArrowRight, Sparkles, ArrowLeft } from "lucide-react";
import { useSelectedProblem } from "@/contexts/SelectedProblemContext";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ContentIdeas() {
  const navigate = useNavigate();
  const { selectedProblem, selectedPipelineData } = useSelectedProblem();

  if (!selectedProblem) {
    return (
      <div className="space-y-6 max-w-7xl">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-warning" /> Ideias de Conteúdo
        </h1>
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card/20 rounded-2xl border border-dashed border-border mt-8 space-y-4">
          <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Lightbulb className="h-10 w-10 text-warning" />
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

  const ideas = selectedPipelineData?.content_ideas || [];

  return (
    <div className="space-y-6 max-w-7xl">
      <Button variant="ghost" onClick={() => navigate('/radar')} className="pl-0 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Radar
      </Button>
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-warning" />
          Ideias de Conteúdo
        </h1>
        <div className="mt-2 flex items-center gap-2 flex-wrap bg-secondary/30 p-3 rounded-lg border border-border">
          <span className="text-sm font-medium text-muted-foreground">Conteúdo gerado para: <span className="text-foreground font-bold">{selectedProblem.problem_title}</span></span>
          <Badge variant="secondary" className="text-[10px]">{selectedProblem.niche_category || "Geral"}</Badge>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ideas.map((idea: any, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-xl border border-border bg-card p-5 space-y-3 hover:border-warning/30 transition-colors"
          >
            <div className="flex items-start justify-between">
              <Badge variant="outline" className="text-[10px] capitalize">
                {idea.angle}
              </Badge>
              <div className="flex items-center gap-1 text-[10px] font-mono">
                <Sparkles className="h-3 w-3 text-warning" />
                <span className="font-bold">IA</span>
              </div>
            </div>

            <h3 className="text-sm font-bold">{idea.title}</h3>
            
            <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
              {['instagram', 'tiktok', 'linkedin', 'twitter', 'youtube'].map(platform => {
                const text = idea[platform];
                if (!text) return null;
                const pName = platform === 'youtube' ? 'YouTube' : platform === 'instagram' ? 'Instagram' : platform === 'tiktok' ? 'TikTok' : platform === 'twitter' ? 'X (Twitter)' : 'LinkedIn';
                return (
                  <div key={platform} className="text-xs pb-1">
                    <span className="font-bold text-muted-foreground">{pName}:</span> <span className="text-muted-foreground italic line-clamp-2">{Array.isArray(text) ? text.join(' ') : text}</span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
