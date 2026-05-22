import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Perfil — feneion" },
      { name: "description", content: "Edita o teu nome, avatar e dados pessoais na feneion." },
      { property: "og:title", content: "Perfil — feneion" },
      { property: "og:description", content: "Gere a tua conta feneion." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate({ to: "/login", search: { redirect: "/profile" } });
        return;
      }
      setEmail(data.session.user.email ?? "");
      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", data.session.user.id)
        .maybeSingle();
      setDisplayName(prof?.display_name ?? "");
      setLoading(false);
    })();
  }, [navigate]);

  const save = async () => {
    setSaving(true);
    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user.id;
    if (!uid) return;
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("user_id", uid);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Perfil atualizado");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1">
          <header className="flex h-12 items-center border-b border-border/60 px-4">
            <SidebarTrigger />
          </header>
          <main className="mx-auto max-w-2xl p-6">
            <h1 className="text-2xl font-semibold tracking-tight">Editar perfil</h1>
            <p className="mt-1 text-sm text-muted-foreground">Atualiza os teus dados.</p>

            {loading ? (
              <div className="mt-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : (
              <div className="mt-8 space-y-5">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={email} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Nome a apresentar</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="O teu nome" />
                </div>
                <Button onClick={save} disabled={saving} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                  {saving ? "A guardar..." : "Guardar alterações"}
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
