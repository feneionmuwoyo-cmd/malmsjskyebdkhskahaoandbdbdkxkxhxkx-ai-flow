import { Play, Check } from "lucide-react";
import type { Template } from "@/data/templates";

/**
 * Mini-render fiel do design da template — funciona como "screenshot real"
 * porque renderiza os mesmos elementos visuais que o utilizador verá.
 */
export function TemplateCover({ template }: { template: Template }) {
  const c = template.content;
  const accent = c.style.accentColor;

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/10 bg-[#0b0d10]">
      {/* Fundo com gradiente sutil baseado no accent */}
      <div
        className="absolute inset-0 opacity-20"
        style={{ background: `radial-gradient(ellipse at top, ${accent} 0%, transparent 60%)` }}
      />

      <div className="relative flex h-full flex-col p-3">
        {/* Barra superior fake (browser chrome) */}
        <div className="mb-2 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
        </div>

        {/* Headline */}
        <div className="text-center">
          <div className="mx-auto line-clamp-2 max-w-[90%] text-[10px] font-bold leading-tight text-white sm:text-xs">
            {c.headline}
          </div>
          <div className="mx-auto mt-1 line-clamp-1 max-w-[80%] text-[7px] text-white/60 sm:text-[9px]">
            {c.subheadline}
          </div>
        </div>

        {/* Bloco VSL */}
        <div className="mx-auto mt-2 flex aspect-video w-[78%] items-center justify-center rounded-md border border-white/10 bg-black/60">
          <div
            className="flex h-5 w-5 items-center justify-center rounded-full"
            style={{ backgroundColor: accent }}
          >
            <Play className="h-2.5 w-2.5 text-black" fill="currentColor" />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-2 flex justify-center">
          <div
            className="rounded-full px-3 py-1 text-[7px] font-semibold text-black sm:text-[9px]"
            style={{ backgroundColor: accent }}
          >
            {c.cta}
          </div>
        </div>

        {/* Bullets mini */}
        <div className="mt-auto space-y-0.5 pt-2">
          {(c.sections.find((s) => s.bullets?.length)?.bullets ?? []).slice(0, 2).map((b, i) => (
            <div key={i} className="flex items-center gap-1">
              <Check className="h-2 w-2 shrink-0" style={{ color: accent }} />
              <span className="line-clamp-1 text-[7px] text-white/70 sm:text-[8px]">{b}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
