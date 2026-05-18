import { Sparkles, MousePointerClick, Rocket, ShieldCheck, Layers, Wand2 } from "lucide-react";

const FEATURES = [
  { icon: Sparkles, title: "Geração com IA", body: "Descreve o produto e recebe headline, copy, VSL, secções e estilo prontos." },
  { icon: MousePointerClick, title: "Editor visual", body: "Clica em qualquer elemento e edita texto, cores, vídeo e ordem sem código." },
  { icon: Wand2, title: "Chat para refinar", body: "Pede mudanças em linguagem natural — a IA aplica e explica o que mudou." },
  { icon: Layers, title: "Templates testados", body: "Modelos prontos para infoprodutos, e-commerce, SaaS e consultoria." },
  { icon: Rocket, title: "Publicação instantânea", body: "Um clique e a página fica online no nosso domínio rápido e seguro." },
  { icon: ShieldCheck, title: "Bloqueio após publicar", body: "Quando publicas, a página fica protegida — garantia de versão final." },
];

const STEPS = [
  { n: "01", title: "Descreve a ideia", body: "Conta-nos o produto, público e oferta. Demora menos de 1 minuto." },
  { n: "02", title: "A IA gera tudo", body: "Headline, copy, VSL, secções, FAQ e prova social em segundos." },
  { n: "03", title: "Personaliza", body: "Refina por chat ou clica para editar diretamente cada elemento." },
  { n: "04", title: "Publica", body: "Coloca online com um clique e começa a vender." },
];

export function LandingFeatures() {
  return (
    <>
      <section className="border-t border-border/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Tudo o que precisas para vender online
            </h2>
            <p className="mt-3 text-muted-foreground">
              Da geração à publicação, num só sítio.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="glass rounded-2xl p-6">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Como funciona</h2>
            <p className="mt-3 text-muted-foreground">Em 4 passos, da ideia à página publicada.</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="glass rounded-2xl p-6">
                <div className="text-xs font-mono text-primary">{s.n}</div>
                <h3 className="mt-3 text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
