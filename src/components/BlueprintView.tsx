import { motion } from "framer-motion";
import {
  FileCode2, ListChecks, LayoutGrid, Database, Globe, Cpu,
  Download, CheckCircle2, AlertCircle, Info,
} from "lucide-react";

export type Blueprint = {
  product_spec: string;
  core_features: { name: string; description: string; priority: "P0" | "P1" | "P2" }[];
  ui_structure: { page: string; purpose: string; components: string[] }[];
  database_schema: {
    table_name: string;
    purpose: string;
    columns: { name: string; type: string; nullable: boolean }[];
  }[];
  api_endpoints: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    path: string;
    description: string;
    request_body: string;
    response: string;
  }[];
  architecture_notes: string[];
};

const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  P0: { bg: "bg-destructive/10", text: "text-destructive", label: "Must Have" },
  P1: { bg: "bg-warning/10", text: "text-warning", label: "Important" },
  P2: { bg: "bg-muted/50", text: "text-muted-foreground", label: "Nice to Have" },
};

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-success/10 text-success",
  POST: "bg-primary/10 text-primary",
  PUT: "bg-warning/10 text-warning",
  PATCH: "bg-info/10 text-info",
  DELETE: "bg-destructive/10 text-destructive",
};

function SectionHeader({ icon: Icon, title, color }: { icon: any; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={`h-7 w-7 rounded-md flex items-center justify-center bg-card border border-border`}>
        <Icon className={`h-3.5 w-3.5 ${color}`} />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );
}

function exportAsMarkdown(blueprint: Blueprint, title: string): string {
  const lines: string[] = [];

  lines.push(`# MVP Blueprint: ${title}`);
  lines.push(`_Generated ${new Date().toLocaleDateString()}_\n`);

  lines.push(`## Product Specification`);
  lines.push(blueprint.product_spec + "\n");

  lines.push(`## Core Features`);
  for (const f of blueprint.core_features) {
    lines.push(`### [${f.priority}] ${f.name}`);
    lines.push(f.description + "\n");
  }

  lines.push(`## UI Structure`);
  for (const p of blueprint.ui_structure) {
    lines.push(`### ${p.page}`);
    lines.push(`_${p.purpose}_`);
    lines.push(`**Components:** ${p.components.join(", ")}\n`);
  }

  lines.push(`## Database Schema`);
  for (const t of blueprint.database_schema) {
    lines.push(`### Table: \`${t.table_name}\``);
    lines.push(`_${t.purpose}_`);
    lines.push(`| Column | Type | Nullable |`);
    lines.push(`|--------|------|----------|`);
    for (const c of t.columns) {
      lines.push(`| ${c.name} | ${c.type} | ${c.nullable ? "Yes" : "No"} |`);
    }
    lines.push("");
  }

  lines.push(`## API Endpoints`);
  for (const e of blueprint.api_endpoints) {
    lines.push(`### \`${e.method} ${e.path}\``);
    lines.push(e.description);
    lines.push(`- **Request:** ${e.request_body}`);
    lines.push(`- **Response:** ${e.response}\n`);
  }

  lines.push(`## Architecture Notes`);
  for (const note of blueprint.architecture_notes) {
    lines.push(`- ${note}`);
  }

  return lines.join("\n");
}

