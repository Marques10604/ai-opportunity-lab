export const dashboardStats = {
  opportunityScore: 87,
  ideasDiscovered: 2847,
  trendsDetected: 156,
  nichesAnalyzed: 423,
  marketPredictions: 89,
};

export const recentOpportunities = [
  { id: "1", title: "AI-Powered Code Review for Solo Devs", score: 92, niche: "Developer Tools", competition: "Low", trend: "Rising" },
  { id: "2", title: "Micro-SaaS for Freelance Invoice Automation", score: 88, niche: "Freelancers", competition: "Medium", trend: "Stable" },
  { id: "3", title: "AI Meeting Notes for Remote Teams", score: 85, niche: "Remote Work", competition: "Medium", trend: "Rising" },
  { id: "4", title: "Niche Community Platform for Plant Parents", score: 79, niche: "Lifestyle", competition: "Low", trend: "Rising" },
  { id: "5", title: "Automated SEO Auditor for Small Businesses", score: 76, niche: "Marketing", competition: "High", trend: "Stable" },
  { id: "6", title: "AI Copilot for Customer Support Agents", score: 91, niche: "Customer Success", competition: "Medium", trend: "Rising" },
];

export const chartData = [
  { month: "Jan", opportunities: 180, validated: 45 },
  { month: "Feb", opportunities: 220, validated: 62 },
  { month: "Mar", opportunities: 310, validated: 89 },
  { month: "Apr", opportunities: 280, validated: 78 },
  { month: "May", opportunities: 420, validated: 112 },
  { month: "Jun", opportunities: 510, validated: 134 },
];

export const agents = [
  { id: "pain-hunter", name: "Pain Hunter", icon: "Search", status: "active" as const, tasks: 47, description: "Scans internet communities to detect real user problems", sources: ["Reddit", "HackerNews", "ProductHunt", "G2 Reviews"] },
  { id: "trend-detector", name: "Trend Detector", icon: "TrendingUp", status: "active" as const, tasks: 23, description: "Analyzes technology & startup trends and social signals", sources: ["Twitter/X", "TechCrunch", "Google Trends", "Crunchbase"] },
  { id: "tool-hunter", name: "Tool Hunter", icon: "Wrench", status: "active" as const, tasks: 31, description: "Maps existing tools, SaaS platforms and solutions", sources: ["ProductHunt", "G2", "Capterra", "AlternativeTo"] },
  { id: "niche-detector", name: "Niche Detector", icon: "Target", status: "idle" as const, tasks: 12, description: "Finds micro-niches and underserved audiences", sources: ["Subreddit Analysis", "Facebook Groups", "Niche Forums"] },
  { id: "saas-generator", name: "SaaS Generator", icon: "Sparkles", status: "active" as const, tasks: 8, description: "Combines problems, trends and niches to generate ideas", sources: ["Internal Pipeline"] },
  { id: "saturation-filter", name: "Saturation Filter", icon: "Filter", status: "processing" as const, tasks: 15, description: "Analyzes competition and filters saturated ideas", sources: ["SEMrush Data", "SimilarWeb", "App Stores"] },
  { id: "market-predictor", name: "Market Predictor", icon: "BarChart3", status: "active" as const, tasks: 6, description: "Estimates market size, growth and difficulty", sources: ["Statista", "Market Reports", "Financial APIs"] },
];

export const activityFeed = [
  { time: "2 min ago", agent: "Pain Hunter", action: "Detected pain point", detail: "Users frustrated with complex CRM onboarding" },
  { time: "5 min ago", agent: "Trend Detector", action: "New trend identified", detail: "AI-native developer tools gaining 340% YoY" },
  { time: "8 min ago", agent: "SaaS Generator", action: "Opportunity generated", detail: "Simplified CRM for solopreneurs" },
  { time: "12 min ago", agent: "Saturation Filter", action: "Filtered 3 ideas", detail: "Removed high-competition email marketing tools" },
  { time: "15 min ago", agent: "Market Predictor", action: "Market analysis complete", detail: "Developer productivity TAM: $18.5B by 2028" },
  { time: "18 min ago", agent: "Tool Hunter", action: "Mapped 12 new tools", detail: "Added alternatives in project management space" },
  { time: "23 min ago", agent: "Niche Detector", action: "Niche discovered", detail: "Underserved: AI tools for non-technical founders" },
];

export const opportunityDetail = {
  id: "1",
  title: "AI-Powered Code Review for Solo Developers",
  problem: "Solo developers and small teams lack affordable, intelligent code review tools. Current solutions like GitHub Copilot focus on generation, not review. Developers spend 15-20% of their time on self-review with no feedback loop.",
  niche: "Independent developers & small dev teams (2-5 people)",
  solution: "An AI agent that reviews pull requests with contextual understanding of the full codebase, suggests improvements for security, performance and maintainability, and learns from the developer's patterns over time.",
  marketScore: 92,
  competitionLevel: "Low",
  difficultyLevel: "Medium",
  monetization: [
    "Freemium: Free for public repos, paid for private repos",
    "Pro plan: $19/mo per developer",
    "Team plan: $49/mo for up to 10 developers",
    "Enterprise: Custom pricing with on-prem deployment",
  ],
  tam: "$4.2B",
  growthRate: "28% CAGR",
  timeToMvp: "8-12 weeks",
  techStack: ["Python", "LLM API", "GitHub API", "React", "PostgreSQL"],
};

export const agentLogs = [
  { timestamp: "14:32:01", agent: "Pain Hunter", level: "info" as const, message: "Scanning r/webdev for pain points... found 23 new threads" },
  { timestamp: "14:32:04", agent: "Pain Hunter", level: "info" as const, message: "NLP analysis: 8 high-signal complaints about CI/CD complexity" },
  { timestamp: "14:32:08", agent: "Trend Detector", level: "info" as const, message: "Processing HackerNews front page... 3 AI-related posts trending" },
  { timestamp: "14:32:12", agent: "Tool Hunter", level: "warn" as const, message: "Rate limited by G2 API — retrying in 30s" },
  { timestamp: "14:32:15", agent: "SaaS Generator", level: "success" as const, message: "Generated opportunity: 'No-code CI/CD for indie hackers' — score: 84" },
  { timestamp: "14:32:18", agent: "Saturation Filter", level: "info" as const, message: "Evaluating 'No-code CI/CD' — competition check in progress" },
  { timestamp: "14:32:22", agent: "Saturation Filter", level: "warn" as const, message: "Medium competition detected — 4 existing players found" },
  { timestamp: "14:32:25", agent: "Market Predictor", level: "info" as const, message: "Fetching TAM data for CI/CD market segment..." },
  { timestamp: "14:32:28", agent: "Market Predictor", level: "success" as const, message: "Market analysis complete: TAM $2.1B, 22% CAGR, difficulty: Medium" },
  { timestamp: "14:32:31", agent: "Niche Detector", level: "info" as const, message: "Cross-referencing audience segments with pain points..." },
];
