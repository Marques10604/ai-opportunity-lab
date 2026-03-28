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

  try {
    // ── 1. Auth & Essentials ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autenticado");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Sessão inválida");

    const body = await req.json().catch(() => ({}));
    const { 
      problem_id,
      title, 
      niche, 
      problem, 
      solution, 
      competition_level, 
      market_score 
    } = body;

    if (!title) throw new Error("Título do produto é obrigatório");

    // ── 2. EXECUTION_ID (Idempotência) ──────────────────────────────────────
    const executionId = req.headers.get("x-execution-id") ?? crypto.randomUUID();

    // ── 3. Cache Check ────────────────────────────────────────────────────
    const { data: cached } = await supabase
      .from("pipeline_cache")
      .select("*")
      .eq("execution_id", executionId)
      .eq("status", "completed")
      .maybeSingle();

    if (cached) {
      console.log(`Cache hit para generate-mvp-plan: ${executionId}`);
      return new Response(JSON.stringify({ success: true, cached: true, mvp_plan: cached.opportunity }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 4. AG-UI Start Event ──────────────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "RUN_STARTED",
      detail: `Criando planejamento de execução (MVP) para: ${title}`,
      user_id: user.id,
      level: "info",
    });

    // ── 5. Call Gemini Proxy ──────────────────────────────────────────────
    const system_instruction = {
      parts: [{
        text: `Você é um estrategista de produtos SaaS experiente. 
Sua missão é criar planos de MVP detalhados e acionáveis. 
Sempre responda em JSON puro usando a estrutura solicitada. 
Use Português (Brasil).`
      }]
    };

    const prompt = `Crie um plano de MVP detalhado para esta oportunidade:

Produto: ${title}
Nicho: ${niche}
Problema: ${problem}
Solução: ${solution}
Competição: ${competition_level}
Score de Mercado: ${market_score}/100

Retorne um JSON estruturado com:
- product_concept: Visão do produto (2-3 sentenças)
- core_features: Array de { name, description } (6 funcionalidades essenciais)
- tech_stack: Array de { name, purpose } (6 tecnologias recomendadas)
- ui_structure: Array de { page, description } (5 telas principais)
- roadmap: Array de { phase, duration, tasks (array) } (4 fases de desenvolvimento)
- monetization: Estratégia de monetização detalhada`;

    const proxyRes = await fetch(`${SUPABASE_URL}/functions/v1/gemini-proxy`, {
      method: "POST",
      headers: { "Authorization": authHeader, "Content-Type": "application/json", "x-execution-id": executionId },
      body: JSON.stringify({
        prompt,
        system_instruction,
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    if (!proxyRes.ok) throw new Error("Erro ao chamar o proxy da IA");

    const proxyData = await proxyRes.json();
    const aiText = proxyData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) throw new Error("IA não retornou conteúdo");

    const result = JSON.parse(aiText);

    // ── 6. Save to DB (Tabela persistente) ────────────────────────────────
    // Salvar no mvp_plans para persistência relacional
    const { error: mvpInsertError } = await supabase
      .from("mvp_plans")
      .insert({
        user_id: user.id,
        opportunity_id: problem_id || null,
        product_concept: result.product_concept,
        core_features: result.core_features || [],
        tech_stack: result.tech_stack || [],
        ui_structure: result.ui_structure || [],
        roadmap: result.roadmap || [],
        monetization: result.monetization || "",
      });
    if (mvpInsertError) console.error("Erro ao salvar mvp_plan:", mvpInsertError);

    // ── 7. Log Final & Cache ─────────────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "STATE_DELTA",
      detail: `Sucesso: Plano de MVP e Roadmap para "${title}" gerados.`,
      user_id: user.id,
      level: "info",
    });

    // Persistindo no cache centralizado
    await supabase.from("pipeline_cache").insert({
      execution_id: executionId,
      detected_problem_id: problem_id || null,
      status: "completed",
      opportunity: result, // MVP Plan vai no campo opportunity por padrão
    });

    // ── 7. Return Response ──────────────────────────────────────────────
    return new Response(JSON.stringify({ success: true, mvp_plan: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("generate-mvp-plan error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
