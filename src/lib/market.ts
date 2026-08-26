import { supabase } from "@/integrations/supabase/client";

export const GLOBAL_MARKET = "global" as const;

type MarketRow = { market: string | null };
type MarketQuery = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }>;
    };
  };
};

export async function getUserMarket(userId: string): Promise<string | null> {
  const { data, error } = await (supabase.from("profiles") as unknown as MarketQuery)
    .select("market")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as MarketRow | null)?.market ?? null;
}