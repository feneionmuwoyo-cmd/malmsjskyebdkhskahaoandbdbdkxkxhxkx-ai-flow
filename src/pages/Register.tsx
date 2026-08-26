import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/muwoyo-logo.png";
import { LanguageSelector, useLanguage } from "@/hooks/useLanguage";

export default function Register() {
  const { user, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { language } = useLanguage();
  const isPortuguese = language === "pt";
  const text = isPortuguese ? {
    title: "Criar conta", subtitle: "Comece com um teste gratuito de 3 dias", name: "Nome completo", email: "Email", phone: "Telefone", password: "Palavra-passe forte", rules: "Use 8+ caracteres com maiúscula, minúscula, número e símbolo.", show: "Mostrar palavra-passe", hide: "Ocultar palavra-passe", existing: "Já tenho conta", create: "Criar conta", loading: "A carregar...", noAccount: "Já possui conta?", back: "Voltar ao site", welcome: "Bem-vindo à Muwoyo", welcomeBody: "Crie a sua conta para começar a automatizar as conversas no WhatsApp.", weak: "Palavra-passe fraca", weakBody: "Use pelo menos 8 caracteres, maiúscula, minúscula, número e símbolo.", failed: "Não foi possível criar a conta", created: "Conta criada", confirmation: "Confirme o seu email para ativar o acesso." 
  } : {
    title: "Create account", subtitle: "Start with a 3-day free trial", name: "Full name", email: "Email", phone: "Phone", password: "Strong password", rules: "Use 8+ characters with uppercase, lowercase, number and symbol.", show: "Show password", hide: "Hide password", existing: "I already have an account", create: "Create account", loading: "Loading...", noAccount: "Already have an account?", back: "Back to website", welcome: "Welcome to Muwoyo", welcomeBody: "Create your account and start automating WhatsApp conversations.", weak: "Weak password", weakBody: "Use at least 8 characters, uppercase, lowercase, number and symbol.", failed: "Could not create account", created: "Account created", confirmation: "Check your email to activate access." 
  };

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;
  const countries = [
    ["US", "🇺🇸", "United States"], ["GB", "🇬🇧", "United Kingdom"], ["CA", "🇨🇦", "Canada"],
    ["PT", "🇵🇹", "Portugal"], ["BR", "🇧🇷", "Brazil"], ["AO", "🇦🇴", "Angola"],
    ["ZA", "🇿🇦", "South Africa"], ["NG", "🇳🇬", "Nigeria"], ["GH", "🇬🇭", "Ghana"],
    ["KE", "🇰🇪", "Kenya"], ["IN", "🇮🇳", "India"], ["AU", "🇦🇺", "Australia"],
  ];

  useEffect(() => {
    if (!user) return;
    const pendingEmail = window.sessionStorage.getItem("muwoyo_pending_email");
    if (pendingEmail) {
      navigate("/confirmar-email", { replace: true, state: { email: pendingEmail } });
      return;
    }
    navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  if (user) return <div className="min-h-screen bg-gray-100" />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (passwordScore < 5) {
      toast({ title: text.weak, description: text.weakBody, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(email, password, {
      full_name: name,
      phone: phone.replace(/\D/g, ""),
      country,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: text.failed, description: error, variant: "destructive" });
      return;
    }
    window.sessionStorage.setItem("muwoyo_pending_email", email);
    toast({
      title: text.created,
      description: text.confirmation,
    });
    navigate("/confirmar-email", { replace: true, state: { email } });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col md:flex-row md:min-h-[600px]">
        <div className="w-full md:w-1/2 bg-gray-50 p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-8 flex items-center gap-3">
            <img src={logo} alt="Muwoyo" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Muwoyo</h1>
            </div>
          </div>
          <div className="mb-4 flex justify-end"><LanguageSelector /></div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{text.title}</h2>
          <p className="text-gray-500 mb-8">{text.subtitle}</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={text.name}
                className="w-full border-b border-gray-300 py-2 bg-transparent outline-none transition focus:border-whatsapp"
              />
            </div>
            <div>
              <label htmlFor="country" className="mb-2 block text-xs font-medium text-gray-500">{isPortuguese ? "País" : "Country"}</label>
              <select id="country" required value={country} onChange={(event) => setCountry(event.target.value)} className="w-full border-b border-gray-300 bg-transparent py-2 outline-none transition focus:border-whatsapp">
                <option value="">{isPortuguese ? "Selecione o seu país" : "Select your country"}</option>
                {countries.map(([code, flag, name]) => <option key={code} value={code}>{flag} {name}</option>)}
              </select>
            </div>
            <div>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={text.email}
                className="w-full border-b border-gray-300 py-2 bg-transparent outline-none transition focus:border-whatsapp"
              />
            </div>
            <div>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder={text.phone}
                className="w-full border-b border-gray-300 py-2 bg-transparent outline-none transition focus:border-whatsapp"
              />
            </div>
            <div className="relative">
              <input
                id="password"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={text.password}
                className="w-full border-b border-gray-300 py-2 bg-transparent outline-none transition focus:border-whatsapp"
              />
              <button type="button" aria-label={show ? text.hide : text.show} title={show ? text.hide : text.show} onClick={() => setShow(!show)} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-whatsapp">
                {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
              <div className="mt-3 space-y-2">
                <div className="flex gap-1" aria-label={`Password strength: ${passwordScore} of 5`}>
                  {Array.from({ length: 5 }, (_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full ${index < passwordScore ? (passwordScore < 4 ? "bg-amber-400" : "bg-emerald-500") : "bg-gray-200"}`} />)}
                </div>
                <p className="text-xs text-gray-500">{text.rules}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="text-sm text-gray-400 hover:text-whatsapp transition"
                onClick={() => navigate("/login")}
              >
                {text.existing}
              </button>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-whatsapp py-3 text-white font-semibold hover:bg-green-800 transition"
              disabled={submitting}
            >
              {submitting ? text.loading : text.create}
            </button>
          </form>
          <div className="mt-auto space-y-4 pt-10 text-sm">
            <div className="flex justify-end text-sm">
              <button type="button" className="rounded border border-gray-300 px-4 py-1 text-sm hover:bg-gray-200 transition" onClick={() => navigate("/login")}>{isPortuguese ? "Entrar" : "Sign in"}</button>
            </div>
            <button type="button" className="text-left text-sm text-gray-500 hover:text-whatsapp transition" onClick={() => navigate("/")}>{text.back}</button>
          </div>
        </div>
        <div className="w-full md:w-1/2 bg-[#25D366] p-12 flex flex-col justify-center text-white relative overflow-hidden">
          <h2 className="text-4xl font-bold leading-tight mb-4">{text.welcome}</h2>
          <p className="text-white/80">{text.welcomeBody}</p>
          <div className="mt-12 flex justify-center opacity-80">
            <svg viewBox="0 0 200 200" className="w-64 h-64 text-white">
              <circle cx="100" cy="100" r="80" fill="currentColor" fillOpacity="0.1" />
              <path d="M50 150 Q100 120 150 150" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />
              <rect x="70" y="60" width="60" height="80" rx="10" fill="white" fillOpacity="0.2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}