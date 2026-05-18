import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateVsl } from "@/lib/ai.functions";
import { createProject } from "@/lib/projects.functions";
import { toast } from "sonner";
import logo from "@/assets/feneion-logo.png";
import { TEMPLATES } from "@/data/templates";

const QUESTIONS = [
  { key: "name", label: "O teu nome", placeholder: "Como te chamas?" },
  { key: "business", label: "Nome do negócio ou marca", placeholder: "Ex: Studio Faria, Acme Lda." },
  { key: "audience", label: "Quem é o teu cliente ideal?", placeholder: "Ex: mulheres 30-45 que querem perder peso" },
  { key: "promise", label: "Qual é a tua grande promessa?", placeholder: "Ex: perder 7kg em 60 dias sem dietas restritivas" },
  { key: "price", label: "Preço da oferta", placeholder: "Ex: 197€ em 12x" },
  { key: "goal", label: "Objetivo principal da página", placeholder: "Ex: venda direta, agendar call, captar lead" },
  { key: "tone", label: "Tom da página", placeholder: "Ex: emocional com urgência, premium, técnico" },
];

export const Route = createFileRoute("/onboard")({
  component: OnboardPage,
});

function OnboardPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const generate = useServerFn(generateVsl);
  const createProj = useServerFn(createProject);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/login", search: { redirect: "/onboard" } });
        return;
      }
      try {
        const pending = sessionStorage.getItem("feneion:pending-prompt");
        if (pending) setPrompt(pending);

        const templateId = sessionStorage.getItem("feneion:template");
        if (templateId) {
          const t = TEMPLATES.find((x) => x.id === templateId);
          if (t) {
            // criar diretamente o projecto a partir do template
            (async () => {
              try {
                const project = await createProj({
                  data: {
                    prompt: `Template: ${t.name}`,
                    brief: { template: t.id },
                    content: t.content,
                    title: t.content.title,
                  },
                });
                sessionStorage.removeItem("feneion:template");
                navigate({ to: "/workspace/$id", params: { id: project.id } });
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Erro ao criar a partir do template");
                setAuthChecked(true);
              }
            })();
            return;
          }
        }
      } catch { /* ignore */ }
      setAuthChecked(true);
    });
  }, [navigate, createProj]);

  const submit = async () => {
    if (!prompt.trim()) {
      toast.error("Falta o prompt inicial");
      return;
    }
    setGenerating(true);
    try {
      const content = await generate({ data: { prompt, answers } });
      const project = await createProj({
        data: {
          prompt,
          brief: answers,
          content,
          title: content.title,
        },
      });
      try { sessionStorage.removeItem("feneion:pending-prompt"); } catch { /* */ }
      navigate({ to: "/workspace/$id", params: { id: project.id } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao gerar a VSL";
      toast.error(msg);
      setGenerating(false);
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
    <div className="relative min-h-screen px-4 py-12">
      <img src={logo} alt="feneion" className="absolute left-6 top-6 h-16 w-auto md:h-20" />

      <div className="mx-auto mt-20 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Algumas perguntas rápidas
        </h1>
        <p className="mt-2 text-muted-foreground">
          Quanto mais detalhes deres, melhor será a tua VSL.
        </p>

        <div className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label>O que queres vender?</Label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[90px] w-full rounded-xl border border-input bg-card/60 p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Descreve o teu produto ou serviço"
            />
          </div>

          {QUESTIONS.map((q) => (
            <div key={q.key} className="space-y-2">
              <Label>{q.label}</Label>
              <Input
                value={answers[q.key] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                placeholder={q.placeholder}
                className="h-11 bg-card/60"
              />
            </div>
          ))}

          <Button
            onClick={submit}
            disabled={generating}
            className="h-12 w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"
          >
            {generating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A gerar a tua VSL...</>
            ) : (
              "Gerar a minha VSL"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
