import { FormEvent, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/muwoyo-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSelector, useLanguage } from "@/hooks/useLanguage";

export default function PasswordRecovery() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const codeInputs = useRef<Array<HTMLInputElement | null>>([]);
  const { language } = useLanguage();
  const isPortuguese = language === "pt";
  const text = isPortuguese ? { sendFailed: "Não foi possível enviar o código", sent: "Código enviado", sentBody: "Verifique o seu email e introduza o código de 6 dígitos.", invalid: "Código inválido", invalidBody: "Confirme o código recebido.", confirm: "Confirme a nova palavra-passe", confirmBody: "Use pelo menos 8 caracteres e repita a palavra-passe corretamente.", updateFailed: "Não foi possível atualizar a palavra-passe", updated: "Palavra-passe atualizada", updatedBody: "A sua palavra-passe foi alterada. Já pode entrar novamente.", backLogin: "Voltar ao login", newPassword: "Definir nova palavra-passe", confirmCode: "Confirmar código", recover: "Recover password", choose: "Escolha uma nova palavra-passe para voltar a aceder à sua conta.", codeDescription: "Introduza o código de 6 dígitos enviado para o seu email.", emailDescription: "Enviaremos um código de 6 dígitos para o seu email.", newPlaceholder: "Nova palavra-passe", repeatPlaceholder: "Repetir nova palavra-passe", save: "Guardar", update: "Atualizar palavra-passe", digit: "Dígito" } : { sendFailed: "Could not send code", sent: "Code sent", sentBody: "Check your email and enter the 6-digit code.", invalid: "Invalid code", invalidBody: "Check the code you received.", confirm: "Confirm your new password", confirmBody: "Use at least 8 characters and repeat the password correctly.", updateFailed: "Could not update password", updated: "Password updated", updatedBody: "Your password was changed. You can sign in again.", backLogin: "Back to sign in", newPassword: "Set new password", confirmCode: "Confirm code", recover: "Recover password", choose: "Choose a new password to access your account again.", codeDescription: "Enter the 6-digit code sent to your email.", emailDescription: "We will send a 6-digit code to your email.", newPlaceholder: "New password", repeatPlaceholder: "Repeat new password", save: "Save", update: "Update password", digit: "Digit" };

  const requestReset = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("password-reset", { body: { action: "request", email } });
    setSubmitting(false);
    if (error || data?.error) {
      toast({ title: text.sendFailed, description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    setStep("code");
    toast({ title: text.sent, description: text.sentBody });
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("password-reset", { body: { action: "verify", email, code } });
    setSubmitting(false);
    if (error || data?.error || !data?.reset_token) {
      toast({ title: text.invalid, description: data?.error || error?.message || text.invalidBody, variant: "destructive" });
      return;
    }
    setResetToken(data.reset_token);
    setStep("password");
  };

  const updatePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 6 || password !== confirmation) {
      toast({ title: text.confirm, description: text.confirmBody, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("password-reset", { body: { action: "update", reset_token: resetToken, password } });
    setSubmitting(false);
    if (error || data?.error) {
      toast({ title: text.updateFailed, description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    setUpdated(true);
  };

  if (updated) {
    return <div className="flex min-h-screen items-center justify-center bg-background p-4"><Card className="w-full max-w-md text-center shadow-xl"><CardContent className="space-y-4 p-8"><div className="flex justify-end"><LanguageSelector /></div><CheckCircle2 className="mx-auto h-12 w-12 text-primary" /><h1 className="text-2xl font-bold">{text.updated}</h1><p className="text-sm text-muted-foreground">{text.updatedBody}</p><Button className="w-full" onClick={() => navigate("/login", { replace: true })}>{text.backLogin}</Button></CardContent></Card></div>;
  }

  const title = step === "password" ? text.newPassword : step === "code" ? text.confirmCode : text.recover;
  const description = step === "password" ? text.choose : step === "code" ? text.codeDescription : text.emailDescription;
  return <div className="flex min-h-screen items-center justify-center bg-background p-4"><Card className="w-full max-w-md shadow-xl"><CardHeader className="space-y-3 text-center"><img src={logo} alt="Muwoyo" className="mx-auto h-14 w-14 object-contain" /><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><KeyRound className="h-5 w-5" /></div><CardTitle>{title}</CardTitle><p className="text-sm text-muted-foreground">{description}</p></CardHeader><CardContent>{step === "password" ? <form className="space-y-4" onSubmit={updatePassword}><Input type="password" minLength={8} required placeholder="Nova senha" value={password} onChange={(event) => setPassword(event.target.value)} /><Input type="password" minLength={8} required placeholder="Repetir nova senha" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /><Button className="w-full" disabled={submitting}>{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{submitting ? "A guardar..." : "Atualizar senha"}</Button></form> : step === "code" ? <form className="space-y-4" onSubmit={verifyCode}><div className="flex justify-center gap-2" aria-label="Código de 6 dígitos">{Array.from({ length: 6 }, (_, index) => <Input key={index} ref={(element) => { codeInputs.current[index] = element; }} inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} maxLength={1} required value={code[index] || ""} onChange={(event) => { const digit = event.target.value.replace(/\D/g, ""); const next = code.split(""); next[index] = digit; setCode(next.join("").slice(0, 6)); if (digit && index < 5) codeInputs.current[index + 1]?.focus(); }} onKeyDown={(event) => { if (event.key === "Backspace" && !code[index] && index > 0) codeInputs.current[index - 1]?.focus(); }} className="h-12 w-10 p-0 text-center text-lg font-semibold" aria-label={`Dígito ${index + 1}`} />)}</div><Button className="w-full" disabled={submitting || code.length !== 6}>{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{submitting ? "A validar..." : "Confirmar código"}</Button></form> : <form className="space-y-4" onSubmit={requestReset}><Input type="email" required autoComplete="email" placeholder="O seu email" value={email} onChange={(event) => setEmail(event.target.value)} /><Button className="w-full" disabled={submitting}>{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{submitting ? "A enviar..." : "Enviar código"}</Button></form>}<Button variant="ghost" className="mt-4 w-full" onClick={() => navigate("/login")}><ArrowLeft className="mr-2 h-4 w-4" />Voltar ao login</Button></CardContent></Card></div>;
}
