import { useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { TEMPLATES } from "@/data/templates";
import { supabase } from "@/integrations/supabase/client";

export function TemplateGallery() {
  const navigate = useNavigate();

  const use = (id: string) => {
    try {
      sessionStorage.setItem("feneion:template", id);
    } catch { /* ignore */ }
    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/login", search: { redirect: "/onboard" } });
      } else {
        navigate({ to: "/onboard" });
      }
    });
  };

  return (
    <section className="border-t border-border/40 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            Templates prontos
          </div>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Começa a partir de um modelo testado
          </h2>
          <p className="mt-3 text-muted-foreground">
            Estruturas validadas em centenas de campanhas. Personaliza tudo com a IA.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => use(t.id)}
              className="group glass rounded-2xl p-5 text-left transition hover:border-primary/40"
            >
              <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: t.accent }} />
              <div className="mt-4 text-base font-semibold">{t.name}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{t.niche}</div>
              <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{t.description}</p>
              <div className="mt-6 inline-flex items-center gap-1 text-sm text-primary opacity-80 transition group-hover:opacity-100">
                Usar template <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
