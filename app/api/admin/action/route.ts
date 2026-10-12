import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Server-Side Admin Moderation API (/api/admin/action)
 * Per UI/UX Section 83:
 * Authorization must NEVER rely only on hiding frontend routes.
 * Enforced server-side and database-side via RLS (`public.is_admin()`).
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      type: "user_status" | "report_status";
      targetId: string;
      status: string;
    };

    if (!body.type || !body.targetId || !body.status) {
      return NextResponse.json(
        { error: "Invalid admin action payload" },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Server-side verification of Admin role
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!adminProfile?.is_admin) {
        return NextResponse.json(
          { error: "Forbidden: Admin role required" },
          { status: 403 }
        );
      }

      if (body.type === "user_status") {
        const { error } = await supabase
          .from("profiles")
          .update({ status: body.status })
          .eq("id", body.targetId);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
      } else if (body.type === "report_status") {
        const { error } = await supabase
          .from("reports")
          .update({
            status: body.status,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", body.targetId);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      type: body.type,
      targetId: body.targetId,
      status: body.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Admin action failed",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
