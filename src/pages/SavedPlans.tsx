import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { FileText, Trash2, Rocket, Calendar } from "lucide-react";
import { Json } from "@/integrations/supabase/types";

interface MvpPlanRow {
  id: string;
  opportunity_id: string;
  product_concept: string;
  core_features: Json;
  tech_stack: Json;
  ui_structure: Json;
  roadmap: Json;
  monetization: string;
  created_at: string;
  opportunities?: { title: string; niche: string | null } | null;
}

export default function SavedPlans() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: plans, isLoading, refetch } = useQuery({
    queryKey: ["mvp_plans", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mvp_plans")
        .select("*, opportunities(title, niche)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MvpPlanRow[];
    },
    enabled: !!user,
  });

  const handleDelete = async (id: string) => {
    await supabase.from("mvp_plans").delete().eq("id", id);
    refetch();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Planos MVP Salvos</h1>
        <p className="text-sm text-muted-foreground mt-1">Seus planos de MVP gerados e salvos para consulta</p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando planos...</div>
      ) : !plans?.length ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Você ainda não salvou nenhum plano.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Gere um plano de MVP a partir de qualquer oportunidade para começar.</p>
          <button onClick={() => <button onClick={() => navigate("/saas/opportunities")} className="mt-4 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">} className="mt-4 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            Ver Oportunidades
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan, i) => {
            const features = Array.isArray(plan.core_features) ? plan.core_features : [];
            const title = plan.opportunities?.title || "Oportunidade sem título";
            const niche = plan.opportunities?.niche || "Nicho não informado";

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1 min-w-0">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Rocket className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{niche} · {features.length} funcionalidades</p>
                      <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2">{plan.product_concept}</p>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground/50">
                        <Calendar className="h-3 w-3" />
                        {new Date(plan.created_at).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onClick={() => navigate(`/saas/opportunities/${plan.opportunity_id}`)}}
                      className="h-8 px-3 rounded-md bg-secondary text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                      Ver Oportunidade
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
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
