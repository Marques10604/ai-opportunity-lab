import { supabase } from "@/integrations/supabase/client";

export async function seedUserData(userId: string) {
  // Check if user already has data
  const { data: existing } = await supabase.from("opportunities").select("id").eq("user_id", userId).limit(1);
  if (existing && existing.length > 0) return;

  // Seed opportunities
  await supabase.from("opportunities").insert([
    { user_id: userId, title: "AI-Powered Code Review for Solo Devs", problem: "Solo developers lack affordable code review tools. Current solutions focus on generation, not review.", niche: "Developer Tools", solution: "An AI agent that reviews PRs with contextual understanding of the full codebase.", market_score: 92, competition_level: "Low", difficulty_level: "Medium" },
    { user_id: userId, title: "Micro-SaaS for Freelance Invoice Automation", problem: "Freelancers spend hours on invoicing and payment follow-ups.", niche: "Freelancers", solution: "Automated invoicing with smart reminders and payment tracking.", market_score: 88, competition_level: "Medium", difficulty_level: "Low" },
    { user_id: userId, title: "AI Meeting Notes for Remote Teams", problem: "Remote teams lose context from meetings due to poor note-taking.", niche: "Remote Work", solution: "AI that joins meetings, transcribes, and generates structured action items.", market_score: 85, competition_level: "Medium", difficulty_level: "Medium" },
    { user_id: userId, title: "Niche Community Platform for Plant Parents", problem: "Plant enthusiasts lack dedicated community tools beyond generic forums.", niche: "Lifestyle", solution: "Community platform with plant ID, care guides, and marketplace.", market_score: 79, competition_level: "Low", difficulty_level: "Low" },
    { user_id: userId, title: "AI Copilot for Customer Support Agents", problem: "Support agents waste time searching knowledge bases for answers.", niche: "Customer Success", solution: "AI copilot that suggests replies based on ticket context and past resolutions.", market_score: 91, competition_level: "Medium", difficulty_level: "High" },
  ]);

  // Seed trends
  await supabase.from("trends").insert([
    { user_id: userId, name: "AI-Native Developer Tools", category: "Technology", growth_score: 95, source: "HackerNews" },
    { user_id: userId, name: "No-Code SaaS Builders", category: "Technology", growth_score: 82, source: "ProductHunt" },
    { user_id: userId, name: "Remote Work Infrastructure", category: "Workplace", growth_score: 78, source: "Google Trends" },
    { user_id: userId, name: "Creator Economy Tools", category: "Social", growth_score: 88, source: "Twitter/X" },
    { user_id: userId, name: "AI for Non-Technical Users", category: "AI", growth_score: 91, source: "TechCrunch" },
  ]);

  // Seed niches
  await supabase.from("niches").insert([
    { user_id: userId, niche_name: "Solo Developers", audience: "Independent software developers", demand_score: 89, competition_score: 35 },
    { user_id: userId, niche_name: "Freelance Designers", audience: "UI/UX and graphic designers", demand_score: 76, competition_score: 45 },
    { user_id: userId, niche_name: "Non-Technical Founders", audience: "Entrepreneurs without coding skills", demand_score: 92, competition_score: 28 },
  ]);

  // Seed tools
  await supabase.from("tools").insert([
    { user_id: userId, tool_name: "GitHub Copilot", category: "Developer Tools", website: "https://github.com/features/copilot", description: "AI pair programmer" },
    { user_id: userId, tool_name: "Linear", category: "Project Management", website: "https://linear.app", description: "Issue tracking for software teams" },
    { user_id: userId, tool_name: "Notion AI", category: "Productivity", website: "https://notion.so", description: "AI-powered workspace" },
  ]);

  // Seed agents
  await supabase.from("agents").insert([
    { user_id: userId, agent_name: "Pain Hunter", role: "Scans communities for user problems", status: "active", last_run: new Date().toISOString() },
    { user_id: userId, agent_name: "Trend Detector", role: "Analyzes technology trends", status: "active", last_run: new Date().toISOString() },
    { user_id: userId, agent_name: "Tool Hunter", role: "Maps existing tools and solutions", status: "active", last_run: new Date().toISOString() },
    { user_id: userId, agent_name: "Niche Detector", role: "Finds underserved audiences", status: "idle", last_run: null },
    { user_id: userId, agent_name: "SaaS Generator", role: "Generates startup ideas", status: "active", last_run: new Date().toISOString() },
    { user_id: userId, agent_name: "Saturation Filter", role: "Filters saturated ideas", status: "processing", last_run: new Date().toISOString() },
    { user_id: userId, agent_name: "Market Predictor", role: "Estimates market potential", status: "active", last_run: new Date().toISOString() },
  ]);
}
