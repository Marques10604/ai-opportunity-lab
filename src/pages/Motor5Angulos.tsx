import { motion } from "framer-motion";
import { Columns3, ArrowRight, ArrowLeft, Zap, Target, Flame, GraduationCap, BarChart } from "lucide-react";
import { useSelectedProblem } from "@/contexts/SelectedProblemContext";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ANGLE_CONFIG: Record<string, { label: string; icon: any; color: string; description: string }> = {
  tutorial: { label: "Tutorial", icon: GraduationCap, color: "text-blue-400 bg-blue-400/10 border-blue-400/20", description: "Passo a passo prático para resolver o problema." },
  polemica: { label: "Polêmica", icon: Flame, color: "text-red-400 bg-red-400/10 border-red-400/20", description: "Questionamento de status quo ou crença comum." },
  hack: { label: "Hack", icon: Zap, color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", description: "Atalho ou truque pouco conhecido para rapidez." },
  comparativo: { label: "Comparativo", icon: BarChart, color: "text-purple-400 bg-purple-400/10 border-purple-400/20", description: "Antes vs Depois ou Ferramenta A vs Ferramenta B." },
  transformacao: { label: "Transformação", icon: Target, color: "text-green-400 bg-green-400/10 border-green-400/20", description: "Foco no resultado final e benefício emocional." },
};

export default function Motor5Angulos() {
  const navigate = useNavigate();
  const { selectedProblem, selectedPipelineData } = useSelectedProblem();

  if (!selectedProblem) {
    return (
      <div className="space-y-6 max-w-7xl">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Columns3 className="h-6 w-6 text-primary" /> Motor de 5 Ângulos
        </h1>
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card/20 rounded-2xl border border-dashed border-border mt-8 space-y-4">
          <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Columns3 className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-lg font-bold">Nenhum problema selecionado</h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Selecione um problema no Radar de Oportunidades para visualizar os 5 ângulos.
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
          <Columns3 className="h-6 w-6 text-primary" />
          Motor de 5 Ângulos
        </h1>
        <div className="mt-2 flex items-center gap-2 flex-wrap bg-secondary/30 p-3 rounded-lg border border-border">
          <span className="text-sm font-medium text-muted-foreground">Conteúdo gerado para: <span className="text-foreground font-bold">{selectedProblem.problem_title}</span></span>
          <Badge variant="secondary" className="text-[10px]">{selectedProblem.niche_category || "Geral"}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.keys(ANGLE_CONFIG).map((angleKey) => {
          const config = ANGLE_CONFIG[angleKey];
          const idea = ideas.find((id: any) => id.angle?.toLowerCase().includes(angleKey));
          
          return (
            <motion.div
              key={angleKey}
              whileHover={{ y: -4 }}
              className={`rounded-xl border p-4 space-y-3 transition-colors ${idea ? 'bg-card ' + config.color.split(' ')[2] : 'bg-secondary/20 border-border opacity-60'}`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${config.color.split(' ').slice(0,2).join(' ')}`}>
                  <config.icon className="h-5 w-5" />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">{config.label}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-tight">{config.description}</p>
              </div>

              {idea ? (
                <div className="pt-3 border-t border-border/50">
                    <p className="text-sm font-bold mb-2">{idea.title}</p>
                    <p className="text-xs line-clamp-6 leading-relaxed italic text-muted-foreground font-medium">
                        "{Array.isArray(idea.instagram) ? idea.instagram.join(' ') : (idea.instagram || idea.tiktok || idea.linkedin)}"
                    </p>
                </div>
              ) : (
                <div className="pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground/40 italic">Aguardando geração...</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
