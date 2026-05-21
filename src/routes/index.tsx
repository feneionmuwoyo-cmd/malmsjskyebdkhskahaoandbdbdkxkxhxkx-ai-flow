import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { PromptComposer } from "@/components/PromptComposer";
import { TemplateGallery } from "@/components/TemplateGallery";
import { LandingFeatures } from "@/components/LandingFeatures";

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
        content: "Páginas de vendas e VSLs de alta conversão geradas por IA, em português.",
      },
      { property: "og:url", content: "https://malmsjskyebdkhskahaoandbdbdkxkxhxkx-ai-flow.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://malmsjskyebdkhskahaoandbdbdkxkxhxkx-ai-flow.lovable.app/" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "feneion",
        url: "https://malmsjskyebdkhskahaoandbdbdkxkxhxkx-ai-flow.lovable.app/",
        description: "Crie VSLs e landing pages de alta conversão com IA.",
        inLanguage: "pt",
      }),
    }],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Verde radial no centro para clarear a landing */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[700px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.78 0.18 140 / 0.45) 0%, oklch(0.65 0.22 145 / 0.25) 35%, transparent 70%)" }}
      />
      <Header />

      <main className="relative">
        <section className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-6xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">

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

        <TemplateGallery />
        <LandingFeatures />

        <footer className="border-t border-border/40 px-4 py-10 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} feneion · Construído para criadores que vendem
        </footer>
      </main>
    </div>
  );
}
