import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SUGGESTIONS } from "@/data/suggestions";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/login", search: { redirect: "/dashboard" } });
        return;
      }
      setAuthChecked(true);
    });
  }, [navigate]);

  useEffect(() => {
    const t = setInterval(() => setRotation((r) => r + 1), 4000);
    return () => clearInterval(t);
  }, []);

  const visible = (() => {
    const start = (rotation * 4) % SUGGESTIONS.length;
    return Array.from({ length: 4 }, (_, i) => SUGGESTIONS[(start + i) % SUGGESTIONS.length]);
  })();

  const submit = async () => {
    const value = prompt.trim();
    if (!value) {
      toast.error("Descreve o que queres vender");
      return;
    }
    setSubmitting(true);
    try { sessionStorage.setItem("feneion:pending-prompt", value); } catch { /* ignore */ }
    navigate({ to: "/onboard" });
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1">
          <header className="flex h-12 items-center border-b border-border/60 px-4">
            <SidebarTrigger />
          </header>

          <main className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl flex-col items-center justify-center px-4 py-12">
            <h1 className="text-center text-4xl font-semibold tracking-tight md:text-5xl">
              O que vais criar hoje?
            </h1>
            <p className="mt-3 text-center text-sm text-muted-foreground md:text-base">
              Descreve o teu produto. A IA gera a tua VSL em segundos.
            </p>

            <div className="mt-10 w-full">
              <div className="glass rounded-3xl p-3 shadow-elegant">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      void submit();
                    }
                  }}
                  placeholder="Quero vender um curso de emagrecimento para mulheres acima de 30 anos..."
                  className="min-h-[120px] resize-none border-0 bg-transparent text-base placeholder:text-muted-foreground/70 focus-visible:ring-0 md:text-lg"
                />
                <div className="flex items-center justify-end gap-2 px-2 pb-1 pt-2">
                  <Button
                    onClick={submit}
                    disabled={submitting}
                    size="icon"
                    className="h-10 w-10 rounded-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"
                  >
                    <ArrowUp className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {visible.map((s) => (
                  <button
                    key={s.short}
                    type="button"
                    onClick={() => setPrompt(s.full)}
                    className="rounded-full border border-border/60 bg-card/40 px-4 py-2 text-xs text-muted-foreground transition hover:border-primary/40 hover:bg-card hover:text-foreground sm:text-sm"
                  >
                    {s.short}
                  </button>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
