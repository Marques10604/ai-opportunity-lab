import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { problem_id, problem_title, problem_description, niche_category } = await req.json();

    if (!problem_title) {
      return new Response(JSON.stringify({ error: "problem_title é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // ── FONTE REAL: GitHub API ──────────────────
    const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
    let githubTrending: any[] = [];
    let githubIssues: any[] = [];

    if (GITHUB_TOKEN) {
      try {
        const ghHeaders = {
          "Authorization": `token ${GITHUB_TOKEN}`,
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "DiscoverTools/1.0.0"
        };

        const date = new Date();
        date.setDate(date.getDate() - 30);
        const dateString = date.toISOString().split('T')[0];
        
        // 1. Trending repos
        const repoQuery = `created:>${dateString} stars:>50`;
        const repoRes = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(repoQuery)}&sort=stars&order=desc&per_page=10`, { headers: ghHeaders });
        
        if (repoRes.ok) {
          const repoData = await repoRes.json();
          githubTrending = repoData.items?.map((i: any) => ({
            name: i.full_name,
            description: i.description,
            stars: i.stargazers_count,
            url: i.html_url
          })) || [];
        } else {
          console.error("GitHub repo search failed:", await repoRes.text());
        }

        // 2. Top issues from popular repos
        const reposPart = "repo:n8n-io/n8n repo:nocodb/nocodb repo:appsmithorg/appsmith repo:supabase/supabase";
        const bugQuery = `${reposPart} is:issue is:open label:bug`;
        const enhQuery = `${reposPart} is:issue is:open label:enhancement`;

        const [bugRes, enhRes] = await Promise.all([
          fetch(`https://api.github.com/search/issues?q=${encodeURIComponent(bugQuery)}&sort=reactions-+1&order=desc&per_page=5`, { headers: ghHeaders }),
          fetch(`https://api.github.com/search/issues?q=${encodeURIComponent(enhQuery)}&sort=reactions-+1&order=desc&per_page=5`, { headers: ghHeaders })
        ]);

        const bugItems = bugRes.ok ? (await bugRes.json()).items || [] : [];
        const enhItems = enhRes.ok ? (await enhRes.json()).items || [] : [];
        
        githubIssues = [...bugItems, ...enhItems].map((i: any) => ({
          title: i.title,
          repo: i.repository_url?.split('/').slice(-2).join('/'),
          reactions: i.reactions?.total_count || 0,
          url: i.html_url
        })).sort((a: any, b: any) => b.reactions - a.reactions).slice(0, 10);

      } catch (err) {
        console.error("GitHub API error:", err);
      }
    }

    // ── FONTE REAL 2: Product Hunt API ──────────────────
    const PRODUCT_HUNT_TOKEN = Deno.env.get("PRODUCT_HUNT_TOKEN");
    let productHuntPosts: any[] = [];

    if (PRODUCT_HUNT_TOKEN) {
      try {
        const phHeaders = {
          "Authorization": `Bearer ${PRODUCT_HUNT_TOKEN}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        };

        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);

        // GraphQL Query for Product Hunt
        const phQuery = `
          query {
            posts(first: 10, order: RANKING) {
              edges {
                node {
                  name
                  tagline
                  description
                  votesCount
                  url
                }
              }
            }
            topicPosts: posts(first: 10, order: NEWEST, topic: "productivity") {
              edges {
                node {
                  name
                  tagline
                  votesCount
                }
              }
            }
          }
        `;

        const phRes = await fetch("https://api.producthunt.com/v2/api/graphql", {
          method: "POST",
          headers: phHeaders,
          body: JSON.stringify({ query: phQuery })
        });

        if (phRes.ok) {
          const phData = await phRes.json();
          
          if (phData.data?.posts?.edges) {
            const topPosts = phData.data.posts.edges.map((e: any) => e.node);
            const topicPosts = phData.data.topicPosts?.edges?.map((e: any) => e.node) || [];
            
            productHuntPosts = [...topPosts, ...topicPosts].map(p => ({
              name: p.name,
              tagline: p.tagline,
              votes: p.votesCount,
              url: p.url || ""
            }));
            
            // Remove duplicates based on name
            productHuntPosts = productHuntPosts.filter((post, index, self) =>
              index === self.findIndex((t) => t.name === post.name)
            ).sort((a, b) => b.votes - a.votes).slice(0, 15);
          }
        } else {
          console.error("Product Hunt API failed:", await phRes.text());
        }
      } catch (err) {
        console.error("Product Hunt error:", err);
      }
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em descoberta de ferramentas modernas de AI e desenvolvimento de software.

Analise o problema detectado e:
1. Descubra 4-6 ferramentas MODERNAS e REAIS que resolvem o problema. Priorize:
   - Ferramentas de AI (Claude/Anthropic, Google AI, OpenAI, Cursor, etc.)
   - Plataformas de desenvolvimento (Vercel, Supabase, Railway, etc.)
   - Ferramentas open source de AI (LangChain, CrewAI, AutoGen, etc.)
   - APIs e SDKs modernos
   - Frameworks de automação (n8n, Make, Zapier, etc.)
   - Plataformas cloud (AWS, GCP, Azure)
   Evite ferramentas obsoletas.

2. Crie 2-3 combinações inovadoras dessas ferramentas em soluções completas.

3. Para cada combinação, gere:
   - Ideia de conteúdo para redes sociais
   - Roteiro de vídeo curto (Hook, Problema, Ferramentas, Solução, Resultado)
   - Ideia de negócio AI-First escalável

As ferramentas devem ser reais (GitHub repos, SaaS, APIs, open source).
As combinações devem ser criativas e práticas.
Responda sempre em Português (Brasil).
Use a tool fornecida para retornar dados estruturados.`,
          },
          {
            role: "user",
            content: `Problema detectado no sistema de descoberta:
Título: ${problem_title}
Descrição: ${problem_description || "N/A"}
Nicho: ${niche_category || "Geral"}

Contexto do GitHub (Trending Repos):
${githubTrending.length > 0 ? githubTrending.map((r: any) => `- ${r.name} (${r.stars} stars): ${r.description}`).join('\n') : "N/A"}

Contexto do GitHub (Top Issues/Bugs de ferramentas populares):
${githubIssues.length > 0 ? githubIssues.map((i: any) => `- ${i.repo}: ${i.title} (${i.reactions} reações)`).join('\n') : "N/A"}

Contexto do Product Hunt (Top Produtos Recentes):
${productHuntPosts.length > 0 ? productHuntPosts.map((p: any) => `- ${p.name} (${p.votes} votos): ${p.tagline}`).join('\n') : "N/A"}

Descubra ferramentas modernas de AI e desenvolvimento que resolvem este problema. Crie combinações poderosas e gere ideias de negócio AI-First.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_tool_discovery",
              description: "Retorna ferramentas descobertas, combinações de soluções e ideias de negócio AI-First.",
              parameters: {
                type: "object",
                properties: {
                  discovered_tools: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tool_name: { type: "string" },
                        category: { type: "string", enum: ["AI Tools", "Developer Tools", "APIs", "Cloud Platforms", "Automation Frameworks", "Open Source Tools"] },
                        description: { type: "string" },
                        use_case: { type: "string" },
                        website: { type: "string" },
                      },
                      required: ["tool_name", "category", "description", "use_case", "website"],
                      additionalProperties: false,
                    },
                  },
                  combinations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        solution_name: { type: "string" },
                        tools_used: { type: "array", items: { type: "string" } },
                        solution_description: { type: "string" },
                        expected_result: { type: "string" },
                        innovation_score: { type: "number", description: "Score de 1 a 100" },
                        content_idea: { type: "string", description: "Ideia de conteúdo para redes sociais" },
                        video_script: {
                          type: "object",
                          properties: {
                            hook: { type: "string" },
                            problem: { type: "string" },
                            tools_demo: { type: "string" },
                            solution: { type: "string" },
                            result: { type: "string" },
                          },
                          required: ["hook", "problem", "tools_demo", "solution", "result"],
                          additionalProperties: false,
                        },
                        business_idea: {
                          type: "object",
                          properties: {
                            nome: { type: "string", description: "Nome da ideia de negócio" },
                            descricao_produto: { type: "string", description: "Descrição do produto/serviço" },
                            infraestrutura: { type: "string", description: "Infraestrutura tecnológica necessária" },
                            stack_ferramentas: { type: "array", items: { type: "string" }, description: "Stack de ferramentas" },
                            monetizacao: { type: "string", description: "Modelo de monetização" },
                            diferencial_ai: { type: "string", description: "Diferencial AI-First" },
                            potencial_escala: { type: "string", description: "Potencial de escala" },
                          },
                          required: ["nome", "descricao_produto", "infraestrutura", "stack_ferramentas", "monetizacao", "diferencial_ai", "potencial_escala"],
                          additionalProperties: false,
                        },
                      },
                      required: ["solution_name", "tools_used", "solution_description", "expected_result", "innovation_score", "content_idea", "video_script", "business_idea"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["discovered_tools", "combinations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_tool_discovery" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro ao descobrir ferramentas" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "IA não retornou dados estruturados" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Save tools to DB
    if (userId && result.discovered_tools?.length > 0) {
      const toolRows = result.discovered_tools.map((t: any) => ({
        user_id: userId,
        tool_name: t.tool_name,
        category: t.category,
        description: t.description,
        website: t.website,
      }));
      await supabase.from("tools").insert(toolRows);
    }

    // Save combinations to DB
    if (userId && result.combinations?.length > 0) {
      const comboRows = result.combinations.map((c: any) => ({
        user_id: userId,
        source_problem_id: problem_id || null,
        solution_name: c.solution_name,
        solution_description: c.solution_description,
        tools_used: c.tools_used,
        expected_result: c.expected_result,
        innovation_score: c.innovation_score,
        content_idea: c.content_idea,
        video_script: c.video_script,
        business_idea: c.business_idea,
      }));
      await supabase.from("tool_combinations").insert(comboRows);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      github_trending_found: githubTrending.length,
      github_issues_found: githubIssues.length,
      product_hunt_found: productHuntPosts.length,
      ...result 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro inesperado:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
