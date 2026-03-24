import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Copywriter System Prompt exactly as used in the frontend
const COPYWRITER_SYSTEM_PROMPT = `Você é um Especialista Criador de Plataformas focado na interseção de Tecnologia e Geração de Conteúdo AI. Seu expertise consiste em construir estruturas engajadoras para redes sociais (TikTok, Reels, LinkedIn, Twitter e YouTube Shorts). Seu objetivo é reter a atenção nos primeiros 3 segundos, oferecer uma entrega de valor acelerada no "miolo" do vídeo e instigar emoções no usuário nos 5 segundos finais para gerar engajamento em massa.

ESTRUTURA METODOLÓGICA (Framework PAS + Emoção):
1. HOOK (Problema) - 0 a 3s: Uma afirmação ou pergunta polarizadora/contraintuitiva. (Ex: "Pare de usar o ChatGPT pra escrever SEO. Mude para...")
2. AGITAÇÃO (Costura) - 3 a 10s: Agite a dor provando o porquê o método normal está arruinando os resultados.
3. SOLUÇÃO (Valor Oculto) - 10 a 20s: Entregue o segredo. Uma automação incopiável, ou uma configuração escondida na IA, algo prático.
4. EMOÇÃO FINAL (Call to Action) - 20 a 30s: Gere sentimento de urgência ou FOMO e chame para ação (Ex: "Salve isso antes que excluam." ou "Comenta 'EU QUERO' pra receber o fluxo completo.")`;

