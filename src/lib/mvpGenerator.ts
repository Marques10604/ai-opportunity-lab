// Rich MVP plan generation engine

interface OpportunityInput {
  title: string;
  problem: string | null;
  niche: string | null;
  solution: string | null;
  market_score: number | null;
  competition_level: string | null;
  difficulty_level: string | null;
}

const conceptTemplates = [
  "A focused SaaS platform that solves {problem} for {niche} through intelligent automation and a delightful user experience. The product prioritizes simplicity, fast time-to-value, and seamless integration with existing workflows.",
  "An AI-powered tool designed specifically for {niche} that addresses {problem}. Built with a product-led growth strategy, it delivers instant value through self-serve onboarding and smart defaults.",
  "A modern, lightweight platform targeting {niche} professionals. It tackles {problem} by combining AI intelligence with human-friendly interfaces, reducing manual effort by up to 80%.",
];

const featuresByNiche: Record<string, { name: string; description: string }[]> = {
  "Developer Tools": [
    { name: "Smart Code Analysis Engine", description: "AI-powered static analysis that understands context and intent" },
    { name: "GitHub/GitLab Integration", description: "One-click setup with existing repositories and CI/CD pipelines" },
    { name: "Real-time Dashboard", description: "Live metrics on code quality, velocity, and technical debt" },
    { name: "Team Collaboration Hub", description: "Shared insights, annotations, and review workflows" },
    { name: "Custom Rule Builder", description: "Create organization-specific rules and best practices" },
    { name: "Automated Reports", description: "Weekly summaries and trend analysis delivered to Slack/email" },
  ],
  "Creator Economy": [
    { name: "AI Content Transformer", description: "Automatically repurpose long-form content into short clips, threads, and posts" },
    { name: "Multi-Platform Publisher", description: "Schedule and publish to YouTube, TikTok, Twitter, and Instagram simultaneously" },
    { name: "Analytics Dashboard", description: "Cross-platform performance metrics and audience insights" },
    { name: "Template Library", description: "Pre-built templates for thumbnails, hooks, and content formats" },
    { name: "Collaboration Tools", description: "Invite editors, managers, and brand partners to your workspace" },
    { name: "Monetization Tracker", description: "Track revenue streams across platforms, sponsorships, and products" },
  ],
  "Remote Work": [
    { name: "Timezone-Aware Scheduling", description: "Automatically find optimal meeting times across global teams" },
    { name: "Async Video Messages", description: "Record and share video updates with auto-generated summaries" },
    { name: "Smart Status Board", description: "Real-time team availability and focus-time indicators" },
    { name: "Meeting Intelligence", description: "AI transcription, action items, and follow-up tracking" },
    { name: "Virtual Watercooler", description: "Serendipitous social interactions for remote team bonding" },
    { name: "Productivity Insights", description: "Personal and team productivity patterns without surveillance" },
  ],
  "E-commerce": [
    { name: "A/B Testing Engine", description: "Test product descriptions, images, and pricing with statistical rigor" },
    { name: "AI Copywriter", description: "Generate compelling product descriptions in seconds" },
    { name: "Conversion Analytics", description: "Track and optimize every step of the customer journey" },
    { name: "Bulk Operations", description: "Update hundreds of listings simultaneously with smart templates" },
    { name: "Competitor Monitoring", description: "Track competitor pricing, features, and positioning changes" },
    { name: "Marketplace Integration", description: "Sync inventory and listings across Shopify, Amazon, and Etsy" },
  ],
  default: [
    { name: "User Onboarding Flow", description: "Guided setup wizard with smart defaults for instant time-to-value" },
    { name: "AI-Powered Core Engine", description: "Intelligent automation that handles the heavy lifting" },
    { name: "Dashboard & Analytics", description: "Real-time metrics and actionable insights" },
    { name: "Notification System", description: "Smart alerts via email, in-app, and Slack integrations" },
    { name: "Team Collaboration", description: "Invite members, assign roles, and share workspaces" },
    { name: "Settings & Billing", description: "Self-serve subscription management with usage-based pricing" },
  ],
};

