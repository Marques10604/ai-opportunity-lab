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
      opportunity_id, // ID da oportunidade vinculada
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
      console.log(`Cache hit para generate-blueprint: ${executionId}`);
      // No cache, o blueprint está no campo 'opportunity'
      return new Response(JSON.stringify({ success: true, cached: true, ...cached.opportunity }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 4. AG-UI Start Event ──────────────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "RUN_STARTED",
      detail: `Gerando Blueprint Técnico para: ${title}`,
      user_id: user.id,
      level: "info",
    });

    // ── 5. Call Gemini Proxy ──────────────────────────────────────────────
    const system_instruction = {
      parts: [{
        text: `Você é um arquiteto de software sênior e estrategista de produtos. 
Sua missão é criar Blueprints de desenvolvimento detalhados para MVPs de SaaS. 
Seja específico com nomes de tabelas, tipos de colunas e endpoints. 
Sempre responda em JSON puro usando a estrutura solicitada. 
Use Português (Brasil).`
      }]
    };

    const prompt = `Crie um blueprint completo de desenvolvimento para este produto SaaS:

Produto: ${title}
Nicho: ${niche}
Problema: ${problem}
Solução: ${solution}
Competição: ${competition_level}
Score de Mercado: ${market_score}/100

Retorne um JSON estruturado com:
- product_spec: Descrição detalhada da visão e valor
- core_features: Array de { name, description, priority (P0, P1, P2) }
- ui_structure: Array de { page, purpose, components (array) }
- database_schema: Array de { table_name, purpose, columns (array de { name, type, nullable }) }
- api_endpoints: Array de { method, path, description, request_body, response }
- architecture_notes: Array de strings com recomendações técnicas`;

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

    // ── 6. Save to DB (Table: blueprints) ────────────────────────────────
    const { error: insertError } = await supabase
      .from("blueprints")
      .insert({
        user_id: user.id,
        opportunity_id: opportunity_id || null, // FK para a oportunidade
        specification: result.product_spec,
        features: result.core_features,
        ui_structure: result.ui_structure,
        database_schema: result.database_schema,
        api_endpoints: result.api_endpoints,
        architecture_notes: result.architecture_notes,
      });

    if (insertError) console.error("Error inserting blueprint:", insertError);

    // ── 7. Log Final & Cache ─────────────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "STATE_DELTA",
      detail: `Sucesso: Blueprint arquitetural para "${title}" finalizado e salvo.`,
      user_id: user.id,
      level: "info",
    });

    // Salva no pipeline_cache com status 'completed' e campo opportunity
    await supabase.from("pipeline_cache").insert({
      execution_id: executionId,
      status: "completed",
      opportunity: result, // Blueprint vai no campo opportunity por padrão do projeto
    });

    // ── 8. Return Response ──────────────────────────────────────────────
    return new Response(JSON.stringify({ success: true, blueprint: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("generate-blueprint error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
