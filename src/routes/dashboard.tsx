import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUp, Loader2, Sparkles, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SUGGESTIONS } from "@/data/suggestions";
import { generateVsl } from "@/lib/ai.functions";
import { createProject } from "@/lib/projects.functions";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — feneion" },
      { name: "description", content: "O teu espaço de trabalho. Cria novas VSLs e gere os teus projetos." },
      { property: "og:title", content: "Dashboard — feneion" },
      { property: "og:description", content: "O teu espaço de trabalho feneion." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const generate = useServerFn(generateVsl);
  const createProj = useServerFn(createProject);
  const [authChecked, setAuthChecked] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"vsl" | "quiz">("vsl");
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
    try {
      const finalPrompt = mode === "quiz"
        ? `[FORMATO: QUIZ] Cria uma página tipo quiz interativo (perguntas que qualificam e levam ao CTA). ${value}`
        : value;
      const content = await generate({ data: { prompt: finalPrompt } });
      const project = await createProj({
        data: { prompt: finalPrompt, brief: {}, content, title: content.title },
      });
      navigate({ to: "/workspace/$id", params: { id: project.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar");
      setSubmitting(false);
    }
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
              Descreve o teu produto. A IA gera tudo em segundos.
            </p>

            {/* Mode toggle */}
            <div className="mt-8 flex items-center gap-1 rounded-full border border-border/60 bg-card/40 p-1">
              <button
                type="button"
                onClick={() => setMode("vsl")}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${mode === "vsl" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Sparkles className="h-4 w-4" /> VSL
              </button>
              <button
                type="button"
                onClick={() => setMode("quiz")}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${mode === "quiz" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
              >
                <ListChecks className="h-4 w-4" /> Quiz
              </button>
            </div>

            <div className="mt-6 w-full">
              {/* Glowing rotating ring around prompt container */}
              <div className="relative">
                <div className="prompt-glow-ring" aria-hidden />
                <div className="glass relative rounded-3xl p-3 shadow-elegant">
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        void submit();
                      }
                    }}
                    placeholder={mode === "quiz"
                      ? "Quero qualificar leads para o meu curso de inglês adultos..."
                      : "Quero vender um curso de emagrecimento para mulheres acima de 30 anos..."}
                    disabled={submitting}
                    className="min-h-[120px] resize-none border-0 bg-transparent text-base placeholder:text-muted-foreground/70 focus-visible:ring-0 md:text-lg"
                  />
                  <div className="flex items-center justify-end gap-2 px-2 pb-1 pt-2">
                    <Button
                      onClick={submit}
                      disabled={submitting}
                      size="icon"
                      className="h-10 w-10 rounded-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"
                    >
                      {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
                    </Button>
                  </div>
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
