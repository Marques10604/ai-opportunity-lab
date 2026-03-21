import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

serve(async (req) => {
  // 1. Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "" // Usa Service Role para contornar RLS das transações em background
    );

    // 2. Extrai User JWT da requisição para injetar nos registros, para que o usuário sinta que os registros são dele
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }
    
    // Configura o client Supabase logado temporariamente para pegar o user.id
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    
    // Obter o ID do usuário (Precisamos disto para as Foreign Keys)
    let userId = "";
    try {
      // Caso a chamada tenha vindo do client via Auth, extraímos o usuário real.
      const { data: { user }, error: userError } = await userClient.auth.getUser();
      if (userError || !user) throw new Error("Não autorizado");
      userId = user.id;
    } catch (e) {
      // Suporte para o Self-Invoke: Quando a função chama a si mesma, passamos o userId no body
      const bodyText = await req.clone().text();
      if (bodyText) {
        const bodyObj = JSON.parse(bodyText);
        if (bodyObj.userId) userId = bodyObj.userId;
      }
      if (!userId) {
        throw new Error("Cannot determine user_id for the background job");
      }
    }

    // 3. Pegar próximos 2 problemas pendentes (LIMIT 2)
    const { data: pendingProblems, error: fetchError } = await supabaseClient
      .from("detected_problems")
      .select("*")
      .eq("pipeline_status", "pending")
      .eq("user_id", userId)
      .limit(2);

    if (fetchError) {
      throw fetchError;
    }

    if (!pendingProblems || pendingProblems.length === 0) {
      // Fila zerada.
      return new Response(JSON.stringify({ status: "done", message: "Fila de problemas vazia." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`Fila ativada: Processando ${pendingProblems.length} problemas agora para o usuário ${userId}...`);

    // 4. Mudar status para 'processing' para evitar que outro job pegue os mesmos
    const processingIds = pendingProblems.map((p) => p.id);
    await supabaseClient
      .from("detected_problems")
      .update({ pipeline_status: "processing" })
      .in("id", processingIds);

    // 5. Processar cada problema usando Gemini
    for (let i = 0; i < pendingProblems.length; i++) {
      const problemData = pendingProblems[i];
      console.log(`[Problema ${i + 1}/${pendingProblems.length}] Gerando IA para: ${problemData.problem_title}`);

      try {
        const prompt = `Você é um estrategista de conteúdo e negócios AI-First.
Analise o problema: "${problemData.problem_title}" (${problemData.problem_description || "N/A"}) no nicho "${problemData.niche_category || "Geral"}".

Gere um pipeline completo em um único JSON com a seguinte estrutura:

{
  "discovered_tools": [
    {"tool_name": "...", "category": "AI Tools|Automation Frameworks|Developer Tools", "description": "...", "website": "..."}
  ],
  "combinations": [
    {
      "solution_name": "...",
      "tools_used": ["nome_da_ferramenta"],
      "solution_description": "...",
      "expected_result": "...",
      "innovation_score": 9,
      "content_idea": "...",
      "video_script": {"hook": "...", "problem": "...", "tools_demo": "...", "solution": "...", "result": "..."},
      "business_idea": {"nome": "...", "descricao_produto": "...", "infraestrutura": "...", "stack_ferramentas": [], "monetizacao": "...", "diferencial_ai": "...", "potencial_escala": "..."}
    }
  ],
  "content_ideas": [
    {
      "angle": "tutorial|polemica|hack|comparativo|transformacao",
      "title": "...",
      "instagram": "roteiro completo 30s com hook nos primeiros 3s",
      "tiktok": "roteiro completo storytelling",
      "linkedin": "post completo 200-300 palavras",
      "twitter": ["tweet1", "tweet2", "tweet3", "tweet4", "tweet5"],
      "youtube": "roteiro tutorial 60s"
    }
  ],
  "video_script": {
    "hook": "primeiros 3 segundos",
    "problem": "desenvolvimento do problema",
    "solution": "demonstracao da solucao",
    "cta": "call to action final"
  },
  "platform_content": {
    "instagram": {"format": "Reels", "duration": "30s", "style": "Cinematic"},
    "tiktok": {"format": "Trends", "duration": "15s", "style": "Lofi"},
    "linkedin": {"format": "Article", "duration": "3min", "style": "Professional"},
    "twitter": {"format": "Thread", "duration": "1min", "style": "Direct"},
    "youtube": {"format": "Shorts", "duration": "60s", "style": "Educational"}
  }
}}

Gere pelo menos 5 discovered_tools relevantes ao problema.
Gere 5 content_ideas (um para cada 'angle').
Gere 2-3 combinations.
Responda APENAS com o JSON válido em Português (Brasil).`;

        const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY");
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              systemInstruction: {
                parts: [{ text: COPYWRITER_SYSTEM_PROMPT }]
              },
              generationConfig: {
                responseMimeType: "application/json"
              }
            })
          }
        );

        if (!geminiRes.ok) {
          const errData = await geminiRes.json();
          throw new Error(errData.error?.message || "Erro na API do Gemini.");
        }

        const resData = await geminiRes.json();
        const aiText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiText) throw new Error("A IA retornou uma resposta vazia.");

        const cleanedText = aiText.replace(/```json|```/g, "").trim();
        const result = JSON.parse(cleanedText);

        // 6. Inserir resultados no banco de dados, vinculando com o source_problem_id
        // 6.1: Discovered Tools
        const ferramentasArray = result.discovered_tools || result.tools || result.ferramentas || [];
        if (ferramentasArray && ferramentasArray.length > 0) {
          const { error: tErr } = await supabaseClient.from("tools").insert(
            ferramentasArray.map((t: any) => ({
              user_id: userId,
              source_problem_id: problemData.id,
              tool_name: t.tool_name || t.name || t.nome || "Não identificada",
              category: t.category || t.categoria || "Geral",
              description: t.description || t.descricao || "Sem descrição",
              website: t.website || t.site || t.url || ""
            }))
          );
          if (tErr) throw new Error("Erro insert tools: " + tErr.message);
        }

        // 6.2: Tool Combinations
        if (result.combinations) {
          const { error: cErr } = await supabaseClient.from("tool_combinations").insert(
            result.combinations.map((c: any) => ({
              user_id: userId,
              source_problem_id: problemData.id,
              solution_name: c.solution_name,
              solution_description: c.solution_description,
              tools_used: c.tools_used,
              expected_result: c.expected_result,
              innovation_score: c.innovation_score,
              content_idea: c.content_idea,
              video_script: c.video_script,
              business_idea: c.business_idea
            }))
          );
          if (cErr) throw new Error("Erro insert tool_combinations: " + cErr.message);
        }

        // 6.3: Calendario Conteudo
        if (result.content_ideas) {
          const calendarRows: any[] = [];
          const platforms = ["instagram", "tiktok", "linkedin", "twitter", "youtube"];
          
          result.content_ideas.forEach((idea: any) => {
            platforms.forEach(platform => {
              const platformKey = platform === "twitter" ? "x" : platform;
              const pContent = result.platform_content?.[platform] || {};
              calendarRows.push({
                user_id: userId,
                source_problem_id: problemData.id,
                dor_titulo: idea.title,
                angulo: idea.angle,
                plataforma: platformKey,
                roteiro_narracao: typeof idea[platform] === "string" ? idea[platform] : JSON.stringify(idea[platform]),
                roteiro_tela: pContent.style || "",
                duracao_estimada: pContent.duration || "",
                hook: platform === "instagram" && typeof idea.instagram === "string" ? idea.instagram.substring(0, 100) : idea.title,
                status: "pendente"
              });
            });
          });
          const { error: calErr } = await supabaseClient.from("calendario_conteudo").insert(calendarRows);
          if (calErr) throw new Error("Erro insert calendario: " + calErr.message);
        }

        // 6.4: Content Opportunities
        const { error: oErr } = await supabaseClient.from("content_opportunities").insert({
          user_id: userId,
          source_problem_id: problemData.id,
          titulo_conteudo: problemData.problem_title,
          tipo_conteudo: "Pipeline Completo",
          gancho: result.video_script?.hook,
          roteiro_curto: result.video_script?.solution
        });
        if (oErr) throw new Error("Erro insert content_opportunities: " + oErr.message);

        // 6.5: Opportunities
        if (result.combinations && result.combinations.length > 0) {
          const firstCombo = result.combinations[0];
          const mScore = problemData.viral_score || 50;
          let compLevel = "Média";
          if (mScore > 80) compLevel = "Baixa";
          else if (mScore < 60) compLevel = "Alta";

          const { error: oppLabErr } = await supabaseClient.from("opportunities").insert({
            user_id: userId,
            detected_problem_id: problemData.id,
            title: firstCombo.solution_name,
            problem: problemData.problem_title,
            solution: firstCombo.solution_description,
            niche: problemData.niche_category || "Geral",
            market_score: mScore,
            competition_level: compLevel,
            difficulty_level: "Média"
          });
          if (oppLabErr) throw new Error("Erro insert opportunities lab: " + oppLabErr.message);
        }

        // 7. Marcar como Concluído
        await supabaseClient
          .from("detected_problems")
          .update({ pipeline_status: "completed", pipeline_error: null })
          .eq("id", problemData.id);

        console.log(`[SUCESSO] Pipeline gerado para: ${problemData.problem_title}`);

      } catch (err: any) {
        // Intercepta e marca como erro
        console.error(`[ERRO] Falha no pipeline: ${problemData.problem_title} - ${err.message}`);
        await supabaseClient
          .from("detected_problems")
          .update({ pipeline_status: "error", pipeline_error: err.message })
          .eq("id", problemData.id);
      }

      // DELAY DE SEGURANÇA RATE LIMIT (GEMINI FREE: 15 RPM)
      // Se não for o último problema, espera 5.5s para bater com limite seguro de requests.
      if (i < pendingProblems.length - 1) {
         console.log("Aplicando delay de 5.5 segundos para evitar Rate Limiting...");
         await new Promise(r => setTimeout(r, 5500));
      }
    }

    // 8. O Loop da Lote 1 Acabou. Verificamos se há MAIS pendentes na fila.
    // Self-Invoking Mechanic
    const { count } = await supabaseClient
      .from("detected_problems")
      .select("*", { count: 'exact', head: true })
      .eq("pipeline_status", "pending")
      .eq("user_id", userId);

    if (count && count > 0) {
      console.log(`Há mais ${count} itens pendentes. Disparando self-invoke callback assíncrono para liberar conexão atual.`);
      
      // A Edge function chama a si mesma assincronamente e não aguarda resposta.
      fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/process-pipeline-queue`, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` // auth com JWT
         },
         body: JSON.stringify({ userId: userId })
      }).catch(e => console.error("Erro no fetch de Self-Invoke:", e));
    }

    // A requisição atual retorna 200 rápido (morre) evitando Timeout Exceeded da Runtime.
    return new Response(JSON.stringify({
      status: "success",
      message: `Processado lote de ${pendingProblems.length} oportunidades.`,
      queue_remaining: count || 0
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Erro Fatal no Queue Processor:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
