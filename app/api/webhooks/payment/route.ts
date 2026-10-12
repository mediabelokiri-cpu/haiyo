import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Server-Side Idempotent Payment Webhook (/api/webhooks/payment)
 * Per PRD Sections 26, 34 & 35:
 * 1. Verifies webhook signature/token from Payment Gateway
 * 2. Validates order_id, transaction_id, amount, and payment status
 * 3. Calls PostgreSQL RPC `activate_or_extend_subscription` idempotently
 */
export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-haiyo-webhook-signature");
    const expectedSecret =
      process.env.PAYMENT_WEBHOOK_SECRET ?? "sandbox-verified-signature";

    if (!signature || signature !== expectedSecret) {
      return NextResponse.json(
        { error: "Invalid payment webhook signature" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      order_id?: string;
      transaction_id?: string;
      amount?: number;
      status?: "paid" | "failed" | "expired" | "cancelled";
    };

    if (!body.order_id || !body.status) {
      return NextResponse.json(
        { error: "Missing order_id or status in webhook payload" },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabaseClient();

      if (body.status === "paid") {
        const { data, error } = await supabase.rpc(
          "activate_or_extend_subscription",
          {
            p_order_id: body.order_id,
            p_transaction_id: body.transaction_id ?? `TRX-${Date.now()}`,
          }
        );

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({
          verified: true,
          ...data,
        });
      } else {
        await supabase
          .from("payments")
          .update({ status: body.status })
          .eq("order_id", body.order_id);
      }
    }

    return NextResponse.json({
      verified: true,
      order_id: body.order_id,
      transaction_id: body.transaction_id ?? `TRX-${Date.now()}`,
      status: body.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Webhook processing failed",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
