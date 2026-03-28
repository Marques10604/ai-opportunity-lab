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
    const { problem_id, problem_title, problem_description } = body;

    if (!problem_title) throw new Error("problem_title é obrigatório");

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
      console.log(`Cache hit para generate-content-idea: ${executionId}`);
      return new Response(JSON.stringify({ success: true, cached: true, ...cached }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 4. AG-UI Start Event ──────────────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "RUN_STARTED",
      detail: `Gerando estratégia de conteúdo para: ${problem_title}`,
      user_id: user.id,
      level: "info",
    });

    // ── 5. Call Gemini Proxy ──────────────────────────────────────────────
    const system_instruction = {
      parts: [{
        text: `Você é um estrategista de conteúdo para redes sociais (TikTok, Instagram, Reels). 
Sua missão é criar ideias de conteúdo virais baseadas em problemas reais de usuários. 
Sempre responda em JSON puro usando a estrutura solicitada. 
Use Português (Brasil).`
      }]
    };

    const prompt = `Gere uma estratégia de conteúdo baseada neste problema:
Título: ${problem_title}
Descrição: ${problem_description || "N/A"}

O conteúdo deve abordar a dor e atrair o público que sofre com isso.
Retorne um JSON com:
- content_title: Título chamativo
- content_hook: Hook de abertura (1-2 frases)
- content_type: "vídeo curto", "carrossel" ou "thread"
- video_script: { hook, problem, insight, cta }
- carousel: { carousel_title, slide_1_hook, slide_2_problem, slide_3_explanation, slide_4_tip_or_solution, slide_5_call_to_action }`;

    const proxyRes = await fetch(`${SUPABASE_URL}/functions/v1/gemini-proxy`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "x-execution-id": executionId,
      },
      body: JSON.stringify({
        prompt,
        system_instruction,
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    if (!proxyRes.ok) throw new Error("Erro ao chamar gemini-proxy");

    const proxyData = await proxyRes.json();
    const aiText = proxyData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) throw new Error("IA não retornou conteúdo");

    const result = JSON.parse(aiText);

    // ── 6. Save to DB (Table: content_opportunities) ─────────────────────
    const { error: insertError } = await supabase
      .from("content_opportunities")
      .insert({
        user_id: user.id,
        source_problem_id: problem_id || null,
        titulo_conteudo: result.content_title,
        gancho: result.content_hook,
        tipo_conteudo: result.content_type,
        roteiro_curto: JSON.stringify(result.video_script),
        slides_carrossel: result.carousel ? [result.carousel] : [],
        pontuacao_viral: 0,
      });

    if (insertError) console.error("Error inserting content opportunity:", insertError);

    // ── 7. Log Final & Cache ─────────────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "STATE_DELTA",
      detail: `Sucesso: Ideia de conteúdo "${result.content_title}" gerada e salva.`,
      user_id: user.id,
      level: "info",
    });

    // Salva no pipeline_cache com status 'completed' e campo content_ideas
    await supabase.from("pipeline_cache").insert({
      execution_id: executionId,
      detected_problem_id: problem_id || null,
      status: "completed",
      content_ideas: result,
    });

    // ── 8. Return Response ──────────────────────────────────────────────
    return new Response(JSON.stringify({ success: true, content_idea: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("generate-content-idea error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
