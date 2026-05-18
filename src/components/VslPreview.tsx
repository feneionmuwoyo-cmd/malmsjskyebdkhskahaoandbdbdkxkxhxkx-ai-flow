import type * as React from "react";
import type { VslContent } from "@/lib/ai.functions";
import { ArrowRight, Check, ShieldCheck, Clock, ArrowUp, ArrowDown, Trash2, Play } from "lucide-react";

type Props = {
  data: VslContent;
  editable?: boolean;
  onChange?: (next: VslContent) => void;
};

function getYoutubeEmbed(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname.includes("vimeo.com")) return `https://player.vimeo.com/video/${u.pathname.split("/").pop()}`;
  } catch { /* ignore */ }
  return url;
}

export function VslPreview({ data, editable = false, onChange }: Props) {
  const accent = data.style?.accentColor || "#8BC53F";
  const embed = getYoutubeEmbed(data.vslVideoUrl);

  const update = (patch: Partial<VslContent>) => onChange?.({ ...data, ...patch });

  type EditableTag = "span" | "p" | "h1" | "h2" | "h3" | "div";
  const Editable = ({
    as = "span",
    value,
    onSave,
    className,
    style,
    multiline = false,
  }: {
    as?: EditableTag;
    value: string;
    onSave: (v: string) => void;
    className?: string;
    style?: React.CSSProperties;
    multiline?: boolean;
  }) => {
    const Tag = as as "span";
    if (!editable) {
      return <Tag className={className} style={style}>{value}</Tag>;
    }
    return (
      <Tag
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onBlur={(e) => {
          const text = (e.currentTarget as HTMLElement).innerText;
          const next = multiline ? text : text.replace(/\n/g, " ");
          if (next !== value) onSave(next);
        }}
        onKeyDown={(e) => {
          if (!multiline && e.key === "Enter") {
            e.preventDefault();
            (e.currentTarget as HTMLElement).blur();
          }
        }}
        className={`${className ?? ""} outline-none rounded-md hover:ring-2 hover:ring-[color:var(--ed-accent)]/40 focus:ring-2 focus:ring-[color:var(--ed-accent)]`}
        style={{ ...(style ?? {}), ["--ed-accent" as never]: accent }}
      >
        {value}
      </Tag>
    );
  };

  const moveSection = (i: number, dir: -1 | 1) => {
    const next = [...data.sections];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    update({ sections: next });
  };
  const removeSection = (i: number) => update({ sections: data.sections.filter((_, k) => k !== i) });

  return (
    <div className="min-h-full bg-[#0b0d10] text-white">
      {/* Editor toolbar */}
      {editable && (
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-black/70 px-4 py-2 backdrop-blur">
          <div className="text-xs text-white/60">Modo edição visual — clica em qualquer texto</div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-white/60">
              Cor
              <input
                type="color"
                value={accent}
                onChange={(e) => update({ style: { ...data.style, accentColor: e.target.value } })}
                className="h-6 w-8 cursor-pointer rounded border border-white/20 bg-transparent"
              />
            </label>
            <input
              type="url"
              value={data.vslVideoUrl ?? ""}
              onChange={(e) => update({ vslVideoUrl: e.target.value })}
              placeholder="URL do vídeo VSL (YouTube, Vimeo, mp4)"
              className="w-72 max-w-[40vw] rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none placeholder:text-white/40"
            />
          </div>
        </div>
      )}

      {/* Hero + VSL */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Editable
            as="h1"
            className="text-3xl font-bold leading-tight md:text-5xl"
            value={data.headline}
            onSave={(v) => update({ headline: v })}
          />
          <Editable
            as="p"
            className="mt-4 text-base text-white/70 md:text-lg"
            value={data.subheadline}
            onSave={(v) => update({ subheadline: v })}
            multiline
          />

          <div className="mt-10 aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black/60 shadow-2xl">
            {embed ? (
              embed.match(/\.(mp4|webm|mov)(\?|$)/i) ? (
                <video src={embed} controls className="h-full w-full object-cover" />
              ) : (
                <iframe src={embed} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
              )
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/40">
                <Play className="h-8 w-8" />
                <span className="text-sm">{editable ? "Cola o URL do vídeo na barra acima" : "[ Bloco VSL — adiciona o teu vídeo ]"}</span>
              </div>
            )}
          </div>

          <button
            className="mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-black shadow-xl transition hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            <Editable as="span" value={data.cta} onSave={(v) => update({ cta: v })} />
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Sections */}
      {data.sections.map((s, i) => (
        <section key={i} className="group relative border-t border-white/5 px-6 py-14">
          {editable && (
            <div className="pointer-events-none absolute right-4 top-4 z-10 flex gap-1 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100">
              <button onClick={() => moveSection(i, -1)} className="rounded bg-white/10 p-1.5 text-white hover:bg-white/20" title="Subir"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button onClick={() => moveSection(i, 1)} className="rounded bg-white/10 p-1.5 text-white hover:bg-white/20" title="Descer"><ArrowDown className="h-3.5 w-3.5" /></button>
              <button onClick={() => removeSection(i)} className="rounded bg-red-500/30 p-1.5 text-white hover:bg-red-500/50" title="Remover"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          )}
          <div className="mx-auto max-w-3xl">
            <Editable
              as="h2"
              className="text-2xl font-semibold md:text-3xl"
              value={s.heading}
              onSave={(v) => {
                const next = [...data.sections];
                next[i] = { ...next[i], heading: v };
                update({ sections: next });
              }}
            />
            <Editable
              as="p"
              className="mt-3 block text-white/70 leading-relaxed"
              value={s.body}
              onSave={(v) => {
                const next = [...data.sections];
                next[i] = { ...next[i], body: v };
                update({ sections: next });
              }}
              multiline
            />
            {s.bullets && s.bullets.length > 0 && (
              <ul className="mt-6 space-y-3">
                {s.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} />
                    <Editable
                      as="span"
                      className="block flex-1 text-white/80"
                      value={b}
                      onSave={(v) => {
                        const next = [...data.sections];
                        const bullets = [...(next[i].bullets ?? [])];
                        bullets[j] = v;
                        next[i] = { ...next[i], bullets };
                        update({ sections: next });
                      }}
                      multiline
                    />
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
            <h2 className="text-center text-2xl font-semibold md:text-3xl">O que dizem os nossos clientes</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {data.testimonials.map((t, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <Editable
                    as="p"
                    className="block text-white/80"
                    value={t.quote}
                    onSave={(v) => {
                      const next = [...data.testimonials];
                      next[i] = { ...next[i], quote: v };
                      update({ testimonials: next });
                    }}
                    multiline
                  />
                  <div className="mt-4">
                    <Editable
                      as="div"
                      className="font-medium"
                      value={t.name}
                      onSave={(v) => {
                        const next = [...data.testimonials];
                        next[i] = { ...next[i], name: v };
                        update({ testimonials: next });
                      }}
                    />
                    <Editable
                      as="div"
                      className="text-sm text-white/50"
                      value={t.role}
                      onSave={(v) => {
                        const next = [...data.testimonials];
                        next[i] = { ...next[i], role: v };
                        update({ testimonials: next });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Guarantee */}
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
                  <Editable
                    as="div"
                    className="font-medium"
                    value={f.q}
                    onSave={(v) => {
                      const next = [...data.faq];
                      next[i] = { ...next[i], q: v };
                      update({ faq: next });
                    }}
                  />
                  <Editable
                    as="p"
                    className="mt-2 block text-sm text-white/70"
                    value={f.a}
                    onSave={(v) => {
                      const next = [...data.faq];
                      next[i] = { ...next[i], a: v };
                      update({ faq: next });
                    }}
                    multiline
                  />
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
