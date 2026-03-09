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

  const startTime = Date.now();

  try {
    // Use service role for cron-triggered calls (bypasses RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all user IDs from profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id");

    if (profilesError) throw profilesError;

    if (!profiles?.length) {
      console.log("No users found, skipping.");
      return new Response(JSON.stringify({ success: true, message: "Nenhum usuário encontrado", inserted: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate problems via Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

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
            content: `Generate 10 realistic, specific user problems people complain about online today (${new Date().toISOString().slice(0, 10)}). Topics: software, productivity, automation, digital tools, online work, content creation. Each problem must feel like a real complaint found on Reddit, Quora, YouTube, Twitter, or Indie Hackers. Be specific, varied, and fresh — avoid repeating common generic problems. Use Portuguese (Brazil) for all text fields.`,
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
                          enum: ["Reddit", "Quora", "YouTube", "Twitter", "Indie Hackers"],
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
      throw new Error(`AI gateway error ${aiResponse.status}: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("IA não retornou dados estruturados");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const problems: any[] = parsed.problems || [];

    if (problems.length === 0) {
      throw new Error("Nenhum problema gerado pela IA");
    }

    // Insert problems for each user
    let totalInserted = 0;

    for (const profile of profiles) {
      const rows = problems.map((p) => ({
        user_id: profile.user_id,
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

      const { data: inserted, error: insertError } = await supabase
        .from("detected_problems")
        .insert(rows)
        .select("id");

      if (insertError) {
        console.error(`Erro ao inserir para user ${profile.user_id}:`, insertError);
        continue;
      }

      totalInserted += inserted.length;

      // Log execution per user
      await supabase.from("agent_logs").insert({
        user_id: profile.user_id,
        agent_name: "Pain Hunter (Cron)",
        action: "Descoberta diária de problemas",
        detail: `${inserted.length} problemas inseridos automaticamente.`,
        level: "info",
      });
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`daily-pain-discovery concluído: ${totalInserted} problemas inseridos para ${profiles.length} usuário(s) em ${duration}s`);

    return new Response(
      JSON.stringify({
        success: true,
        users: profiles.length,
        problems_generated: problems.length,
        total_inserted: totalInserted,
        duration_seconds: parseFloat(duration),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`daily-pain-discovery falhou após ${duration}s:`, err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
