import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "signup"
    | "email"
    | "recovery"
    | "invite"
    | null;
  const next = searchParams.get("next");

  const supabase = await createServerSupabaseClient();
  let authSucceeded = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      authSucceeded = true;
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!error) {
      authSucceeded = true;
    }
  }

  if (authSucceeded) {
    if (next) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("is_onboarded, is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (
        profileRow?.is_admin ||
        user.email?.trim().toLowerCase() === "admin@haiyo.id"
      ) {
        return NextResponse.redirect(`${origin}/admin`);
      }

      if (profileRow?.is_onboarded) {
        return NextResponse.redirect(`${origin}/discover`);
      }
    }

    return NextResponse.redirect(`${origin}/onboarding`);
  }

  return NextResponse.redirect(`${origin}/login`);
}

