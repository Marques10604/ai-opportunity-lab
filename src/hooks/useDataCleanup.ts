import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FAKE_TITLES = [
  "Code Review com IA para Devs Solo",
  "Copiloto de IA para Suporte ao Cliente",
  "Micro-SaaS para Automação de Faturas Freelance",
  "Notas de Reunião com IA para Times Remotos",
  "Plataforma de Comunidade para Pais de Plantas"
];

export function useDataCleanup() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const cleanup = async () => {
      const hasCleaned = localStorage.getItem(`cleanup_done_${user.id}`);
      if (hasCleaned) return;

      console.log("Iniciando limpeza de dados legados...");

      try {
        // Strictly following Fix 1 & Fix 5:
        // 1. Delete specific hardcoded fake titles
        const { error: deleteFakeError } = await supabase
          .from("opportunities")
          .delete()
          .in("title", FAKE_TITLES);

        if (deleteFakeError) console.error("Erro ao deletar registros fake:", deleteFakeError);

        // 2. Delete all records that don't have a linked source (Radar or Pattern)
        // This ensures the lab stays clean and only contains valid discoveries
        const { error: deleteUnlinkedError } = await supabase
          .from("opportunities")
          .delete()
          .is("detected_problem_id", null)
          .is("source_pattern_id", null);

        if (deleteUnlinkedError) console.error("Erro ao limpar registros não vinculados:", deleteUnlinkedError);

        localStorage.setItem(`cleanup_done_${user.id}`, "true");
        console.log("Limpeza concluída.");
      } catch (err) {
        console.error("Falha na limpeza de dados:", err);
      }
    };

    cleanup();
  }, [user]);
}
