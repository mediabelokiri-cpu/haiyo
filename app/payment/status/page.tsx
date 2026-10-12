"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Crown,
  QrCode,
  Wallet,
  Zap,
} from "lucide-react";
import { AppShell, Badge, Button, useToast } from "@/components/ui";
import {
  loadAppState,
  LocalAppState,
  MASTER_SUBSCRIPTION_PLANS,
  saveAppState,
} from "@/lib/store/app-state";
import { formatRupiah } from "@/lib/utils";

/**
 * Payment Status Page (/payment/status) per UI/UX Sections 55, 56 & 57:
 * - Pending: "Menunggu Pembayaran" ("Selesaikan pembayaran untuk mengaktifkan Premium.")
 * - Success: "Pembayaran Berhasil" ("Premium kamu sudah aktif.")
 * - Failed: "Pembayaran Belum Berhasil" ("Pembayaran belum berhasil diproses.")
 * Includes Sandbox Simulator triggers that call the Server Webhook API `/api/webhooks/payment`
 * to validate idempotency and cumulative subscription renewal (PRD Section 31).
 */
function PaymentStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const orderId = searchParams.get("order_id") ?? "";

  const [appState, setAppState] = useState<LocalAppState | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    setAppState(loadAppState());
  }, []);

  if (!appState) return null;

  const payment =
    appState.payments.find((p) => p.order_id === orderId) ??
    appState.payments[0] ??
    null;

  if (!payment) {
    return (
      <AppShell headerProps={{ title: "Status Pembayaran", showBrand: false }}>
        <div className="p-8 rounded-[20px] bg-white border border-[#E9E9EE] text-center space-y-4">
          <h1 className="text-[20px] font-bold">Transaksi tidak ditemukan</h1>
          <Link href="/premium">
            <Button variant="primary">Kembali ke Premium</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const sub = appState.subscriptions.find(
    (s) => s.id === payment.subscription_id
  );
  const plan = MASTER_SUBSCRIPTION_PLANS.find((p) => p.id === sub?.plan_id);

  /**
   * Trigger Server-Side Payment Webhook (/api/webhooks/payment)
   * Enforces idempotency + cumulative renewal (PRD Sections 31, 34 & 35).
   */
  const handleTriggerWebhook = async (
    targetStatus: "paid" | "failed"
  ) => {
    setIsSimulating(true);
    try {
      const response = await fetch("/api/webhooks/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-haiyo-webhook-signature": "sandbox-verified-signature",
        },
        body: JSON.stringify({
          order_id: payment.order_id,
          transaction_id: `TRX-${Date.now()}`,
          amount: payment.amount,
          status: targetStatus,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        toast({
          title: "Webhook ditolak server",
          description: result.error ?? "Signature tidak valid",
          variant: "error",
        });
        return;
      }

      const fresh = loadAppState();

      // Idempotency check in client sync: if already paid, do not double-add duration!
      const currentPayment = fresh.payments.find(
        (p) => p.order_id === payment.order_id
      );
      if (currentPayment?.status === "paid" && targetStatus === "paid") {
        toast({
          title: "Webhook Idempotent Terverifikasi",
          description:
            "Transaksi sudah berstatus PAID sebelumnya. Masa aktif tidak digandakan.",
          variant: "info",
        });
        return;
      }

      if (targetStatus === "failed") {
        const updated: LocalAppState = {
          ...fresh,
          payments: fresh.payments.map((p) =>
            p.order_id === payment.order_id ? { ...p, status: "failed" } : p
          ),
          subscriptions: fresh.subscriptions.map((s) =>
            s.id === payment.subscription_id ? { ...s, status: "cancelled" } : s
          ),
          notifications: [
            {
              id: `notif-pay-fail-${Date.now()}`,
              user_id: fresh.currentUser?.id ?? "user-me",
              type: "payment_failed",
              title: "Pembayaran Belum Berhasil",
              message: `Pembayaran untuk ${plan?.name ?? "Premium"} belum berhasil diproses.`,
              reference_id: payment.id,
              is_read: false,
              created_at: new Date().toISOString(),
            },
            ...fresh.notifications,
          ],
        };
        saveAppState(updated);
        setAppState(updated);
        toast({
          title: "Pembayaran gagal diproses.",
          variant: "error",
        });
        return;
      }

      // Cumulative Renewal Calculation (PRD Section 31):
      // If user already has an active subscription with expires_at > NOW(), add duration_days to current max expiry
      const nowMs = Date.now();
      const activeExpiryMs = fresh.subscriptions
        .filter(
          (s) =>
            s.status === "active" &&
            s.expires_at &&
            new Date(s.expires_at).getTime() > nowMs
        )
        .reduce(
          (max, s) => Math.max(max, new Date(s.expires_at!).getTime()),
          nowMs
        );

      const durationMs = (plan?.duration_days ?? 30) * 24 * 60 * 60 * 1000;
      const newExpiryIso = new Date(activeExpiryMs + durationMs).toISOString();
      const nowIso = new Date().toISOString();

      const updated: LocalAppState = {
        ...fresh,
        payments: fresh.payments.map((p) =>
          p.order_id === payment.order_id
            ? {
                ...p,
                status: "paid",
                transaction_id: result.transaction_id ?? `TRX-${Date.now()}`,
                paid_at: nowIso,
              }
            : p
        ),
        subscriptions: fresh.subscriptions.map((s) =>
          s.id === payment.subscription_id
            ? {
                ...s,
                status: "active",
                started_at: nowIso,
                expires_at: newExpiryIso,
              }
            : s
        ),
        notifications: [
          {
            id: `notif-sub-${Date.now()}`,
            user_id: fresh.currentUser?.id ?? "user-me",
            type: "subscription_active",
            title: "HAIYO Premium Aktif",
            message: `${plan?.name ?? "Premium"} aktif hingga ${new Date(
              newExpiryIso
            ).toLocaleDateString("id-ID")}.`,
            reference_id: payment.subscription_id,
            is_read: false,
            created_at: nowIso,
          },
          {
            id: `notif-pay-${Date.now()}`,
            user_id: fresh.currentUser?.id ?? "user-me",
            type: "payment_success",
            title: "Pembayaran Berhasil",
            message: `Pembayaran ${formatRupiah(payment.amount)} telah terkonfirmasi.`,
            reference_id: payment.id,
            is_read: false,
            created_at: nowIso,
          },
          ...fresh.notifications,
        ],
      };

      saveAppState(updated);
      setAppState(updated);
      toast({
        title: "Pembayaran berhasil.",
        description: "HAIYO Premium kamu sekarang sudah aktif!",
        variant: "success",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <AppShell
      headerProps={{
        title: "Status Pembayaran",
        showBrand: false,
      }}
    >
      <div className="max-w-lg mx-auto space-y-6 pb-10">
        {/* 1. PAYMENT PENDING SCREEN (UI/UX Section 55) */}
        {payment.status === "pending" && (
          <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <Badge variant="warning">MENUNGGU PEMBAYARAN</Badge>
              <h1 className="text-[24px] font-bold text-[#1d1d1d] pt-1">
                Menunggu Pembayaran
              </h1>
              <p className="text-[14px] text-[#6F7078]">
                Selesaikan pembayaran untuk mengaktifkan Premium.
              </p>
            </div>

            {/* Method-Specific Payment Instructions (QRIS / Bank Transfer / E-Wallet / Card) */}
            <div className="p-5 rounded-[20px] bg-[#f9f9fa] border border-[#E9E9EE] space-y-3">
              {payment.payment_method === "qris" && (
                <div className="space-y-2.5">
                  {appState.paymentConfig.qrisImageUrl ? (
                    <div className="w-52 h-52 mx-auto rounded-[16px] bg-white border border-[#E9E9EE] p-2.5 flex flex-col items-center justify-center shadow-sm">
                      <img
                        src={appState.paymentConfig.qrisImageUrl}
                        alt={appState.paymentConfig.qrisMerchantName}
                        className="w-full h-full object-contain rounded-[10px]"
                      />
                    </div>
                  ) : (
                    <div className="w-44 h-44 mx-auto rounded-[16px] bg-white border border-[#E9E9EE] flex flex-col items-center justify-center gap-1.5 text-[#1d1d1d] shadow-sm p-3">
                      <QrCode className="w-24 h-24 text-[#1d1d1d]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#267a50] text-center line-clamp-1">
                        {appState.paymentConfig.qrisMerchantName}
                      </span>
                      <span className="text-[9px] font-mono text-[#6F7078]">
                        NMID: {appState.paymentConfig.qrisNmid}
                      </span>
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <p className="text-[13px] font-bold text-[#1d1d1d]">
                      {appState.paymentConfig.qrisMerchantName}
                    </p>
                    <p className="text-[12px] text-[#6F7078]">
                      Scan kode QRIS di atas menggunakan GoPay, OVO, DANA,
                      ShopeePay, atau aplikasi Mobile Banking kamu.
                    </p>
                  </div>
                </div>
              )}

              {payment.payment_method === "bca_va" && (
                <div className="p-4 rounded-[16px] bg-white border border-[#E9E9EE] space-y-2 text-center">
                  <div className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#6F7078] uppercase">
                    <Building2 className="w-4 h-4 text-[#267a50]" />
                    <span>Transfer Bank {appState.paymentConfig.bankName}</span>
                  </div>
                  <p className="text-[20px] font-mono font-extrabold tracking-wider text-[#1d1d1d]">
                    {appState.paymentConfig.bankAccountNumber}
                  </p>
                  <p className="text-[13px] font-semibold text-[#6F7078]">
                    a.n. {appState.paymentConfig.bankAccountName}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        appState.paymentConfig.bankAccountNumber
                      );
                      toast({
                        title: "Nomor Rekening disalin",
                        description: `${appState.paymentConfig.bankName} ${appState.paymentConfig.bankAccountNumber} a.n. ${appState.paymentConfig.bankAccountName}`,
                        variant: "info",
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#eaf5ef] text-[#267a50] text-[12px] font-bold hover:bg-[#267a50] hover:text-white transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Nomor Rekening</span>
                  </button>
                </div>
              )}

              {payment.payment_method === "gopay" && (
                <div className="p-4 rounded-[16px] bg-white border border-[#E9E9EE] space-y-2 text-center">
                  <div className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#6F7078] uppercase">
                    <Wallet className="w-4 h-4 text-[#267a50]" />
                    <span>
                      Transfer E-Wallet ({appState.paymentConfig.ewalletProvider})
                    </span>
                  </div>
                  <p className="text-[20px] font-mono font-extrabold tracking-wider text-[#1d1d1d]">
                    {appState.paymentConfig.ewalletNumber}
                  </p>
                  <p className="text-[13px] font-semibold text-[#6F7078]">
                    a.n. {appState.paymentConfig.ewalletAccountName}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        appState.paymentConfig.ewalletNumber
                      );
                      toast({
                        title: "Nomor E-Wallet disalin",
                        description: `${appState.paymentConfig.ewalletProvider} ${appState.paymentConfig.ewalletNumber} a.n. ${appState.paymentConfig.ewalletAccountName}`,
                        variant: "info",
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#eaf5ef] text-[#267a50] text-[12px] font-bold hover:bg-[#267a50] hover:text-white transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Nomor E-Wallet</span>
                  </button>
                </div>
              )}

              {payment.payment_method === "card" && (
                <div className="p-4 rounded-[16px] bg-white border border-[#E9E9EE] space-y-2 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#eaf5ef] text-[#267a50] flex items-center justify-center mx-auto">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <p className="text-[14px] font-bold text-[#1d1d1d]">
                    Kartu Debit / Kredit (Visa / Mastercard)
                  </p>
                  <p className="text-[12px] text-[#6F7078]">
                    Otorisasi pembayaran kartu terenkripsi siap dikonfirmasi.
                  </p>
                </div>
              )}

              <div className="text-left text-[13px] space-y-2 pt-2 border-t border-[#E9E9EE]">
                <div className="flex justify-between">
                  <span className="text-[#6F7078]">Order ID</span>
                  <span className="font-mono font-semibold text-[#1d1d1d]">
                    {payment.order_id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6F7078]">Paket</span>
                  <span className="font-semibold text-[#1d1d1d]">
                    {plan?.name ?? "HAIYO Premium"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6F7078]">Metode</span>
                  <span className="font-semibold uppercase text-[#1d1d1d]">
                    {payment.payment_method === "bca_va"
                      ? `Bank ${appState.paymentConfig.bankName}`
                      : payment.payment_method === "gopay"
                      ? appState.paymentConfig.ewalletProvider
                      : payment.payment_method}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6F7078]">Total</span>
                  <span className="font-extrabold text-[#267a50]">
                    {formatRupiah(payment.amount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSimulating}
                onClick={() => {
                  if (appState.paymentConfig.requireAdminApproval) {
                    toast({
                      title: "Konfirmasi pembayaran terkirim!",
                      description:
                        "Admin akan memverifikasi mutasi rekening/E-Wallet dan mengaktifkan Premium kamu melalui Portal Admin (/admin).",
                      variant: "info",
                    });
                  } else {
                    handleTriggerWebhook("paid");
                  }
                }}
              >
                Saya Sudah Bayar · Konfirmasi Pembayaran
              </Button>

              {appState.paymentConfig.whatsappConfirmationNumber && (
                <a
                  href={`https://wa.me/${appState.paymentConfig.whatsappConfirmationNumber.replace(
                    /\D/g,
                    ""
                  )}?text=${encodeURIComponent(
                    `Halo Admin HAIYO, saya sudah melakukan pembayaran untuk Order ID ${
                      payment.order_id
                    } (${plan?.name ?? "HAIYO Premium"} - ${formatRupiah(
                      payment.amount
                    )}). Mohon diverifikasi ya, terima kasih!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="secondary" fullWidth>
                    Kirim Bukti Transfer via WhatsApp Admin
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}

        {/* 2. PAYMENT SUCCESS SCREEN (UI/UX Section 56) */}
        {payment.status === "paid" && (
          <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#22C55E]/15 text-[#22C55E] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <Badge variant="success">BERHASIL</Badge>
              <h1 className="text-[26px] font-bold text-[#1d1d1d] pt-1">
                Pembayaran Berhasil
              </h1>
              <p className="text-[14px] text-[#6F7078]">
                Premium kamu sudah aktif.
              </p>
            </div>

            <div className="p-5 rounded-[20px] bg-[#f9f9fa] border border-[#E9E9EE] text-left text-[13px] space-y-2.5">
              <div className="flex justify-between">
                <span className="text-[#6F7078]">Paket</span>
                <span className="font-bold text-[#1d1d1d]">
                  {plan?.name ?? "HAIYO Premium"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6F7078]">Tanggal Mulai</span>
                <span className="font-semibold text-[#1d1d1d]">
                  {sub?.started_at
                    ? new Date(sub.started_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6F7078]">Berlaku Hingga</span>
                <span className="font-bold text-[#267a50]">
                  {sub?.expires_at
                    ? new Date(sub.expires_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "-"}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => router.push("/discover")}
                leftIcon={<Crown className="w-5 h-5" />}
              >
                Mulai Kenalan
              </Button>

              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => handleTriggerWebhook("paid")}
              >
                Uji Kirim Webhook Duplikat (Tes Idempotency)
              </Button>
            </div>
          </div>
        )}

        {/* 3. PAYMENT FAILED SCREEN (UI/UX Section 57) */}
        {(payment.status === "failed" ||
          payment.status === "expired" ||
          payment.status === "cancelled") && (
          <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center mx-auto">
              <AlertCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <Badge variant="danger">GAGAL</Badge>
              <h1 className="text-[24px] font-bold text-[#1d1d1d] pt-1">
                Pembayaran Belum Berhasil
              </h1>
              <p className="text-[14px] text-[#6F7078]">
                Pembayaran belum berhasil diproses.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                variant="primary"
                fullWidth
                onClick={() =>
                  router.push(`/checkout?plan=${plan?.code ?? "PREMIUM_1M"}`)
                }
              >
                Coba Lagi
              </Button>
              <Link href="/premium" className="block">
                <Button variant="secondary" fullWidth>
                  Kembali ke Premium
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#f9f9fa]" />}>
      <PaymentStatusContent />
    </Suspense>
  );
}
