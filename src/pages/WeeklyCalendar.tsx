import { useState } from "react";
import { useSelectedProblem } from "@/contexts/SelectedProblemContext";
import { CalendarDays, Instagram, Linkedin, Twitter, Youtube, Megaphone, ArrowRight, ArrowLeft, Copy, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

const WEEK_PLAN = [
  { day: "Segunda", platform: "instagram", icon: Instagram, pName: "Insta Reels", angle: "tutorial" },
  { day: "Terça", platform: "tiktok", icon: Megaphone, pName: "TikTok", angle: "hack" },
  { day: "Quarta", platform: "linkedin", icon: Linkedin, pName: "LinkedIn", angle: "comparativo" },
  { day: "Quinta", platform: "instagram", icon: Instagram, pName: "Insta Reels", angle: "polemica" },
  { day: "Sexta", platform: "youtube", icon: Youtube, pName: "YT Shorts", angle: "transformacao" },
  { day: "Sábado", platform: "twitter", icon: Twitter, pName: "X Thread", angle: "best" },
  { day: "Domingo", platform: "rest", icon: null, pName: "Descanso", angle: "rest" }
];

export default function WeeklyCalendar() {
  const navigate = useNavigate();
  const { selectedProblem, selectedPipelineData } = useSelectedProblem();
  const [selectedDay, setSelectedDay] = useState<any>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Roteiro copiado!");
  };

  if (!selectedProblem || !selectedPipelineData) {
    return (
      <div className="space-y-6 max-w-7xl">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" /> Calendário da Semana
        </h1>
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card/20 rounded-2xl border border-dashed border-border mt-8 space-y-4">
          <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <CalendarDays className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-lg font-bold">Calendário Vazio</h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Gere conteúdo no Radar para popular o calendário automaticamente.
          </p>
          <Button onClick={() => navigate('/radar')} className="mt-4 gap-2">
            Ir para o Radar <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const ideas = selectedPipelineData.content_ideas || [];
  
  const getIdeaForAngle = (angle: string) => {
    if (angle === 'best' && ideas.length > 0) return ideas[0];
    return ideas.find((i: any) => i.angle?.toLowerCase().includes(angle)) || ideas[0];
  };

  const getDayText = (idea: any, platform: string) => {
    if (!idea) return "";
    let val = idea[platform];
    if (platform === 'twitter' && !val && idea.x) val = idea.x;
    if (Array.isArray(val)) return val.join("\n\n");
    return val || idea.title || "";
  };

  const currentDayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday
  const todayAdjusted = currentDayIndex === 0 ? 6 : currentDayIndex - 1; 

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      <Button variant="ghost" onClick={() => navigate('/radar')} className="pl-0 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Radar
      </Button>
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          Calendário de Conteúdo da Semana
        </h1>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Conteúdo gerado para: <span className="text-foreground font-bold">{selectedProblem.problem_title}</span></span>
          <Badge variant="secondary" className="text-[10px]">{selectedProblem.niche_category || "Geral"}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mt-6">
        {WEEK_PLAN.map((plan, i) => {
          const isToday = i === todayAdjusted;
          const isRest = plan.angle === 'rest';
          const idea = isRest ? null : getIdeaForAngle(plan.angle);
          const fullText = isRest ? "" : getDayText(idea, plan.platform);
          
          return (
            <div 
                key={i} 
                className={`relative rounded-xl border flex flex-col h-[320px] transition-all
                  ${isToday && !isRest ? 'border-primary ring-1 ring-primary/30 shadow-lg bg-card' : 'border-border bg-card/50'}
                  ${isRest ? 'opacity-50 grayscale bg-secondary/20' : ''}`}
            >
              {isToday && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-0.5 rounded-full shadow-sm z-10">HOJE</div>}
              
              <div className="p-3 border-b border-border/50 flex flex-col items-center justify-center bg-secondary/10 relative">
                <p className="text-xs font-bold uppercase tracking-wider mb-2">{plan.day}</p>
                {plan.icon ? (
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-background border shadow-sm">
                        <plan.icon className="h-5 w-5 text-foreground" />
                    </div>
                ) : (
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-background border shadow-sm text-muted-foreground font-bold text-xl">
                        Zzz
                    </div>
                )}
                {!isRest && (
                    <Badge variant="outline" className="mt-2 text-[9px] capitalize border-primary/20 text-primary">
                      {plan.angle}
                    </Badge>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col h-full bg-card overflow-hidden">
                {!isRest && idea ? (
                  <>
                    <p className="text-xs text-muted-foreground/80 leading-relaxed italic line-clamp-6 flex-1">
                        "{fullText}"
                    </p>
                    <div className="mt-auto space-y-2 pt-2 border-t border-border/50">
                        <Button variant="secondary" size="sm" className="w-full text-[10px] h-7 gap-1.5" onClick={() => copyToClipboard(fullText)}>
                            <Copy className="h-3 w-3" /> Copiar Roteiro
                        </Button>
                        <Button variant="default" size="sm" className="w-full text-[10px] h-7 gap-1.5 font-bold" onClick={() => setSelectedDay({ plan, idea, fullText })}>
                            <Eye className="h-3 w-3" /> Ver Completo
                        </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                     <p className="text-xs font-bold text-muted-foreground/50 uppercase">Dia de Descanso</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <AnimatePresence>
        {selectedDay && (
          <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
            <DialogContent className="max-w-2xl bg-card border-border">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="capitalize text-xs">{selectedDay.plan.day}</Badge>
                    <Badge variant="secondary" className="capitalize text-xs text-primary">{selectedDay.plan.pName}</Badge>
                    <Badge variant="default" className="capitalize text-xs">{selectedDay.plan.angle}</Badge>
                </div>
                <DialogTitle className="text-xl">{selectedDay.idea.title}</DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="max-h-[60vh] mt-4 relative">
                <div className="bg-secondary/20 p-6 rounded-lg font-medium text-sm leading-relaxed whitespace-pre-wrap border border-border/50 font-mono">
                    {selectedDay.fullText}
                </div>
              </ScrollArea>
              
              <div className="flex justify-end mt-6 gap-3 pt-4 border-t border-border/50">
                  <Button variant="outline" onClick={() => setSelectedDay(null)}>Fechar</Button>
                  <Button onClick={() => copyToClipboard(selectedDay.fullText)} className="gap-2 font-bold">
                      <Copy className="h-4 w-4" /> Copiar Tudo
                  </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

    </div>
  );
}
