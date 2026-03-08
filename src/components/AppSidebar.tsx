import {
  LayoutDashboard,
  GitBranch,
  Cpu,
  Lightbulb,
  Sparkles,
  LogOut,
  FileText,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Pipeline", url: "/pipeline", icon: GitBranch },
  { title: "Agent Monitor", url: "/agents", icon: Cpu },
  { title: "Opportunities", url: "/opportunities", icon: Lightbulb },
  { title: "Saved Plans", url: "/saved-plans", icon: FileText },
];

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
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-sm font-semibold text-foreground tracking-tight">Opportunity AI</h2>
              <p className="text-[10px] text-muted-foreground font-mono">LAB v0.1</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="transition-colors"
                      activeClassName="text-primary bg-primary/10"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <SidebarGroup className="mt-auto px-4 pb-4">
            <div className="rounded-lg border border-border bg-secondary/50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse-glow" />
                <span className="text-[10px] font-mono text-muted-foreground">SYSTEM ACTIVE</span>
              </div>
              <p className="text-[10px] text-muted-foreground">7 agents running · 142 tasks queued</p>
            </div>
            <button onClick={signOut} className="mt-2 w-full flex items-center gap-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
