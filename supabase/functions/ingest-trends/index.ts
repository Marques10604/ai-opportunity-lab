import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DATA_SOURCES = [
  { name: "Google Trends", type: "search_trends", description: "Search volume and interest over time" },
  { name: "Product Hunt", type: "product_launches", description: "New product launches and upvotes" },
  { name: "Crunchbase", type: "startup_directory", description: "Startup funding and growth data" },
  { name: "TechCrunch", type: "tech_news", description: "Technology news and announcements" },
  { name: "Hacker News", type: "developer_community", description: "Developer discussions and trends" },
  { name: "Reddit r/SaaS", type: "community_signals", description: "SaaS community pain points and discussions" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Determine user_id: from auth header (manual trigger) or from body (cron)
    let userId: string | null = null;

    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
      const userClient = createClient(SUPABASE_URL, anonKey!, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
      if (!claimsErr && claimsData?.claims?.sub) {
        userId = claimsData.claims.sub as string;
      }
    }

    // Try body for user_id (cron or direct call)
    if (!userId) {
      try {
        const body = await req.json();
        userId = body?.user_id || null;
      } catch { /* no body */ }
    }

    // If no user, fetch all users who have profiles
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let userIds: string[] = [];
    if (userId) {
      userIds = [userId];
    } else {
      const { data: profiles } = await adminClient.from("profiles").select("user_id");
      userIds = (profiles || []).map((p: any) => p.user_id);
    }

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ message: "No users to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to generate realistic trend data from simulated sources
    const sourceNames = DATA_SOURCES.map((s) => `${s.name} (${s.description})`).join("\n- ");

    // ── FONTE REAL: NewsAPI ──────────────────
    const NEWS_API_KEY = Deno.env.get("NEWS_API_KEY");
    let newsArticles: any[] = [];

    if (NEWS_API_KEY) {
      try {
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        const fromDate = lastWeek.toISOString().split('T')[0];
        const toDate = today.toISOString().split('T')[0];

        // 1. Latest articles about specific topics
        const query1 = encodeURIComponent(`"SaaS" OR "artificial intelligence tools" OR "startup funding" OR "no-code automation"`);
        const newsRes1 = await fetch(`https://newsapi.org/v2/everything?q=${query1}&sortBy=publishedAt&pageSize=10&language=en`, {
          headers: { "X-Api-Key": NEWS_API_KEY }
        });

        // 2. Popular articles from the last 7 days
        const newsRes2 = await fetch(`https://newsapi.org/v2/everything?q=${query1}&from=${fromDate}&to=${toDate}&sortBy=popularity&pageSize=10&language=en`, {
          headers: { "X-Api-Key": NEWS_API_KEY }
        });

        const items1 = newsRes1.ok ? (await newsRes1.json()).articles || [] : [];
        const items2 = newsRes2.ok ? (await newsRes2.json()).articles || [] : [];

        newsArticles = [...items1, ...items2].map((a: any) => ({
          title: a.title,
          description: a.description,
          source: a.source?.name || "News"
        }));

        // Remove duplicates by title
        newsArticles = newsArticles.filter((article, index, self) =>
          article.title && index === self.findIndex((t) => t.title === article.title)
        ).slice(0, 15);

      } catch (err) {
        console.error("NewsAPI error:", err);
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              "You are a market intelligence system that aggregates data from multiple sources to detect emerging technology and SaaS trends. Return realistic, current-sounding trends.",
          },
          {
            role: "user",
            content: `You have just scanned these data sources:\n- ${sourceNames}\n\nReal News Context (NewsAPI):\n${newsArticles.length > 0 ? newsArticles.map((n: any) => `- [${n.source}] ${n.title}: ${n.description}`).join('\n') : "N/A"}\n\nGenerate 5 emerging trends detected today. Each trend should feel like real market intelligence from these sources. Include a mix of categories: AI, SaaS, DevTools, Fintech, Healthcare, EdTech, Creator Economy, E-commerce.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_trends",
              description: "Return detected trends from data sources",
              parameters: {
                type: "object",
                properties: {
                  trends: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Short trend name" },
                        category: { type: "string", description: "Category like AI, SaaS, DevTools, etc." },
                        growth_score: { type: "number", description: "Growth score 1-100" },
                        source: { type: "string", description: "Which data source detected this" },
                      },
                      required: ["name", "category", "growth_score", "source"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["trends"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_trends" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429 || response.status === 402) {
        return new Response(JSON.stringify({ error: response.status === 429 ? "Rate limited" : "Credits exhausted" }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const parsed = JSON.parse(toolCall.function.arguments);
    const trends = parsed.trends || [];

    // Insert trends for each user
    let totalInserted = 0;
    for (const uid of userIds) {
      const rows = trends.map((t: any) => ({
        name: t.name,
        category: t.category,
        growth_score: Math.min(100, Math.max(1, Math.round(t.growth_score))),
        source: t.source,
        user_id: uid,
      }));

      const { error } = await adminClient.from("trends").insert(rows);
      if (!error) totalInserted += rows.length;
      else console.error("Insert error for user", uid, error);
    }

    return new Response(
      JSON.stringify({
        message: `Ingested ${totalInserted} trends for ${userIds.length} user(s)`,
        sources: DATA_SOURCES.map((s) => s.name),
        trends,
        news_articles_found: newsArticles.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ingest-trends error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
