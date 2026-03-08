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
