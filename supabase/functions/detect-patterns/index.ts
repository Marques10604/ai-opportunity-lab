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

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Sessão inválida");

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
      detail: "Iniciando detecção de padrões entre problemas",
      user_id: user.id,
      level: "info",
    });

    // ── 5. Fetch Data ─────────────────────────────────────────────────────
    const { data: problems, error: probError } = await supabase
      .from("detected_problems")
      .select("id, problem_title, problem_description, source_platform, frequency_score, urgency_score, viral_score")
      .order("created_at", { ascending: false })
      .limit(50);

    if (probError) throw probError;

    if (!problems?.length || problems.length < 3) {
      return new Response(JSON.stringify({ error: "Mínimo de 3 problemas necessários para detectar padrões." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const problemsSummary = problems.map((p, i) => `${i + 1}. "${p.problem_title}" — ${p.problem_description || "sem descrição"} (viral: ${p.viral_score || 0})`).join("\n");

    // ── 6. Call Gemini Proxy ──────────────────────────────────────────────
    const system_instruction = {
      parts: [{
        text: `You are a data analyst that identifies recurring patterns in user complaints. 
Group similar problems into patterns. 
Always respond in JSON format. 
Use Portuguese (Brazil) for all text.`
      }]
    };

    const prompt = `Analyze these ${problems.length} user problems and identify 3–6 recurring patterns (groups of similar problems):

${problemsSummary}

Return a JSON object with a "patterns" array. Each pattern must have:
- pattern_title: Title of the pattern in PT-BR
- pattern_description: Detailed description in PT-BR
- related_problem_indices: Array of 1-based indices of problems belonging to this pattern`;

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

    const patterns = parsedResult.patterns || [];
    if (patterns.length === 0) throw new Error("Nenhum padrão detectado pela IA");

    // ── 7. Process & Save Results ─────────────────────────────────────────
    const rows = patterns.map((p: any) => {
      const indices = (p.related_problem_indices || []).map((i: number) => i - 1);
      const relatedProblems = indices
        .filter((i: number) => i >= 0 && i < problems.length)
        .map((i: number) => ({
          id: problems[i].id,
          title: problems[i].problem_title,
          viral_score: problems[i].viral_score || 0,
        }));

      const totalOccurrences = relatedProblems.length;
      const avgViral = totalOccurrences > 0
        ? Math.round(relatedProblems.reduce((sum: number, rp: any) => sum + rp.viral_score, 0) / totalOccurrences)
        : 0;

      return {
        user_id: user.id,
        pattern_title: p.pattern_title,
        pattern_description: p.pattern_description,
        related_problems: relatedProblems,
        total_occurrences: totalOccurrences,
        average_viral_score: avgViral,
      };
    });

    const { data: inserted, error: insertError } = await supabase
      .from("problem_patterns")
      .insert(rows)
      .select();

    if (insertError) throw insertError;

    // ── 8. Log Event (AG-UI) ─────────────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "STATE_DELTA",
      detail: `Sucesso: ${inserted.length} padrões identificados e salvos.`,
      user_id: user.id,
      level: "info",
    });

    // ── 9. Pipeline Cache Persistence ────────────────────────────────────
    await supabase.from("pipeline_cache").insert({
      execution_id: executionId,
      status: "completed",
      combinations: inserted, // Usando combinations como placeholder para padrões no cache
    });

    // ── 10. Return Response ──────────────────────────────────────────────
    return new Response(JSON.stringify({ success: true, patterns: inserted }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("detect-patterns error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
