import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { problem_id, problem_title, problem_description, niche_category } = await req.json();

    if (!problem_title) {
      return new Response(JSON.stringify({ error: "problem_title é obrigatório" }), {
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

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract user from JWT
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
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
            content: `Você é um especialista em descoberta de ferramentas de software e combinação de soluções. 
Analise o problema descrito e:
1. Descubra 4-6 ferramentas reais que poderiam resolver ou aliviar o problema
2. Crie 2-3 combinações inovadoras dessas ferramentas em soluções completas
3. Para cada combinação, gere uma ideia de conteúdo e um roteiro de vídeo curto

As ferramentas devem ser reais (GitHub repos, SaaS, APIs, open source).
As combinações devem ser criativas e práticas.
Responda sempre em Português (Brasil).
Use a tool fornecida para retornar dados estruturados.`,
          },
          {
            role: "user",
            content: `Problema detectado:
Título: ${problem_title}
Descrição: ${problem_description || "N/A"}
Nicho: ${niche_category || "Geral"}

Descubra ferramentas que resolvem este problema e crie combinações poderosas de ferramentas.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_tool_discovery",
              description: "Retorna ferramentas descobertas e combinações de soluções.",
              parameters: {
                type: "object",
                properties: {
                  discovered_tools: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tool_name: { type: "string" },
                        category: { type: "string", enum: ["SaaS", "API", "Open Source", "Automação", "Framework", "Plataforma"] },
                        description: { type: "string" },
                        use_case: { type: "string" },
                        website: { type: "string" },
                      },
                      required: ["tool_name", "category", "description", "use_case", "website"],
                      additionalProperties: false,
                    },
                  },
                  combinations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        solution_name: { type: "string" },
                        tools_used: {
                          type: "array",
                          items: { type: "string" },
                        },
                        solution_description: { type: "string" },
                        expected_result: { type: "string" },
                        innovation_score: { type: "number", description: "Score de 1 a 100" },
                        content_idea: { type: "string", description: "Ideia de conteúdo para redes sociais" },
                        video_script: {
                          type: "object",
                          properties: {
                            hook: { type: "string" },
                            problem: { type: "string" },
                            tools_demo: { type: "string" },
                            solution: { type: "string" },
                            result: { type: "string" },
                          },
                          required: ["hook", "problem", "tools_demo", "solution", "result"],
                          additionalProperties: false,
                        },
                      },
                      required: ["solution_name", "tools_used", "solution_description", "expected_result", "innovation_score", "content_idea", "video_script"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["discovered_tools", "combinations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_tool_discovery" } },
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
      return new Response(JSON.stringify({ error: "Erro ao descobrir ferramentas" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "IA não retornou dados estruturados" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Save tools to DB
    if (userId && result.discovered_tools?.length > 0) {
      const toolRows = result.discovered_tools.map((t: any) => ({
        user_id: userId,
        tool_name: t.tool_name,
        category: t.category,
        description: t.description,
        website: t.website,
      }));
      await supabase.from("tools").insert(toolRows);
    }

    // Save combinations to DB
    if (userId && result.combinations?.length > 0) {
      const comboRows = result.combinations.map((c: any) => ({
        user_id: userId,
        source_problem_id: problem_id || null,
        solution_name: c.solution_name,
        solution_description: c.solution_description,
        tools_used: c.tools_used,
        expected_result: c.expected_result,
        innovation_score: c.innovation_score,
        content_idea: c.content_idea,
        video_script: c.video_script,
      }));
      await supabase.from("tool_combinations").insert(comboRows);
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro inesperado:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
