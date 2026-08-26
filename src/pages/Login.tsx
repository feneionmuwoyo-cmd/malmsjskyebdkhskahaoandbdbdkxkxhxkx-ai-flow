import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/muwoyo-logo.png";
import { initWebPush, isValidVapidPublicKey } from "@/lib/web-push";
import { LanguageSelector, useLanguage } from "@/hooks/useLanguage";

export default function Login() {
  const { user, signIn, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isPortuguese = language === "pt";
  const text = isPortuguese
    ? {
        login: "Entrar",
        subtitle: "Entre com os seus dados",
        email: "Email",
        password: "Palavra-passe",
        show: "Mostrar palavra-passe",
        hide: "Ocultar palavra-passe",
        forgot: "Esqueci-me da palavra-passe",
        create: "Criar conta",
        noAccount: "Ainda não tem conta?",
        back: "Voltar ao site",
        welcome: "Bem-vindo à Muwoyo",
        welcomeBody:
          "Entre para começar a automatizar as suas conversas no WhatsApp.",
        loading: "A carregar...",
      }
    : {
        login: "Sign In",
        subtitle: "Sign in with your details",
        email: "Email",
        password: "Password",
        show: "Show password",
        hide: "Hide password",
        forgot: "Forgot password",
        create: "Create account",
        noAccount: "Don't have an account?",
        back: "Back to website",
        welcome: "Welcome to Muwoyo",
        welcomeBody: "Sign in to start automating your WhatsApp conversations.",
        loading: "Loading...",
      };

  useEffect(() => {
    setStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        Boolean(
          (window.navigator as Navigator & { standalone?: boolean }).standalone,
        ),
    );
  }, []);

  useEffect(() => {
    if (
      loading ||
      !user ||
      window.localStorage.getItem("muwoyo_push_permission_requested")
    )
      return;
    const vapidKey =
      import.meta.env.VITE_VAPID_PUBLIC_KEY || import.meta.env.VAPID_PUBLIC_KEY;
    if (!isValidVapidPublicKey(vapidKey) || !("Notification" in window)) return;
    window.localStorage.setItem("muwoyo_push_permission_requested", "1");
    void initWebPush().catch((error) =>
      console.warn("Push permission was not enabled", error),
    );
  }, [loading, user]);

  useEffect(() => {
    if (!loading && user) {
      const checkUserRole = async () => {
        try {
          const { data: roleData, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .maybeSingle();

          if (roleError)
            console.warn(
              "Não foi possível ler a função; usando cliente:",
              roleError.message,
            );

          const userRole = roleData?.role || "client";
          if (userRole === "admin") {
            navigate("/admin", { replace: true });
            return;
          }
          if (userRole === "sub_admin") {
            navigate("/gestor", { replace: true });
            return;
          }

          const { data: profile } = await supabase
            .from("profiles")
            .select("email_verified")
            .eq("user_id", user.id)
            .maybeSingle();
          if (!profile?.email_verified) {
            window.sessionStorage.setItem(
              "muwoyo_pending_email",
              user.email || "",
            );
            navigate("/confirmar-email", {
              replace: true,
              state: { email: user.email },
            });
            return;
          }

          navigate("/dashboard", { replace: true });
        } catch (error) {
          console.error("Erro ao verificar role:", error);
          navigate("/dashboard", { replace: true });
        }
      };

      checkUserRole();
    }
  }, [loading, user, navigate]);

  if (loading || user) {
    return (
      <div
        className="min-h-screen bg-gray-100 flex items-center justify-center"
        aria-label={text.loading}
      />
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error)
      return toast({
        title: "Erro ao entrar",
        description: error,
        variant: "destructive",
      });

    try {
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        navigate("/dashboard", { replace: true });
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (roleError)
        console.warn(
          "Não foi possível ler a função; usando cliente:",
          roleError.message,
        );

      const userRole = roleData?.role || "client";
      if (userRole === "admin") {
        navigate("/admin", { replace: true });
        return;
      }
      if (userRole === "sub_admin") {
        navigate("/gestor", { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("email_verified")
        .eq("user_id", currentUser.id)
        .maybeSingle();
      if (!profile?.email_verified) {
        window.sessionStorage.setItem(
          "muwoyo_pending_email",
          currentUser.email || email,
        );
        navigate("/confirmar-email", {
          replace: true,
          state: { email: currentUser.email || email },
        });
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Erro ao verificar role após login:", error);
      navigate("/dashboard", { replace: true });
    }
  };

  const handleCreateAccount = () => {
    navigate("/criar-conta");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl h-[600px] flex flex-col md:flex-row">
        <div className="w-full md:w-5/12 bg-gray-50 p-10 flex flex-col justify-center">
            <div className="mb-8 flex items-center gap-3">
            <img src={logo} alt="Muwoyo" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Muwoyo</h1>
            </div>
          </div>

          <div className="mb-4 flex justify-end">
            <LanguageSelector />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {text.login}
          </h2>
          <p className="text-gray-500 mb-8">{text.subtitle}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={text.email}
                className="w-full border-b border-gray-300 py-2 bg-transparent outline-none transition focus:border-whatsapp"
              />
            </div>
            <div className="relative">
              <input
                id="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={text.password}
                className="w-full border-b border-gray-300 py-2 bg-transparent outline-none transition focus:border-whatsapp"
              />
              <button type="button" aria-label={show ? text.hide : text.show} title={show ? text.hide : text.show} onClick={() => setShow(!show)} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-whatsapp">
                {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="text-sm text-gray-400 hover:text-whatsapp transition"
                onClick={() => navigate("/recuperar-password")}
              >
                <span>{isPortuguese ? "Esqueceu a sua palavra-passe?" : "Forgot your password?"}</span>{" "}<span className="font-semibold text-emerald-600 hover:text-emerald-700">{isPortuguese ? "Clique aqui" : "Click here"}</span>
              </button>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-whatsapp py-3 text-white font-semibold hover:bg-green-800 transition"
              disabled={submitting}
            >
              {submitting ? text.loading : text.login}
            </button>
          </form>

          <div className="mt-auto space-y-4 pt-10 text-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{text.noAccount}</span>
              <button
                type="button"
                className="rounded border border-gray-300 px-4 py-1 text-sm hover:bg-gray-200 transition"
                onClick={handleCreateAccount}
              >
                {text.create}
              </button>
            </div>
            {!standalone && (
              <button
                type="button"
                className="text-left text-sm text-gray-500 hover:text-whatsapp transition"
                onClick={() => navigate("/")}
              >
                {text.back}
              </button>
            )}
          </div>
        </div>

        <div className="w-full md:w-7/12 bg-[#25D366] p-12 flex flex-col justify-center text-white relative overflow-hidden">
          <h2 className="text-4xl font-bold leading-tight mb-4">
            {text.welcome}
          </h2>
          <p className="text-white/80">{text.welcomeBody}</p>

          <div className="mt-12 flex justify-center opacity-80">
            <svg viewBox="0 0 200 200" className="w-64 h-64 text-white">
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="currentColor"
                fillOpacity="0.1"
              />
              <path
                d="M50 150 Q100 120 150 150"
                stroke="white"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />
              <rect
                x="70"
                y="60"
                width="60"
                height="80"
                rx="10"
                fill="white"
                fillOpacity="0.2"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
