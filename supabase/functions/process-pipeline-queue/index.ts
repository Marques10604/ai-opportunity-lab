import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-execution-id",
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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 2. Extrai User JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }
    
    // Usar SERVICE_ROLE para garantir acesso mas carregar o usuário
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    const userId = user?.id;
    
    if (!userId && !authHeader.includes(SERVICE_ROLE_KEY)) {
        throw new Error("Não foi possível determinar o user_id para o job de background.");
    }

    const currentUserId = userId || (await req.json().catch(() => ({}))).userId;

    if (!currentUserId) throw new Error("Missing userId");

    // 3. Pegar próximos 5 problemas pendentes (LIMIT 5)
    const { data: pendingProblems, error: fetchError } = await supabaseClient
      .from("detected_problems")
      .select("*")
      .eq("pipeline_status", "pending")
      .eq("user_id", currentUserId)
      .limit(5);

    if (fetchError) throw fetchError;

    if (!pendingProblems || pendingProblems.length === 0) {
      return new Response(JSON.stringify({ status: "done", message: "Fila de problemas vazia." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`Fila ativada: Processando lote de ${pendingProblems.length} problemas...`);

    // 5. Sequential Process with Throttling (Anti-429 for Free Tier)
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < pendingProblems.length; i++) {
        const problemData = pendingProblems[i];
        const executionId = crypto.randomUUID();
        console.log(`[Queue] Iniciando Processamento (${i + 1}/${pendingProblems.length}): ${problemData.problem_title}`);

        // Mudar status para 'processing' individualmente
        const { error: updateStatusError } = await supabaseClient
          .from("detected_problems")
          .update({ pipeline_status: "processing" })
          .eq("id", problemData.id);
        
        if (updateStatusError) console.error("Erro ao atualizar status para processing:", updateStatusError);

        const prompt = `Você é um estrategista de conteúdo e negócios AI-First de ELITE.
Analise este problema único e gere o pipeline completo.

CLASSIFICAÇÃO (Mindset):
1. [SaaS Tradicional]: Foco em UX, Arquitetura Limpa (SOLID) e robustez.
2. [AI-First]: Foco em latência, custo de inferência e precisão.

PROBLEMA PARA ANALISAR:
TÍTULO: ${problemData.problem_title}
DESCRIÇÃO: ${problemData.problem_description || "N/A"}

Você DEVE retornar APENAS um JSON válido. NÃO use formatação markdown fora das strings.
As chaves do JSON DEVEM ser estritamente estas recentemente "engessadas":
{
  "mindset_classification": "SaaS Tradicional" | "AI-First",
  "discovered_tools": [
    { "name": "Nome da Ferramenta", "description": "Desc", "website": "URL", "category": "Cat" }
  ],
  "combinations": [
    { 
      "name": "Nome da Solução", 
      "description": "Desc", 
      "impact": 10, 
      "tools_used": ["t1", "t2"],
      "expected_result": "...",
      "content_idea": "...",
      "video_script": { "hook": "...", "problem": "...", "tools_demo": "...", "solution": "...", "result": "..." },
      "entregavel_cta": "Conteúdo completo do material gratuito (checklist, prompt, guia) prometido no CTA do roteiro."
    }
  ],
  "content_ideas": [
    { "type": "Tipo", "title": "Titulo", "script": "Texto Completo" }
  ]
}

Responda APENAS com o JSON no formato acima.
IMPORTANTE: Sempre que o roteiro de vídeo incluir um CTA oferecendo material gratuito (prompt, checklist, mini-guia), gere também o conteúdo completo desse material na seção 'entregavel_cta'.` ;

        try {
            // PASSO 4 — Chamada ao gemini-proxy conforme solicitado pelo usuário
            const proxyRes = await fetch(`${SUPABASE_URL}/functions/v1/gemini-proxy`, {
              method: "POST",
              headers: { 
                  "Authorization": `Bearer ${SERVICE_ROLE_KEY}`, 
                  "Content-Type": "application/json",
                  "x-execution-id": executionId
              },
              body: JSON.stringify({
                prompt,
                system_instruction: { parts: [{ text: COPYWRITER_SYSTEM_PROMPT }] },
                generationConfig: { responseMimeType: "application/json" }
              })
            });

            if (!proxyRes.ok) {
              const errText = await proxyRes.text();
              throw new Error(`AI Error no Queue: ${errText}`);
            }

            const proxyData = await proxyRes.json();
            const aiText = proxyData.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!aiText) {
                throw new Error("A IA retornou uma resposta vazia (undefined). Verifique os limites de cota.");
            }

            const cleanedJson = aiText.replace(/```json|```/g, "").trim();
            const result = JSON.parse(cleanedJson);

            const mindset = result.mindset_classification || "SaaS Tradicional";
            console.log(`[Queue] Sucesso AI: [${mindset}] para Problem ID: ${problemData.id}`);

            // 6. Inserir resultados (Padrão desestruturado { data, error })
            const { error: mindsetError } = await supabaseClient
              .from("detected_problems")
              .update({ mindset_classification: mindset })
              .eq("id", problemData.id);
            if (mindsetError) console.error("Erro ao atualizar mindset:", mindsetError);

            const tools = Array.isArray(result.discovered_tools) ? result.discovered_tools : [];
            if (tools.length > 0) {
              const { error: toolsError } = await supabaseClient.from("tools").insert(tools.map((t: any) => ({
                user_id: currentUserId,
                source_problem_id: problemData.id,
                tool_name: t.name || t.tool_name || "Ferramenta Desconhecida",
                category: t.category || "Geral",
                description: t.description || "",
                website: t.website || ""
              })));
              if (toolsError) console.error("Erro ao inserir ferramentas:", toolsError);
            }

            const combinations = Array.isArray(result.combinations) ? result.combinations : [];
            if (combinations.length > 0) {
              const { error: combError } = await supabaseClient.from("tool_combinations").insert(combinations.map((c: any) => ({
                user_id: currentUserId,
                source_problem_id: problemData.id,
                solution_name: c.name || c.solution_name || "Solução Proposta",
                solution_description: c.description || c.solution_description || "",
                tools_used: Array.isArray(c.tools_used) ? c.tools_used : [],
                expected_result: c.expected_result || "",
                innovation_score: Number(c.impact || c.innovation_score) || 8,
                content_idea: c.content_idea || "",
                video_script: typeof c.video_script === 'object' ? c.video_script : null,
                entregavel_cta: c.entregavel_cta || "",
                business_idea: c.business_idea || ""
              })));
              if (combError) console.error("Erro ao inserir combinações:", combError);
            }

            const contentIdeas = Array.isArray(result.content_ideas) ? result.content_ideas : [];
            if (contentIdeas.length > 0) {
              const rows: any[] = [];
              contentIdeas.forEach((idea: any) => {
                const scriptStr = idea.script || idea.roteiro_narracao || "";
                ["instagram", "tiktok", "linkedin", "twitter", "youtube"].forEach(p => {
                  const pKey = p === "twitter" ? "x" : p;
                  rows.push({
                    user_id: currentUserId,
                    source_problem_id: problemData.id,
                    dor_titulo: idea.title || problemData.problem_title,
                    angulo: idea.type || idea.angle || "Geral",
                    plataforma: pKey,
                    roteiro_narracao: scriptStr,
                    status: "pendente"
                  });
                });
              });
              if (rows.length > 0) {
                  const { error: contentError } = await supabaseClient.from("calendario_conteudo").insert(rows);
                  if (contentError) console.error("Erro ao inserir calendário:", contentError);
              }
            }

            const { error: oppError } = await supabaseClient.from("content_opportunities").insert({
              user_id: currentUserId,
              source_problem_id: problemData.id,
              titulo_conteudo: problemData.problem_title,
              tipo_conteudo: `Pipeline [${mindset}]`
            });
            if (oppError) console.error("Erro ao inserir oportunidade:", oppError);

            // 7. Disparar geração de oportunidades (SaaS)
            fetch(`${SUPABASE_URL}/functions/v1/generate-opportunities`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                niches: [problemData.niche_category || "Geral"],
                tools: tools.map((t: any) => t.name || t.tool_name),
                trends: [problemData.problem_title],
              })
            }).catch(e => console.error("Error triggering generate-opportunities:", e));

            const { error: finalStatusError } = await supabaseClient
              .from("detected_problems")
              .update({ pipeline_status: "completed" })
              .eq("id", problemData.id);
            if (finalStatusError) console.error("Erro ao finalizar status:", finalStatusError);

        } catch (e: any) {
            console.error(`[Queue] Erro no item ${problemData.id}:`, e.message);
            const { error: rollbackError } = await supabaseClient
              .from("detected_problems")
              .update({ pipeline_status: "error", pipeline_error: e.message })
              .eq("id", problemData.id);
            if (rollbackError) console.error("Erro no rollback de status:", rollbackError);
        }

        // Delay de 6 segundos para não estourar 429 na Free Tier (Limite 15 RPM)
        if (i < pendingProblems.length - 1) {
            console.log(`[Queue] Esperando 6s para a próxima requisição...`);
            await sleep(6000);
        }
    }

    // 8. Self-Invoke if needed
    const { count, error: countError } = await supabaseClient
      .from("detected_problems")
      .select("*", { count: 'exact', head: true })
      .eq("pipeline_status", "pending")
      .eq("user_id", currentUserId);

    if (countError) console.error("Erro ao verificar fila pendente:", countError);

    if (count && count > 0) {
      console.log(`[Queue] Ainda existem ${count} pendentes. Auto-invocando em 10s...`);
      setTimeout(() => {
        fetch(`${SUPABASE_URL}/functions/v1/process-pipeline-queue`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ userId: currentUserId })
        }).catch(e => console.error("Self-Invoke Error:", e));
      }, 10000); 
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
