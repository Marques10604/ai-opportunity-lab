import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { title, niche, problem, solution, competition_level, market_score } = await req.json();

    const systemPrompt = `You are an expert SaaS product strategist. You create detailed, actionable MVP plans for SaaS startups. Return structured data via the provided tool.`;

    const userPrompt = `Create a detailed MVP plan for this SaaS opportunity:

**Product:** ${title}
**Niche:** ${niche}
**Problem:** ${problem}
**Proposed Solution:** ${solution}
**Competition Level:** ${competition_level}
**Market Score:** ${market_score}/100

Generate:
1. product_concept: A compelling 2-3 sentence product vision
2. core_features: 6 essential MVP features (name + description)
3. tech_stack: 6 recommended technologies (name + purpose)
4. ui_structure: 5 key pages/screens (page name + description)
5. roadmap: 4 development phases, each with phase name, duration, and 3-4 tasks
6. monetization: A detailed monetization strategy (pricing tiers, target revenue)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_mvp_plan",
              description: "Return the structured MVP plan",
              parameters: {
                type: "object",
                properties: {
                  product_concept: { type: "string" },
                  core_features: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["name", "description"],
                      additionalProperties: false,
                    },
                  },
                  tech_stack: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        purpose: { type: "string" },
                      },
                      required: ["name", "purpose"],
                      additionalProperties: false,
                    },
                  },
                  ui_structure: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        page: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["page", "description"],
                      additionalProperties: false,
                    },
                  },
                  roadmap: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        phase: { type: "string" },
                        duration: { type: "string" },
                        tasks: {
                          type: "array",
                          items: { type: "string" },
                        },
                      },
                      required: ["phase", "duration", "tasks"],
                      additionalProperties: false,
                    },
                  },
                  monetization: { type: "string" },
                },
                required: ["product_concept", "core_features", "tech_stack", "ui_structure", "roadmap", "monetization"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_mvp_plan" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-mvp-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
