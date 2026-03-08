import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Shield, Gauge, Layers, Rocket, Target, TrendingUp, BarChart3, Loader2, Code2, DollarSign, Megaphone, ListChecks } from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { useOpportunities } from "@/hooks/useSupabaseData";

// MVP generation templates
const techStacks: Record<string, string[]> = {
  "Developer Tools": ["React", "Node.js", "PostgreSQL", "Stripe", "Vercel"],
  "Creator Economy": ["Next.js", "Supabase", "FFmpeg", "OpenAI API", "AWS S3"],
  "Remote Work": ["React", "WebRTC", "Redis", "PostgreSQL", "Docker"],
  "E-commerce": ["Next.js", "Stripe", "Supabase", "Tailwind CSS", "Vercel"],
  "Healthcare": ["React", "HIPAA-compliant hosting", "PostgreSQL", "OpenAI API", "Auth0"],
  "EdTech": ["React", "Supabase", "OpenAI API", "Stripe", "Vercel"],
  default: ["React", "Supabase", "Tailwind CSS", "Stripe", "Vercel"],
};

const coreFeaturesByNiche: Record<string, string[]> = {
  "Developer Tools": ["GitHub/GitLab integration", "Automated code analysis", "Dashboard with actionable insights", "Team collaboration", "CI/CD pipeline hooks"],
  "Creator Economy": ["AI content processing", "Multi-platform publishing", "Analytics dashboard", "Template library", "Scheduling system"],
  "Remote Work": ["Real-time video/audio", "Async messaging", "Timezone intelligence", "Calendar integration", "Activity tracking"],
  "E-commerce": ["A/B testing engine", "AI copywriting", "Analytics & conversion tracking", "Bulk operations", "Shopify/WooCommerce integration"],
  "Healthcare": ["AI-powered note generation", "Insurance code suggestions", "HIPAA-compliant storage", "Patient timeline view", "Export & sharing"],
  "EdTech": ["AI quiz generation", "Student progress tracking", "Difficulty adaptation", "LMS integration", "Performance analytics"],
  default: ["User authentication & onboarding", "Core AI-powered feature", "Dashboard & analytics", "Notifications & alerts", "Settings & billing"],
};

const monetization = [
  "Freemium model — free tier with usage limits, paid plans starting at $19/mo",
  "Usage-based pricing — pay per action/API call with volume discounts",
  "Tiered subscriptions — Starter ($19), Pro ($49), Team ($99), Enterprise (custom)",
  "Marketplace commission — take 10-15% on transactions facilitated",
];

const launchStrategies = [
  "Launch on Product Hunt with a compelling demo video",
  "Build in public on Twitter/X to grow audience pre-launch",
  "Offer lifetime deals on AppSumo for initial traction",
  "Partner with micro-influencers in the target niche",
  "Create a waitlist with referral rewards for early access",
  "Publish SEO-optimized content targeting pain-point keywords",
];

function pick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getScoreColor(score: number) {
  if (score >= 80) return "hsl(150, 60%, 50%)";
  if (score >= 60) return "hsl(40, 90%, 55%)";
  return "hsl(0, 72%, 51%)";
}

function competitionToNum(level: string | null) {
  if (level === "Low") return 25;
  if (level === "High") return 85;
  return 55;
}

