import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sampleProblems = [
  {
    problem_title: "Gerenciar clientes com planilhas",
    problem_description:
      "Muitos freelancers reclamam que gerenciar clientes manualmente em planilhas é caótico e propenso a erros.",
    source_platform: "Reddit",
    frequency_score: 70,
    urgency_score: 60,
  },
  {
    problem_title: "Apps de produtividade demais",
    problem_description:
      "Usuários reclamam de precisar de muitas ferramentas diferentes para gerenciar tarefas, notas e projetos.",
    source_platform: "Quora",
    frequency_score: 60,
    urgency_score: 50,
  },
  {
    problem_title: "Copiar dados manualmente entre ferramentas",
    problem_description:
      "Pessoas reclamam de copiar dados manualmente entre diferentes ferramentas e dashboards.",
    source_platform: "Indie Hackers",
    frequency_score: 80,
    urgency_score: 70,
  },
];

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

    const body = await req.json().catch(() => ({}));
    const testMode = body.test_mode === true;

    // Use sample problems in test mode, otherwise use provided problems
    const problems = testMode ? sampleProblems : body.problems;

    if (!Array.isArray(problems) || problems.length === 0) {
      return new Response(
        JSON.stringify({ error: "Campo 'problems' deve ser um array não vazio ou ative test_mode: true" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const rows = problems.map((p: any) => ({
      user_id: userId,
      problem_title: p.problem_title?.trim() || "Sem título",
      problem_description: p.problem_description?.trim() ?? null,
      source_platform: p.source_platform?.trim() ?? null,
      frequency_score:
        typeof p.frequency_score === "number"
          ? Math.min(100, Math.max(0, p.frequency_score))
          : 0,
      urgency_score:
        typeof p.urgency_score === "number"
          ? Math.min(100, Math.max(0, p.urgency_score))
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
        test_mode: testMode,
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
