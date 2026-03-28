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

  const startTime = Date.now();

  try {
    // ── 1. Essentials & Service Role ─────────────────────────────────────
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client com Service Role é obrigatório para o cron job
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

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
      console.log(`Cache hit para cron executionId: ${executionId}`);
      return new Response(JSON.stringify({ success: true, cached: true, data: cached }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 4. AG-UI Start Event (user_id é null para cron) ───────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "RUN_STARTED",
      detail: "Iniciando descoberta diária global (Cron Job)",
      user_id: null,
      level: "info",
    });

    // ── 5. Fetch Active Users ─────────────────────────────────────────────
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id");

    if (profilesError) throw profilesError;

    if (!profiles?.length) {
      return new Response(JSON.stringify({ success: true, message: "Nenhum usuário encontrado" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 6. Call Gemini Proxy via Service Role ──────────────────────────────
    const system_instruction = {
      parts: [{
        text: `You are a market research analyst that identifies real user pain points from online communities. 
Always respond in JSON format. 
Use Portuguese (Brazil) for all text fields.`
      }]
    };

    const prompt = `Generate 10 realistic, specific user problems people complain about online today (${new Date().toISOString().slice(0, 10)}). 
Topics: software, productivity, automation, digital tools, online work, content creation. 
Each problem must feel like a real complaint found on Reddit, Quora, YouTube, Twitter, or Indie Hackers. 
Return a JSON object with a "problems" array. Each item must have:
- problem_title
- problem_description
- source_platform: (one of ["Reddit", "Quora", "YouTube", "Twitter", "Indie Hackers"])
- frequency_score: (1-10)
- urgency_score: (1-10)`;

    const proxyRes = await fetch(`${SUPABASE_URL}/functions/v1/gemini-proxy`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
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
      const errorData = await proxyRes.json().catch(() => ({ error: "Erro no Proxy" }));
      throw new Error(`Proxy error: ${errorData.error || "Erro desconhecido"}`);
    }

    const proxyData = await proxyRes.json();
    const aiText = proxyData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiText) throw new Error("IA não retornou conteúdo");

    let parsedResult;
    try {
      parsedResult = JSON.parse(aiText);
    } catch (e) {
      console.error("Erro ao fazer parse do JSON do Gemini:", aiText);
      throw new Error("Resposta da IA não é um JSON válido");
    }

    const problems = parsedResult.problems || [];
    if (problems.length === 0) throw new Error("Nenhum problema gerado pela IA");

    // ── 7. Insert for each user ───────────────────────────────────────────
    let totalInserted = 0;

    for (const profile of profiles) {
      const rows = problems.map((p: any) => {
        const freq = Math.min(100, Math.max(0, (p.frequency_score || 0) * 10));
        const urg = Math.min(100, Math.max(0, (p.urgency_score || 0) * 10));
        return {
          user_id: profile.user_id,
          problem_title: (p.problem_title || "Sem título").trim(),
          problem_description: p.problem_description?.trim() ?? null,
          source_platform: p.source_platform?.trim() ?? null,
          frequency_score: freq,
          urgency_score: urg,
          viral_score: freq + urg,
        };
      });

      const { data: inserted, error: insertError } = await supabase
        .from("detected_problems")
        .insert(rows)
        .select("id");

      if (insertError) {
        console.error(`Erro ao inserir para user ${profile.user_id}:`, insertError);
        continue;
      }

      totalInserted += inserted.length;
    }

    // ── 8. Log Event (Global) ────────────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "STATE_DELTA",
      detail: `Concluído: ${totalInserted} problemas distribuídos entre ${profiles.length} usuários.`,
      user_id: null,
      level: "info",
    });

    // ── 9. Pipeline Cache Persistence ────────────────────────────────────
    await supabase.from("pipeline_cache").insert({
      execution_id: executionId,
      status: "completed",
      content_ideas: problems,
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    return new Response(
      JSON.stringify({
        success: true,
        users_impacted: profiles.length,
        total_inserted: totalInserted,
        duration_seconds: parseFloat(duration),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (err: any) {
    console.error("daily-pain-discovery error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
