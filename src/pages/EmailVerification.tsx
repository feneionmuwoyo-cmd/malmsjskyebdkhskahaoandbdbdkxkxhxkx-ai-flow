import { ClipboardEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { resendVerificationCode, verifyEmailCode, type EmailVerificationError } from "@/lib/email-verification";
import logo from "@/assets/muwoyo-logo.png";
import { LanguageSelector, useLanguage } from "@/hooks/useLanguage";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"*".repeat(Math.max(2, name.length - visible.length))}@${domain}`;
}

function errorMessage(error: EmailVerificationError, isPortuguese: boolean) {
  switch (error) {
    case "invalid_code": return isPortuguese ? "O código está incorreto. Tente novamente." : "The code is incorrect. Try again.";
    case "expired_code": return isPortuguese ? "Este código expirou. Solicite um novo código." : "This code has expired. Request a new one.";
    case "too_many_attempts": return isPortuguese ? "O limite de tentativas foi atingido." : "Too many attempts. Request a new code later.";
    case "resend_cooldown": return isPortuguese ? "Aguarde antes de solicitar outro código." : "Please wait before requesting another code.";
    case "unauthorized": return isPortuguese ? "A sua sessão expirou. Entre novamente." : "Your session expired. Sign in again.";
    case "not_configured": return isPortuguese ? "A confirmação por código ainda não está disponível." : "Code confirmation is not available yet.";
    default: return isPortuguese ? "Ocorreu um erro temporário. Tente novamente." : "A temporary error occurred. Try again.";
  }
}

export default function EmailVerification() {
  const { user } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const location = useLocation();
  const navigate = useNavigate();
  const stateEmail = (location.state as { email?: string } | null)?.email;
  const emailChange = Boolean((location.state as { emailChange?: boolean } | null)?.emailChange);
  const email = stateEmail || user?.email || window.sessionStorage.getItem("muwoyo_pending_email") || "";
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [error, setError] = useState<EmailVerificationError | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const [codeRequested, setCodeRequested] = useState(false);
  const { language } = useLanguage();
  const isPortuguese = language === "pt";

  useEffect(() => {
    if (!roleLoading && role === "admin") navigate("/admin", { replace: true });
    if (!roleLoading && role === "sub_admin") navigate("/gestor", { replace: true });
  }, [navigate, role, roleLoading]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const code = digits.join("");
  const updateDigits = (value: string, index: number) => {
    const numbers = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = numbers;
    setDigits(next);
    setStatus("idle");
    setError(null);
    if (numbers && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    setDigits([...pasted.split(""), ...Array(CODE_LENGTH - pasted.length).fill("")]);
    inputs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  };

  const confirm = async () => {
    if (code.length !== CODE_LENGTH) return;
    setStatus("verifying");
    setError(null);
    const result = await verifyEmailCode(code, email);
    if (result.success) {
      setCodeRequested(true);
      await supabase.auth.refreshSession();
      setStatus("success");
      window.sessionStorage.removeItem("muwoyo_pending_email");
      window.setTimeout(() => navigate(emailChange ? "/dashboard" : "/dashboard", { replace: true }), 500);
    } else {
      setStatus("error");
      setError(result.error);
    }
  };

  const resend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    const result = await resendVerificationCode(email);
    setResending(false);
    if (result.success) {
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setDigits(Array(CODE_LENGTH).fill(""));
      setStatus("idle");
      setError(null);
    } else {
      setStatus("error");
      setError(result.error);
    }
  };

  if (roleLoading || role === "admin" || role === "sub_admin") {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <img src={logo} alt="Muwoyo" className="mx-auto mb-3 h-14 w-14 object-contain" />
          <MailCheck className="mx-auto mb-3 h-8 w-8 text-primary" />
          <CardTitle className="text-2xl">{emailChange ? "Confirme o novo email" : "Confirme o seu e-mail"}</CardTitle>
          <p className="text-sm text-muted-foreground">Enviámos um código de confirmação de 6 dígitos para:</p>
          <p className="font-semibold text-foreground">{maskEmail(email)}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-center text-sm text-muted-foreground">Digite o código abaixo para continuar.</p>
          <div className="flex justify-center gap-2" aria-label="Código de confirmação">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(input) => { inputs.current[index] = input; }}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(event) => updateDigits(event.target.value, index)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                onPaste={handlePaste}
                className="h-12 w-10 rounded-md border border-input bg-background text-center text-xl font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                aria-label={`Dígito ${index + 1}`}
              />
            ))}
          </div>
          {error && <p className="text-center text-sm text-destructive">{errorMessage(error, isPortuguese)}</p>}
          {status === "success" && <p className="text-center text-sm text-primary">{isPortuguese ? "E-mail confirmado. A abrir o dashboard..." : "Email confirmed. Opening your dashboard..."}</p>}
          <Button className="w-full" disabled={code.length !== CODE_LENGTH || status === "verifying" || status === "success"} onClick={confirm}>
            {status === "verifying" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isPortuguese ? "A verificar..." : "Verifying..."}</> : isPortuguese ? "Confirmar e-mail" : "Confirm email"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            <p>{isPortuguese ? "Não recebeu o código?" : "Didn't receive the code?"}</p>
            <button type="button" className="mt-1 font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50" disabled={cooldown > 0 || resending} onClick={resend}>
              {resending ? (isPortuguese ? "A pedir o código..." : "Requesting code..." ) : cooldown > 0 ? `${isPortuguese ? "Pedir novamente em" : "Request again in"} ${cooldown}s` : codeRequested ? (isPortuguese ? "Pedir novo código" : "Request new code") : (isPortuguese ? "Pedir código de confirmação" : "Request verification code")}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}