function difficultyToNum(level: string | null) {
  if (level === "Low") return 30;
  if (level === "High") return 80;
  return 50;
}

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: opportunities, isLoading } = useOpportunities();
  const [mvpPlan, setMvpPlan] = useState<null | {
    features: string[];
    techStack: string[];
    monetization: string;
    launchStrategy: string[];
  }>(null);
  const [generating, setGenerating] = useState(false);

  const opp = opportunities?.find((o) => o.id === id);

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading...</div>;
  if (!opp) return <div className="p-8 text-sm text-muted-foreground">Opportunity not found.</div>;

  const marketScore = opp.market_score ?? 0;
  const compScore = competitionToNum(opp.competition_level);
  const diffScore = difficultyToNum(opp.difficulty_level);

  const radialData = [{ name: "Score", value: marketScore, fill: getScoreColor(marketScore) }];

  const analysisData = [
    { name: "Market\nPotential", value: marketScore, color: "hsl(190, 90%, 50%)" },
    { name: "Competition", value: compScore, color: opp.competition_level === "Low" ? "hsl(150, 60%, 50%)" : opp.competition_level === "High" ? "hsl(0, 72%, 51%)" : "hsl(40, 90%, 55%)" },
    { name: "Difficulty", value: diffScore, color: opp.difficulty_level === "Low" ? "hsl(150, 60%, 50%)" : opp.difficulty_level === "High" ? "hsl(0, 72%, 51%)" : "hsl(40, 90%, 55%)" },
  ];

  const growthData = [
    { month: "Now", value: 20 },
    { month: "+3mo", value: 35 },
    { month: "+6mo", value: Math.round(marketScore * 0.6) },
    { month: "+12mo", value: Math.round(marketScore * 0.85) },
    { month: "+24mo", value: marketScore },
  ];

  const handleGenerateMvp = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 2500));

    const niche = opp.niche || "default";
    const features = coreFeaturesByNiche[niche] || coreFeaturesByNiche["default"];
    const stack = techStacks[niche] || techStacks["default"];

    setMvpPlan({
      features,
      techStack: stack,
      monetization: pick(monetization, 1)[0],
      launchStrategy: pick(launchStrategies, 3),
    });
    setGenerating(false);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <button onClick={() => navigate("/opportunities")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Opportunities
      </button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{opp.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Target className="h-3.5 w-3.5 text-primary" />
              <p className="text-sm text-muted-foreground">{opp.niche}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-4xl font-bold gradient-text">{marketScore}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Opportunity Score</p>
          </div>
        </div>
      </motion.div>

      {/* Score Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Market Potential", value: `${marketScore}/100`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
          { label: "Competition", value: opp.competition_level ?? "Medium", icon: Shield, color: opp.competition_level === "Low" ? "text-success" : opp.competition_level === "High" ? "text-destructive" : "text-warning", bg: opp.competition_level === "Low" ? "bg-success/10" : opp.competition_level === "High" ? "bg-destructive/10" : "bg-warning/10" },
          { label: "Build Difficulty", value: opp.difficulty_level ?? "Medium", icon: Gauge, color: opp.difficulty_level === "Low" ? "text-success" : opp.difficulty_level === "High" ? "text-destructive" : "text-warning", bg: opp.difficulty_level === "Low" ? "bg-success/10" : opp.difficulty_level === "High" ? "bg-destructive/10" : "bg-warning/10" },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-border bg-card p-4">
            <div className={`h-8 w-8 rounded-lg ${item.bg} flex items-center justify-center mb-3`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <p className="text-lg font-bold">{item.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Problem & Solution */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Zap className="h-4 w-4 text-destructive" /> Problem Description</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{opp.problem || "No problem description available."}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> Proposed SaaS Solution</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{opp.solution || "No solution description available."}</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Opportunity Score Radial */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-2">Opportunity Score</h3>
          <ResponsiveContainer width="100%" height={160}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={radialData} barSize={12}>
              <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "hsl(220, 14%, 18%)" }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <p className="text-center text-2xl font-bold -mt-4" style={{ color: getScoreColor(marketScore) }}>{marketScore}</p>
          <p className="text-center text-[10px] text-muted-foreground">out of 100</p>
        </motion.div>

        {/* Competition Analysis Bar */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-2">Analysis Breakdown</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={analysisData} layout="vertical" margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                {analysisData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Market Growth Projection */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-2">Market Growth Projection</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={growthData} margin={{ left: -10, right: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="value" fill="hsl(190, 90%, 50%)" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Generate MVP Plan Button */}
      {!mvpPlan && (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          onClick={handleGenerateMvp}
          disabled={generating}
          className="w-full rounded-xl p-4 font-semibold text-sm flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:opacity-90 transition-opacity glow-primary disabled:opacity-60"
        >
          {generating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating MVP Plan...</>
          ) : (
            <><Rocket className="h-4 w-4" /> Generate MVP Plan</>
          )}
        </motion.button>
      )}

      {/* MVP Plan */}
      <AnimatePresence>
        {mvpPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">MVP Plan</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Core Features */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-primary" /> Core Features
                </h3>
                <div className="space-y-2">
                  {mvpPlan.features.map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="h-5 w-5 rounded-md bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      {f}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Tech Stack */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-accent" /> Recommended Tech Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mvpPlan.techStack.map((t) => (
                    <span key={t} className="text-[11px] font-mono px-2.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground border border-border">{t}</span>
                  ))}
                </div>
              </div>

              {/* Monetization */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-success" /> Monetization Strategy
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{mvpPlan.monetization}</p>
              </div>

              {/* Launch Strategy */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-warning" /> Launch Strategy
                </h3>
                <div className="space-y-2">
                  {mvpPlan.launchStrategy.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-warning shrink-0 mt-1.5" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setMvpPlan(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Regenerate plan →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
