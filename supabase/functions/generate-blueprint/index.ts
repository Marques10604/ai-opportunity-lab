import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { title, niche, problem, solution, competition_level, market_score } = await req.json();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are a senior software architect and product strategist. You create detailed, production-ready development blueprints for SaaS MVPs. Be specific with table names, column types, endpoint paths, and HTTP methods. Return data via the provided tool.`,
          },
          {
            role: "user",
            content: `Create a complete development blueprint for this SaaS product:

**Product:** ${title}
**Niche:** ${niche}
**Problem:** ${problem}
**Solution:** ${solution}
**Competition:** ${competition_level}
**Market Score:** ${market_score}/100

Generate a full blueprint with:
1. product_spec: A detailed product specification (3-4 sentences covering vision, target user, and value prop)
2. core_features: 8 features with name, description, and priority (P0=must-have, P1=important, P2=nice-to-have)
3. ui_structure: 6-8 screens/pages with page name, purpose, and list of key components on each
4. database_schema: 5-7 database tables with table name, purpose, and list of columns (name, type, and whether nullable)
5. api_endpoints: 8-10 REST API endpoints with method, path, description, and request/response summary
6. architecture_notes: 3 key architecture decisions or patterns to follow`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_blueprint",
              description: "Return the full development blueprint",
              parameters: {
                type: "object",
                properties: {
                  product_spec: { type: "string" },
                  core_features: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        priority: { type: "string", enum: ["P0", "P1", "P2"] },
                      },
                      required: ["name", "description", "priority"],
                      additionalProperties: false,
                    },
                  },
                  ui_structure: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        page: { type: "string" },
                        purpose: { type: "string" },
                        components: { type: "array", items: { type: "string" } },
                      },
                      required: ["page", "purpose", "components"],
                      additionalProperties: false,
                    },
                  },
                  database_schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        table_name: { type: "string" },
                        purpose: { type: "string" },
                        columns: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              type: { type: "string" },
                              nullable: { type: "boolean" },
                            },
                            required: ["name", "type", "nullable"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["table_name", "purpose", "columns"],
                      additionalProperties: false,
                    },
                  },
                  api_endpoints: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        method: { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
                        path: { type: "string" },
                        description: { type: "string" },
                        request_body: { type: "string" },
                        response: { type: "string" },
                      },
                      required: ["method", "path", "description", "request_body", "response"],
                      additionalProperties: false,
                    },
                  },
                  architecture_notes: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["product_spec", "core_features", "ui_structure", "database_schema", "api_endpoints", "architecture_notes"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_blueprint" } },
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
    console.error("generate-blueprint error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
