import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Sparkles, X, Zap } from "lucide-react";
import { pipelineSteps } from "@/lib/discoveryEngine";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type StepStatus = "pending" | "running" | "done";

export function DiscoveryEngine({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({});
  const [generatedCount, setGeneratedCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const runPipeline = useCallback(async () => {
    if (!user) return;
    setRunning(true);
    setFinished(false);
    setGeneratedCount(0);
    const statuses: Record<string, StepStatus> = {};
    pipelineSteps.forEach((s) => (statuses[s.id] = "pending"));
    setStepStatuses({ ...statuses });

    for (const step of pipelineSteps) {
      statuses[step.id] = "running";
      setStepStatuses({ ...statuses });
      await new Promise((r) => setTimeout(r, step.duration));
      statuses[step.id] = "done";
      setStepStatuses({ ...statuses });
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: funcData, error: funcError } = await supabase.functions.invoke("generate-opportunities", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: {
          niches: ["Ferramentas para Dev", "EdTech", "Saúde", "Economia Criativa", "E-commerce"],
          trends: ["Automação com IA", "Ferramentas para trabalho remoto", "Plataformas no-code", "Produtos API-first"],
          tools: ["Notion", "Slack", "Figma", "Zapier", "Stripe", "Linear", "Vercel"],
        },
      });

      if (funcError) throw funcError;
      if (funcData?.error) throw new Error(funcData.error);

      const opportunities = funcData.opportunities || [];
      if (opportunities.length === 0) throw new Error("Nenhuma oportunidade foi gerada");

      const { error: insertError } = await supabase.from("opportunities").insert(
        opportunities.map((o: any) => ({ ...o, user_id: user.id }))
      );

      if (insertError) throw insertError;

      setGeneratedCount(opportunities.length);
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    } catch (err: any) {
      console.error("Erro de descoberta:", err);
      toast.error(err?.message || "Falha ao gerar oportunidades");
    }

    setRunning(false);
    setFinished(true);
  }, [user, queryClient]);

  const handleClose = () => {
    if (running) return;
    setStepStatuses({});
    setFinished(false);
    setGeneratedCount(0);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Descobrir Oportunidades</h2>
                <p className="text-[10px] text-muted-foreground">Pipeline de oportunidades com IA</p>
              </div>
            </div>
            {!running && (
              <button onClick={handleClose} className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-secondary transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="p-5 space-y-2.5 max-h-[400px] overflow-y-auto">
            {pipelineSteps.map((step, i) => {
              const status = stepStatuses[step.id] || "pending";
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                    status === "running"
                      ? "border-primary/40 bg-primary/5"
                      : status === "done"
                      ? "border-success/30 bg-success/5"
                      : "border-border bg-secondary/30"
                  }`}
                >
                  <div className="h-7 w-7 rounded-md flex items-center justify-center shrink-0">
                    {status === "running" ? (
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    ) : status === "done" ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${status === "running" ? "text-primary" : status === "done" ? "text-success" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 font-mono">{step.agent}</p>
                  </div>
                  {status === "running" && (
                    <span className="text-[9px] font-mono text-primary/60 animate-pulse-glow">PROCESSANDO</span>
                  )}
                </motion.div>
              );
            })}

            {finished && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center mt-4"
              >
                <Sparkles className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-semibold">{generatedCount} novas oportunidades descobertas!</p>
                <p className="text-[11px] text-muted-foreground mt-1">Resultados salvos na sua área</p>
              </motion.div>
            )}
          </div>

          <div className="p-5 border-t border-border">
            {!running && !finished && (
              <button
                onClick={runPipeline}
                className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity glow-primary"
              >
                <Zap className="h-4 w-4" /> Iniciar Pipeline de Descoberta
              </button>
            )}
            {running && (
              <p className="text-center text-xs text-muted-foreground">Pipeline em execução... aguarde</p>
            )}
            {finished && (
              <button
                onClick={handleClose}
                className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                Ver Oportunidades
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
