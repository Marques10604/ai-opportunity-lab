import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Megaphone, Loader2, Instagram, Youtube, Linkedin, Twitter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const PLATFORMS = [
  { id: "all", label: "Todas", icon: Megaphone },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "tiktok", label: "TikTok", icon: Megaphone },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "x", label: "X (Twitter)", icon: Twitter },
  { id: "youtube", label: "YouTube Shorts", icon: Youtube },
];

const PLATFORM_TIPS: Record<string, { format: string; duration: string; style: string }> = {
  instagram: { format: "Reels / Carrossel", duration: "30-60s / 5-10 slides", style: "Visual, emojis, CTA no final" },
  tiktok: { format: "Vídeo curto", duration: "15-60s", style: "Informal, hook forte, tendência" },
  linkedin: { format: "Post / Carrossel PDF", duration: "Texto 1300 chars", style: "Profissional, dados, storytelling" },
  x: { format: "Thread / Post", duration: "280 chars por tweet", style: "Direto, provocativo, thread" },
  youtube: { format: "Shorts", duration: "30-60s", style: "Tutorial rápido, antes/depois" },
};

export default function PlatformContent() {
  const { user } = useAuth();
  const [selectedPlatform, setSelectedPlatform] = useState("all");

  const { data: combinations = [], isLoading } = useQuery({
    queryKey: ["tool_combinations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tool_combinations")
        .select("*")
        .not("content_idea", "is", null)
        .order("innovation_score", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const platformNames = ["instagram", "tiktok", "linkedin", "x", "youtube"];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-accent" />
          Conteúdo por Plataforma
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Adapte cada ideia de conteúdo para Instagram, TikTok, LinkedIn, X e YouTube Shorts.
        </p>
      </div>

      {/* Platform selector */}
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPlatform(p.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedPlatform === p.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            <p.icon className="h-3.5 w-3.5" />
            {p.label}
          </button>
        ))}
      </div>

      {/* Platform tips */}
      {selectedPlatform !== "all" && PLATFORM_TIPS[selectedPlatform] && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-medium mb-0.5">Formato</p>
              <p className="font-semibold">{PLATFORM_TIPS[selectedPlatform].format}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-medium mb-0.5">Duração</p>
              <p className="font-semibold">{PLATFORM_TIPS[selectedPlatform].duration}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-medium mb-0.5">Estilo</p>
              <p className="font-semibold">{PLATFORM_TIPS[selectedPlatform].style}</p>
            </div>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : combinations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3">
          <Megaphone className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">Nenhum conteúdo para adaptar ainda.</p>
          <p className="text-xs text-muted-foreground/60">Gere soluções na Descoberta de Ferramentas para criar conteúdo adaptado.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {combinations.map((combo: any, i: number) => {
            const toolsUsed = Array.isArray(combo.tools_used) ? combo.tools_used : [];
            const platformsToShow = selectedPlatform === "all" ? platformNames : [selectedPlatform];

            return (
              <motion.div
                key={combo.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-border bg-card p-5 space-y-4"
              >
                <div>
                  <h3 className="text-sm font-bold">{combo.solution_name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{combo.content_idea}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {toolsUsed.map((tool: string, j: number) => (
                      <span key={j} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-medium">{tool}</span>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                  {platformsToShow.map((platform) => {
                    const tips = PLATFORM_TIPS[platform];
                    return (
                      <div key={platform} className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[9px] capitalize">{platform}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground"><span className="font-medium">Formato:</span> {tips?.format}</p>
                        <p className="text-[10px] text-muted-foreground"><span className="font-medium">Duração:</span> {tips?.duration}</p>
                        <p className="text-[10px] text-muted-foreground"><span className="font-medium">Estilo:</span> {tips?.style}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
