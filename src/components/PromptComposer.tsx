import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SUGGESTIONS } from "@/data/suggestions";

export function PromptComposer() {
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rotation, setRotation] = useState(0);
  const navigate = useNavigate();

  // Roda 4 sugestões diferentes cada 4s
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
      sessionStorage.setItem("feneion:pending-prompt", value);
    } catch { /* ignore */ }

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      navigate({ to: "/login", search: { redirect: "/onboard" } });
      return;
    }
    navigate({ to: "/onboard" });
  };

  return (
    <div className="w-full max-w-3xl">
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
        <div className="flex items-center justify-between gap-2 px-2 pb-1 pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Powered by AI · pressiona ⌘ + Enter</span>
          </div>
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
            title="Clica para preencher com a ideia completa"
            className="rounded-full border border-border/60 bg-card/40 px-4 py-2 text-xs text-muted-foreground transition hover:border-primary/40 hover:bg-card hover:text-foreground sm:text-sm"
          >
            {s.short}
          </button>
        ))}
      </div>
    </div>
  );
}
