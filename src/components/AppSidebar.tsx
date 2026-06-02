import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Plus,
  FileText,
  User as UserIcon,
  Bell,
  CreditCard,
  LogOut,
  Sun,
  Moon,
  ChevronUp,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/ThemeProvider";
import { listProjects, deleteProject, renameProject, duplicateProject } from "@/lib/projects.functions";
import { toast } from "sonner";
import logo from "@/assets/feneion-logo.png";

type Project = { id: string; title: string; published: boolean };

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const fetchList = useServerFn(listProjects);
  const deleteFn = useServerFn(deleteProject);
  const renameFn = useServerFn(renameProject);
  const duplicateFn = useServerFn(duplicateProject);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const currentPath = useRouterState({ select: (r) => r.location.pathname });

  const refresh = async () => {
    try {
      const list = await fetchList();
      setProjects(list as Project[]);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const list = await fetchList();
        if (!cancel) setProjects(list as Project[]);
      } catch { /* ignore */ }
      finally { if (!cancel) setLoading(false); }
    })();
    return () => { cancel = true; };
  }, [fetchList]);

  const initial = (user?.email?.[0] ?? "?").toUpperCase();

  const handleRename = async (p: Project) => {
    const next = window.prompt("Novo título", p.title);
    if (!next || next.trim() === "" || next === p.title) return;
    try {
      await renameFn({ data: { id: p.id, title: next.trim() } });
      toast.success("Renomeado");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao renomear");
    }
  };

  const handleDelete = async (p: Project) => {
    if (!confirm(`Eliminar "${p.title}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteFn({ data: { id: p.id } });
      toast.success("Eliminado");
      await refresh();
      if (currentPath.includes(p.id)) navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao eliminar");
    }
  };

  const handleDuplicate = async (p: Project) => {
    try {
      const r = await duplicateFn({ data: { id: p.id } });
      toast.success("Duplicado");
      await refresh();
      navigate({ to: "/workspace/$id", params: { id: r.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao duplicar");
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/60">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-2">
          <img src={logo} alt="feneion" className="h-16 w-auto md:h-20" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Projetos</span>
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
              <Plus className="h-3.5 w-3.5" />
            </Link>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : projects.length === 0 ? (
                <div className="px-2 py-3 text-xs text-muted-foreground">
                  Sem projetos. Cria a primeira VSL.
                </div>
              ) : (
                projects.map((p) => {
                  const to = p.published ? `/preview/${p.id}` : `/workspace/${p.id}`;
                  return (
                    <SidebarMenuItem key={p.id} className="group/item">
                      <SidebarMenuButton
                        asChild
                        isActive={currentPath === to}
                        tooltip={p.title}
                      >
                        <Link
                          to={p.published ? "/preview/$id" : "/workspace/$id"}
                          params={{ id: p.id }}
                          className="flex items-center gap-2 pr-7"
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="truncate">{p.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-1 top-1.5 flex h-6 w-6 items-center justify-center rounded text-muted-foreground opacity-0 transition hover:bg-sidebar-accent hover:text-foreground group-hover/item:opacity-100"
                            aria-label="Ações"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => handleRename(p)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Renomear
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(p)}>
                            <Copy className="mr-2 h-3.5 w-3.5" /> Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(p)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto w-full justify-start gap-2 px-2 py-2"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 truncate text-left text-xs">
                <div className="truncate font-medium">{user?.email ?? "Conta"}</div>
                <div className="text-muted-foreground">Plano Grátis</div>
              </div>
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
              <UserIcon className="mr-2 h-4 w-4" /> Editar perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/notifications" })}>
              <Bell className="mr-2 h-4 w-4" /> Notificações
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/billing" })}>
              <CreditCard className="mr-2 h-4 w-4" /> Assinar plano
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggle}>
              {theme === "dark" ? (
                <><Sun className="mr-2 h-4 w-4" /> Modo claro</>
              ) : (
                <><Moon className="mr-2 h-4 w-4" /> Modo escuro</>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
