import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Zap, Shield, Gauge, Layers, Rocket, Target, TrendingUp,
  Loader2, Code2, DollarSign, Megaphone, ListChecks, LayoutGrid,
  Map, Save, CheckCircle2, FileText,
} from "lucide-react";
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import { useOpportunities } from "@/hooks/useSupabaseData";
import { generateMvpPlan } from "@/lib/mvpGenerator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Json } from "@/integrations/supabase/types";

function getScoreColor(score: number) {
  if (score >= 80) return "hsl(150, 60%, 50%)";
  if (score >= 60) return "hsl(40, 90%, 55%)";
  return "hsl(0, 72%, 51%)";
}
function compToNum(l: string | null) { return l === "Low" ? 25 : l === "High" ? 85 : 55; }
function diffToNum(l: string | null) { return l === "Low" ? 30 : l === "High" ? 80 : 50; }
function levelColor(l: string | null) { return l === "Low" ? "text-success" : l === "High" ? "text-destructive" : "text-warning"; }
function levelBg(l: string | null) { return l === "Low" ? "bg-success/10" : l === "High" ? "bg-destructive/10" : "bg-warning/10"; }

type MvpPlan = ReturnType<typeof generateMvpPlan>;

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: opportunities, isLoading } = useOpportunities();
  const [mvpPlan, setMvpPlan] = useState<MvpPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const opp = opportunities?.find((o) => o.id === id);

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading...</div>;
  if (!opp) return <div className="p-8 text-sm text-muted-foreground">Opportunity not found.</div>;

  const ms = opp.market_score ?? 0;
  const radialData = [{ name: "Score", value: ms, fill: getScoreColor(ms) }];
  const analysisData = [
    { name: "Market", value: ms, color: "hsl(190, 90%, 50%)" },
    { name: "Competition", value: compToNum(opp.competition_level), color: opp.competition_level === "Low" ? "hsl(150,60%,50%)" : opp.competition_level === "High" ? "hsl(0,72%,51%)" : "hsl(40,90%,55%)" },
    { name: "Difficulty", value: diffToNum(opp.difficulty_level), color: opp.difficulty_level === "Low" ? "hsl(150,60%,50%)" : opp.difficulty_level === "High" ? "hsl(0,72%,51%)" : "hsl(40,90%,55%)" },
  ];
  const growthData = [
    { month: "Now", value: 20 }, { month: "+3mo", value: 35 },
    { month: "+6mo", value: Math.round(ms * 0.6) }, { month: "+12mo", value: Math.round(ms * 0.85) },
    { month: "+24mo", value: ms },
  ];

  const handleGenerate = async () => {
    setGenerating(true);
    setSaved(false);
    await new Promise((r) => setTimeout(r, 2200));
    setMvpPlan(generateMvpPlan(opp));
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!mvpPlan || !user || !opp) return;
    setSaving(true);
    await supabase.from("mvp_plans").insert({
      user_id: user.id,
      opportunity_id: opp.id,
      product_concept: mvpPlan.product_concept,
      core_features: mvpPlan.core_features as unknown as Json,
      tech_stack: mvpPlan.tech_stack as unknown as Json,
      ui_structure: mvpPlan.ui_structure as unknown as Json,
      roadmap: mvpPlan.roadmap as unknown as Json,
      monetization: mvpPlan.monetization,
    });
    setSaving(false);
    setSaved(true);
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
            <div className="flex items-center gap-2 mt-1"><Target className="h-3.5 w-3.5 text-primary" /><p className="text-sm text-muted-foreground">{opp.niche}</p></div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-4xl font-bold gradient-text">{ms}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Opportunity Score</p>
          </div>
        </div>
      </motion.div>

      {/* Score Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Market Potential", value: `${ms}/100`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
          { label: "Competition", value: opp.competition_level ?? "Medium", icon: Shield, color: levelColor(opp.competition_level), bg: levelBg(opp.competition_level) },
          { label: "Build Difficulty", value: opp.difficulty_level ?? "Medium", icon: Gauge, color: levelColor(opp.difficulty_level), bg: levelBg(opp.difficulty_level) },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-border bg-card p-4">
            <div className={`h-8 w-8 rounded-lg ${item.bg} flex items-center justify-center mb-3`}><item.icon className={`h-4 w-4 ${item.color}`} /></div>
            <p className="text-lg font-bold">{item.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Problem & Solution */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Zap className="h-4 w-4 text-destructive" /> Problem Description</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{opp.problem || "No description available."}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> Proposed SaaS Solution</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{opp.solution || "No description available."}</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-2">Opportunity Score</h3>
          <ResponsiveContainer width="100%" height={160}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={radialData} barSize={12}>
              <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "hsl(220,14%,18%)" }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <p className="text-center text-2xl font-bold -mt-4" style={{ color: getScoreColor(ms) }}>{ms}</p>
          <p className="text-center text-[10px] text-muted-foreground">out of 100</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-2">Analysis Breakdown</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={analysisData} layout="vertical" margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,18%)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(215,12%,50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "hsl(215,12%,50%)", fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(220,18%,10%)", border: "1px solid hsl(220,14%,18%)", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                {analysisData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-2">Market Growth Projection</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={growthData} margin={{ left: -10, right: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,18%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(215,12%,50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215,12%,50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(220,18%,10%)", border: "1px solid hsl(220,14%,18%)", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="value" fill="hsl(190,90%,50%)" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Generate MVP Plan Button */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        onClick={handleGenerate}
        disabled={generating}
        className="w-full rounded-xl p-4 font-semibold text-sm flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:opacity-90 transition-opacity glow-primary disabled:opacity-60"
      >
        {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating MVP Plan...</> : <><Rocket className="h-4 w-4" /> {mvpPlan ? "Regenerate MVP Plan" : "Generate MVP Plan"}</>}
      </motion.button>

      {/* MVP Plan Document */}
      <AnimatePresence>
        {mvpPlan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Document Header */}
            <div className="rounded-xl border border-primary/20 bg-card overflow-hidden">
              <div className="bg-primary/5 border-b border-primary/20 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <h2 className="text-lg font-bold">MVP Plan: {opp.title}</h2>
                    <p className="text-[11px] text-muted-foreground font-mono">Generated {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving || saved}
                  className={`h-9 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                    saved ? "bg-success/10 text-success border border-success/30" : "bg-primary text-primary-foreground hover:opacity-90"
                  } disabled:opacity-60`}
                >
                  {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
                    : saved ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved</>
                    : <><Save className="h-3.5 w-3.5" /> Save Plan</>}
                </button>
              </div>

              {/* Product Concept */}
              <div className="px-6 py-5 border-b border-border">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Rocket className="h-4 w-4 text-primary" /> Product Concept</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{mvpPlan.product_concept}</p>
              </div>

              {/* Core Features */}
              <div className="px-6 py-5 border-b border-border">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /> Core Features</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {mvpPlan.core_features.map((f, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                      <span className="h-6 w-6 rounded-md bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <div>
                        <p className="text-xs font-medium">{f.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{f.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Tech Stack */}
              <div className="px-6 py-5 border-b border-border">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Code2 className="h-4 w-4 text-accent" /> Recommended Tech Stack</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {mvpPlan.tech_stack.map((t) => (
                    <div key={t.name} className="rounded-lg border border-border bg-secondary/30 p-3">
                      <p className="text-xs font-semibold font-mono">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t.purpose}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* UI Structure */}
              <div className="px-6 py-5 border-b border-border">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><LayoutGrid className="h-4 w-4 text-info" /> Suggested UI Structure</h3>
                <div className="space-y-2">
                  {mvpPlan.ui_structure.map((page, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0 mt-0.5">{page.page}</span>
                      <p className="text-muted-foreground text-xs">{page.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roadmap */}
              <div className="px-6 py-5 border-b border-border">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Map className="h-4 w-4 text-warning" /> Development Roadmap</h3>
                <div className="space-y-4">
                  {mvpPlan.roadmap.map((phase, pi) => (
                    <motion.div key={pi} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: pi * 0.08 }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${pi === 0 ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>{pi + 1}</span>
                        <p className="text-xs font-semibold">{phase.phase}</p>
                      </div>
                      <div className="ml-8 space-y-1">
                        {phase.tasks.map((task, ti) => (
                          <div key={ti} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                            {task}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Monetization */}
              <div className="px-6 py-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><DollarSign className="h-4 w-4 text-success" /> Monetization Strategy</h3>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{mvpPlan.monetization}</div>
              </div>
            </div>

            {/* Save reminder */}
            {!saved && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Save className="h-3 w-3" /> Don't forget to save your plan
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
