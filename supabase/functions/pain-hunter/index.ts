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

    console.log(`[pain-hunter] START | niche=${niche}`);

    // ── MARRETADA 1: Cache Semântico (ROI) ─────────────────────────────
    const rawKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY");
    if (!rawKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY não configurada." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const geminiKey = rawKey.trim();

    // 1. Gerar Embedding do Nicho
    let nicheEmbedding: number[] = [];
    try {
       const embedRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ content: { parts: [{ text: niche }] } })
       });
       if (embedRes.ok) {
         const embedData = await embedRes.json();
         nicheEmbedding = embedData.embedding.values;
       }
    } catch (e) {
       console.error("[pain-hunter] Embedding error:", e);
    }

    // 2. Buscar no Cache com Similaridade > 0.95
    if (nicheEmbedding.length > 0) {
      const { data: cacheData, error: cacheErr } = await supabase.rpc('match_semantic_cache', {
        query_embedding: nicheEmbedding,
        match_threshold: 0.95,
        match_count: 1
      });

      if (!cacheErr && cacheData && cacheData.length > 0) {
        console.log(`[pain-hunter] ROI HIT: Cache semântico encontrado com similaridade ${cacheData[0].similarity}`);
        const cachedProblems = cacheData[0].cached_response.problems || [];
        
        // Simular inserção (ou apenas retornar do cache)
        // Para manter consistência, vamos inserir no DB de detected_problems
        const rows = cachedProblems.map((p: any) => ({
          user_id: userId,
          problem_title: p.problem_title,
          problem_description: p.problem_description,
          source_platform: p.source_platform || "Semantic Cache",
          niche_category: niche,
          frequency_score: p.frequency_score * 10,
          urgency_score: p.urgency_score * 10,
          viral_score: (p.frequency_score * 10) + (p.urgency_score * 10),
          pipeline_status: "pending",
        }));

        const { data: inserted, error: insErr } = await supabase.from("detected_problems").insert(rows).select();
        
        if (!insErr) {
          return new Response(JSON.stringify({
            success: true,
            cached: true,
            inserted: inserted?.length || 0,
            problems: inserted,
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }
    }

    // ── FONTE 1: Hacker News (com timeout de 8s) ─────────────────────────
    let hnPains: any[] = [];
    try {
      const hnRes = await fetchWithTimeout("https://hacker-news.firebaseio.com/v0/askstories.json", {}, 8000);
      const storyIds: number[] = (await hnRes.json()).slice(0, 15);
      console.log(`[pain-hunter] HN: ${storyIds.length} stories to fetch`);

      const hnStories = await Promise.allSettled(
        storyIds.map(id =>
          fetchWithTimeout(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {}, 4000)
            .then(r => r.json())
        )
      );

      const PAIN_WORDS = ["alternative", "broken", "hate", "frustrat", "doesn't work", "missing feature", "how do I", "problem with"];
      hnPains = hnStories
        .filter(r => r.status === "fulfilled")
        .map((r: any) => r.value)
        .filter(s => s?.title && PAIN_WORDS.some(w => s.title.toLowerCase().includes(w)));
    } catch (err) {
      console.error("[pain-hunter] HN error (non-fatal)");
    }

    // ── FONTE 2: Reddit Simulado ──────────────────────────────────────────
    const redditPosts = [
      { title: `Problemas reais de ${niche}: falta de automação end-to-end` },
      { title: `Dores latentes em ${niche}: custo de inferência incontrolável` },
      { title: `Gargalos de integração em ${niche}: context drift em multi-agent` },
    ];

    // ── FONTE 3: Gemini API ───────────────────────────────────────────────
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

    const contextTitles = [...hnPains, ...redditPosts].map(p => p.title).slice(0, 10).join("\n- ");
    console.log(`[pain-hunter] Context titles count: ${[...hnPains, ...redditPosts].length}`);

    // Prompt sem comentários
    const promptText = `Você é um Caçador de Oportunidades de ELITE especializado em SaaS B2B.
Analise estes títulos reais de comunidades técnicas:
- ${contextTitles}

Nicho: ${niche}

Gere exatamente 15 problemas de ALTA DENSIDADE TÉCNICA em português (Brasil).
FOCO:
1. Escala de Squads de IA (Orquestração, Latência, Conflitos entre agentes)
2. Custos de Inferência (Otimização, Modelos locais)
3. Gargalos de Integração (Context drift, CLI workflows)

Retorne APENAS JSON válido, sem markdown:
{
  "problems": [
    {
      "problem_title": "Título técnico",
      "problem_description": "Descrição detalhada",
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

    // 🔥 MARRETADA 1 (FINAL): Salvar no Cache Semântico
    if (nicheEmbedding && nicheEmbedding.length > 0) {
      supabase.from("ai_semantic_cache").insert({
        user_id: userId,
        niche_label: niche,
        query_text: niche,
        query_embedding: nicheEmbedding,
        cached_response: { problems: generatedProblems }
      }).then(() => console.log("[pain-hunter] ROI CACHED: Novo nicho salvo no cache semântico."))
        .catch(e => console.error("Erro salvar cache:", e));
    }

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