Deno.serve(async (req) => {
  // 1. Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 2. Extrai User JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }
    
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    
    let userId = "";
    try {
      const { data: { user }, error: userError } = await userClient.auth.getUser();
      if (userError || !user) throw new Error("Não autorizado");
      userId = user.id;
    } catch (e) {
      const bodyText = await req.clone().text();
      if (bodyText) {
        const bodyObj = JSON.parse(bodyText);
        if (bodyObj.userId) userId = bodyObj.userId;
      }
      if (!userId) {
        throw new Error("Cannot determine user_id for the background job");
      }
    }

    // 3. Pegar próximos 5 problemas pendentes (LIMIT 5)
    const { data: pendingProblems, error: fetchError } = await supabaseClient
      .from("detected_problems")
      .select("*")
      .eq("pipeline_status", "pending")
      .eq("user_id", userId)
      .limit(5);

    if (fetchError) throw fetchError;

    if (!pendingProblems || pendingProblems.length === 0) {
      return new Response(JSON.stringify({ status: "done", message: "Fila de problemas vazia." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`Fila ativada: Processando lote de ${pendingProblems.length} problemas...`);

    // 4. Mudar status para 'processing'
    const processingIds = pendingProblems.map((p) => p.id);
    await supabaseClient
      .from("detected_problems")
      .update({ pipeline_status: "processing" })
      .in("id", processingIds);

    // 5. Batch Process with Gemini 2.5
    const prompt = `Você é um estrategista de conteúdo e negócios AI-First.
Analise os problemas abaixo e, para cada um, gere um pipeline completo de solução e conteúdo.

PROBLEMAS PARA ANALISAR:
${pendingProblems.map((p, idx) => `ID_INDEX: ${idx}
TÍTULO: ${p.problem_title}
DESCRIÇÃO: ${p.problem_description || "N/A"}
---`).join("\n")}

Retorne UM ÚNICO objeto JSON no seguinte formato:
{
  "batch_results": [
    {
      "index": 0,
      "discovered_tools": [
        { "tool_name": "...", "category": "...", "description": "...", "website": "..." }
      ],
      "combinations": [
        { 
          "solution_name": "...", 
          "solution_description": "...", 
          "tools_used": ["nome1", "nome2"], 
          "expected_result": "...",
          "innovation_score": 9,
          "content_idea": "...",
          "video_script": {
            "hook": "...", "problem": "...", "tools_demo": "...", "solution": "...", "result": "..."
          }
        }
      ],
      "content_ideas": [
        { "title": "...", "angle": "...", "instagram": "...", "tiktok": "...", "linkedin": "...", "twitter": "...", "youtube": "..." }
      ]
    }
  ]
}
Responda APENAS com o JSON válido em Português (Brasil).`;

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY");
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: COPYWRITER_SYSTEM_PROMPT }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    if (!geminiRes.ok) {
      const errData = await geminiRes.json();
      throw new Error(errData.error?.message || "Erro na API do Gemini.");
    }

    const resData = await geminiRes.json();
    const aiText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("DEBUG: Resposta bruta do Gemini:", aiText.substring(0, 200) + "...");
    
    let batchResult;
    try {
      batchResult = JSON.parse(aiText.replace(/```json|```/g, "").trim());
    } catch (e) {
      console.error("ERRO: Falha ao parsear JSON do Gemini:", e.message);
      throw e;
    }

    if (!batchResult.batch_results || batchResult.batch_results.length === 0) {
      console.warn("AVISO: Gemini retornou batch_results vazio.");
    }

    // 6. Inserir resultados
    for (const result of batchResult.batch_results) {
      const problemData = pendingProblems[result.index];
      if (!problemData) {
        console.warn(`AVISO: Índice ${result.index} não encontrado no lote pendente.`);
        continue;
      }

      console.log(`Processando Resultado para Problema ID: ${problemData.id} (${problemData.problem_title})`);

      try {
        // Tools
        const tools = result.discovered_tools || [];
        console.log(`Encontradas ${tools.length} ferramentas para este problema.`);
        
        if (tools.length > 0) {
          const { error: toolsErr } = await supabaseClient.from("tools").insert(tools.map((t: any) => {
            console.log(`  -> Inserindo ferramenta: ${t.tool_name}`);
            return {
              user_id: userId,
              source_problem_id: problemData.id,
              tool_name: t.tool_name,
              category: t.category,
              description: t.description,
              website: t.website
            };
          }));
          if (toolsErr) console.error("Erro ao inserir ferramentas:", toolsErr);
        }

        // Combinations
        if (result.combinations) {
          console.log(`Inserindo ${result.combinations.length} combinações.`);
          const { error: comboErr } = await supabaseClient.from("tool_combinations").insert(result.combinations.map((c: any) => ({
            user_id: userId,
            source_problem_id: problemData.id,
            ...c
          })));
          if (comboErr) console.error("Erro ao inserir combinações:", comboErr);
        }

        // Calendar
        if (result.content_ideas) {
          console.log(`Gerando calendário com ${result.content_ideas.length} ideias.`);
          const rows: any[] = [];
          result.content_ideas.forEach((idea: any) => {
            ["instagram", "tiktok", "linkedin", "twitter", "youtube"].forEach(p => {
              const pKey = p === "twitter" ? "x" : p;
              rows.push({
                user_id: userId,
                source_problem_id: problemData.id,
                dor_titulo: idea.title,
                angulo: idea.angle,
                plataforma: pKey,
                roteiro_narracao: idea[p],
                status: "pendente"
              });
            });
          });
          const { error: calErr } = await supabaseClient.from("calendario_conteudo").insert(rows);
          if (calErr) console.error("Erro ao inserir calendário:", calErr);
        }

        // Opps
        console.log("Atualizando oportunidades de conteúdo...");
        await supabaseClient.from("content_opportunities").insert({
          user_id: userId,
          source_problem_id: problemData.id,
          titulo_conteudo: problemData.problem_title,
          tipo_conteudo: "Pipeline Completo"
        });

        // Finalize
        console.log(`Finalizando status para item ${problemData.id} -> completed`);
        await supabaseClient
          .from("detected_problems")
          .update({ pipeline_status: "completed" })
          .eq("id", problemData.id);

      } catch (e: any) {
        console.error(`Erro item ${problemData.id}:`, e.message);
        await supabaseClient
          .from("detected_problems")
          .update({ pipeline_status: "error", pipeline_error: e.message })
          .eq("id", problemData.id);
      }
    }

    // 8. Self-Invoke if needed
    const { count } = await supabaseClient
      .from("detected_problems")
      .select("*", { count: 'exact', head: true })
      .eq("pipeline_status", "pending")
      .eq("user_id", userId);

    if (count && count > 0) {
      fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/process-pipeline-queue`, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
         },
         body: JSON.stringify({ userId: userId })
      }).catch(e => console.error("Self-Invoke Error:", e));
    }

    return new Response(JSON.stringify({ status: "success", count: pendingProblems.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Fatal Queue Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
