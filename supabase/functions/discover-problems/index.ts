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
    if (!authHeader) throw new Error("Não autenticado");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Não autenticado");

    const body = await req.json().catch(() => ({}));
    const nicheFilter = body.niche || null;
    const count = body.count || 8;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const today = new Date().toISOString().slice(0, 10);
    const nicheInstruction = nicheFilter
      ? `Focus specifically on the "${nicheFilter}" niche/industry.`
      : `Cover diverse niches: healthcare, e-commerce, finance, legal, real estate, HR, education, logistics, technology, marketing, productivity.`;

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
            content: `You are an advanced market research AI that monitors internet communities to detect real user pain points. You simulate realistic data as if scraped from Reddit, Hacker News, Product Hunt, GitHub Issues, YouTube comments, and tech forums. Focus on problems that cause: loss of time, loss of money, operational frustration, or repeated complaints. Ignore trivial or weak problems. Only generate problems from the last 30-90 days. Always respond using the provided tool.`,
          },
          {
            role: "user",
            content: `Generate ${count} realistic, high-impact user problems detected from internet discussions as of ${today}.

${nicheInstruction}

For each problem, provide:
1. A clear problem title (the pain point)
2. A detailed description of the pain behind the complaint
3. 2-3 example complaints as they would appear on forums
4. The source platform where it was detected
5. The niche/industry category
6. Impact level based on business relevance and frequency
7. Timing status: whether this is an emerging, growing, or saturated problem
8. Frequency score (0-100) - how often this complaint appears
9. Urgency score (0-100) - how urgent the problem is for users
10. Related tools that could potentially solve this problem

All text must be in Portuguese (Brazil). Make problems specific, actionable, and realistic - they should feel like real complaints found online.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_discovered_problems",
              description: "Return a list of discovered problems from internet monitoring.",
              parameters: {
                type: "object",
                properties: {
                  problems: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        problem_title: { type: "string", description: "Clear title of the pain point in PT-BR" },
                        problem_description: { type: "string", description: "Detailed description of the underlying pain in PT-BR" },
                        complaint_examples: {
                          type: "array",
                          items: { type: "string" },
                          description: "2-3 example complaints as found on forums, in PT-BR",
                        },
                        source_platform: {
                          type: "string",
                          enum: ["Reddit", "Hacker News", "Product Hunt", "GitHub Issues", "YouTube", "Fóruns Tech"],
                        },
                        niche_category: {
                          type: "string",
                          description: "Industry niche in PT-BR (e.g. Saúde, E-commerce, Finanças, etc.)",
                        },
                        impact_level: {
                          type: "string",
                          enum: ["Baixo", "Médio", "Alto", "Crítico"],
                        },
                        timing_status: {
                          type: "string",
                          enum: ["Emergente", "Crescendo", "Saturado"],
                        },
                        frequency_score: { type: "integer", description: "0-100 frequency score" },
                        urgency_score: { type: "integer", description: "0-100 urgency score" },
                        related_tools: {
                          type: "array",
                          items: { type: "string" },
                          description: "Names of tools that could solve this problem",
                        },
                      },
                      required: [
                        "problem_title",
                        "problem_description",
                        "complaint_examples",
                        "source_platform",
                        "niche_category",
                        "impact_level",
                        "timing_status",
                        "frequency_score",
                        "urgency_score",
                        "related_tools",
                      ],
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
        tool_choice: { type: "function", function: { name: "return_discovered_problems" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error ${status}: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("IA não retornou dados estruturados");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const problems: any[] = parsed.problems || [];

    if (problems.length === 0) {
      throw new Error("Nenhum problema descoberto pela IA");
    }

    // Insert into detected_problems
    const rows = problems.map((p) => ({
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

    // Log the action
    await supabase.from("agent_logs").insert({
      user_id: user.id,
      agent_name: "Caçador de Problemas",
      action: "Descoberta de problemas na internet",
      detail: `${inserted?.length || 0} problemas descobertos${nicheFilter ? ` no nicho ${nicheFilter}` : ""}.`,
      level: "info",
    });

    return new Response(
      JSON.stringify({
        success: true,
        problems_discovered: inserted?.length || 0,
        problems: rows,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("discover-problems error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
