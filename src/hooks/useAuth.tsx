import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { GLOBAL_MARKET, getUserMarket } from "@/lib/market";
import type { Session, User } from "@supabase/supabase-js";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, meta?: { full_name?: string; phone?: string; country?: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const clearInvalidSession = async () => {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (error) {
      console.warn("Não foi possível limpar a sessão local do Supabase:", error);
      if (typeof window !== "undefined") {
        Object.keys(window.localStorage)
          .filter((key) => key.startsWith("sb-") && key.endsWith("-auth-token"))
          .forEach((key) => window.localStorage.removeItem(key));
      }
    } finally {
      setSession(null);
      setUser(null);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.warn("Sessão Supabase inválida; limpando sessão local:", error);
      void clearInvalidSession();
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: "O Supabase não está configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY." };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };

      const market = await getUserMarket(data.user.id);
      if (market !== GLOBAL_MARKET) {
        await supabase.auth.signOut();
        return { error: "Esta conta pertence ao portal de Angola. Use o acesso global com uma conta global." };
      }

      return { error: null };
    } catch {
      return { error: "Não foi possível conectar ao Supabase. Verifique a URL do projeto e a sua conexão." };
    }
  };

  const signUp = async (email: string, password: string, meta?: { full_name?: string; phone?: string }) => {
    if (!isSupabaseConfigured) {
      return { error: "O Supabase não está configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY." };
    }
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: meta?.full_name, phone: meta?.phone, country: meta?.country, market: GLOBAL_MARKET },
        },
      });
      return { error: error?.message ?? null };
    } catch {
      return { error: "Não foi possível conectar ao Supabase. Verifique a URL do projeto e a sua conexão." };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return <Ctx.Provider value={{ user, session, loading, signIn, signUp, signOut }}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
};
