"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Crown, Star, X, Zap } from "lucide-react";
import {
  AppShell,
  Badge,
  Button,
  PremiumBadge,
  useToast,
} from "@/components/ui";
import {
  getActiveSubscription,
  isCurrentUserPremium,
  loadAppState,
  LocalAppState,
  MASTER_SUBSCRIPTION_PLANS,
  saveAppState,
} from "@/lib/store/app-state";
import { formatRupiah } from "@/lib/utils";
import { SubscriptionPlanCode } from "@/types/database";

const COMPARISON_ROWS = [
  { feature: "Discover", free: true, premium: true },
  { feature: "Like & Pass", free: true, premium: true },
  { feature: "Match & Realtime Chat", free: true, premium: true },
  { feature: "Kuota Swipe Harian", free: "100 / hari", premium: "Unlimited" },
  { feature: "Lihat Siapa yang Menyukaimu (Who Likes You)", free: false, premium: true },
  { feature: "Undo / Kembali ke Profil Sebelumnya", free: false, premium: true },
  { feature: "Advanced Filter & Radius Luas", free: false, premium: true },
  { feature: "Bebas Iklan (No Ads)", free: false, premium: true },
];

/**
 * Premium Page (/premium) per UI/UX Sections 48–52 & 87–88:
 * - Header: "HAIYO PREMIUM"
 * - Headline: "Kenalan tanpa batas."
 * - 3 Pricing Cards: 7 Hari (Rp12.000), 1 Bulan (Rp29.000 PALING POPULER), 3 Bulan (Rp69.000 HEMAT)
 * - Manual Renewal notice & Cumulative Expiry support
 */
