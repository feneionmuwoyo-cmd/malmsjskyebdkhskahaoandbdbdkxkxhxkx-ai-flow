import { ReactNode, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ChartArea,
  CreditCard,
  Building2,
  Menu,
  Store,
  UsersRound,
  ShoppingBag,
  CalendarDays,
  Boxes,
  ArrowRightLeft,
  PlayCircle,
  Plug,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "@/components/NotificationBell";
import ProfileSheet from "@/components/ProfileSheet";
import logo from "@/assets/muwoyo-logo.png";
import { GLOBAL_MARKET } from "@/lib/market";
import { LanguageSelector } from "@/hooks/useLanguage";

const items = [
  { title: "Dashboard", to: "/dashboard", icon: ChartArea },
  { title: "Inbox", to: "/inbox", icon: MessageCircle },
  { title: "Informações do negócio", to: "/negocio", icon: Building2 },
  { title: "Meus contactos", to: "/whatsapp", icon: UsersRound },
  { title: "Pedidos", to: "/pedidos", icon: ShoppingBag },
  { title: "Minha Agenda", to: "/agenda", icon: CalendarDays },
  { title: "Transferido para humano", to: "/transferido-para-humano", icon: ArrowRightLeft },
  { title: "Meus Produtos", to: "/produtos", icon: Boxes },
  { title: "Minha Loja", to: "/minha-loja", icon: Store },
  { title: "Integrations", to: "/integracoes", icon: Plug },
  { title: "Plans & billing", to: "/planos", icon: CreditCard },
  { title: "Tutorial", to: "/tutorial", icon: PlayCircle },
];

function SidebarContent({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const isGlobal = import.meta.env.VITE_MARKET === GLOBAL_MARKET;
  return (
    <aside className={`flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ${compact ? "w-20" : "w-72"}`}>
      <div className={`flex h-20 items-center gap-3 ${compact ? "justify-center px-2" : "px-6"}`}>
        <img src={logo} alt="Muwoyo" className="h-10 w-10 object-contain" />
        {!compact && <div className="text-2xl font-bold text-foreground">Muwoyo</div>}
      </div>
      <nav className={`flex-1 space-y-1 overflow-y-auto py-2 ${compact ? "px-2" : "px-4"}`}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md py-3 text-sm font-medium transition-colors ${compact ? "justify-center px-2" : "px-4"} ${isActive ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-accent"}`
            }
            title={compact ? (isGlobal && item.to === "/inbox" ? "Inbox" : isGlobal && item.to === "/negocio" ? "Business Information" : isGlobal && item.to === "/whatsapp" ? "My Contacts" : isGlobal && item.to === "/pedidos" ? "Orders" : isGlobal && item.to === "/agenda" ? "Appointments" : isGlobal && item.to === "/transferido-para-humano" ? "Human Handover" : isGlobal && item.to === "/produtos" ? "Products" : isGlobal && item.to === "/minha-loja" ? "My Store" : isGlobal && item.to === "/integracoes" ? "Integrations" : isGlobal && item.to === "/planos" ? "Plans & Billing" : item.title) : undefined}
          >
            <item.icon className="h-4 w-4" />
            {!compact && <span>{isGlobal && item.to === "/inbox" ? "Inbox" : isGlobal && item.to === "/negocio" ? "Business Information" : isGlobal && item.to === "/whatsapp" ? "My Contacts" : isGlobal && item.to === "/pedidos" ? "Orders" : isGlobal && item.to === "/agenda" ? "Appointments" : isGlobal && item.to === "/transferido-para-humano" ? "Human Handover" : isGlobal && item.to === "/produtos" ? "Products" : isGlobal && item.to === "/minha-loja" ? "My Store" : isGlobal && item.to === "/integracoes" ? "Integrations" : isGlobal && item.to === "/planos" ? "Plans & Billing" : item.title}</span>}
          </NavLink>
        ))}
      </nav>
      <div className={`border-t border-sidebar-border ${compact ? "p-2" : "p-4"}`}>
        <ProfileSheet>
          <button title={compact ? user?.email || "Usuário" : undefined} className={`flex w-full items-center gap-3 rounded-md bg-accent p-3 text-left transition-colors hover:bg-accent/80 ${compact ? "justify-center" : ""}`}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
              {(user?.email || "U").slice(0, 1).toUpperCase()}
            </div>
            {!compact && <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">
                {user?.email?.split("@")[0] || "Usuário"}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {user?.email}
              </div>
            </div>}
          </button>
        </ProfileSheet>
      </div>
    </aside>
  );
}

export default function DashboardShell({
  children,
  title,
  description,
  accountStatus,
}: {
  children: ReactNode;
  title: string;
  description?: string;
  accountStatus?: string;
}) {
  const { user } = useAuth();
  const location = useLocation();
  const isGlobal = import.meta.env.VITE_MARKET === GLOBAL_MARKET;
  const compactSidebar = import.meta.env.VITE_MARKET === GLOBAL_MARKET && location.pathname.startsWith("/inbox");
  const [currentAccountStatus, setCurrentAccountStatus] = useState(accountStatus || "trial");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("account_status")
      .eq("user_id", user.id)
      .eq("market", GLOBAL_MARKET)
      .maybeSingle()
      .then(({ data }) => setCurrentAccountStatus(data?.account_status || accountStatus || "trial"));
  }, [accountStatus, user]);

  const statusLabel = !isGlobal && currentAccountStatus === "trial"
    ? "Em teste"
    : !isGlobal && currentAccountStatus === "awaiting_activation"
      ? "Pagamento confirmado"
      : "Ativa";
  const statusColor = !isGlobal && currentAccountStatus === "trial"
    ? "bg-amber-400"
    : !isGlobal && currentAccountStatus === "awaiting_activation"
      ? "bg-sky-500"
      : "bg-emerald-500";

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block">
        <SidebarContent compact={compactSidebar} />
      </div>
      <div className={compactSidebar ? "lg:pl-20" : "lg:pl-72"}>
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-10">
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
              <div className="flex items-center gap-3 lg:gap-0">
                <img
                  src={logo}
                  alt="Muwoyo"
                  className="h-8 w-8 object-contain lg:hidden"
                />
                <div>
                  <h1 className="text-lg font-bold tracking-normal text-foreground lg:text-2xl">
                    {title}
                  </h1>
                  {description && (
                    <p className="hidden text-sm text-muted-foreground sm:block">
                      {description}
                    </p>
                  )}
                </div>
                <span className="hidden items-center gap-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
                  <span>Status</span>
                  <span className={`h-2 w-2 rounded-full ${statusColor}`} />
                  <span className="text-foreground">{statusLabel}</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <NotificationBell />
            </div>
          </div>
        </header>
        <main className={`${compactSidebar ? "w-full px-4 py-4 sm:px-5 lg:px-6" : "mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-10 lg:py-6"} space-y-5`}>
          {children}
        </main>
      </div>
    </div>
  );
}
