import { createBrowserClient } from "@supabase/ssr";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://jyxgbzlvmjmefvburlof.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_PA2w59IyFZRWH8nu9D-Rsw_qFPsoS8t";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
      SUPABASE_ANON_KEY &&
      !SUPABASE_URL.includes("your-project-id")
  );
}

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
