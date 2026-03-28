import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-execution-id",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── 1. Auth & Essentials ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autenticado");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Sessão inválida");

    const body = await req.json().catch(() => ({}));
    const { problem_id, problem_title, problem_description, niche_category } = body;

    if (!problem_title) throw new Error("problem_title é obrigatório");

    // ── 2. EXECUTION_ID (Idempotência) ──────────────────────────────────────
    const executionId = req.headers.get("x-execution-id") ?? crypto.randomUUID();

    // ── 3. Cache Check ────────────────────────────────────────────────────
    const { data: cached } = await supabase
      .from("pipeline_cache")
      .select("*")
      .eq("execution_id", executionId)
      .eq("status", "completed")
      .maybeSingle();

    if (cached) {
      console.log(`Cache hit para discover-tools: ${executionId}`);
      return new Response(JSON.stringify({ success: true, cached: true, ...cached }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 4. AG-UI Start Event ──────────────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "RUN_STARTED",
      detail: `Iniciando descoberta de ferramentas para: ${problem_title}`,
      user_id: user.id,
      level: "info",
    });

    // ── 5. Fetch External Context (GitHub & Product Hunt) ─────────────────
    const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
    const PRODUCT_HUNT_TOKEN = Deno.env.get("PRODUCT_HUNT_TOKEN");
    
    let githubTrending: any[] = [];
    let githubIssues: any[] = [];
    let productHuntPosts: any[] = [];

    // GitHub Logic
    if (GITHUB_TOKEN) {
      try {
        const ghHeaders = { "Authorization": `token ${GITHUB_TOKEN}`, "Accept": "application/vnd.github.v3+json", "User-Agent": "Genesis-AI" };
        const date = new Date(); date.setDate(date.getDate() - 30);
        const dateString = date.toISOString().split('T')[0];
        
        const repoRes = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(`created:>${dateString} stars:>50`)}&sort=stars&order=desc&per_page=10`, { headers: ghHeaders });
        if (repoRes.ok) {
          const repoData = await repoRes.ok ? await repoRes.json() : { items: [] };
          githubTrending = repoData.items?.map((i: any) => ({ name: i.full_name, description: i.description, stars: i.stargazers_count })) || [];
        }

        const reposPart = "repo:n8n-io/n8n repo:nocodb/nocodb repo:appsmithorg/appsmith repo:supabase/supabase";
        const issuesRes = await fetch(`https://api.github.com/search/issues?q=${encodeURIComponent(`${reposPart} is:issue is:open label:bug`)}&sort=reactions-+1&order=desc&per_page=10`, { headers: ghHeaders });
        if (issuesRes.ok) {
          const issuesData = await issuesRes.json();
          githubIssues = issuesData.items?.map((i: any) => ({ title: i.title, repo: i.repository_url?.split('/').slice(-2).join('/'), reactions: i.reactions?.total_count || 0 })) || [];
        }
      } catch (e) { console.error("GitHub fetch failed", e); }
    }

    // Product Hunt Logic
    if (PRODUCT_HUNT_TOKEN) {
      try {
        const phQuery = `query { posts(first: 15, order: RANKING) { edges { node { name tagline votesCount url } } } }`;
        const phRes = await fetch("https://api.producthunt.com/v2/api/graphql", {
          method: "POST",
          headers: { "Authorization": `Bearer ${PRODUCT_HUNT_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query: phQuery })
        });
        if (phRes.ok) {
          const phData = await phRes.json();
          productHuntPosts = phData.data?.posts?.edges?.map((e: any) => ({ name: e.node.name, tagline: e.node.tagline, votes: e.node.votesCount })) || [];
        }
      } catch (e) { console.error("Product Hunt fetch failed", e); }
    }

    // ── 6. Call Gemini Proxy ──────────────────────────────────────────────
    const system_instruction = {
      parts: [{
        text: `Você é um Analista de Mercado de Elite e Especialista em Descoberta de Ferramentas Modernas (AI-First).
REGRAS DE RECOMENDAÇÃO:
1. Sempre recomende ferramentas modernas e AI-native.
2. Stack preferencial: Claude (claude.ai, Claude Code, Claude Cowork), Cursor, Antigravity IDE, Lovable, Supabase, Vercel, n8n.
3. NUNCA recomende: ChatGPT como ferramenta principal, Make.com como primeira opção, ou ferramentas legadas de automação.
4. Para automação: prefira n8n ou Claude Cowork.
5. Para desenvolvimento: prefira Cursor ou Antigravity.
6. Para apps: prefira Lovable + Supabase.

Sua missão é encontrar a "ferramenta secreta" ou o stack mais eficiente que resolve o problema do usuário com o menor custo e maior performance. Responda em JSON puro segundo a estrutura solicitada. Use Português (Brasil).`
      }]
    };

    const prompt = `Analise o problema: "${problem_title}"
Descrição: ${problem_description || "N/A"}
Nicho: ${niche_category || "Geral"}

Contexto Externo:
GitHub Trending: ${JSON.stringify(githubTrending)}
GitHub Issues: ${JSON.stringify(githubIssues)}
Product Hunt: ${JSON.stringify(productHuntPosts)}

Retorne um JSON com:
- discovered_tools: lista de 4-6 ferramentas reais (tool_name, category, description, website)
- combinations: lista de 2-3 soluções (solution_name, tools_used, solution_description, content_idea, video_script, business_idea)

Video Script deve conter: hook, problem, tools_demo, solution, result.
Business Idea deve conter: nome, descricao_produto, stack_ferramentas, monetizacao.`;

    const proxyRes = await fetch(`${SUPABASE_URL}/functions/v1/gemini-proxy`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "x-execution-id": executionId,
      },
      body: JSON.stringify({
        prompt,
        system_instruction,
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    if (!proxyRes.ok) {
      const errorData = await proxyRes.json().catch(() => ({ error: "Erro no Proxy" }));
      throw new Error(`Proxy error: ${errorData.error || "Erro desconhecido"}`);
    }

    const proxyData = await proxyRes.json();
    const aiText = proxyData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) throw new Error("IA não retornou conteúdo");

    const result = JSON.parse(aiText);

    // ── 7. Save to DB ─────────────────────────────────────────────────────
    // Salvar ferramentas individuais
    if (result.discovered_tools?.length > 0) {
      const toolRows = result.discovered_tools.map((t: any) => ({
        user_id: user.id,
        tool_name: t.tool_name,
        category: t.category,
        description: t.description,
        website: t.website,
      }));
      await supabase.from("tools").insert(toolRows);
    }

    // Salvar combinações
    if (result.combinations?.length > 0) {
      const comboRows = result.combinations.map((c: any) => ({
        user_id: user.id,
        source_problem_id: problem_id || null,
        solution_name: c.solution_name,
        solution_description: c.solution_description,
        tools_used: c.tools_used,
        content_idea: c.content_idea,
        video_script: c.video_script,
        business_idea: c.business_idea,
      }));
      await supabase.from("tool_combinations").insert(comboRows);
    }

    // ── 8. Log Event (AG-UI) ─────────────────────────────────────────────
    await supabase.from("agent_activity").insert({
      execution_id: executionId,
      event_type: "STATE_DELTA",
      detail: `Sucesso: ${result.discovered_tools?.length} ferramentas e ${result.combinations?.length} combinações geradas.`,
      user_id: user.id,
      level: "info",
    });

    // ── 9. Pipeline Cache Persistence ────────────────────────────────────
    await supabase.from("pipeline_cache").insert({
      execution_id: executionId,
      detected_problem_id: problem_id || null,
      status: "completed",
      tools: result.discovered_tools || [],
      combinations: result.combinations || [],
      video_script: result.combinations?.[0]?.video_script || {},
    });

    // ── 10. Return Response ──────────────────────────────────────────────
    return new Response(JSON.stringify({ 
      success: true, 
      discovered_tools: result.discovered_tools,
      combinations: result.combinations 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("discover-tools error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
