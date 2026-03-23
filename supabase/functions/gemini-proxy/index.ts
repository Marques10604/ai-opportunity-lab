import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-execution-id",
};

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── EXECUTION_ID (Idempotência) ───────────────────────────────────────
    const executionId = req.headers.get("x-execution-id") ?? crypto.randomUUID();

    // ── Fetch Gemini API Key from Vault ───────────────────────────────────
    const { data: keyData, error: keyError } = await supabase.rpc(
      "get_decrypted_secret",
      { secret_name: "GEMINI_API_KEY" }
    );

    const geminiKey = keyData?.trim() || Deno.env.get("GEMINI_API_KEY")?.trim();

    if (keyError || !geminiKey) {
      console.error("Key error:", keyError);
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY não encontrada no Vault.",
          tip: "Execute: supabase secrets set GEMINI_API_KEY=sua_chave",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Parse Request Body ────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const { prompt, generationConfig, system_instruction } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Campo 'prompt' obrigatório no body." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Emit AG-UI STEP_STARTED event ─────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "STEP_STARTED",
      detail: "Chamando Gemini 2.5 Flash via proxy seguro",
      user_id: user.id,
      level: "info",
    }).then(() => {}).catch(() => {}); // non-blocking — table may not exist yet

    // ── Build Gemini Payload ──────────────────────────────────────────────
    const geminiPayload: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
        maxOutputTokens: 8192,
        ...(generationConfig ?? {}),
      },
    };

    if (system_instruction) {
      geminiPayload.system_instruction = system_instruction;
    }

    // ── Call Gemini API ───────────────────────────────────────────────────
    const geminiRes = await fetch(`${GEMINI_ENDPOINT}?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => "Erro ilegível");
      let parsedError: any = {};
      try { parsedError = JSON.parse(errText); } catch (_) { /* skip */ }
      const detail = parsedError.error?.message || "Motivo oculto pelo Google";
      console.error(`Gemini error ${geminiRes.status}:`, detail);

      return new Response(
        JSON.stringify({ error: `Gemini ${geminiRes.status}: ${detail}`, details: parsedError }),
        {
          status: geminiRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const geminiData = await geminiRes.json();

    // ── Emit AG-UI RUN_STARTED event ──────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "STATE_DELTA",
      detail: "Gemini respondeu com sucesso",
      user_id: user.id,
      level: "info",
    }).then(() => {}).catch(() => {});

    return new Response(JSON.stringify(geminiData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Erro inesperado no gemini-proxy:", err);
    return new Response(
      JSON.stringify({ error: "Erro inesperado no proxy", message: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
