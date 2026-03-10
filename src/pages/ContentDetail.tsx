import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  ArrowLeft, Video, FileText, Image, Mic, MessageSquare,
  Copy, Check, Pencil, Save, X, Plus, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

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
  const queryClient = useQueryClient();

  const [copied, setCopied] = useState(false);
  const [editingHeader, setEditingHeader] = useState(false);
  const [tituloValue, setTituloValue] = useState("");
  const [ganchoValue, setGanchoValue] = useState("");
  const [editingRoteiro, setEditingRoteiro] = useState(false);
  const [editingSlides, setEditingSlides] = useState(false);
  const [roteiroValue, setRoteiroValue] = useState("");
  const [slidesValue, setSlidesValue] = useState<Array<{ titulo: string; texto: string }>>([]);
  const [saving, setSaving] = useState(false);

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
    const text = editingRoteiro ? roteiroValue : content?.roteiro_curto;
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const startEditRoteiro = () => {
    setRoteiroValue(content?.roteiro_curto || "");
    setEditingRoteiro(true);
  };

  const cancelEditRoteiro = () => {
    setEditingRoteiro(false);
    setRoteiroValue("");
  };

  const saveRoteiro = async () => {
    if (!id || !roteiroValue.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("content_opportunities")
      .update({ roteiro_curto: roteiroValue.trim().slice(0, 10000) })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar roteiro");
      return;
    }
    toast.success("Roteiro atualizado");
    setEditingRoteiro(false);
    queryClient.invalidateQueries({ queryKey: ["content_detail", id] });
    queryClient.invalidateQueries({ queryKey: ["content_opportunities"] });
  };

  const parseSlides = (raw: any): Array<{ titulo: string; texto: string }> => {
    if (!Array.isArray(raw)) return [];
    return raw.map((s: any) =>
      typeof s === "string"
        ? { titulo: "", texto: s }
        : { titulo: s.titulo || "", texto: s.texto || s.conteudo || "" }
    );
  };

  const startEditSlides = () => {
    setSlidesValue(parseSlides(content?.slides_carrossel));
    setEditingSlides(true);
  };

  const cancelEditSlides = () => {
    setEditingSlides(false);
    setSlidesValue([]);
  };

  const updateSlide = (index: number, field: "titulo" | "texto", value: string) => {
    setSlidesValue((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value.slice(0, 2000) } : s)));
  };

  const addSlide = () => {
    setSlidesValue((prev) => [...prev, { titulo: "", texto: "" }]);
  };

  const removeSlide = (index: number) => {
    setSlidesValue((prev) => prev.filter((_, i) => i !== index));
  };

  const saveSlides = async () => {
    if (!id) return;
    setSaving(true);
    const cleaned: Json = slidesValue
      .filter((s) => s.titulo.trim() || s.texto.trim())
      .map((s) => ({ titulo: s.titulo.trim(), texto: s.texto.trim() }));
    const { error } = await supabase
      .from("content_opportunities")
      .update({ slides_carrossel: cleaned })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar slides");
      return;
    }
    toast.success("Slides atualizados");
    setEditingSlides(false);
    queryClient.invalidateQueries({ queryKey: ["content_detail", id] });
    queryClient.invalidateQueries({ queryKey: ["content_opportunities"] });
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
        <Button variant="ghost" size="sm" onClick={() => navigate("/content/generated")}>
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
      <Button variant="ghost" size="sm" onClick={() => navigate("/content/generated")} className="gap-2">
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
            {editingHeader ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Título</label>
                  <Input
                    value={tituloValue}
                    onChange={(e) => setTituloValue(e.target.value)}
                    className="text-lg font-bold h-10"
                    placeholder="Título do conteúdo"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Gancho</label>
                  <Textarea
                    value={ganchoValue}
                    onChange={(e) => setGanchoValue(e.target.value)}
                    className="text-sm min-h-[60px]"
                    placeholder="Gancho do conteúdo"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingHeader(false)} disabled={saving} className="gap-1.5 h-8">
                    <X className="h-3.5 w-3.5" /> Cancelar
                  </Button>
                  <Button size="sm" disabled={saving || !tituloValue.trim()} className="gap-1.5 h-8" onClick={async () => {
                    if (!id || !tituloValue.trim()) return;
                    setSaving(true);
                    const { error } = await supabase
                      .from("content_opportunities")
                      .update({
                        titulo_conteudo: tituloValue.trim().slice(0, 500),
                        gancho: ganchoValue.trim().slice(0, 1000) || null,
                      })
                      .eq("id", id);
                    setSaving(false);
                    if (error) { toast.error("Erro ao salvar"); return; }
                    toast.success("Título e gancho atualizados");
                    setEditingHeader(false);
                    queryClient.invalidateQueries({ queryKey: ["content_detail", id] });
                    queryClient.invalidateQueries({ queryKey: ["content_opportunities"] });
                  }}>
                    <Save className="h-3.5 w-3.5" /> {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="group/header">
                <div className="flex items-start justify-between gap-2">
                  <h1 className="text-xl font-bold tracking-tight">{content.titulo_conteudo}</h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 opacity-0 group-hover/header:opacity-100 transition-opacity"
                    onClick={() => {
                      setTituloValue(content.titulo_conteudo);
                      setGanchoValue(content.gancho || "");
                      setEditingHeader(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {content.gancho && (
                  <p className="text-sm text-muted-foreground mt-1">{content.gancho}</p>
                )}
              </div>
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
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Roteiro Completo</h2>
          <div className="flex items-center gap-2">
            {editingRoteiro ? (
              <>
                <Button variant="ghost" size="sm" onClick={cancelEditRoteiro} className="gap-1.5 h-8" disabled={saving}>
                  <X className="h-3.5 w-3.5" /> Cancelar
                </Button>
                <Button size="sm" onClick={saveRoteiro} className="gap-1.5 h-8" disabled={saving}>
                  <Save className="h-3.5 w-3.5" /> {saving ? "Salvando..." : "Salvar"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={handleCopyRoteiro} className="gap-1.5 h-8">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
                <Button variant="outline" size="sm" onClick={startEditRoteiro} className="gap-1.5 h-8">
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
              </>
            )}
          </div>
        </div>
        {editingRoteiro ? (
          <Textarea
            value={roteiroValue}
            onChange={(e) => setRoteiroValue(e.target.value)}
            className="min-h-[200px] text-sm leading-relaxed"
            placeholder="Escreva o roteiro aqui..."
          />
        ) : (
          <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed bg-secondary/50 rounded-lg p-4">
            {content.roteiro_curto || "Nenhum roteiro disponível"}
          </div>
        )}
      </motion.div>

      {/* Slides do Carrossel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">
            Slides do Carrossel ({editingSlides ? slidesValue.length : slides.length})
          </h2>
          <div className="flex items-center gap-2">
            {editingSlides ? (
              <>
                <Button variant="ghost" size="sm" onClick={cancelEditSlides} className="gap-1.5 h-8" disabled={saving}>
                  <X className="h-3.5 w-3.5" /> Cancelar
                </Button>
                <Button size="sm" onClick={saveSlides} className="gap-1.5 h-8" disabled={saving}>
                  <Save className="h-3.5 w-3.5" /> {saving ? "Salvando..." : "Salvar"}
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={startEditSlides} className="gap-1.5 h-8">
                <Pencil className="h-3.5 w-3.5" /> Editar
              </Button>
            )}
          </div>
        </div>

        {editingSlides ? (
          <div className="grid gap-3">
            {slidesValue.map((slide, index) => (
              <div key={index} className="flex items-start gap-3 rounded-lg border border-border p-4">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <span className="text-xs font-bold text-primary">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <Input
                    value={slide.titulo}
                    onChange={(e) => updateSlide(index, "titulo", e.target.value)}
                    placeholder="Título do slide"
                    className="text-sm h-8"
                  />
                  <Textarea
                    value={slide.texto}
                    onChange={(e) => updateSlide(index, "texto", e.target.value)}
                    placeholder="Conteúdo do slide"
                    className="text-sm min-h-[60px]"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeSlide(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addSlide} className="gap-1.5 w-fit">
              <Plus className="h-3.5 w-3.5" /> Adicionar slide
            </Button>
          </div>
        ) : slides.length > 0 ? (
          <div className="grid gap-3">
            {slides.map((slide: any, index: number) => (
              <div key={index} className="flex items-start gap-3 rounded-lg bg-secondary/50 p-4">
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
        ) : (
          <p className="text-sm text-muted-foreground/60">Nenhum slide disponível</p>
        )}
      </motion.div>
    </div>
  );
}
