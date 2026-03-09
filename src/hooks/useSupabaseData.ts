import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useOpportunities() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["opportunities", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("opportunities").select("*").order("market_score", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useTrends() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["trends", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("trends").select("*").order("growth_score", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useNiches() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["niches", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("niches").select("*").order("demand_score", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useTools() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tools", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("tools").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAgents() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["agents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useDetectedProblems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["detected_problems", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("detected_problems")
        .select("*")
        .order("urgency_score", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAgentLogs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["agent_logs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 5000, // poll every 5s for near-realtime
  });
}
