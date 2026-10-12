import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * Complete Delete Account Server Endpoint (Roadmap Rule #11):
 * 1. Invokes PostgreSQL RPC `delete_user_account()` to:
 *    - Set profiles.status = 'deleted' & anonymize public PII
 *    - Terminate all active matches
 *    - Cancel active/pending subscriptions
 *    - Delete profile_photos rows while preserving transactional records (payments, reports, messages)
 * 2. Deletes user files in Supabase Storage bucket `profile-photos/{user_id}/*`
 * 3. Bans/disables Auth user in `auth.users` and signs out session so user cannot re-login.
 */
export async function POST() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        mode: "local",
        message: "Account deletion processed in local state.",
      });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Execute database lifecycle RPC
    await supabase.rpc("delete_user_account");

    // 2. Clean up storage bucket files for user
    const { data: files } = await supabase.storage
      .from("profile-photos")
      .list(user.id);

    if (files && files.length > 0) {
      const paths = files.map((f) => `${user.id}/${f.name}`);
      await supabase.storage.from("profile-photos").remove(paths);
    }

    // 3. Disable Auth user login via Service Role if configured
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createAdminSupabaseClient();
      await adminClient.auth.admin.updateUserById(user.id, {
        ban_duration: "876000h", // 100 years ban to prevent login while preserving FK references
      });
    }

    // 4. Sign out current session
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      user_id: user.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process account deletion",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
