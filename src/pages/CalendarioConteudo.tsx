import React, { useState, useEffect } from "react";
import { 
  CalendarDays, 
  List, 
  RefreshCcw, 
  Play, 
  CheckCircle2, 
  CircleDashed,
  Copy,
  MonitorPlay,
  Mic,
  Smartphone,
  FileEdit,
  ChevronLeft,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export default function CalendarioConteudo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [isLoading, setIsLoading] = useState(true);
  const [roteiros, setRoteiros] = useState<any[]>([]);
  
  const [selectedRoteiro, setSelectedRoteiro] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notaInput, setNotaInput] = useState("");

  const fetchRoteiros = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('calendario_conteudo')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        // Find latest batch or just use all if no batch_id available
        const latestBatchId = data[0].batch_id;
        
        let filtered = data;
        if (latestBatchId) {
          filtered = data.filter(d => d.batch_id === latestBatchId);
        }
        
        // Sort by dia (if exists) then by created_at
        filtered.sort((a, b) => {
          if (a.dia && b.dia) return a.dia - b.dia;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        setRoteiros(filtered);
      } else {
        setRoteiros([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar roteiros");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRoteiros();
    }
  }, [user]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('calendario_conteudo')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setRoteiros(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      if (selectedRoteiro && selectedRoteiro.id === id) {
        setSelectedRoteiro({ ...selectedRoteiro, status: newStatus });
      }
      toast.success("Status atualizado!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedRoteiro) return;
    try {
      const { error } = await supabase
        .from('calendario_conteudo')
        .update({ notas: notaInput })
        .eq('id', selectedRoteiro.id);

      if (error) throw error;
      
      setRoteiros(prev => prev.map(r => r.id === selectedRoteiro.id ? { ...r, notas: notaInput } : r));
      toast.success("Notas salvas!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar notas");
    }
  };

  const openRoteiro = (roteiro: any) => {
    setSelectedRoteiro(roteiro);
    setNotaInput(roteiro.notas || "");
    setIsModalOpen(true);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    if (!selectedRoteiro) return;
    const currentIndex = roteiros.findIndex(r => r.id === selectedRoteiro.id);
    if (direction === 'prev' && currentIndex > 0) {
      openRoteiro(roteiros[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < roteiros.length - 1) {
      openRoteiro(roteiros[currentIndex + 1]);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'gravado': return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/20">GRAVADO</Badge>;
      case 'publicado': return <Badge className="bg-success/20 text-success border-success/30 hover:bg-success/20">PUBLICADO</Badge>;
      default: return <Badge variant="outline" className="text-muted-foreground">PENDENTE</Badge>;
    }
  };

  const getStats = () => {
    const gravados = roteiros.filter(r => r.status === 'gravado').length;
    const publicados = roteiros.filter(r => r.status === 'publicado').length;
    const pendentes = roteiros.filter(r => r.status === 'pendente').length;
    return { gravados, publicados, pendentes };
  };

  const renderNarracao = (texto: string) => {
    // [HOOK 0-3s] — highlighted in cyan
    // [FRAME 3-10s] — highlighted in yellow
    // [EXECUCAO 10-45s] — highlighted in white
    // [PAYOFF 45-55s] — highlighted in green
    // [CTA 55-60s] — highlighted in orange
    
    let formatted = texto;
    formatted = formatted.replace(/\[HOOK.*?\]/g, match => `<span class="text-cyan-400 font-bold block mt-4 mb-1">${match}</span>`);
    formatted = formatted.replace(/\[FRAME.*?\]/g, match => `<span class="text-yellow-400 font-bold block mt-4 mb-1">${match}</span>`);
    formatted = formatted.replace(/\[EXECUCAO.*?\]/g, match => `<span class="text-white font-bold block mt-4 mb-1">${match}</span>`);
    formatted = formatted.replace(/\[PAYOFF.*?\]/g, match => `<span class="text-green-400 font-bold block mt-4 mb-1">${match}</span>`);
    formatted = formatted.replace(/\[CTA.*?\]/g, match => `<span class="text-orange-400 font-bold block mt-4 mb-1">${match}</span>`);
    
    return <div className="text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const stats = getStats();

  return (
    <div className="min-h-screen pb-16">
      {/* Top Bar */}
      <div className="bg-card border-b border-border sticky top-0 z-10 w-full mb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">Calendário de Conteúdo</h1>
            </div>
            <p className="text-sm text-muted-foreground">15 roteiros prontos para gravar</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-4 text-sm bg-secondary/30 px-4 py-2 rounded-lg border border-border/50">
              <div className="flex flex-col items-center">
                <span className="font-bold text-yellow-500">{stats.gravados}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Gravados</span>
              </div>
              <div className="w-px bg-border"></div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-success">{stats.publicados}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Publicados</span>
              </div>
              <div className="w-px bg-border"></div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-foreground">{stats.pendentes}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Pendentes</span>
              </div>
            </div>
            
            <Button variant="outline" className="gap-2 shrink-0" onClick={() => navigate('/anthropic/radar')}>
              <RefreshCcw className="h-4 w-4" /> Gerar Novo Calendário
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {roteiros.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-card/20 rounded-2xl border border-dashed border-border mt-8">
            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <CalendarDays className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Nenhum calendário gerado ainda</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Gere seu calendário de 15 dias no Radar de Dores e todos os roteiros aparecerão aqui prontos para gravar.
            </p>
            <Button size="lg" className="gap-2 font-bold" onClick={() => navigate('/anthropic/radar')}>
              Ir para o Radar de Dores <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-6">
              <div className="flex bg-secondary p-1 rounded-lg">
                <Button 
                  variant={view === "calendar" ? "secondary" : "ghost"} 
                  size="sm" 
                  className={`gap-2 ${view === "calendar" ? "bg-background shadow-sm" : ""}`}
                  onClick={() => setView("calendar")}
                >
                  <CalendarDays className="h-4 w-4" /> Calendário
                </Button>
                <Button 
                  variant={view === "list" ? "secondary" : "ghost"} 
                  size="sm" 
                  className={`gap-2 ${view === "list" ? "bg-background shadow-sm" : ""}`}
                  onClick={() => setView("list")}
                >
                  <List className="h-4 w-4" /> Lista
                </Button>
              </div>
            </div>

            {view === "calendar" ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {roteiros.map((roteiro) => (
                  <Card key={roteiro.id} className="border-border bg-card/40 hover:bg-card/60 transition-colors shadow flex flex-col h-full">
                    <CardHeader className="p-4 pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                          {roteiro.dia ? `Dia ${roteiro.dia}` : 'Extra'} · {roteiro.data_publicacao ? new Date(roteiro.data_publicacao).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : new Date(roteiro.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                        </span>
                        {getStatusBadge(roteiro.status)}
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        <Badge variant="secondary" className="text-[9px] uppercase">{roteiro.plataforma}</Badge>
                        <Badge variant="outline" className="text-[9px] uppercase border-primary/30 text-primary">{roteiro.angulo}</Badge>
                      </div>
                      <h3 className="font-bold text-sm leading-tight line-clamp-2" title={roteiro.dor_titulo}>
                        {roteiro.dor_titulo}
                      </h3>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 flex-grow flex flex-col justify-end">
                      <p className="text-[11px] text-muted-foreground italic line-clamp-2 mt-2 mb-4">
                        "{roteiro.hook.replace(/\[.*?\]\s*/, '')}"
                      </p>
                      <Button variant="secondary" className="w-full gap-2 mt-auto" size="sm" onClick={() => openRoteiro(roteiro)}>
                        <FileEdit className="h-3 w-3" /> Ver Roteiro
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {roteiros.map((roteiro) => (
                  <Card key={roteiro.id} className="border-border bg-card/40 hover:bg-card/60 transition-colors flex items-center p-4 gap-6 cursor-pointer" onClick={() => openRoteiro(roteiro)}>
                    <div className="flex-shrink-0 w-24">
                      <span className="text-sm font-bold block">Dia {roteiro.dia}</span>
                      <span className="text-xs text-muted-foreground">{new Date(roteiro.data_publicacao).toLocaleDateString()}</span>
                    </div>
                    <div className="flex-shrink-0 w-28">
                      {getStatusBadge(roteiro.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-md truncate mb-1">{roteiro.dor_titulo}</h3>
                      <div className="flex gap-2">
                         <Badge variant="secondary" className="text-[10px]">{roteiro.plataforma}</Badge>
                         <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{roteiro.angulo}</Badge>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-muted-foreground hidden md:flex">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Roteiro Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl h-[90vh] bg-card border-border flex flex-col p-0 gap-0 overflow-hidden">
          {selectedRoteiro && (
            <>
              {/* Modal Header */}
              <div className="p-6 border-b border-border bg-card/50">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                       <span className="font-bold text-foreground">Dia {selectedRoteiro.dia}</span>
                       <span>·</span>
                       <span>{new Date(selectedRoteiro.data_publicacao).toLocaleDateString()}</span>
                       <span>·</span>
                       <span className="uppercase">{selectedRoteiro.plataforma}</span>
                       <span>·</span>
                       <span className="uppercase text-primary">{selectedRoteiro.angulo}</span>
                    </div>
                    <DialogTitle className="text-xl leading-tight pr-6">{selectedRoteiro.dor_titulo}</DialogTitle>
                  </div>
                  <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-lg shrink-0">
                     <Button 
                       size="sm" 
                       variant={selectedRoteiro.status === 'pendente' ? 'default' : 'ghost'} 
                       className={`h-8 px-3 text-xs ${selectedRoteiro.status === 'pendente' ? 'opacity-100' : 'opacity-60 grayscale'}`}
                       onClick={() => handleStatusChange(selectedRoteiro.id, 'pendente')}
                     >
                       <CircleDashed className="mr-1 h-3 w-3" /> Pendente
                     </Button>
                     <Button 
                       size="sm"
                       variant={selectedRoteiro.status === 'gravado' ? 'default' : 'ghost'} 
                       className={`h-8 px-3 text-xs ${selectedRoteiro.status === 'gravado' ? 'bg-yellow-500 hover:bg-yellow-600 text-white opacity-100' : 'opacity-60 grayscale'}`}
                       onClick={() => handleStatusChange(selectedRoteiro.id, 'gravado')}
                     >
                       <Play className="mr-1 h-3 w-3" /> Gravado
                     </Button>
                     <Button 
                       size="sm"
                       variant={selectedRoteiro.status === 'publicado' ? 'default' : 'ghost'} 
                       className={`h-8 px-3 text-xs ${selectedRoteiro.status === 'publicado' ? 'bg-success hover:bg-success/90 text-white opacity-100' : 'opacity-60 grayscale'}`}
                       onClick={() => handleStatusChange(selectedRoteiro.id, 'publicado')}
                     >
                       <CheckCircle2 className="mr-1 h-3 w-3" /> Publicado
                     </Button>
                  </div>
                </div>
              </div>

              {/* Modal Content - Tabs */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <Tabs defaultValue="narracao" className="w-full flex-1 flex flex-col">
                  <div className="px-6 pt-4 border-b border-border bg-card/20">
                    <TabsList className="bg-transparent h-10 p-0 shadow-none border-b-0 space-x-6">
                      <TabsTrigger value="narracao" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 gap-2">
                        <Mic className="h-4 w-4" /> 🎙️ Narração
                      </TabsTrigger>
                      <TabsTrigger value="tela" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 gap-2">
                        <MonitorPlay className="h-4 w-4" /> 🖥️ O que mostrar na tela
                      </TabsTrigger>
                      <TabsTrigger value="detalhes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 gap-2">
                        <Smartphone className="h-4 w-4" /> 📱 Detalhes do post
                      </TabsTrigger>
                      <TabsTrigger value="notas" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 gap-2">
                        <FileEdit className="h-4 w-4" /> 📝 Notas
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <ScrollArea className="flex-1 px-6 py-6 p-4">
                    <TabsContent value="narracao" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                      <div className="bg-secondary/10 border border-border/50 rounded-xl p-6 font-medium text-lg">
                        {renderNarracao(selectedRoteiro.roteiro_narracao)}
                      </div>
                      <Button variant="secondary" className="mt-6 gap-2 w-full sm:w-auto" onClick={() => copyText(selectedRoteiro.roteiro_narracao)}>
                        <Copy className="h-4 w-4" /> Copiar narração completa
                      </Button>
                    </TabsContent>

                    <TabsContent value="tela" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-4">
                      <div className="bg-card border border-border rounded-xl p-6 font-mono text-sm leading-8 whitespace-pre-wrap text-muted-foreground">
                        {selectedRoteiro.roteiro_tela}
                      </div>
                      <Button variant="secondary" className="mt-2 gap-2 w-full sm:w-auto" onClick={() => copyText(selectedRoteiro.roteiro_tela)}>
                        <Copy className="h-4 w-4" /> Copiar roteiro de tela
                      </Button>
                    </TabsContent>

                    <TabsContent value="detalhes" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hook (Primeiros 3s)</label>
                          <div className="p-4 bg-secondary/30 rounded-lg border border-border/50 text-sm relative group">
                            {selectedRoteiro.hook}
                            <Button size="icon" variant="secondary" className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyText(selectedRoteiro.hook)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chamada para Ação (CTA)</label>
                          <div className="p-4 bg-secondary/30 rounded-lg border border-border/50 text-sm relative group">
                            {selectedRoteiro.cta}
                            <Button size="icon" variant="secondary" className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyText(selectedRoteiro.cta)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Duração Estimada</label>
                        <div className="text-foreground font-medium">
                          {selectedRoteiro.duracao_estimada}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hashtags</label>
                          <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => copyText(selectedRoteiro.hashtags.join(' '))}>
                            <Copy className="h-3 w-3" /> Copiar todas
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedRoteiro.hashtags.map((tag: string, i: number) => (
                            <Badge key={i} variant="secondary" className="px-3 py-1 font-mono text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="notas" className="m-0 focus-visible:outline-none focus-visible:ring-0 h-full">
                      <div className="flex flex-col h-[400px]">
                        <label className="text-sm font-medium mb-3 text-muted-foreground">Adicione notas pessoais, links de referência ou ideias para a gravação:</label>
                        <Textarea 
                          className="flex-1 resize-none bg-card border-border/50 p-4 text-base" 
                          placeholder="Digite suas notas aqui. Elas são salvas automaticamente quando você clica fora do campo."
                          value={notaInput}
                          onChange={(e) => setNotaInput(e.target.value)}
                          onBlur={handleSaveNotes}
                        />
                      </div>
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-border bg-card/50 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateDay('prev')} disabled={roteiros.findIndex(r => r.id === selectedRoteiro.id) === 0} className="gap-1">
                    <ChevronLeft className="h-4 w-4" /> Dia anterior
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateDay('next')} disabled={roteiros.findIndex(r => r.id === selectedRoteiro.id) === roteiros.length - 1} className="gap-1">
                    Dia seguinte <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  {selectedRoteiro.status !== 'publicado' && (
                    <Button 
                      variant="outline" 
                      className="flex-1 md:flex-none border-success text-success hover:bg-success/10"
                      onClick={() => handleStatusChange(selectedRoteiro.id, 'publicado')}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Marcar como Publicado
                    </Button>
                  )}
                  {selectedRoteiro.status !== 'gravado' && (
                    <Button 
                      className="flex-1 md:flex-none bg-yellow-500 hover:bg-yellow-600 text-white"
                      onClick={() => handleStatusChange(selectedRoteiro.id, 'gravado')}
                    >
                      <Play className="h-4 w-4 mr-2" /> Marcar como Gravado
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
