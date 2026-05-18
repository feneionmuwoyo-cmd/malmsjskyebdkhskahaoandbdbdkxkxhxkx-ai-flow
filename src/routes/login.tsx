import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/feneion-logo.png";
import { Loader2 } from "lucide-react";

type Search = { redirect?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/onboard",
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Código enviado para o teu email");
    setStep("otp");
  };

  const verifyCode = async (code: string) => {
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      setOtp("");
      return;
    }
    toast.success("Bem-vindo!");
    navigate({ to: redirect || "/onboard" });
  };

  const handleOtpChange = (val: string) => {
    setOtp(val);
    if (val.length === 6) void verifyCode(val);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${redirect || "/onboard"}` },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <Link to="/" className="absolute left-6 top-6">
        <img src={logo} alt="feneion" className="h-16 w-auto md:h-20" />
      </Link>

      <div className="w-full max-w-md">
        <div className="glass rounded-3xl p-8 shadow-elegant">
          {step === "email" ? (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">Entra ou cria a tua conta</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Vamos enviar um código de 6 dígitos para o teu email.
              </p>

              <Button
                type="button"
                onClick={signInWithGoogle}
                variant="outline"
                className="mt-6 w-full justify-center gap-3"
              >
                <GoogleIcon />
                Continuar com Google
              </Button>

              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                <span>ou com email</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={sendCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar código"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">Verifica o teu email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enviámos um código de 6 dígitos para{" "}
                <span className="text-foreground">{email}</span>.
              </p>

              <div className="mt-8 flex flex-col items-center gap-6">
                <InputOTP maxLength={6} value={otp} onChange={handleOtpChange} disabled={loading}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="h-14 w-12 border-border bg-card/60 text-lg font-semibold first:rounded-l-xl last:rounded-r-xl"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>

                {loading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> A verificar...
                  </div>
                )}

                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => { setStep("email"); setOtp(""); }}
                >
                  Usar outro email
                </button>
              </div>
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}
