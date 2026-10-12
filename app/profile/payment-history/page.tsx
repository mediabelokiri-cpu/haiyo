"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard } from "lucide-react";
import { AppShell, Badge, EmptyState } from "@/components/ui";
import {
  loadAppState,
  LocalAppState,
  MASTER_SUBSCRIPTION_PLANS,
} from "@/lib/store/app-state";
import { formatRupiah } from "@/lib/utils";
import { PaymentStatus } from "@/types/database";

const STATUS_BADGE_MAP: Record<
  PaymentStatus,
  { label: string; variant: "success" | "warning" | "danger" | "default" }
> = {
  paid: { label: "BERHASIL", variant: "success" },
  pending: { label: "PENDING", variant: "warning" },
  failed: { label: "GAGAL", variant: "danger" },
  expired: { label: "EXPIRED", variant: "default" },
  cancelled: { label: "DIBATALKAN", variant: "default" },
};

/**
 * Payment History Page (/profile/payment-history) per PRD Section 32 & UI/UX Section 58:
 * - Heading: "Riwayat Pembayaran"
 * - List: Date, Package, Amount, Method, Status (Paid, Pending, Failed, Expired, Cancelled)
 */
export default function PaymentHistoryPage() {
  const router = useRouter();
  const [appState, setAppState] = useState<LocalAppState | null>(null);

  useEffect(() => {
    setAppState(loadAppState());
  }, []);

  if (!appState) return null;

  return (
    <AppShell
      headerProps={{
        title: "Riwayat Pembayaran",
        showBrand: false,
      }}
    >
      <div className="space-y-6 pb-10">
        <div className="flex items-center justify-between">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#6F7078] hover:text-[#1d1d1d]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Profil</span>
          </Link>
        </div>

        <div>
          <h1 className="text-[24px] font-bold text-[#1d1d1d]">
            Riwayat Pembayaran
          </h1>
          <p className="text-[14px] text-[#6F7078]">
            Seluruh histori pembelian paket HAIYO Premium kamu.
          </p>
        </div>

        {appState.payments.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="w-8 h-8" />}
            title="Belum ada riwayat pembayaran"
            description="Transaksi pembelian paket HAIYO Premium kamu akan tercatat secara lengkap di sini."
            actionLabel="Lihat Paket Premium"
            onAction={() => router.push("/premium")}
          />
        ) : (
          <div className="space-y-3">
            {appState.payments.map((pay) => {
              const sub = appState.subscriptions.find(
                (s) => s.id === pay.subscription_id
              );
              const plan = MASTER_SUBSCRIPTION_PLANS.find(
                (p) => p.id === sub?.plan_id
              );
              const statusMeta = STATUS_BADGE_MAP[pay.status];

              return (
                <Link
                  key={pay.id}
                  href={`/payment/status?order_id=${encodeURIComponent(
                    pay.order_id
                  )}`}
                  className="block p-5 rounded-[20px] bg-white border border-[#E9E9EE] hover:border-[#267a50]/50 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[12px] text-[#6F7078]">
                        {new Date(
                          pay.paid_at ?? pay.created_at
                        ).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        · <span className="font-mono">{pay.order_id}</span>
                      </p>
                      <h3 className="text-[16px] font-bold text-[#1d1d1d]">
                        {plan?.name ?? "HAIYO Premium"}
                      </h3>
                      <p className="text-[13px] font-semibold uppercase text-[#6F7078]">
                        {pay.payment_method}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[17px] font-extrabold text-[#1d1d1d]">
                        {formatRupiah(pay.amount)}
                      </span>
                      <Badge variant={statusMeta.variant}>
                        {statusMeta.label}
                      </Badge>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
