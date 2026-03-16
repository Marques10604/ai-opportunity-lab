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
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // ── FONTE REAL 1: Hacker News (sem chave, sem limite) ──────────────────
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

    const hnPains = hnStories
      .filter(r => r.status === "fulfilled")
      .map((r: any) => r.value)
      .filter(s => s?.title && PAIN_WORDS.some(w => s.title.toLowerCase().includes(w)));

    // ── FONTE REAL 2: Reddit (OAuth2 Client Credentials) ──────────────────
    const REDDIT_CLIENT_ID = Deno.env.get("REDDIT_CLIENT_ID");
    const REDDIT_SECRET = Deno.env.get("REDDIT_SECRET");
    let redditPosts: any[] = [];

    if (REDDIT_CLIENT_ID && REDDIT_SECRET) {
      try {
        const authRes = await fetch("https://www.reddit.com/api/v1/access_token", {
          method: "POST",
          headers: {
            "Authorization": `Basic ${btoa(`${REDDIT_CLIENT_ID}:${REDDIT_SECRET}`)}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: "grant_type=client_credentials"
        });

        if (authRes.ok) {
          const authData = await authRes.json();
          const accessToken = authData.access_token;

          const subreddits = ["entrepreneur", "SaaS", "startups", "productivity", "nocode"].join("+");
          const query = encodeURIComponent(`"any alternative" OR "doesn't work" OR "I hate this tool" OR "this is frustrating" OR "any tool for"`);

          const searchRes = await fetch(`https://oauth.reddit.com/r/${subreddits}/search?q=${query}&restrict_sr=1&sort=new&limit=20`, {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "User-Agent": "PainHunter/1.0.0"
            }
          });

          if (searchRes.ok) {
            const searchData = await searchRes.json();
            redditPosts = searchData.data?.children?.map((c: any) => c.data) || [];
          } else {
            console.error("Reddit search falhou:", await searchRes.text());
          }
        } else {
          console.error("Reddit auth falhou:", await authRes.text());
        }
      } catch (err) {
        console.error("Reddit error:", err);
      }
    }

    // ── FONTE REAL 3: Lovable AI (mantém o que já existia) ─────────────────
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a market research analyst. Always respond by calling the provided tool.",
          },
          {
            role: "user",
            content: `Analise esses títulos reais do Hacker News e posts do Reddit e gere 10 problemas detalhados de usuários em português (Brasil). 
Títulos Hacker News: ${hnPains.slice(0, 10).map((s: any) => s.title).join(" | ")}
Posts Reddit: ${redditPosts.slice(0, 10).map((p: any) => p.title).join(" | ")}

Combine com outros problemas reais que você conhece de outras comunidades online sobre: software, produtividade, automação, ferramentas digitais, trabalho online, criação de conteúdo.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_problems",
              description: "Return a list of detected user problems.",
              parameters: {
                type: "object",
                properties: {
                  problems: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        problem_title: { type: "string" },
                        problem_description: { type: "string" },
                        source_platform: {
                          type: "string",
                          enum: ["Reddit", "Quora", "YouTube", "Twitter", "Indie Hackers", "Hacker News"],
                        },
                        frequency_score: { type: "integer" },
                        urgency_score: { type: "integer" },
                      },
                      required: ["problem_title", "problem_description", "source_platform", "frequency_score", "urgency_score"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["problems"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_problems" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro ao gerar problemas com IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "IA não retornou dados estruturados" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const problems: any[] = parsed.problems || [];

    if (problems.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum problema foi gerado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = problems.map((p) => {
      const freq = typeof p.frequency_score === "number"
        ? Math.min(100, Math.max(0, p.frequency_score * 10)) : 0;
      const urg = typeof p.urgency_score === "number"
        ? Math.min(100, Math.max(0, p.urgency_score * 10)) : 0;
      return {
        user_id: userId,
        problem_title: (p.problem_title || "Sem título").trim(),
        problem_description: p.problem_description?.trim() ?? null,
        source_platform: p.source_platform?.trim() ?? null,
        frequency_score: freq,
        urgency_score: urg,
        viral_score: freq + urg,
      };
    });

    const { data, error } = await supabase
      .from("detected_problems")
      .insert(rows)
      .select();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted: data.length,
        hn_real_pains_found: hnPains.length,
        reddit_real_pains_found: redditPosts.length,
        problems: data,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Erro inesperado:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
