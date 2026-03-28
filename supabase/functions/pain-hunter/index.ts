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
    const niche = body.niche || "software, produtividade, automação";

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
      console.log(`Cache hit para pain-hunter: ${executionId}`);
      return new Response(JSON.stringify({ success: true, cached: true, problems: cached.tools }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 4. AG-UI Start Event ──────────────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "RUN_STARTED",
      detail: `Iniciando varredura profunda de dores no nicho: ${niche}`,
      user_id: user.id,
      level: "info",
    });

    // ── 5. Reddit Scraping (Vault Access) ─────────────────────────────────
    let redditContext = "";
    try {
      const { data: clientId } = await supabase.rpc('get_decrypted_secret', { secret_name: 'REDDIT_CLIENT_ID' });
      const { data: clientSecret } = await supabase.rpc('get_decrypted_secret', { secret_name: 'REDDIT_SECRET' });

      if (clientId && clientSecret) {
        console.log("[pain-hunter] Real Reddit scraping initiated...");
        const auth = btoa(`${clientId}:${clientSecret}`);
        const tokenRes = await fetch("https://www.reddit.com/api/v1/access_token", {
          method: "POST",
          headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: "grant_type=client_credentials"
        });
        
        if (tokenRes.ok) {
          const { access_token } = await tokenRes.json();
          const searchRes = await fetch(`https://oauth.reddit.com/r/all/search?q=${encodeURIComponent(niche + " problem OR frustration OR hate")}&sort=relevance&limit=10`, {
            headers: { "Authorization": `Bearer ${access_token}`, "User-Agent": "GenesisAI/1.0" }
          });
          
          if (searchRes.ok) {
            const searchData = await searchRes.ok ? await searchRes.json() : { data: { children: [] } };
            redditContext = searchData.data?.children?.map((c: any) => `- ${c.data.title}: ${c.data.selftext?.substring(0, 100)}...`).join("\n") || "";
          }
        }
      }
    } catch (e) {
      console.error("[pain-hunter] Reddit Scraping failed, falling back to AI intuition:", e);
    }

    // ── 6. Call Gemini Proxy ──────────────────────────────────────────────
    const system_instruction = {
      parts: [{
        text: `Você é um Analista de Mercado de Elite. Sua missão é identificar dores ocultas, frustrações reais e problemas técnicos em nichos específicos. 
Seja específico, técnico e use dados reais se fornecidos. 
Sempre responda em JSON puro seguindo a estrutura solicitada. 
Use Português (Brasil).`
      }]
    };

    const prompt = `Analise o nicho: "${niche}"

Contexto Real do Reddit:
${redditContext || "Nenhum dado externo disponível. Use sua intuição de mercado."}

Gere uma lista de 6-8 problemas detectados.
Para cada problema, retorne:
- problem_title: Título curto e impactante
- problem_description: Descrição detalhada da dor
- source_platform: "Reddit", "HackerNews" ou "Enquete"
- impact_level: "High", "Medium" ou "Low"
- timing_status: "Emergente", "Estagnado" ou "Crônico"
- frequency_score: 1-10
- urgency_score: 1-10
- complaint_examples: Array de 2-3 frases simulando o que os usuários dizem
- related_tools: Array de ferramentas que falham em resolver isso`;

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
    const result = JSON.parse(proxyData.candidates?.[0]?.content?.parts?.[0]?.text);
    const problemsList = result.problems || result || [];

    // ── 7. Save to DB (Table: detected_problems) ────────────────────────
    const rows = problemsList.map((p: any) => {
      const freq = Math.min(100, Math.max(0, (Number(p.frequency_score) || 5) * 10));
      const urg = Math.min(100, Math.max(0, (Number(p.urgency_score) || 5) * 10));
      return {
        user_id: user.id,
        problem_title: p.problem_title,
        problem_description: p.problem_description,
        source_platform: p.source_platform,
        niche_category: niche,
        impact_level: p.impact_level || "Medium",
        timing_status: p.timing_status || "Emergente",
        frequency_score: freq,
        urgency_score: urg,
        viral_score: freq + urg,
        complaint_examples: p.complaint_examples || [],
        related_tools: p.related_tools || [],
        pipeline_status: 'pending'
      };
    });

    const { data: inserted, error: dbError } = await supabase.from("detected_problems").insert(rows).select();

    if (dbError) {
      console.error("Erro ao salvar problemas detectados:", dbError);
      throw dbError;
    }

    // ── 8. Log Final & Cache ─────────────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "STATE_DELTA",
      detail: `Sucesso: Identificadas ${rows.length} dores latentes no nicho ${niche}.`,
      user_id: user.id,
      level: "info",
    });

    await supabase.from("pipeline_cache").insert({
      execution_id: executionId,
      status: "completed",
      tools: inserted, // Salvando problemas detectados no campo 'tools' para compatibilidade de visualização rápida
    });

    // ── 9. Return Response ──────────────────────────────────────────────
    return new Response(JSON.stringify({ success: true, problems: inserted }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("pain-hunter error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
