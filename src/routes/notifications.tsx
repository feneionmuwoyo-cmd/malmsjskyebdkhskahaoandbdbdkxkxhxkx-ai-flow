import { createFileRoute } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1">
          <header className="flex h-12 items-center border-b border-border/60 px-4">
            <SidebarTrigger />
          </header>
          <main className="mx-auto max-w-3xl p-6">
            <h1 className="text-2xl font-semibold tracking-tight">Notificações</h1>
            <p className="mt-1 text-sm text-muted-foreground">Atividade recente da tua conta.</p>

            <div className="mt-10 rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground" />
              <h2 className="mt-4 text-sm font-medium">Sem notificações</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Quando alguém pagar uma das tuas VSLs, vais ver aqui.
              </p>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
