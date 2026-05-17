import type { VslContent } from "@/lib/ai.functions";
import { ArrowRight, Check, ShieldCheck, Clock } from "lucide-react";

export function VslPreview({ data }: { data: VslContent }) {
  const accent = data.style?.accentColor || "#8BC53F";

  return (
    <div className="min-h-full bg-[#0b0d10] text-white">
      {/* Hero + VSL */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1
            className="text-3xl font-bold leading-tight md:text-5xl"
            style={{ color: "white" }}
          >
            {data.headline}
          </h1>
          <p className="mt-4 text-base text-white/70 md:text-lg">
            {data.subheadline}
          </p>

          {/* VSL placeholder */}
          <div className="mt-10 aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black/60 shadow-2xl">
            <div className="flex h-full w-full items-center justify-center text-white/40">
              <span className="text-sm">[ Bloco VSL — adiciona o teu vídeo ]</span>
            </div>
          </div>

          <button
            className="mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-black shadow-xl transition hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            {data.cta}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Sections */}
      {data.sections.map((s, i) => (
        <section key={i} className="border-t border-white/5 px-6 py-14">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold md:text-3xl">{s.heading}</h2>
            <p className="mt-3 text-white/70 leading-relaxed">{s.body}</p>
            {s.bullets && s.bullets.length > 0 && (
              <ul className="mt-6 space-y-3">
                {s.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} />
                    <span className="text-white/80">{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}

      {/* Testimonials */}
      {data.testimonials.length > 0 && (
        <section className="border-t border-white/5 px-6 py-14">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-semibold md:text-3xl">
              O que dizem os nossos clientes
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {data.testimonials.map((t, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-white/80">"{t.quote}"</p>
                  <div className="mt-4">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-sm text-white/50">{t.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Guarantee strip */}
      <section className="border-t border-white/5 px-6 py-12">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-6 text-center md:flex-row">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6" style={{ color: accent }} />
            <span className="text-sm text-white/70">Garantia de 7 dias</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6" style={{ color: accent }} />
            <span className="text-sm text-white/70">Acesso imediato</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      {data.faq.length > 0 && (
        <section className="border-t border-white/5 px-6 py-14">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold md:text-3xl">Perguntas frequentes</h2>
            <div className="mt-6 space-y-4">
              {data.faq.map((f, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="font-medium">{f.q}</div>
                  <p className="mt-2 text-sm text-white/70">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="border-t border-white/5 px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold md:text-4xl">Pronto para começar?</h2>
          <p className="mt-3 text-white/70">{data.subheadline}</p>
          <button
            className="mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-black shadow-xl transition hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            {data.cta}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
