// Simulated opportunity templates for the discovery engine
const problems = [
  { problem: "Small business owners struggle to manage social media across multiple platforms", niche: "Small Business", title: "AI Social Media Manager for SMBs" },
  { problem: "Developers waste hours debugging CI/CD pipelines with unclear error messages", niche: "Developer Tools", title: "Intelligent CI/CD Debugger" },
  { problem: "Content creators can't easily repurpose long-form content into short clips", niche: "Creator Economy", title: "AI Content Repurposing Engine" },
  { problem: "Remote teams lack async video communication tools that respect timezones", niche: "Remote Work", title: "Timezone-Aware Async Video Hub" },
  { problem: "E-commerce sellers have no easy way to A/B test product descriptions at scale", niche: "E-commerce", title: "AI Product Copy Optimizer" },
  { problem: "Therapists spend too much time on session notes and insurance documentation", niche: "Healthcare", title: "AI Therapy Notes Assistant" },
  { problem: "Indie game developers can't afford professional QA testing services", niche: "Gaming", title: "Automated QA for Indie Games" },
  { problem: "Real estate agents manually create property listing descriptions for every home", niche: "Real Estate", title: "AI Property Listing Generator" },
  { problem: "Teachers struggle to create personalized quizzes for diverse student levels", niche: "EdTech", title: "Adaptive Quiz Generator for Teachers" },
  { problem: "Podcast hosts have no automated way to find and book relevant guests", niche: "Media", title: "AI Podcast Guest Matchmaker" },
  { problem: "SaaS founders can't easily track competitor feature launches in real-time", niche: "SaaS Tools", title: "Real-Time Competitor Feature Tracker" },
  { problem: "Freelance writers lack tools to manage client briefs and deadlines in one place", niche: "Freelancers", title: "Freelance Writer Command Center" },
  { problem: "HR teams spend weeks creating onboarding materials for each new role", niche: "HR Tech", title: "AI Onboarding Content Builder" },
  { problem: "Non-profits struggle to write compelling grant proposals efficiently", niche: "Non-Profit", title: "AI Grant Proposal Writer" },
  { problem: "Pet owners can't easily find trusted pet sitters with verified reviews", niche: "Pet Care", title: "Verified Pet Sitter Marketplace" },
];

const solutions = [
  "An AI-powered platform that automates the process end-to-end with minimal user input.",
  "A SaaS tool with smart templates, AI suggestions, and one-click workflows.",
  "A browser extension + dashboard combo that integrates with existing tools seamlessly.",
  "A mobile-first app with push notifications and real-time collaboration features.",
  "An API-first platform that plugs into existing workflows via integrations.",
];

const competitionLevels = ["Low", "Medium", "High"];
const difficultyLevels = ["Low", "Medium", "High"];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateOpportunities(count: number) {
  const shuffled = [...problems].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((p) => ({
    title: p.title,
    problem: p.problem,
    niche: p.niche,
    solution: pick(solutions),
    market_score: rand(60, 98),
    competition_level: pick(competitionLevels),
    difficulty_level: pick(difficultyLevels),
  }));
}

export const pipelineSteps = [
  { id: "problems", label: "Detecting problems from online communities", agent: "Pain Hunter", duration: 1800 },
  { id: "trends", label: "Identifying market trends", agent: "Trend Detector", duration: 1500 },
  { id: "tools", label: "Analyzing existing tools & competitors", agent: "Tool Hunter", duration: 1400 },
  { id: "niches", label: "Detecting niche markets", agent: "Niche Detector", duration: 1200 },
  { id: "generate", label: "Generating SaaS opportunities", agent: "SaaS Generator", duration: 2000 },
  { id: "filter", label: "Filtering saturated ideas", agent: "Saturation Filter", duration: 1000 },
  { id: "score", label: "Scoring market potential", agent: "Market Predictor", duration: 1500 },
];
