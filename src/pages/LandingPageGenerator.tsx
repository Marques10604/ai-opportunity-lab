import { useState, useEffect } from "react";
import { useOpportunities } from "@/hooks/useSupabaseData";
import { 
  Rocket, 
  Layout, 
  Download, 
  Copy, 
  ExternalLink, 
  Eye, 
  Zap, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  History,
  Trash2,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { COPYWRITER_SYSTEM_PROMPT, DESIGNER_SYSTEM_PROMPT } from "@/lib/copywriterAgent";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SavedLandingPage {
  id: string;
  created_at: string;
  opportunity_title: string;
  category: string;
  html_content: string;
  html_filename: string;
  opportunity_id: string | null;
}

const CATEGORY_STYLES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  tech: { label: "Tech/AI", bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
  health: { label: "Saúde", bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
  finance: { label: "Finanças", bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" },
  education: { label: "Educação", bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" },
  marketing: { label: "Marketing", bg: "bg-violet-500/10", text: "text-violet-500", border: "border-violet-500/20" },
  hr: { label: "RH", bg: "bg-pink-500/10", text: "text-pink-500", border: "border-pink-500/20" },
  legal: { label: "Jurídico", bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20" },
};

export default function LandingPageGenerator() {
  const { user } = useAuth();
  const { data: opportunities = [], isLoading: loadingOpps } = useOpportunities();
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [savedHistory, setSavedHistory] = useState<SavedLandingPage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const selectedOpp = opportunities.find(o => o.id === selectedOppId);

  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("landing_pages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        // Table might not exist yet, treat as empty gracefully
        const isMissingTable = error.message?.includes("relation") || 
                              error.message?.includes("does not exist") ||
                              error.code === "PGRST116" ||
                              error.code === "42P01";
        
        if (!isMissingTable) {
           console.error("Error loading history:", error);
        }
        setSavedHistory([]);
      } else {
        setSavedHistory(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  function detectCategory(title: string, description: string): string {
    const text = (title + ' ' + description).toLowerCase();
    if (text.match(/saúde|health|mental|médico|médica|wellness|terapia|paciente/)) return 'health';
    if (text.match(/finanças|finance|pagamento|payment|contábil|fatura|invoice|financeiro/)) return 'finance';
    if (text.match(/educação|education|curso|course|aprendizado|learning|ensino/)) return 'education';
    if (text.match(/marketing|conteúdo|content|social|instagram|tiktok|influencer/)) return 'marketing';
    if (text.match(/rh|hr|recrutamento|recruitment|pessoas|people|candidato/)) return 'hr';
    if (text.match(/jurídico|legal|contrato|contract|compliance|advogado/)) return 'legal';
    return 'tech';
  }

  const handleGenerate = async () => {
    if (!selectedOpp || !user) {
      toast.error("Selecione uma oportunidade primeiro");
      return;
    }

    setGenerating(true);
    setGeneratedHtml(null);

    const category = detectCategory(selectedOpp.title, selectedOpp.problem);

    try {
      const prompt = `Using the copywriter and designer frameworks provided, generate a complete high-converting landing page for this SaaS opportunity.
      
Category: ${category}
Product: ${selectedOpp.title}
Problem it solves: ${selectedOpp.problem}
Proposed solution: ${selectedOpp.solution}
Target audience: professionals who face this problem daily
Market score: ${selectedOpp.market_score}/100

Generate a complete HTML landing page following ALL sections from the copywriter framework.
The page must have a waitlist form with email input.
Apply the designer framework for all visual decisions, specifically using the ${category} palette.

Return ONLY valid HTML. No markdown. No explanation. Just the complete HTML file starting with <!DOCTYPE html>.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            system_instruction: {
              parts: [{ text: `${COPYWRITER_SYSTEM_PROMPT}\n\n${DESIGNER_SYSTEM_PROMPT}` }]
            }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error?.message || response.statusText || "Erro desconhecido";
        throw new Error(`Falha na API do Gemini: ${errorMsg}`);
      }

      let html = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      html = html.replace(/```html/g, "").replace(/```/g, "").trim();
      
      setGeneratedHtml(html);
      
      // Save to history
      const filename = `${selectedOpp.title.toLowerCase().replace(/\s+/g, "-")}-landing-page.html`;
      
      const { error: saveError } = await supabase
        .from("landing_pages")
        .insert({
          user_id: user.id,
          opportunity_id: selectedOpp.id,
          opportunity_title: selectedOpp.title,
          category: category,
          html_content: html,
          html_filename: filename
        });

      if (saveError) {
        console.error("Save error:", saveError);
        // We still show the HTML to the user even if save fails (maybe table doesn't exist)
      } else {
        toast.success("Landing page salva com sucesso!");
        loadHistory();
      }

    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao gerar landing page: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("landing_pages").delete().eq("id", id);
      if (error) throw error;
      setSavedHistory(prev => prev.filter(p => p.id !== id));
      toast.success("Landing page excluída.");
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    }
  };

  const handleDownload = (html: string, filename: string) => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (html: string) => {
    navigator.clipboard.writeText(html);
    toast.success("HTML copiado!");
  };

  const getCategoryStyle = (cat: string) => CATEGORY_STYLES[cat] || CATEGORY_STYLES.tech;

  const radarOpportunities = (opportunities || []).filter((o: any) => !!o.detected_problem_id);
  const patternOpportunities = (opportunities || []).filter((o: any) => !!o.source_pattern_id);
  
  const filteredOpps = (opportunities || []).filter((o: any) => {
    if (radarOpportunities.length > 0 || patternOpportunities.length > 0) {
      return !!o.detected_problem_id || !!o.source_pattern_id;
    }
    return true;
  });

  return (
    <div className="space-y-12 max-w-7xl pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Layout className="h-8 w-8 text-primary" />
          Gerador de Landing Pages PRO
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Crie páginas de alta conversão usando frameworks de elite (Hormozi, Ogilvy, Schwartz) e design direcionado por nicho.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Sidebar: Selection */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" />
              1. Escolher Oportunidade
            </h2>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {loadingOpps ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  Carregando...
                </div>
              ) : filteredOpps.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                  Nenhuma oportunidade real gerada via Radar ou Padrões ainda.
                </div>
              ) : (
                filteredOpps.map((opp) => (
                  <button
                    key={opp.id}
                    onClick={() => setSelectedOppId(opp.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedOppId === opp.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border bg-transparent hover:bg-secondary/40"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <span className="font-bold text-xs truncate">{opp.title}</span>
                      <Badge variant="secondary" className="text-[9px] shrink-0">{opp.market_score}%</Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      {opp.detected_problem_id ? (
                        <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-emerald-500/20 text-emerald-500 font-bold uppercase py-0 leading-none">Radar</Badge>
                      ) : opp.source_pattern_id ? (
                        <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-blue-500/20 text-blue-500 font-bold uppercase py-0 leading-none">Padrão</Badge>
                      ) : null}
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{opp.problem}</p>
                  </button>
                ))
              )}
            </div>

            <Button 
              className="w-full h-12 gap-2 font-bold shadow-lg shadow-primary/20"
              disabled={!selectedOppId || generating}
              onClick={handleGenerate}
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Processando Masterclass...</>
              ) : (
                <><Zap className="h-4 w-4 fill-current" /> Gerar Landing Page de Elite</>
              )}
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-secondary/20 p-5 space-y-4">
             <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider">Metodologia Aplicada</span>
             </div>
             <div className="space-y-3">
                <div className="space-y-1">
                   <p className="text-[11px] font-bold text-foreground">Design por Nicho</p>
                   <p className="text-[10px] text-muted-foreground leading-relaxed">Cores detectadas via processamento de linguagem natural (Financeiro = Navy, Saúde = Emerald).</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[11px] font-bold text-foreground">Offer Stack (Hormozi)</p>
                   <p className="text-[10px] text-muted-foreground leading-relaxed">Escrita focada em empilhamento de valor e reversão total de risco.</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[11px] font-bold text-foreground">Headlines (Ogilvy)</p>
                   <p className="text-[10px] text-muted-foreground leading-relaxed">Títulos que vendem o benefício antes mesmo do clique.</p>
                </div>
             </div>
          </div>
        </div>

        {/* Main Content: Preview */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
             <h2 className="text-sm font-bold flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                2. Visualização em Tempo Real
             </h2>
             
             {generatedHtml && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleCopy(generatedHtml)} className="gap-2 h-8 text-[11px]">
                     <Copy className="h-3.5 w-3.5" /> Copiar Código
                  </Button>
                  <Button variant="default" size="sm" 
                    onClick={() => handleDownload(generatedHtml, `${selectedOpp?.title?.toLowerCase().replace(/\s+/g, "-") || "landing"}.html`)} 
                    className="gap-2 h-8 text-[11px]"
                  >
                     <Download className="h-3.5 w-3.5" /> Salvar Arquivo
                  </Button>
                </div>
             )}
          </div>

          <div className="relative rounded-xl border border-border bg-card overflow-hidden min-h-[600px] shadow-sm flex flex-col">
            {generating ? (
               <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-md flex items-center justify-center flex-col gap-5 text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center relative">
                    <Zap className="h-10 w-10 text-primary animate-pulse" />
                    <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg">Invocando Mentes Brilhantes...</h3>
                    <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                      <span>Hormozi</span>
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                      <span>Ogilvy</span>
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                      <span>Schwartz</span>
                    </div>
                  </div>
               </div>
            ) : null}

            {!generatedHtml && !generating ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-secondary/50 flex items-center justify-center">
                    <Layout className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <h3 className="font-semibold text-muted-foreground">O laboratório está pronto</h3>
                    <p className="text-xs text-muted-foreground/60 leading-relaxed">
                      Selecione uma oportunidade para ver a mágica do copywriting de elite acontecer.
                    </p>
                  </div>
               </div>
            ) : (
               <iframe 
                  title="Landing Page Preview"
                  srcDoc={generatedHtml || ""}
                  className="w-full flex-1 border-none bg-white"
                  sandbox="allow-scripts"
               />
            )}
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="space-y-6 pt-8 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <History className="h-5 w-5 text-primary" />
             </div>
             <div>
                <h2 className="text-xl font-bold">Suas Landing Pages</h2>
                <p className="text-xs text-muted-foreground">Histórico de páginas geradas e salvas</p>
             </div>
          </div>
          <Badge variant="outline" className="font-mono text-[10px] opacity-70">
            {savedHistory.length} Página(s)
          </Badge>
        </div>

        {loadingHistory ? (
           <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 rounded-xl bg-card border border-border animate-pulse" />
              ))}
           </div>
        ) : savedHistory.length === 0 ? (
           <div className="py-20 text-center rounded-2xl border border-dashed border-border bg-card/30">
              <History className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma landing page salva ainda.</p>
           </div>
        ) : (
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
             {savedHistory.map((page) => {
               const style = getCategoryStyle(page.category);
               return (
                 <motion.div 
                   layout
                   key={page.id} 
                   className="group relative rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-all shadow-sm hover:shadow-md h-full flex flex-col"
                 >
                   <div className="flex justify-between items-start mb-3">
                      <Badge className={`${style.bg} ${style.text} ${style.border} text-[9px] uppercase tracking-tighter`}>
                        {style.label}
                      </Badge>
                      <button 
                        onClick={() => handleDelete(page.id)}
                        className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                   </div>
                   
                   <h3 className="font-bold text-sm mb-1 line-clamp-1">{page.opportunity_title}</h3>
                   
                   <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-6">
                      <Calendar className="h-3 w-3" />
                      {new Date(page.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                   </div>

                   <div className="mt-auto flex gap-2 pt-2">
                     <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex-1 h-8 text-[11px] font-bold"
                        onClick={() => {
                          setGeneratedHtml(page.html_content);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          toast.info("Carregando visualização...");
                        }}
                     >
                        Visualizar
                     </Button>
                     <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-2"
                        onClick={() => handleDownload(page.html_content, page.html_filename)}
                     >
                        <Download className="h-3.5 w-3.5" />
                     </Button>
                   </div>
                 </motion.div>
               );
             })}
           </div>
        )}
      </div>
    </div>
  );
}
