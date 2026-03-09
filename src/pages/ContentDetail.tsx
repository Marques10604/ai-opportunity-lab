import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { ArrowLeft, Video, FileText, Image, Mic, MessageSquare, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

const tipoIcons: Record<string, React.ElementType> = {
  video: Video,
  carrossel: Image,
  artigo: FileText,
  podcast: Mic,
};

export default function ContentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data: content, isLoading } = useQuery({
    queryKey: ["content_detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_opportunities")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  const handleCopyRoteiro = () => {
    if (content?.roteiro_curto) {
      navigator.clipboard.writeText(content.roteiro_curto);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="max-w-4xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/contents")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">Conteúdo não encontrado</p>
        </div>
      </div>
    );
  }

  const Icon = tipoIcons[content.tipo_conteudo?.toLowerCase() || ""] || MessageSquare;
  const score = content.pontuacao_viral || 0;
  const slides = Array.isArray(content.slides_carrossel) ? content.slides_carrossel : [];

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/contents")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Voltar aos conteúdos
      </Button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight">{content.titulo_conteudo}</h1>
            {content.gancho && (
              <p className="text-sm text-muted-foreground mt-1">{content.gancho}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {content.plataforma && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {content.plataforma}
                </span>
              )}
              {content.tipo_conteudo && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground font-medium">
                  {content.tipo_conteudo}
                </span>
              )}
              <span className="text-xs text-muted-foreground/60 font-mono ml-auto">
                {new Date(content.created_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <div className="mt-4 max-w-[250px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Pontuação Viral</span>
                <span className="text-xs font-mono font-bold">{score}/100</span>
              </div>
              <Progress value={score} className="h-2" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Roteiro */}
      {content.roteiro_curto && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Roteiro Completo</h2>
            <Button variant="outline" size="sm" onClick={handleCopyRoteiro} className="gap-2 h-8">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado!" : "Copiar"}
            </Button>
          </div>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed bg-secondary/50 rounded-lg p-4">
            {content.roteiro_curto}
          </div>
        </motion.div>
      )}

      {/* Slides do Carrossel */}
      {slides.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h2 className="text-sm font-semibold mb-4">Slides do Carrossel ({slides.length})</h2>
          <div className="grid gap-3">
            {slides.map((slide: any, index: number) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-lg bg-secondary/50 p-4"
              >
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0 text-sm">
                  {typeof slide === "string" ? (
                    <p className="text-muted-foreground">{slide}</p>
                  ) : (
                    <>
                      {slide.titulo && <p className="font-medium mb-1">{slide.titulo}</p>}
                      {slide.texto && <p className="text-muted-foreground">{slide.texto}</p>}
                      {slide.conteudo && <p className="text-muted-foreground">{slide.conteudo}</p>}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
