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

    // Call Lovable AI to generate problems
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
            content:
              "You are a market research analyst that identifies real user pain points from online communities. Always respond by calling the provided tool.",
          },
          {
            role: "user",
            content:
              "Generate 10 realistic, specific user problems people complain about online. Topics: software, productivity, automation, digital tools, online work, content creation. Each problem must feel like a real complaint found on Reddit, Quora, YouTube, Twitter, or Indie Hackers. Be specific and varied — no generic problems. Use Portuguese (Brazil) for all text fields.",
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
                        problem_title: { type: "string", description: "Short title of the problem" },
                        problem_description: {
                          type: "string",
                          description: "Detailed description of the user complaint",
                        },
                        source_platform: {
                          type: "string",
                          enum: ["Reddit", "Quora", "YouTube", "Twitter", "Indie Hackers"],
                        },
                        frequency_score: {
                          type: "integer",
                          description: "How frequently this problem is mentioned (1-10)",
                        },
                        urgency_score: {
                          type: "integer",
                          description: "How urgently users need a solution (1-10)",
                        },
                      },
                      required: [
                        "problem_title",
                        "problem_description",
                        "source_platform",
                        "frequency_score",
                        "urgency_score",
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
      console.error("No tool call in AI response:", JSON.stringify(aiData));
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

    const rows = problems.map((p) => ({
      user_id: userId,
      problem_title: (p.problem_title || "Sem título").trim(),
      problem_description: p.problem_description?.trim() ?? null,
      source_platform: p.source_platform?.trim() ?? null,
      frequency_score:
        typeof p.frequency_score === "number"
          ? Math.min(100, Math.max(0, p.frequency_score * 10))
          : 0,
      urgency_score:
        typeof p.urgency_score === "number"
          ? Math.min(100, Math.max(0, p.urgency_score * 10))
          : 0,
    }));

    const { data, error } = await supabase
      .from("detected_problems")
      .insert(rows)
      .select();

    if (error) {
      console.error("Erro ao inserir problemas:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted: data.length,
        problems: data,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Erro inesperado:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
