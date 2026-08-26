import { Check, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import DashboardShell from "@/components/DashboardShell";

const plans = [
  { id: "starter", name: "Starter", price: "$29", messages: "1,500 messages / month", seats: "1 seat", features: ["Basic custom AI", "Basic online store", "Email support"] },
  { id: "pro", name: "Pro", price: "$79", messages: "6,000 messages / month", seats: "3 seats", features: ["Advanced AI and OCR", "Shared Inbox", "Shopify and WooCommerce"] },
  { id: "scale", name: "Scale / Enterprise", price: "$199", messages: "Unlimited messages with fair use", seats: "Up to 10 seats", features: ["Advanced OCR", "All integrations", "Priority support"] },
];

export default function GlobalPlans() {
  const { toast } = useToast();
  const selectPlan = (planName: string) => toast({ title: `${planName} selected`, description: "Stripe checkout is ready to be connected through the Supabase Edge Function." });

  return (
    <DashboardShell title="Plans & billing" description="Choose the workspace that fits your global operation.">
      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={plan.id === "pro" ? "border-primary shadow-md" : ""}>
            <CardHeader>
              {plan.id === "pro" && <span className="text-xs font-semibold uppercase tracking-widest text-primary">Most popular</span>}
              <CardTitle className="flex items-end justify-between gap-3">
                <span>{plan.name}</span>
                <span className="text-3xl">{plan.price}<small className="text-sm font-normal text-muted-foreground"> / mo</small></span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg bg-muted/60 p-3 text-sm font-medium">{plan.messages} · {plan.seats}</div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {plan.features.map((feature) => <li key={feature} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-600" />{feature}</li>)}
              </ul>
              <Button className="w-full" variant={plan.id === "pro" ? "default" : "outline"} onClick={() => selectPlan(plan.name)}>
                <CreditCard className="mr-2 h-4 w-4" />Start 3-day trial
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
