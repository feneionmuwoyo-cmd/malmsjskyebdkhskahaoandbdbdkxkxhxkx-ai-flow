import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Loader2, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { listProjects } from "@/lib/projects.functions";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

type Project = {
  id: string;
  title: string;
  initial_prompt: string | null;
  published: boolean;
  slug: string | null;
  updated_at: string;
};

function DashboardPage() {
  const navigate = useNavigate();
  const fetchList = useServerFn(listProjects);
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate({ to: "/login", search: { redirect: "/dashboard" } });
        return;
      }
      try {
        const list = await fetchList();
        if (!cancel) setItems(list as Project[]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [navigate, fetchList]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Os teus funis</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cria, edita e publica VSLs e landing pages.
            </p>
          </div>
          <Link to="/onboard">
            <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
              <Plus className="mr-2 h-4 w-4" /> Nova VSL
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="mt-16 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
            <h2 className="text-lg font-semibold">Ainda não tens projetos</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Começa por descrever o teu produto à IA.
            </p>
            <Link to="/onboard">
              <Button className="mt-6 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
                <Plus className="mr-2 h-4 w-4" /> Criar primeira VSL
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <Link
                key={p.id}
                to="/workspace/$id"
                params={{ id: p.id }}
                className="group glass rounded-2xl p-5 transition hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-medium">{p.title}</div>
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {p.initial_prompt}
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
                </div>
                <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(p.updated_at).toLocaleDateString()}</span>
                  <span className={p.published ? "text-primary" : ""}>
                    {p.published ? "Publicado" : "Rascunho"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
