import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Server-Side Admin Moderation API (/api/admin/action)
 * Handles user status changes (active, suspended, banned)
 * and Permanent Deletion (hard delete across all tables & storage).
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
      // 1. Verify admin authorization (via Supabase auth session or secret header)
      const authClient = await createServerSupabaseClient();
      const {
        data: { user },
      } = await authClient.auth.getUser();

      const adminSecret = request.headers.get("x-admin-secret");
      const isSecretAuthorized =
        adminSecret === "admin@haiyo.id" || adminSecret === "Brip@l007";

      let isSuperAdmin = false;
      if (user) {
        const { data: adminProfile } = await authClient
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        isSuperAdmin =
          Boolean(adminProfile?.is_admin) ||
          user.email?.trim().toLowerCase() === "admin@haiyo.id";
      }

      if (!isSuperAdmin && !isSecretAuthorized) {
        return NextResponse.json(
          { error: "Forbidden: Admin role required" },
          { status: 403 }
        );
      }

      const adminClient = createAdminSupabaseClient();

      if (body.type === "user_status") {
        if (body.status === "deleted") {
          // Hard Delete: Permanent removal of user from all tables & storage
          const targetUserId = body.targetId;

          // A. Clean up storage files for user
          try {
            const { data: files } = await adminClient.storage
              .from("profile-photos")
              .list(targetUserId);
            if (files && files.length > 0) {
              const paths = files.map((f) => `${targetUserId}/${f.name}`);
              await adminClient.storage.from("profile-photos").remove(paths);
            }
          } catch {
            // Non-blocking storage cleanup
          }

          // B. Cascade delete related relational records
          try {
            await adminClient
              .from("messages")
              .delete()
              .or(`sender_id.eq.${targetUserId}`);
            await adminClient
              .from("matches")
              .delete()
              .or(`user1_id.eq.${targetUserId},user2_id.eq.${targetUserId}`);
            await adminClient
              .from("likes")
              .delete()
              .or(`from_user_id.eq.${targetUserId},to_user_id.eq.${targetUserId}`);
            await adminClient
              .from("passes")
              .delete()
              .or(`from_user_id.eq.${targetUserId},to_user_id.eq.${targetUserId}`);
            await adminClient
              .from("user_interests")
              .delete()
              .eq("user_id", targetUserId);
            await adminClient
              .from("user_preferences")
              .delete()
              .eq("user_id", targetUserId);
            await adminClient
              .from("profile_photos")
              .delete()
              .eq("user_id", targetUserId);
            await adminClient
              .from("notifications")
              .delete()
              .eq("user_id", targetUserId);
            await adminClient
              .from("reports")
              .delete()
              .or(`reporter_id.eq.${targetUserId},reported_user_id.eq.${targetUserId}`);
            await adminClient
              .from("payments")
              .delete()
              .eq("user_id", targetUserId);
            await adminClient
              .from("subscriptions")
              .delete()
              .eq("user_id", targetUserId);
          } catch {
            // Continue with profile deletion
          }

          // C. Delete the user profile row
          const { error: profileDeleteErr } = await adminClient
            .from("profiles")
            .delete()
            .eq("id", targetUserId);

          if (profileDeleteErr) {
            console.error("[admin action] error deleting profile:", profileDeleteErr);
            // Fallback to status update if hard delete fails
            await adminClient
              .from("profiles")
              .update({ status: "deleted" })
              .eq("id", targetUserId);
          }

          // D. Delete user from auth.users (prevents re-login)
          try {
            await adminClient.auth.admin.deleteUser(targetUserId);
          } catch {
            // Non-blocking if mock user
          }
        } else {
          // Normal status change (active, suspended, banned)
          const { error } = await adminClient
            .from("profiles")
            .update({ status: body.status })
            .eq("id", body.targetId);

          if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
          }
        }
      } else if (body.type === "report_status") {
        const reviewerId = user?.id || null;
        const { error } = await adminClient
          .from("reports")
          .update({
            status: body.status,
            reviewed_by: reviewerId,
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
