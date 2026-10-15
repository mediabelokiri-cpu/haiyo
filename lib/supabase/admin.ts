import { createClient } from "@supabase/supabase-js";

/**
 * CRITICAL SECURITY RULE (PRD Section 41):
 * Supabase service_role key must NEVER be exposed to the frontend.
 * Only import and invoke this function in Server Actions / Route Handlers.
 */
export function createAdminSupabaseClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "SECURITY VIOLATION: createAdminSupabaseClient cannot be called in the browser."
    );
  }

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://jyxgbzlvmjmefvburlof.supabase.co";
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "sb_publishable_PA2w59IyFZRWH8nu9D-Rsw_qFPsoS8t";

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server environment."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
