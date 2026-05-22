import { createFileRoute } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const Route = createFileRoute("/billing")({
  head: () => ({
    meta: [
      { title: "Planos e faturação — feneion" },
      { name: "description", content: "Escolhe o plano feneion ideal para o teu negócio. Pagamento em Kz." },
      { property: "og:title", content: "Planos feneion — Grátis, Pro e Business" },
      { property: "og:description", content: "Planos com pagamento em kwanzas, sem cartão internacional." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: BillingPage,
});

const PLANS = [
  {
    name: "Grátis",
    price: "0 Kz",
    period: "/mês",
    features: ["1 projeto", "Edições por IA limitadas", "Marca feneion no rodapé"],
    cta: "Plano atual",
    disabled: true,
  },
  {
    name: "Pro",
    price: "9.900 Kz",
    period: "/mês",
    features: ["Projetos ilimitados", "IA sem limites", "Pagamento Express", "Sem marca"],
    cta: "Assinar Pro",
    featured: true,
  },
  {
    name: "Business",
    price: "29.900 Kz",
    period: "/mês",
    features: ["Tudo do Pro", "Domínio personalizado", "Suporte prioritário", "Analytics avançado"],
    cta: "Assinar Business",
  },
];

function BillingPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1">
          <header className="flex h-12 items-center border-b border-border/60 px-4">
            <SidebarTrigger />
          </header>
          <main className="mx-auto max-w-5xl p-6">
            <div className="text-center">
              <h1 className="text-3xl font-semibold tracking-tight">Escolhe o teu plano</h1>
              <p className="mt-2 text-sm text-muted-foreground">Cancela a qualquer momento.</p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {PLANS.map((p) => (
                <div
                  key={p.name}
                  className={`glass rounded-2xl p-6 ${p.featured ? "border-primary/60 shadow-glow" : ""}`}
                >
                  <div className="text-sm font-medium text-muted-foreground">{p.name}</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-semibold">{p.price}</span>
                    <span className="text-sm text-muted-foreground">{p.period}</span>
                  </div>
                  <ul className="mt-5 space-y-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    disabled={p.disabled}
                    className={`mt-6 w-full ${p.featured ? "bg-gradient-primary text-primary-foreground hover:opacity-90" : ""}`}
                    variant={p.featured ? "default" : "outline"}
                  >
                    {p.cta}
                  </Button>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              Pagamentos em kwanzas via transferência. O método de pagamento integrado chega em breve.
            </p>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
