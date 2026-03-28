import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-execution-id",
};

const DATA_SOURCES = [
  { name: "Google Trends", type: "search_trends", description: "Search volume and interest over time" },
  { name: "Product Hunt", type: "product_launches", description: "New product launches and upvotes" },
  { name: "Crunchbase", type: "startup_directory", description: "Startup funding and growth data" },
  { name: "TechCrunch", type: "tech_news", description: "Technology news and announcements" },
  { name: "Hacker News", type: "developer_community", description: "Developer discussions and trends" },
  { name: "Reddit r/SaaS", type: "community_signals", description: "SaaS community pain points and discussions" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── 1. Auth & Essentials ──────────────────────────────────────────────
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const authHeader = req.headers.get("Authorization");
    let user_id: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      if (token === SERVICE_ROLE_KEY) {
        console.log("[ingest-trends] Autenticação via SERVICE_ROLE (Cron/Sistema)");
      } else {
        const { data: { user } } = await supabase.auth.getUser(token);
        user_id = user?.id || null;
      }
    }

    const body = await req.json().catch(() => ({}));
    
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
      console.log(`Cache hit para ingest-trends: ${executionId}`);
      return new Response(JSON.stringify({ success: true, cached: true, trends: cached.tools }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 4. AG-UI Start Event ──────────────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "RUN_STARTED",
      detail: `Iniciando coleta de tendências de mercado global. Fontes: ${DATA_SOURCES.length}`,
      user_id: user_id,
      level: "info",
    });

    // ── 5. NewsAPI Context (Vault Access) ─────────────────────────────────
    let newsContext = "";
    try {
      const { data: newsKey } = await supabase.rpc('get_decrypted_secret', { secret_name: 'NEWS_API_KEY' });
      if (newsKey) {
        const newsRes = await fetch(`https://newsapi.org/v2/everything?q="SaaS" OR "AI startup"&sortBy=popularity&pageSize=10&language=en`, {
          headers: { "X-Api-Key": newsKey }
        });
        if (newsRes.ok) {
          const newsData = await newsRes.json();
          newsContext = newsData.articles?.map((a: any) => `- [${a.source?.name}] ${a.title}`).join("\n") || "";
        }
      }
    } catch (e) {
      console.error("[ingest-trends] NewsAPI failed, proceeding with standard data:", e);
    }

    // ── 6. Call Gemini Proxy ──────────────────────────────────────────────
    const system_instruction = {
      parts: [{
        text: `Você é uma IA de inteligência de mercado especializada em detectar tendências emergentes de tecnologia. 
Sempre responda em JSON puro. Use Português (Brasil).`
      }]
    };

    const prompt = `Analise as seguintes fontes de dados simuladas:
${DATA_SOURCES.map(s => `- ${s.name}: ${s.description}`).join("\n")}

Contexto de Notícias Reais:
${newsContext || "Não disponível."}

Gere uma lista de 6 tendências tecnológicas emergentes DETECTADAS HOJE.
Para cada tendência, retorne:
- name: Nome curto da tendência
- category: Categoria (AI, SaaS, Fintech, etc.)
- growth_score: Score de crescimento 1-100
- source: Fonte que detectou isso (Ex: Product Hunt, Google Trends)

Retorne no formato JSON { "trends": [...] }`;

    const proxyRes = await fetch(`${SUPABASE_URL}/functions/v1/gemini-proxy`, {
      method: "POST",
      headers: { "Authorization": authHeader || `Bearer ${SERVICE_ROLE_KEY}`, "Content-Type": "application/json", "x-execution-id": executionId },
      body: JSON.stringify({
        prompt,
        system_instruction,
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    if (!proxyRes.ok) throw new Error("Erro ao chamar o proxy da IA");

    const proxyData = await proxyRes.json();
    const result = JSON.parse(proxyData.candidates?.[0]?.content?.parts?.[0]?.text);
    const trendsList = result.trends || [];

    // ── 7. Save to DB (Table: trends) ────────────────────────────────────
    if (trendsList.length > 0 && user_id) {
      const rows = trendsList.map((t: any) => ({
        user_id: user_id,
        name: t.name || "Tendência",
        category: t.category || "Geral",
        growth_score: Math.min(100, Math.max(0, Number(t.growth_score) || 50)),
        source: t.source || "IA",
      }));

      const { error: trendsError } = await supabase.from("trends").insert(rows);
      if (trendsError) console.error("Erro ao salvar trends:", trendsError);
    }
    // Se user_id for null (cron), salva apenas no pipeline_cache e activity

    // ── 8. Log Final & Cache ─────────────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "STATE_DELTA",
      detail: `Sucesso: ${trendsList.length} tendências coletadas e catalogadas.`,
      user_id: user_id,
      level: "info",
    });

    await supabase.from("pipeline_cache").insert({
      execution_id: executionId,
      status: "completed",
      tools: trendsList, // Salvando tendências no campo 'tools' para compatibilidade
    });

    // ── 9. Return Response ──────────────────────────────────────────────
    return new Response(JSON.stringify({ success: true, trends: trendsList }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("ingest-trends error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
