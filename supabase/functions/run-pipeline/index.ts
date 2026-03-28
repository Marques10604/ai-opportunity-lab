import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-execution-id",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const authHeader = req.headers.get("Authorization");
  const executionId = req.headers.get("x-execution-id") ?? crypto.randomUUID();

  // Escopo compartilhado para o catch
  let user: any = null;
  let problem_ids: string[] = [];

  try {
    // ── 1. Auth & Essentials ──────────────────────────────────────────────
    if (!authHeader) throw new Error("Não autenticado");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: authedUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authedUser) throw new Error("Sessão inválida");
    user = authedUser;

    const body = await req.json().catch(() => ({}));
    problem_ids = body.problem_ids || [];
    const niches = body.niches || ["SaaS", "AI"];
    const category = body.category;

    // ── 2. Cache Check ────────────────────────────────────────────────────
    const { data: cached } = await supabase
      .from("pipeline_cache")
      .select("*")
      .eq("execution_id", executionId)
      .eq("status", "completed")
      .maybeSingle();

    if (cached) {
      console.log(`Cache hit para run-pipeline: ${executionId}`);
      return new Response(JSON.stringify({ success: true, cached: true, result: cached.opportunity || cached.tools }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 3. Start Global Event ─────────────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "RUN_STARTED",
      detail: `Iniciando Orquestração do Pipeline (Maestro). Executando 3 estágios.`,
      user_id: user.id,
      level: "info",
    });

    // Marcar problemas como 'processing'
    if (problem_ids.length > 0) {
      await supabase.from("detected_problems").update({ pipeline_status: "processing" }).in("id", problem_ids);
    }

    const internalHeaders = { "Authorization": authHeader, "Content-Type": "application/json", "x-execution-id": executionId };

    // ── 4. STEP 1: discover-problems ──────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "STEP_STARTED",
      detail: "Estágio 1/3: Expansão de dores e contexto (discover-problems)",
      user_id: user.id,
      level: "info",
    });

    const step1Res = await fetch(`${SUPABASE_URL}/functions/v1/discover-problems`, {
      method: "POST",
      headers: internalHeaders,
      body: JSON.stringify({ 
        niche: niches.join(", "),
        count: 8 
      }),
    });

    if (!step1Res.ok) throw new Error(`Falha no Estágio 1: ${step1Res.statusText}`);
    const step1Data = await step1Res.json();

    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "STATE_DELTA",
      detail: "Estágio 1 concluído: Contexto de mercado expandido.",
      user_id: user.id,
      level: "success",
    });

    // ── 5. STEP 2: detect-patterns ────────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "STEP_STARTED",
      detail: "Estágio 2/3: Detecção de padrões e correlações (detect-patterns)",
      user_id: user.id,
      level: "info",
    });

    const step2Res = await fetch(`${SUPABASE_URL}/functions/v1/detect-patterns`, {
      method: "POST",
      headers: internalHeaders,
      body: JSON.stringify({ category }),
    });

    if (!step2Res.ok) throw new Error(`Falha no Estágio 2: ${step2Res.statusText}`);
    const step2Data = await step2Res.json();

    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "STATE_DELTA",
      detail: `Estágio 2 concluído: ${step2Data.patterns?.length || 0} padrões identificados.`,
      user_id: user.id,
      level: "success"
    });

    // ── 6. STEP 3: generate-opportunities ─────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "STEP_STARTED",
      detail: "Estágio 3/3: Síntese de oportunidades de mercado (generate-opportunities)",
      user_id: user.id,
      level: "info",
    });

    const step3Res = await fetch(`${SUPABASE_URL}/functions/v1/generate-opportunities`, {
      method: "POST",
      headers: internalHeaders,
      body: JSON.stringify({ niches: niches, pattern_context: step2Data.patterns?.[0] || null }),
    });

    if (!step3Res.ok) throw new Error(`Falha no Estágio 3: ${step3Res.statusText}`);
    const step3Data = await step3Res.json();

    // ── 7. Finalize ───────────────────────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "RUN_COMPLETED",
      detail: "Pipeline de Descoberta concluído com sucesso. Ouro extraído.",
      user_id: user.id,
      level: "success",
    });

    // Marcar problemas como 'completed'
    if (problem_ids.length > 0) {
      await supabase.from("detected_problems").update({ pipeline_status: "completed" }).in("id", problem_ids);
    }

    // Salvar no cache master
    await supabase.from("pipeline_cache").insert({
      execution_id: executionId,
      status: "completed",
      opportunity: step3Data,
      tools: step2Data.patterns || [],
    });

    return new Response(JSON.stringify({ 
      success: true, 
      patterns: step2Data.patterns,
      opportunities: step3Data.opportunities
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("run-pipeline error:", err);
    
    // Rollback status se erro
    if (problem_ids && problem_ids.length > 0) {
      await supabase.from("detected_problems").update({ pipeline_status: "error" }).in("id", problem_ids);
    }

    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "STATE_DELTA",
      detail: `Erro no Pipeline: ${err.message}`,
      user_id: user?.id || null,
      level: "error",
    });

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
