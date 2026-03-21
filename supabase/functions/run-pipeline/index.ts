import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PIPELINE_AGENTS = [
  { id: "code-agent", name: "Agente de Código", role: "Implementa lógica e estruturas baseadas em oportunidades" },
  { id: "qa-agent", name: "Agente de QA", role: "Valida código, segurança e performance" },
  { id: "doc-agent", name: "Agente de Documentação", role: "Gera manuais e documentação técnica" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve user
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
      const uc = createClient(SUPABASE_URL, anonKey!, { global: { headers: { Authorization: authHeader } } });
      const token = authHeader.replace("Bearer ", "");
      const { data: cd } = await uc.auth.getClaims(token);
      if (cd?.claims?.sub) userId = cd.claims.sub as string;
    }
    if (!userId) {
      try { const b = await req.json(); userId = b?.user_id || null; } catch { /* */ }
    }

    let userIds: string[] = [];
    if (userId) {
      userIds = [userId];
    } else {
      const { data: profiles } = await admin.from("profiles").select("user_id");
      userIds = (profiles || []).map((p: { user_id: string }) => p.user_id);
    }
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ message: "No users" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const runId = crypto.randomUUID();

    // Helper to log
    const log = async (uid: string, agent: string, action: string, detail: string, level = "info") => {
      await admin.from("agent_logs").insert({ user_id: uid, agent_name: agent, action, detail, level, pipeline_run_id: runId });
    };

    // Update agent status helper
    const setAgentStatus = async (uid: string, agentName: string, status: string) => {
      await admin.from("agents").update({ status, last_run: new Date().toISOString() }).eq("user_id", uid).eq("agent_name", agentName);
    };

    // Run AI pipeline
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é uma Squad de Agentes IA do Marques System (Gold Standard 2026). Sua missão é transformar problemas reais em soluções SaaS de alto ROI. 
Você opera em 3 etapas:
1. Agente de Código: Desenha a arquitetura técnica e lógica da solução.
2. Agente de QA: Valida a viabilidade, segurança e propõe melhorias de performance.
3. Agente de Documentação: Cria o blueprint de implementação e guias de usuário.

Foque nos nichos: IA, Tech, Marketing, Produtividade.
Proíba terminantemente o uso de n8n, Make ou Zapier. Use apenas Supabase e Agentes Autônomos.`,
          },
          {
            role: "user",
            content: `Execute a Squad de Agentes para o cenário atual:
1. Agente de Código — Desenvolva a estrutura baseada no Marques Stack (Lovable + Supabase).
2. Agente de QA — Valide a segurança (OWASP 2026) e eficiência de custos.
3. Agente de Documentação — Gere o guia técnico final.

Retorne os resultados detalçados de cada agente E as oportunidades filtradas com nota de ROI.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_pipeline_results",
              description: "Return full pipeline execution results",
              parameters: {
                type: "object",
                properties: {
                  agent_steps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        agent_name: { type: "string" },
                        action: { type: "string" },
                        discoveries: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              detail: { type: "string" },
                              level: { type: "string", enum: ["info", "success", "warn"] },
                            },
                            required: ["detail", "level"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["agent_name", "action", "discoveries"],
                      additionalProperties: false,
                    },
                  },
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
                        roi_efficiency_note: { type: "string" },
                      },
                      required: ["title", "niche", "problem", "solution", "market_score", "competition_level", "difficulty_level", "roi_efficiency_note"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["agent_steps", "opportunities"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_pipeline_results" } },
      }),
    });

    if (!aiResponse.ok) {
      const t = await aiResponse.text();
      console.error("AI error:", aiResponse.status, t);
      if (aiResponse.status === 429 || aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: aiResponse.status === 429 ? "Rate limited" : "Credits exhausted" }), {
          status: aiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);
    const { agent_steps = [], opportunities = [] } = result;

    // Process each user
    for (const uid of userIds) {
      // Log agent steps
      for (const step of agent_steps) {
        await setAgentStatus(uid, step.agent_name, "processing");
        for (const disc of step.discoveries || []) {
          await log(uid, step.agent_name, step.action, disc.detail, disc.level);
        }
        await setAgentStatus(uid, step.agent_name, "active");
      }

      // Insert opportunities
      if (opportunities.length > 0) {
        const { error } = await admin.from("opportunities").insert(
          opportunities.map((o: Record<string, unknown>) => ({ ...o, user_id: uid }))
        );
        if (!error) {
          await log(uid, "SaaS Generator", "Pipeline complete", `Generated ${opportunities.length} new opportunities`, "success");
        }
      }

      // Final summary log
      await log(uid, "Pipeline", "Run complete", `Pipeline ${runId.slice(0, 8)} finished — ${agent_steps.length} agents ran, ${opportunities.length} opportunities created`, "success");
    }

    return new Response(JSON.stringify({
      pipeline_run_id: runId,
      agents_executed: agent_steps.length,
      opportunities_generated: opportunities.length,
      users_processed: userIds.length,
      agent_steps,
      opportunities,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("run-pipeline error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
