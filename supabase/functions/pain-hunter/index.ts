import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fetch with timeout helper
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[pain-hunter] Authorization header missing or invalid");
      return new Response(JSON.stringify({ error: "Não autorizado", detail: "Header de autorização faltando ou inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("[pain-hunter] getUser auth error:", userError);
      return new Response(JSON.stringify({ error: "Sessão inválida ou expirada", details: userError }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    if (!userId) {
      console.error("[pain-hunter] userId is null or undefined after authentication check");
      return new Response(JSON.stringify({ error: "Erro crítico: userId não identificado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const niche = body.niche || "software, produtividade, automação, tecnologia";

    console.log(`[pain-hunter] START | user=${userId} | niche=${niche}`);

    // ── FONTE 1: Hacker News (com timeout de 8s) ─────────────────────────
    let hnPains: any[] = [];
    try {
      const hnRes = await fetchWithTimeout("https://hacker-news.firebaseio.com/v0/askstories.json", {}, 8000);
      const storyIds: number[] = (await hnRes.json()).slice(0, 15); // Reduzido de 30 para 15
      console.log(`[pain-hunter] HN: ${storyIds.length} stories to fetch`);

      const hnStories = await Promise.allSettled(
        storyIds.map(id =>
          fetchWithTimeout(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {}, 4000)
            .then(r => r.json())
        )
      );

      const PAIN_WORDS = [
        "alternative", "broken", "hate", "frustrat", "doesn't work",
        "missing feature", "any tool for", "how do I", "problem with",
        "impossible to", "I can't", "nobody solves", "workaround"
      ];

      hnPains = hnStories
        .filter(r => r.status === "fulfilled")
        .map((r: any) => r.value)
        .filter(s => s?.title && PAIN_WORDS.some(w => s.title.toLowerCase().includes(w)));

      console.log(`[pain-hunter] HN pains found: ${hnPains.length}`);
    } catch (err) {
      console.error("[pain-hunter] HN error (non-fatal):", err);
    }

    // ── FONTE 2: Reddit Simulado (sempre ativo como fallback) ─────────────
    const redditPosts = [
      { title: `Problemas reais de ${niche}: falta de automação end-to-end` },
      { title: `Dores latentes em ${niche}: custo de inferência incontrolável` },
      { title: `Gargalos de integração em ${niche}: context drift em multi-agent` },
      { title: `Ninguém resolve: orquestração de squads de IA sem alucinação` },
      { title: `Fórum indie: latência de cold start em edge functions com LLM` },
    ];
    console.log(`[pain-hunter] Reddit fallback: ${redditPosts.length} posts`);

    // ── FONTE 3: Gemini API ───────────────────────────────────────────────
    const rawKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY");
    console.log(`[pain-hunter] GEMINI_API_KEY present: ${!!rawKey} | length: ${rawKey?.length ?? 0}`);

    if (!rawKey) {
      return new Response(JSON.stringify({
        error: "GEMINI_API_KEY não configurada.",
        tip: "Execute: supabase secrets set GEMINI_API_KEY=sua_chave"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiKey = rawKey.trim();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

    const contextTitles = [...hnPains, ...redditPosts].map(p => p.title).slice(0, 10).join("\n- ");
    console.log(`[pain-hunter] Context titles count: ${[...hnPains, ...redditPosts].length}`);

    // IMPORTANTE: Prompt sem comentários inline no JSON schema — evita parse errors
    const promptText = `Você é um Caçador de Oportunidades de ELITE especializado em SaaS B2B.
Analise estes títulos reais de comunidades técnicas:
- ${contextTitles}

Nicho: ${niche}

Gere exatamente 15 problemas de ALTA DENSIDADE TÉCNICA em português (Brasil).
FOCO:
1. Escala de Squads de IA (Orquestração, Latência, Conflitos entre agentes)
2. Custos de Inferência (Otimização, Modelos locais, Margens de SaaS)
3. Gargalos de Integração (Context drift, Autocompact, CLI workflows)

Retorne APENAS JSON válido, sem markdown, sem comentários, exatamente neste formato:
{
  "problems": [
    {
      "problem_title": "Título técnico e impactante aqui",
      "problem_description": "Descrição detalhada do gargalo técnico e impacto no ROI",
      "source_platform": "Reddit",
      "frequency_score": 8,
      "urgency_score": 9
    }
  ]
}`;

    const payload = {
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
        maxOutputTokens: 8192,
      }
    };

    console.log("[pain-hunter] Calling Gemini API...");
    const aiResponse = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }, 55000); // 55s timeout (Edge Function limite é 60s)

    console.log(`[pain-hunter] Gemini status: ${aiResponse.status}`);

    if (!aiResponse.ok) {
      const errText = await aiResponse.text().catch(() => "Erro ilegível");
      console.error(`[pain-hunter] Gemini API error ${aiResponse.status}:`, errText);

      let parsedError: any = {};
      try { parsedError = JSON.parse(errText); } catch (_) { /* skip */ }
      const detailMsg = parsedError.error?.message || errText.substring(0, 200);

      return new Response(JSON.stringify({
        error: `Gemini ${aiResponse.status}: ${detailMsg}`,
        details: parsedError
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    console.log("[pain-hunter] Gemini raw keys:", Object.keys(aiData));

    // Extrai o texto — funciona com e sem responseMimeType: "application/json"
    const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log(`[pain-hunter] Raw text present: ${!!rawText} | preview: ${rawText?.substring(0, 100)}`);

    if (!rawText) {
      const finishReason = aiData.candidates?.[0]?.finishReason;
      console.error("[pain-hunter] Empty response. finishReason:", finishReason);
      console.error("[pain-hunter] Full aiData:", JSON.stringify(aiData).substring(0, 500));
      return new Response(JSON.stringify({
        error: `Gemini não retornou conteúdo. finishReason: ${finishReason || "desconhecido"}`,
        rawResponse: aiData
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse robusto — tenta JSON direto, depois limpa markdown se necessário
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch (_) {
      // Tenta remover blocos markdown e tentar novamente
      const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error("[pain-hunter] JSON parse failed. Raw text:", rawText.substring(0, 500));
        return new Response(JSON.stringify({
          error: "Falha ao parsear JSON do Gemini",
          rawText: rawText.substring(0, 500)
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const generatedProblems: any[] = parsed.problems || [];
    console.log(`[pain-hunter] Problems parsed: ${generatedProblems.length}`);

    if (generatedProblems.length === 0) {
      return new Response(JSON.stringify({
        error: "Gemini retornou lista de problemas vazia.",
        parsed
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = generatedProblems.map((p) => {
      const freq = Math.min(10, Math.max(1, Number(p.frequency_score) || 5)) * 10;
      const urg = Math.min(10, Math.max(1, Number(p.urgency_score) || 7)) * 10;
      return {
        user_id: userId,
        problem_title: (p.problem_title || "Sem título").trim(),
        problem_description: p.problem_description?.trim() ?? null,
        source_platform: p.source_platform?.trim() ?? "Gemini AI",
        niche_category: niche,
        frequency_score: freq,
        urgency_score: urg,
        viral_score: Math.min(200, freq + urg),
        pipeline_status: "pending",
      };
    });

    console.log(`[pain-hunter] Inserting ${rows.length} rows for user ${userId}`);

    const { data, error: dbError } = await supabase
      .from("detected_problems")
      .insert(rows)
      .select();

    if (dbError) {
      console.error("[pain-hunter] DB INSERT error:", JSON.stringify(dbError));
      return new Response(JSON.stringify({
        error: "Erro ao salvar no banco",
        code: dbError.code,
        message: dbError.message,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[pain-hunter] SUCCESS | inserted: ${data?.length ?? 0}`);

    return new Response(JSON.stringify({
      success: true,
      inserted: data?.length || 0,
      problems: data,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("[pain-hunter] UNHANDLED ERROR:", err.message, err.stack);
    return new Response(JSON.stringify({
      error: "Erro inesperado na Edge Function",
      message: err.message,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
