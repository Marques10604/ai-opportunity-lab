import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Search, Filter, Video, FileText, Image, Mic } from "lucide-react";
import { useContentOpportunities } from "@/hooks/useSupabaseData";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const tipoIcons: Record<string, React.ElementType> = {
  video: Video,
  carrossel: Image,
  artigo: FileText,
  podcast: Mic,
};

export default function ContentOpportunities() {
  const { data: contents, isLoading } = useContentOpportunities();
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const platforms = useMemo(() => {
    if (!contents) return [];
    const set = new Set(contents.map((c) => c.plataforma).filter(Boolean));
    return Array.from(set) as string[];
  }, [contents]);

  const types = useMemo(() => {
    if (!contents) return [];
    const set = new Set(contents.map((c) => c.tipo_conteudo).filter(Boolean));
    return Array.from(set) as string[];
  }, [contents]);

  const filtered = useMemo(() => {
    if (!contents) return [];
    return contents.filter((c) => {
      const matchSearch =
        !search ||
        c.titulo_conteudo.toLowerCase().includes(search.toLowerCase()) ||
        c.gancho?.toLowerCase().includes(search.toLowerCase());
      const matchPlatform = platformFilter === "all" || c.plataforma === platformFilter;
      const matchType = typeFilter === "all" || c.tipo_conteudo === typeFilter;
      return matchSearch && matchPlatform && matchType;
    });
  }, [contents, search, platformFilter, typeFilter]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Conteúdos Gerados</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Posts e roteiros criados pelos agentes de conteúdo
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou gancho..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[160px] h-9">
            <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Plataforma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas plataformas</SelectItem>
            {platforms.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] h-9">
            <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos tipos</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum conteúdo encontrado</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Execute o pipeline para gerar conteúdos
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((content, i) => {
            const Icon = tipoIcons[content.tipo_conteudo?.toLowerCase() || ""] || MessageSquare;
            const score = content.pontuacao_viral || 0;
            return (
              <motion.div
                key={content.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold line-clamp-1">{content.titulo_conteudo}</h3>
                        {content.gancho && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{content.gancho}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {content.plataforma && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            {content.plataforma}
                          </span>
                        )}
                        {content.tipo_conteudo && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                            {content.tipo_conteudo}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex-1 max-w-[200px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-muted-foreground">Pontuação Viral</span>
                          <span className="text-[10px] font-mono font-medium">{score}</span>
                        </div>
                        <Progress
                          value={score}
                          className="h-1.5"
                          style={{
                            ["--progress-background" as any]: score >= 70 ? "hsl(var(--success))" : score >= 40 ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))",
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 font-mono">
                        {new Date(content.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
