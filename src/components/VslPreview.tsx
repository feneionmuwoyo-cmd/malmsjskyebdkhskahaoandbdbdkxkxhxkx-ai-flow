import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { VslContent } from "@/lib/ai.functions";
import { ArrowRight, Check, ShieldCheck, Clock, ArrowUp, ArrowDown, Trash2, Play, Star, Image as ImageIcon, Link as LinkIcon, Settings, Sparkles, Phone, Mail, MessageCircle, Globe } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
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

function resolveCtaHref(data: VslContent): string {
  const a = data.ctaAction;
  if (a) {
    if (a.type === "whatsapp") {
      const num = a.value.replace(/[^\d]/g, "");
      const msg = a.message ? `?text=${encodeURIComponent(a.message)}` : "";
      return `https://wa.me/${num}${msg}`;
    }
    if (a.type === "tel") return `tel:${a.value.replace(/\s+/g, "")}`;
    if (a.type === "email") {
      const subj = a.message ? `?subject=${encodeURIComponent(a.message)}` : "";
      return `mailto:${a.value}${subj}`;
    }
    if (a.type === "link") return a.value;
  }
  return data.ctaLink || "#";
}

export function VslPreview({ data, editable = false, onChange }: Props) {
  const accent = data.style?.accentColor || "#8BC53F";
  const bgColor = data.style?.backgroundColor || "#0b0d10";
  const bgImage = data.style?.backgroundUrl;
  const embed = getVideoEmbed(data.vslVideoUrl);
  const [ctaOpen, setCtaOpen] = useState(false);
  const [scarcityOpen, setScarcityOpen] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const slim = data.slim === true;

  // Video time-based CTA reveal (only for native files)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoTime, setVideoTime] = useState(0);

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

  // Timing logic — CTA is now always immediately below the video (no "end of page" CTA).
  // If `at-time` is selected and the video is native, button only appears after N seconds.
  const showAtSec = typeof data.ctaShowAtSeconds === "number" ? data.ctaShowAtSeconds : null;
  const isFileVideo = !!embed?.isFile;
  let ctaVisible = true;
  if (editable) {
    ctaVisible = true; // in edit mode always show so editor can interact
  } else if (data.ctaTiming === "at-time" && showAtSec !== null) {
    ctaVisible = isFileVideo ? videoTime >= showAtSec : true;
  }

  const handleCtaClick = () => {
    if (editable) { setCtaOpen(true); return; }
    const href = resolveCtaHref(data);
    if (href && href !== "#") {
      if (href.startsWith("tel:") || href.startsWith("mailto:")) {
        window.location.href = href;
      } else {
        window.open(href, "_blank");
      }
    }
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

  const effect = data.ctaStyle?.effect ?? "none";
  const size = data.ctaStyle?.size ?? "md";
  const shape = data.ctaStyle?.shape ?? "pill";
  const sizeClass = size === "sm" ? "px-5 py-2.5 text-sm" : size === "lg" ? "px-10 py-5 text-lg" : size === "xl" ? "px-12 py-6 text-xl" : "px-8 py-4 text-base";
  const shapeClass = shape === "square" ? "rounded-md" : shape === "rounded" ? "rounded-xl" : "rounded-full";
  const effectClass = effect === "pulse" ? "cta-effect-pulse" : effect === "glow" ? "cta-effect-glow" : effect === "bounce" ? "cta-effect-bounce" : effect === "shake" ? "cta-effect-shake" : "";

  const CtaButton = ({ extraClass = "" }: { extraClass?: string }) => (
    <button
      type="button"
      onClick={handleCtaClick}
      className={`inline-flex items-center gap-2 font-semibold shadow-xl transition hover:opacity-90 ${sizeClass} ${shapeClass} ${effectClass} ${extraClass}`}
      style={{ backgroundColor: accent, color: accent === "#000000" ? "#fff" : "#000" }}
    >
      <Editable as="span" value={data.cta} onSave={(v) => update({ cta: v })} />
      <ArrowRight className="h-5 w-5" />
    </button>
  );

  // Stronger overlay so text on any background image stays readable.
  const heroBg: CSSProperties = bgImage
    ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.85)), url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: bgColor };

  const textShadowStyle: CSSProperties = bgImage ? { textShadow: "0 2px 16px rgba(0,0,0,0.85)" } : {};

  // Scarcity countdown
  const sc = data.scarcity;
  const [scLeft, setScLeft] = useState<number>(() => (sc?.enabled ? sc.minutes * 60 : 0));
  useEffect(() => {
    if (!sc?.enabled) return;
    setScLeft(sc.minutes * 60);
    const t = setInterval(() => setScLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [sc?.enabled, sc?.minutes]);

  const fmtSec = (s: number) => {
    const m = Math.floor(s / 60), r = s % 60;
    return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
  };

  const clearAllExtras = () => {
    if (!confirm("Limpar tudo exceto título, vídeo e CTA?")) return;
    update({
      sections: [],
      faq: [],
      testimonials: [],
      images: [],
      videos: [],
      quiz: [],
      slim: true,
    });
  };

  return (
    <div className="min-h-full text-white" style={{ backgroundColor: bgColor }}>
      {/* Scarcity bar (header) */}
      {sc?.enabled && (
        <div className="sticky top-0 z-30 flex items-center justify-center gap-2 px-4 py-2 text-center text-xs font-medium md:text-sm"
          style={{ backgroundColor: accent, color: accent === "#000000" ? "#fff" : "#000" }}>
          <Clock className="h-4 w-4" />
          <span>{sc.text} — resta {fmtSec(scLeft)}</span>
          {typeof sc.spotsLeft === "number" && <span className="hidden md:inline">• {sc.spotsLeft} vagas</span>}
        </div>
      )}

      {/* Toolbar */}
      {editable && (
        <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/70 px-4 py-2 backdrop-blur">
          <div className="text-xs text-white/60">Modo edição — clica em qualquer texto ou no botão CTA</div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-white/60">
              Cor
              <input type="color" value={accent}
                onChange={(e) => update({ style: { ...data.style, accentColor: e.target.value } })}
                className="h-6 w-8 cursor-pointer rounded border border-white/20 bg-transparent" />
            </label>
            <label className="flex items-center gap-2 text-xs text-white/60">
              Fundo
              <input type="color" value={bgColor}
                onChange={(e) => update({ style: { ...data.style, backgroundColor: e.target.value } })}
                className="h-6 w-8 cursor-pointer rounded border border-white/20 bg-transparent" />
            </label>
            <label className="flex cursor-pointer items-center gap-1 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10">
              <ImageIcon className="h-3.5 w-3.5" />
              {uploadingBg ? "A enviar..." : "Imagem de fundo"}
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadBg(f); }} />
            </label>
            {bgImage && (
              <button type="button"
                onClick={() => update({ style: { ...data.style, backgroundUrl: undefined } })}
                className="rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10">
                Remover fundo
              </button>
            )}
            <button type="button" onClick={() => setScarcityOpen(true)}
              className="flex items-center gap-1 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10">
              <Clock className="h-3.5 w-3.5" /> Escassez
            </button>
            <button type="button" onClick={() => setCtaOpen(true)}
              className="flex items-center gap-1 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10">
              <Settings className="h-3.5 w-3.5" /> Editar CTA
            </button>
            <button type="button" onClick={clearAllExtras}
              className="flex items-center gap-1 rounded border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-200 hover:bg-amber-500/20">
              <Sparkles className="h-3.5 w-3.5" /> Modo enxuto
            </button>
            {slim && (
              <button type="button" onClick={() => update({ slim: false })}
                className="rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10">
                Sair modo enxuto
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hero — headline + video + CTA directly below the video */}
      <section className="px-6 py-16 md:py-24" style={heroBg}>
        <div className="mx-auto max-w-3xl text-center">
          <Editable
            as="h1"
            className="text-3xl font-bold leading-tight md:text-5xl"
            value={data.headline}
            onSave={(v) => update({ headline: v })}
            style={textShadowStyle}
          />
          {!slim && (
            <Editable
              as="p"
              className="mt-4 text-base text-white/80 md:text-lg"
              value={data.subheadline}
              onSave={(v) => update({ subheadline: v })}
              multiline
              style={textShadowStyle}
            />
          )}

          {/* Adaptive video — never crops */}
          <div className="relative mx-auto mt-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
            {embed ? (
              embed.isFile ? (
                <video
                  ref={videoRef}
                  src={embed.src}
                  controls
                  playsInline
                  onTimeUpdate={(e) => setVideoTime(Math.floor(e.currentTarget.currentTime))}
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
                <button type="button" onClick={() => update({ vslVideoUrl: "" })}
                  className="rounded-md bg-red-500/30 px-2 py-1 text-xs text-white hover:bg-red-500/50">
                  Remover
                </button>
              </div>
            )}
          </div>

          {/* CTA — SEMPRE diretamente por baixo do vídeo */}
          <div className={`mt-8 transition-all duration-500 ${ctaVisible ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"}`}>
            <CtaButton />
            {editable && data.ctaTiming === "at-time" && (
              <p className="mt-2 text-xs text-white/50">
                Aparece aos {showAtSec ?? 0}s {isFileVideo ? "" : "(só funciona em vídeo nativo .mp4)"}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Quiz */}
      {!slim && data.quiz && data.quiz.length > 0 && (
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
      {!slim && data.videos && data.videos.length > 0 && (
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

      {/* Image gallery */}
      {!slim && ((data.images && data.images.length > 0) || editable) && (
        <section className="border-t border-white/5 px-6 py-14">
          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 md:grid-cols-3">
            {(data.images ?? []).map((img, i) => (
              <div key={i} className="group/img relative overflow-hidden rounded-2xl border border-white/10 bg-black">
                <img src={img.url} alt={img.alt ?? ""} className="block h-full w-full object-cover transition group-hover/img:scale-105" loading="lazy" />
                {editable && (
                  <button
                    onClick={() => update({ images: (data.images ?? []).filter((_, k) => k !== i) })}
                    className="absolute right-2 top-2 rounded bg-red-500/40 p-1.5 text-white opacity-0 transition hover:bg-red-500/70 group-hover/img:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            {editable && (
              <label className="flex aspect-square cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-white/15 text-xs text-white/50 hover:border-white/40 hover:bg-white/5">
                + Adicionar foto
                <input
                  type="file" accept="image/*" className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    try {
                      const { data: sess } = await supabase.auth.getSession();
                      const uid = sess.session?.user.id; if (!uid) throw new Error("Sem sessao");
                      const path = `${uid}/img-${Date.now()}-${f.name}`;
                      const { error } = await supabase.storage.from("vsl-videos").upload(path, f);
                      if (error) throw error;
                      const { data: pub } = supabase.storage.from("vsl-videos").getPublicUrl(path);
                      update({ images: [...(data.images ?? []), { url: pub.publicUrl }] });
                    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro upload"); }
                  }}
                />
              </label>
            )}
          </div>
        </section>
      )}

      {/* Sections */}
      {!slim && data.sections.map((s, i) => (
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
      {!slim && data.testimonials.length > 0 && (
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
      {!slim && (
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
      )}

      {/* FAQ */}
      {!slim && data.faq.length > 0 && (
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

      {/* CTA edit dialog */}
      {editable && (
        <Dialog open={ctaOpen} onOpenChange={setCtaOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar botão CTA</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Texto do botão</Label>
                <Input value={data.cta} onChange={(e) => update({ cta: e.target.value })} />
              </div>

              <div>
                <Label>Tipo de ação</Label>
                <Select
                  value={data.ctaAction?.type ?? "link"}
                  onValueChange={(v) => update({ ctaAction: { type: v as "link" | "whatsapp" | "tel" | "email", value: data.ctaAction?.value ?? "", message: data.ctaAction?.message } })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link"><span className="flex items-center gap-2"><Globe className="h-3.5 w-3.5" /> Link / URL</span></SelectItem>
                    <SelectItem value="whatsapp"><span className="flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp (wa.me)</span></SelectItem>
                    <SelectItem value="tel"><span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> Telefonar</span></SelectItem>
                    <SelectItem value="email"><span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> Email</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  <LinkIcon className="h-3.5 w-3.5" />
                  {data.ctaAction?.type === "whatsapp" ? "Número WhatsApp (com indicativo)"
                    : data.ctaAction?.type === "tel" ? "Número de telefone"
                    : data.ctaAction?.type === "email" ? "Email de destino"
                    : "URL de destino"}
                </Label>
                <Input
                  placeholder={
                    data.ctaAction?.type === "whatsapp" ? "351912345678"
                    : data.ctaAction?.type === "tel" ? "+351 912 345 678"
                    : data.ctaAction?.type === "email" ? "vendas@exemplo.com"
                    : "https://checkout.exemplo.com"
                  }
                  value={data.ctaAction?.value ?? data.ctaLink ?? ""}
                  onChange={(e) => {
                    const t = (data.ctaAction?.type ?? "link") as "link" | "whatsapp" | "tel" | "email";
                    update({
                      ctaAction: { type: t, value: e.target.value, message: data.ctaAction?.message },
                      ctaLink: t === "link" ? e.target.value : data.ctaLink,
                    });
                  }}
                />
              </div>

              {(data.ctaAction?.type === "whatsapp" || data.ctaAction?.type === "email") && (
                <div>
                  <Label>{data.ctaAction.type === "email" ? "Assunto" : "Mensagem pré-preenchida"}</Label>
                  <Input
                    placeholder={data.ctaAction.type === "email" ? "Quero saber mais" : "Olá, vi a tua VSL e quero saber mais"}
                    value={data.ctaAction?.message ?? ""}
                    onChange={(e) => update({ ctaAction: { ...(data.ctaAction ?? { type: "link", value: "" }), message: e.target.value } })}
                  />
                </div>
              )}

              <div>
                <Label>Quando aparece</Label>
                <Select
                  value={data.ctaTiming ?? "always"}
                  onValueChange={(v) => update({ ctaTiming: v as VslContent["ctaTiming"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always">Sempre visível</SelectItem>
                    <SelectItem value="at-time">Aparece a um tempo específico do vídeo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {data.ctaTiming === "at-time" && (
                <div>
                  <Label>Aparece aos (segundos)</Label>
                  <Input
                    type="number" min={0}
                    value={data.ctaShowAtSeconds ?? 0}
                    onChange={(e) => update({ ctaShowAtSeconds: Math.max(0, Number(e.target.value) || 0) })}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Funciona com vídeos nativos (.mp4/.webm). YouTube/Vimeo não permite ler o tempo.</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Efeito</Label>
                  <Select value={effect} onValueChange={(v) => update({ ctaStyle: { ...data.ctaStyle, effect: v as "none" | "pulse" | "glow" | "bounce" | "shake" } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      <SelectItem value="pulse">Pulsar</SelectItem>
                      <SelectItem value="glow">Brilho</SelectItem>
                      <SelectItem value="bounce">Saltar</SelectItem>
                      <SelectItem value="shake">Tremer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Tamanho</Label>
                  <Select value={size} onValueChange={(v) => update({ ctaStyle: { ...data.ctaStyle, size: v as "sm" | "md" | "lg" | "xl" } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Pequeno</SelectItem>
                      <SelectItem value="md">Médio</SelectItem>
                      <SelectItem value="lg">Grande</SelectItem>
                      <SelectItem value="xl">Enorme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Forma</Label>
                  <Select value={shape} onValueChange={(v) => update({ ctaStyle: { ...data.ctaStyle, shape: v as "pill" | "rounded" | "square" } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pill">Pílula</SelectItem>
                      <SelectItem value="rounded">Arredondado</SelectItem>
                      <SelectItem value="square">Quadrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Cor do botão</Label>
                <input type="color" value={accent}
                  onChange={(e) => update({ style: { ...data.style, accentColor: e.target.value } })}
                  className="ml-2 h-8 w-12 cursor-pointer rounded border" />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setCtaOpen(false)}>Concluído</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Scarcity dialog */}
      {editable && (
        <Dialog open={scarcityOpen} onOpenChange={setScarcityOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Barra de escassez / contagem</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ativar barra no topo</Label>
                <Switch
                  checked={!!sc?.enabled}
                  onCheckedChange={(v) => update({ scarcity: { enabled: v, text: sc?.text ?? "Oferta termina em breve", minutes: sc?.minutes ?? 15, spotsLeft: sc?.spotsLeft } })}
                />
              </div>
              <div>
                <Label>Texto</Label>
                <Input value={sc?.text ?? ""} onChange={(e) => update({ scarcity: { enabled: sc?.enabled ?? false, text: e.target.value, minutes: sc?.minutes ?? 15, spotsLeft: sc?.spotsLeft } })} placeholder="Oferta termina em breve" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Minutos</Label>
                  <Input type="number" min={1} value={sc?.minutes ?? 15} onChange={(e) => update({ scarcity: { enabled: sc?.enabled ?? false, text: sc?.text ?? "", minutes: Math.max(1, Number(e.target.value) || 1), spotsLeft: sc?.spotsLeft } })} />
                </div>
                <div>
                  <Label>Vagas restantes (opcional)</Label>
                  <Input type="number" min={0} value={sc?.spotsLeft ?? ""} onChange={(e) => update({ scarcity: { enabled: sc?.enabled ?? false, text: sc?.text ?? "", minutes: sc?.minutes ?? 15, spotsLeft: e.target.value === "" ? undefined : Number(e.target.value) } })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setScarcityOpen(false)}>Concluído</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
