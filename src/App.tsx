import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SelectedProblemProvider } from "@/contexts/SelectedProblemContext";
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
import LandingPageGenerator from "./pages/LandingPageGenerator";
import TechnicalBlueprint from "./pages/TechnicalBlueprint";
import SavedPlans from "@/pages/SavedPlans";
import Pipeline from "@/pages/Pipeline";
import AgentMonitor from "@/pages/AgentMonitor";
import ToolDiscovery from "@/pages/ToolDiscovery";
import ToolCombinations from "@/pages/ToolCombinations";
import GeneratedSolutions from "@/pages/GeneratedSolutions";
import OpportunityRadar from "@/pages/OpportunityRadar";
import ContentIdeas from "@/pages/ContentIdeas";
import VideoScripts from "@/pages/VideoScripts";
import PlatformContent from "@/pages/PlatformContent";
import Motor5Angulos from "@/pages/Motor5Angulos";
import ProjectSetup from "@/pages/ProjectSetup";
import RadarDores from "@/pages/RadarDores";
import CalendarioConteudo from "@/pages/CalendarioConteudo";
import MonitorLancamentos from "@/pages/MonitorLancamentos";
import HowToUse from "@/pages/HowToUse";
import NotFound from "./pages/NotFound";
import WeeklyCalendar from "@/pages/WeeklyCalendar";
import { useDataCleanup } from "@/hooks/useDataCleanup";

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

    {/* Descoberta de Problemas & Radar */}
    <Route path="/radar" element={<P><OpportunityRadar /></P>} />
    
    <Route path="/discovery/trends" element={<P><Trends /></P>} />
    <Route path="/discovery/detected" element={<P><Problems /></P>} />
    <Route path="/discovery/detected/:id" element={<P><ProblemDetail /></P>} />
    <Route path="/discovery/patterns" element={<P><Patterns /></P>} />
    <Route path="/discovery/window" element={<P><OpportunityWindow /></P>} />

    {/* Inteligência de Nichos */}
    <Route path="/niches/detected" element={<P><PlaceholderPage title="Nichos Detectados" description="Motor universal de nichos detectados em múltiplas indústrias." /></P>} />
    <Route path="/niches/pains" element={<P><PlaceholderPage title="Dores por Nicho" description="Problemas agrupados por nicho de mercado." /></P>} />
    <Route path="/niches/tools" element={<P><PlaceholderPage title="Ferramentas por Nicho" description="Ferramentas mapeadas por nicho de atuação." /></P>} />

    {/* Conteúdo para Redes Sociais */}
    <Route path="/content/ideas" element={<P><ContentIdeas /></P>} />
    <Route path="/content/scripts" element={<P><VideoScripts /></P>} />
    <Route path="/content/angles" element={<P><Motor5Angulos /></P>} />
    <Route path="/content/platforms" element={<P><PlatformContent /></P>} />
    <Route path="/content/calendar" element={<P><WeeklyCalendar /></P>} />

    {/* Inteligência de Conteúdo */}
    <Route path="/intelligence/metrics" element={<P><PlaceholderPage title="Métricas de Posts" description="Acompanhamento de views, likes, comentários, compartilhamentos e salvamentos." /></P>} />
    <Route path="/intelligence/viral" element={<P><PlaceholderPage title="Conteúdos que Viralizaram" description="Análise dos conteúdos com melhor performance." /></P>} />
    <Route path="/intelligence/learning" element={<P><PlaceholderPage title="Aprendizado do Sistema" description="Loop de aprendizado que melhora a geração de conteúdo com base em métricas." /></P>} />

    {/* Análise de Ferramentas */}
    <Route path="/tools/combinations" element={<P><ToolCombinations /></P>} />
    <Route path="/tools/solutions" element={<P><GeneratedSolutions /></P>} />
    <Route path="/tools/popular" element={<P><PlaceholderPage title="Ferramentas Populares" description="Mapeamento das ferramentas mais utilizadas no mercado." /></P>} />
    <Route path="/tools/reviews" element={<P><PlaceholderPage title="Reviews Negativas" description="Análise de reviews negativas para descobrir fraquezas de ferramentas." /></P>} />
    <Route path="/tools/failures" element={<P><PlaceholderPage title="Falhas Detectadas" description="Falhas identificadas em ferramentas populares." /></P>} />
    <Route path="/tools/failure-content" element={<P><PlaceholderPage title="Conteúdos de Falhas" description="Oportunidades de conteúdo baseadas em falhas de ferramentas." /></P>} />

    {/* Laboratório SaaS */}
    <Route path="/saas/opportunities" element={<P><Opportunities /></P>} />
    <Route path="/saas/opportunities/:id" element={<P><OpportunityDetail /></P>} />
    <Route path="/saas/landing" element={<P><LandingPageGenerator /></P>} />
    <Route path="/saas/blueprint" element={<P><TechnicalBlueprint /></P>} />

    {/* Ecossistema Anthropic */}
    <Route path="/project-setup" element={<P><ProjectSetup /></P>} />
    <Route path="/monitor-lancamentos" element={<P><MonitorLancamentos /></P>} />
    <Route path="/anthropic/radar" element={<P><RadarDores /></P>} />
    <Route path="/calendario" element={<P><CalendarioConteudo /></P>} />

    {/* Outros */}
    <Route path="/apis" element={<P><PlaceholderPage title="APIs Conectadas" description="Status de conexão, limites de uso e configuração de todas as APIs do sistema." /></P>} />
    <Route path="/how-to-use" element={<P><HowToUse /></P>} />

    {/* Legacy redirects */}
    <Route path="/pipeline" element={<Navigate to="/" replace />} />
    <Route path="/agents" element={<Navigate to="/" replace />} />
    <Route path="/discovery/hunter" element={<Navigate to="/radar" replace />} />
    <Route path="/tools/discovery" element={<Navigate to="/radar" replace />} />
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

const App = () => {
  useDataCleanup();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SelectedProblemProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </SelectedProblemProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
