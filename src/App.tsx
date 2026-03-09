import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Pipeline from "@/pages/Pipeline";
import AgentMonitor from "@/pages/AgentMonitor";
import Opportunities from "@/pages/Opportunities";
import OpportunityDetail from "@/pages/OpportunityDetail";
import Auth from "@/pages/Auth";
import SavedPlans from "@/pages/SavedPlans";
import Trends from "@/pages/Trends";
import Problems from "@/pages/Problems";
import Patterns from "@/pages/Patterns";
import ContentOpportunities from "@/pages/ContentOpportunities";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">Carregando...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
    <Route path="/pipeline" element={<ProtectedRoute><AppLayout><Pipeline /></AppLayout></ProtectedRoute>} />
    <Route path="/agents" element={<ProtectedRoute><AppLayout><AgentMonitor /></AppLayout></ProtectedRoute>} />
    <Route path="/opportunities" element={<ProtectedRoute><AppLayout><Opportunities /></AppLayout></ProtectedRoute>} />
    <Route path="/opportunities/:id" element={<ProtectedRoute><AppLayout><OpportunityDetail /></AppLayout></ProtectedRoute>} />
    <Route path="/saved-plans" element={<ProtectedRoute><AppLayout><SavedPlans /></AppLayout></ProtectedRoute>} />
    <Route path="/trends" element={<ProtectedRoute><AppLayout><Trends /></AppLayout></ProtectedRoute>} />
    <Route path="/problems" element={<ProtectedRoute><AppLayout><Problems /></AppLayout></ProtectedRoute>} />
    <Route path="/patterns" element={<ProtectedRoute><AppLayout><Patterns /></AppLayout></ProtectedRoute>} />
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
