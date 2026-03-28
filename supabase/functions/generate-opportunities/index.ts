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
    const { niches, trends, tools, pattern_context } = body;

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
      console.log(`Cache hit para generate-opportunities: ${executionId}`);
      return new Response(JSON.stringify({ success: true, cached: true, ...cached.opportunity }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 4. AG-UI Start Event ──────────────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "RUN_STARTED",
      detail: `Sintetizando oportunidades de mercado baseadas em tendências e padrões.`,
      user_id: user.id,
      level: "info",
    });

    // ── 5. Build AI Prompt ────────────────────────────────────────────────
    const system_instruction = {
      parts: [{
        text: `Você é uma IA de descoberta de oportunidades SaaS. 
Você analisa dados de mercado, problemas, nichos e ferramentas para gerar ideias de startups SaaS viáveis. 
Sempre retorne JSON estruturado. Use Português (Brasil).`
      }]
    };

    let prompt: string;
    if (pattern_context) {
      const { pattern_title, pattern_description, related_problems } = pattern_context;
      const problemsList = (related_problems || []).map((p: any) => `- ${p.title} (viral: ${p.viral_score})`).join("\n");
      prompt = `Com base no padrão de problema detectado abaixo, gere 3 oportunidades de SaaS direcionadas:

Padrão: ${pattern_title}
Descrição: ${pattern_description || "N/A"}
Problemas Relacionados:
${problemsList}

Para cada oportunidade, forneça:
- title: nome do produto
- niche: nicho de mercado
- problem: dor específica relacionada ao padrão (2-3 sentenças)
- solution: proposta de solução SaaS (2-3 sentenças)
- market_score: score de 1-100
- competition_level: "Low", "Medium" ou "High"
- difficulty_level: "Low", "Medium" ou "High"`;
    } else {
      prompt = `Com base na inteligência de mercado abaixo, gere 4 oportunidades únicas de SaaS:

Nichos Detectados: ${(niches || []).join(", ")}
Tendências: ${(trends || []).join(", ")}
Ferramentas Existentes: ${(tools || []).join(", ")}

Para cada oportunidade, forneça:
- title: nome do produto
- niche: nicho de mercado
- problem: dor específica (2-3 sentenças)
- solution: proposta de solução SaaS (2-3 sentenças)
- market_score: score de 1-100
- competition_level: "Low", "Medium" ou "High"
- difficulty_level: "Low", "Medium" ou "High"`;
    }

    // ── 6. Call Gemini Proxy ──────────────────────────────────────────────
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
    const opportunities = result.opportunities || [];

    // ── 7. Save to DB (Table: opportunities) ─────────────────────────────
    if (opportunities.length > 0) {
      const { error: insertError } = await supabase.from("opportunities").insert(
        opportunities.map((o: any) => ({
          user_id: user.id,
          title: o.title || "Sem título",
          problem: o.problem || null,
          solution: o.solution || null,
          niche: o.niche || null,
          market_score: Math.min(100, Math.max(0, o.market_score || 0)),
          competition_level: o.competition_level || "Medium",
          difficulty_level: o.difficulty_level || "Medium",
        }))
      );
      
      if (insertError) console.error("Error inserting opportunities:", insertError);
    }

    // ── 8. Log Final & Cache ─────────────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "STATE_DELTA",
      detail: `Sucesso: ${opportunities.length} novas oportunidades geradas e catalogadas.`,
      user_id: user.id,
      level: "info",
    });

    await supabase.from("pipeline_cache").insert({
      execution_id: executionId,
      status: "completed",
      opportunity: result, // Armazena o objeto completo com a lista
    });

    // ── 9. Return Response ──────────────────────────────────────────────
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("generate-opportunities error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
