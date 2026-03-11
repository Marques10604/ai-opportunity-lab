import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import PlaceholderPage from "@/components/PlaceholderPage";
import DiscoveryHunter from "@/pages/DiscoveryHunter";
import OpportunityWindow from "@/pages/OpportunityWindow";
import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import Problems from "@/pages/Problems";
import ProblemDetail from "@/pages/ProblemDetail";
import Patterns from "@/pages/Patterns";
import Trends from "@/pages/Trends";
import ContentOpportunities from "@/pages/ContentOpportunities";
import ContentDetail from "@/pages/ContentDetail";
import Opportunities from "@/pages/Opportunities";
import OpportunityDetail from "@/pages/OpportunityDetail";
import SavedPlans from "@/pages/SavedPlans";
import Pipeline from "@/pages/Pipeline";
import AgentMonitor from "@/pages/AgentMonitor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">Carregando...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function P({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute><AppLayout>{children}</AppLayout></ProtectedRoute>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route path="/" element={<P><Dashboard /></P>} />

    {/* Descoberta de Problemas */}
    <Route path="/discovery/hunter" element={<P><DiscoveryHunter /></P>} />
    <Route path="/discovery/trends" element={<P><Trends /></P>} />
    <Route path="/discovery/detected" element={<P><Problems /></P>} />
    <Route path="/discovery/detected/:id" element={<P><ProblemDetail /></P>} />
    <Route path="/discovery/patterns" element={<P><Patterns /></P>} />
    <Route path="/discovery/window" element={<P><PlaceholderPage title="Janela de Oportunidade" description="Classificação de tendências por timing: Emergente, Crescendo, Saturado." /></P>} />

    {/* Inteligência de Nichos */}
    <Route path="/niches/detected" element={<P><PlaceholderPage title="Nichos Detectados" description="Motor universal de nichos detectados em múltiplas indústrias." /></P>} />
    <Route path="/niches/pains" element={<P><PlaceholderPage title="Dores por Nicho" description="Problemas agrupados por nicho de mercado." /></P>} />
    <Route path="/niches/tools" element={<P><PlaceholderPage title="Ferramentas por Nicho" description="Ferramentas mapeadas por nicho de atuação." /></P>} />

    {/* Conteúdo para Redes Sociais */}
    <Route path="/content/ideas" element={<P><PlaceholderPage title="Ideias de Conteúdo" description="Geração automática de ideias de conteúdo a partir de problemas detectados." /></P>} />
    <Route path="/content/scripts" element={<P><PlaceholderPage title="Roteiros de Vídeo" description="Roteiros estruturados com hook, problema, ferramentas, solução e resultado." /></P>} />
    <Route path="/content/generated" element={<P><ContentOpportunities /></P>} />
    <Route path="/content/generated/:id" element={<P><ContentDetail /></P>} />
    <Route path="/content/angles" element={<P><PlaceholderPage title="Motor de 5 Ângulos" description="1 problema → 5 ângulos: Tutorial, Polêmica, Hack, Comparativo, Transformação." /></P>} />
    <Route path="/content/platforms" element={<P><PlaceholderPage title="Conteúdo por Plataforma" description="Conteúdo otimizado para Instagram, TikTok, LinkedIn, X e YouTube Shorts." /></P>} />
    <Route path="/content/calendar" element={<P><PlaceholderPage title="Calendário de Conteúdo" description="Planejamento visual de publicações por plataforma." /></P>} />

    {/* Inteligência de Conteúdo */}
    <Route path="/intelligence/metrics" element={<P><PlaceholderPage title="Métricas de Posts" description="Acompanhamento de views, likes, comentários, compartilhamentos e salvamentos." /></P>} />
    <Route path="/intelligence/viral" element={<P><PlaceholderPage title="Conteúdos que Viralizaram" description="Análise dos conteúdos com melhor performance." /></P>} />
    <Route path="/intelligence/learning" element={<P><PlaceholderPage title="Aprendizado do Sistema" description="Loop de aprendizado que melhora a geração de conteúdo com base em métricas." /></P>} />

    {/* Análise de Ferramentas */}
    <Route path="/tools/popular" element={<P><PlaceholderPage title="Ferramentas Populares" description="Mapeamento das ferramentas mais utilizadas no mercado." /></P>} />
    <Route path="/tools/reviews" element={<P><PlaceholderPage title="Reviews Negativas" description="Análise de reviews negativas para descobrir fraquezas de ferramentas." /></P>} />
    <Route path="/tools/failures" element={<P><PlaceholderPage title="Falhas Detectadas" description="Falhas identificadas em ferramentas populares." /></P>} />
    <Route path="/tools/failure-content" element={<P><PlaceholderPage title="Conteúdos de Falhas" description="Oportunidades de conteúdo baseadas em falhas de ferramentas." /></P>} />

    {/* Laboratório SaaS */}
    <Route path="/saas/opportunities" element={<P><Opportunities /></P>} />
    <Route path="/saas/opportunities/:id" element={<P><OpportunityDetail /></P>} />
    <Route path="/saas/ideas" element={<P><PlaceholderPage title="Ideias de Produto" description="Ideias de SaaS geradas a partir de combinações de problemas e ferramentas." /></P>} />
    <Route path="/saas/mvp" element={<P><PlaceholderPage title="Criar MVP" description="Geração de plano MVP com conceito, features, tech stack e roadmap." /></P>} />
    <Route path="/saas/blueprint" element={<P><PlaceholderPage title="Blueprint Técnico" description="Arquitetura técnica detalhada para cada oportunidade de SaaS." /></P>} />

    {/* Outros */}
    <Route path="/apis" element={<P><PlaceholderPage title="APIs Conectadas" description="Status de conexão, limites de uso e configuração de todas as APIs do sistema." /></P>} />
    <Route path="/how-to-use" element={<P><PlaceholderPage title="Como Usar o App" description="Guia completo de uso da plataforma de inteligência de oportunidades." /></P>} />

    {/* Legacy redirects */}
    <Route path="/pipeline" element={<Navigate to="/" replace />} />
    <Route path="/agents" element={<Navigate to="/" replace />} />
    <Route path="/problems" element={<Navigate to="/discovery/detected" replace />} />
    <Route path="/problems/:id" element={<Navigate to="/discovery/detected" replace />} />
    <Route path="/patterns" element={<Navigate to="/discovery/patterns" replace />} />
    <Route path="/trends" element={<Navigate to="/discovery/trends" replace />} />
    <Route path="/contents" element={<Navigate to="/content/generated" replace />} />
    <Route path="/contents/:id" element={<Navigate to="/content/generated" replace />} />
    <Route path="/opportunities" element={<Navigate to="/saas/opportunities" replace />} />
    <Route path="/opportunities/:id" element={<Navigate to="/saas/opportunities" replace />} />
    <Route path="/saved-plans" element={<Navigate to="/saas/opportunities" replace />} />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
