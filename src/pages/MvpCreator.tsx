import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Rocket, FileText, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function MvpCreator() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPlans() {
      if (!user) return;
      const { data } = await supabase
        .from("mvp_plans")
        .select("*, opportunities(title)")
        .order("created_at", { ascending: false });
      setPlans(data || []);
      setLoading(false);
    }
    fetchPlans();
  }, [user]);

  if (loading) return <div className="p-8 text-muted-foreground">Carregando planos MVP...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Planos MVP Gerados</h1>
        <p className="text-sm text-muted-foreground">Acompanhe seus planos de produto e roadmaps.</p>
      </div>

      {!plans.length ? (
        <div className="rounded-xl border border-border bg-card/50 p-12 text-center max-w-2xl mx-auto mt-12">
          <Info className="h-8 w-8 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum plano ainda</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Selecione uma oportunidade em Laboratório SaaS e clique em <strong>Gerar Plano MVP</strong> para começar.
          </p>
          <button 
            onClick={() => navigate("/saas/opportunities")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Ver Oportunidades
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/saas/opportunities/${plan.opportunity_id}`)}
              className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Plano MVP: {plan.opportunities?.title}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                    Criado em {new Date(plan.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
              <Rocket className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
