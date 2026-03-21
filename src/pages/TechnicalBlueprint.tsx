import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Code2, Info, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function TechnicalBlueprint() {
  const { user } = useAuth();
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchBlueprints() {
      if (!user) return;
      const { data } = await supabase
        .from("blueprints")
        .select("*, opportunities(title)")
        .order("created_at", { ascending: false });
      setBlueprints(data || []);
      setLoading(false);
    }
    fetchBlueprints();
  }, [user]);

  if (loading) return <div className="p-8 text-muted-foreground">Carregando blueprints técnicos...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Blueprints Técnicos</h1>
        <p className="text-sm text-muted-foreground">Arquitetura e especificações técnicas de baixo nível.</p>
      </div>

      {!blueprints.length ? (
        <div className="rounded-xl border border-border bg-card/50 p-12 text-center max-w-2xl mx-auto mt-12">
          <Info className="h-8 w-8 text-accent mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum blueprint ainda</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Selecione uma oportunidade em Laboratório SaaS e clique em <strong>Construir MVP</strong> para gerar o blueprint técnico.
          </p>
          <button 
            onClick={() => navigate("/saas/opportunities")}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
          >
            Ver Oportunidades
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blueprints.map((bp, i) => (
            <motion.div
              key={bp.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/saas/opportunities/${bp.opportunity_id}`)}
              className="group rounded-xl border border-border bg-card p-5 hover:border-accent/50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent group-hover:rotate-12 transition-transform">
                  <Code2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm line-clamp-1">{bp.opportunities?.title}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    Blueprint #{bp.id.slice(0, 4)}
                  </p>
                </div>
              </div>
              
              <div className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3 bg-secondary/30 p-3 rounded-lg border border-border/50 mb-4">
                {bp.specification}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-muted-foreground">
                  {new Date(bp.created_at).toLocaleDateString("pt-BR")}
                </span>
                <div className="flex items-center text-[10px] font-bold text-accent group-hover:translate-x-1 transition-transform">
                  ABRIR DETALHES <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
