import React, { useState, useEffect } from 'react';
import { 
  Search, ShieldAlert, Cpu, Sparkles, CheckCircle2, Loader2, 
  Terminal, Download, Copy, Check, FileCode, Zap, AlertCircle,
  Clock, TrendingUp, MessageSquare, Bookmark, Play, X, Eye, 
  ThumbsUp, ChevronDown, ChevronRight, FileText, Layers, Video, 
  PenTool, Smartphone, MonitorPlay, CalendarDays, ExternalLink, ChevronUp, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { 
  PRE_MAPPED_LAUNCHES, 
  CATEGORY_COLORS, 
  CATEGORIES, 
  PERIODS,
  Launch 
} from '@/data/launches';

export default function MonitorLancamentos() {
  const [activeTab, setActiveTab] = useState('lancamentos');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [periodFilter, setPeriodFilter] = useState('Últimos 30 dias');
  
  const [isLoading, setIsLoading] = useState(true);
  const [launches, setLaunches] = useState<Launch[]>(PRE_MAPPED_LAUNCHES);
  
  const [expandedTableId, setExpandedTableId] = useState<number | null>(null);
  const [savedLaunches, setSavedLaunches] = useState<Launch[]>([]);
  
  // Right Panel State
  const [selectedLaunch, setSelectedLaunch] = useState<Launch | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [generatingPlatform, setGeneratingPlatform] = useState<string | null>(null);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  
  // Calendar Modal State
  const [isCalModalOpen, setIsCalModalOpen] = useState(false);
  const [calDay, setCalDay] = useState('1');
  const [selectedAngle, setSelectedAngle] = useState<any | null>(null);
  
  // Timeline State
  const [showTimeline, setShowTimeline] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [categoryFilter, periodFilter]);

  const handleFilter = () => {
    setIsLoading(true);
    setTimeout(() => {
      const filtered = PRE_MAPPED_LAUNCHES.filter(l => 
        categoryFilter === 'Todos' || l.category === categoryFilter
      );
      setLaunches(filtered);
      setIsLoading(false);
    }, 800);
  };

  useEffect(() => {
    handleFilter();
  }, [categoryFilter]);

  const toggleSave = (launch: Launch) => {
    if (savedLaunches.find(s => s.id === launch.id)) {
      setSavedLaunches(prev => prev.filter(s => s.id !== launch.id));
      toast.info('Removido dos salvos.');
    } else {
      setSavedLaunches(prev => [...prev, launch]);
      toast.success('Adicionado aos salvos!');
    }
  };

  const openPanel = (launch: Launch) => {
    setSelectedLaunch(launch);
    setGeneratedScript(null);
    setGeneratingPlatform(null);
    setIsPanelOpen(true);
  };

  const generateContent = async (platform: string, angle: any) => {
    if (!selectedLaunch) return;
    setGeneratingPlatform(platform);
    setSelectedAngle(angle);
    setGeneratedScript(null);
    
    try {
      const apiKey = (import.meta as any).env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('API Key ausente.');

      const prompt = `Gere um script de ${platform} para: ${selectedLaunch.title}. Ângulo: ${angle.title}. Use o contexto do lançamento: ${selectedLaunch.changes.join(', ')}.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) throw new Error('Falha na API.');
      const data = await response.json();
      setGeneratedScript(data.content[0].text);
      toast.success('Script gerado!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar.');
    } finally {
      setGeneratingPlatform(null);
    }
  };

  const addToCalendar = async () => {
    if (!selectedLaunch || !generatedScript) return;
    try {
      const { error } = await supabase.from('calendario_conteudo').insert({
        user_id: 'default_user',
        dia: parseInt(calDay),
        data_publicacao: new Date().toISOString().split('T')[0],
        dor_titulo: selectedLaunch.title,
        dor_tipo: selectedLaunch.category,
        produto: 'Anthropic Ecosystem',
        angulo: selectedAngle?.type || 'tutorial',
        plataforma: 'Social Media',
        roteiro_narracao: generatedScript,
        status: 'pendente'
      });
      if (error) throw error;
      toast.success('Adicionado ao calendário!');
      setIsCalModalOpen(false);
    } catch (err) {
      toast.error('Erro ao salvar.');
    }
  };

  const currentLaunches = activeTab === 'lancamentos' ? launches : savedLaunches;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl relative flex gap-6">
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MonitorPlay className="h-8 w-8 text-primary" />
            Monitor de Lançamentos
          </h1>
          <p className="text-muted-foreground">Novidades e atualizações do ecossistema Anthropic.</p>
        </div>

        <div className="bg-card/50 border border-border rounded-xl p-4 flex flex-col lg:flex-row justify-between gap-4 sticky top-0 z-20">
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
            {CATEGORIES.map(cat => (
              <Button 
                key={cat} 
                variant={categoryFilter === cat ? 'default' : 'secondary'}
                size="sm"
                className="text-xs h-8"
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
          <RadioGroup value={periodFilter} onValueChange={setPeriodFilter} className="flex gap-4 items-center">
            {PERIODS.map(p => (
              <div key={p} className="flex items-center space-x-2">
                <RadioGroupItem value={p} id={p} />
                <label htmlFor={p} className="text-xs cursor-pointer">{p}</label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex gap-2 bg-secondary/20 p-1 rounded-lg w-fit">
          <Button 
            variant={activeTab === 'lancamentos' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setActiveTab('lancamentos')}
          >
            Lançamentos
          </Button>
          <Button 
            variant={activeTab === 'salvos' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setActiveTab('salvos')}
          >
            Salvos ({savedLaunches.length})
          </Button>
        </div>

        <div className="grid gap-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <div key={i} className="h-48 bg-card/50 animate-pulse rounded-xl border border-border" />)
          ) : currentLaunches.map(launch => (
            <Card key={launch.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row justify-between items-start">
                <div className="space-y-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[launch.category]}`}>
                    {launch.category}
                  </span>
                  <CardTitle className="text-xl pt-2">{launch.title}</CardTitle>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{launch.time_ago}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-bold mb-2">Mudanças Principais</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {launch.changes.map((c, idx) => <li key={idx}>• {c}</li>)}
                    </ul>
                  </div>
                  <div className="bg-secondary/10 p-4 rounded-lg">
                    <h4 className="text-sm font-bold mb-2">Comparativo</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {launch.vs_competitors.map((c, idx) => <li key={idx}>• {c}</li>)}
                    </ul>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => openPanel(launch)}>
                    <Zap className="h-4 w-4 mr-2" /> Gerar Conteúdo
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleSave(launch)}>
                    <Bookmark className={`h-4 w-4 mr-2 ${savedLaunches.find(s => s.id === launch.id) ? 'fill-current' : ''}`} /> 
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {showTimeline && (
        <div className="w-64 hidden xl:block sticky top-24 h-fit">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Linha do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {PRE_MAPPED_LAUNCHES.map(l => (
                  <div key={l.id} className="border-l-2 border-primary/20 pl-4 py-1">
                    <p className="text-xs font-bold leading-tight">{l.title}</p>
                    <p className="text-[10px] text-muted-foreground">{l.time_ago}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <AnimatePresence>
        {isPanelOpen && selectedLaunch && (
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }}
            className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-card border-l border-border z-50 flex flex-col shadow-2xl"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h2 className="font-bold">Gerar Conteúdo</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsPanelOpen(false)}><X className="h-4 w-4" /></Button>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {selectedLaunch.content_angles.map((angle, i) => (
                  <Card key={i} className="p-4 space-y-4">
                    <p className="text-sm font-bold">{angle.title}</p>
                    <div className="flex flex-wrap gap-2">
                      {['Reels', 'LinkedIn', 'X'].map(platform => (
                        <Button 
                          key={platform} 
                          size="sm" 
                          variant="secondary"
                          className="text-[10px]"
                          onClick={() => generateContent(platform, angle)}
                          disabled={!!generatingPlatform}
                        >
                          {generatingPlatform === platform ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                          {platform}
                        </Button>
                      ))}
                    </div>
                  </Card>
                ))}

                {generatedScript && (
                  <Card className="p-4 bg-black/90 text-white font-mono text-xs">
                    <pre className="whitespace-pre-wrap">{generatedScript}</pre>
                    <div className="mt-4 flex gap-2">
                       <Button size="sm" variant="default" className="w-full" onClick={() => setIsCalModalOpen(true)}>
                         Adicionar ao Calendário
                       </Button>
                    </div>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={isCalModalOpen} onOpenChange={setIsCalModalOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>Agendar Conteúdo</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold">Dia (1-15)</label>
              <Input type="number" min="1" max="15" value={calDay} onChange={(e) => setCalDay(e.target.value)} />
            </div>
            <Button className="w-full" onClick={addToCalendar}>Confirmar Agendamento</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
