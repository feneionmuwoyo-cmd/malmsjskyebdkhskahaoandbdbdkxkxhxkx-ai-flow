import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bot, Check, MessageCircle, Paperclip, Send, UserRound } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
    type Conversation = { id: string; phone_number: string; status: string; mode: "ai" | "human"; priority: string; assigned_user_id: string | null; last_message_preview: string | null; last_message_at: string | null; unread_count: number; contact?: { name: string | null } | null };
    type Message = { id: string; message_text: string | null; direction: "inbound" | "outbound"; sender_type: string; status: string; created_at: string };

    export default function GlobalInbox() {
      const { user } = useAuth();
      const { toast } = useToast();
      const [workspaceId, setWorkspaceId] = useState<string | null>(null);
      const [conversations, setConversations] = useState<Conversation[]>([]);
      const [messages, setMessages] = useState<Message[]>([]);
      const [selectedId, setSelectedId] = useState<string | null>(null);
      const [search, setSearch] = useState("");
      const [filter, setFilter] = useState("all");
      const [draft, setDraft] = useState("");
      const [loading, setLoading] = useState(false);
      const [sending, setSending] = useState(false);

      const loadConversations = async (workspace: string) => {
        setLoading(true);
        const { data, error } = await (supabase.from("inbox_conversations") as any)
          .select("id,phone_number,status,mode,priority,assigned_user_id,last_message_preview,last_message_at,unread_count,contact:whatsapp_contacts(name)")
          .eq("workspace_id", workspace).order("last_message_at", { ascending: false }).range(0, 99);
        if (error) toast({ title: "Unable to load Inbox", description: error.message, variant: "destructive" });
        const rows = (data || []) as Conversation[];
        setConversations(rows);
        setSelectedId((current) => current && rows.some((row) => row.id === current) ? current : rows[0]?.id || null);
        setLoading(false);
      };

      useEffect(() => {
        if (!user) return;
        (supabase.from("profiles") as any).select("workspace_id").eq("user_id", user.id).maybeSingle().then(({ data }: { data: { workspace_id: string | null } | null }) => {
          if (data?.workspace_id) setWorkspaceId(data.workspace_id);
        });
      }, [user]);

      useEffect(() => {
        if (!workspaceId) return;
        void loadConversations(workspaceId);
        const channel = supabase.channel(`inbox-workspace-${workspaceId}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "inbox_conversations", filter: `workspace_id=eq.${workspaceId}` }, () => void loadConversations(workspaceId))
          .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `workspace_id=eq.${workspaceId}` }, () => void loadConversations(workspaceId))
          .subscribe();
        return () => { void supabase.removeChannel(channel); };
      }, [workspaceId]);

      useEffect(() => {
        if (!selectedId) { setMessages([]); return; }
        (supabase.from("messages") as any).select("id,message_text,direction,sender_type,status,created_at")
          .eq("conversation_id", selectedId).order("created_at", { ascending: false }).range(0, 99)
          .then(({ data }: { data: Message[] | null }) => setMessages((data || []).reverse()));
      }, [selectedId]);

      const visible = useMemo(() => conversations.filter((conversation) => {
        const label = `${conversation.contact?.name || ""} ${conversation.phone_number}`.toLowerCase();
        const matchesSearch = label.includes(search.toLowerCase()) || (conversation.last_message_preview || "").toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === "all" || (filter === "mine" && conversation.assigned_user_id === user?.id) || (filter === "unassigned" && !conversation.assigned_user_id) || (filter === "ai" && conversation.mode === "ai") || (filter === "human" && conversation.mode === "human") || conversation.status === filter;
        return matchesSearch && matchesFilter;
      }), [conversations, filter, search, user?.id]);
      const selected = conversations.find((conversation) => conversation.id === selectedId) || null;

      const action = async (name: string, extra: Record<string, unknown> = {}) => {
        if (!selectedId) return;
        const { error } = await supabase.functions.invoke("inbox-conversation-action", { body: { conversation_id: selectedId, action: name, ...extra } });
        if (error) toast({ title: "Action failed", description: error.message, variant: "destructive" });
        else if (workspaceId) void loadConversations(workspaceId);
      };

      const send = async (event: FormEvent) => {
        event.preventDefault();
        const text = draft.trim();
        if (!selectedId || !text || sending) return;
        setSending(true);
        const optimistic: Message = { id: crypto.randomUUID(), message_text: text, direction: "outbound", sender_type: "user", status: "pending", created_at: new Date().toISOString() };
        setMessages((current) => [...current, optimistic]);
        setDraft("");
        const { error } = await supabase.functions.invoke("inbox-send-message", { body: { conversation_id: selectedId, text } });
        setSending(false);
        if (error) toast({ title: "Message not sent", description: "Please try again.", variant: "destructive" });
        if (workspaceId) void loadConversations(workspaceId);
      };

      return <DashboardShell title="Shared Inbox" description="All your team's conversations in one place.">
        <Card className="grid min-h-[680px] overflow-hidden lg:grid-cols-[250px_320px_minmax(0,1fr)]">
          <aside className={`${selectedId ? "hidden lg:block" : "block"} border-r border-border bg-muted/20`}>
            <div className="border-b border-border p-4 font-semibold">Inbox</div>
            <div className="space-y-1 p-2 text-sm">
              {[['all', 'All'], ['mine', 'Mine'], ['unassigned', 'Unassigned'], ['ai', 'AI Active'], ['human', 'Human Handling'], ['open', 'Open'], ['pending', 'Pending'], ['resolved', 'Resolved']].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`w-full rounded-md px-3 py-2 text-left ${filter === value ? "bg-accent font-medium" : "hover:bg-accent/60"}`}>{label}</button>)}
            </div>
          </aside>
          <section className={`${selectedId ? "hidden lg:block" : "block"} border-r border-border`}>
            <div className="space-y-3 border-b border-border p-4"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations" /><div className="text-xs text-muted-foreground">{loading ? "Loading..." : `${visible.length} conversations`}</div></div>
            <div className="max-h-[590px] overflow-y-auto">{visible.length === 0 ? <p className="p-5 text-sm text-muted-foreground">{search ? "No results." : "No conversations yet."}</p> : visible.map((conversation) => <button key={conversation.id} onClick={() => setSelectedId(conversation.id)} className={`flex w-full gap-3 border-b border-border p-4 text-left hover:bg-accent ${selectedId === conversation.id ? "bg-accent" : ""}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><MessageCircle className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate font-medium">{conversation.contact?.name || conversation.phone_number}</span>{conversation.last_message_at && <span className="text-[10px] text-muted-foreground">{new Date(conversation.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}</span><span className="block truncate text-xs text-muted-foreground">{conversation.last_message_preview || "No messages"}</span><span className="mt-1 flex items-center gap-1 text-[10px]"><Badge variant="outline">{conversation.mode === "ai" ? "AI" : "Human"}</Badge>{conversation.assigned_user_id === user?.id && <Badge variant="secondary">Mine</Badge>}</span></span></button>)}</div>
          </section>
          <section className={`${selectedId ? "flex" : "hidden lg:flex"} min-w-0 flex-col`}>
            {!selected ? <div className="m-auto text-sm text-muted-foreground">Select a conversation</div> : <>
              <header className="flex items-center justify-between gap-3 border-b border-border p-4"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSelectedId(null)} title="Back"><ArrowLeft className="h-4 w-4" /></Button><UserRound className="hidden h-5 w-5 text-muted-foreground sm:block" /><div><div className="font-semibold">{selected.contact?.name || selected.phone_number}</div><div className="text-xs text-muted-foreground">+{selected.phone_number}</div></div></div><div className="flex flex-wrap justify-end gap-2"><Badge variant={selected.mode === "ai" ? "secondary" : "default"}>{selected.mode === "ai" ? "AI Active" : "Human Handling"}</Badge>{selected.mode === "ai" ? <Button size="sm" variant="outline" onClick={() => void action("take_over")}><UserRound className="mr-2 h-4 w-4" />Take Over</Button> : <Button size="sm" variant="outline" onClick={() => void action("resume_ai")}><Bot className="mr-2 h-4 w-4" />Resume AI</Button>}<Button size="sm" variant="outline" onClick={() => void action("change_status", { status: selected.status === "resolved" ? "open" : "resolved" })}>{selected.status === "resolved" ? "Reopen" : "Resolve"}</Button></div></header>
              <div className="flex-1 space-y-3 overflow-y-auto bg-muted/10 p-5">{messages.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No messages in this conversation.</p> : messages.map((message) => <div key={message.id} className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}><div className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm ${message.direction === "outbound" ? "bg-primary text-primary-foreground" : "bg-background shadow-sm"}`}>{message.sender_type === "ai" && <div className="mb-1 flex items-center gap-1 text-[10px] opacity-70"><Bot className="h-3 w-3" /> AI</div>}{message.message_text}<div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-60">{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{message.status === "sent" && <Check className="h-3 w-3" />}{message.status === "failed" && "Failed"}</div></div></div>)}</div>
              <form onSubmit={send} className="flex items-center gap-2 border-t border-border p-4"><Button type="button" size="icon" variant="ghost" title="Attach file"><Paperclip className="h-4 w-4" /></Button><Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={selected.mode === "human" ? "Reply to customer..." : "Write a message..."} /><Button type="submit" size="icon" disabled={!draft.trim() || sending} title="Send"><Send className="h-4 w-4" /></Button></form>
            </>}
          </section>
        </Card>
      </DashboardShell>;
    }
