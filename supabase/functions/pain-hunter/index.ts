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

    const body = await req.json();
    const problems: {
      problem_title: string;
      problem_description?: string;
      source_platform?: string;
      frequency_score?: number;
      urgency_score?: number;
    }[] = body.problems;

    if (!Array.isArray(problems) || problems.length === 0) {
      return new Response(
        JSON.stringify({ error: "Campo 'problems' deve ser um array não vazio" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const rows = problems.map((p) => ({
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