export function BlueprintView({ blueprint, opportunityTitle }: { blueprint: Blueprint; opportunityTitle: string }) {
  const handleExport = () => {
    const md = exportAsMarkdown(blueprint, opportunityTitle);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${opportunityTitle.replace(/\s+/g, "-").toLowerCase()}-blueprint.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-0 rounded-xl border border-primary/20 bg-card overflow-hidden">

      {/* Blueprint Header */}
      <div className="bg-primary/5 border-b border-primary/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileCode2 className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold">Development Blueprint</h2>
            <p className="text-[11px] text-muted-foreground font-mono">{opportunityTitle} · Generated {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="h-9 px-4 rounded-lg border border-border bg-secondary text-sm font-medium flex items-center gap-2 hover:bg-secondary/80 transition-colors"
        >
          <Download className="h-3.5 w-3.5" /> Export .md
        </button>
      </div>

      {/* Product Spec */}
      <div className="px-6 py-5 border-b border-border">
        <SectionHeader icon={FileCode2} title="Product Specification" color="text-primary" />
        <p className="text-sm text-muted-foreground leading-relaxed">{blueprint.product_spec}</p>
      </div>

      {/* Core Features */}
      <div className="px-6 py-5 border-b border-border">
        <SectionHeader icon={ListChecks} title="Core Features" color="text-primary" />
        <div className="grid md:grid-cols-2 gap-2.5">
          {blueprint.core_features.map((f, i) => {
            const ps = PRIORITY_STYLES[f.priority] || PRIORITY_STYLES.P2;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex gap-3 rounded-lg border border-border bg-secondary/30 p-3"
              >
                <span className={`h-6 w-6 rounded-md text-[9px] font-bold flex items-center justify-center shrink-0 ${ps.bg} ${ps.text}`}>
                  {f.priority}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium">{f.name}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${ps.bg} ${ps.text}`}>{ps.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{f.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* UI Structure */}
      <div className="px-6 py-5 border-b border-border">
        <SectionHeader icon={LayoutGrid} title="UI Structure" color="text-info" />
        <div className="grid md:grid-cols-2 gap-3">
          {blueprint.ui_structure.map((screen, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-lg border border-border bg-secondary/30 p-3"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-mono text-info bg-info/10 px-2 py-0.5 rounded">{screen.page}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">{screen.purpose}</p>
              <div className="flex flex-wrap gap-1">
                {screen.components.map((c, ci) => (
                  <span key={ci} className="text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded font-mono">{c}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Database Schema */}
      <div className="px-6 py-5 border-b border-border">
        <SectionHeader icon={Database} title="Database Schema" color="text-warning" />
        <div className="space-y-4">
          {blueprint.database_schema.map((table, ti) => (
            <motion.div
              key={ti}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ti * 0.04 }}
              className="rounded-lg border border-border overflow-hidden"
            >
              <div className="bg-secondary/50 px-3 py-2 flex items-center gap-2 border-b border-border">
                <Database className="h-3 w-3 text-warning" />
                <span className="text-[11px] font-mono font-semibold text-warning">{table.table_name}</span>
                <span className="text-[10px] text-muted-foreground">— {table.purpose}</span>
              </div>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border bg-secondary/20">
                    <th className="text-left px-3 py-1.5 text-muted-foreground font-medium">Column</th>
                    <th className="text-left px-3 py-1.5 text-muted-foreground font-medium">Type</th>
                    <th className="text-left px-3 py-1.5 text-muted-foreground font-medium">Nullable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {table.columns.map((col, ci) => (
                    <tr key={ci} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-3 py-1.5 font-mono text-foreground">{col.name}</td>
                      <td className="px-3 py-1.5 font-mono text-accent">{col.type}</td>
                      <td className="px-3 py-1.5">
                        {col.nullable
                          ? <span className="text-muted-foreground/60">nullable</span>
                          : <span className="text-success font-medium">NOT NULL</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          ))}
        </div>
      </div>

      {/* API Endpoints */}
      <div className="px-6 py-5 border-b border-border">
        <SectionHeader icon={Globe} title="API Endpoints" color="text-accent" />
        <div className="space-y-2">
          {blueprint.api_endpoints.map((ep, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-lg border border-border bg-secondary/20 p-3"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${METHOD_STYLES[ep.method] || "bg-secondary text-muted-foreground"}`}>
                  {ep.method}
                </span>
                <span className="text-[11px] font-mono text-foreground">{ep.path}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-1.5">{ep.description}</p>
              <div className="flex gap-3 text-[10px]">
                <span className="text-muted-foreground/50">Req: <span className="text-muted-foreground">{ep.request_body}</span></span>
                <span className="text-muted-foreground/50">Res: <span className="text-muted-foreground">{ep.response}</span></span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Architecture Notes */}
      <div className="px-6 py-5">
        <SectionHeader icon={Cpu} title="Architecture Notes" color="text-success" />
        <div className="space-y-2">
          {blueprint.architecture_notes.map((note, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-3 rounded-lg border border-success/20 bg-success/5 p-3"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">{note}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
