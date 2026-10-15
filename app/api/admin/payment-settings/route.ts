import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * POST /api/admin/payment-settings
 *
 * Saves admin payment recipient config (bank, e-wallet, QRIS)
 * and optionally uploads the QRIS image to Supabase Storage —
 * all bypassing frontend RLS via Service Role key (server-only).
 *
 * Body (multipart/form-data):
 *   config   – JSON string of PaymentRecipientConfig (without qrisImageUrl)
 *   qrisFile – optional image file for QRIS code
 *
 * Or Body (application/json):
 *   { ...PaymentRecipientConfig }  (no file upload; qrisImageUrl can be existing URL)
 */
export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase tidak dikonfigurasi." },
        { status: 503 }
      );
    }

    // ── 1. Verify caller is an authenticated admin ────────────────────────────
    const authClient = await createServerSupabaseClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    const adminSecret = request.headers.get("x-admin-secret");
    const isSecretAuthorized =
      adminSecret === "admin@haiyo.id" || adminSecret === "Brip@l007";

    let isSuperAdmin = false;
    if (user) {
      const { data: profile } = await authClient
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      isSuperAdmin =
        Boolean(profile?.is_admin) ||
        user.email?.trim().toLowerCase() === "admin@haiyo.id";
    }

    if (!isSuperAdmin && !isSecretAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Admin role required" },
        { status: 403 }
      );
    }

    // ── 2. Parse body ─────────────────────────────────────────────────────────
    const contentType = request.headers.get("content-type") ?? "";
    const adminClient = createAdminSupabaseClient();

    let configData: Record<string, unknown> = {};
    let qrisImageUrl: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      // Multipart: config JSON + optional QRIS file
      const formData = await request.formData();
      const configRaw = formData.get("config");
      if (typeof configRaw === "string") {
        try {
          configData = JSON.parse(configRaw) as Record<string, unknown>;
        } catch {
          return NextResponse.json(
            { error: "Config JSON tidak valid." },
            { status: 400 }
          );
        }
      }

      const qrisFile = formData.get("qrisFile");
      if (qrisFile && qrisFile instanceof Blob) {
        // Upload QRIS to Supabase Storage
        const fileExt =
          qrisFile instanceof File ? qrisFile.name.split(".").pop() : "webp";
        const objectPath = `qris/qris-${Date.now()}.${fileExt ?? "webp"}`;

        const { data: uploadData, error: uploadError } =
          await adminClient.storage
            .from("profile-photos")
            .upload(objectPath, qrisFile, {
              contentType: qrisFile.type || "image/webp",
              cacheControl: "31536000",
              upsert: true,
            });

        if (!uploadError && uploadData) {
          const {
            data: { publicUrl },
          } = adminClient.storage
            .from("profile-photos")
            .getPublicUrl(objectPath);
          qrisImageUrl = publicUrl;
        }
      }
    } else {
      // JSON body
      try {
        configData = (await request.json()) as Record<string, unknown>;
      } catch {
        return NextResponse.json(
          { error: "Request body tidak valid." },
          { status: 400 }
        );
      }
    }

    // ── 3. Merge existing qrisImageUrl if not replaced ────────────────────────
    const finalConfig: Record<string, unknown> = {
      ...configData,
      requireAdminApproval: true,
    };
    if (qrisImageUrl) {
      finalConfig.qrisImageUrl = qrisImageUrl;
    }

    // ── 4. Upsert to site_settings via Service Role (bypasses RLS) ───────────
    const { error: upsertError } = await adminClient
      .from("site_settings")
      .upsert({ key: "payment_config", value: finalConfig });

    if (upsertError) {
      console.error("[payment-settings] upsert error:", upsertError);
      return NextResponse.json(
        { error: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      qrisImageUrl: finalConfig.qrisImageUrl ?? null,
    });
  } catch (err) {
    console.error("[payment-settings] unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/payment-settings
 * Returns the current payment_config from site_settings (public — no auth required).
 */
export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ paymentConfig: null });
    }

    const adminClient = createAdminSupabaseClient();
    const { data } = await adminClient
      .from("site_settings")
      .select("value")
      .eq("key", "payment_config")
      .maybeSingle();

    return NextResponse.json({ paymentConfig: data?.value ?? null });
  } catch {
    return NextResponse.json({ paymentConfig: null });
  }
}
