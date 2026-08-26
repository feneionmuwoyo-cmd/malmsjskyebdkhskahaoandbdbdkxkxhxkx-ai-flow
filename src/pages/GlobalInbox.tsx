import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bot, Check, MessageCircle, Paperclip, Send, UserRound } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { GLOBAL_MARKET } from "@/lib/market";

type Contact = { phone_number: string; name: string | null; last_message_at: string | null };
type Message = { id: string; phone_number: string; message_text: string | null; direction: "inbound" | "outbound"; created_at: string };

export default function GlobalInbox() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await (supabase.from("whatsapp_contacts") as any).select("phone_number,name,last_message_at").eq("user_id", user.id).eq("market", GLOBAL_MARKET).order("last_message_at", { ascending: false });
    const next = (data || []) as Contact[];
    setContacts(next);
    if (!selectedPhone && next[0]) setSelectedPhone(next[0].phone_number);
  };

  useEffect(() => { void load(); }, [user]);
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`global-inbox-${user.id}`).on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `user_id=eq.${user.id}` }, () => void load()).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user]);
  useEffect(() => {
    if (!user || !selectedPhone) return;
    (supabase.from("messages") as any).select("id,phone_number,message_text,direction,created_at").eq("user_id", user.id).eq("market", GLOBAL_MARKET).eq("phone_number", selectedPhone).order("created_at", { ascending: true }).then(({ data }: { data: Message[] | null }) => setMessages(data || []));
  }, [user, selectedPhone]);

  const selected = useMemo(() => contacts.find((contact) => contact.phone_number === selectedPhone), [contacts, selectedPhone]);
  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !selectedPhone || !draft.trim()) return;
    const { data: instance } = await (supabase.from("instances") as any).select("instance_name").eq("user_id", user.id).eq("market", GLOBAL_MARKET).maybeSingle();
    const { error } = await supabase.functions.invoke("evolution-api", { body: { action: "sendText", instanceName: instance?.instance_name, phoneNumber: selectedPhone, text: draft.trim() } });
    if (error) toast({ title: "Message not sent", description: error.message, variant: "destructive" }); else { setDraft(""); setMessages((current) => [...current, { id: crypto.randomUUID(), phone_number: selectedPhone, message_text: draft.trim(), direction: "outbound", created_at: new Date().toISOString() }]); }
  };

  return <DashboardShell title="Shared Inbox" description="Real-time conversations for your global team.">
    <Card className="grid min-h-[620px] overflow-hidden lg:grid-cols-[300px_1fr]">
      <div className="border-r border-border bg-muted/20"><div className="border-b border-border p-4 font-semibold">Conversations</div>{contacts.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p> : contacts.map((contact) => <button key={contact.phone_number} onClick={() => setSelectedPhone(contact.phone_number)} className={`flex w-full gap-3 border-b border-border p-4 text-left hover:bg-accent ${selectedPhone === contact.phone_number ? "bg-accent" : ""}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><MessageCircle className="h-4 w-4" /></span><span className="min-w-0"><span className="block truncate font-medium">{contact.name || contact.phone_number}</span><span className="block truncate text-xs text-muted-foreground">{contact.phone_number}</span></span></button>)}</div>
      <div className="flex min-w-0 flex-col"><div className="flex items-center justify-between border-b border-border p-4"><div className="flex items-center gap-3"><UserRound className="h-5 w-5 text-muted-foreground" /><div><div className="font-semibold">{selected?.name || selectedPhone || "Select a conversation"}</div><div className="text-xs text-muted-foreground">{selectedPhone || "Waiting for WhatsApp contacts"}</div></div></div>{selectedPhone && <Button variant={aiEnabled ? "outline" : "default"} size="sm" onClick={() => setAiEnabled((value) => !value)}>{aiEnabled ? <Bot className="mr-2 h-4 w-4" /> : <UserRound className="mr-2 h-4 w-4" />}{aiEnabled ? "AI ON" : "HUMAN MODE"}</Button>}</div><div className="flex-1 space-y-3 overflow-y-auto bg-muted/10 p-5">{messages.map((message) => <div key={message.id} className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}><div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${message.direction === "outbound" ? "bg-primary text-primary-foreground" : "bg-background shadow-sm"}`}>{message.message_text}<div className="mt-1 text-[10px] opacity-60">{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div></div></div>)}</div><form onSubmit={send} className="flex items-center gap-2 border-t border-border p-4"><Button type="button" size="icon" variant="ghost" title="Attach file"><Paperclip className="h-4 w-4" /></Button><Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message..." disabled={!selectedPhone} /><Button type="submit" size="icon" disabled={!selectedPhone || !draft.trim()} title="Send message"><Send className="h-4 w-4" /></Button></form></div>
    </Card>
  </DashboardShell>;
}
