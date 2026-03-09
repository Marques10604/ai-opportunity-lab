import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { problem_title, problem_description } = await req.json();

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
              "You are a social media content strategist. Generate creative, engaging content ideas based on user problems. Always respond in Portuguese (Brazil). Always use the provided tool to return structured data.",
          },
          {
            role: "user",
            content: `Generate a social media content idea based on this user problem:\n\nTitle: ${problem_title}\nDescription: ${problem_description || "N/A"}\n\nThe content should address this pain point and attract an audience that has this problem.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_content_idea",
              description: "Return a structured social media content idea.",
              parameters: {
                type: "object",
                properties: {
                  content_title: {
                    type: "string",
                    description: "Catchy title for the content piece",
                  },
                  content_hook: {
                    type: "string",
                    description: "Opening hook to grab attention (1-2 sentences)",
                  },
                  content_type: {
                    type: "string",
                    enum: ["vídeo curto", "carrossel", "thread"],
                    description: "Format of the content",
                  },
                  short_script: {
                    type: "string",
                    description: "A short script or outline for the content (3-5 bullet points or short paragraphs)",
                  },
                },
                required: ["content_title", "content_hook", "content_type", "short_script"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_content_idea" } },
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
      return new Response(JSON.stringify({ error: "Erro ao gerar ideia de conteúdo" }), {
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

    const contentIdea = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, content_idea: contentIdea }), {
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