export default function PremiumPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [appState, setAppState] = useState<LocalAppState | null>(null);
  const [selectedCode, setSelectedCode] =
    useState<SubscriptionPlanCode>("PREMIUM_1M");

  useEffect(() => {
    setAppState(loadAppState());
  }, []);

  if (!appState) return null;

  const isPremium = isCurrentUserPremium(appState);
  const activeSub = getActiveSubscription(appState);

  // Internal test helper (Phase 8 Roadmap Rule #9: Test Premium independently of payment gateway)
  const handleToggleInternalTestPremium = () => {
    const fresh = loadAppState();
    if (isCurrentUserPremium(fresh)) {
      const updated: LocalAppState = {
        ...fresh,
        subscriptions: fresh.subscriptions.map((s) => ({
          ...s,
          status: "expired",
        })),
      };
      saveAppState(updated);
      setAppState(updated);
      toast({
        title: "Mode Test: Status kembali ke FREE.",
        variant: "info",
      });
    } else {
      const expires = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      const updated: LocalAppState = {
        ...fresh,
        subscriptions: [
          {
            id: `sub-test-${Date.now()}`,
            user_id: fresh.currentUser?.id ?? "user-me",
            plan_id: "plan-1m",
            status: "active",
            started_at: new Date().toISOString(),
            expires_at: expires,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          ...fresh.subscriptions,
        ],
      };
      saveAppState(updated);
      setAppState(updated);
      toast({
        title: "Mode Test: HAIYO Premium Aktif",
        description: "Sekarang kamu bisa menguji Who Likes You, Undo, dan Unlimited Swipe.",
        variant: "success",
      });
    }
  };

  return (
    <AppShell
      headerProps={{
        title: "HAIYO Premium",
        showBrand: false,
      }}
    >
      <div className="space-y-8 pb-12">
        {/* Hero Banner (UI/UX Section 48) */}
        <div className="rounded-[24px] bg-gradient-to-br from-[#1d1d1d] via-[#267a50] to-[#1d1d1d] p-7 sm:p-9 text-white shadow-[0_8px_24px_rgba(29, 29, 29,0.18)] space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold tracking-wider uppercase">
            <Crown className="w-3.5 h-3.5 text-[#267a50]" />
            <span>HAIYO PREMIUM</span>
          </div>

          <h1 className="text-[28px] sm:text-[34px] font-extrabold leading-tight tracking-tight">
            Kenalan tanpa batas.
          </h1>
          <p className="text-[15px] text-white/85 max-w-lg leading-relaxed">
            Buka lebih banyak kesempatan untuk menemukan orang yang cocok dengan
            Unlimited Swipe, lihat siapa yang menyukaimu, dan fitur Undo.
          </p>

          {/* Active Subscription Status (UI/UX Section 51) */}
          {isPremium && activeSub?.expires_at && (
            <div className="mt-4 p-4 rounded-[16px] bg-white/10 backdrop-blur-md border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[15px] font-bold flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-[#267a50]" />
                  <span>Premium Aktif</span>
                </p>
                <p className="text-[13px] text-white/85">
                  Berakhir pada{" "}
                  {new Date(activeSub.expires_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <Badge variant="default" className="bg-white text-[#1d1d1d]">
                {activeSub.plan?.name ?? "Premium"}
              </Badge>
            </div>
          )}
        </div>

        {/* 3 Pricing Cards (UI/UX Sections 49 & 50) */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-[20px] font-bold text-[#1d1d1d]">
                Pilih Paket Premium
              </h2>
              <p className="text-[13px] text-[#6F7078]">
                Premium tidak diperpanjang otomatis (Manual Renewal). Pembelian
                baru saat aktif akan mengakumulasi masa aktifmu.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            {MASTER_SUBSCRIPTION_PLANS.map((plan) => {
              const isSelected = selectedCode === plan.code;
              const isPopular = plan.code === "PREMIUM_1M";
              const isBestValue = plan.code === "PREMIUM_3M";

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedCode(plan.code)}
                  className={`relative p-6 rounded-[20px] transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#eaf5ef]/65 border-2 border-[#267a50] shadow-[0_8px_24px_rgba(38, 122, 80,0.14)]"
                      : "bg-white border border-[#E9E9EE] hover:border-[#267a50]/50"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-5 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#267a50] text-white text-[11px] font-bold shadow-sm">
                      <Star className="w-3 h-3 fill-white" />
                      <span>PALING POPULER</span>
                    </span>
                  )}
                  {isBestValue && (
                    <span className="absolute -top-3 left-5 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#1d1d1d] text-white text-[11px] font-bold shadow-sm">
                      <Zap className="w-3 h-3 text-[#267a50] fill-[#267a50]" />
                      <span>HEMAT</span>
                    </span>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold uppercase tracking-wider text-[#6F7078]">
                        {plan.name}
                      </span>
                      <PremiumBadge />
                    </div>

                    <p className="text-[30px] font-extrabold text-[#1d1d1d]">
                      {formatRupiah(plan.price)}
                    </p>

                    <p className="text-[13px] text-[#6F7078]">
                      {plan.code === "PREMIUM_7D" &&
                        "Cocok untuk mencoba fitur Premium terlebih dahulu."}
                      {plan.code === "PREMIUM_1M" &&
                        "± Rp967 / hari · Paket favorit pengguna reguler."}
                      {plan.code === "PREMIUM_3M" &&
                        "± Rp767 / hari · Best value untuk penggunaan lebih lama."}
                    </p>
                  </div>

                  <div className="pt-6">
                    <Button
                      variant={isSelected ? "primary" : "secondary"}
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/checkout?plan=${plan.code}`);
                      }}
                    >
                      {plan.code === "PREMIUM_7D"
                        ? "Coba Premium"
                        : "Pilih Paket"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Free vs Premium Comparison Table (UI/UX Section 88) */}
        <section className="rounded-[20px] bg-white border border-[#E9E9EE] overflow-hidden">
          <div className="p-5 border-b border-[#E9E9EE]">
            <h2 className="text-[18px] font-bold text-[#1d1d1d]">
              Perbandingan Fitur Free vs Premium
            </h2>
          </div>

          <div className="divide-y divide-[#E9E9EE] text-[14px]">
            <div className="grid grid-cols-12 px-5 py-3 bg-[#f9f9fa] font-bold text-[#6F7078]">
              <div className="col-span-6">Fitur</div>
              <div className="col-span-3 text-center">Free</div>
              <div className="col-span-3 text-center text-[#267a50]">
                Premium
              </div>
            </div>

            {COMPARISON_ROWS.map((row) => (
              <div
                key={row.feature}
                className="grid grid-cols-12 px-5 py-3.5 items-center"
              >
                <div className="col-span-6 font-medium text-[#1d1d1d]">
                  {row.feature}
                </div>
                <div className="col-span-3 flex justify-center text-[#6F7078]">
                  {typeof row.free === "boolean" ? (
                    row.free ? (
                      <Check className="w-4 h-4 text-[#22C55E]" />
                    ) : (
                      <X className="w-4 h-4 text-[#A0A0A8]" />
                    )
                  ) : (
                    <span className="text-[12px] font-semibold">{row.free}</span>
                  )}
                </div>
                <div className="col-span-3 flex justify-center font-bold text-[#267a50]">
                  {typeof row.premium === "boolean" ? (
                    <Check className="w-4 h-4 text-[#267a50] stroke-[3]" />
                  ) : (
                    <span className="text-[12px]">{row.premium}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Phase 8 Independent Test Helper */}
        <div className="p-4 rounded-[16px] bg-white border border-dashed border-[#67bf9a]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[13px] text-[#6F7078]">
            <span className="font-bold text-[#67bf9a]">
              Mode Pengujian Phase 8:
            </span>{" "}
            Uji fitur Premium secara langsung atau lanjut ke alur Checkout &
            Webhook Payment Gateway (Phase 9).
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleToggleInternalTestPremium}
            >
              {isPremium ? "Matikan Test Premium" : "Aktifkan Test Premium"}
            </Button>
            <Link href="/profile/payment-history">
              <Button variant="ghost" size="sm">
                Riwayat Bayar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
