"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  QrCode,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  AppShell,
  Button,
  PremiumBadge,
  Radio,
  useToast,
} from "@/components/ui";
import {
  fetchPaymentConfigFromServer,
  loadAppState,
  LocalAppState,
  MASTER_SUBSCRIPTION_PLANS,
  saveAppState,
  upsertPaymentOrderInLedger,
} from "@/lib/store/app-state";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils";
import { SubscriptionPlanCode } from "@/types/database";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const planParam =
    (searchParams.get("plan") as SubscriptionPlanCode) ?? "PREMIUM_1M";
  const selectedPlan =
    MASTER_SUBSCRIPTION_PLANS.find((p) => p.code === planParam) ??
    MASTER_SUBSCRIPTION_PLANS[1];

  const [appState, setAppState] = useState<LocalAppState | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("qris");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  useEffect(() => {
    setAppState(loadAppState());
    // Fetch live payment config from server (bypasses localStorage dummy defaults)
    void fetchPaymentConfigFromServer().then(() => {
      setAppState(loadAppState());
    });
  }, []);

  if (!appState) return null;

  const cfg = appState.paymentConfig;
  const paymentMethods = [
    {
      id: "qris",
      label: `QRIS (${cfg.qrisMerchantName})`,
      desc: "Scan kode QRIS via GoPay, OVO, DANA, ShopeePay, atau Mobile Banking",
      icon: QrCode,
    },
    {
      id: "gopay",
      label: `Transfer E-Wallet (${cfg.ewalletProvider})`,
      desc: `${cfg.ewalletNumber} a.n. ${cfg.ewalletAccountName}`,
      icon: Wallet,
    },
    {
      id: "bca_va",
      label: `Transfer Bank (${cfg.bankName})`,
      desc: `No. Rek ${cfg.bankAccountNumber} a.n. ${cfg.bankAccountName}`,
      icon: Building2,
    },
    {
      id: "card",
      label: "Kartu Debit / Kredit (Visa / Mastercard)",
      desc: "Pembayaran aman terenkripsi",
      icon: CreditCard,
    },
  ];

  /**
   * Payment Activation Rule (PRD Section 26 & UI/UX Section 54):
   * Checkout ONLY creates a `pending` order and redirects to Payment Pending screen.
   * Premium is NEVER activated directly by Checkout; it awaits Admin verification.
   */
  const handleCreateOrder = async () => {
    setIsCreatingOrder(true);
    try {
      const fresh = loadAppState();
      const userId = fresh.currentUser?.id ?? "user-me";
      const userName = fresh.currentUser?.profile.name || "Pengguna HAIYO";
      const userEmail = fresh.currentUser?.email || "";
      const subId = `sub-${Date.now()}`;
      const payId = `pay-${Date.now()}`;
      const orderId = `HAIYO-${Date.now()}`;
      const nowIso = new Date().toISOString();

      const newSub = {
        id: subId,
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        plan_id: selectedPlan.id,
        plan_code: selectedPlan.code,
        plan_name: selectedPlan.name,
        duration_days: selectedPlan.duration_days,
        status: "pending" as const,
        started_at: null,
        expires_at: null,
        created_at: nowIso,
        updated_at: nowIso,
      };

      const newPayment = {
        id: payId,
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        subscription_id: subId,
        order_id: orderId,
        transaction_id: null,
        gateway: "direct",
        payment_method: paymentMethod,
        amount: selectedPlan.price,
        status: "pending" as const,
        paid_at: null,
        plan_id: selectedPlan.id,
        plan_code: selectedPlan.code,
        plan_name: selectedPlan.name,
        duration_days: selectedPlan.duration_days,
        proof_url: null,
        user_confirmed_at: null,
        created_at: nowIso,
        updated_at: nowIso,
      };

      const updated: LocalAppState = {
        ...fresh,
        subscriptions: [newSub, ...fresh.subscriptions],
        payments: [newPayment, ...fresh.payments],
      };

      saveAppState(updated);

      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          const effectiveUserId = user?.id ?? userId;
          const effectiveEmail = user?.email ?? userEmail;

          await upsertPaymentOrderInLedger({
            order_id: orderId,
            payment_id: payId,
            subscription_id: subId,
            user_id: effectiveUserId,
            user_name: userName,
            user_email: effectiveEmail,
            plan_id: selectedPlan.id,
            plan_code: selectedPlan.code,
            plan_name: selectedPlan.name,
            duration_days: selectedPlan.duration_days,
            amount: selectedPlan.price,
            gateway: "direct",
            payment_method: paymentMethod,
            status: "pending",
            proof_url: null,
            user_confirmed_at: null,
            transaction_id: null,
            started_at: null,
            expires_at: null,
            paid_at: null,
            created_at: nowIso,
            updated_at: nowIso,
          });

          if (user) {
            const { data: dbPlan } = await supabase
              .from("subscription_plans")
              .select("id")
              .eq("code", selectedPlan.code)
              .maybeSingle();

            if (dbPlan?.id) {
              const { data: createdSub } = await supabase
                .from("subscriptions")
                .insert({
                  user_id: user.id,
                  plan_id: dbPlan.id,
                  status: "pending",
                })
                .select("id")
                .maybeSingle();

              if (createdSub?.id) {
                await supabase.from("payments").insert({
                  user_id: user.id,
                  subscription_id: createdSub.id,
                  order_id: orderId,
                  gateway: "direct",
                  payment_method: paymentMethod,
                  amount: selectedPlan.price,
                  status: "pending",
                });
              }
            }
          }
        } catch {
          // Non-blocking sync
        }
      }

      toast({
        title: "Pesanan dibuat",
        description: "Selesaikan pembayaran dan upload bukti transfer untuk mengaktifkan Premium.",
        variant: "info",
      });
      router.push(`/payment/status?order_id=${encodeURIComponent(orderId)}`);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <AppShell
      headerProps={{
        title: "Checkout",
        showBrand: false,
      }}
    >
      <div className="max-w-xl mx-auto space-y-6 pb-10">
        <Link
          href="/premium"
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#6F7078] hover:text-[#1d1d1d]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Pilihan Paket</span>
        </Link>

        {/* Order Summary Card (UI/UX Section 53) */}
        <section className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.06)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#6F7078]">
                Paket Dipilih
              </p>
              <h1 className="text-[20px] font-bold text-[#1d1d1d] mt-0.5">
                {selectedPlan.name} ({selectedPlan.duration_days} Hari)
              </h1>
            </div>
            <PremiumBadge />
          </div>

          <div className="pt-3 border-t border-[#E9E9EE] flex items-center justify-between">
            <span className="text-[15px] font-medium text-[#6F7078]">
              Total Pembayaran
            </span>
            <span className="text-[24px] font-extrabold text-[#267a50]">
              {formatRupiah(selectedPlan.price)}
            </span>
          </div>
        </section>

        {/* Payment Method Selection */}
        <section className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[18px] font-bold text-[#1d1d1d]">
              Metode Pembayaran
            </h2>
            {appState.currentUser?.profile.is_admin && (
              <Link
                href="/admin?tab=payments"
                className="text-[12px] font-semibold text-[#267a50] hover:underline"
              >
                Atur Rekening / E-Wallet di Admin
              </Link>
            )}
          </div>

          <div className="space-y-2.5">
            {paymentMethods.map((m) => (
              <Radio
                key={m.id}
                name="payment_method"
                checked={paymentMethod === m.id}
                onChange={() => setPaymentMethod(m.id)}
                label={m.label}
                description={m.desc}
              />
            ))}
          </div>
        </section>

        {/* Security Note */}
        <div className="p-4 rounded-[16px] bg-[#f9f9fa] border border-[#E9E9EE] flex items-center gap-3 text-[13px] text-[#6F7078]">
          <ShieldCheck className="w-5 h-5 text-[#22C55E] shrink-0" />
          <span>
            Pembayaran ditransfer langsung ke Rekening / E-Wallet / QRIS resmi
            yang terdaftar dan divalidasi oleh sistem HAIYO.
          </span>
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isCreatingOrder}
          onClick={handleCreateOrder}
        >
          Bayar Sekarang · {formatRupiah(selectedPlan.price)}
        </Button>
      </div>
    </AppShell>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#f9f9fa]" />}>
      <CheckoutContent />
    </Suspense>
  );
}
