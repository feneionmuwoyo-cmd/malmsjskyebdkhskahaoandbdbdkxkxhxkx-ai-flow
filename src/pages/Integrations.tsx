import { CalendarDays, CheckCircle2, Globe2, ShoppingBag, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import DashboardShell from "@/components/DashboardShell";

const integrations = [
  { name: "Shopify", description: "Sync products and orders with your Shopify store.", icon: ShoppingBag, status: "Available" },
  { name: "WooCommerce", description: "Keep your catalogue and order flow connected.", icon: Globe2, status: "Available" },
  { name: "HubSpot", description: "Send contacts and conversations to your CRM.", icon: UsersRound, status: "Available" },
  { name: "Google Calendar", description: "Sync appointments while keeping Muwoyo as your default calendar.", icon: CalendarDays, status: "Available" },
];

export default function Integrations() {
  const { toast } = useToast();
  const connect = (name: string) => toast({ title: `${name} connection started`, description: "Add the provider credentials to the Supabase Edge Function secrets to finish setup." });

  return (
    <DashboardShell title="Integrations" description="Connect the tools your global team already uses.">
      <div className="grid gap-5 md:grid-cols-2">
        {integrations.map(({ name, description, icon: Icon, status }) => (
          <Card key={name}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
                <div><CardTitle className="text-lg">{name}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{status}</p></div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">{description}</p>
              <Button variant="outline" onClick={() => connect(name)}>Connect</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
