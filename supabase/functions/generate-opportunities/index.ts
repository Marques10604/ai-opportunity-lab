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

    const { niches, trends, tools } = await req.json();

    const systemPrompt = `You are a SaaS opportunity discovery AI. You analyze market data, problems, niches, and tools to generate viable SaaS startup ideas. Always return structured JSON.`;

    const userPrompt = `Based on the following market intelligence, generate 4 unique SaaS opportunities:

**Detected Niches:** ${(niches || ["Developer Tools", "EdTech", "Healthcare", "Creator Economy"]).join(", ")}
**Market Trends:** ${(trends || ["AI automation", "Remote work tools", "No-code platforms", "API-first products"]).join(", ")}
**Existing Tools in Market:** ${(tools || ["Notion", "Slack", "Figma", "Zapier", "Stripe"]).join(", ")}

For each opportunity, provide:
- title: catchy product name
- niche: target market niche
- problem: specific pain point (2-3 sentences)
- solution: proposed SaaS solution (2-3 sentences)
- market_score: 1-100 market potential score
- competition_level: "Low", "Medium", or "High"
- difficulty_level: "Low", "Medium", or "High"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_opportunities",
              description: "Return generated SaaS opportunities",
              parameters: {
                type: "object",
                properties: {
                  opportunities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        niche: { type: "string" },
                        problem: { type: "string" },
                        solution: { type: "string" },
                        market_score: { type: "number" },
                        competition_level: { type: "string", enum: ["Low", "Medium", "High"] },
                        difficulty_level: { type: "string", enum: ["Low", "Medium", "High"] },
                      },
                      required: ["title", "niche", "problem", "solution", "market_score", "competition_level", "difficulty_level"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["opportunities"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_opportunities" } },
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
    console.error("generate-opportunities error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
