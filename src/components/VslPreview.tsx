import { useState, type CSSProperties } from "react";
import type { VslContent } from "@/lib/ai.functions";
import { ArrowRight, Check, ShieldCheck, Clock, ArrowUp, ArrowDown, Trash2, Play, Star, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { VideoPickerButton } from "@/components/VideoPicker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  data: VslContent;
  editable?: boolean;
  onChange?: (next: VslContent) => void;
};

function getVideoEmbed(url?: string): { src: string; isFile: boolean; isVertical?: boolean } | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return { src: `https://www.youtube.com/embed/${u.pathname.slice(1)}`, isFile: false };
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.includes("/shorts/")) {
        const id = u.pathname.split("/shorts/")[1]?.split("/")[0];
        return { src: `https://www.youtube.com/embed/${id}`, isFile: false, isVertical: true };
      }
      const v = u.searchParams.get("v");
      if (v) return { src: `https://www.youtube.com/embed/${v}`, isFile: false };
    }
    if (u.hostname.includes("vimeo.com")) {
      return { src: `https://player.vimeo.com/video/${u.pathname.split("/").pop()}`, isFile: false };
    }
    if (u.hostname.includes("drive.google.com")) {
      const m = url.match(/\/d\/([^/]+)/);
      if (m) return { src: `https://drive.google.com/file/d/${m[1]}/preview`, isFile: false };
    }
  } catch { /* ignore */ }
  return { src: url, isFile: /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes("supabase") };
}

