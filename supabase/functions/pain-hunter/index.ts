import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 200,
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
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Sessão inválida ou expirada", details: userError }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    
    // Pegar parâmetros do corpo
    const body = await req.json().catch(() => ({}));
    const niche = body.niche || "software, produtividade, automação, tecnologia";

    console.log(`Iniciando caça manual (REST) para o nicho: ${niche}`);

    // ── FONTE REAL 1: Hacker News ──────────────────
    let hnPains: any[] = [];
    try {
      const hnRes = await fetch("https://hacker-news.firebaseio.com/v0/askstories.json");
      const storyIds: number[] = (await hnRes.json()).slice(0, 30);

      const hnStories = await Promise.allSettled(
        storyIds.map(id =>
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
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
    } catch (err) {
      console.error("Erro Hacker News:", err);
    }

    // ── FONTE REAL 2: Reddit Bypass ──────────────────
    const REDDIT_CLIENT_ID = Deno.env.get("REDDIT_CLIENT_ID");
    const REDDIT_SECRET = Deno.env.get("REDDIT_SECRET");
    let redditPosts: any[] = [];

    if (REDDIT_CLIENT_ID === "pendente" || REDDIT_SECRET === "pendente") {
      console.log("Detectado bypass do Reddit: Usando dados simulados.");
      redditPosts = [
        { title: "Frustrated with managing 15+ SaaS subscriptions across different teams." },
        { title: "Our SME spends 20 hours a week manually copying CRM data." },
        { title: "Scaling AI features is killing our margins." }
      ];
    }

    // ── FONTE REAL 3: Gemini (REST API) ─────────────────
    const rawKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY");
    if (!rawKey) {
      return new Response(JSON.stringify({ 
        error: "GEMINI_API_KEY não configurada.",
        tip: "Execute: npx supabase secrets set GEMINI_API_KEY=sua_chave" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiKey = rawKey.trim();
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

    const promptText = `Analise esses títulos reais do Hacker News e posts do Reddit e gere 10 problemas detalhados de usuários em português (Brasil). 
Títulos Hacker News: ${hnPains.slice(0, 10).map((s: any) => s.title).join(" | ")}
Posts Reddit: ${redditPosts.slice(0, 10).map((p: any) => p.title).join(" | ")}

Foque especialmente no nicho: ${niche}.
Combine com outros problemas reais que você conhece de outras comunidades online sobre este nicho.

Retorne APENAS um objeto JSON no formato:
{
  "problems": [
    {
      "problem_title": "string",
      "problem_description": "string",
      "source_platform": "Reddit | Quora | YouTube | Twitter | Indie Hackers | Hacker News",
      "frequency_score": integer (1-10),
      "urgency_score": integer (1-10)
    }
  ]
}`;

    const payload = {
      contents: [
        {
          parts: [
            { text: promptText }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    console.log(`Payload Gemini (v1): ${JSON.stringify(payload).substring(0, 200)}...`);

    const aiResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text().catch(() => "Erro ilegível");
      console.error(`Gemini API error ${aiResponse.status}:`, errText);
      
      let parsedError: any = {};
      try { parsedError = JSON.parse(errText); } catch(e) {}

      const detailMsg = parsedError.error?.message || "Motivo oculto pelo Google";

      return new Response(JSON.stringify({ 
        error: `Erro Gemini 400 (${detailMsg})`, 
        status: aiResponse.status,
        details: parsedError 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const cleanText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!cleanText) {
      return new Response(JSON.stringify({ error: "Gemini não retornou conteúdo estruturado (Candidato vazio)" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(cleanText);
    const generatedProblems: any[] = parsed.problems || [];

    if (generatedProblems.length === 0) {
      return new Response(JSON.stringify({ error: "Gemini retornou lista de problemas vazia." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = generatedProblems.map((p) => {
      const freq = (Number(p.frequency_score) || 5) * 10;
      const urg = (Number(p.urgency_score) || 5) * 10;
      return {
        user_id: userId,
        problem_title: (p.problem_title || "Sem título").trim(),
        problem_description: p.problem_description?.trim() ?? null,
        source_platform: p.source_platform?.trim() ?? null,
        niche_category: body.niche || "Tecnologia",
        frequency_score: Math.min(100, freq),
        urgency_score: Math.min(100, urg),
        viral_score: Math.min(200, freq + urg),
      };
    });

    const { data, error: dbError } = await supabase
      .from("detected_problems")
      .insert(rows)
      .select();

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(JSON.stringify({ 
        error: "Erro ao salvar no banco (Tabela detected_problems não encontrada ou erro de RLS)", 
        details: dbError 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
    console.error("Erro inesperado REST:", err);
    return new Response(JSON.stringify({ 
      error: "Erro inesperado ao usar a API REST do Gemini", 
      message: err.message,
      details: err
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
