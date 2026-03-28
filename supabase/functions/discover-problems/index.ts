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
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Sessão inválida");

    const body = await req.json().catch(() => ({}));
    const nicheFilter = body.niche || null;
    const count = body.count || 8;

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
      console.log(`Cache hit para executionId: ${executionId}`);
      return new Response(JSON.stringify({ success: true, cached: true, data: cached }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 4. AG-UI Start Event ──────────────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "RUN_STARTED",
      detail: "Iniciando descoberta de problemas via Gemini Proxy",
      user_id: user.id,
      level: "info",
    });

    // ── 5. Prepare AI Prompt ──────────────────────────────────────────────
    const today = new Date().toISOString().slice(0, 10);
    const nicheInstruction = nicheFilter
      ? `Focus specifically on the "${nicheFilter}" niche/industry.`
      : `Cover diverse niches: healthcare, e-commerce, finance, legal, real estate, HR, education, logistics, technology, marketing, productivity.`;

    const system_instruction = {
      parts: [{
        text: `You are an advanced market research AI that monitors internet communities to detect real user pain points. 
You simulate realistic data as if scraped from Reddit, Hacker News, Product Hunt, GitHub Issues, YouTube comments, and tech forums. 
Focus on problems that cause: loss of time, loss of money, operational frustration, or repeated complaints. 
Always respond in JSON format following the requested structure. 
All text must be in Portuguese (Brazil).`
      }]
    };

    const prompt = `Generate ${count} realistic, high-impact user problems detected from internet discussions as of ${today}.

${nicheInstruction}

Return a JSON object with a "problems" array. Each problem must have:
- problem_title: Clear title in PT-BR
- problem_description: Detailed description in PT-BR
- complaint_examples: Array of 2-3 realistic forum-style complaints in PT-BR
- source_platform: One of ["Reddit", "Hacker News", "Product Hunt", "GitHub Issues", "YouTube", "Fóruns Tech"]
- niche_category: Industry niche in PT-BR
- impact_level: One of ["Baixo", "Médio", "Alto", "Crítico"]
- timing_status: One of ["Emergente", "Crescendo", "Saturado"]
- frequency_score: 0-100
- urgency_score: 0-100
- related_tools: Array of tool names`;

    // ── 6. Call Gemini Proxy ──────────────────────────────────────────────
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
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });

    if (!proxyRes.ok) {
      const errorData = await proxyRes.json();
      throw new Error(`Proxy error: ${errorData.error || "Erro desconhecido"}`);
    }

    const proxyData = await proxyRes.json();
    const aiText = proxyData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiText) throw new Error("Proxy não retornou conteúdo da IA");

    let parsedResult;
    try {
      parsedResult = JSON.parse(aiText);
    } catch (e) {
      console.error("Erro ao fazer parse do JSON do Gemini:", aiText);
      throw new Error("Resposta da IA não é um JSON válido");
    }

    const problems = parsedResult.problems || [];
    if (problems.length === 0) throw new Error("Nenhum problema retornado pela IA");

    // ── 7. Save to Database ───────────────────────────────────────────────
    const rows = problems.map((p: any) => ({
      user_id: user.id,
      problem_title: (p.problem_title || "Sem título").trim(),
      problem_description: p.problem_description?.trim() ?? null,
      source_platform: p.source_platform?.trim() ?? null,
      niche_category: p.niche_category?.trim() ?? null,
      nichos: p.niche_category?.trim() ?? null,
      impact_level: p.impact_level || "Médio",
      timing_status: p.timing_status || "Emergente",
      complaint_examples: p.complaint_examples || [],
      related_tools: p.related_tools || [],
      frequency_score: Math.min(100, Math.max(0, p.frequency_score || 0)),
      urgency_score: Math.min(100, Math.max(0, p.urgency_score || 0)),
      viral_score: Math.min(200, Math.max(0, (p.frequency_score || 0) + (p.urgency_score || 0))),
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("detected_problems")
      .insert(rows)
      .select("id");

    if (insertError) throw insertError;

    // ── 8. Log Event (AG-UI) ─────────────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "STATE_DELTA",
      detail: `Sucesso: ${inserted.length} novos problemas descobertos e salvos.`,
      user_id: user.id,
      level: "info",
    });

    // ── 9. Salvar resultado no pipeline_cache ─────────────────────────────
    await supabase.from("pipeline_cache").insert({
      execution_id: executionId,
      status: "completed",
      detected_problem_id: inserted[0]?.id ?? null,
      content_ideas: rows,
    });

    // ── 10. Return Response ──────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        problems_discovered: inserted.length,
        problems: rows,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (err: any) {
    console.error("discover-problems error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
