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

    // Fetch user's detected problems
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const problemsSummary = problems.map((p, i) => `${i + 1}. "${p.problem_title}" — ${p.problem_description || "sem descrição"} (viral: ${p.viral_score || 0})`).join("\n");

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
            content: "You are a data analyst that identifies recurring patterns in user complaints. Group similar problems into patterns. Always respond by calling the provided tool. Use Portuguese (Brazil) for all text.",
          },
          {
            role: "user",
            content: `Analyze these ${problems.length} user problems and identify 3–6 recurring patterns (groups of similar problems):\n\n${problemsSummary}\n\nFor each pattern, provide a title, description, list of related problem indices (1-based), total occurrences count, and average viral score of related problems.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_patterns",
              description: "Return detected problem patterns.",
              parameters: {
                type: "object",
                properties: {
                  patterns: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        pattern_title: { type: "string" },
                        pattern_description: { type: "string" },
                        related_problem_indices: {
                          type: "array",
                          items: { type: "integer" },
                          description: "1-based indices of problems belonging to this pattern",
                        },
                      },
                      required: ["pattern_title", "pattern_description", "related_problem_indices"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["patterns"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_patterns" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro ao detectar padrões" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "IA não retornou dados estruturados" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const patterns: any[] = parsed.patterns || [];

    if (patterns.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum padrão detectado" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build rows with computed stats
    const rows = patterns.map((p) => {
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
        user_id: userId,
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

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, patterns: inserted }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro inesperado:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
