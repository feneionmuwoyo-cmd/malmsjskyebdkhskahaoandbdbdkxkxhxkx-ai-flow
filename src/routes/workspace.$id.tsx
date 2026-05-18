import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUp, Eye, Loader2, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getProject, updateProjectContent } from "@/lib/projects.functions";
import { editVsl, type VslContent } from "@/lib/ai.functions";
import { VslPreview } from "@/components/VslPreview";
import { toast } from "sonner";
import logo from "@/assets/feneion-logo.png";

export const Route = createFileRoute("/workspace/$id")({
  component: WorkspacePage,
});

type ChatMsg = { role: "user" | "assistant"; content: string };

function WorkspacePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const fetchProject = useServerFn(getProject);
  const editFn = useServerFn(editVsl);
  const saveFn = useServerFn(updateProjectContent);

  const [content, setContent] = useState<VslContent | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "A tua VSL está pronta. Diz-me o que queres mudar — cores, headline, urgência, prova social..." },
  ]);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [editMode, setEditMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate({ to: "/login", search: { redirect: `/workspace/${id}` } });
        return;
      }
      try {
        const proj = await fetchProject({ data: { id } });
        if (cancelled) return;
        setContent(proj.content as VslContent);
        setTitle(proj.title);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Não foi possível abrir o projeto");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, navigate, fetchProject]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const value = input.trim();
    if (!value || !content || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: value }]);
    setBusy(true);
    try {
      const updated = await editFn({ data: { current: content, instruction: value } });
      setContent(updated);
      await saveFn({ data: { id, content: updated, title: updated.title } });
      setMessages((m) => [...m, { role: "assistant", content: "Feito. Vê o preview ao lado." }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao aplicar mudança";
      setMessages((m) => [...m, { role: "assistant", content: msg }]);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Projeto não encontrado
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-background md:flex-row">
      {/* Chat panel */}
      <aside className="flex h-1/2 w-full flex-col border-b border-border bg-sidebar md:h-full md:w-[380px] md:border-b-0 md:border-r">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logo} alt="feneion" className="h-8 w-auto" />
          </Link>
          <div className="truncate text-xs text-muted-foreground">{title}</div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground"
                  : "max-w-[90%] rounded-2xl bg-card px-3 py-2 text-sm text-card-foreground"
              }
            >
              {m.content}
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> A pensar...
            </div>
          )}
        </div>

        <div className="border-t border-border/60 p-3">
          <div className="glass rounded-2xl p-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="deixa mais premium, troca as cores para azul, adiciona urgência..."
              className="min-h-[60px] w-full resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground/70"
            />
            <div className="flex items-center justify-end gap-2 px-1">
              <Button
                size="icon"
                disabled={busy || !input.trim()}
                onClick={send}
                className="h-8 w-8 rounded-full bg-gradient-primary text-primary-foreground hover:opacity-90"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Preview */}
      <section className="flex h-1/2 flex-1 flex-col md:h-full">
        <div className="flex items-center justify-between border-b border-border/60 bg-card/40 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="mr-1 h-3.5 w-3.5" /> Preview
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full border border-border bg-background p-0.5">
              <button
                type="button"
                onClick={() => setDevice("desktop")}
                className={`flex h-7 w-8 items-center justify-center rounded-full ${device === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                aria-label="Desktop"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDevice("mobile")}
                className={`flex h-7 w-8 items-center justify-center rounded-full ${device === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                aria-label="Mobile"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>
            <Button
              size="sm"
              variant={editMode ? "default" : "outline"}
              onClick={() => setEditMode((v) => !v)}
              className={editMode ? "bg-primary text-primary-foreground" : ""}
            >
              {editMode ? "Sair edição" : "Visual edits"}
            </Button>
            <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90" disabled>
              Publicar
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#0b0d10] p-4">
          <div
            className={`mx-auto overflow-hidden rounded-xl shadow-elegant transition-all ${
              device === "mobile" ? "max-w-[390px]" : "max-w-full"
            }`}
          >
            <VslPreview
              data={content}
              editable={editMode}
              onChange={(next) => {
                setContent(next);
                if (saveTimer.current) clearTimeout(saveTimer.current);
                saveTimer.current = setTimeout(() => {
                  void saveFn({ data: { id, content: next, title: next.title } });
                }, 600);
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
