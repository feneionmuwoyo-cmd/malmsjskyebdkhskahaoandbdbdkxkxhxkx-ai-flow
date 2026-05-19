import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/feneion-logo.png";
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";

type Search = { redirect?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/onboard",
  }),
  component: LoginPage,
});

type Mode = "signin" | "signup";

function scorePassword(pw: string) {
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length;
  let label = "Muito fraca";
  let color = "bg-red-500";
  if (score >= 5) { label = "Excelente"; color = "bg-emerald-500"; }
  else if (score === 4) { label = "Forte"; color = "bg-green-500"; }
  else if (score === 3) { label = "Média"; color = "bg-yellow-500"; }
  else if (score === 2) { label = "Fraca"; color = "bg-orange-500"; }
  return { score, label, color, checks, isStrong: score >= 4 };
}

function LoginPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => scorePassword(password), [password]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials"
        ? "Email ou senha incorretos"
        : error.message);
      return;
    }
    toast.success("Bem-vindo de volta");
    navigate({ to: redirect || "/dashboard" });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirm) return;
    if (!strength.isStrong) {
      toast.error("A tua senha precisa de ser pelo menos forte");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Conta criada — confirma o teu email se for pedido");
    // Try to sign in immediately (works if email confirmation disabled)
    const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
    if (!signErr) navigate({ to: redirect || "/onboard" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <Link to="/" className="absolute left-6 top-6">
        <img src={logo} alt="feneion" className="h-24 w-auto md:h-28" />
      </Link>

      <div className="w-full max-w-md">
        <div className="glass rounded-3xl p-8 shadow-elegant">
          <div className="mb-6 flex rounded-full border border-border/60 bg-card/40 p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${
                mode === "signin" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${
                mode === "signup" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"
              }`}
            >
              Criar conta
            </button>
          </div>

          {mode === "signin" ? (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h1>
              <p className="mt-2 text-sm text-muted-foreground">Entra na tua conta feneion.</p>

              <form onSubmit={handleSignIn} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)} className="h-11" placeholder="tu@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input id="password" type={showPw ? "text" : "password"} required value={password}
                      onChange={(e) => setPassword(e.target.value)} className="h-11 pr-10" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading}
                  className="h-11 w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">Cria a tua conta</h1>
              <p className="mt-2 text-sm text-muted-foreground">Começa a gerar VSLs em segundos.</p>

              <form onSubmit={handleSignUp} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" type="text" required value={name}
                    onChange={(e) => setName(e.target.value)} className="h-11" placeholder="O teu nome" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)} className="h-11" placeholder="tu@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Input id="signup-password" type={showPw ? "text" : "password"} required value={password}
                      onChange={(e) => setPassword(e.target.value)} className="h-11 pr-10" placeholder="Cria uma senha forte" />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {password.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i}
                            className={`h-1.5 flex-1 rounded-full transition ${
                              i <= strength.score ? strength.color : "bg-muted"
                            }`} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Força: <span className="text-foreground font-medium">{strength.label}</span></span>
                      </div>
                      <ul className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                        <Req ok={strength.checks.length}>8+ caracteres</Req>
                        <Req ok={strength.checks.upper}>Letra maiúscula</Req>
                        <Req ok={strength.checks.lower}>Letra minúscula</Req>
                        <Req ok={strength.checks.number}>Número</Req>
                        <Req ok={strength.checks.symbol}>Símbolo (!@#…)</Req>
                      </ul>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmar senha</Label>
                  <Input id="confirm" type={showPw ? "text" : "password"} required value={confirm}
                    onChange={(e) => setConfirm(e.target.value)} className="h-11" placeholder="Repete a senha" />
                  {confirm.length > 0 && confirm !== password && (
                    <p className="text-xs text-red-500">As senhas não coincidem</p>
                  )}
                </div>

                <Button type="submit" disabled={loading || !strength.isStrong || password !== confirm}
                  className="h-11 w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar conta"}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ao continuares, aceitas os termos da feneion.
        </p>
      </div>
    </div>
  );
}

function Req({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-1.5 ${ok ? "text-emerald-500" : ""}`}>
      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 opacity-50" />}
      {children}
    </li>
  );
}