const techStackByNiche: Record<string, { name: string; purpose: string }[]> = {
  "Developer Tools": [
    { name: "React + TypeScript", purpose: "Frontend" },
    { name: "Node.js", purpose: "Backend API" },
    { name: "PostgreSQL", purpose: "Database" },
    { name: "Redis", purpose: "Caching & queues" },
    { name: "Docker", purpose: "Containerization" },
    { name: "Stripe", purpose: "Billing" },
  ],
  "Creator Economy": [
    { name: "Next.js", purpose: "Full-stack framework" },
    { name: "Supabase", purpose: "Backend + Auth" },
    { name: "FFmpeg / Remotion", purpose: "Video processing" },
    { name: "OpenAI API", purpose: "AI content generation" },
    { name: "AWS S3", purpose: "Media storage" },
    { name: "Stripe", purpose: "Billing" },
  ],
  "Remote Work": [
    { name: "React + TypeScript", purpose: "Frontend" },
    { name: "WebRTC / LiveKit", purpose: "Real-time video" },
    { name: "Supabase", purpose: "Backend + Realtime" },
    { name: "Redis", purpose: "Presence & pub/sub" },
    { name: "Vercel", purpose: "Deployment" },
    { name: "Stripe", purpose: "Billing" },
  ],
  default: [
    { name: "React + TypeScript", purpose: "Frontend" },
    { name: "Supabase", purpose: "Backend + Auth + DB" },
    { name: "Tailwind CSS", purpose: "Styling" },
    { name: "OpenAI API", purpose: "AI features" },
    { name: "Vercel", purpose: "Deployment" },
    { name: "Stripe", purpose: "Billing" },
  ],
};

const uiStructures = [
  { page: "Landing Page", description: "Hero section with value proposition, feature highlights, social proof, and CTA" },
  { page: "Dashboard", description: "Overview cards, activity feed, quick actions, and key metrics chart" },
  { page: "Core Feature View", description: "Main workspace where users interact with the primary product feature" },
  { page: "Settings", description: "Account, billing, integrations, and notification preferences" },
  { page: "Onboarding", description: "3-step guided setup: connect accounts, configure preferences, invite team" },
  { page: "Analytics", description: "Charts, filters, date range selector, and exportable reports" },
];

const roadmapPhases = [
  { phase: "Week 1–2: Foundation", tasks: ["Set up project scaffolding and CI/CD", "Implement authentication and user management", "Design and build the database schema", "Create landing page and waitlist"] },
  { phase: "Week 3–4: Core MVP", tasks: ["Build the primary feature end-to-end", "Implement dashboard with key metrics", "Add basic notification system", "Internal alpha testing and bug fixes"] },
  { phase: "Week 5–6: Polish & Launch", tasks: ["Integrate payment processing (Stripe)", "Add onboarding flow and tutorials", "Performance optimization and security audit", "Launch on Product Hunt and social channels"] },
  { phase: "Month 2–3: Growth", tasks: ["Collect user feedback and iterate", "Add team collaboration features", "Build API and integrations", "Implement analytics and reporting"] },
];

const monetizationStrategies = [
  {
    model: "Freemium + Tiered Subscriptions",
    details: "Free tier with core features and usage limits. Starter plan at $19/mo for individuals, Pro at $49/mo for power users, and Team at $99/mo with collaboration features. Annual billing at 20% discount.",
  },
  {
    model: "Usage-Based Pricing",
    details: "Pay-as-you-go model with generous free tier (100 actions/mo). Scale pricing: $0.05 per action up to 10K, $0.03 per action up to 100K, and volume discounts beyond. Ideal for API-first products.",
  },
  {
    model: "Product-Led Growth with Premium Upsell",
    details: "Full-featured free product with limits on seats, storage, or history. Premium features include advanced analytics, priority support, SSO, and audit logs. Target $29-79/user/mo for premium.",
  },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateMvpPlan(opp: OpportunityInput) {
  const niche = opp.niche || "default";
  const problem = opp.problem || "the core user pain point";

  // Product concept
  const template = pick(conceptTemplates);
  const product_concept = template
    .replace("{problem}", problem.toLowerCase())
    .replace("{niche}", niche.toLowerCase() + " users");

  // Core features
  const features = featuresByNiche[niche] || featuresByNiche["default"];
  const core_features = features.slice(0, 6);

  // Tech stack
  const stack = techStackByNiche[niche] || techStackByNiche["default"];
  const tech_stack = stack;

  // UI structure
  const ui_structure = uiStructures;

  // Roadmap
  const roadmap = roadmapPhases;

  // Monetization
  const mon = pick(monetizationStrategies);
  const monetization = `${mon.model}\n\n${mon.details}`;

  return { product_concept, core_features, tech_stack, ui_structure, roadmap, monetization };
}
