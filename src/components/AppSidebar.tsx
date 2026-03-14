import {
  LayoutDashboard,
  Search,
  TrendingUp,
  AlertCircle,
  Network,
  Clock,
  Target,
  Lightbulb,
  MessageSquare,
  FileText,
  Sparkles,
  LogOut,
  Globe,
  Wrench,
  Star,
  ThumbsDown,
  Bug,
  FileWarning,
  FlaskConical,
  Rocket,
  Cpu,
  Layers,
  BarChart3,
  Flame,
  Brain,
  Megaphone,
  Film,
  Columns3,
  CalendarDays,
  Zap,
  Plug,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type NavItem = { title: string; url: string; icon: any };
type NavSection = { label: string; items: NavItem[] };

const navSections: (NavItem | NavSection)[] = [
  { title: "Painel", url: "/", icon: LayoutDashboard },
  { title: "Radar de Oportunidades", url: "/radar", icon: Search },
  {
    label: "Conteúdo para Redes Sociais",
    items: [
      { title: "Ideias de Conteúdo", url: "/content/ideas", icon: Lightbulb },
      { title: "Roteiros de Vídeo", url: "/content/scripts", icon: Film },
      { title: "Conteúdos Gerados", url: "/content/generated", icon: MessageSquare },
      { title: "Motor de 5 Ângulos", url: "/content/angles", icon: Columns3 },
      { title: "Conteúdo por Plataforma", url: "/content/platforms", icon: Megaphone },
      { title: "Calendário de Conteúdo", url: "/content/calendar", icon: CalendarDays },
    ],
  },
  {

    label: "Laboratório SaaS",
    items: [
      { title: "Oportunidades de SaaS", url: "/saas/opportunities", icon: Lightbulb },
      { title: "Ideias de Produto", url: "/saas/ideas", icon: Sparkles },
      { title: "Criar MVP", url: "/saas/mvp", icon: Rocket },
      { title: "Blueprint Técnico", url: "/saas/blueprint", icon: Layers },
    ],
  },
  {
    label: "Ecossistema Anthropic",
    items: [
      { title: "Project Setup", url: "/project-setup", icon: Cpu },
    ],
  },
  { title: "APIs Conectadas", url: "/apis", icon: Plug },
  { title: "Como Usar o App", url: "/how-to-use", icon: HelpCircle },
];

function isSection(item: NavItem | NavSection): item is NavSection {
  return "label" in item;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-sm font-semibold text-foreground tracking-tight">Opportunity AI</h2>
              <p className="text-[10px] text-muted-foreground font-mono">Intelligence v2.0</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto">
        {navSections.map((entry, i) => {
          if (isSection(entry)) {
            const sectionActive = entry.items.some((it) => isActive(it.url));
            return (
              <SidebarGroup key={entry.label}>
                <Collapsible defaultOpen={sectionActive}>
                  <CollapsibleTrigger className="w-full">
                    <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 flex items-center justify-between cursor-pointer hover:text-muted-foreground transition-colors group">
                      {!collapsed && entry.label}
                      {!collapsed && <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />}
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {entry.items.map((item) => (
                          <SidebarMenuItem key={item.url}>
                            <SidebarMenuButton asChild isActive={isActive(item.url)}>
                              <NavLink to={item.url} className="transition-colors" activeClassName="text-primary bg-primary/10">
                                <item.icon className="h-4 w-4" />
                                {!collapsed && <span className="text-xs">{item.title}</span>}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
            );
          }

          return (
            <SidebarGroup key={entry.url}>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive(entry.url)}>
                      <NavLink to={entry.url} end={entry.url === "/"} className="transition-colors" activeClassName="text-primary bg-primary/10">
                        <entry.icon className="h-4 w-4" />
                        {!collapsed && <span className="text-xs">{entry.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

        {!collapsed && (
          <SidebarGroup className="mt-auto px-4 pb-4">
            <div className="rounded-lg border border-border bg-secondary/50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse-glow" />
                <span className="text-[10px] font-mono text-muted-foreground">SISTEMA ATIVO</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Motor de inteligência em execução</p>
            </div>
            <button onClick={signOut} className="mt-2 w-full flex items-center gap-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="h-3 w-3" /> Sair
            </button>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
