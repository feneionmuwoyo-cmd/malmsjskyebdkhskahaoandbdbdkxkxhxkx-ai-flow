import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { translateDocument, type Language } from "@/lib/i18n";

type Dictionary = Record<string, string>;

const dictionaries: Record<Language, Dictionary> = {
  en: {
    dashboard: "Dashboard", integrations: "Integrations", plans: "Plans & billing", language: "Language",
    signIn: "Sign in", createAccount: "Create account", inbox: "Inbox", connect: "Connect",
  },
  pt: {
    dashboard: "Dashboard", integrations: "Integrações", plans: "Planos e faturação", language: "Idioma",
    signIn: "Entrar", createAccount: "Criar conta", inbox: "Inbox", connect: "Ligar",
  },
};

const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void; t: (key: string) => string } | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem("muwoyo-language") as Language) || "en");
  const changeLanguage = (next: Language) => { localStorage.setItem("muwoyo-language", next); setLanguage(next); };
  useEffect(() => {
    translateDocument(language);
    document.documentElement.lang = language;
    const observer = new MutationObserver(() => translateDocument(language));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);
  return <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t: (key) => dictionaries[language][key] || key }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  return <label className="flex items-center gap-2 text-xs text-muted-foreground" aria-label={t("language")}><span>{t("language")}</span><select value={language} onChange={(event) => setLanguage(event.target.value as Language)} className="rounded-md border border-border bg-background px-2 py-1 text-foreground"><option value="en">EN</option><option value="pt">PT</option></select></label>;
}