export function VslPreview({ data, editable = false, onChange }: Props) {
  const accent = data.style?.accentColor || "#8BC53F";
  const bgColor = data.style?.backgroundColor || "#0b0d10";
  const bgImage = data.style?.backgroundUrl;
  const embed = getVideoEmbed(data.vslVideoUrl);
  const [ctaOpen, setCtaOpen] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

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
    style?: CSSProperties;
    multiline?: boolean;
  }) => {
    const Tag = as as "span";
    if (!editable) return <Tag className={className} style={style}>{value}</Tag>;
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

  const ctaTiming = data.ctaTiming || "always";
  const showCtaTop = ctaTiming === "start" || ctaTiming === "always";
  const showCtaBottom = ctaTiming === "end" || ctaTiming === "middle" || ctaTiming === "always";

  const handleCtaClick = () => {
    if (editable) { setCtaOpen(true); return; }
    if (data.ctaLink) window.open(data.ctaLink, "_blank");
  };

  const uploadBg = async (file: File) => {
    setUploadingBg(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) throw new Error("Sem sessão");
      const path = `${uid}/bg-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("vsl-videos").upload(path, file);
      if (error) throw error;
      const { data: pub } = supabase.storage.from("vsl-videos").getPublicUrl(path);
      update({ style: { ...data.style, backgroundUrl: pub.publicUrl } });
      toast.success("Fundo atualizado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no upload");
    } finally { setUploadingBg(false); }
  };

  const CtaButton = ({ extraClass = "" }: { extraClass?: string }) => (
    <button
      type="button"
      onClick={handleCtaClick}
      className={`inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-black shadow-xl transition hover:opacity-90 ${extraClass}`}
      style={{ backgroundColor: accent }}
    >
      <Editable as="span" value={data.cta} onSave={(v) => update({ cta: v })} />
      <ArrowRight className="h-5 w-5" />
    </button>
  );

  const heroBg: CSSProperties = bgImage
    ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.75)), url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: bgColor };

  return (
    <div className="min-h-full text-white" style={{ backgroundColor: bgColor }}>
      {/* Toolbar */}
      {editable && (
        <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/70 px-4 py-2 backdrop-blur">
          <div className="text-xs text-white/60">Modo edição visual — clica em texto ou no botão CTA</div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-white/60">
              Cor
              <input
                type="color"
                value={accent}
                onChange={(e) => update({ style: { ...data.style, accentColor: e.target.value } })}
                className="h-6 w-8 cursor-pointer rounded border border-white/20 bg-transparent"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-white/60">
              Fundo
              <input
                type="color"
                value={bgColor}
                onChange={(e) => update({ style: { ...data.style, backgroundColor: e.target.value } })}
                className="h-6 w-8 cursor-pointer rounded border border-white/20 bg-transparent"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-1 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10">
              <ImageIcon className="h-3.5 w-3.5" />
              {uploadingBg ? "A enviar..." : "Imagem de fundo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadBg(f); }}
              />
            </label>
            {bgImage && (
              <button
                type="button"
                onClick={() => update({ style: { ...data.style, backgroundUrl: undefined } })}
                className="rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
              >
                Remover fundo
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="px-6 py-16 md:py-24" style={heroBg}>
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

          {/* Adaptive video — never crops */}
          <div className="relative mx-auto mt-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
            {embed ? (
              embed.isFile ? (
                <video
                  src={embed.src}
                  controls
                  playsInline
                  className="block max-h-[80vh] w-full bg-black object-contain"
                />
              ) : (
                <div className="relative w-full" style={{ paddingTop: embed.isVertical ? "177.78%" : "56.25%" }}>
                  <iframe
                    src={embed.src}
                    className="absolute inset-0 h-full w-full"
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                </div>
              )
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 text-white/40">
                <Play className="h-8 w-8" />
                <span className="text-sm">[ Bloco VSL — adiciona o teu vídeo ]</span>
                {editable && <VideoPickerButton onPicked={(url) => update({ vslVideoUrl: url })} />}
              </div>
            )}
            {editable && embed && (
              <div className="absolute right-2 top-2 flex gap-1">
                <VideoPickerButton onPicked={(url) => update({ vslVideoUrl: url })} label="Trocar" />
                <button
                  type="button"
                  onClick={() => update({ vslVideoUrl: "" })}
                  className="rounded-md bg-red-500/30 px-2 py-1 text-xs text-white hover:bg-red-500/50"
                >
                  Remover
                </button>
              </div>
            )}
          </div>

          {showCtaTop && <div className="mt-8"><CtaButton /></div>}
        </div>
      </section>

      {/* Quiz */}
      {data.quiz && data.quiz.length > 0 && (
        <section className="border-t border-white/5 px-6 py-14">
          <div className="mx-auto max-w-2xl space-y-6">
            <h2 className="text-center text-2xl font-semibold md:text-3xl">Responde para ver a tua oferta</h2>
            {data.quiz.map((q, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="font-medium">{i + 1}. {q.question}</div>
                <div className="mt-3 grid gap-2">
                  {q.options.map((o, j) => (
                    <button key={j} className="rounded-lg border border-white/10 px-3 py-2 text-left text-sm text-white/80 hover:border-white/30 hover:bg-white/5">{o}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Extra videos */}
      {data.videos && data.videos.length > 0 && (
        <section className="border-t border-white/5 px-6 py-14">
          <div className="mx-auto max-w-3xl space-y-8">
            {data.videos.map((v, i) => {
              const e = getVideoEmbed(v.url);
              if (!e) return null;
              return (
                <div key={i}>
                  {v.title && <h3 className="mb-3 text-lg font-semibold">{v.title}</h3>}
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                    {e.isFile ? (
                      <video src={e.src} controls playsInline className="block max-h-[80vh] w-full object-contain" />
                    ) : (
                      <div className="relative w-full" style={{ paddingTop: e.isVertical ? "177.78%" : "56.25%" }}>
                        <iframe src={e.src} className="absolute inset-0 h-full w-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Sections */}
      {data.sections.map((s, i) => (
        <section key={i} className="group relative border-t border-white/5 px-6 py-14">
          {editable && (
            <div className="pointer-events-none absolute right-4 top-4 z-10 flex gap-1 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100">
              <button onClick={() => moveSection(i, -1)} className="rounded bg-white/10 p-1.5 text-white hover:bg-white/20"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button onClick={() => moveSection(i, 1)} className="rounded bg-white/10 p-1.5 text-white hover:bg-white/20"><ArrowDown className="h-3.5 w-3.5" /></button>
              <button onClick={() => removeSection(i)} className="rounded bg-red-500/30 p-1.5 text-white hover:bg-red-500/50"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          )}
          <div className="mx-auto max-w-3xl">
            <Editable as="h2" className="text-2xl font-semibold md:text-3xl" value={s.heading}
              onSave={(v) => { const n = [...data.sections]; n[i] = { ...n[i], heading: v }; update({ sections: n }); }} />
            <Editable as="p" className="mt-3 block text-white/70 leading-relaxed" value={s.body} multiline
              onSave={(v) => { const n = [...data.sections]; n[i] = { ...n[i], body: v }; update({ sections: n }); }} />
            {s.bullets && s.bullets.length > 0 && (
              <ul className="mt-6 space-y-3">
                {s.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} />
                    <Editable as="span" className="block flex-1 text-white/80" value={b} multiline
                      onSave={(v) => { const n = [...data.sections]; const bl = [...(n[i].bullets ?? [])]; bl[j] = v; n[i] = { ...n[i], bullets: bl }; update({ sections: n }); }} />
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
              {data.testimonials.map((t, i) => {
                const rating = t.rating ?? 5;
                const seed = encodeURIComponent(t.name || `client-${i}`);
                const avatar = t.avatarUrl || `https://i.pravatar.cc/96?u=${seed}`;
                return (
                  <div key={i} className="group/t relative rounded-2xl border border-white/10 bg-white/5 p-6">
                    {editable && (
                      <button
                        onClick={() => update({ testimonials: data.testimonials.filter((_, k) => k !== i) })}
                        className="absolute right-2 top-2 rounded bg-red-500/30 p-1.5 text-white opacity-0 transition hover:bg-red-500/50 group-hover/t:opacity-100"
                        title="Remover testemunho"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <div className="flex items-center gap-3">
                      <img src={avatar} alt={t.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-white/10" />
                      <div>
                        <Editable as="div" className="font-medium" value={t.name}
                          onSave={(v) => { const n = [...data.testimonials]; n[i] = { ...n[i], name: v }; update({ testimonials: n }); }} />
                        <Editable as="div" className="text-xs text-white/50" value={t.role}
                          onSave={(v) => { const n = [...data.testimonials]; n[i] = { ...n[i], role: v }; update({ testimonials: n }); }} />
                      </div>
                    </div>
                    <div className="mt-3 flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, k) => (
                        <Star
                          key={k}
                          className={`h-4 w-4 ${k < rating ? "fill-yellow-400 text-yellow-400" : "text-white/20"} ${editable ? "cursor-pointer" : ""}`}
                          onClick={() => {
                            if (!editable) return;
                            const n = [...data.testimonials];
                            n[i] = { ...n[i], rating: k + 1 };
                            update({ testimonials: n });
                          }}
                        />
                      ))}
                    </div>
                    <Editable as="p" className="mt-4 block text-white/80" value={t.quote} multiline
                      onSave={(v) => { const n = [...data.testimonials]; n[i] = { ...n[i], quote: v }; update({ testimonials: n }); }} />
                  </div>
                );
              })}
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
                  <Editable as="div" className="font-medium" value={f.q}
                    onSave={(v) => { const n = [...data.faq]; n[i] = { ...n[i], q: v }; update({ faq: n }); }} />
                  <Editable as="p" className="mt-2 block text-sm text-white/70" value={f.a} multiline
                    onSave={(v) => { const n = [...data.faq]; n[i] = { ...n[i], a: v }; update({ faq: n }); }} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      {showCtaBottom && (
        <section className="border-t border-white/5 px-6 py-16 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold md:text-4xl">Pronto para começar?</h2>
            <p className="mt-3 text-white/70">{data.subheadline}</p>
            <div className="mt-8"><CtaButton /></div>
          </div>
        </section>
      )}

      {/* CTA edit dialog */}
      {editable && (
        <Dialog open={ctaOpen} onOpenChange={setCtaOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar botão CTA</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Texto do botão</Label>
                <Input value={data.cta} onChange={(e) => update({ cta: e.target.value })} />
              </div>
              <div>
                <Label className="flex items-center gap-1"><LinkIcon className="h-3.5 w-3.5" /> Link de destino</Label>
                <Input
                  type="url"
                  placeholder="https://checkout.exemplo.com"
                  value={data.ctaLink ?? ""}
                  onChange={(e) => update({ ctaLink: e.target.value })}
                />
              </div>
              <div>
                <Label>Quando aparece</Label>
                <Select
                  value={ctaTiming}
                  onValueChange={(v) => update({ ctaTiming: v as VslContent["ctaTiming"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start">Desde o início (topo)</SelectItem>
                    <SelectItem value="middle">A meio do vídeo</SelectItem>
                    <SelectItem value="end">Apenas no fim</SelectItem>
                    <SelectItem value="always">Sempre visível</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cor do botão</Label>
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => update({ style: { ...data.style, accentColor: e.target.value } })}
                  className="ml-2 h-8 w-12 cursor-pointer rounded border"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setCtaOpen(false)}>Concluído</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
