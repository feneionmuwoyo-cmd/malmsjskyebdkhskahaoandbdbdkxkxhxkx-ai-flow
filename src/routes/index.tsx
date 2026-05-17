import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { PromptComposer } from "@/components/PromptComposer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "feneion — Crie VSLs e landing pages com IA" },
      {
        name: "description",
        content:
          "feneion é a forma mais rápida de criar páginas de vendas e VSLs de alta conversão usando IA. Descreve o teu produto e recebe a tua página em segundos.",
      },
      { property: "og:title", content: "feneion — Crie VSLs com IA" },
      {
        property: "og:description",
        content: "Páginas de vendas e VSLs de alta conversão geradas por IA.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Header />

      <main className="relative">
        <section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow" />
            VSLs e landing pages em segundos
          </div>

          <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Cria a tua{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              página de vendas
            </span>{" "}
            com IA
          </h1>

          <p className="mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Descreve o teu produto. A nossa IA gera headline, copy, VSL,
            estrutura e estilo visual — prontos para converter.
          </p>

          <div className="mt-10 w-full flex justify-center">
            <PromptComposer />
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-muted-foreground sm:text-sm">
            <span>Editor visual</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span>Chat IA em tempo real</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span>Bloco VSL profissional</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span>Publicação instantânea</span>
          </div>
        </section>
      </main>
    </div>
  );
}
